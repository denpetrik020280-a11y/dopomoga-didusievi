import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/*
 * PFLEGE — Stage 1 + Stage 2
 * Firebase structure is intentionally unchanged:
 * families/grandpa-help-demo/members
 * families/grandpa-help-demo/tasks
 * families/grandpa-help-demo/entries
 */

const firebaseConfig = {
  apiKey: "AIzaSyDJUanKnJhCwZil0070JCvFsl_ptRJ6z5U",
  authDomain: "volodyka-d0e6f.firebaseapp.com",
  projectId: "volodyka-d0e6f",
  storageBucket: "volodyka-d0e6f.firebasestorage.app",
  messagingSenderId: "897772118836",
  appId: "1:897772118836:web:d14da433651226be85bb61",
  measurementId: "G-2E8YD99FSF"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const FAMILY_PATH = ["families", "grandpa-help-demo"];
const membersRef = collection(db, ...FAMILY_PATH, "members");
const tasksRef = collection(db, ...FAMILY_PATH, "tasks");
const entriesRef = collection(db, ...FAMILY_PATH, "entries");

const ADMIN_UID = "6PEnWw88snMJIg8HKtAh0jAlrME3";

const DEFAULT_TASKS = [
  { id: "clean", name: "🧹 Прибирання", desc: "Прибирання у дідуся", type: "fixed", rate: 15 },
  { id: "area", name: "🏠 Загальна територія", desc: "Прибирання спільної території", type: "fixed", rate: 15 },
  { id: "food", name: "🍲 Доставка їжі", desc: "Принести готову їжу", type: "fixed", rate: 10 },
  { id: "laundry", name: "🧺 Прання", desc: "Прання та заміна білизни", type: "fixed", rate: 15 },
  { id: "walk", name: "🚶 Прогулянка / час", desc: "Прогулянка або час із дідом", type: "hour", rate: 10 },
  { id: "errand", name: "🛒 Супровід / справа", desc: "Поїздка або організаційна справа", type: "hour", rate: 10 },
  { id: "physical", name: "🔨 Фізична робота", desc: "Додаткова фізична робота", type: "hour", rate: 15 }
];

const AVATAR_IDS = ["grandpa", "roma", "nastya"];

const state = {
  user: null,
  profile: null,
  isAdmin: false,
  tasks: [],
  mine: [],
  allEntries: [],
  members: [],
  selectedTask: null,
  historyFilter: "all",
  adminTab: "members",
  reportPeriod: "month",
  onboardingAvatar: null
};

const $ = (id) => document.getElementById(id);
const money = (value) =>
  Number(value || 0).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

function dateObject(value) {
  if (!value) return new Date();
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDate(value, withYear = false) {
  const d = dateObject(value);
  return d.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    ...(withYear ? { year: "numeric" } : {})
  });
}

function formatDateTime(value) {
  const d = dateObject(value);
  return d.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}

function showFormError(id, message) {
  const el = $(id);
  el.textContent = message;
  el.hidden = false;
}

function hideFormError(id) {
  const el = $(id);
  el.textContent = "";
  el.hidden = true;
}

/* ---------- Stylized SVG avatars ---------- */

function svgData(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarSvg(id) {
  if (id === "grandpa") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#806047"/><stop offset="1" stop-color="#30251e"/></linearGradient></defs>
      <rect width="240" height="240" rx="120" fill="url(#bg)"/>
      <path d="M63 78c5-39 35-57 59-57 31 0 57 17 64 51l-16 9H78z" fill="#ece7dd"/>
      <path d="M62 87c2-36 30-56 62-56 32 0 56 19 61 51l-12 10-99-5z" fill="#f4f0e8"/>
      <ellipse cx="120" cy="123" rx="59" ry="70" fill="#c79f7a"/>
      <path d="M74 119c4-12 16-19 31-19s25 7 29 17c-10-4-19-6-30-6-12 0-20 2-30 8z" fill="#eee9df"/>
      <path d="M126 111c4-9 14-14 27-13 11 1 20 7 24 16-13-6-26-7-51-3z" fill="#eee9df"/>
      <path d="M89 125h32v16H89zm30 0h33v16h-33z" fill="none" stroke="#40362e" stroke-width="5"/>
      <path d="M119 132h-5" stroke="#40362e" stroke-width="5" stroke-linecap="round"/>
      <circle cx="105" cy="133" r="4" fill="#3b3028"/><circle cx="139" cy="133" r="4" fill="#3b3028"/>
      <path d="M111 151c8 5 16 5 25 0" fill="none" stroke="#76513e" stroke-width="4" stroke-linecap="round"/>
      <path d="M92 174c8 13 19 20 29 20s22-7 29-20l-6 30H96z" fill="#e8e0d2"/>
      <path d="M53 240c4-47 28-61 67-61s64 14 67 61" fill="#56694f"/>
      <path d="M46 91c-5 19 0 38 13 49" fill="none" stroke="#f4f0e8" stroke-width="12" stroke-linecap="round"/>
    </svg>`;
  }
  if (id === "roma") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b684f"/><stop offset="1" stop-color="#26332f"/></linearGradient></defs>
      <rect width="240" height="240" rx="120" fill="url(#bg)"/>
      <path d="M54 107c-1-54 30-80 69-80 40 0 66 30 63 80l-16 34H72z" fill="#6e5548"/>
      <ellipse cx="120" cy="126" rx="58" ry="69" fill="#e3bd9d"/>
      <path d="M63 102c8-39 34-61 67-61 31 0 48 17 58 44-23-9-42-17-68-17-20 0-39 8-57 34z" fill="#7c5e4d"/>
      <path d="M69 91c17 4 35 3 52-3 17-6 35-16 55-17-11-19-30-29-53-29-27 0-48 17-54 49z" fill="#866552"/>
      <ellipse cx="98" cy="128" rx="4" ry="5" fill="#3b2e29"/><ellipse cx="143" cy="128" rx="4" ry="5" fill="#3b2e29"/>
      <path d="M95 115c8-4 16-4 23 0M132 115c8-4 16-4 23 0" fill="none" stroke="#6a4e40" stroke-width="3" stroke-linecap="round"/>
      <path d="M106 158c9 5 20 5 29 0" fill="none" stroke="#9c6659" stroke-width="4" stroke-linecap="round"/>
      <path d="M53 240c7-45 31-65 67-65 39 0 61 20 67 65" fill="#273b39"/>
      <path d="M71 82c-9 16-10 35-7 52" fill="none" stroke="#624b40" stroke-width="11" stroke-linecap="round"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a56b54"/><stop offset="1" stop-color="#3c2b2c"/></linearGradient></defs>
    <rect width="240" height="240" rx="120" fill="url(#bg)"/>
    <path d="M57 112c-5-46 23-76 63-76 41 0 69 31 62 83l-20 37H75z" fill="#b86e52"/>
    <path d="M72 69c20-20 47-26 74-15 21 8 34 27 36 49-20-20-35-26-58-24-19 2-36 10-52 27-7-12-7-24 0-37z" fill="#c2785a"/>
    <ellipse cx="120" cy="128" rx="55" ry="67" fill="#f0c9ad"/>
    <ellipse cx="98" cy="128" rx="4" ry="5" fill="#3b2e29"/><ellipse cx="143" cy="128" rx="4" ry="5" fill="#3b2e29"/>
    <path d="M91 115c8-5 16-5 24 0M132 115c8-5 16-5 24 0" fill="none" stroke="#8f5c4c" stroke-width="3" stroke-linecap="round"/>
    <path d="M106 159c9 5 20 5 29 0" fill="none" stroke="#b96f72" stroke-width="4" stroke-linecap="round"/>
    <path d="M58 240c6-45 31-65 63-65 36 0 62 20 66 65" fill="#46565d"/>
    <path d="M73 69c-12 25-11 53-3 78M167 66c10 27 11 52 2 79" fill="none" stroke="#c2785a" stroke-width="12" stroke-linecap="round"/>
    <path d="M84 58c-7 28-4 57 8 80M156 58c7 28 4 57-8 80" fill="none" stroke="#d78a69" stroke-width="7" stroke-linecap="round"/>
  </svg>`;
}

const AVATARS = {
  grandpa: { id: "grandpa", label: "Дідусь", svg: avatarSvg("grandpa") },
  roma: { id: "roma", label: "Рома", svg: avatarSvg("roma") },
  nastya: { id: "nastya", label: "Настя", svg: avatarSvg("nastya") }
};

function avatarStyle(id) {
  const avatar = AVATARS[id] || AVATARS.roma;
  return `background-image:url("${svgData(avatar.svg)}")`;
}

function renderAvatar(el, id) {
  if (!el) return;
  el.style.backgroundImage = `url("${svgData((AVATARS[id] || AVATARS.roma).svg)}")`;
  el.innerHTML = "";
}

function initials(name) {
  const parts = String(name || "П").trim().split(/\s+/);
  return (parts[0]?.[0] || "П").toUpperCase();
}

/* ---------- Navigation ---------- */

function setScreen(name) {
  const target = $(`screen-${name}`);
  if (!target) return;

  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  target.classList.add("active");

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === name);
  });

  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "home") renderHome();
  if (name === "tasks") renderTasks();
  if (name === "history") renderHistory();
  if (name === "reports") renderReports();
  if (name === "profile") renderProfile();
  if (name === "admin") renderAdmin();
}

function openMenu() {
  $("sideMenu").classList.add("open");
  $("sideMenu").setAttribute("aria-hidden", "false");
}

function closeMenu() {
  $("sideMenu").classList.remove("open");
  $("sideMenu").setAttribute("aria-hidden", "true");
}

/* ---------- Auth ---------- */

function authMode(mode) {
  $("loginPanel").hidden = mode !== "login";
  $("registerPanel").hidden = mode !== "register";
  hideFormError("loginError");
  hideFormError("registerError");
}

async function login() {
  hideFormError("loginError");
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  if (!email || !password) {
    showFormError("loginError", "Введіть E-Mail і пароль.");
    return;
  }
  try {
    $("loginButton").disabled = true;
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    const message = error.code === "auth/invalid-credential"
      ? "Неправильний E-Mail або пароль."
      : error.code === "auth/too-many-requests"
        ? "Забагато спроб. Спробуйте пізніше."
        : "Не вдалося виконати вхід.";
    showFormError("loginError", message);
  } finally {
    $("loginButton").disabled = false;
  }
}

async function register() {
  hideFormError("registerError");

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const password2 = $("registerPassword2").value;

  if (!name || !email || password.length < 6 || password !== password2) {
    showFormError("registerError", "Перевірте ім'я, E-Mail і пароль. Пароль — мінімум 6 символів.");
    return;
  }

  try {
    $("registerButton").disabled = true;
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    await setDoc(doc(membersRef, credential.user.uid), {
      name,
      email,
      role: "participant",
      active: true,
      avatarId: "",
      createdAt: serverTimestamp()
    });

    state.onboardingAvatar = null;
    showToast("Акаунт створено. Оберіть аватар.");
  } catch (error) {
    const message = error.code === "auth/email-already-in-use"
      ? "Цей E-Mail уже зареєстрований."
      : error.code === "auth/invalid-email"
        ? "Перевірте формат E-Mail."
        : "Не вдалося створити акаунт.";
    showFormError("registerError", message);
  } finally {
    $("registerButton").disabled = false;
  }
}

/* ---------- Firestore ---------- */

async function loadProfile() {
  const snapshot = await getDoc(doc(membersRef, state.user.uid));

  if (snapshot.exists()) {
    state.profile = { id: snapshot.id, ...snapshot.data() };
  } else {
    state.profile = {
      id: state.user.uid,
      name: state.user.displayName || state.user.email || "Учасник",
      email: state.user.email || "",
      role: state.isAdmin ? "admin" : "participant",
      active: true,
      avatarId: ""
    };

    await setDoc(doc(membersRef, state.user.uid), {
      name: state.profile.name,
      email: state.profile.email,
      role: state.profile.role,
      active: true,
      avatarId: "",
      createdAt: serverTimestamp()
    });
  }

  state.isAdmin = state.user.uid === ADMIN_UID || state.profile.role === "admin";
}

async function ensureDefaultTasks() {
  const snapshot = await getDocs(tasksRef);
  if (!snapshot.empty) return;

  // Only the administrator creates the initial fixed task set.
  if (!state.isAdmin) return;

  await Promise.all(DEFAULT_TASKS.map((task) =>
    setDoc(doc(tasksRef, task.id), {
      ...task,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    })
  ));
}

async function loadData() {
  const [taskSnapshot, entrySnapshot] = await Promise.all([
    getDocs(tasksRef),
    getDocs(entriesRef)
  ]);

  state.tasks = taskSnapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((task) => task.active !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "uk"));

  const entries = entrySnapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => dateObject(b.date || b.createdAt) - dateObject(a.date || a.createdAt));

  state.mine = entries.filter((entry) => entry.uid === state.user.uid);
  state.allEntries = state.isAdmin ? entries : [];

  if (state.isAdmin) {
    const memberSnapshot = await getDocs(membersRef);
    state.members = memberSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "uk"));
  } else {
    state.members = [];
  }
}

/* ---------- Rendering ---------- */

function taskParts(task) {
  const iconMatch = String(task.name || "").match(/^(\S+)\s+(.*)$/);
  return {
    icon: iconMatch ? iconMatch[1] : "✓",
    label: iconMatch ? iconMatch[2] : task.name || "Завдання"
  };
}

function renderTaskTile(task) {
  const parts = taskParts(task);
  return `<button class="task-tile" data-task-id="${esc(task.id)}">
    <span class="task-icon">${esc(parts.icon)}</span>
    <span><strong>${esc(parts.label)}</strong><small>${esc(task.desc || "")}</small></span>
    <span class="row-end">${money(task.rate)}${task.type === "hour" ? "<small>/год</small>" : ""}</span>
  </button>`;
}

function renderTaskRow(task) {
  const parts = taskParts(task);
  return `<button class="task-row" data-task-id="${esc(task.id)}">
    <span class="task-icon">${esc(parts.icon)}</span>
    <span class="row-main"><strong>${esc(parts.label)}</strong><small>${esc(task.desc || "")}</small></span>
    <span class="row-end">${money(task.rate)}${task.type === "hour" ? "<small>/год</small>" : ""} <span>›</span></span>
  </button>`;
}

function renderWorkRow(entry, showChild = false) {
  const statusClass = entry.paid ? "status-paid" : entry.status === "approved" ? "status-approved" : "status-pending";
  const statusText = entry.paid ? "Виплачено" : entry.status === "approved" ? "Підтверджено" : "Очікує";
  const child = showChild ? `<small>${esc(entry.child || "Учасник")}</small>` : "";
  const hours = entry.hours ? ` · ${entry.hours} год.` : "";
  return `<div class="work-row">
    <span class="task-icon">${esc(taskParts({ name: entry.taskName }).icon)}</span>
    <div class="row-main">
      <strong>${esc(showChild ? (entry.child || entry.taskName) : entry.taskName)}</strong>
      ${showChild ? `<small>${esc(entry.taskName || "")}</small>` : ""}
      ${child}
      <small>${formatDate(entry.date, true)}${hours}</small>
      <span class="work-status ${statusClass}">${statusText}</span>
    </div>
    <div class="row-end">${money(entry.total)}</div>
  </div>`;
}

function renderHome() {
  const total = state.mine.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  $("homeTotal").textContent = money(total);
  $("homeWorkMeta").textContent = `${state.mine.length} ${state.mine.length === 1 ? "виконана робота" : "виконаних робіт"}`;
  $("homeName").textContent = state.profile?.name || "учаснику";

  $("quickTasks").innerHTML = state.tasks.slice(0, 4).map(renderTaskTile).join("") ||
    `<div class="empty"><strong>Завдань поки немає</strong>Адміністратор може додати їх пізніше.</div>`;

  $("homeRecent").innerHTML = state.mine.slice(0, 4).map((entry) => renderWorkRow(entry)).join("") ||
    `<div class="empty"><strong>Історія ще порожня</strong>Додайте першу виконану роботу.</div>`;
}

function renderTasks() {
  $("taskCountBadge").textContent = state.tasks.length;
  $("allTasks").innerHTML = state.tasks.map(renderTaskRow).join("") ||
    `<div class="empty"><strong>Немає активних завдань</strong>Зверніться до адміністратора.</div>`;
}

function renderHistory() {
  let entries = [...state.mine];

  if (state.historyFilter === "paid") entries = entries.filter((entry) => entry.paid);
  if (state.historyFilter === "unpaid") entries = entries.filter((entry) => !entry.paid);

  const total = entries.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  const paid = entries.filter((entry) => entry.paid).reduce((sum, entry) => sum + Number(entry.total || 0), 0);

  $("historySummary").innerHTML = `
    <div class="summary-item"><b>${money(total)}</b><span>Сума у вибраному списку</span></div>
    <div class="summary-item"><b>${money(paid)}</b><span>Вже виплачено</span></div>
  `;

  $("historyList").innerHTML = entries.map((entry) => renderWorkRow(entry)).join("") ||
    `<div class="empty"><strong>Нічого не знайдено</strong>Змініть фільтр або додайте роботу.</div>`;
}

function getReportEntries() {
  if (state.reportPeriod === "all") return [...state.allEntries];
  const now = new Date();
  return state.allEntries.filter((entry) => {
    const d = dateObject(entry.date || entry.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function renderReports() {
  if (!state.isAdmin) return;

  const entries = getReportEntries();
  const total = entries.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  const paid = entries.filter((entry) => entry.paid).reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  const unpaid = total - paid;

  $("reportStats").innerHTML = `
    <div class="stat-card accent"><b>${money(total)}</b><span>Усього</span></div>
    <div class="stat-card"><b>${money(paid)}</b><span>Виплачено</span></div>
    <div class="stat-card"><b>${money(unpaid)}</b><span>До виплати</span></div>
    <div class="stat-card"><b>${entries.length}</b><span>Робіт</span></div>
  `;

  const grouped = new Map();
  entries.forEach((entry) => {
    const d = dateObject(entry.date || entry.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    grouped.set(key, (grouped.get(key) || 0) + Number(entry.total || 0));
  });

  const bars = [...grouped.entries()].slice(-10);
  const max = Math.max(...bars.map(([, value]) => value), 1);
  $("reportBars").innerHTML = bars.length
    ? bars.map(([key, value]) => {
        const [, month, day] = key.split("-");
        return `<div class="bar-col"><div class="bar" style="height:${Math.max(5, value / max * 100)}%"></div><small>${day}.${month}</small></div>`;
      }).join("")
    : `<div class="empty" style="width:100%">Поки немає даних для графіка.</div>`;

  const byMember = new Map();
  entries.forEach((entry) => {
    const key = entry.uid || entry.child || "unknown";
    const old = byMember.get(key) || { name: entry.child || "Учасник", sum: 0, count: 0, paid: 0 };
    old.sum += Number(entry.total || 0);
    old.count += 1;
    if (entry.paid) old.paid += Number(entry.total || 0);
    byMember.set(key, old);
  });

  $("reportMembers").innerHTML = [...byMember.values()].map((member) => `
    <div class="member-row">
      <div class="avatar avatar--sm" style="${avatarStyle(resolveAvatarId(member.name))}"></div>
      <div class="row-main"><strong>${esc(member.name)}</strong><small>${member.count} робіт · виплачено ${money(member.paid)}</small></div>
      <div class="row-end">${money(member.sum)}</div>
    </div>
  `).join("") || `<div class="empty"><strong>Даних ще немає</strong></div>`;
}

function renderProfile() {
  const p = state.profile || {};
  const avatarId = p.avatarId || "roma";

  renderAvatar($("profileAvatar"), avatarId);
  renderAvatar($("homeAvatar"), avatarId);
  renderAvatar($("headerProfileButton"), avatarId);

  $("profileName").textContent = p.name || "Учасник";
  $("profileRole").textContent = state.isAdmin ? "Адміністратор" : "Учасник сім'ї";
  $("profileNameValue").textContent = p.name || "—";
  $("profileEmailValue").textContent = p.email || state.user?.email || "—";
  $("profileRoleValue").textContent = state.isAdmin ? "Адміністратор" : "Учасник";

  const total = state.mine.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  const paid = state.mine.filter((entry) => entry.paid).reduce((sum, entry) => sum + Number(entry.total || 0), 0);

  $("profileStats").innerHTML = `
    <div class="profile-stat"><b>${state.mine.length}</b><span>робіт</span></div>
    <div class="profile-stat"><b>${money(total)}</b><span>зароблено</span></div>
    <div class="profile-stat"><b>${money(paid)}</b><span>виплачено</span></div>
  `;

  $("avatarPicker").innerHTML = AVATAR_IDS.map((id) => `
    <button class="avatar-option ${id === avatarId ? "active" : ""}" data-avatar-id="${id}" aria-label="Аватар ${AVATARS[id].label}">
      <span class="avatar" style="${avatarStyle(id)}"></span>
    </button>
  `).join("");

  $("menuUser").innerHTML = `
    <strong>${esc(p.name || "Учасник")}</strong>
    <small>${esc(p.email || state.user?.email || "")}</small>
  `;
}

function renderAdmin() {
  if (!state.isAdmin) return;

  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === state.adminTab);
  });

  if (state.adminTab === "members") renderAdminMembers();
  if (state.adminTab === "tasks") renderAdminTasks();
  if (state.adminTab === "works") renderAdminWorks();
}

function renderAdminMembers() {
  $("adminPanel").innerHTML = `
    <div class="list-card">
      <div class="section-head"><div><div class="eyebrow">СІМ'Я</div><h2>Учасники (${state.members.length})</h2></div></div>
      <div class="stack">
        ${state.members.map((member) => `
          <div class="member-row">
            <div class="avatar avatar--sm" style="${avatarStyle(member.avatarId || resolveAvatarId(member.name))}"></div>
            <div class="row-main"><strong>${esc(member.name || "Без імені")}</strong><small>${esc(member.email || "")}</small></div>
            <div class="row-end">${member.role === "admin" ? "ADMIN" : member.active === false ? "OFF" : "ON"}</div>
          </div>
        `).join("") || `<div class="empty"><strong>Учасників немає</strong></div>`}
      </div>
    </div>
  `;
}

function renderAdminTasks() {
  $("adminPanel").innerHTML = `
    <div class="list-card">
      <div class="section-head"><div><div class="eyebrow">НОВЕ</div><h2>Додати завдання</h2></div></div>
      <div class="admin-form">
        <input id="newTaskName" maxlength="80" placeholder="Назва, наприклад: 🧹 Прибирання">
        <input id="newTaskDesc" maxlength="140" placeholder="Короткий опис">
        <select id="newTaskType"><option value="fixed">Фіксована сума</option><option value="hour">Погодинна оплата</option></select>
        <input id="newTaskRate" type="number" min="0" step="0.5" value="10" placeholder="Сума, €">
        <button id="createTaskButton" class="btn btn-gold">＋ Створити завдання</button>
      </div>
    </div>
    <div class="list-card">
      <div class="section-head"><div><div class="eyebrow">АКТИВНІ</div><h2>Завдання</h2></div></div>
      <div class="stack">
        ${state.tasks.map((task) => `
          <div class="task-row">
            <span class="task-icon">${esc(taskParts(task).icon)}</span>
            <span class="row-main"><strong>${esc(task.name)}</strong><small>${esc(task.desc || "")}</small></span>
            <span class="row-end">${money(task.rate)}${task.type === "hour" ? "<small>/год</small>" : ""}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  $("createTaskButton")?.addEventListener("click", createTask);
}

function renderAdminWorks() {
  $("adminPanel").innerHTML = `
    <div class="list-card">
      <div class="section-head"><div><div class="eyebrow">ОБЛІК</div><h2>Роботи та виплати</h2></div></div>
      <div class="stack">
        ${state.allEntries.map((entry) => `
          <div class="work-row">
            <span class="task-icon">${esc(taskParts({ name: entry.taskName }).icon)}</span>
            <div class="row-main">
              <strong>${esc(entry.child || "Учасник")}</strong>
              <small>${esc(entry.taskName || "")} · ${formatDateTime(entry.date)}</small>
              <small>База ${money(entry.base)} · бонус ${money(entry.bonus)}</small>
              <span class="work-status ${entry.paid ? "status-paid" : entry.status === "approved" ? "status-approved" : "status-pending"}">
                ${entry.paid ? "Виплачено" : entry.status === "approved" ? "Підтверджено" : "Очікує"}
              </span>
            </div>
            <div class="row-end">${money(entry.total)}</div>
            <div class="admin-action">
              <button class="btn btn-secondary" data-bonus-id="${esc(entry.id)}">Бонус</button>
              <button class="btn ${entry.paid ? "btn-secondary" : "btn-gold"}" data-paid-id="${esc(entry.id)}">${entry.paid ? "Скасувати" : "Виплачено"}</button>
            </div>
          </div>
        `).join("") || `<div class="empty"><strong>Робіт немає</strong></div>`}
      </div>
    </div>
  `;

  document.querySelectorAll("[data-bonus-id]").forEach((button) => {
    button.addEventListener("click", () => setBonus(button.dataset.bonusId));
  });
  document.querySelectorAll("[data-paid-id]").forEach((button) => {
    button.addEventListener("click", () => togglePaid(button.dataset.paidId));
  });
}

/* ---------- Add work ---------- */

function openTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  state.selectedTask = task;
  const parts = taskParts(task);

  $("addTaskIcon").textContent = parts.icon;
  $("addTaskTitle").textContent = parts.label;
  $("addTaskDescription").textContent = task.desc || "";
  $("workDate").value = todayISO();
  $("workNote").value = "";

  const hourly = task.type === "hour";
  $("hoursField").hidden = !hourly;
  $("hoursInput").value = "1";
  updateAddTotal();
  setScreen("add");
}

function updateAddTotal() {
  if (!state.selectedTask) return;
  const hours = state.selectedTask.type === "hour" ? Number($("hoursInput").value || 0) : 1;
  $("addTotal").textContent = money(Number(state.selectedTask.rate || 0) * hours);
}

async function saveWork() {
  if (!state.selectedTask || !state.user || !state.profile) return;

  const task = state.selectedTask;
  const hours = task.type === "hour" ? Number($("hoursInput").value || 0) : null;

  if (task.type === "hour" && (!Number.isFinite(hours) || hours <= 0)) {
    showToast("Вкажіть кількість годин.");
    return;
  }

  const dateValue = $("workDate").value || todayISO();
  const base = Number(task.rate || 0) * (hours || 1);
  const note = $("workNote").value.trim();

  try {
    $("saveWork").disabled = true;

    await addDoc(entriesRef, {
      uid: state.user.uid,
      child: state.profile.name,
      taskId: task.id,
      taskName: task.name,
      hours,
      base,
      bonus: 0,
      total: base,
      paid: false,
      status: "pending",
      date: new Date(`${dateValue}T12:00:00`).toISOString(),
      createdAt: serverTimestamp(),
      ...(note ? { note } : {})
    });

    await refresh();
    setScreen("home");
    showToast(`Роботу додано: ${money(base)}`);
  } catch (error) {
    console.error(error);
    showToast("Не вдалося зберегти роботу. Перевірте правила Firestore.");
  } finally {
    $("saveWork").disabled = false;
  }
}

/* ---------- Profile ---------- */

function resolveAvatarId(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("наст") || normalized.includes("nast")) return "nastya";
  if (normalized.includes("ром") || normalized.includes("rom")) return "roma";
  if (normalized.includes("волод") || normalized.includes("grand")) return "grandpa";
  return "roma";
}

async function selectAvatar(avatarId, onboarding = false) {
  if (!AVATARS[avatarId] || !state.user) return;

  if (onboarding) {
    state.onboardingAvatar = avatarId;
    renderOnboardingAvatars();
    $("finishAvatarButton").disabled = false;
    return;
  }

  try {
    await updateDoc(doc(membersRef, state.user.uid), { avatarId });
    state.profile.avatarId = avatarId;
    renderProfile();
    showToast("Аватар оновлено.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося зберегти аватар.");
  }
}

function renderOnboardingAvatars() {
  $("onboardingAvatarPicker").innerHTML = AVATAR_IDS.map((id) => `
    <button class="avatar-option ${id === state.onboardingAvatar ? "active" : ""}" data-onboard-avatar="${id}">
      <span class="avatar" style="${avatarStyle(id)}"></span>
    </button>
  `).join("");

  document.querySelectorAll("[data-onboard-avatar]").forEach((button) => {
    button.addEventListener("click", () => selectAvatar(button.dataset.onboardAvatar, true));
  });
}

async function finishAvatarOnboarding() {
  if (!state.onboardingAvatar) return;

  try {
    await updateDoc(doc(membersRef, state.user.uid), { avatarId: state.onboardingAvatar });
    state.profile.avatarId = state.onboardingAvatar;
    $("avatarOnboarding").hidden = true;
    renderProfile();
    setScreen("home");
    showToast("Профіль готовий.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося зберегти аватар.");
  }
}

async function saveProfileName() {
  const name = $("editNameInput").value.trim();
  if (!name) {
    showToast("Введіть ім'я.");
    return;
  }

  try {
    await Promise.all([
      updateProfile(state.user, { displayName: name }),
      updateDoc(doc(membersRef, state.user.uid), { name })
    ]);
    state.profile.name = name;
    $("profileModal").hidden = true;
    renderProfile();
    renderHome();
    showToast("Ім'я збережено.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося змінити ім'я.");
  }
}

/* ---------- Admin ---------- */

async function createTask() {
  if (!state.isAdmin) return;

  const name = $("newTaskName")?.value.trim();
  const desc = $("newTaskDesc")?.value.trim();
  const type = $("newTaskType")?.value;
  const rate = Number($("newTaskRate")?.value);

  if (!name || !Number.isFinite(rate) || rate < 0) {
    showToast("Вкажіть назву та коректну суму.");
    return;
  }

  try {
    await addDoc(tasksRef, {
      name,
      desc,
      type,
      rate,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: state.user.uid
    });
    await refresh();
    state.adminTab = "tasks";
    renderAdmin();
    showToast("Завдання створено.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося створити завдання.");
  }
}

async function setBonus(entryId) {
  if (!state.isAdmin) return;

  const entry = state.allEntries.find((item) => item.id === entryId);
  if (!entry) return;

  const raw = window.prompt("Бонус у євро:", String(entry.bonus || 0));
  if (raw === null) return;

  const bonus = Number(raw);
  if (!Number.isFinite(bonus) || bonus < 0) {
    showToast("Введіть коректну суму бонусу.");
    return;
  }

  try {
    await updateDoc(doc(entriesRef, entryId), {
      bonus,
      total: Number(entry.base || 0) + bonus,
      status: "approved"
    });
    await refresh();
    renderAdmin();
    showToast("Бонус збережено.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося зберегти бонус.");
  }
}

async function togglePaid(entryId) {
  if (!state.isAdmin) return;

  const entry = state.allEntries.find((item) => item.id === entryId);
  if (!entry) return;

  try {
    await updateDoc(doc(entriesRef, entryId), {
      paid: !entry.paid,
      status: "approved"
    });
    await refresh();
    renderAdmin();
    showToast(entry.paid ? "Виплату скасовано." : "Позначено як виплачено.");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося змінити статус виплати.");
  }
}

/* ---------- Report copy ---------- */

async function copyReport() {
  const entries = getReportEntries();
  const total = entries.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  const paid = entries.filter((entry) => entry.paid).reduce((sum, entry) => sum + Number(entry.total || 0), 0);

  const text = [
    "♥ PFLEGE — звіт",
    `📅 ${new Date().toLocaleDateString("uk-UA")}`,
    `💰 Разом: ${money(total)}`,
    `💶 Виплачено: ${money(paid)}`,
    `⏳ До виплати: ${money(total - paid)}`,
    `📋 Робіт: ${entries.length}`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast("Звіт скопійовано — можна вставити у Viber.");
  } catch {
    window.prompt("Скопіюйте звіт:", text);
  }
}

/* ---------- Refresh ---------- */

async function refresh() {
  await ensureDefaultTasks();
  await loadData();
  updateGlobalUI();
  renderHome();
}

function updateGlobalUI() {
  const name = state.profile?.name || "Учасник";
  $("headerGreeting").textContent = name;
  $("menuAdmin").hidden = !state.isAdmin;

  renderAvatar($("headerProfileButton"), state.profile?.avatarId || "roma");
  renderAvatar($("homeAvatar"), state.profile?.avatarId || "roma");

  $("menuUser").innerHTML = `
    <strong>${esc(name)}</strong>
    <small>${esc(state.profile?.email || state.user?.email || "")}</small>
  `;
}

/* ---------- Event listeners ---------- */

$("openRegister").addEventListener("click", () => authMode("register"));
$("backToLogin").addEventListener("click", () => authMode("login"));
$("loginButton").addEventListener("click", login);
$("registerButton").addEventListener("click", register);

$("loginPassword").addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});
$("registerPassword2").addEventListener("keydown", (event) => {
  if (event.key === "Enter") register();
});

$("menuButton").addEventListener("click", openMenu);
$("closeMenu").addEventListener("click", closeMenu);
$("sideBackdrop").addEventListener("click", closeMenu);

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.nav));
});

document.querySelectorAll("[data-menu-nav]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.menuNav));
});

$("headerProfileButton").addEventListener("click", () => setScreen("profile"));
$("addWorkHome").addEventListener("click", () => setScreen("tasks"));
$("seeAllTasks").addEventListener("click", () => setScreen("tasks"));
$("seeHistory").addEventListener("click", () => setScreen("history"));

document.addEventListener("click", (event) => {
  const taskButton = event.target.closest("[data-task-id]");
  if (taskButton) openTask(taskButton.dataset.taskId);

  const avatarButton = event.target.closest("[data-avatar-id]");
  if (avatarButton) selectAvatar(avatarButton.dataset.avatarId);
});

$("backFromAdd").addEventListener("click", () => setScreen("tasks"));
$("hoursMinus").addEventListener("click", () => {
  const value = Math.max(0.25, Number($("hoursInput").value || 1) - 0.25);
  $("hoursInput").value = value.toFixed(2).replace(/\.00$/, "");
  updateAddTotal();
});
$("hoursPlus").addEventListener("click", () => {
  const value = Number($("hoursInput").value || 1) + 0.25;
  $("hoursInput").value = value.toFixed(2).replace(/\.00$/, "");
  updateAddTotal();
});
$("hoursInput").addEventListener("input", updateAddTotal);
$("saveWork").addEventListener("click", saveWork);

document.querySelectorAll("[data-history-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.historyFilter = button.dataset.historyFilter;
    document.querySelectorAll("[data-history-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderHistory();
  });
});

$("reportPeriod").addEventListener("change", () => {
  state.reportPeriod = $("reportPeriod").value;
  renderReports();
});
$("copyReport").addEventListener("click", copyReport);

$("editProfileButton").addEventListener("click", () => {
  $("editNameInput").value = state.profile?.name || "";
  $("profileModal").hidden = false;
});
$("saveProfile").addEventListener("click", saveProfileName);

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", () => {
    $("profileModal").hidden = true;
  });
});

$("logoutButton").addEventListener("click", () => signOut(auth));
$("finishAvatarButton").addEventListener("click", finishAvatarOnboarding);

document.querySelectorAll("[data-admin-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.adminTab = button.dataset.adminTab;
    renderAdmin();
  });
});

/* ---------- Auth state ---------- */

onAuthStateChanged(auth, async (user) => {
  state.user = user;

  if (!user) {
    $("authView").hidden = false;
    $("appView").hidden = true;
    authMode("login");
    return;
  }

  try {
    $("authView").hidden = true;
    $("appView").hidden = false;

    state.isAdmin = user.uid === ADMIN_UID;
    await loadProfile();
    await refresh();

    renderProfile();

    // New users get a mandatory avatar selection step.
    if (!state.profile.avatarId) {
      state.onboardingAvatar = null;
      renderOnboardingAvatars();
      $("avatarOnboarding").hidden = false;
    }

    setScreen("home");
  } catch (error) {
    console.error(error);
    showToast("Не вдалося завантажити дані Firebase.");
  }
});

/* ---------- PWA ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch (error) {
      console.warn("Service Worker registration failed:", error);
    }
  });
}
