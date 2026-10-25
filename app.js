const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const STORE_KEY = "puppy-study-prototype-v2";
const translations = {
  en: {
    title: "Puppy Day", tagline: "A little moment together, every day.", intro: "Meet your puppy and spend a few moments together each day. You’ll see what your puppy ate and how you played, then make a guess about their mood.", nameLabel: "What would you like to name your puppy?", namePlaceholder: "Your puppy’s name", begin: "Meet my puppy", language: "Language", nameRequired: "Please enter a name for your puppy.", greeting: "Good morning, your puppy", beginDay: "Start today’s visit", day: "Day", todayDone: "You’ve already spent time with {name} today! See you tomorrow!", close: "Got it", treatTitle: "A little treat", treatText: "Your puppy has a tasty snack.", playTitle: "Let’s play tug-of-war", playText: "Hold the rope and give it a gentle tug!", feed: "Feed {name}", play: "Play tug-of-war", fed: "Yum! {name} enjoyed the treat.", played: "What a fun game!", continue: "Continue", moodQuestion: "After today’s activities, how do you think {name} feels?", happier: "Happier", sadder: "Sadder", choose: "Choose the feeling that seems right to you.", feedback: "Here’s how {name} feels today", happy: "Happy and wagging!", sad: "A little blue today.", imagine: "Take a moment to picture the scene", imagineText: "Imagine {name} enjoying today’s activities…", seconds: "{n} seconds", complete: "That’s all for today!", completeText: "Thanks for spending time with {name}. Come back tomorrow for another little adventure.", done: "See you tomorrow", idleTitle: "A quiet moment", idleText: "{name} is resting nearby. You can visit again tomorrow.", prototype: "Interactive prototype · Your progress is saved on this device.", changeLanguage: "Language", touchHint: "Touch and hold", status: "Today’s visit is complete", nameEdit: "Use another puppy", restartNote: "This prototype stores one participant on this device. Study accounts and daily locking will be connected to the study server later."
  },
  zh: {
    title: "小狗的每一天", tagline: "每天，和它共度一小段时光。", intro: "认识你的小狗，每天花一点时间陪陪它。看看它今天吃了什么、玩了什么，然后猜猜它的心情。", nameLabel: "你想给小狗取什么名字？", namePlaceholder: "小狗的名字", begin: "认识我的小狗", language: "语言", nameRequired: "请先给小狗取个名字。", greeting: "早上好，你的小狗", beginDay: "开始今天的互动", day: "第", todayDone: "你今天已经和{name}互动过了！明天再见吧！", close: "知道了", treatTitle: "来吃点小零食", treatText: "小狗有一份美味的小零食。", playTitle: "来玩拔河吧", playText: "按住绳子，轻轻拉一拉！", feed: "喂{name}", play: "玩拔河", fed: "真香！{name}很喜欢这份零食。", played: "玩得真开心！", continue: "继续", moodQuestion: "今天吃过、玩过之后，你觉得{name}心情怎么样？", happier: "更开心", sadder: "更难过", choose: "选一个最符合你感觉的心情。", feedback: "看看{name}今天的心情", happy: "开心地摇着尾巴！", sad: "今天有一点点低落。", imagine: "花一点时间想象这个场景", imagineText: "想象{name}享受今天的活动……", seconds: "还需{n}秒", complete: "今天就到这里啦！", completeText: "谢谢你陪伴{name}。明天再来开启新的小冒险吧。", done: "明天见", idleTitle: "安静休息一会儿", idleText: "{name}正在旁边休息，明天可以再来看它。", prototype: "交互原型 · 进度保存在此设备上。", changeLanguage: "语言", touchHint: "按住互动", status: "今天的互动已完成", nameEdit: "换一只小狗", restartNote: "原型目前在此设备上保存一位参与者。参与者账户和每日锁定之后会接入研究服务器。"
  },
  es: {
    title: "Un día con tu cachorro", tagline: "Un ratito juntos cada día.", intro: "Conoce a tu cachorro y pasa unos minutos con él cada día. Verás qué comió y cómo jugaron, y después imaginarás cómo se siente.", nameLabel: "¿Qué nombre quieres ponerle a tu cachorro?", namePlaceholder: "Nombre de tu cachorro", begin: "Conocer a mi cachorro", language: "Idioma", nameRequired: "Escribe un nombre para tu cachorro.", greeting: "Buenos días, tu cachorro", beginDay: "Empezar la visita de hoy", day: "Día", todayDone: "¡Hoy ya pasaste tiempo con {name}! ¡Hasta mañana!", close: "Entendido", treatTitle: "Un pequeño premio", treatText: "Tu cachorro tiene un bocadito delicioso.", playTitle: "¡A jugar al tira y afloja!", playText: "Sujeta la cuerda y tira suavemente.", feed: "Darle de comer a {name}", play: "Jugar al tira y afloja", fed: "¡Qué rico! A {name} le encantó.", played: "¡Qué juego tan divertido!", continue: "Continuar", moodQuestion: "Después de las actividades de hoy, ¿cómo crees que se siente {name}?", happier: "Más feliz", sadder: "Más triste", choose: "Elige el sentimiento que te parezca adecuado.", feedback: "Así se siente {name} hoy", happy: "¡Feliz y moviendo la cola!", sad: "Hoy está un poquito triste.", imagine: "Imagina la escena un momento", imagineText: "Imagina a {name} disfrutando las actividades de hoy…", seconds: "{n} segundos", complete: "¡Eso es todo por hoy!", completeText: "Gracias por pasar tiempo con {name}. Vuelve mañana para otra pequeña aventura.", done: "Hasta mañana", idleTitle: "Un momento tranquilo", idleText: "{name} está descansando cerca. Puedes volver mañana.", prototype: "Prototipo interactivo · El progreso se guarda en este dispositivo.", changeLanguage: "Idioma", touchHint: "Mantén pulsado", status: "La visita de hoy ha terminado", nameEdit: "Elegir otro cachorro", restartNote: "Este prototipo guarda una persona por dispositivo. Las cuentas y el bloqueo diario se conectarán al servidor del estudio más adelante."
  }
};
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
function t(key, vars = {}) { return (translations[language][key] || translations.en[key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ""); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function puppy(name, idle = false) {
  return `<div class="puppy-stage ${idle ? "idle-scene" : ""}" aria-label="${escapeHtml(name)} the puppy">
    <div class="sun-glow"></div><div class="ground-shadow"></div>
    <div class="dog ${idle ? "dog-idle" : "dog-arrive"}" aria-hidden="true">
      <span class="tail"></span><span class="body"></span><span class="leg leg-a"></span><span class="leg leg-b"></span>
      <span class="ear ear-left"></span><span class="ear ear-right"></span><span class="head"></span><span class="muzzle"></span>
      <span class="eye eye-left"></span><span class="eye eye-right"></span><span class="nose"></span><span class="mouth"></span>
      <span class="cheek cheek-left"></span><span class="cheek cheek-right"></span>
    </div><span class="sparkle sparkle-a">✦</span><span class="sparkle sparkle-b">✦</span>
  </div>`;
}
function languagePicker() { return `<label class="language-picker"><span>${t("language")}</span><select id="language-select" aria-label="${t("language")}"><option value="en" ${language === "en" ? "selected" : ""}>English</option><option value="zh" ${language === "zh" ? "selected" : ""}>中文</option><option value="es" ${language === "es" ? "selected" : ""}>Español</option></select></label>`; }
function bindLanguage() { document.querySelector("#language-select")?.addEventListener("change", e => { language = e.target.value; if (state) { state.language = language; saveState(); } render(); }); }
function render() {
  if (state?.completedToday && state.completedDate !== todayKey()) { state.completedToday = false; state.screen = "home"; feedDone = false; playDone = false; state.actualMood = null; saveState(); }
  document.documentElement.lang = language === "zh" ? "zh-CN" : language === "es" ? "es" : "en";
  if (!state) return renderOnboarding();
  if (state.completedToday) return renderLocked();
  if (state.screen === "activities") return renderActivities();
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
    <form id="name-form" class="name-card"><label for="puppy-name">${t("nameLabel")}</label><input id="puppy-name" name="name" maxlength="24" autocomplete="nickname" placeholder="${t("namePlaceholder")}" required /><button class="button button-primary" type="submit">${t("begin")}</button><p class="small-note">${t("restartNote")}</p></form>
    <p class="prototype-note">${t("prototype")}</p></section>`;
  bindLanguage();
  document.querySelector("#name-form").addEventListener("submit", e => { e.preventDefault(); const name = document.querySelector("#puppy-name").value.trim(); if (!name) return; state = { participantId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, puppyName: name, language, screen: "home", completedToday: false, enrolledDate: todayKey(), lastVisit: todayKey() }; saveState(); render(); });
}
function renderHome() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span>${languagePicker()}</header><section class="home-screen">
    <div class="hero-copy"><p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("greeting")}, <span>${escapeHtml(state.puppyName)}</span>!</h1><p>${t("tagline")}</p></div>
    ${puppy(state.puppyName)}<button id="start-visit" class="button button-primary button-wide">${t("beginDay")}</button><p class="prototype-note">${t("prototype")}</p></section>`;
  bindLanguage(); document.querySelector("#start-visit").addEventListener("click", () => { state.screen = "activities"; saveState(); render(); });
}
function renderActivities() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 1 / 3</span></header><section class="activity-screen">
    <div class="activity-heading"><p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${escapeHtml(state.puppyName)}’s day</h1><p>${t("treatText")} ${t("playText")}</p></div>
    <div class="activity-puppy">${puppy(state.puppyName)}</div><article class="activity-card"><div class="activity-art snack-art">🥩<span class="food-spark">✦</span></div><div><p class="eyebrow">T</p><h2>${t("treatTitle")}</h2><p>${t("treatText")}</p></div><button id="feed-button" class="button ${feedDone ? "button-done" : "button-secondary"}" ${feedDone ? "disabled" : ""}>${feedDone ? "✓ " + t("fed") : t("feed", { name: escapeHtml(state.puppyName) })}</button></article>
    <article class="activity-card"><div class="activity-art rope-art">🪢<span class="paw-mark">🐾</span></div><div><p class="eyebrow">A</p><h2>${t("playTitle")}</h2><p>${t("playText")}</p></div><button id="tug-button" class="button ${playDone ? "button-done" : "button-secondary"}" ${playDone ? "disabled" : ""}>${playDone ? "✓ " + t("played") : t("play")}</button><div class="tug-meter" aria-hidden="true"><span id="tug-fill"></span></div><small class="touch-hint">${t("touchHint")}</small></article>
    <button id="activities-next" class="button button-primary button-wide" ${feedDone && playDone ? "" : "disabled"}>${t("continue")}</button></section>`;
  document.querySelector("#feed-button").addEventListener("click", doFeed);
  const tug = document.querySelector("#tug-button"); tug.addEventListener("pointerdown", startTug); tug.addEventListener("pointerup", stopTug); tug.addEventListener("pointerleave", stopTug); tug.addEventListener("pointercancel", stopTug);
  document.querySelector("#activities-next").addEventListener("click", () => { if (feedDone && playDone) { state.screen = "question"; saveState(); render(); } });
}
function doFeed() { if (feedDone) return; feedDone = true; const button = document.querySelector("#feed-button"); button.textContent = `✓ ${t("fed", { name: state.puppyName })}`; button.className = "button button-done"; button.disabled = true; document.querySelector(".dog")?.classList.add("dog-happy"); updateNext(); showToast(t("fed", { name: state.puppyName })); }
function startTug(e) { if (playDone) return; e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); e.currentTarget.classList.add("is-pulling"); document.querySelector("#tug-fill").style.width = "100%"; timer = setTimeout(() => { playDone = true; const button = document.querySelector("#tug-button"); button.className = "button button-done"; button.textContent = `✓ ${t("played")}`; button.disabled = true; button.classList.remove("is-pulling"); document.querySelector(".dog")?.classList.add("dog-happy"); updateNext(); showToast(t("played")); }, 850); }
function stopTug() { clearTimeout(timer); if (playDone) return; document.querySelector("#tug-button")?.classList.remove("is-pulling"); document.querySelector("#tug-fill")?.style.setProperty("width", "0%"); }
function updateNext() { const b = document.querySelector("#activities-next"); if (b) b.disabled = !(feedDone && playDone); }
function renderQuestion() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 2 / 3</span></header><section class="question-screen"><div class="mini-dog">${puppy(state.puppyName, true)}</div><p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("moodQuestion", { name: escapeHtml(state.puppyName) })}</h1><p class="question-subtitle">${t("choose")}</p><div class="mood-options"><button class="mood-button" data-mood="happy"><span>☀️</span><strong>${t("happier")}</strong></button><button class="mood-button" data-mood="sad"><span>☁️</span><strong>${t("sadder")}</strong></button></div><button id="mood-next" class="button button-primary button-wide" disabled>${t("continue")}</button></section>`;
  document.querySelectorAll(".mood-button").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".mood-button").forEach(x => x.classList.remove("selected")); b.classList.add("selected"); state.prediction = b.dataset.mood; saveState(); document.querySelector("#mood-next").disabled = false; }));
  document.querySelector("#mood-next").addEventListener("click", () => { state.screen = "feedback"; saveState(); render(); });
}
function renderFeedback() {
  const actual = state.actualMood || "happy";
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span><span class="step-pill">${t("day")} ${studyDay()} · 3 / 3</span></header><section class="feedback-screen"><p class="eyebrow">${t("feedback", { name: escapeHtml(state.puppyName) })}</p>${puppy(state.puppyName)}<div class="mood-reveal ${actual}"><span>${actual === "happy" ? "☀️" : "☁️"}</span><h1>${t(actual)}</h1></div><button id="feedback-next" class="button button-primary button-wide">${t("continue")}</button></section>`;
  state.actualMood = actual; saveState(); document.querySelector("#feedback-next").addEventListener("click", () => { state.screen = "imagine"; saveState(); render(); });
}
function renderImagine() {
  app.innerHTML = `<section class="imagine-screen"><div class="imagine-puppy">${puppy(state.puppyName)}</div><p class="eyebrow">${t("imagine")}</p><h1>${t("imagineText", { name: escapeHtml(state.puppyName) })}</h1><div class="countdown" id="countdown">4</div><p>${t("seconds", { n: 4 })}</p></section>`;
  let n = 4; const iv = setInterval(() => { n--; const el = document.querySelector("#countdown"); if (el) el.textContent = n; if (n <= 0) { clearInterval(iv); state.screen = "complete"; saveState(); render(); } }, 1000);
}
function renderComplete() {
  app.innerHTML = `<section class="complete-screen"><div class="confetti">✦　✧　✦</div>${puppy(state.puppyName, true)}<p class="eyebrow">${t("day")} ${studyDay()}</p><h1>${t("complete")}</h1><p>${t("completeText", { name: escapeHtml(state.puppyName) })}</p><button id="finish-visit" class="button button-primary button-wide">${t("done")}</button></section>`;
  document.querySelector("#finish-visit").addEventListener("click", () => { state.completedToday = true; state.completedDate = todayKey(); state.screen = "home"; saveState(); render(); });
}
function renderLocked() {
  app.innerHTML = `<header class="topbar"><span class="brand">🐾 ${t("title")}</span>${languagePicker()}</header><section class="locked-screen">${puppy(state.puppyName, true)}<div class="locked-message"><h1>${t("todayDone", { name: escapeHtml(state.puppyName) })}</h1><p>${t("idleText", { name: escapeHtml(state.puppyName) })}</p></div><button id="acknowledge" class="button button-primary button-wide">${t("close")}</button><button id="new-participant" class="text-button">${t("nameEdit")}</button></section>`;
  bindLanguage(); startIdleCycle(); document.querySelector("#acknowledge").addEventListener("click", () => { document.querySelector(".locked-message").classList.add("dismissed"); document.querySelector("#acknowledge").remove(); });
  document.querySelector("#new-participant")?.remove();
}
function startIdleCycle() { clearInterval(idleTimer); const poses = ["state-look", "state-sniff", "state-doze"]; let i = 0; idleTimer = setInterval(() => { document.querySelectorAll(".idle-scene").forEach(el => { el.classList.remove(...poses); el.classList.add(poses[i]); }); i = (i + 1) % poses.length; }, 4200); }
function showToast(message) { toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 1800); }
render();






