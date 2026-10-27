/* Logged-in pages. Each page returns { title, html, mount(root) }. */
(function (App) {
  const { $, $$, esc, money, fmtDate, icon, toast, modal, sparkline, lineChart, badge, dataTable, t } = App.ui;
  const D = App.data;

  const FEES = { "Bank transfer": 0, Card: 0.015, Wallet: 0.005 };
  const METHOD_INFO = {
    "Bank transfer": "Free · 1 business day",
    Card: "1.5% fee · Instant",
    Wallet: "0.5% fee · Instant",
  };

  function pageHead(title, sub, extra = "") {
    return `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div>${extra}</div>`;
  }

  // =============== ACCOUNTS ===============
  function accountsPage() {
    const user = App.store.get("user", { name: "trader" });
    const first = esc(user.name.split(" ")[0]);
    const active = D.accounts.filter((a) => a.status === "Active").length;
    const pending = D.accounts.filter((a) => a.status === "Pending").length;
    const hist = D.balanceHistory;
    const change = ((hist[hist.length - 1] - hist[0]) / hist[0]) * 100;
    const monthDeposits = D.transactions.filter((x) => x.status === "Completed").reduce((s, x) => s + x.amount, 0);

    return {
      title: t("accounts"),
      html: `
        ${pageHead(`Good day, <span class="cap">${first}</span>`, "Balances and onboarding status across your accounts")}
        <section class="stats" aria-label="Summary">
          <article class="stat"><p class="label">Total balance (USD)</p><p class="value">${money(D.totalUSD)}</p>
            <p class="delta ${change >= 0 ? "up" : "down"}">${icon("arrowup")} ${Math.abs(change).toFixed(1)}% in 30 days</p>${sparkline(hist)}</article>
          <article class="stat"><p class="label">Active accounts</p><p class="value">${active}</p><p class="delta">of ${D.accounts.length} total</p></article>
          <article class="stat"><p class="label">Pending verification</p><p class="value">${pending}</p><p class="delta">Awaiting your broker</p></article>
          <article class="stat"><p class="label">Completed deposits</p><p class="value">${money(monthDeposits)}</p><p class="delta">All time</p></article>
        </section>
        <section class="card">
          <div class="card-head"><h2>Balance trend</h2>
            <div class="seg" role="group" aria-label="Range"><button data-r="7">7D</button><button data-r="30" class="on">30D</button></div></div>
          <div class="chart" id="chart"></div>
        </section>
        <section class="card"><div class="card-head"><h2>Your trading accounts</h2></div><div id="accTable"></div></section>`,
      mount(root) {
        const chart = $("#chart", root);
        function draw(n) { lineChart(chart, D.labels.slice(-n), D.balanceHistory.slice(-n)); }
        draw(30);
        $$(".seg button", root).forEach((b) => b.addEventListener("click", () => {
          $$(".seg button", root).forEach((x) => x.classList.toggle("on", x === b));
          draw(+b.dataset.r);
        }));
        dataTable($("#accTable", root), {
          placeholder: "Search accounts", csvName: "accounts", pageSize: 5, sortKey: "balanceUSD",
          filterKey: "status", filterValues: ["Active", "Pending", "Suspended"],
          rows: () => D.accounts.map((a) => Object.assign({ balanceUSD: a.balance * D.rates[a.currency] }, a)),
          columns: [
            { key: "id", label: "Account", sortable: true, render: (r) => `<strong>${esc(r.id)}</strong>` },
            { key: "type", label: "Type", sortable: true },
            { key: "currency", label: "Currency" },
            { key: "leverage", label: "Leverage" },
            { key: "balanceUSD", label: "Balance", sortable: true, align: "right", value: (r) => r.balance, render: (r) => money(r.balance, r.currency) },
            { key: "status", label: "Status", sortable: true, render: (r) => badge(r.status) },
          ],
          onRow: (a) => modal({
            title: "Account " + a.id,
            confirmText: a.status === "Active" ? "Fund this account" : "Close", cancelText: "Cancel",
            body: `<dl class="detail">
              <div><dt>Type</dt><dd>${esc(a.type)}</dd></div><div><dt>Currency</dt><dd>${esc(a.currency)}</dd></div>
              <div><dt>Balance</dt><dd>${money(a.balance, a.currency)}</dd></div><div><dt>Leverage</dt><dd>${esc(a.leverage)}</dd></div>
              <div><dt>Opened</dt><dd>${fmtDate(a.opened)}</dd></div><div><dt>Status</dt><dd>${badge(a.status)}</dd></div></dl>`,
            onConfirm: (close) => { close(); if (a.status === "Active") location.hash = "#/fund?acc=" + a.id; },
          }),
        });
      },
    };
  }

  // =============== FUND ===============
  function fundPage(query) {
    const activeAccs = D.accounts.filter((a) => a.status === "Active");
    return {
      title: t("fund"),
      html: `
        ${pageHead("Fund your account", "Add money to an active trading account")}
        <p class="notice">${icon("check")} Funding is managed by your broker. Bank transfers can take up to one business day.</p>
        <div class="two-col">
          <form class="card" id="fundForm" novalidate>
            <h2>New deposit</h2>
            <div class="field"><label for="acc">Account</label>
              <select id="acc">${activeAccs.map((a) => `<option value="${a.id}" ${query.acc === a.id ? "selected" : ""}>${a.id} · ${a.type} (${a.currency})</option>`).join("")}</select><span class="err"></span></div>
            <fieldset class="methods"><legend>Payment method</legend>
              ${Object.keys(FEES).map((m, i) => `<label class="method"><input type="radio" name="method" value="${m}" ${i === 0 ? "checked" : ""}><span><strong>${m}</strong><small>${METHOD_INFO[m]}</small></span></label>`).join("")}
            </fieldset>
            <div class="field"><label for="amount">Amount (USD)</label>
              <input id="amount" type="number" inputmode="decimal" min="10" max="50000" step="0.01" placeholder="100.00"><span class="err" id="amount-err" role="alert"></span></div>
            <div class="chips" aria-label="Quick amounts">${[100, 500, 1000, 5000].map((v) => `<button type="button" class="chip" data-amt="${v}">${money(v).replace(".00", "")}</button>`).join("")}</div>
            <dl class="summary"><div><dt>Amount</dt><dd id="sAmt">$0.00</dd></div><div><dt>Fee</dt><dd id="sFee">$0.00</dd></div><div class="total"><dt>Total charged</dt><dd id="sTot">$0.00</dd></div></dl>
            <label class="check"><input type="checkbox" id="agree"> I confirm this payment is from an account in my own name</label>
            <span class="err" id="agree-err" role="alert"></span>
            <button class="btn full" type="submit">Review deposit</button>
          </form>
          <section class="card"><div class="card-head"><h2>Deposit history</h2></div><div id="txTable"></div></section>
        </div>`,
      mount(root) {
        const amount = $("#amount", root), form = $("#fundForm", root);
        const method = () => $('input[name="method"]:checked', root).value;
        function summary() {
          const a = parseFloat(amount.value) || 0, fee = a * FEES[method()];
          $("#sAmt", root).textContent = money(a); $("#sFee", root).textContent = money(fee); $("#sTot", root).textContent = money(a + fee);
        }
        function validAmount() {
          const a = parseFloat(amount.value);
          const msg = !amount.value ? "Enter an amount." : isNaN(a) || a < 10 ? "Minimum deposit is $10." : a > 50000 ? "Maximum per deposit is $50,000." : "";
          amount.closest(".field").classList.toggle("invalid", !!msg); $("#amount-err", root).textContent = msg;
          return !msg;
        }
        amount.addEventListener("input", summary); amount.addEventListener("blur", validAmount);
        $$('input[name="method"]', root).forEach((r) => r.addEventListener("change", summary));
        $$(".chip", root).forEach((c) => c.addEventListener("click", () => { amount.value = c.dataset.amt; summary(); validAmount(); }));

        const table = dataTable($("#txTable", root), {
          placeholder: "Search deposits", csvName: "deposit-history", pageSize: 6, sortKey: "date",
          filterKey: "status", filterValues: ["Completed", "Pending", "Failed"],
          rows: () => D.transactions,
          columns: [
            { key: "date", label: "Date", sortable: true, render: (r) => fmtDate(r.date) },
            { key: "ref", label: "Ref" },
            { key: "account", label: "Account" },
            { key: "method", label: "Method" },
            { key: "amount", label: "Amount", sortable: true, align: "right", render: (r) => money(r.amount) },
            { key: "status", label: "Status", render: (r) => badge(r.status) },
          ],
        });

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const okAmt = validAmount(), okAgree = $("#agree", root).checked;
          $("#agree-err", root).textContent = okAgree ? "" : "Please confirm to continue.";
          if (!okAmt) { amount.focus(); return; }
          if (!okAgree) return;
          const a = parseFloat(amount.value), fee = +(a * FEES[method()]).toFixed(2), acc = $("#acc", root).value;
          modal({
            title: "Confirm deposit", confirmText: "Confirm and submit",
            body: `<dl class="detail one"><div><dt>Account</dt><dd>${esc(acc)}</dd></div><div><dt>Method</dt><dd>${esc(method())}</dd></div>
              <div><dt>Amount</dt><dd>${money(a)}</dd></div><div><dt>Fee</dt><dd>${money(fee)}</dd></div><div><dt>Total</dt><dd><strong>${money(a + fee)}</strong></dd></div></dl>`,
            onConfirm: (close) => {
              D.transactions.unshift({ ref: "DEP-" + Math.floor(1000 + Math.random() * 9000), date: new Date().toISOString().slice(0, 10),
                account: acc, method: method(), amount: a, fee, status: "Pending" });
              App.store.set("tx", D.transactions);
              close(); form.reset(); summary(); table.redraw();
              toast("Deposit submitted. It is now pending.");
            },
          });
        });
      },
    };
  }

  // =============== SUPPORT ===============
  function supportPage() {
    function ticketItem(tk, i) {
      return `<div class="acc-item"><button class="acc-btn" aria-expanded="false" aria-controls="tk${i}">
        <span><strong>${esc(tk.subject)}</strong><small>${esc(tk.id)} · ${esc(tk.category)} · ${fmtDate(tk.created)}</small></span>${badge(tk.status)}${icon("chevdown", "chev")}</button>
        <div class="acc-panel" id="tk${i}" hidden>${tk.thread.map((m) => `<div class="msg ${m.from === "You" ? "me" : ""}"><b>${esc(m.from)}</b><p>${esc(m.text)}</p><small>${esc(m.at)}</small></div>`).join("")}</div></div>`;
    }
    return {
      title: t("support"),
      html: `
        ${pageHead("Support", "Ask us anything about your account")}
        <div class="two-col">
          <form class="card" id="ticketForm" novalidate>
            <h2>Open a request</h2>
            <div class="field"><label for="cat">Category</label><select id="cat"><option>Funding</option><option>Accounts</option><option>Profile</option><option>Other</option></select><span class="err"></span></div>
            <div class="field"><label for="subject">Subject</label><input id="subject" maxlength="80"><span class="err" id="subject-err" role="alert"></span></div>
            <div class="field"><label for="message">Message</label><textarea id="message" rows="5" maxlength="500"></textarea>
              <span class="hint"><span id="count">0</span>/500</span><span class="err" id="message-err" role="alert"></span></div>
            <button class="btn full" type="submit">Send request</button>
          </form>
          <section class="card"><div class="card-head"><h2>Your requests</h2></div><div id="tickets" class="acc"></div></section>
        </div>
        <section class="card"><div class="card-head"><h2>Frequently asked</h2></div>
          <div class="acc">${D.faqs.map((f, i) => `<div class="acc-item"><button class="acc-btn" aria-expanded="false" aria-controls="fq${i}"><span><strong>${esc(f.q)}</strong></span>${icon("chevdown", "chev")}</button><div class="acc-panel" id="fq${i}" hidden><p>${esc(f.a)}</p></div></div>`).join("")}</div></section>`,
      mount(root) {
        const list = $("#tickets", root);
        const draw = () => { list.innerHTML = D.tickets.length ? D.tickets.map(ticketItem).join("") : `<div class="empty">${icon("inbox")}<p>No requests yet.</p></div>`; };
        draw();
        root.addEventListener("click", (e) => {
          const b = e.target.closest(".acc-btn"); if (!b) return;
          const open = b.getAttribute("aria-expanded") === "true";
          b.setAttribute("aria-expanded", String(!open));
          $("#" + b.getAttribute("aria-controls"), root).hidden = open;
        });
        const msg = $("#message", root), subject = $("#subject", root);
        msg.addEventListener("input", () => { $("#count", root).textContent = msg.value.length; });
        const bad = (el, id, text) => { el.closest(".field").classList.toggle("invalid", !!text); $("#" + id, root).textContent = text; return !text; };
        $("#ticketForm", root).addEventListener("submit", (e) => {
          e.preventDefault();
          const a = bad(subject, "subject-err", subject.value.trim().length < 4 ? "Subject needs at least 4 characters." : "");
          const b = bad(msg, "message-err", msg.value.trim().length < 10 ? "Please describe your issue (10+ characters)." : "");
          if (!a || !b) return;
          const now = new Date();
          D.tickets.unshift({ id: "SUP-" + Math.floor(300 + Math.random() * 600), subject: subject.value.trim(), category: $("#cat", root).value, status: "Open",
            created: now.toISOString().slice(0, 10), thread: [{ from: "You", text: msg.value.trim(), at: now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }] });
          App.store.set("tickets", D.tickets);
          e.target.reset(); $("#count", root).textContent = "0"; draw(); toast("Request sent. We will reply soon.");
        });
      },
    };
  }

  function notFound() {
    return { title: "Not found", html: `<div class="empty big">${icon("inbox")}<h1>Page not found</h1><p>That page does not exist.</p><a class="btn" href="#/accounts">Back to accounts</a></div>`, mount() {} };
  }

  App.pages = { accounts: accountsPage, fund: fundPage, support: supportPage, notFound };
})((window.App = window.App || {}));
