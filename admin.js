import { parseTrialOrderCsv } from "./trial-order-parser.mjs";

const fileInput = document.querySelector("#order-file");
const nameInput = document.querySelector("#order-name");
const categoryInput = document.querySelector("#order-category");
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
const ADMIN_TOKEN_KEY = "puppy-admin-session";
let parsedOrder = null;
let savedResponses = [];
let savedOrders = [];

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
      body: JSON.stringify({ name: nameInput.value.trim(), category: categoryInput.value.trim(), versions: parsedOrder })
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
    savedOrders = sets;
    refreshCategoryFilter();
    renderOrders();
  } catch (error) {
    orderList.innerHTML = `<p class="admin-help">${escapeText(error.message)} 请先启动本地服务器，并确认本地 trial capture 已启用。</p>`;
  }
}

function refreshCategoryFilter() {
  const previous = categoryFilter.value;
  const categories = [...new Set(savedOrders.map(set => set.category || "未分类"))].sort((a, b) => a.localeCompare(b));
  categoryFilter.innerHTML = '<option value="">所有分类</option>' + categories.map(category => `<option value="${escapeAttribute(category)}">${escapeText(category)}</option>`).join("");
  if (categories.includes(previous)) categoryFilter.value = previous;
}

function renderOrders() {
  const visible = savedOrders.filter(set => !categoryFilter.value || (set.category || "未分类") === categoryFilter.value);
  if (!savedOrders.length) { orderList.innerHTML = '<p class="admin-help">还没有上传版本组。</p>'; return; }
  if (!visible.length) { orderList.innerHTML = '<p class="admin-help">这个分类下还没有版本组。</p>'; return; }
  orderList.innerHTML = visible.map(set => {
    const assignedCount = set.versions.reduce((sum, version) => sum + version.assignedCount, 0);
    return `<article class="order-set ${set.active ? "is-active" : ""}" data-order-id="${escapeAttribute(set.id)}">
      <div class="order-set-heading"><strong>${escapeText(set.name)}</strong><span class="category-badge">${escapeText(set.category || "未分类")}</span>${set.active ? '<span class="active-badge">当前启用</span>' : ""}</div>
      <p>${set.versions.length} 个版本 · ${assignedCount} 位参与者已分配</p>
      <small>${set.versions.map(version => `${escapeText(version.code)} (${version.assignedCount})`).join(" · ")}</small>
      <div class="order-set-edit"><label>名称<input data-field="name" maxlength="120" value="${escapeAttribute(set.name)}"></label><label>分类<input data-field="category" maxlength="80" value="${escapeAttribute(set.category || "未分类")}"></label><button class="button button-secondary" data-action="save" type="button">保存名称/分类</button></div>
      <div class="order-set-actions"><button class="button button-secondary" data-action="activate" type="button" ${set.active ? "disabled" : ""}>设为当前版本</button><button class="button button-secondary" data-action="delete" type="button" ${set.active || assignedCount ? "disabled" : ""}>删除</button></div>
      ${set.active ? '<small class="admin-help">当前版本组正用于新参与者的随机分配。若要删除，请先启用其他版本组。</small>' : assignedCount ? '<small class="admin-help">已有参与者分配到此版本组，暂不能删除；参与者记录会保留。</small>' : ""}
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
      const category = card.querySelector('[data-field="category"]').value.trim();
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}`, { method: "PATCH", headers: adminHeaders(true), body: JSON.stringify({ name, category }) });
    } else if (action === "activate") {
      if (!confirm(`將「${set.name}」設為新參與者的當前 trial order？已分配的參與者不會改變。`)) { button.disabled = false; return; }
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}/activate`, { method: "POST", headers: adminHeaders(true) });
    } else {
      if (!confirm(`確定刪除「${set.name}」？此操作無法復原。`)) { button.disabled = false; return; }
      response = await fetch(`/api/admin/trial-orders/${encodeURIComponent(set.id)}`, { method: "DELETE", headers: adminHeaders() });
    }
    const result = response.status === 204 ? {} : await response.json();
    if (await handleUnauthorized(response)) throw new Error("登录已失效，请重新登录。");
    if (!response.ok) throw new Error(result.error || "操作失败。");
    status.textContent = action === "save" ? "名称和分类已保存。" : action === "activate" ? "已切换当前版本组；现有参与者的分配不会改变。" : "版本组已删除。";
    status.className = "admin-status is-success";
    await loadOrders();
  } catch (error) {
    status.textContent = error.message;
    status.className = "admin-status is-error";
    button.disabled = false;
  }
});

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
function escapeAttribute(value) { return escapeText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }

showAdmin(Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)));
if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) Promise.all([loadOrders(), loadResponses()]);
