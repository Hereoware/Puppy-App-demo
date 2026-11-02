const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const STORE_KEY = "puppy-study-prototype-v2";
const translations = {
  en: {
    intro: "Meet your puppy. Each study day, one of two foods and one of two activities will be shown.",
    title: "Puppy Day", tagline: "A little moment together, every day.", intro: "Meet your puppy and spend a few moments together each day. You’ll see what your puppy ate and how you played, then make a guess about their mood.", nameLabel: "What would you like to name your puppy?", namePlaceholder: "Your puppy’s name", begin: "Meet my puppy", language: "Language", nameRequired: "Please enter a name for your puppy.", greeting: "Good morning, your puppy", beginDay: "Start today’s visit", day: "Day", todayDone: "You’ve already spent time with {name} today! See you tomorrow!", close: "Got it", treatTitle: "A little treat", treatText: "Your puppy has a tasty snack.", playTitle: "Let’s play tug-of-war", playText: "Hold the rope and give it a gentle tug!", feed: "Feed {name}", play: "Play tug-of-war", fed: "Yum! {name} enjoyed the treat.", played: "What a fun game!", continue: "Continue", moodQuestion: "After today’s activities, how do you think {name} feels?", happier: "Happier", sadder: "Sadder", choose: "Choose the feeling that seems right to you.", feedback: "Here’s how {name} feels today", happy: "Happy and wagging!", sad: "A little blue today.", imagine: "Take a moment to picture the scene", imagineText: "Imagine {name} enjoying today’s activities…", seconds: "{n} seconds", complete: "That’s all for today!", completeText: "Thanks for spending time with {name}. Come back tomorrow for another little adventure.", done: "See you tomorrow", idleTitle: "A quiet moment", idleText: "{name} is resting nearby. You can visit again tomorrow.", prototype: "Interactive prototype · Your progress is saved on this device.", changeLanguage: "Language", touchHint: "Touch and hold", status: "Today’s visit is complete", nameEdit: "Use another puppy", restartNote: "This prototype stores one participant on this device. Use your private recovery code to restore this participant on another device."
  },
  zh: {
    intro: "认识这只小狗。每个研究日会展示两种食物中的一种，以及两种活动中的一种。",
    title: "小狗的每一天", tagline: "每天，和它共度一小段时光。", intro: "认识你的小狗，每天花一点时间陪陪它。看看它今天吃了什么、玩了什么，然后猜猜它的心情。", nameLabel: "你想给小狗取什么名字？", namePlaceholder: "小狗的名字", begin: "认识我的小狗", language: "语言", nameRequired: "请先给小狗取个名字。", greeting: "早上好，你的小狗", beginDay: "开始今天的互动", day: "第", todayDone: "你今天已经和{name}互动过了！明天再见吧！", close: "知道了", treatTitle: "来吃点小零食", treatText: "小狗有一份美味的小零食。", playTitle: "来玩拔河吧", playText: "按住绳子，轻轻拉一拉！", feed: "喂{name}", play: "玩拔河", fed: "真香！{name}很喜欢这份零食。", played: "玩得真开心！", continue: "继续", moodQuestion: "今天吃过、玩过之后，你觉得{name}心情怎么样？", happier: "更开心", sadder: "更难过", choose: "选一个最符合你感觉的心情。", feedback: "看看{name}今天的心情", happy: "开心地摇着尾巴！", sad: "今天有一点点低落。", imagine: "花一点时间想象这个场景", imagineText: "想象{name}享受今天的活动……", seconds: "还需{n}秒", complete: "今天就到这里啦！", completeText: "谢谢你陪伴{name}。明天再来开启新的小冒险吧。", done: "明天见", idleTitle: "安静休息一会儿", idleText: "{name}正在旁边休息，明天可以再来看它。", prototype: "交互原型 · 进度保存在此设备上。", changeLanguage: "语言", touchHint: "按住互动", status: "今天的互动已完成", nameEdit: "换一只小狗", restartNote: "原型目前在此设备上保存一位参与者。请妥善保存恢复码，以便换设备后恢复参与者身份。"
  },
  es: {
    intro: "Conoce al cachorro. Cada día del estudio se mostrará uno de dos alimentos y una de dos actividades.",
    title: "Un día con tu cachorro", tagline: "Un ratito juntos cada día.", intro: "Conoce a tu cachorro y pasa unos minutos con él cada día. Verás qué comió y cómo jugaron, y después imaginarás cómo se siente.", nameLabel: "¿Qué nombre quieres ponerle a tu cachorro?", namePlaceholder: "Nombre de tu cachorro", begin: "Conocer a mi cachorro", language: "Idioma", nameRequired: "Escribe un nombre para tu cachorro.", greeting: "Buenos días, tu cachorro", beginDay: "Empezar la visita de hoy", day: "Día", todayDone: "¡Hoy ya pasaste tiempo con {name}! ¡Hasta mañana!", close: "Entendido", treatTitle: "Un pequeño premio", treatText: "Tu cachorro tiene un bocadito delicioso.", playTitle: "¡A jugar al tira y afloja!", playText: "Sujeta la cuerda y tira suavemente.", feed: "Darle de comer a {name}", play: "Jugar al tira y afloja", fed: "¡Qué rico! A {name} le encantó.", played: "¡Qué juego tan divertido!", continue: "Continuar", moodQuestion: "Después de las actividades de hoy, ¿cómo crees que se siente {name}?", happier: "Más feliz", sadder: "Más triste", choose: "Elige el sentimiento que te parezca adecuado.", feedback: "Así se siente {name} hoy", happy: "¡Feliz y moviendo la cola!", sad: "Hoy está un poquito triste.", imagine: "Imagina la escena un momento", imagineText: "Imagina a {name} disfrutando las actividades de hoy…", seconds: "{n} segundos", complete: "¡Eso es todo por hoy!", completeText: "Gracias por pasar tiempo con {name}. Vuelve mañana para otra pequeña aventura.", done: "Hasta mañana", idleTitle: "Un momento tranquilo", idleText: "{name} está descansando cerca. Puedes volver mañana.", prototype: "Prototipo interactivo · El progreso se guarda en este dispositivo.", changeLanguage: "Idioma", touchHint: "Mantén pulsado", status: "La visita de hoy ha terminado", nameEdit: "Elegir otro cachorro", restartNote: "Este prototipo guarda una persona por dispositivo. Guarda tu código privado para restaurar al participante en otro dispositivo."
  }
};
const authCopy = {
  en: { emulator: "Local test mode: submissions are stored only in the emulator on this computer.", recover: "I already have a recovery code", codeTitle: "Save your recovery code", codeText: "Keep this private code somewhere safe. It is the only way to restore this participant on another device.", codeAction: "Copy code", codeSaved: "I saved my code", codeMissing: "Your recovery code is not available in this browser. Create a new one.", makeCode: "Create a new code", recoverTitle: "Restore your participant", codeLabel: "Recovery code", restore: "Restore my puppy", localOnly: "Firebase is not configured. This run is saved only on this device and is not sent to the study database.", saveFailed: "We could not save today’s response. Please stay on this page and try again.", saved: "Response saved securely." },
  zh: { emulator: "本地模拟模式：提交记录只保存在这台电脑的模拟器中。", recover: "我有参与者恢复码", codeTitle: "请保存恢复码", codeText: "请妥善保管此私人代码。换设备恢复同一参与者身份时需要使用它。", codeAction: "复制恢复码", codeSaved: "我已保存恢复码", codeMissing: "此浏览器中没有恢复码，请生成一个新码。", makeCode: "生成新恢复码", recoverTitle: "恢复已有参与者", codeLabel: "参与者恢复码", restore: "恢复我的小狗", localOnly: "Firebase 尚未配置。本次记录仅保存在此设备，不会发送到研究数据库。", saveFailed: "今天的回答暂未保存。请留在此页面并重试。", saved: "回答已安全保存。" },
  es: { emulator: "Modo de prueba local: las respuestas solo se guardan en el emulador de este equipo.", recover: "Ya tengo un código de recuperación", codeTitle: "Guarda tu código de recuperación", codeText: "Guarda este código privado en un lugar seguro. Lo necesitarás para restaurar este participante en otro dispositivo.", codeAction: "Copiar código", codeSaved: "He guardado mi código", codeMissing: "Este navegador no tiene el código. Crea uno nuevo.", makeCode: "Crear código nuevo", recoverTitle: "Restaurar participante", codeLabel: "Código de recuperación", restore: "Restaurar mi cachorro", localOnly: "Firebase no está configurado. Esta sesión solo se guarda en este dispositivo y no se envía a la base de datos.", saveFailed: "No pudimos guardar la respuesta de hoy. Quédate en esta página e inténtalo de nuevo.", saved: "Respuesta guardada de forma segura." }
};
const neutralCopy = {
  en: {
    envTitle: "A day in the puppy’s environment",
    envText: "This puppy has two foods and two activities. Each day includes one food (T) and one activity (A).",
    envFoods: "Foods: carrots and sardines",
    envActivities: "Activities: tug-of-war and fetch",
    envContinue: "Continue to the daily visit",
    treatTitle: "Today’s food · T",
    treatText: "Move the food item into the bowl. It will stay on screen for about 8 seconds.",
    playTitle: "Today’s activity · A",
    playText: "Follow the arrow and interact with the object for about 8 seconds.",
    fed: "Food interaction complete",
    played: "Activity interaction complete",
    moodQuestion: "What E score do you predict for today?",
    choose: "Choose one score from −1 to 10.",
    scoreLabel: "Predicted E score",
    feedback: "Today’s displayed E score",
    imagine: "Review today’s information",
    imagineText: "Take a moment to review the food, activity, and score shown for today.",
    completeText: "Today’s visit is complete. You can return for the next scheduled day.",
    foodArrow: "Drag food to bowl",
    activityArrow: "Drag or pull here",
    secondsRemaining: "{n} seconds remaining",
    fetchTarget: "Bring the disc here",
    tugInstruction: "Hold and pull the loose end of the rope",
    behaviorScore: "E score: {score}",
    prototype: "Interactive prototype."
  },
  zh: {
    envTitle: "认识小狗的生活环境",
    envText: "这只小狗有两种食物和两种活动。每天会出现一种食物（T）和一种活动（A）。",
    envFoods: "食物：胡萝卜和沙丁鱼",
    envActivities: "活动：拔河和捡球",
    envContinue: "继续今天的访问",
    treatTitle: "今天的食物 · T",
    treatText: "把食物拖到狗盆里。互动会持续约 8 秒。",
    playTitle: "今天的活动 · A",
    playText: "按照箭头提示操作物品，互动约 8 秒。",
    fed: "食物互动完成",
    played: "活动互动完成",
    moodQuestion: "你预测今天的 E 分数是多少？",
    choose: "请选择 −1 到 10 之间的一个分数。",
    scoreLabel: "预测的 E 分数",
    feedback: "今天展示的 E 分数",
    imagine: "回顾今天的信息",
    imagineText: "请花一点时间回顾今天展示的食物、活动和分数。",
    completeText: "今天的访问已完成。请在下一个安排日期再回来。",
    foodArrow: "把食物拖到狗盆里",
    activityArrow: "拖动或拉动这里",
    secondsRemaining: "还剩 {n} 秒",
    fetchTarget: "把飞盘拖到这里",
    tugInstruction: "按住绳子另一端并拖动",
    behaviorScore: "E 分数：{score}",
    prototype: "交互原型。"
  },
  es: {
    envTitle: "El entorno del cachorro",
    envText: "Este cachorro tiene dos alimentos y dos actividades. Cada día incluye un alimento (T) y una actividad (A).",
    envFoods: "Alimentos: zanahorias y sardinas",
    envActivities: "Actividades: tira y afloja y buscar",
    envContinue: "Continuar con la visita de hoy",
    treatTitle: "Alimento de hoy · T",
    treatText: "Arrastra el alimento hasta el cuenco. La interacción durará unos 8 segundos.",
    playTitle: "Actividad de hoy · A",
    playText: "Sigue la flecha e interactúa con el objeto durante unos 8 segundos.",
    fed: "Interacción con alimento completada",
    played: "Interacción con actividad completada",
    moodQuestion: "¿Qué puntuación E predices para hoy?",
    choose: "Elige una puntuación de −1 a 10.",
    scoreLabel: "Puntuación E predicha",
    feedback: "Puntuación E mostrada hoy",
    imagine: "Revisa la información de hoy",
    imagineText: "Revisa el alimento, la actividad y la puntuación de hoy.",
    completeText: "La visita de hoy ha terminado. Vuelve el próximo día programado.",
    foodArrow: "Arrastra la comida al cuenco",
    activityArrow: "Arrastra o tira aquí",
    secondsRemaining: "Quedan {n} segundos",
    fetchTarget: "Trae el disco aquí",
    tugInstruction: "Mantén pulsado y tira del extremo libre de la cuerda",
    behaviorScore: "Puntuación E: {score}",
    prototype: "Prototipo interactivo."
  }
};
function ac(key) { return authCopy[language][key]; }
let pendingRecoveryCode = null;
let firebaseDataPromise = null;
function isPostgresTrial() {
  const host = window.location.hostname;
  const localNetworkHost = host === "localhost" || host === "127.0.0.1" || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  return localNetworkHost && new URLSearchParams(window.location.search).get("backend") === "postgres";
}
function hasFirebaseConfig() { if (isPostgresTrial()) return false; const c = window.PUPPY_FIREBASE_CONFIG; return Boolean(c?.emulatorMode || (c?.apiKey && c?.authDomain && c?.projectId && c?.appId && c?.dataCollectionEnabled === true)); }
function dataNotice() { const c = window.PUPPY_FIREBASE_CONFIG; if (isPostgresTrial()) return language === "zh" ? "本地试验：记录保存到此电脑的 PostgreSQL 数据库。" : language === "es" ? "Prueba local: las respuestas se guardan en PostgreSQL en este equipo." : "Local trial: responses save to PostgreSQL on this computer."; if (c?.emulatorMode) return ac("emulator"); if (!hasFirebaseConfig()) return ac("localOnly"); return ""; }
async function postgresRequest(path, body) {
  const response = await fetch(`/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || ac("saveFailed"));
  return result;
}
function firebaseData() { firebaseDataPromise ||= import("./firebase-data.js"); return firebaseDataPromise; }
let state = loadState();
let timer = null;
let idleTimer = null;
let language = state?.language || "en";
let feedDone = false;
let playDone = false;

function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; } }
function todayKey() { return new Date().toLocaleDateString("en-CA"); }
function studyDay() { if (!state?.enrolledDate) return 1; return Math.max(1, Math.floor((new Date(todayKey()) - new Date(state.enrolledDate)) / 86400000) + 1); }
function saveState() { if (state) localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
if (state && state.environmentIntroSeen === undefined) { state.environmentIntroSeen = true; saveState(); }
function t(key, vars = {}) { return (neutralCopy[language]?.[key] || translations[language][key] || translations.en[key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ""); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function puppy(name, idle = false, score = state?.currentTrial?.e ?? state?.actualEScore ?? 5) {
  const safeScore = Number.isFinite(Number(score)) ? Math.max(-1, Math.min(10, Number(score))) : 5;
  const hearts = Math.max(0, Math.min(4, Math.round((safeScore + 1) / 3)));
  return `<div class="puppy-stage ${idle ? "idle-scene" : ""}" aria-label="${escapeHtml(name)} the puppy">
    <div class="sun-glow"></div><div class="ground-shadow"></div>
    <div class="dog ${idle ? "dog-idle" : "dog-arrive"} score-${safeScore >= 9 ? "jump" : safeScore >= 6 ? "high" : safeScore >= 3 ? "mid" : "low"}" style="--tail-wag-angle:${Math.max(0, (safeScore + 1) * 3)}deg" aria-hidden="true">
      <span class="tail"></span><span class="body"></span><span class="leg leg-a"></span><span class="leg leg-b"></span>
      <span class="ear ear-left"></span><span class="ear ear-right"></span><span class="head"></span><span class="muzzle"></span>
      <span class="eye eye-left"></span><span class="eye eye-right"></span><span class="nose"></span><span class="mouth"></span>
      <span class="cheek cheek-left"></span><span class="cheek cheek-right"></span>
    </div><span class="score-hearts" aria-hidden="true">${"♥".repeat(hearts)}</span><span class="sparkle sparkle-a">✦</span><span class="sparkle sparkle-b">✦</span>
  </div>`;
}
function languagePicker() { return `<label class="language-picker"><span>${t("language")}</span><select id="language-select" aria-label="${t("language")}"><option value="en" ${language === "en" ? "selected" : ""}>English</option><option value="zh" ${language === "zh" ? "selected" : ""}>中文</option><option value="es" ${language === "es" ? "selected" : ""}>Español</option></select></label>`; }
function bindLanguage() { document.querySelector("#language-select")?.addEventListener("change", e => { language = e.target.value; if (state) { state.language = language; saveState(); } render(); }); }
function render() {
  if (state?.completedToday && state.completedDate !== todayKey()) { state.completedToday = false; state.screen = "home"; feedDone = false; playDone = false; state.actualMood = null; state.prediction = null; state.predictedEScore = null; state.currentTrial = null; state.interactions = { fed: false, played: false }; state.requestId = null; saveState(); }
  if (state && !state.environmentIntroSeen && state.screen === "home") state.screen = "environment-intro";
  document.documentElement.lang = language === "zh" ? "zh-CN" : language === "es" ? "es" : "en";
  if (!state) return renderOnboarding();
  if (state.completedToday) return renderLocked();
  if (state.screen === "recovery-setup") return renderRecoverySetup();
  if (state.screen === "recovery-login") return renderRecoveryLogin();
  if (state.screen === "environment-intro") return renderEnvironmentIntro();
  if (state.screen === "activities") {
    if (state.currentTrial?.day !== studyDay()) return loadTrialForDay().then(render).catch((error) => { state.screen = "home"; saveState(); render(); showToast(error.message); });
    return renderActivities();
  }
  if (state.screen === "question") return renderQuestion();
  if (state.screen === "feedback") return renderFeedback();
  if (state.screen === "imagine") return renderImagine();
  if (state.screen === "complete") return renderComplete();
  renderHome();
}
function renderOnboarding() {
  app.innerHTML = `<div class="topbar">${languagePicker()}</div><section class="welcome-screen">
    <div class="hero-copy"><p class="eyebrow">${t("title")}</p><h1>${t("tagline")}</h1><p>${t("intro")}</p></div>
    ${puppy("your puppy")}
    <form id="name-form" class="name-card"><label for="puppy-name">${t("nameLabel")}</label><input id="puppy-name" name="name" maxlength="24" autocomplete="nickname" placeholder="${t("namePlaceholder")}" required /><button class="button button-primary" type="submit">${t("begin")}</button><p class="small-note">${t("restartNote")}</p><button id="recovery-link" class="text-button" type="button">${ac("recover")}</button></form>
    <p class="prototype-note">${t("prototype")} ${dataNotice()}</p></section>`;
  bindLanguage();
  document.querySelector("#name-form").addEventListener("submit", async e => {
    e.preventDefault(); const name = document.querySelector("#puppy-name").value.trim(); if (!name) return;
    const button = e.currentTarget.querySelector("button[type=submit]"); button.disabled = true;
    try {
      if (isPostgresTrial()) {
        const profile = await postgresRequest("participants", { puppyName: name });
        state = { participantId: profile.participantId, postgresParticipant: true, assignedVersion: profile.assignedVersion, puppyName: profile.puppyName, language, screen: "environment-intro", environmentIntroSeen: false, completedToday: false, enrolledDate: profile.enrolledDate || todayKey(), interactions: { fed: false, played: false }, localOnly: true };
      } else if (hasFirebaseConfig()) {
        const profile = await (await firebaseData()).enrollParticipant(name);
        state = { participantId: profile.uid, firebaseUid: profile.uid, puppyName: profile.puppyName, language, screen: "recovery-setup", environmentIntroSeen: false, completedToday: false, enrolledDate: profile.enrolledOn, interactions: { fed: false, played: false } };
        pendingRecoveryCode = profile.recoveryCode;
      } else {
        state = { participantId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, puppyName: name, language, screen: "environment-intro", environmentIntroSeen: false, completedToday: false, enrolledDate: todayKey(), lastVisit: todayKey(), interactions: { fed: false, played: false }, localOnly: true };
      }
      saveState(); render();
    } catch (error) { console.error("Participant enrollment failed", error); showToast(error.message || ac("saveFailed")); button.disabled = false; }
  });
  document.querySelector("#recovery-link").addEventListener("click", renderRecoveryLogin);
}
function renderEnvironmentIntro() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span>${languagePicker()}</header><section class="environment-intro">
    <p class="eyebrow">${t("title")}</p><h1>${t("envTitle")}</h1><p class="body-copy">${t("envText")}</p>
    <div class="environment-scene intro-scene">
      <span class="scene-prop prop-food-bag" aria-label="food bag">🛍️</span><span class="scene-prop prop-bowl" aria-label="dog bowl">🥣</span>
      <span class="scene-prop prop-rope" aria-label="tug toy">🪢</span><span class="scene-prop prop-disc" aria-label="frisbee">🥏</span>
      ${puppy(state.puppyName, true, -1)}
    </div>
    <div class="environment-labels"><p>${t("envFoods")}</p><p>${t("envActivities")}</p></div>
    <button id="environment-continue" class="button button-primary button-wide">${t("envContinue")}</button>
  </section>`;
  bindLanguage();
  document.querySelector("#environment-continue").addEventListener("click", () => { state.environmentIntroSeen = true; state.screen = "home"; saveState(); render(); });
}
function renderHome() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span>${languagePicker()}</header><section class="home-screen">
    <div class="hero-copy"><p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("greeting")}, <span>${escapeHtml(state.puppyName)}</span>!</h1><p>${t("tagline")}</p></div>
    ${puppy(state.puppyName)}<button id="start-visit" class="button button-primary button-wide">${t("beginDay")}</button><p class="prototype-note">${t("prototype")} ${dataNotice()}</p></section>`;
  bindLanguage(); document.querySelector("#start-visit").addEventListener("click", () => { state.screen = "activities"; saveState(); render(); });
}
async function loadTrialForDay() {
  const day = studyDay();
  if (isPostgresTrial() && state.postgresParticipant) {
    const response = await fetch(`/api/participants/${encodeURIComponent(state.participantId)}/trials/${day}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || ac("saveFailed"));
    state.currentTrial = result;
  } else {
    // Demonstration values only. Research order assignment is supplied by the local API.
    const previewScores = [-1, 1, 3, 5, 6, 8, 9, 10];
    state.currentTrial = { day, t: day % 2, a: day <= 12 ? 1 : 0, e: previewScores[(day - 1) % previewScores.length] };
  }
  state.actualEScore = state.currentTrial.e;
  saveState();
}
function foodName(trial = state.currentTrial) {
  const mapped = language === "zh" ? (trial?.t === 1 ? "胡萝卜" : "沙丁鱼") : language === "es" ? (trial?.t === 1 ? "zanahorias" : "sardinas") : (trial?.t === 1 ? "carrots" : "sardines");
  const uploaded = trial?.tLabel;
  if (!uploaded) return mapped;
  if (["胡萝卜", "沙丁鱼"].includes(uploaded)) return mapped;
  if (uploaded.toLowerCase() === "carrot" || uploaded.toLowerCase() === "sardine") return language === "zh" ? mapped : language === "es" ? mapped : `${uploaded}${uploaded === "carrot" ? "s" : "s"}`;
  return uploaded;
}
function activityName(trial = state.currentTrial) {
  const mapped = language === "zh" ? (trial?.a === 1 ? "拔河" : "捡球") : language === "es" ? (trial?.a === 1 ? "tira y afloja" : "buscar") : (trial?.a === 1 ? "tug-of-war" : "fetch");
  const uploaded = trial?.aLabel;
  if (!uploaded) return mapped;
  if (["拔河", "捡球"].includes(uploaded)) return mapped;
  const value = uploaded.toLowerCase();
  if (["tug-of-war", "tug of war", "fetch", "toss and catch"].includes(value)) return mapped;
  return uploaded;
}
function renderActivities() {
  feedDone = Boolean(state.interactions?.fed); playDone = Boolean(state.interactions?.played);
  const trial = state.currentTrial;
  const food = foodName(trial);
  const activity = activityName(trial);
  const foodIcon = trial.t === 1 ? "🥕" : "🐟";
  const activityIsTug = trial.a === 1;
  const activityIcon = activityIsTug ? "🪢" : "🥏";
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 1 / 3</span></header><section class="activity-screen">
    <div class="activity-heading"><p class="eyebrow">${t("day")} ${studyDay()} · T + A</p><h1>${escapeHtml(state.puppyName)}’s day</h1><p>${t("treatText")} ${t("playText")}</p></div>
    <div id="phaser-scene-mount" class="phaser-scene-mount" data-phaser-pending="true" data-phaser-scene="daily-yard" aria-label="Puppy interaction scene">
      <div class="environment-scene daily-scene"><span class="scene-prop prop-food-bag" aria-hidden="true">🛍️</span><span class="scene-prop prop-bowl" aria-hidden="true">🥣</span><span class="scene-prop prop-rope" aria-hidden="true">🪢</span><span class="scene-prop prop-disc" aria-hidden="true">🥏</span><span class="scene-prop prop-bed" aria-hidden="true">🛏️</span>${puppy(state.puppyName, false, trial.e)}</div>
    </div>
    <article class="activity-card interaction-card"><div><p class="eyebrow">T · ${escapeHtml(food)}</p><h2>${t("treatTitle")}</h2><p>${t("treatText")}</p></div>
      <div class="food-playground"><span class="interaction-arrow" aria-hidden="true">👇</span><button id="food-token" class="drag-token food-token" type="button" aria-label="${t("foodArrow")}" ${feedDone ? "disabled" : ""}>${foodIcon}</button><div id="food-bowl-target" class="food-bowl-target" role="img" aria-label="Dog food bowl">🥣</div></div>
      <div class="interaction-meter"><span id="food-fill"></span></div><small id="food-status" class="interaction-status" aria-live="polite">${feedDone ? t("fed") : t("foodArrow")}</small></article>
    <article class="activity-card interaction-card"><div><p class="eyebrow">A · ${escapeHtml(activity)}</p><h2>${t("playTitle")}</h2><p>${t("playText")}</p></div>
      <div class="activity-playground ${activityIsTug ? "is-tug" : "is-fetch"}"><span class="activity-dog-target" id="activity-dog-target" aria-hidden="true">🐶</span><span class="rope-line" aria-hidden="true">〰〰〰〰〰</span><button id="activity-token" class="drag-token activity-token" type="button" aria-label="${t("activityArrow")}" ${playDone ? "disabled" : ""}>${playDone ? "✓" : activityIcon}</button><span class="interaction-arrow activity-arrow" aria-hidden="true">👆</span></div>
      <div class="interaction-meter"><span id="activity-fill"></span></div><small id="activity-status" class="interaction-status" aria-live="polite">${playDone ? t("played") : activityIsTug ? t("tugInstruction") : t("fetchTarget")}</small></article>
    <button id="activities-next" class="button button-primary button-wide" ${feedDone && playDone ? "" : "disabled"}>${t("continue")}</button></section>`;
  const foodToken = document.querySelector("#food-token");
  foodToken.addEventListener("pointerdown", startFoodDrag); foodToken.addEventListener("pointermove", moveFoodDrag); foodToken.addEventListener("pointerup", finishFoodDrag); foodToken.addEventListener("pointercancel", resetFoodDrag);
  const activityToken = document.querySelector("#activity-token");
  activityToken.addEventListener("pointerdown", startActivityDrag); activityToken.addEventListener("pointermove", moveActivityDrag); activityToken.addEventListener("pointerup", finishActivityDrag); activityToken.addEventListener("pointercancel", cancelActivityDrag);
  document.querySelector("#activities-next").addEventListener("click", () => { if (feedDone && playDone) { state.screen = "question"; saveState(); render(); } });
  window.dispatchEvent(new CustomEvent("puppy:phaser-mount", { detail: { mount: document.querySelector("#phaser-scene-mount"), trial, onFoodComplete: () => completeInteraction("fed", 8000), onActivityComplete: () => completeInteraction("played", 8000) } }));
}
const INTERACTION_MS = 8000;
let interactionStartedAt = 0;
let interactionKind = null;
let dragStart = null;
let dragDistance = 0;
function updateInteractionProgress(fillId, statusId, startedAt, frameId) {
  const elapsed = Math.min(INTERACTION_MS, performance.now() - startedAt);
  const fill = document.getElementById(fillId);
  if (fill) fill.style.width = `${elapsed / INTERACTION_MS * 100}%`;
  const statusNode = document.getElementById(statusId);
  if (statusNode) statusNode.textContent = t("secondsRemaining", { n: Math.ceil((INTERACTION_MS - elapsed) / 1000) });
  if (elapsed >= INTERACTION_MS) {
    if (frameId === "tug-progress") {
      if (dragDistance >= 24) completeInteraction("played", INTERACTION_MS);
      else { interactionKind = null; if (statusNode) statusNode.textContent = t("tugInstruction"); }
    } else completeInteraction(frameId, INTERACTION_MS);
    return;
  }
  timer = setTimeout(() => updateInteractionProgress(fillId, statusId, startedAt, frameId), 100);
}
function startFoodDrag(event) {
  if (feedDone || interactionKind) return;
  event.preventDefault();
  dragStart = { x: event.clientX, y: event.clientY, left: event.currentTarget.offsetLeft, top: event.currentTarget.offsetTop };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.classList.add("is-dragging");
  document.querySelector(".food-playground")?.classList.add("is-food-dragging");
}
function moveFoodDrag(event) {
  if (!dragStart) return;
  event.currentTarget.style.transform = `translate(${event.clientX - dragStart.x}px, ${event.clientY - dragStart.y}px)`;
}
function finishFoodDrag(event) {
  if (!dragStart) return;
  const bowl = document.querySelector("#food-bowl-target");
  const bounds = bowl?.getBoundingClientRect();
  const hitPadding = 22;
  const droppedInBowl = bounds && event.clientX >= bounds.left - hitPadding && event.clientX <= bounds.right + hitPadding && event.clientY >= bounds.top - hitPadding && event.clientY <= bounds.bottom + hitPadding;
  dragStart = null;
  event.currentTarget.classList.remove("is-dragging");
  document.querySelector(".food-playground")?.classList.remove("is-food-dragging");
  if (!droppedInBowl) { event.currentTarget.style.transform = ""; return; }
  event.currentTarget.style.transform = "";
  event.currentTarget.classList.add("food-in-bowl");
  interactionKind = "fed";
  interactionStartedAt = performance.now();
  updateInteractionProgress("food-fill", "food-status", interactionStartedAt, "fed");
}
function resetFoodDrag(event) { dragStart = null; event.currentTarget.style.transform = ""; event.currentTarget.classList.remove("is-dragging"); document.querySelector(".food-playground")?.classList.remove("is-food-dragging"); }
function startActivityDrag(event) {
  if (playDone || interactionKind) return;
  event.preventDefault();
  dragStart = { x: event.clientX, y: event.clientY, lastX: event.clientX };
  dragDistance = 0;
  interactionStartedAt = performance.now();
  interactionKind = state.currentTrial.a === 1 ? "tug" : "fetch-drag";
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.classList.add("is-dragging");
  if (interactionKind === "tug") updateInteractionProgress("activity-fill", "activity-status", interactionStartedAt, "tug-progress");
}
function moveActivityDrag(event) {
  if (!dragStart) return;
  dragDistance += Math.abs(event.clientX - dragStart.lastX);
  dragStart.lastX = event.clientX;
  const delta = event.clientX - dragStart.x;
  event.currentTarget.style.transform = `translate(${Math.max(-90, Math.min(90, delta))}px, ${event.clientY - dragStart.y}px)`;
  if (interactionKind === "tug") document.querySelector(".activity-playground")?.classList.toggle("rope-pulling", Math.abs(delta) > 12);
}
function finishActivityDrag(event) {
  if (!dragStart) return;
  if (playDone) { dragStart = null; event.currentTarget.style.transform = ""; event.currentTarget.classList.remove("is-dragging"); return; }
  const wasTug = interactionKind === "tug";
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("#activity-dog-target");
  dragStart = null;
  event.currentTarget.classList.remove("is-dragging");
  if (wasTug) {
    if (playDone) return;
    clearTimeout(timer);
    interactionKind = null; event.currentTarget.style.transform = ""; document.querySelector(".activity-playground")?.classList.remove("rope-pulling"); document.querySelector("#activity-fill")?.style.setProperty("width", "0%"); document.querySelector("#activity-status").textContent = t("tugInstruction");
    return;
  }
  if (target) {
    event.currentTarget.classList.add("fetching-disc");
    interactionKind = "played";
    interactionStartedAt = performance.now();
    updateInteractionProgress("activity-fill", "activity-status", interactionStartedAt, "played");
  } else { interactionKind = null; event.currentTarget.style.transform = ""; }
}
function cancelActivityDrag(event) {
  if (interactionKind === "tug") clearTimeout(timer);
  interactionKind = null; dragStart = null; event.currentTarget.style.transform = ""; event.currentTarget.classList.remove("is-dragging");
  document.querySelector("#activity-fill")?.style.setProperty("width", "0%");
  const statusNode = document.querySelector("#activity-status"); if (statusNode) statusNode.textContent = state.currentTrial.a === 1 ? t("tugInstruction") : t("fetchTarget");
}
function completeInteraction(kind, durationMs) {
  clearTimeout(timer);
  interactionKind = null;
  if (kind === "fed") {
    feedDone = true;
    state.interactions = { ...(state.interactions || {}), fed: true, foodDurationMs: durationMs };
    const token = document.querySelector("#food-token"); if (token) token.disabled = true;
    const statusNode = document.querySelector("#food-status"); if (statusNode) statusNode.textContent = t("fed");
  }
  if (kind === "played") {
    playDone = true;
    state.interactions = { ...(state.interactions || {}), played: true, activityDurationMs: durationMs };
    const token = document.querySelector("#activity-token"); if (token) { token.disabled = true; token.textContent = "✓"; token.style.transform = ""; }
    const statusNode = document.querySelector("#activity-status"); if (statusNode) statusNode.textContent = t("played");
    document.querySelector(".activity-playground")?.classList.add("interaction-finished");
  }
  saveState(); updateNext();
}
window.PuppyPhaserBridge = {
  mount(id, setup) {
    const mount = document.getElementById(id);
    if (!mount) return null;
    mount.dataset.phaserPending = String(!window.Phaser);
    if (window.Phaser && typeof setup === "function") return setup(mount);
    return null;
  },
  complete: completeInteraction
};
function updateNext() { const b = document.querySelector("#activities-next"); if (b) b.disabled = !(feedDone && playDone); }
function renderQuestion() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 2 / 3</span></header><section class="question-screen"><div class="mini-dog">${puppy(state.puppyName, true, state.currentTrial?.e)}</div><p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("moodQuestion")}</h1><p class="question-subtitle">${t("choose")}</p><label class="score-input-card" for="e-prediction"><span>${t("scoreLabel")}</span><select id="e-prediction"><option value="">—</option>${Array.from({ length: 12 }, (_, index) => index - 1).map((score) => `<option value="${score}" ${state.predictedEScore === score ? "selected" : ""}>${score}</option>`).join("")}</select></label><button id="mood-next" class="button button-primary button-wide" ${Number.isInteger(state.predictedEScore) ? "" : "disabled"}>${t("continue")}</button></section>`;
  document.querySelector("#e-prediction").addEventListener("change", (event) => { state.predictedEScore = event.target.value === "" ? null : Number(event.target.value); saveState(); document.querySelector("#mood-next").disabled = !Number.isInteger(state.predictedEScore); });
  document.querySelector("#mood-next").addEventListener("click", () => { state.screen = "feedback"; saveState(); render(); });
}
function renderFeedback() {
  const actualScore = state.currentTrial?.e ?? state.actualEScore ?? 5;
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 3 / 3</span></header><section class="feedback-screen"><p class="eyebrow">${t("feedback")}</p>${puppy(state.puppyName, false, actualScore)}<div class="mood-reveal score-reveal"><span>${t("behaviorScore", { score: actualScore })}</span></div><button id="feedback-next" class="button button-primary button-wide">${t("continue")}</button></section>`;
  state.actualEScore = actualScore; saveState(); document.querySelector("#feedback-next").addEventListener("click", () => { state.screen = "imagine"; saveState(); render(); });
}
function renderImagine() {
  app.innerHTML = `<section class="imagine-screen"><div class="imagine-puppy">${puppy(state.puppyName)}</div><p class="eyebrow">${t("imagine")}</p><h1>${t("imagineText", { name: escapeHtml(state.puppyName) })}</h1><div class="countdown" id="countdown">4</div><p>${t("seconds", { n: 4 })}</p></section>`;
  let n = 4; const iv = setInterval(() => { n--; const el = document.querySelector("#countdown"); if (el) el.textContent = n; if (n <= 0) { clearInterval(iv); state.screen = "complete"; saveState(); render(); } }, 1000);
}
function renderComplete() {
  app.innerHTML = `<section class="complete-screen"><div class="confetti">✦　✧　✦</div>${puppy(state.puppyName, true)}<p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("complete")}</h1><p>${t("completeText", { name: escapeHtml(state.puppyName) })}</p><button id="finish-visit" class="button button-primary button-wide">${t("done")}</button></section>`;
  document.querySelector("#finish-visit").addEventListener("click", async e => {
    const button = e.currentTarget; button.disabled = true;
    try {
      if (isPostgresTrial()) {
        if (!state.postgresParticipant) throw new Error("Start a new local trial with ?backend=postgres before submitting.");
        state.requestId ||= (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        await postgresRequest("responses", {
          participantId: state.participantId,
          studyDay: studyDay(),
          studyDate: state.currentTrial?.studyDate || todayKey(),
          predictedEScore: state.predictedEScore,
          interactions: { fed: Boolean(state.interactions?.fed), played: Boolean(state.interactions?.played), foodDurationMs: state.interactions?.foodDurationMs, activityDurationMs: state.interactions?.activityDurationMs },
          requestId: state.requestId
        });
        showToast(language === "zh" ? "试验记录已保存到本地数据库。" : language === "es" ? "Respuesta guardada en la base de datos local." : "Trial response saved to the local database.");
      } else if (hasFirebaseConfig() && state.firebaseUid) {
        state.requestId ||= (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        await (await firebaseData()).submitDailyResponse({ studyDay: studyDay(), predictedEScore: state.predictedEScore, interactions: { fed: Boolean(state.interactions?.fed), played: Boolean(state.interactions?.played) }, requestId: state.requestId });
        showToast(ac("saved"));
      } else if (hasFirebaseConfig()) {
        throw new Error(ac("saveFailed"));
      }
      state.completedToday = true; state.completedDate = todayKey(); state.screen = "home"; saveState(); render();
    } catch (error) { console.error("Daily response was not confirmed", error); showToast(ac("saveFailed")); button.disabled = false; }
  });
}
function renderLocked() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span>${languagePicker()}</header><section class="locked-screen">${puppy(state.puppyName, true)}<div class="locked-message"><h1>${t("todayDone", { name: escapeHtml(state.puppyName) })}</h1><p>${t("idleText", { name: escapeHtml(state.puppyName) })}</p></div><button id="acknowledge" class="button button-primary button-wide">${t("close")}</button><button id="new-participant" class="text-button">${t("nameEdit")}</button></section>`;
  bindLanguage(); startIdleCycle(); document.querySelector("#acknowledge").addEventListener("click", () => { document.querySelector(".locked-message").classList.add("dismissed"); document.querySelector("#acknowledge").remove(); });
  document.querySelector("#new-participant")?.remove();
}
function startIdleCycle() { clearInterval(idleTimer); const poses = ["state-look", "state-sniff", "state-doze"]; let i = 0; idleTimer = setInterval(() => { document.querySelectorAll(".idle-scene").forEach(el => { el.classList.remove(...poses); el.classList.add(poses[i]); }); i = (i + 1) % poses.length; }, 4200); }
function renderRecoverySetup() {
  app.innerHTML = `<section class="recovery-screen"><p class="eyebrow">${t("title")}</p><h1>${ac("codeTitle")}</h1><p>${ac("codeText")}</p>${pendingRecoveryCode ? `<code class="recovery-code">${pendingRecoveryCode}</code><button id="copy-code" class="button button-secondary button-wide">${ac("codeAction")}</button>` : `<p>${ac("codeMissing")}</p><button id="new-code" class="button button-secondary button-wide">${ac("makeCode")}</button>`}<button id="code-continue" class="button button-primary button-wide" ${pendingRecoveryCode ? "" : "disabled"}>${ac("codeSaved")}</button></section>`;
  document.querySelector("#copy-code")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(pendingRecoveryCode); showToast(ac("codeAction")); } catch { showToast(pendingRecoveryCode); } });
  document.querySelector("#new-code")?.addEventListener("click", async e => { e.currentTarget.disabled = true; try { pendingRecoveryCode = await (await firebaseData()).issueRecoveryCode(); render(); } catch (error) { showToast(error.message || ac("saveFailed")); e.currentTarget.disabled = false; } });
  document.querySelector("#code-continue").addEventListener("click", () => { pendingRecoveryCode = null; state.screen = "home"; saveState(); render(); });
}
function renderRecoveryLogin() {
  app.innerHTML = `<section class="recovery-screen"><p class="eyebrow">${t("title")}</p><h1>${ac("recoverTitle")}</h1><form id="recovery-form"><label for="recovery-code">${ac("codeLabel")}</label><input id="recovery-code" autocomplete="one-time-code" required /><button class="button button-primary button-wide" type="submit">${ac("restore")}</button></form><button id="back-to-welcome" class="text-button">${t("begin")}</button></section>`;
  document.querySelector("#back-to-welcome").addEventListener("click", renderOnboarding);
  document.querySelector("#recovery-form").addEventListener("submit", async e => { e.preventDefault(); const button = e.currentTarget.querySelector("button"); button.disabled = true; try { const profile = await (await firebaseData()).recoverParticipant(document.querySelector("#recovery-code").value); state = { participantId: profile.uid, firebaseUid: profile.uid, puppyName: profile.puppyName, language, screen: "home", environmentIntroSeen: true, completedToday: profile.lastSubmittedDate === todayKey(), completedDate: profile.lastSubmittedDate, enrolledDate: profile.enrolledOn, interactions: { fed: false, played: false }, nextStudyDay: profile.nextStudyDay }; saveState(); render(); } catch (error) { showToast(error.message || ac("saveFailed")); button.disabled = false; } });
}
async function resumeFirebaseParticipant() {
  if (isPostgresTrial()) return;
  if (!hasFirebaseConfig() || state?.firebaseUid) return;
  try {
    const api = await firebaseData();
    if (state?.puppyName) {
      // Convert an old local-only demo profile into a fresh emulator participant; no old demo answers are uploaded.
      const profile = await api.enrollParticipant(state.puppyName);
      state = { participantId: profile.uid, firebaseUid: profile.uid, puppyName: profile.puppyName, language, screen: "recovery-setup", completedToday: false, enrolledDate: profile.enrolledOn, interactions: { fed: false, played: false }, localOnly: false };
      pendingRecoveryCode = profile.recoveryCode; saveState(); render(); return;
    }
    const profile = await api.resumeParticipant(); if (!profile) return;
    state = { participantId: profile.uid, firebaseUid: profile.uid, puppyName: profile.puppyName, language, screen: "home", environmentIntroSeen: true, completedToday: profile.lastSubmittedDate === todayKey(), completedDate: profile.lastSubmittedDate, enrolledDate: profile.enrolledOn, interactions: { fed: false, played: false }, nextStudyDay: profile.nextStudyDay };
    saveState(); render();
  } catch (error) { console.error("Could not resume participant", error); }
}
async function resumePostgresParticipant() {
  if (!isPostgresTrial() || !state?.puppyName || state.postgresParticipant) return;
  try {
    const profile = await postgresRequest("participants", {
      ...(state.localOnly && state.participantId ? { participantId: state.participantId } : {}),
      puppyName: state.puppyName
    });
    state = { ...state, participantId: profile.participantId, postgresParticipant: true, assignedVersion: profile.assignedVersion, puppyName: profile.puppyName, language, screen: "home", environmentIntroSeen: true, enrolledDate: profile.enrolledDate || todayKey(), completedToday: false, completedDate: null, prediction: null, predictedEScore: null, actualMood: null, actualEScore: null, currentTrial: null, requestId: null, interactions: { fed: false, played: false }, localOnly: true };
    saveState(); render();
  } catch (error) {
    console.error("Could not connect this participant to the local database", error);
    render(); showToast(error.message || ac("saveFailed"));
  }
}
function showToast(message) { toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 1800); }
if (isPostgresTrial() && state?.puppyName && !state.postgresParticipant) {
  app.innerHTML = `<section class="recovery-screen"><h1>${language === "zh" ? "正在连接本地数据库…" : "Connecting to the local database…"}</h1></section>`;
  resumePostgresParticipant();
} else {
  render();
}







resumeFirebaseParticipant();







