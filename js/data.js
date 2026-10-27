/* Dummy data + translations. No backend: everything the portal shows comes from here. */
(function (App) {
  const accounts = [
    { id: "HX-100231", type: "Standard", currency: "USD", balance: 12450.75, leverage: "1:100", opened: "2025-03-14", status: "Active" },
    { id: "HX-100232", type: "Islamic",  currency: "USD", balance: 3200.0,   leverage: "1:50",  opened: "2025-04-02", status: "Active" },
    { id: "HX-100318", type: "Pro",      currency: "USD", balance: 28910.4,  leverage: "1:200", opened: "2025-06-21", status: "Active" },
    { id: "HX-100402", type: "Standard", currency: "EUR", balance: 5120.0,   leverage: "1:100", opened: "2025-08-09", status: "Active" },
    { id: "HX-100455", type: "Cent",     currency: "USD", balance: 240.35,   leverage: "1:500", opened: "2025-09-30", status: "Suspended" },
    { id: "HX-100611", type: "Pro",      currency: "GBP", balance: 9875.2,   leverage: "1:200", opened: "2026-01-12", status: "Active" },
    { id: "HX-100702", type: "Standard", currency: "USD", balance: 0,        leverage: "1:100", opened: "2026-05-03", status: "Pending" },
    { id: "HX-100877", type: "Islamic",  currency: "EUR", balance: 0,        leverage: "1:50",  opened: "2026-09-18", status: "Pending" },
  ];

  // Rough conversion to USD, only used for the "total balance" card
  const rates = { USD: 1, EUR: 1.08, GBP: 1.27 };
  const totalUSD = accounts.reduce((s, a) => s + a.balance * rates[a.currency], 0);

  // 30 days of balance, built backwards from today's total so the chart ends at the real number
  const balanceHistory = [];
  let v = totalUSD;
  for (let i = 29; i >= 0; i--) {
    balanceHistory[i] = Math.round(v);
    v -= Math.sin(i / 2.7) * 260 + (i % 6 === 0 ? 340 : -60);
  }
  const labels = balanceHistory.map((_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  });

  const transactions = [
    { ref: "DEP-4821", date: "2026-10-14", account: "HX-100231", method: "Bank transfer", amount: 5000, fee: 0,     status: "Completed" },
    { ref: "DEP-4802", date: "2026-10-09", account: "HX-100318", method: "Card",          amount: 2000, fee: 30,    status: "Completed" },
    { ref: "DEP-4710", date: "2026-10-02", account: "HX-100231", method: "Card",          amount: 1500, fee: 22.5,  status: "Completed" },
    { ref: "DEP-4688", date: "2026-09-28", account: "HX-100232", method: "Wallet",        amount: 600,  fee: 3,     status: "Failed" },
    { ref: "DEP-4602", date: "2026-09-21", account: "HX-100231", method: "Bank transfer", amount: 800,  fee: 0,     status: "Pending" },
    { ref: "DEP-4550", date: "2026-09-12", account: "HX-100611", method: "Bank transfer", amount: 3500, fee: 0,     status: "Completed" },
    { ref: "DEP-4497", date: "2026-09-03", account: "HX-100402", method: "Wallet",        amount: 450,  fee: 2.25,  status: "Completed" },
    { ref: "DEP-4410", date: "2026-08-22", account: "HX-100318", method: "Card",          amount: 1200, fee: 18,    status: "Completed" },
  ];

  const tickets = [
    { id: "SUP-311", subject: "Update my phone number", category: "Profile", status: "Open", created: "2026-10-12",
      thread: [
        { from: "You", text: "Please change my registered phone number to my new one.", at: "12 Oct, 10:14" },
        { from: "Support", text: "Thanks. For security we need a quick identity check. We have emailed you a link.", at: "12 Oct, 11:02" },
      ] },
    { id: "SUP-298", subject: "Deposit not showing on account", category: "Funding", status: "Closed", created: "2026-09-29",
      thread: [
        { from: "You", text: "My bank transfer DEP-4688 is not showing.", at: "29 Sep, 09:30" },
        { from: "Support", text: "The wallet payment failed at the provider. Please retry or use a bank transfer.", at: "29 Sep, 12:45" },
      ] },
    { id: "SUP-244", subject: "How do I change account type?", category: "Accounts", status: "Closed", created: "2026-08-05",
      thread: [
        { from: "You", text: "Can I move from Standard to Pro?", at: "5 Aug, 16:20" },
        { from: "Support", text: "Yes. Open a new Pro account and your broker will migrate it.", at: "6 Aug, 10:05" },
      ] },
  ];

  const notifications = [
    { title: "Deposit completed", text: "DEP-4821 of $5,000.00 reached HX-100231.", time: "2d ago" },
    { title: "Account pending", text: "HX-100877 is waiting for identity verification.", time: "5d ago" },
    { title: "Ticket updated", text: "SUP-311 has a new reply from Support.", time: "12d ago" },
  ];

  const faqs = [
    { q: "How long does a deposit take?", a: "Bank transfers usually settle within one business day. Cards and wallets are normally instant." },
    { q: "Why is my account Pending?", a: "Your broker has to verify your identity first. Funding is switched on as soon as that is done." },
    { q: "Are there fees on deposits?", a: "Bank transfers are free. Cards cost 1.5% and wallets 0.5% of the amount." },
    { q: "Can I place trades from this portal?", a: "No. This portal only shows balances, funding and onboarding. It has no dealing tools." },
  ];

  // Small translation table. App.t(key) falls back to English.
  const i18n = {
    en: { accounts: "Accounts", fund: "Fund", support: "Support", signin: "Sign in", signout: "Sign out", create: "Create account",
          welcome: "Welcome back", search: "Search", theme: "Toggle theme", menu: "Menu" },
    hi: { accounts: "खाते", fund: "फंड जोड़ें", support: "सहायता", signin: "साइन इन", signout: "साइन आउट", create: "खाता बनाएं",
          welcome: "वापसी पर स्वागत है", search: "खोजें", theme: "थीम बदलें", menu: "मेनू" },
    mr: { accounts: "खाती", fund: "निधी जमा", support: "सहाय्य", signin: "साइन इन", signout: "साइन आउट", create: "खाते तयार करा",
          welcome: "पुन्हा स्वागत", search: "शोधा", theme: "थीम बदला", menu: "मेनू" },
  };

  // localStorage wrapper that never throws (private mode, blocked storage)
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("hx_" + k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, val) { try { localStorage.setItem("hx_" + k, JSON.stringify(val)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("hx_" + k); } catch (e) {} },
  };

  App.data = {
    accounts, rates, totalUSD, balanceHistory, labels,
    transactions: store.get("tx", transactions),
    tickets: store.get("tickets", tickets),
    notifications, faqs,
  };
  App.i18n = i18n;
  App.store = store;
})((window.App = window.App || {}));
