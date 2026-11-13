import { parseTrialOrderCsv } from "./trial-order-parser.mjs";

const fileInput = document.querySelector("#order-file");
const nameInput = document.querySelector("#order-name");
const categoryInput = document.querySelector("#order-category");
const orderGroupInput = document.querySelector("#order-group");
const categoryFilter = document.querySelector("#order-category-filter");
const preview = document.querySelector("#upload-preview");
const importButton = document.querySelector("#import-order");
const status = document.querySelector("#admin-status");
const orderList = document.querySelector("#order-list");
const loginCard = document.querySelector("#admin-login-card");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const adminContent = document.querySelector("#admin-content");
const responsesStatus = document.querySelector("#responses-status");
const responsesTableBody = document.querySelector("#responses-table-body");
const refreshResponsesButton = document.querySelector("#refresh-responses");
const exportResponsesButton = document.querySelector("#export-responses");
const participantsStatus = document.querySelector("#participants-status");
const participantGroupSummary = document.querySelector("#participants-group-summary");
const participantsTableBody = document.querySelector("#participants-table-body");
const refreshParticipantsButton = document.querySelector("#refresh-participants");
const languageSelect = document.querySelector("#admin-language-select");
const adminPasswordInput = document.querySelector("#admin-password");
const ADMIN_TOKEN_KEY = "puppy-admin-session";
const ADMIN_LANGUAGE_KEY = "puppy-admin-language";
let parsedOrder = null;
let savedResponses = [];
let savedOrders = [];
let savedParticipants = [];
let currentLanguage = localStorage.getItem(ADMIN_LANGUAGE_KEY) || "en";

const translations = {
  en: {
    title: "Puppy Study · Trial Order Admin",
    language: "Language",
    back: "← Back to Puppy Day",
    eyebrow: "Researcher Tools",
    adminTitle: "Trial Order Admin",
    adminIntro: "Upload the CSV exported from the <strong>AllVersions</strong> worksheet in Excel. Each version must contain days 1–24; new participants are randomly assigned to one version from the currently active set.",
    warningTitle: "Research test platform:",
    warningText: "Sign in with the researcher password. Before deployment, complete IRB, data-handling, and access reviews; do not enter real participant data without approval.",
    loginTitle: "Researcher Sign In",
    passwordLabel: "Researcher password",
    loginButton: "Sign in",
    logoutButton: "Sign out",
    uploadTitle: "Upload a trial order",
    orderFileLabel: "AllVersions CSV",
    orderNameLabel: "Version set name",
    orderCategoryLabel: "Category",
    orderCategoryPlaceholder: "For example: main study, pilot, backup condition",
    uploadHelp: "The CSV must contain the columns: version, day, T, A, E, T_label, A_label. In Excel, choose the AllVersions worksheet and save it as a UTF-8 CSV.",
    importButton: "Validate and activate",
    participantsTitle: "Participant Enrollment",
    participantsHelp: "Shows participants created in this backend. The responses table only shows rows after a participant submits a response for that day.",
    refreshParticipants: "Refresh enrollment",
    participantsStatusIdle: "Load enrollment after signing in.",
    responsesTitle: "Participant Responses",
    responsesHelp: "Daily responses saved to the study database. Participant ID links multiple study days to the same participant.",
    refreshResponses: "Refresh",
    exportResponses: "Export CSV",
    responsesStatusIdle: "Load responses after signing in.",
    ordersTitle: "Uploaded Version Sets",
    orderCategoryFilterLabel: "Filter by category",
    allCategories: "All categories",
    orderListLoading: "Reading the local database…",
    noParticipantsLoaded: "No participants loaded yet.",
    noResponsesLoaded: "No responses loaded yet.",
    participantsHeadId: "Participant ID",
    participantsHeadName: "Puppy Name",
    participantsHeadEnrolled: "Enrolled At",
    participantsHeadStatus: "Status",
    participantsHeadDays: "Submitted Days",
    participantsHeadVersion: "Assigned Version",
    responsesHeadId: "Participant ID",
    responsesHeadName: "Puppy Name",
    responsesHeadDate: "Date",
    responsesHeadDay: "Day",
    responsesHeadPredMood: "Predicted Mood",
    responsesHeadActualMood: "Actual Mood",
    responsesHeadPredE: "Predicted E",
    responsesHeadActualE: "Actual E",
    responsesHeadT: "T",
    responsesHeadA: "A",
    responsesHeadFed: "Fed",
    responsesHeadPlayed: "Played",
    loginExpired: "Your sign-in expired. Please sign in again.",
    loggingIn: "Signing in…",
    loginFailed: "Sign-in failed.",
    loginSuccess: "Signed in successfully.",
    parsingSuccess: "Validated: {count} versions, each with 24 study days; participants will be randomly assigned to one of these versions.",
    writingDb: "Writing to the database…",
    uploadFailed: "Upload failed.",
    uploadActivated: "Activated “{name}” with {count} versions. New participants will be assigned at random.",
    readOrdersFailed: "Could not load version sets.",
    localServerHint: "Please start the local server and make sure local trial capture is enabled.",
    noOrders: "No version sets have been uploaded yet.",
    noOrdersInCategory: "No version sets are available in this category yet.",
    uncategorized: "Uncategorized",
    activeBadge: "Active",
    orderSummary: "{versions} versions · {participants} participants assigned",
    editName: "Name",
    editCategory: "Category",
    saveNameCategory: "Save name/category",
    activateSet: "Set as active",
    deleteSet: "Delete",
    activeHint: "This version set is currently used to assign new participants. Activate another set before deleting this one.",
    assignedHint: "Participants are already assigned to this version set, so it cannot be deleted right now; participant records are preserved.",
    confirmActivate: "Set “{name}” as the active trial order for new participants? Existing participants will not change.",
    confirmDelete: "Delete “{name}”? This action cannot be undone.",
    actionFailed: "Action failed.",
    saveSuccess: "Name and category saved.",
    activateSuccess: "Active version set changed. Existing participant assignments stay the same.",
    deleteSuccess: "Version set deleted.",
    loadingResponses: "Loading responses…",
    readResponsesFailed: "Could not load participant responses.",
    loadedResponses: "Loaded {count} daily responses.",
    noSubmittedResponses: "There are no submitted responses in the database yet.",
    noResponseRows: "No response records yet.",
    loadingParticipants: "Loading enrollment…",
    readParticipantsFailed: "Could not load participant enrollment.",
    noParticipantsInDb: "There are no participant enrollment records in the database yet.",
    noParticipantsYet: "No participants enrolled yet.",
    loadedParticipants: "Loaded {count} participants.",
    statusActive: "Active",
    statusWithdrawn: "Withdrawn",
    statusTerminated: "Terminated",
    unassigned: "Unassigned",
    yes: "Yes",
    no: "No",
    moodHappy: "Happy",
    moodSad: "Sad",
    defaultCategory: "Main study"
  },
  zh: {
    title: "Puppy Study · Trial Order 管理",
    language: "语言",
    back: "← 返回 Puppy Day",
    eyebrow: "研究者工具",
    adminTitle: "Trial Order 管理",
    adminIntro: "上传 Excel 中 <strong>AllVersions</strong> 工作表另存的 CSV。每个版本必须包含第 1–24 天；新参与者会从当前启用版本组中的一个版本里被随机分配。",
    warningTitle: "研究测试平台：",
    warningText: "使用研究者密码登录。部署上线前请完成 IRB、数据处理和访问权限审核；不要在未经批准的情况下录入真实参与者数据。",
    loginTitle: "研究者登录",
    passwordLabel: "研究者密码",
    loginButton: "登录",
    logoutButton: "退出登录",
    uploadTitle: "上传一个 trial order",
    orderFileLabel: "AllVersions CSV",
    orderNameLabel: "版本组名称",
    orderCategoryLabel: "分类",
    orderCategoryPlaceholder: "例如：主实验、试点、备用条件",
    uploadHelp: "CSV 必须包含列：version、day、T、A、E、T_label、A_label。请在 Excel 中选择 AllVersions 工作表，并另存为 UTF-8 CSV。",
    importButton: "验证并启用",
    participantsTitle: "参与者注册",
    participantsHelp: "显示在此后台创建的参与者。只有参与者提交当天回答后，回答表中才会出现记录。",
    refreshParticipants: "刷新注册",
    participantsStatusIdle: "登录后加载注册信息。",
    responsesTitle: "参与者回答",
    responsesHelp: "已保存到研究数据库的每日回答。参与者 ID 用于关联同一参与者的多天记录。",
    refreshResponses: "刷新",
    exportResponses: "导出 CSV",
    responsesStatusIdle: "登录后加载回答。",
    ordersTitle: "已上传的版本组",
    orderCategoryFilterLabel: "按分类查看",
    allCategories: "所有分类",
    orderListLoading: "正在读取本地数据库…",
    noParticipantsLoaded: "尚未加载参与者。",
    noResponsesLoaded: "尚未加载回答。",
    participantsHeadId: "参与者 ID",
    participantsHeadName: "小狗名称",
    participantsHeadEnrolled: "注册时间",
    participantsHeadStatus: "状态",
    participantsHeadDays: "已提交天数",
    participantsHeadVersion: "分配版本",
    responsesHeadId: "参与者 ID",
    responsesHeadName: "小狗名称",
    responsesHeadDate: "日期",
    responsesHeadDay: "天数",
    responsesHeadPredMood: "预测情绪",
    responsesHeadActualMood: "实际情绪",
    responsesHeadPredE: "预测 E",
    responsesHeadActualE: "实际 E",
    responsesHeadT: "T",
    responsesHeadA: "A",
    responsesHeadFed: "喂食",
    responsesHeadPlayed: "玩耍",
    loginExpired: "登录已失效，请重新登录。",
    loggingIn: "正在登录…",
    loginFailed: "登录失败。",
    loginSuccess: "登录成功。",
    parsingSuccess: "已验证：{count} 个版本，每个版本 24 天；参与者将从这些版本中随机分配。",
    writingDb: "正在写入数据库…",
    uploadFailed: "上传失败。",
    uploadActivated: "已启用「{name}」，共 {count} 个版本。新参与者将随机分配。",
    readOrdersFailed: "无法读取版本组。",
    localServerHint: "请先启动本地服务器，并确认本地 trial capture 已启用。",
    noOrders: "还没有上传版本组。",
    noOrdersInCategory: "这个分类下还没有版本组。",
    uncategorized: "未分类",
    activeBadge: "当前启用",
    orderSummary: "{versions} 个版本 · {participants} 位参与者已分配",
    editName: "名称",
    editCategory: "分类",
    saveNameCategory: "保存名称/分类",
    activateSet: "设为当前版本",
    deleteSet: "删除",
    activeHint: "当前版本组正用于新参与者的随机分配。若要删除，请先启用其他版本组。",
    assignedHint: "已有参与者分配到此版本组，暂不能删除；参与者记录会保留。",
    confirmActivate: "将「{name}」设为新参与者的当前 trial order？已分配的参与者不会改变。",
    confirmDelete: "确定删除「{name}」？此操作无法复原。",
    actionFailed: "操作失败。",
    saveSuccess: "名称和分类已保存。",
    activateSuccess: "已切换当前版本组；现有参与者的分配不会改变。",
    deleteSuccess: "版本组已删除。",
    loadingResponses: "正在读取回答…",
    readResponsesFailed: "无法读取参与者回答。",
    loadedResponses: "已加载 {count} 条每日回答。",
    noSubmittedResponses: "数据库中还没有已提交的回答。",
    noResponseRows: "还没有回答记录。",
    loadingParticipants: "正在读取注册信息…",
    readParticipantsFailed: "无法读取参与者注册信息。",
    noParticipantsInDb: "数据库中还没有参与者注册记录。",
    noParticipantsYet: "还没有参与者注册。",
    loadedParticipants: "已加载 {count} 位参与者。",
    statusActive: "进行中",
    statusWithdrawn: "已退出",
    statusTerminated: "已结束",
    unassigned: "未分配",
    yes: "是",
    no: "否",
    moodHappy: "快乐",
    moodSad: "难过",
    defaultCategory: "主实验"
  },
  es: {
    title: "Puppy Study · Administración de Trial Orders",
    language: "Idioma",
    back: "← Volver a Puppy Day",
    eyebrow: "Herramientas para investigación",
    adminTitle: "Administración de Trial Orders",
    adminIntro: "Sube el CSV exportado desde la hoja <strong>AllVersions</strong> de Excel. Cada versión debe incluir los días 1–24; a cada participante nuevo se le asigna aleatoriamente una versión del conjunto activo.",
    warningTitle: "Plataforma de prueba de investigación:",
    warningText: "Inicia sesión con la contraseña del investigador. Antes de desplegar, completa las revisiones de IRB, manejo de datos y acceso; no ingreses datos reales de participantes sin aprobación.",
    loginTitle: "Inicio de sesión del investigador",
    passwordLabel: "Contraseña del investigador",
    loginButton: "Iniciar sesión",
    logoutButton: "Cerrar sesión",
    uploadTitle: "Subir un trial order",
    orderFileLabel: "CSV de AllVersions",
    orderNameLabel: "Nombre del conjunto de versiones",
    orderCategoryLabel: "Categoría",
    orderCategoryPlaceholder: "Por ejemplo: estudio principal, piloto, condición de respaldo",
    uploadHelp: "El CSV debe incluir las columnas: version, day, T, A, E, T_label, A_label. En Excel, elige la hoja AllVersions y guárdala como CSV UTF-8.",
    importButton: "Validar y activar",
    participantsTitle: "Registro de participantes",
    participantsHelp: "Muestra los participantes creados en este backend. La tabla de respuestas solo tendrá filas cuando el participante envíe una respuesta para ese día.",
    refreshParticipants: "Actualizar registro",
    participantsStatusIdle: "Carga el registro después de iniciar sesión.",
    responsesTitle: "Respuestas de participantes",
    responsesHelp: "Respuestas diarias guardadas en la base de datos del estudio. El ID del participante vincula varios días del estudio a la misma persona.",
    refreshResponses: "Actualizar",
    exportResponses: "Exportar CSV",
    responsesStatusIdle: "Carga las respuestas después de iniciar sesión.",
    ordersTitle: "Conjuntos de versiones cargados",
    orderCategoryFilterLabel: "Filtrar por categoría",
    allCategories: "Todas las categorías",
    orderListLoading: "Leyendo la base de datos local…",
    noParticipantsLoaded: "Todavía no se cargaron participantes.",
    noResponsesLoaded: "Todavía no se cargaron respuestas.",
    participantsHeadId: "ID del participante",
    participantsHeadName: "Nombre del cachorro",
    participantsHeadEnrolled: "Fecha de registro",
    participantsHeadStatus: "Estado",
    participantsHeadDays: "Días enviados",
    participantsHeadVersion: "Versión asignada",
    responsesHeadId: "ID del participante",
    responsesHeadName: "Nombre del cachorro",
    responsesHeadDate: "Fecha",
    responsesHeadDay: "Día",
    responsesHeadPredMood: "Ánimo predicho",
    responsesHeadActualMood: "Ánimo real",
    responsesHeadPredE: "E predicha",
    responsesHeadActualE: "E real",
    responsesHeadT: "T",
    responsesHeadA: "A",
    responsesHeadFed: "Alimentado",
    responsesHeadPlayed: "Jugó",
    loginExpired: "La sesión expiró. Inicia sesión de nuevo.",
    loggingIn: "Iniciando sesión…",
    loginFailed: "No se pudo iniciar sesión.",
    loginSuccess: "Sesión iniciada correctamente.",
    parsingSuccess: "Validado: {count} versiones, cada una con 24 días de estudio; los participantes se asignarán aleatoriamente a una de estas versiones.",
    writingDb: "Escribiendo en la base de datos…",
    uploadFailed: "La carga falló.",
    uploadActivated: "Se activó “{name}” con {count} versiones. Los nuevos participantes se asignarán al azar.",
    readOrdersFailed: "No se pudieron cargar los conjuntos de versiones.",
    localServerHint: "Inicia el servidor local y asegúrate de que la captura local de trials esté habilitada.",
    noOrders: "Todavía no se cargó ningún conjunto de versiones.",
    noOrdersInCategory: "Todavía no hay conjuntos de versiones en esta categoría.",
    uncategorized: "Sin categoría",
    activeBadge: "Activo",
    orderSummary: "{versions} versiones · {participants} participantes asignados",
    editName: "Nombre",
    editCategory: "Categoría",
    saveNameCategory: "Guardar nombre/categoría",
    activateSet: "Usar como activa",
    deleteSet: "Eliminar",
    activeHint: "Este conjunto de versiones se usa actualmente para asignar nuevos participantes. Activa otro conjunto antes de eliminar este.",
    assignedHint: "Ya hay participantes asignados a este conjunto de versiones, así que no se puede eliminar por ahora; los registros se conservan.",
    confirmActivate: "¿Usar “{name}” como el trial order activo para nuevos participantes? Los participantes existentes no cambiarán.",
    confirmDelete: "¿Eliminar “{name}”? Esta acción no se puede deshacer.",
    actionFailed: "La acción falló.",
    saveSuccess: "Se guardaron el nombre y la categoría.",
    activateSuccess: "Se cambió el conjunto activo. Las asignaciones existentes no cambian.",
    deleteSuccess: "Se eliminó el conjunto de versiones.",
    loadingResponses: "Cargando respuestas…",
    readResponsesFailed: "No se pudieron cargar las respuestas de participantes.",
    loadedResponses: "Se cargaron {count} respuestas diarias.",
    noSubmittedResponses: "Todavía no hay respuestas enviadas en la base de datos.",
    noResponseRows: "Todavía no hay respuestas registradas.",
    loadingParticipants: "Cargando registro…",
    readParticipantsFailed: "No se pudo cargar el registro de participantes.",
    noParticipantsInDb: "Todavía no hay registros de participantes en la base de datos.",
    noParticipantsYet: "Todavía no hay participantes registrados.",
    loadedParticipants: "Se cargaron {count} participantes.",
    statusActive: "Activo",
    statusWithdrawn: "Retirado",
    statusTerminated: "Finalizado",
    unassigned: "Sin asignar",
    yes: "Sí",
    no: "No",
    moodHappy: "Feliz",
    moodSad: "Triste",
    defaultCategory: "Estudio principal"
  }
};

function t(key, vars = {}) {
  const table = translations[currentLanguage] || translations.en;
  return String(table[key] ?? translations.en[key] ?? key).replace(/\{(\w+)\}/g, (_, token) => vars[token] ?? "");
}
function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
}
function setHtml(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.innerHTML = value;
}
function localizeCategory(category) {
  return !category || category === "Uncategorized" || category === "未分类" ? t("uncategorized") : category;
}
function normalizeCategory(category) {
  const value = String(category || "").trim();
  return !value || [translations.en.uncategorized, translations.zh.uncategorized, translations.es.uncategorized].includes(value) ? "Uncategorized" : value;
}
function statusLabel(status) {
  if (status === "ACTIVE") return t("statusActive");
  if (status === "WITHDRAWN") return t("statusWithdrawn");
  if (status === "TERMINATED") return t("statusTerminated");
  return status || "";
}
function groupLabel(value) {
  if (value === "TREATMENT") return currentLanguage === "zh" ? "Treatment 组" : currentLanguage === "es" ? "Tratamiento" : "Treatment";
  if (value === "CONTROL") return currentLanguage === "zh" ? "Control 组" : currentLanguage === "es" ? "Control" : "Control";
  return t("unassigned");
}
function groupFieldLabel() {
  return currentLanguage === "zh" ? "Study Group" : currentLanguage === "es" ? "Grupo del estudio" : "Study Group";
}
function participantGroupHeader() {
  return currentLanguage === "zh" ? "分组" : currentLanguage === "es" ? "Grupo asignado" : "Assigned Group";
}
function participantCountLabel(group) {
  if (group === "TREATMENT") return currentLanguage === "zh" ? "Treatment 人数" : currentLanguage === "es" ? "Participantes en tratamiento" : "Treatment Count";
  return currentLanguage === "zh" ? "Control 人数" : currentLanguage === "es" ? "Participantes en control" : "Control Count";
}
function participantDifferenceLabel() {
  return currentLanguage === "zh" ? "组间差值" : currentLanguage === "es" ? "Diferencia entre grupos" : "Group Difference";
}
function participantDifferenceNote(diff) {
  if (diff === 0) return currentLanguage === "zh" ? "目前完全平衡" : currentLanguage === "es" ? "Actualmente equilibrado" : "Currently balanced";
  if (currentLanguage === "zh") return "相差 " + diff + " 人";
  if (currentLanguage === "es") return "Diferencia de " + diff;
  return "Difference of " + diff;
}
function responseGroupHeader() {
  return currentLanguage === "zh" ? "分组" : currentLanguage === "es" ? "Grupo asignado" : "Assigned Group";
}
function responseVersionHeader() {
  return currentLanguage === "zh" ? "分配版本" : currentLanguage === "es" ? "Versión asignada" : "Assigned Version";
}
function effectiveAssignedGroup(row) {
  return row?.assignedGroup || row?.assignedVersion?.set?.assignmentGroup || row?.participant?.assignedGroup || row?.participant?.assignedVersion?.set?.assignmentGroup || "";
}
function moodLabel(value) {
  if (value === "HAPPY") return t("moodHappy");
  if (value === "SAD") return t("moodSad");
  return value || "";
}
function currentLocale() {
  return currentLanguage === "zh" ? "zh-CN" : currentLanguage === "es" ? "es-ES" : "en-US";
}
function escapeText(value) { const element = document.createElement("span"); element.textContent = String(value); return element.innerHTML; }
function escapeAttribute(value) { return escapeText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }

function applyTranslations(previousLanguage = null) {
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : currentLanguage === "es" ? "es" : "en";
  document.title = t("title");
  languageSelect.value = currentLanguage;
  setText("admin-language-label", t("language"));
  setText("admin-back", t("back"));
  setText("admin-eyebrow", t("eyebrow"));
  setText("admin-title", t("adminTitle"));
  setHtml("admin-intro", t("adminIntro"));
  setText("admin-warning-title", t("warningTitle"));
  setText("admin-warning-text", t("warningText"));
  setText("login-title", t("loginTitle"));
  setText("admin-password-label", t("passwordLabel"));
  setText("admin-login-button", t("loginButton"));
  setText("admin-logout", t("logoutButton"));
  setText("upload-title", t("uploadTitle"));
  setText("order-file-label", t("orderFileLabel"));
  setText("order-name-label", t("orderNameLabel"));
  setText("order-category-label", t("orderCategoryLabel"));
  setText("order-group-label", groupFieldLabel());
  setText("order-group-treatment", groupLabel("TREATMENT"));
  setText("order-group-control", groupLabel("CONTROL"));
  setText("upload-help", t("uploadHelp"));
  setText("import-order", t("importButton"));
  setText("participants-title", t("participantsTitle"));
  setText("participants-help", t("participantsHelp"));
  setText("refresh-participants", t("refreshParticipants"));
  setText("responses-title", t("responsesTitle"));
  setText("responses-help", t("responsesHelp"));
  setText("refresh-responses", t("refreshResponses"));
  setText("export-responses", t("exportResponses"));
  setText("orders-title", t("ordersTitle"));
  setText("order-category-filter-label", t("orderCategoryFilterLabel"));
  setText("participants-head-id", t("participantsHeadId"));
  setText("participants-head-name", t("participantsHeadName"));
  setText("participants-head-enrolled", t("participantsHeadEnrolled"));
  setText("participants-head-status", t("participantsHeadStatus"));
  setText("participants-head-days", t("participantsHeadDays"));
  setText("participants-head-group", participantGroupHeader());
  setText("participants-head-version", t("participantsHeadVersion"));
  setText("responses-head-id", t("responsesHeadId"));
  setText("responses-head-name", t("responsesHeadName"));
  setText("responses-head-group", responseGroupHeader());
  setText("responses-head-version", responseVersionHeader());
  setText("responses-head-date", t("responsesHeadDate"));
  setText("responses-head-day", t("responsesHeadDay"));
  setText("responses-head-pred-mood", t("responsesHeadPredMood"));
  setText("responses-head-actual-mood", t("responsesHeadActualMood"));
  setText("responses-head-pred-e", t("responsesHeadPredE"));
  setText("responses-head-actual-e", t("responsesHeadActualE"));
  setText("responses-head-t", t("responsesHeadT"));
  setText("responses-head-a", t("responsesHeadA"));
  setText("responses-head-fed", t("responsesHeadFed"));
  setText("responses-head-played", t("responsesHeadPlayed"));
  adminPasswordInput.setAttribute("aria-label", t("passwordLabel"));
  categoryInput.placeholder = t("orderCategoryPlaceholder");

  const defaultCategories = [translations.en.defaultCategory, translations.zh.defaultCategory, translations.es.defaultCategory];
  if (!categoryInput.value || defaultCategories.includes(categoryInput.value) || (previousLanguage && categoryInput.value === translations[previousLanguage]?.defaultCategory)) {
    categoryInput.value = t("defaultCategory");
  }

  if (!sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
    participantsStatus.textContent = t("participantsStatusIdle");
    responsesStatus.textContent = t("responsesStatusIdle");
  }
  if (!savedParticipants.length && !sessionStorage.getItem(ADMIN_TOKEN_KEY)) participantsTableBody.innerHTML = `<tr><td colspan="7">${escapeText(t("noParticipantsLoaded"))}</td></tr>`;
  if (!savedResponses.length && !sessionStorage.getItem(ADMIN_TOKEN_KEY)) responsesTableBody.innerHTML = `<tr><td colspan="14">${escapeText(t("noResponsesLoaded"))}</td></tr>`;
  refreshCategoryFilter();
  renderOrders();
  renderResponses();
  renderParticipants();
}

function adminHeaders(json = false) {
  const headers = { Authorization: `Bearer ${sessionStorage.getItem(ADMIN_TOKEN_KEY) || ""}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}
function showAdmin(isLoggedIn) {
  loginCard.hidden = isLoggedIn;
  adminContent.hidden = !isLoggedIn;
}
async function handleUnauthorized(response) {
  if (response.status !== 401 && response.status !== 403) return false;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  showAdmin(false);
  loginStatus.textContent = t("loginExpired");
  return true;
}

languageSelect.addEventListener("change", () => {
  const previousLanguage = currentLanguage;
  currentLanguage = languageSelect.value;
  localStorage.setItem(ADMIN_LANGUAGE_KEY, currentLanguage);
  applyTranslations(previousLanguage);
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  loginStatus.textContent = t("loggingIn");
  try {
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: adminPasswordInput.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || t("loginFailed"));
    sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
    adminPasswordInput.value = "";
    loginStatus.textContent = t("loginSuccess");
    showAdmin(true);
    await Promise.all([loadOrders(), loadResponses(), loadParticipants()]);
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#admin-logout").addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  showAdmin(false);
  applyTranslations();
});
refreshResponsesButton.addEventListener("click", loadResponses);
refreshParticipantsButton.addEventListener("click", loadParticipants);
exportResponsesButton.addEventListener("click", exportResponsesCsv);

fileInput.addEventListener("change", async () => {
  parsedOrder = null;
  importButton.disabled = true;
  preview.hidden = true;
  status.textContent = "";
  status.className = "admin-status";
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    parsedOrder = parseTrialOrderCsv(await file.text());
    nameInput.value = file.name.replace(/\.csv$/i, "") || "Trial order";
    preview.textContent = t("parsingSuccess", { count: parsedOrder.length });
    preview.hidden = false;
    importButton.disabled = false;
  } catch (error) {
    status.textContent = error.message;
    status.className = "admin-status is-error";
  }
});

importButton.addEventListener("click", async () => {
  if (!parsedOrder) return;
  importButton.disabled = true;
  status.textContent = t("writingDb");
  status.className = "admin-status";
  try {
    const response = await fetch("/api/admin/trial-orders", {
      method: "POST",
      headers: adminHeaders(true),
      body: JSON.stringify({ name: nameInput.value.trim(), category: normalizeCategory(categoryInput.value), assignmentGroup: orderGroupInput.value, versions: parsedOrder })
    });
    const result = await response.json();
    if (await handleUnauthorized(response)) throw new Error(t("loginExpired"));
    if (!response.ok) throw new Error(result.error || t("uploadFailed"));
    status.textContent = t("uploadActivated", { name: result.name, count: result.versionCount });
    status.className = "admin-status is-success";
    await loadOrders();
  } catch (error) {
    status.textContent = error.message;
    status.className = "admin-status is-error";
    importButton.disabled = false;
  }
});

async function loadOrders() {
  try {
    const response = await fetch("/api/admin/trial-orders", { headers: adminHeaders() });
    const sets = await response.json();
    if (await handleUnauthorized(response)) return;
    if (!response.ok) throw new Error(sets.error || t("readOrdersFailed"));
    savedOrders = sets;
    refreshCategoryFilter();
    renderOrders();
  } catch (error) {
    orderList.innerHTML = `<p class="admin-help">${escapeText(error.message)} ${escapeText(t("localServerHint"))}</p>`;
  }
}

function refreshCategoryFilter() {
  const previous = categoryFilter.value;
  const categories = [...new Set(savedOrders.map(set => normalizeCategory(set.category)))].sort((a, b) => localizeCategory(a).localeCompare(localizeCategory(b), currentLocale()));
  categoryFilter.innerHTML = `<option value="">${escapeText(t("allCategories"))}</option>` + categories.map(category => `<option value="${escapeAttribute(category)}">${escapeText(localizeCategory(category))}</option>`).join("");
  if (categories.includes(previous)) categoryFilter.value = previous;
}

function renderOrders() {
  const visible = savedOrders.filter(set => !categoryFilter.value || normalizeCategory(set.category) === categoryFilter.value);
  if (!savedOrders.length) {
    orderList.innerHTML = `<p class="admin-help">${escapeText(t("noOrders"))}</p>`;
    return;
  }
  if (!visible.length) {
    orderList.innerHTML = `<p class="admin-help">${escapeText(t("noOrdersInCategory"))}</p>`;
    return;
  }
  orderList.innerHTML = visible.map(set => {
    const assignedCount = set.versions.reduce((sum, version) => sum + version.assignedCount, 0);
    const category = normalizeCategory(set.category);
    return `<article class="order-set ${set.active ? "is-active" : ""}" data-order-id="${escapeAttribute(set.id)}">
      <div class="order-set-heading"><strong>${escapeText(set.name)}</strong><span class="category-badge">${escapeText(groupLabel(set.assignmentGroup))}</span><span class="category-badge">${escapeText(localizeCategory(category))}</span>${set.active ? `<span class="active-badge">${escapeText(t("activeBadge"))}</span>` : ""}</div>
      <p>${escapeText(t("orderSummary", { versions: set.versions.length, participants: assignedCount }))}</p>
      <small>${set.versions.map(version => `${escapeText(version.code)} (${version.assignedCount})`).join(" · ")}</small>
      <div class="order-set-edit"><label>${escapeText(t("editName"))}<input data-field="name" maxlength="120" value="${escapeAttribute(set.name)}"></label><label>${escapeText(t("editCategory"))}<input data-field="category" maxlength="80" value="${escapeAttribute(localizeCategory(category))}"></label><button class="button button-secondary" data-action="save" type="button">${escapeText(t("saveNameCategory"))}</button></div>
      <div class="order-set-actions"><button class="button button-secondary" data-action="activate" type="button" ${set.active ? "disabled" : ""}>${escapeText(t("activateSet"))}</button><button class="button button-secondary" data-action="delete" type="button" ${set.active || assignedCount ? "disabled" : ""}>${escapeText(t("deleteSet"))}</button></div>
      ${set.active ? `<small class="admin-help">${escapeText(t("activeHint"))}</small>` : assignedCount ? `<small class="admin-help">${escapeText(t("assignedHint"))}</small>` : ""}
    </article>`;
  }).join("");
}

categoryFilter.addEventListener("change", renderOrders);
orderList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest("[data-order-id]");
  const set = savedOrders.find(item => item.id === card?.dataset.orderId);
  if (!set) return;
  const action = button.dataset.action;
  button.disabled = true;
  try {
    let response;
    if (action === "save") {
      const name = card.querySelector('[data-field="name"]').value.trim();
      const category = normalizeCategory(card.querySelector('[data-field="category"]').value.trim());
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}`, { method: "PATCH", headers: adminHeaders(true), body: JSON.stringify({ name, category }) });
    } else if (action === "activate") {
      if (!confirm(t("confirmActivate", { name: set.name }))) { button.disabled = false; return; }
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}/activate`, { method: "POST", headers: adminHeaders(true) });
    } else {
      if (!confirm(t("confirmDelete", { name: set.name }))) { button.disabled = false; return; }
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}`, { method: "DELETE", headers: adminHeaders() });
    }
    const result = response.status === 204 ? {} : await response.json();
    if (await handleUnauthorized(response)) throw new Error(t("loginExpired"));
    if (!response.ok) throw new Error(result.error || t("actionFailed"));
    status.textContent = action === "save" ? t("saveSuccess") : action === "activate" ? t("activateSuccess") : t("deleteSuccess");
    status.className = "admin-status is-success";
    await loadOrders();
  } catch (error) {
    status.textContent = error.message;
    status.className = "admin-status is-error";
    button.disabled = false;
  }
});

async function loadResponses() {
  responsesStatus.textContent = t("loadingResponses");
  responsesStatus.className = "admin-status";
  refreshResponsesButton.disabled = true;
  exportResponsesButton.disabled = true;
  try {
    const response = await fetch("/api/responses", { headers: adminHeaders() });
    const rows = await response.json();
    if (await handleUnauthorized(response)) throw new Error(t("loginExpired"));
    if (!response.ok) throw new Error(rows.error || t("readResponsesFailed"));
    savedResponses = rows;
    renderResponses();
    responsesStatus.textContent = rows.length ? t("loadedResponses", { count: rows.length }) : t("noSubmittedResponses");
    exportResponsesButton.disabled = rows.length === 0;
  } catch (error) {
    responsesStatus.textContent = error.message;
    responsesStatus.className = "admin-status is-error";
  } finally {
    refreshResponsesButton.disabled = false;
  }
}

async function loadParticipants() {
  participantsStatus.textContent = t("loadingParticipants");
  participantsStatus.className = "admin-status";
  refreshParticipantsButton.disabled = true;
  try {
    const response = await fetch("/api/participants", { headers: adminHeaders() });
    const rows = await response.json();
    if (await handleUnauthorized(response)) throw new Error(t("loginExpired"));
    if (!response.ok) throw new Error(rows.error || t("readParticipantsFailed"));
    savedParticipants = rows;
    renderParticipants();
    participantsStatus.textContent = rows.length ? t("loadedParticipants", { count: rows.length }) : t("noParticipantsYet");
  } catch (error) {
    participantsStatus.textContent = error.message;
    participantsStatus.className = "admin-status is-error";
  } finally {
    refreshParticipantsButton.disabled = false;
  }
}

function renderParticipantGroupSummary() {
  const counts = savedParticipants.reduce((summary, row) => {
    const group = effectiveAssignedGroup(row);
    if (group === "TREATMENT") summary.treatment += 1;
    if (group === "CONTROL") summary.control += 1;
    return summary;
  }, { treatment: 0, control: 0 });
  const diff = Math.abs(counts.treatment - counts.control);
  participantGroupSummary.innerHTML = `
    <div class="group-summary-card">
      <span class="group-summary-label">${escapeText(participantCountLabel("TREATMENT"))}</span>
      <span class="group-summary-value">${counts.treatment}</span>
    </div>
    <div class="group-summary-card">
      <span class="group-summary-label">${escapeText(participantCountLabel("CONTROL"))}</span>
      <span class="group-summary-value">${counts.control}</span>
    </div>
    <div class="group-summary-card">
      <span class="group-summary-label">${escapeText(participantDifferenceLabel())}</span>
      <span class="group-summary-value">${diff}</span>
      <span class="group-summary-note">${escapeText(participantDifferenceNote(diff))}</span>
    </div>`;
}

function renderParticipants() {
  renderParticipantGroupSummary();
  if (!savedParticipants.length) {
    participantsTableBody.innerHTML = `<tr><td colspan="7">${escapeText(sessionStorage.getItem(ADMIN_TOKEN_KEY) ? t("noParticipantsInDb") : t("noParticipantsLoaded"))}</td></tr>`;
    return;
  }
  participantsTableBody.innerHTML = savedParticipants.map(row => `<tr>
    <td><code>${escapeText(row.id)}</code></td>
    <td>${escapeText(row.puppyName)}</td>
    <td>${escapeText(new Date(row.enrolledAt).toLocaleString(currentLocale()))}</td>
    <td>${escapeText(statusLabel(row.status))}</td>
    <td>${escapeText(row.responseCount)}</td>
    <td>${escapeText(groupLabel(effectiveAssignedGroup(row)))}</td>
    <td>${escapeText(row.assignedVersion?.code || t("unassigned"))}</td>
  </tr>`).join("");
}

function renderResponses() {
  if (!savedResponses.length) {
    responsesTableBody.innerHTML = `<tr><td colspan="14">${escapeText(sessionStorage.getItem(ADMIN_TOKEN_KEY) ? t("noResponseRows") : t("noResponsesLoaded"))}</td></tr>`;
    return;
  }
  responsesTableBody.innerHTML = savedResponses.map(row => `<tr>
    <td><code>${escapeText(row.participantId)}</code></td>
    <td>${escapeText(row.participant?.puppyName || "")}</td>
    <td>${escapeText(groupLabel(effectiveAssignedGroup(row)))}</td>
    <td>${escapeText(row.participant?.assignedVersion?.code || "")}</td>
    <td>${escapeText(String(row.studyDate || "").slice(0, 10))}</td>
    <td>${escapeText(row.studyDay)}</td>
    <td>${escapeText(moodLabel(row.moodPrediction))}</td>
    <td>${escapeText(moodLabel(row.actualMood))}</td>
    <td>${escapeText(row.predictedEScore ?? "")}</td>
    <td>${escapeText(row.actualEScore ?? "")}</td>
    <td>${escapeText(row.tValue ?? "")}</td>
    <td>${escapeText(row.aValue ?? "")}</td>
    <td>${row.fed ? escapeText(t("yes")) : escapeText(t("no"))}</td>
    <td>${row.played ? escapeText(t("yes")) : escapeText(t("no"))}</td>
  </tr>`).join("");
}

function exportResponsesCsv() {
  const columns = [
    ["participantId", "Participant ID"], ["puppyName", "Puppy name"], ["assignedGroup", "Assigned group"], ["assignedVersion", "Assigned version"], ["studyDate", "Study date"],
    ["studyDay", "Study day"], ["moodPrediction", "Predicted mood"], ["actualMood", "Actual mood"],
    ["predictedEScore", "Predicted E"], ["actualEScore", "Actual E"], ["tValue", "T"], ["aValue", "A"],
    ["tLabel", "T label"], ["aLabel", "A label"], ["fed", "Fed"], ["played", "Played"],
    ["foodDurationMs", "Food interaction duration (ms)"], ["activityDurationMs", "Activity interaction duration (ms)"],
    ["createdAt", "Submitted at"]
  ];
  const csvCell = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [columns.map(([, label]) => csvCell(label)).join(",")];
  for (const row of savedResponses) {
    const values = columns.map(([key]) => {
      if (key === "puppyName") return row.participant?.puppyName;
      if (key === "assignedGroup") return effectiveAssignedGroup(row) || "";
      if (key === "assignedVersion") return row.participant?.assignedVersion?.code || "";
      if (key === "fed") return row.fed ? "true" : "false";
      if (key === "played") return row.played ? "true" : "false";
      return row[key];
    });
    lines.push(values.map(csvCell).join(","));
  }
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `puppy-study-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

applyTranslations();
showAdmin(Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)));
if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) Promise.all([loadOrders(), loadResponses(), loadParticipants()]);
