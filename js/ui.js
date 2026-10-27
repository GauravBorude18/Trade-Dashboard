/* Reusable UI building blocks: icons, toast, modal, charts, data table. */
(function (App) {
  // ---------- tiny helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Escape user text before putting it in innerHTML (stops HTML/script injection)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function money(n, cur = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
  }
  function fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function t(key) {
    const lang = App.state ? App.state.lang : "en";
    return (App.i18n[lang] && App.i18n[lang][key]) || App.i18n.en[key] || key;
  }

  // ---------- icons ----------
  const paths = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    accounts: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    fund: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12l4 4 4-4"/>',
    support: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.9 4.9l4.2 4.2M14.8 14.8l4.2 4.2M14.8 9.2l4.2-4.2M4.9 19.1l4.2-4.2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
    chevleft: '<path d="M15 18l-6-6 6-6"/>',
    chevdown: '<path d="M6 9l6 6 6-6"/>',
    arrowup: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  };
  function icon(name, cls = "") {
    return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  // ---------- toast ----------
  function toast(msg, type = "ok") {
    const box = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `${icon(type === "ok" ? "check" : "x")}<span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, 3000);
  }

  // ---------- modal (focus trap, Esc, backdrop click) ----------
  function modal({ title, body, confirmText = "Confirm", cancelText = "Cancel", onConfirm, hideActions = false }) {
    const prev = document.activeElement;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-head"><h2 id="modalTitle">${esc(title)}</h2>
          <button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
        <div class="modal-body">${body}</div>
        ${hideActions ? "" : `<div class="modal-foot">
          <button class="btn ghost" data-close>${esc(cancelText)}</button>
          <button class="btn" data-confirm>${esc(confirmText)}</button></div>`}
      </div>`;
    document.body.appendChild(back);
    document.body.classList.add("no-scroll");

    function close() {
      document.removeEventListener("keydown", onKey);
      back.remove();
      document.body.classList.remove("no-scroll");
      if (prev && prev.focus) prev.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      const f = $$("button, a[href], input, select, textarea", back).filter((x) => !x.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    back.addEventListener("click", (e) => {
      if (e.target === back || e.target.closest("[data-close]")) close();
      if (e.target.closest("[data-confirm]")) { if (onConfirm) onConfirm(close); else close(); }
    });
    const firstBtn = $("[data-confirm]", back) || $("[data-close]", back);
    if (firstBtn) firstBtn.focus();
    return { close, el: back };
  }

  // ---------- charts (hand-written SVG, no library) ----------
  function sparkline(values, color = "var(--teal)") {
    const w = 96, h = 32, min = Math.min(...values), max = Math.max(...values);
    const pts = values.map((v, i) => `${(i * w / (values.length - 1)).toFixed(1)},${(h - 3 - ((v - min) / (max - min || 1)) * (h - 6)).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function lineChart(el, labels, values) {
    // Use the real pixel width so text stays the same size on phones and desktops
    const W = Math.max(300, Math.round(el.clientWidth || 640)), H = 240, p = { l: 52, r: 14, t: 14, b: 26 };
    if (!el._resizeBound) {
      el._resizeBound = true;
      let timer;
      window.addEventListener("resize", () => {
        clearTimeout(timer);
        timer = setTimeout(() => { if (el.isConnected && Math.abs(el.clientWidth - W) > 8) lineChart(el, labels, values); }, 150);
      });
    }
    const min = Math.min(...values) * 0.985, max = Math.max(...values) * 1.015;
    const step = (W - p.l - p.r) / (values.length - 1);
    const x = (i) => p.l + i * step;
    const y = (v) => p.t + (1 - (v - min) / (max - min)) * (H - p.t - p.b);
    const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const area = `${line} L${x(values.length - 1).toFixed(1)},${H - p.b} L${x(0).toFixed(1)},${H - p.b} Z`;
    let grid = "";
    for (let g = 0; g <= 3; g++) {
      const val = min + ((max - min) * g) / 3, yy = y(val);
      grid += `<line x1="${p.l}" x2="${W - p.r}" y1="${yy}" y2="${yy}" class="grid"/><text x="${p.l - 8}" y="${yy + 4}" text-anchor="end" class="axis">${(val / 1000).toFixed(1)}k</text>`;
    }
    const ticks = [0, Math.floor(values.length / 2), values.length - 1]
      .map((i, n) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${n === 0 ? "start" : n === 2 ? "end" : "middle"}" class="axis">${labels[i]}</text>`).join("");
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Balance trend, last ${values.length} days">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--teal)" stop-opacity=".28"/><stop offset="1" stop-color="var(--teal)" stop-opacity="0"/></linearGradient></defs>
        ${grid}${ticks}<path d="${area}" fill="url(#areaGrad)"/>
        <path d="${line}" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <line class="cross" y1="${p.t}" y2="${H - p.b}" hidden/><circle class="dot" r="5" hidden/>
      </svg><div class="chart-tip" hidden></div>`;
    const svg = $("svg", el), tip = $(".chart-tip", el), dot = $(".dot", svg), cross = $(".cross", svg);
    function show(clientX) {
      const r = svg.getBoundingClientRect();
      const px = ((clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(values.length - 1, Math.round((px - p.l) / step)));
      dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(values[i]));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
      dot.removeAttribute("hidden"); cross.removeAttribute("hidden");
      tip.innerHTML = `<strong>${money(values[i])}</strong><span>${labels[i]}</span>`;
      tip.removeAttribute("hidden");
      tip.style.left = Math.min(Math.max((x(i) / W) * r.width, 60), r.width - 60) + "px";
    }
    function hide() { dot.setAttribute("hidden", ""); cross.setAttribute("hidden", ""); tip.setAttribute("hidden", ""); }
    svg.addEventListener("mousemove", (e) => show(e.clientX));
    svg.addEventListener("touchmove", (e) => show(e.touches[0].clientX), { passive: true });
    svg.addEventListener("mouseleave", hide);
    svg.addEventListener("touchend", hide);
  }

  // ---------- badge ----------
  function badge(status) {
    const cls = { Active: "ok", Completed: "ok", Closed: "muted", Pending: "wait", Open: "wait", Suspended: "no", Failed: "no" }[status] || "muted";
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  // ---------- data table: search, filter, sort, pagination, CSV export ----------
  function dataTable(el, o) {
    const st = { q: "", filter: "all", key: o.sortKey || null, dir: "desc", page: 1 };
    const size = o.pageSize || 5;
    el.innerHTML = `
      <div class="toolbar">
        <label class="search">${icon("search")}<input type="search" placeholder="${esc(o.placeholder || "Search")}" aria-label="Search table"></label>
        ${o.filterKey ? `<select aria-label="Filter by status"><option value="all">All statuses</option>${o.filterValues.map((v) => `<option>${esc(v)}</option>`).join("")}</select>` : ""}
        <button class="btn ghost sm" data-csv>${icon("download")} Export CSV</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>${o.columns.map((c) => `<th scope="col" ${c.sortable ? `data-sort="${c.key}" tabindex="0" aria-sort="none"` : ""} class="${c.align || ""}">${esc(c.label)}${c.sortable ? '<span class="sort"></span>' : ""}</th>`).join("")}</tr></thead>
        <tbody></tbody></table></div>
      <div class="pager"><span class="count"></span><div><button class="btn ghost sm" data-prev>Previous</button><button class="btn ghost sm" data-next>Next</button></div></div>`;
    const body = $("tbody", el), count = $(".count", el);
    const raw = (r, c) => (c.value ? c.value(r) : r[c.key]);

    function rows() {
      let list = o.rows().filter((r) => {
        if (st.filter !== "all" && r[o.filterKey] !== st.filter) return false;
        if (!st.q) return true;
        return o.columns.some((c) => String(raw(r, c)).toLowerCase().includes(st.q));
      });
      if (st.key) {
        const col = o.columns.find((c) => c.key === st.key);
        list = list.slice().sort((a, b) => {
          const x = raw(a, col), y = raw(b, col);
          const r = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
          return st.dir === "asc" ? r : -r;
        });
      }
      return list;
    }
    function draw() {
      const list = rows(), pages = Math.max(1, Math.ceil(list.length / size));
      st.page = Math.min(st.page, pages);
      const slice = list.slice((st.page - 1) * size, st.page * size);
      body.innerHTML = slice.length
        ? slice.map((r, i) => `<tr ${o.onRow ? `class="clickable" tabindex="0" data-i="${i}"` : ""}>${o.columns.map((c) => `<td class="${c.align || ""}" data-label="${esc(c.label)}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${o.columns.length}"><div class="empty">${icon("inbox")}<p>Nothing matches your search.</p></div></td></tr>`;
      count.textContent = list.length ? `${(st.page - 1) * size + 1}–${(st.page - 1) * size + slice.length} of ${list.length}` : "0 results";
      $("[data-prev]", el).disabled = st.page <= 1;
      $("[data-next]", el).disabled = st.page >= pages;
      $$("th[data-sort]", el).forEach((th) => th.setAttribute("aria-sort", th.dataset.sort === st.key ? (st.dir === "asc" ? "ascending" : "descending") : "none"));
      body._slice = slice;
    }
    $("input", el).addEventListener("input", (e) => { st.q = e.target.value.trim().toLowerCase(); st.page = 1; draw(); });
    const sel = $("select", el);
    if (sel) sel.addEventListener("change", () => { st.filter = sel.value; st.page = 1; draw(); });
    $("[data-prev]", el).addEventListener("click", () => { st.page--; draw(); });
    $("[data-next]", el).addEventListener("click", () => { st.page++; draw(); });
    function sortBy(th) {
      const k = th.dataset.sort;
      st.dir = st.key === k && st.dir === "desc" ? "asc" : "desc"; st.key = k; draw();
    }
    $$("th[data-sort]", el).forEach((th) => {
      th.addEventListener("click", () => sortBy(th));
      th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sortBy(th); } });
    });
    if (o.onRow) {
      const open = (tr) => { if (tr && tr.dataset.i !== undefined) o.onRow(body._slice[+tr.dataset.i]); };
      body.addEventListener("click", (e) => open(e.target.closest("tr")));
      body.addEventListener("keydown", (e) => { if (e.key === "Enter") open(e.target.closest("tr")); });
    }
    $("[data-csv]", el).addEventListener("click", () => {
      const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
      const csv = [o.columns.map((c) => q(c.label)).join(",")].concat(rows().map((r) => o.columns.map((c) => q(raw(r, c))).join(","))).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = (o.csvName || "export") + ".csv";
      a.click(); URL.revokeObjectURL(a.href);
      toast("CSV downloaded");
    });
    draw();
    return { redraw: draw };
  }

  App.ui = { $, $$, esc, money, fmtDate, t, icon, toast, modal, sparkline, lineChart, badge, dataTable };
  App.t = t;
})((window.App = window.App || {}));
