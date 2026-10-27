/* Sign-in and registration pages, with inline validation. */
(function (App) {
  const { $, icon, t, toast, money, sparkline } = App.ui;

  // ---------- small form helpers ----------
  function setError(input, msg) {
    const f = input.closest(".field");
    f.classList.toggle("invalid", !!msg);
    $(".err", f).textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function field(id, label, type, extra = "") {
    return `<div class="field"><label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" ${extra}><span class="err" id="${id}-err" role="alert"></span></div>`;
  }
  function passwordField(id, label, extra = "") {
    return `<div class="field"><label for="${id}">${label}</label>
      <div class="pw"><input id="${id}" type="password" ${extra}>
      <button type="button" class="icon-btn" data-toggle="${id}" aria-label="Show password">${icon("eye")}</button></div>
      <span class="err" id="${id}-err" role="alert"></span></div>`;
  }
  function wirePasswordToggles(root) {
    root.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
      const input = $("#" + b.dataset.toggle, root), show = input.type === "password";
      input.type = show ? "text" : "password";
      b.innerHTML = icon(show ? "eyeoff" : "eye");
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    }));
  }

  // Left-hand brand panel shared by the sign-in and register pages
  function hero({ title, lead, items, showCard }) {
    const card = showCard ? `
      <aside class="float-card" aria-hidden="true">
        <p>Total balance</p><strong>${money(App.data.totalUSD)}</strong>
        <span class="chip-up">▲ 1.0% this month</span>${sparkline(App.data.balanceHistory, "#6af0d6")}
      </aside>` : "";
    return `<section class="auth-hero">
        <div class="hero-bg" aria-hidden="true"><i class="orb o1"></i><i class="orb o2"></i><i class="hero-grid"></i></div>
        <div class="hero-inner">
          <p class="pill"><span class="pulse"></span> Broker-managed workspace</p>
          <h2>${title}</h2>
          <p class="lead">${lead}</p>
          <ol class="feat">${items.map(([name, desc], i) => `<li><span class="num">0${i + 1}</span><div><strong>${name}</strong><small>${desc}</small></div></li>`).join("")}</ol>
          <div class="trust"><span>Identity-bound</span><span>No trading incentives</span><span>Broker-managed</span></div>
        </div>${card}
      </section>`;
  }

  function topbar(active) {
    const cur = (k) => (active === k ? ' aria-current="page"' : "");
    return `<header class="auth-top">
      <a href="#/login" class="logo" aria-label="HX Nexus home">HX</a>
      <nav class="auth-links" aria-label="Account">
        <a href="#/login"${cur("login")}>${t("signin")}</a><a href="#/register"${cur("register")}>${t("create")}</a>
        <select id="lang" aria-label="Language" class="lang">
          <option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select>
        <button class="icon-btn" id="themeBtn" aria-label="${t("theme")}">${icon(App.state.theme === "dark" ? "sun" : "moon")}</button>
      </nav></header>`;
  }
  const footer = `<p class="auth-foot">HX Nexus trader workspace — Broker-managed / Identity-bound / No trading incentives</p>`;

  function wireTop(root) {
    // Switching between sign in / register replaces the history entry,
    // so the Back button does not step through every click.
    root.querySelectorAll('a[href^="#/"]').forEach((link) =>
      link.addEventListener("click", (e) => { e.preventDefault(); App.go(link.getAttribute("href")); }));
    const lang = $("#lang", root);
    lang.value = App.state.lang;
    lang.addEventListener("change", () => App.setLang(lang.value));
    $("#themeBtn", root).addEventListener("click", App.toggleTheme);
  }

  // ---------- login ----------
  function login(root) {
    root.innerHTML = `${topbar("login")}
      <main class="auth" id="view">
        ${hero({
          title: 'Your accounts. <span class="grad">One clear view.</span>',
          lead: "Balances, funding and onboarding stay in this CRM view. No dealing or order tools.",
          items: [[t("accounts"), "Live balances and onboarding status"], [t("fund"), "Deposit in minutes and track every step"], [t("support"), "Message your broker's desk any time"]],
          showCard: true,
        })}
        <section class="auth-form-wrap">
          <form class="auth-form" id="loginForm" novalidate>
            <p class="eyebrow">${t("welcome")}</p>
            <h1>Sign in to your workspace</h1>
            <p class="sub">Use your account details to continue.</p>
            ${field("email", "Email", "email", 'placeholder="you@example.com" autocomplete="username"')}
            ${passwordField("password", "Password", 'autocomplete="current-password"')}
            <div class="row-between">
              <label class="check"><input type="checkbox" id="remember"> Remember me</label>
              <a href="#/login" id="forgot">Forgot password?</a>
            </div>
            <p class="form-error" id="formError" role="alert"></p>
            <button class="btn full" type="submit" id="submitBtn"><span>${t("signin")} →</span></button>
            <p class="switch">New here? <a href="#/register">Create a trader account</a></p>
          </form>
        </section>
      </main>${footer}`;
    wireTop(root); wirePasswordToggles(root);

    const form = $("#loginForm"), email = $("#email"), pw = $("#password");
    const saved = App.store.get("remember", "");
    if (saved) { email.value = saved; $("#remember").checked = true; }
    email.addEventListener("blur", () => setError(email, !email.value ? "Enter your email." : emailOk(email.value) ? "" : "Enter a valid email address."));
    pw.addEventListener("blur", () => setError(pw, pw.value.length < 4 ? "Password must be at least 4 characters." : ""));
    $("#forgot").addEventListener("click", (e) => { e.preventDefault(); toast("Demo only: no reset email is sent."); });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const a = setError(email, !email.value ? "Enter your email." : emailOk(email.value) ? "" : "Enter a valid email address.");
      const b = setError(pw, pw.value.length < 4 ? "Password must be at least 4 characters." : "");
      if (!a || !b) { form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake"); (a ? pw : email).focus(); return; }
      const btn = $("#submitBtn"); btn.disabled = true; btn.classList.add("loading"); btn.innerHTML = '<span class="spinner"></span> Signing in…';
      setTimeout(() => {
        App.store.set("remember", $("#remember").checked ? email.value : "");
        App.store.set("user", { email: email.value.trim(), name: email.value.split("@")[0].replace(/[._]/g, " ") });
        App.go("#/accounts");
        toast("Signed in successfully");
      }, 700);
    });
  }

  // ---------- register ----------
  function strength(v) {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  }
  function register(root) {
    root.innerHTML = `${topbar("register")}
      <main class="auth" id="view">
        ${hero({
          title: 'Open your <span class="grad">trader account</span>',
          lead: "Tell us who you are. Your broker verifies your identity before funding is switched on.",
          items: [["Create your login", "Two minutes, no paperwork upfront"], ["Verify identity", "Your broker confirms who you are"], ["Fund your account", "Switched on as soon as you are verified"]],
          showCard: false,
        })}
        <section class="auth-form-wrap">
          <form class="auth-form" id="regForm" novalidate>
            <h1>Create a trader account</h1>
            <p class="sub">It takes about two minutes.</p>
            ${field("name", "Full name", "text", 'autocomplete="name"')}
            ${field("remail", "Email", "email", 'autocomplete="email"')}
            <div class="field"><label for="country">Country</label>
              <select id="country"><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Singapore</option><option>Other</option></select><span class="err"></span></div>
            ${passwordField("rpass", "Password", 'autocomplete="new-password"')}
            <div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="meter-label" id="meterLabel">Use 8+ characters with letters, numbers and a symbol.</p>
            ${passwordField("rpass2", "Confirm password", 'autocomplete="new-password"')}
            <label class="check"><input type="checkbox" id="terms"> I agree to the terms and risk disclosure</label>
            <span class="err" id="terms-err" role="alert"></span>
            <button class="btn full" type="submit">Create account →</button>
            <p class="switch">Already registered? <a href="#/login">Sign in</a></p>
          </form>
        </section>
      </main>${footer}`;
    wireTop(root); wirePasswordToggles(root);

    const f = { name: $("#name"), email: $("#remail"), p1: $("#rpass"), p2: $("#rpass2"), terms: $("#terms") };
    const checks = {
      name: () => setError(f.name, f.name.value.trim().length < 2 ? "Enter your full name." : ""),
      email: () => setError(f.email, emailOk(f.email.value) ? "" : "Enter a valid email address."),
      p1: () => setError(f.p1, strength(f.p1.value) < 2 || f.p1.value.length < 6 ? "Use at least 6 characters, mixing letters and numbers." : ""),
      p2: () => setError(f.p2, f.p2.value !== f.p1.value || !f.p2.value ? "Passwords do not match." : ""),
    };
    Object.keys(checks).forEach((k) => f[k].addEventListener("blur", checks[k]));
    const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
    f.p1.addEventListener("input", () => {
      const s = f.p1.value ? strength(f.p1.value) : 0;
      $(".meter", root).dataset.level = s;
      $("#meterLabel").textContent = f.p1.value ? "Strength: " + labels[s] : "Use 8+ characters with letters, numbers and a symbol.";
    });
    $("#regForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const results = Object.keys(checks).map((k) => checks[k]());
      const t2 = f.terms.checked; $("#terms-err").textContent = t2 ? "" : "Please accept the terms to continue.";
      if (results.includes(false) || !t2) { const bad = Object.keys(checks).find((k, i) => !results[i]); if (bad) f[bad].focus(); return; }
      App.store.set("user", { email: f.email.value.trim(), name: f.name.value.trim() });
      App.go("#/accounts");
      toast("Account created. Welcome to HX Nexus!");
    });
  }

  App.auth = { login, register };
})((window.App = window.App || {}));
