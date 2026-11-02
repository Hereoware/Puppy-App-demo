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
const ADMIN_TOKEN_KEY = "puppy-admin-session";
let parsedOrder = null;

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
    await loadOrders();
  } catch (error) { loginStatus.textContent = error.message; }
  finally { button.disabled = false; }
});
document.querySelector("#admin-logout").addEventListener("click", () => { sessionStorage.removeItem(ADMIN_TOKEN_KEY); showAdmin(false); });

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
function escapeText(value) { const element = document.createElement("span"); element.textContent = String(value); return element.innerHTML; }

showAdmin(Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)));
if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) loadOrders();
