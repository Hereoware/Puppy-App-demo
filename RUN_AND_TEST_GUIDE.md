# Puppy App：本机运行与测试指南

这份指南说明如何在本机启动 PostgreSQL 和 Puppy App 后端、导入 trial order，并打开参与者前端进行练习。当前这套 PostgreSQL 流程是**本机开发版**，不能用于真实参与者的数据收集。

## 1. 需要准备的工具

- Node.js 和 npm
- Rancher Desktop（或可用的 Docker Desktop），并确认 Docker 容器引擎正在运行
- 本机项目文件夹

在 PowerShell 中先切换到项目根目录，例如：

```powershell
cd "C:\Users\21683\OneDrive - University of Pittsburgh\Documents\ChatGPT\Puppy App!"
```

## 2. 启动 PostgreSQL

确保 `backend/.env` 存在并包含本机练习用的 `DATABASE_URL`。如果没有，可以复制 `backend/.env.example` 为 `backend/.env`。`.env` 含有数据库凭据，**不要上传到 GitHub 或发给参与者**。

在项目根目录启动数据库容器：

```powershell
docker compose up -d
```

可查看容器状态：

```powershell
docker compose ps
```

## 3. 应用数据库迁移

第一次运行，或本次代码更新后，在 `backend` 目录执行：

```powershell
cd backend
npm run db:migrate
cd ..
```

这会创建或更新本机数据库表，并重新生成 Prisma Client。若出现连接错误，先确认 Docker 容器正常运行，以及 `backend/.env` 的数据库地址、用户名和密码与 `docker-compose.yml` 一致。

## 4. 启动 Puppy App 后端

在项目根目录运行：

```powershell
npm run dev
```

保持这个 PowerShell 窗口打开。健康检查地址是：

```text
http://localhost:3001/api/health
```

正常时会返回类似 `{"ok":true,"database":"connected"}` 的结果。

## 5. 导入 trial order

在同一台电脑的浏览器打开本机管理员页面：

```text
http://localhost:3001/admin
```

管理员页接受从 Excel 工作簿 **AllVersions** 工作表导出的 UTF-8 CSV。项目中已经有一份从你给的 `T(12).xlsx` 导出的本机文件：

```text
trial-orders/T12-AllVersions.csv
```

页面选择此 CSV，确认预览后点击“验证并启用”。导入器要求表头含有 `version`、`day`、`T`、`A`、`E`、`T_label`、`A_label`。每个版本必须恰好有 24 天；T/A 为 0 或 1；E 为 -1 到 10 的整数。

当前 CSV 有 30 个版本。若只想让参与者在一部分版本中随机分配，请在 Excel 的 `AllVersions` 表中只保留你选中的版本行（保留表头），再另存为 CSV 上传。每个保留版本仍需包含第 1–24 天。

每次成功导入都会将新版本组设为启用状态；**之后新注册的参与者**会从该组的版本中随机分配一个。已注册参与者保留原来的版本。

## 6. 打开参与者前端

在同一台电脑打开：

```text
http://localhost:3001/?backend=postgres
```

这是要测试本机 PostgreSQL 随机分配、当日 trial 和提交记录时应该使用的前端网址。完成注册后，网页会从本机 API 获取分配给该参与者的当天 T/A/E；服务器会限制只读取当前研究日，并保存预测 E、实际 E、T/A 值及互动完成情况。

要测试另一个新参与者，可以用浏览器隐私/无痕窗口打开同一网址，创建新的参与者。每个浏览器的参与者状态保存在该浏览器的本机存储中。

如需查看数据库记录，在新的 PowerShell 窗口从项目根目录运行：

```powershell
npm run db:studio
```

Prisma Studio 会显示终端给出的本机地址，通常是 `http://localhost:5555`。可以查看 `Participant`、`TrialOrderSet`、`TrialOrderVersion` 和 `DailyResponse`。

## 7. 运行自动测试

在项目根目录运行：

```powershell
npm test
```

当前测试覆盖 CSV 导入器：检查 T(12) 中 30 个版本的 24 天数据，并检查缺天、非二元 T/A、越界 E 和缺少列名时会被拒绝。它们是**数据导入单元测试**，不是完整的浏览器或 PostgreSQL 端到端测试。

目前尚未建立数据库端到端测试。若要执行完整数据库试跑，先启动 Docker、运行数据库迁移，再按第 4–6 节完成一次注册、两个互动、E 预测和提交，并在 Prisma Studio 查看对应记录。

完成后可在数据库窗口运行以下命令停止容器，同时保留本机数据库卷：

```powershell
docker compose stop
```

不要运行 `docker compose down -v`，因为 `-v` 会删除本机数据库卷和其中的练习数据。

## 8. GitHub Pages 上的网址做什么

公开的参与者网页仍可从以下 HTTPS 地址访问：

```text
https://hereoware.github.io/Puppy-App-demo/
```

这是 GitHub Pages 的静态前端，适合检查页面、图标、PWA 外观和演示交互。它**不会连接你电脑上的 PostgreSQL**；在这个网址上不会执行本机管理员导入或服务器随机分配。要测试当前 PostgreSQL 后端，请使用第 6 节的 `localhost:3001` 地址。

如果想在手机上通过同一 Wi-Fi 测试本机后端：

1. 电脑和手机连接同一个 Wi-Fi。
2. 在电脑运行 `ipconfig`，找到当前 Wi-Fi 网卡的 IPv4 地址。
3. 手机打开 `http://电脑的IPv4地址:3001/?backend=postgres`，例如 `http://192.168.1.23:3001/?backend=postgres`。
4. 后端运行期间，电脑不能关机或断开网络。若连接失败，检查 Windows 防火墙是否允许 Node.js 在私人网络接收连接。

本机地址用于开发测试。GitHub Pages 的 HTTPS PWA 和这个本机 HTTP 后端是两条不同的运行路径；浏览器也不会把 GitHub Pages 里的相对 `/api` 请求自动转发到本机服务。

## 为什么 PostgreSQL 不能直接在 GitHub Pages 上运行？

GitHub Pages 负责发布 HTML、CSS、JavaScript 和图片等静态文件；它不会持续运行 Node/Express 进程，也不提供 PostgreSQL 数据库进程。当前 `docker-compose.yml` 在你的电脑上启动 PostgreSQL，`backend/server.js` 也只在电脑上监听 `localhost:3001`。电脑关机后，这个 API 和数据库就不可访问。

要让不同地点的参与者在线访问同一个数据库，需要把后端和数据库分别部署到能运行服务器进程与托管 PostgreSQL 的云端服务，并且：

- 在托管服务的环境变量中配置数据库连接，不把 `.env` 或密码提交到 GitHub。
- 把数据库迁移安全地应用到云端数据库，并设置备份和访问策略。
- 给研究者管理页加登录和权限控制；目前管理员 API 只有开发模式开关，没有研究者身份认证。
- 给参与者 API 配置身份验证、HTTPS、请求来源策略和服务端每日锁定。前端当前使用相对路径 `/api`；跨域托管时还需要配置 API 地址和 CORS。
- 将研究者后台和参与者页面的访问范围按 IRB 批准的数据管理方案配置。

**不要把当前开发服务器直接暴露到互联网。**它的导入、参与者和数据读取接口没有生产级身份验证；将 `PUPPY_LOCAL_TRIAL_CAPTURE=true` 与 `NODE_ENV=development` 用在公开服务器上会开放这些接口。当前仓库的 GitHub Pages 发布只更新了静态前端和代码仓库，不代表 PostgreSQL 后台已经在线。
