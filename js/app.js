/* App shell, theme, language and hash router. */
(function (App) {
  const { $, $$, esc, icon, t, toast, modal } = App.ui;
  const root = document.getElementById("app");

  const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  App.state = { lang: App.store.get("lang", "en"), theme: App.store.get("theme", prefersDark ? "dark" : "light") };
  document.documentElement.setAttribute("data-theme", App.state.theme);
  document.documentElement.lang = App.state.lang;

  // Day/night switch. Chrome/Edge get a circular reveal from the button that was
  // clicked; other browsers fall back to a short colour fade. Both avoid the
  // "some parts snap, others fade" flash.
  App.toggleTheme = function (e) {
    const next = App.state.theme === "dark" ? "light" : "dark";
    const apply = () => {
      App.state.theme = next;
      document.documentElement.setAttribute("data-theme", next);
      App.store.set("theme", next);
      $$("#themeBtn").forEach((b) => (b.innerHTML = icon(next === "dark" ? "sun" : "moon")));
    };
    const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      const html = document.documentElement;
      html.classList.add("theme-anim");
      apply();
      setTimeout(() => html.classList.remove("theme-anim"), 450);
      return;
    }
    const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : 0;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" });
    });
  };

  // Programmatic navigation that REPLACES the current history entry
  // (used for redirects and the sign in / register switch).
  App.go = function (hash) {
    if (location.hash === hash) return;
    location.replace(location.pathname + location.search + hash);
  };
  App.setLang = function (l) {
    App.state.lang = l; App.store.set("lang", l); document.documentElement.lang = l;
    shellMounted = false; route();
  };

  const isAuthed = () => !!App.store.get("user", null);
  let shellMounted = false;

  // ---------- shell (sidebar + topbar) ----------
  const NAV = [["accounts", "accounts"], ["fund", "fund"], ["support", "support"]];

  function mountShell() {
    const user = App.store.get("user", { name: "Trader", email: "" });
    const initials = esc(user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "T");
    const collapsed = App.store.get("collapsed", false);
    root.innerHTML = `
      <div class="shell ${collapsed ? "collapsed" : ""}" id="shell">
        <aside class="sidebar" id="sidebar" aria-label="Main navigation">
          <div class="brand"><span class="logo">HX</span><span class="brand-name">HX Nexus</span></div>
          <nav>${NAV.map(([h, k]) => `<a href="#/${h}" data-nav="${h}">${icon(h)}<span>${t(k)}</span></a>`).join("")}</nav>
          <button class="collapse" id="collapseBtn" aria-label="Collapse sidebar">${icon("chevleft")}<span>Collapse</span></button>
        </aside>
        <div class="scrim" id="scrim"></div>
        <div class="content">
          <header class="topbar">
            <button class="icon-btn menu-btn" id="menuBtn" aria-label="${t("menu")}" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button>
            <p class="crumbs"><a href="#/accounts">Portal</a> / <span id="crumb"></span></p>
            <div class="top-actions">
              <select id="lang" class="lang" aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select>
              <button class="icon-btn" id="themeBtn" aria-label="${t("theme")}">${icon(App.state.theme === "dark" ? "sun" : "moon")}</button>
              <div class="menu-wrap"><button class="icon-btn" id="bellBtn" aria-label="Notifications" aria-expanded="false">${icon("bell")}<i class="dot-badge"></i></button>
                <div class="dropdown" id="bellMenu" hidden><h3>Notifications</h3>
                  ${App.data.notifications.map((n) => `<div class="note"><strong>${esc(n.title)}</strong><p>${esc(n.text)}</p><small>${esc(n.time)}</small></div>`).join("")}</div></div>
              <div class="menu-wrap"><button class="avatar" id="userBtn" aria-label="Account menu" aria-expanded="false">${initials}</button>
                <div class="dropdown" id="userMenu" hidden><div class="who"><strong class="cap">${esc(user.name)}</strong><small>${esc(user.email)}</small></div>
                  <button id="signOut">${icon("logout")} ${t("signout")}</button></div></div>
            </div>
          </header>
          <main id="view" tabindex="-1"></main>
          <footer class="app-foot">HX Nexus trader workspace — Broker-managed / Identity-bound / No trading incentives</footer>
        </div>
      </div>`;
    shellMounted = true;
    const shell = $("#shell"), menuBtn = $("#menuBtn");
    $("#lang").value = App.state.lang;
    $("#lang").addEventListener("change", (e) => App.setLang(e.target.value));
    $("#themeBtn").addEventListener("click", App.toggleTheme);
    $("#collapseBtn").addEventListener("click", () => { const c = shell.classList.toggle("collapsed"); App.store.set("collapsed", c); });

    const setDrawer = (open) => { shell.classList.toggle("drawer-open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
    menuBtn.addEventListener("click", () => setDrawer(!shell.classList.contains("drawer-open")));
    $("#scrim").addEventListener("click", () => setDrawer(false));
    $$("#sidebar a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));

    // dropdowns
    const pairs = [["bellBtn", "bellMenu"], ["userBtn", "userMenu"]];
    function closeMenus() { pairs.forEach(([b, m]) => { $("#" + m).hidden = true; $("#" + b).setAttribute("aria-expanded", "false"); }); }
    pairs.forEach(([b, m]) => $("#" + b).addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = !$("#" + m).hidden; closeMenus();
      if (!wasOpen) { $("#" + m).hidden = false; $("#" + b).setAttribute("aria-expanded", "true"); $(".dot-badge") && ($(".dot-badge").style.display = "none"); }
    }));
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenus(); setDrawer(false); } });
    $("#signOut").addEventListener("click", () => {
      modal({ title: "Sign out?", body: "<p>You will need to sign in again to see your accounts.</p>", confirmText: "Sign out",
        onConfirm: (close) => { close(); App.store.del("user"); shellMounted = false; App.go("#/login"); toast("You have been signed out"); } });
    });
  }

  // ---------- router ----------
  function skeleton() {
    return `<div class="skeleton" aria-hidden="true"><div class="sk h1"></div><div class="sk-row"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div><div class="sk big"></div></div>`;
  }
  let token = 0;

  function route() {
    const [path, qs] = (location.hash.replace(/^#\/?/, "") || "login").split("?");
    const query = Object.fromEntries(new URLSearchParams(qs || ""));
    const authed = isAuthed();

    if (path === "login" || path === "register" || path === "") {
      if (authed && path !== "register") { App.go("#/accounts"); return; }
      shellMounted = false;
      document.title = (path === "register" ? "Create account" : "Sign in") + " – HX Nexus";
      App.auth[path === "register" ? "register" : "login"](root);
      window.scrollTo(0, 0);
      return;
    }
    if (!authed) { App.go("#/login"); return; }

    if (!shellMounted) mountShell();
    const page = (App.pages[path] || App.pages.notFound)(query);
    $$("#sidebar a").forEach((a) => { const on = a.dataset.nav === path; a.classList.toggle("active", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    $("#crumb").textContent = page.title;
    document.title = page.title + " – HX Nexus";

    const view = $("#view");
    view.innerHTML = skeleton();
    const my = ++token;
    setTimeout(() => {              // short fake load so the skeleton is visible
      if (my !== token) return;     // user navigated again meanwhile
      view.innerHTML = `<div class="page">${page.html}</div>`;
      page.mount(view);
      view.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }, 350);
  }

  window.addEventListener("hashchange", route);
  route();
})((window.App = window.App || {}));
