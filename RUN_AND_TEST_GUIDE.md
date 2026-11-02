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

确保 `backend/.env` 存在并包含本机练习用的 `DATABASE_URL`。如果没有，可以复制 `backend/.env.example` 为 `backend/.env`。如已有本机 `.env`，无需额外配置 `DIRECT_URL`；Prisma 本机迁移会回退使用 `DATABASE_URL`。`.env` 含有数据库凭据，**不要上传到 GitHub 或发给参与者**。

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

管理员页先要求输入研究者密码。本机开发的默认密码是 `puppy-local-admin`；线上部署时必须在主机密钥设置中设定一个至少 16 个字符的专用密码。登录后，页面接受从 Excel 工作簿 **AllVersions** 工作表导出的 UTF-8 CSV。项目中已经有一份从你给的 `T(12).xlsx` 导出的本机文件：

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

## 8. 免费云端试运行（Render + Neon）

仓库里的 `Dockerfile` 和 `render.yaml` 已准备好将同源的网页、Express API 和 Prisma 迁移部署为一个 Render Web Service。PostgreSQL 放在 Neon。此方案仅用于不含真实参与者的短期 staging / 技术验证。

> **免费服务不适合正式研究数据。**Render 免费 Web Service 空闲 15 分钟会休眠，唤醒通常约一分钟；Render 免费 Postgres 30 天后到期且没有备份。Neon Free 可以作为测试数据库，但免费额度、休眠/恢复行为和账户要求以创建时的控制台为准。不要将真实参与者数据写进免费测试环境。详见 [Render 免费计划限制](https://render.com/docs/free) 与 [Neon 免费计划说明](https://neon.com/blog/neon-free-plan-1-gb-per-project)。

### 8.1 创建 Neon 测试数据库

1. 登录 Neon，创建一个专用于 Puppy App staging 的 PostgreSQL project；选离 Render 服务较近的区域。
2. 在 Neon 控制台分别复制 pooled connection string 和 direct connection string（均通常以 `postgresql://` 开头）。将它们当作密码保管，不要发到聊天、提交到 Git 或写入本机前端文件。
3. 暂时把连接串放在密码管理器，稍后分别粘贴到 Render 的 `DATABASE_URL`（pooled，给应用连接）和 `DIRECT_URL`（direct，供 Prisma 执行数据库迁移）。

### 8.2 连接 GitHub 仓库并创建服务

1. 确认代码已 commit 并 push 到 GitHub 的 `main` 分支。Render 控制台连接 GitHub 账号后，选择 `Hereoware/Puppy-App-demo` 仓库。
2. 在 Render 选择 **New → Blueprint**，连接仓库并采用根目录的 `render.yaml`。如果 Blueprint 页面不能直接创建，选择 **New → Web Service**，Runtime 选 Docker、Branch 选 `main`、Health Check Path 填 `/api/health`、Instance Type 选 Free。
3. 在 Render 服务的 **Environment** 页添加/填写：
   - `DATABASE_URL`：粘贴 Neon 的 pooled connection string。
   - `DIRECT_URL`：粘贴 Neon 的 direct connection string。
   - `ADMIN_PASSWORD`：创建一个不复用 Pitt/GitHub 密码的长随机密码，至少 16 个字符。只填在 Render 的 Secret/Environment 页面。
   - `JWT_SECRET`：Blueprint 会生成随机值；若手动创建服务，用密码管理器生成至少 32 个随机字符。
   - 确认 `NODE_ENV=production`。不要设置 `PUPPY_LOCAL_TRIAL_CAPTURE=true`。
4. 保存后触发部署。Docker 启动命令会先执行 `prisma migrate deploy`，再启动 API。等 Render 显示 Live 后，在 Render 页面复制 `onrender.com` HTTPS 地址。
5. 打开 `https://你的服务.onrender.com/api/health`，确认返回 `{"ok":true,"database":"connected"}`。第一次访问休眠服务可能要等它启动。

### 8.3 导入数据并打开前端

1. 打开 `https://你的服务.onrender.com/admin`，输入 `ADMIN_PASSWORD` 登录。
2. 选择 `trial-orders/T12-AllVersions.csv`（该文件不会被 Docker 镜像发布，需要从你的本机项目文件夹选择上传），确认 30 个版本、每版 24 天，然后点“验证并启用”。
3. 参与者网页网址是 `https://你的服务.onrender.com/?backend=postgres`。先用你自己创建的测试参与者试跑，不要招募真实参与者。
4. 新参与者首次注册后会出现恢复码。保存它；恢复时系统会轮换并显示新恢复码，因此每次跨设备恢复后都要保存新码。不要把恢复码与参与者回答放在同一份共享文件中。

### 8.4 费用、数据和安全边界

- 本指南按免费计划准备，但第三方方案/额度会变化。创建资源前检查计划价格、是否要求付款方式、用量/超额规则和自动升级开关；如要求添加付款方式，或任何页面提示会收费，先停止，不要确认。
- Render 免费 Web Service 会冷启动；Render 免费数据库有 30 天期限且无备份。因此这个部署只用于演示和功能验证，**不可用于真实研究数据或连续 24 天的参与者研究**。
- Neon 数据库中仅放合成测试记录。研究数据上线前，需由课题组确定经费、供应商审批、IRB/数据留存和删除方案、备份及访问审计，并选有持久化/备份保障的托管数据库。
- 研究者 API 由密码登录保护；参与者写入、取 trial 与恢复码轮换由参与者 bearer session 保护。HTTPS 由 Render 提供。这个 staging 实现仍不是 IRB/隐私/安全审查的替代品。
- 当前 `/api/health` 只公开数据库连通状态；不要将数据库连接串、管理密码、JWT 密钥或参与者恢复码贴到 Issue、聊天或代码仓库。

### 8.5 停止或删除 staging

在 Render 删除 Web Service，在 Neon 控制台删除对应的 staging project。删除前确认只选择 Puppy App 的测试资源；若不确定，不要点删除。免费服务休眠不等同于删除数据库。

## 9. GitHub Pages 上的网址做什么

公开的参与者网页仍可从以下 HTTPS 地址访问：

```text
https://hereoware.github.io/Puppy-App-demo/
```

这是 GitHub Pages 的静态前端，适合检查页面、图标、PWA 外观和演示交互。它**不会连接本机或云端 PostgreSQL**；数据库试运行要打开 Render 的 HTTPS 地址并加 `?backend=postgres`。

如果想在手机上通过同一 Wi-Fi 测试本机后端：

1. 电脑和手机连接同一个 Wi-Fi。
2. 在电脑运行 `ipconfig`，找到当前 Wi-Fi 网卡的 IPv4 地址。
3. 手机打开 `http://电脑的IPv4地址:3001/?backend=postgres`，例如 `http://192.168.1.23:3001/?backend=postgres`。
4. 后端运行期间，电脑不能关机或断开网络。若连接失败，检查 Windows 防火墙是否允许 Node.js 在私人网络接收连接。

本机地址用于开发测试。GitHub Pages 的 HTTPS PWA 和这个本机 HTTP 后端是两条不同的运行路径；浏览器也不会把 GitHub Pages 里的相对 `/api` 请求自动转发到本机服务。

## 为什么 PostgreSQL 不能直接在 GitHub Pages 上运行？

GitHub Pages 负责发布 HTML、CSS、JavaScript 和图片等静态文件；它不会持续运行 Node/Express 进程，也不提供 PostgreSQL 数据库进程。本项目现在包含容器部署配置，但这不代表云端资源已经创建。必须完成上面的 Render 与 Neon 控制台步骤，才会出现真实在线的后端和数据库。
