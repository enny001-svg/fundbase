/* regenerated script.js - Option A (real login system)
   - Signup saves user (name, email, password) in localStorage
   - Login verifies credentials and sets current user
   - Fixed starting balance ₦30,000 for new users
   - Dashboard protected (redirects to index.html if not logged in)
   - Daily check-in once per device-date (YYYY-MM-DD)
   - Withdraw ALWAYS alerts "Please input Pay-ID"
   - Messages/Help send -> "Message delivered successfully" (clears inputs)
   - Referral copy -> alert "Purchase referral code before receiving bonus" + visible note
   - Buy Pay-ID -> "Pay-ID purchased successfully"
   - Defensive: safely handles pages missing elements
*/

const USERS_KEY = "app_users_v3";
const CURRENT_USER_KEY = "app_current_user_v3";

/* ---------- Utilities ---------- */
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch (e) { console.error("Failed parse users", e); return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function setCurrentUserId(id) { localStorage.setItem(CURRENT_USER_KEY, id); }
function getCurrentUserId() { return localStorage.getItem(CURRENT_USER_KEY); }
function clearCurrentUser() { localStorage.removeItem(CURRENT_USER_KEY); }
function genId(){ return "u" + Math.random().toString(36).slice(2,10); }
function todayISO(){ return (new Date()).toISOString().slice(0,10); } // YYYY-MM-DD
function formatNaira(x){ return "₦" + Number(x).toLocaleString(); }

/* ---------- Auth helpers ---------- */
function findUserByEmail(email) {
  if (!email) return null;
  const users = loadUsers();
  return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}
function findUserById(id) {
  if (!id) return null;
  return loadUsers().find(u => u.id === id);
}
function persistUser(user) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) users.push(user);
  else users[idx] = user;
  saveUsers(users);
}

/* ---------- Signup ---------- */
function wireSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // fields from your signup.html
    const name = (document.getElementById("fullName") || {}).value?.trim() || "";
    const email = (document.getElementById("signupEmail") || {}).value?.trim() || "";
    const password = (document.getElementById("signupPassword") || {}).value || "";

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // prevent duplicate email
    if (findUserByEmail(email)) {
      alert("An account with this email already exists. Please log in.");
      return;
    }

    // create user
    const id = genId();
    const newUser = {
      id,
      name,
      email,
      password,
      balance: 30000,           // fixed starting balance// increase by 1000 after daily check-in
      createdAt: new Date().toISOString(),
      lastCheckIn: null,       // ISO date string
      checkedDates: [],        // list of YYYY-MM-DD strings
      referralCode: "REF-" + id.slice(-6).toUpperCase()
    };

    persistUser(newUser);
    setCurrentUserId(id);
    // redirect to dashboard
    location.href = "dashboard.html";
  });
}

/* ---------- Login ---------- */
function wireLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (document.getElementById("loginEmail") || document.getElementById("loginUser") || {}).value?.trim() || "";
    const password = (document.getElementById("loginPassword") || {}).value || "";

    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      alert("Incorrect login credentials.");
      return;
    }

    // successful login
    setCurrentUserId(user.id);
    location.href = "dashboard.html";
  });
}

/* ---------- Dashboard population & protection ---------- */
function requireAuthOrRedirect() {
  const currentId = getCurrentUserId();
  if (!currentId) {
    // not logged in
    if (location.pathname.endsWith("dashboard.html") || location.pathname.includes("dashboard")) {
      location.href = "index.html";
    }
    return null;
  }
  const u = findUserById(currentId);
  if (!u) {
    clearCurrentUser();
    if (location.pathname.endsWith("dashboard.html") || location.pathname.includes("dashboard")) {
      location.href = "index.html";
    }
    return null;
  }
  return u;
}

function populateDashboard() {
  const u = requireAuthOrRedirect();
  if (!u) return;
  // balance
  const balEl = document.getElementById("userBalance") || document.getElementById("balanceEl") || document.getElementById("balance-amount");
  if (balEl) balEl.textContent = formatNaira(u.balance);

  // welcome name
  const welcome = document.getElementById("welcomeName") || document.getElementById("navUsername");
  if (welcome) welcome.textContent = u.name || u.email;

  // referral code display
  const refEl = document.getElementById("refCode") || document.getElementById("refCodeEl");
  if (refEl) refEl.textContent = u.referralCode;

  // account display placeholder
  const acct = document.getElementById("accountNumberDisplay");
  if (acct) acct.textContent = u.id;

  // ensure referralNoteInline exists
  if (!document.getElementById("referralNoteInline")) {
    const refWrap = refEl || document.querySelector(".ref-display");
    if (refWrap && refWrap.parentNode) {
      const note = document.createElement("div");
      note.id = "referralNoteInline";
      refWrap.parentNode.insertBefore(note, refWrap.nextSibling);
    }
  }

  // init widgets relying on user
  initDaily(u);
  wireReferralCopy(u);
}

/* ---------- Withdraw behavior (always alert) ---------- */
function wireWithdraw() {
  const withdrawBtn = document.getElementById("withdrawBtn") || document.querySelector(".withdraw-btn");
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Please input Pay-ID");
    });
  }
  const wForm = document.getElementById("withdrawForm");
  if (wForm) {
    wForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Please input Pay-ID");
    });
  }
}

/* ---------- Messages & Help send ---------- */
function wireSendButtons() {
  const selectors = ["#helpSendBtn", "#msgSendBtn", "#sendHelpBtn", "#sendMessageBtn", ".send-message", ".send-btn"];
  const buttons = document.querySelectorAll(selectors.join(","));
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // clear nearby textarea or input
      const container = btn.closest(".card, form, .container");
      if (container) {
        const txt = container.querySelector("textarea, input[type=text], input[type=email]");
        if (txt) txt.value = "";
      }
      alert("Message delivered successfully");
    });
  });
}

/* ---------- Referral copy (alert + visible note) ---------- */
function wireReferralCopy(userObj) {
  const copyBtn = document.getElementById("copyRefBtn") || document.querySelector(".copy-ref");
  if (copyBtn) {
    copyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // corrected alert text as requested
      alert("purchase Pay-ID before receiving bonus");
      const note = document.getElementById("referralNoteInline");
      if (note) {
        note.textContent = "NOTE: Purchase referral code before receiving bonus.";
        note.classList.add("inline-alert");
      } else {
        // try to create it under the ref element
        const refEl = document.getElementById("refCode") || document.querySelector(".ref-display");
        if (refEl && refEl.parentNode) {
          const n = document.createElement("div");
          n.id = "referralNoteInline";
          n.textContent = "NOTE: Purchase referral code before receiving bonus.";
          n.className = "inline-alert";
          refEl.parentNode.insertBefore(n, refEl.nextSibling);
        }
      }
    });
  }

  // clicking the referral text also triggers the same message
  const refText = document.getElementById("refCode") || document.getElementById("refCodeEl");
  if (refText) {
    refText.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Purchase PayID before receiving bonus");
      const note = document.getElementById("referralNoteInline");
      if (note) {
        note.textContent = "NOTE: Purchase referral code before receiving bonus.";
        note.classList.add("inline-alert");
      }
    });
  }
}

/* ---------- Buy Pay-ID ---------- */
function wireBuyPayId() {
  const buyBtn = document.getElementById("buyPayIdBtn") || document.getElementById("buyPayBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Please complete bank transfer and try again");
      // optional: you could set a flag on user to indicate purchased Pay-ID
      const currentId = getCurrentUserId();
      if (currentId) {
        const u = findUserById(currentId);
        if (u) {
          u.hasPayId = true;
          persistUser(u);
        }
      }
    });
  }
}

/* ---------- Daily check-in ---------- */
function initDaily(userObj) {
  if (!userObj) return;
  const checkBtn = document.getElementById("checkInBtn");
  const statusEl = document.getElementById("checkinStatus") || document.getElementById("checkInStatus");
  const calContainer = document.getElementById("calendarContainer") || document.getElementById("calendar");

  // set status
  const today = todayISO();
  if (statusEl) {
    statusEl.textContent = (userObj.lastCheckIn === today) ? "You have checked-in today." : "You can check-in once every 24 hours.";
  }

  // render calendar if container present
  if (calContainer) renderCalendar(userObj, calContainer);

  if (checkBtn) {
    checkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const now = todayISO();
      if (userObj.lastCheckIn === now || (Array.isArray(userObj.checkedDates) && userObj.checkedDates.includes(now))) {
        alert("You have already checked in today. Come back tomorrow.");
        if (statusEl) statusEl.textContent = "Already checked-in today.";
        return;
      }
      // record check-in
      userObj.lastCheckIn = now;
      if (!Array.isArray(userObj.checkedDates)) userObj.checkedDates = [];
      userObj.checkedDates.push(now);
      persistUser(userObj);
      alert("Check-in successful. See calendar updated.");
      if (statusEl) statusEl.textContent = "Check-in successful. See calendar updated.";
      if (calContainer) renderCalendar(userObj, calContainer);
    });
  }
}

/* Simple calendar renderer for current month */
function renderCalendar(userObj, container) {
  container.innerHTML = "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const wrapper = document.createElement("div");
  wrapper.className = "calendar";

  // blanks
  for (let i = 0; i < firstDayIndex; i++) {
    const ph = document.createElement("div");
    ph.className = "day";
    ph.style.visibility = "hidden";
    wrapper.appendChild(ph);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month, d).toISOString().slice(0,10);
    const day = document.createElement("div");
    day.className = "day";
    if (iso === todayISO()) day.classList.add("today");
    if (Array.isArray(userObj.checkedDates) && userObj.checkedDates.includes(iso)) day.classList.add("checked");
    const hd = document.createElement("div");
    hd.style.fontWeight = "700";
    hd.textContent = d;
    day.appendChild(hd);
    if (day.classList.contains("checked")) {
      const t = document.createElement("div"); t.textContent = "Checked"; t.style.fontSize = "0.8rem"; t.style.marginTop = "6px";
      day.appendChild(t);
    }
    if (iso === todayISO()) {
      const tt = document.createElement("div"); tt.textContent = "Today"; tt.style.fontSize = "0.8rem";
      day.appendChild(tt);
    }
    wrapper.appendChild(day);
  }

  container.appendChild(wrapper);
}

/* ---------- Bootstrapping on DOM ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Wire auth forms
  wireSignup();
  wireLogin();

  // Populate dashboard if user logged in
  if (getCurrentUserId()) {
    populateDashboard();
  } else {
    // if on dashboard but not logged in redirect
    if (location.pathname.endsWith("dashboard.html") || location.pathname.includes("dashboard")) {
      location.href = "index.html";
      return;
    }
  }

  // Wire global actions (defensive)
  wireWithdraw();
  wireSendButtons();
  wireBuyPayId();
  wireReferralCopy(findUserById(getCurrentUserId()));

  // Wire logout links/buttons if present
  const logoutEls = document.querySelectorAll("#logoutBtn, .logout-btn, #headerLogout");
  logoutEls.forEach(el => {
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      clearCurrentUser();
      location.href = "index.html";
    });
  });

  // If user is on index/login page and already logged-in, optional redirect to dashboard
  const onLoginPage = location.pathname.endsWith("index.html") || location.pathname.endsWith("login.html") || location.pathname === "/";
  if (onLoginPage && getCurrentUserId()) {
    setTimeout(() => { location.href = "dashboard.html"; }, 300);
  }
});