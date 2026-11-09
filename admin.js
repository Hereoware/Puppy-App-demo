import { parseTrialOrderCsv } from "./trial-order-parser.mjs";

const fileInput = document.querySelector("#order-file");
const nameInput = document.querySelector("#order-name");
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
const ADMIN_TOKEN_KEY = "puppy-admin-session";
let parsedOrder = null;
let savedResponses = [];

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
  loginStatus.textContent = "登录已失效，请重新登录。";
  return true;
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  loginStatus.textContent = "正在登录…";
  try {
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: document.querySelector("#admin-password").value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "登录失败。");
    sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
    document.querySelector("#admin-password").value = "";
    loginStatus.textContent = "登录成功。";
    showAdmin(true);
    await Promise.all([loadOrders(), loadResponses()]);
  } catch (error) { loginStatus.textContent = error.message; }
  finally { button.disabled = false; }
});
document.querySelector("#admin-logout").addEventListener("click", () => { sessionStorage.removeItem(ADMIN_TOKEN_KEY); showAdmin(false); });
refreshResponsesButton.addEventListener("click", loadResponses);
exportResponsesButton.addEventListener("click", exportResponsesCsv);

fileInput.addEventListener("change", async () => {
  parsedOrder = null;
  importButton.disabled = true;
  preview.hidden = true;
  status.textContent = "";
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    parsedOrder = parseTrialOrderCsv(await file.text());
    nameInput.value = file.name.replace(/\.csv$/i, "") || "Trial order";
    preview.textContent = `已验证：${parsedOrder.length} 个版本，每个版本 24 天；参与者将从这些版本中随机分配。`;
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
  status.textContent = "正在写入数据库…";
  status.className = "admin-status";
  try {
    const response = await fetch("/api/admin/trial-orders", {
      method: "POST",
      headers: adminHeaders(true),
      body: JSON.stringify({ name: nameInput.value.trim(), versions: parsedOrder })
    });
    const result = await response.json();
    if (await handleUnauthorized(response)) throw new Error("登录已失效，请重新登录。");
    if (!response.ok) throw new Error(result.error || "上传失败。");
    status.textContent = `已启用「${result.name}」，共 ${result.versionCount} 个版本。新参与者将随机分配。`;
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
    if (!response.ok) throw new Error(sets.error || "无法读取版本组。");
    if (!sets.length) { orderList.innerHTML = '<p class="admin-help">还没有上传版本组。</p>'; return; }
    orderList.innerHTML = sets.map((set) => `<article class="order-set ${set.active ? "is-active" : ""}"><div><strong>${escapeText(set.name)}</strong>${set.active ? '<span class="active-badge">当前启用</span>' : ""}</div><p>${set.versions.length} 个版本 · ${set.versions.reduce((sum, version) => sum + version.assignedCount, 0)} 位参与者已分配</p><small>${set.versions.map((version) => `${escapeText(version.code)} (${version.assignedCount})`).join(" · ")}</small></article>`).join("");
  } catch (error) {
    orderList.innerHTML = `<p class="admin-help">${escapeText(error.message)} 请先启动本地服务器，并确认本地 trial capture 已启用。</p>`;
  }
}

async function loadResponses() {
  responsesStatus.textContent = "正在读取回答…";
  responsesStatus.className = "admin-status";
  refreshResponsesButton.disabled = true;
  exportResponsesButton.disabled = true;
  try {
    const response = await fetch("/api/responses", { headers: adminHeaders() });
    const rows = await response.json();
    if (await handleUnauthorized(response)) throw new Error("登录已失效，请重新登录。");
    if (!response.ok) throw new Error(rows.error || "无法读取参与者回答。");
    savedResponses = rows;
    renderResponses();
    responsesStatus.textContent = rows.length ? `已加载 ${rows.length} 条每日回答。` : "数据库中还没有已提交的回答。";
    exportResponsesButton.disabled = rows.length === 0;
  } catch (error) {
    responsesStatus.textContent = error.message;
    responsesStatus.className = "admin-status is-error";
  } finally {
    refreshResponsesButton.disabled = false;
  }
}

function renderResponses() {
  if (!savedResponses.length) {
    responsesTableBody.innerHTML = '<tr><td colspan="12">还没有回答记录。</td></tr>';
    return;
  }
  responsesTableBody.innerHTML = savedResponses.map(row => `<tr>
    <td><code>${escapeText(row.participantId)}</code></td>
    <td>${escapeText(row.participant?.puppyName || "")}</td>
    <td>${escapeText(String(row.studyDate || "").slice(0, 10))}</td>
    <td>${escapeText(row.studyDay)}</td>
    <td>${escapeText(moodLabel(row.moodPrediction))}</td>
    <td>${escapeText(moodLabel(row.actualMood))}</td>
    <td>${escapeText(row.predictedEScore ?? "")}</td>
    <td>${escapeText(row.actualEScore ?? "")}</td>
    <td>${escapeText(row.tValue ?? "")}</td>
    <td>${escapeText(row.aValue ?? "")}</td>
    <td>${row.fed ? "是" : "否"}</td>
    <td>${row.played ? "是" : "否"}</td>
  </tr>`).join("");
}

function moodLabel(value) {
  if (value === "HAPPY") return "快乐";
  if (value === "SAD") return "难过";
  return value || "";
}

function exportResponsesCsv() {
  const columns = [
    ["participantId", "Participant ID"], ["puppyName", "Puppy name"], ["studyDate", "Study date"],
    ["studyDay", "Study day"], ["moodPrediction", "Predicted mood"], ["actualMood", "Actual mood"],
    ["predictedEScore", "Predicted E"], ["actualEScore", "Actual E"], ["tValue", "T"], ["aValue", "A"],
    ["tLabel", "T label"], ["aLabel", "A label"], ["fed", "Fed"], ["played", "Played"],
    ["foodDurationMs", "Food interaction duration (ms)"], ["activityDurationMs", "Activity interaction duration (ms)"],
    ["createdAt", "Submitted at"]
  ];
  const csvCell = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [columns.map(([, label]) => csvCell(label)).join(",")];
  for (const row of savedResponses) {
    const values = columns.map(([key]) => key === "puppyName" ? row.participant?.puppyName : row[key]);
    lines.push(values.map(csvCell).join(","));
  }
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `puppy-study-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeText(value) { const element = document.createElement("span"); element.textContent = String(value); return element.innerHTML; }

showAdmin(Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)));
if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) Promise.all([loadOrders(), loadResponses()]);
