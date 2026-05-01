# FutureAgent 生产部署手把手指南

> 本文档面向零基础用户，逐步指导如何将 FutureAgent 部署到生产环境。
> 每一步都细化到"点哪个按钮、填什么值"的级别。

---

## 部署架构总览

```
你的 GitHub 仓库
    ├── push 代码 ──→ Tencent EdgeOne Pages（前端）
    │                    │
    │                    │ 用户浏览器
    │                    │ HTTPS 请求 /api/*
    │                    ▼
    └── push 代码 ──→ Render / Railway / Fly.io / 腾讯云（后端）
                         │
                         │ postgresql+asyncpg://
                         ▼
                      Supabase PostgreSQL（数据库）
```

**你需要准备的账号：**
- GitHub 账号（代码托管）
- Supabase 账号（数据库）：https://supabase.com
- 后端部署平台账号（四选一）：Render / Railway / Fly.io / 腾讯云
- 腾讯云 EdgeOne Pages 账号（前端）

---

## 第零步：将代码推送到 GitHub

如果你还没有 GitHub 仓库，先创建一个：

```bash
# 在项目根目录
cd e:\boring\futureagent

# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 在 GitHub 上创建仓库后，关联远程仓库
git remote add origin https://github.com/你的用户名/futureagent.git

# 推送
git push -u origin main
```

> 推送前确认 `.env` 文件、`*.db` 文件、`node_modules/` 目录没有被提交。
> 项目 `.gitignore` 已配置排除这些文件。

---

## 第一步：创建 Supabase PostgreSQL 数据库

### 1.1 注册并登录 Supabase

1. 打开浏览器，访问 https://supabase.com
2. 点击右上角 **Start your project** 按钮
3. 选择登录方式（GitHub / Google / Email）
4. 如果用 GitHub 登录，授权 Supabase 访问你的 GitHub 账号

### 1.2 创建新项目

1. 登录后进入 Dashboard 页面
2. 点击 **New Project** 按钮
3. 填写以下信息：
   - **Organization**：选择已有组织，或点击 **New organization** 创建一个（名字随便填，如 `my-org`）
   - **Project name**：填 `futureagent`（可自定义）
   - **Database Password**：**务必记住这个密码！** 建议用密码管理器生成并保存。例如 `MySecure@Pass123`
   - **Region**：选择 `Northeast Asia (ap-northeast)` 或 `Southeast Asia (ap-southeast)` — 选离你近的
   - **Pricing Plan**：选择 **Free**（免费版足够测试和小规模使用）
4. 点击 **Create new project**
5. 等待 1-2 分钟，项目创建完成

### 1.3 获取数据库连接串

1. 项目创建完成后，进入项目 Dashboard
2. 在左侧边栏找到齿轮图标 **Project Settings**，点击进入
3. 点击 **Database** 选项卡
4. 向下滚动到 **Connection string** 区域
5. 选择 **URI** 标签页
6. 你会看到类似以下的连接串：

```
postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.4 转换连接串格式

Supabase 默认给出的是 `postgresql://` 格式，FutureAgent 需要 `postgresql+asyncpg://` 格式。

**你需要做的修改：只改协议头**

| Supabase 给的 | 你要改成的 |
|---|---|
| `postgresql://` | `postgresql+asyncpg://` |

**示例：**

Supabase 给的原始串：
```
postgresql://postgres.abcdefghijklmnop:MySecurePass@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

转换后的串（只加了 `+asyncpg`）：
```
postgresql+asyncpg://postgres.abcdefghijklmnop:MySecurePass@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.5 如果密码包含特殊字符

如果你的密码中包含以下字符，需要进行 URL 编码：

| 字符 | 编码为 |
|------|--------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `/` | `%2F` |
| `:` | `%3A` |

**示例：** 密码 `P@ss#100%` → 编码为 `P%40ss%23100%25`

**转换后的完整串：**
```
postgresql+asyncpg://postgres.abcdefghijklmnop:P%40ss%23100%25@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.6 选择哪种连接方式

Supabase 提供三种连接方式，建议按以下优先级选择：

| 优先级 | 方式 | 端口 | 建议 |
|--------|------|------|------|
| 1 | Session Pooler | 5432 | **首选推荐**，兼容性最好 |
| 2 | Direct Connection | 5432 | 备选，适合低流量 |
| 3 | Transaction Pooler | 6543 | Supabase 默认，但与 asyncpg 有兼容风险 |

**如果使用 Session Pooler（推荐）：**
连接串中的端口改为 `5432`，host 改为 `pooler.supabase.com`：
```
postgresql+asyncpg://postgres.abcdefghijklmnop:MySecurePass@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**如果使用 Direct Connection：**
连接串的 host 和用户名都不同：
```
postgresql+asyncpg://postgres:MySecurePass@db.abcdefghijklmnop.supabase.co:5432/postgres
```
> 注意：Direct Connection 的用户名是 `postgres`（没有 `.abcdefghijklmnop` 后缀）

### 1.7 记录你的连接串

把最终转换好的连接串保存到一个安全的地方（如密码管理器），后面配置后端时会用到。

**⚠️ 不要将此连接串提交到 Git 仓库！**

---

## 第二步：部署后端

以下提供四种后端部署方式，请根据你的情况选择其中一种。

---

### 方式 A：Render 部署后端（推荐，最简单）

#### A.1 注册 Render

1. 打开 https://render.com
2. 点击 **Get Started for Free**
3. 选择 **GitHub** 登录
4. 授权 Render 访问你的 GitHub 仓库

#### A.2 创建 Web Service

1. 登录后进入 Dashboard
2. 点击右上角 **New** 按钮
3. 选择 **Web Service**

#### A.3 连接 GitHub 仓库

1. 在 **Connect a repository** 页面，找到你的 `futureagent` 仓库
2. 如果看不到，点击 **Configure account** 授权更多仓库
3. 点击仓库旁边的 **Connect** 按钮

#### A.4 配置服务

填写以下配置项：

| 字段 | 填写内容 |
|------|----------|
| **Name** | `futureagent-backend`（可自定义） |
| **Region** | 选择 `Singapore` 或离你近的区域 |
| **Root Directory** | `backend` |
| **Runtime** | 选择 `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | 选择 `Free` |

#### A.5 添加环境变量

1. 在同一页面向下滚动到 **Environment Variables** 区域
2. 逐个点击 **Add Environment Variable**，添加以下变量：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 你在第一步转换好的 Supabase 连接串 |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `["https://你的前端域名.pages.edgeone.com"]` |

> `CORS_ORIGINS` 先填一个临时值，等前端部署好后再修改。
> 如果暂时不知道前端域名，可以先填 `["http://localhost:5173"]`，后面再改。

> 如果你要用真实 LLM（Real 模式），还需要添加：
>
> | Key | Value |
> |-----|-------|
> | `OPENAI_API_KEY` | `sk-你的API密钥` |
> | `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
> | `DEFAULT_PROVIDER` | `openai_compatible` |
> | `DEFAULT_MODEL` | `gpt-4o-mini` |

> 如果你要用 MiMo，还需要添加：
>
> | Key | Value |
> |-----|-------|
> | `MIMO_API_KEY` | 你的 MiMo API Key |
> | `MIMO_BASE_URL` | 你的 MiMo API 地址 |

#### A.6 部署

1. 点击页面底部的 **Create Web Service** 按钮
2. Render 开始构建和部署，等待 2-5 分钟
3. 在 **Logs** 标签页可以查看构建进度
4. 部署成功后，页面顶部会显示你的服务 URL，如 `https://futureagent-backend.onrender.com`

#### A.7 验证后端

1. 在浏览器中打开 `https://futureagent-backend.onrender.com/api/health`
2. 应该看到类似以下 JSON：
   ```json
   {"status":"ok","app_name":"Composite Visual AI Agent Coordination System","version":"0.1.0","timestamp":"..."}
   ```
3. **记录这个 URL**，后面前端要用

#### A.8 Render 免费版注意事项

- 15 分钟无请求后会休眠
- 冷启动需要 30-60 秒
- 如果想保持在线，可以用 [UptimeRobot](https://uptimerobot.com) 每 10 分钟 ping 一次 `https://futureagent-backend.onrender.com/api/health`

---

### 方式 B：Railway 部署后端

#### B.1 注册 Railway

1. 打开 https://railway.app
2. 点击 **Login** → 选择 **GitHub** 登录
3. 授权 Railway 访问你的仓库

#### B.2 创建项目

1. 点击 **New Project**
2. 选择 **Deploy from GitHub Repo**
3. 选择你的 `futureagent` 仓库
4. Railway 会自动检测项目类型

#### B.3 配置

1. Railway 会尝试自动部署，但需要手动指定 Root Directory
2. 点击你的服务卡片 → **Settings**
3. 设置：
   - **Root Directory**：`backend`
   - **Build Command**：`pip install -r requirements.txt`
   - **Start Command**：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### B.4 添加环境变量

1. 点击 **Variables** 标签页
2. 点击 **New Variable**，逐个添加：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 你转换好的 Supabase 连接串 |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `["https://你的前端域名.pages.edgeone.com"]` |

#### B.5 部署和验证

1. 保存后 Railway 会自动重新部署
2. 部署完成后点击 **Settings** → **Networking** → **Generate Domain** 获取公网 URL
3. 访问 `https://你的域名.up.railway.app/api/health` 验证

---

### 方式 C：Fly.io 部署后端

#### C.1 安装 Flyctl CLI

```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### C.2 登录

```bash
fly auth login
# 会打开浏览器登录页面
```

#### C.3 初始化项目

```bash
cd e:\boring\futureagent\backend
fly launch --no-deploy
```

系统会问你几个问题：
- **App name**：输入 `futureagent-backend`（或自定义）
- **Region**：选择 `sin`（Singapore）或 `hkg`（Hong Kong）
- **Would you like to set up a Postgres database?**：选 **No**（我们用 Supabase）
- **Would you like to deploy now?**：选 **No**（先配置环境变量）

#### C.4 设置环境变量

```bash
fly secrets set DATABASE_URL="postgresql+asyncpg://你的连接串"
fly secrets set DEBUG="false"
fly secrets set CORS_ORIGINS='["https://你的前端域名.pages.edgeone.com"]'
```

#### C.5 部署

```bash
fly deploy
```

#### C.6 验证

```bash
fly open /api/health
# 或在浏览器打开 https://futureagent-backend.fly.dev/api/health
```

---

### 方式 D：腾讯云服务器部署后端

#### D.1 购买服务器

1. 登录 https://console.cloud.tencent.com
2. 进入 **云服务器 CVM** → **实例**
3. 点击 **新建**，选择：
   - 地域：选离你近的
   - 镜像：`Ubuntu 22.04 LTS`
   - 规格：最低 `1核2G` 即可
   - 安全组：确保开放 `8000` 端口（或 `80` 端口）
4. 购买后记住公网 IP

#### D.2 SSH 登录服务器

```bash
ssh root@你的服务器IP
```

#### D.3 安装 Python 和依赖

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Python 3.12 和 pip
apt install -y python3.12 python3.12-venv python3-pip git

# 克隆你的仓库
git clone https://github.com/你的用户名/futureagent.git
cd futureagent/backend

# 创建虚拟环境
python3.12 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### D.4 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
nano .env
```

在 nano 编辑器中修改以下行：

```
DATABASE_URL=postgresql+asyncpg://你的Supabase连接串
DEBUG=false
CORS_ORIGINS=["https://你的前端域名.pages.edgeone.com"]
```

保存：按 `Ctrl+O` → `Enter` → `Ctrl+X` 退出。

#### D.5 启动后端

```bash
# 在虚拟环境中
source venv/bin/activate

# 启动（生产模式）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### D.6 使用 systemd 保持后台运行（可选但推荐）

```bash
# 创建 systemd 服务文件
nano /etc/systemd/system/futureagent.service
```

写入以下内容：

```ini
[Unit]
Description=FutureAgent Backend
After=network.target

[Service]
User=root
WorkingDirectory=/root/futureagent/backend
Environment=PATH=/root/futureagent/backend/venv/bin:/usr/local/bin
ExecStart=/root/futureagent/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

保存后执行：

```bash
# 重新加载 systemd
systemctl daemon-reload

# 启动服务
systemctl start futureagent

# 设置开机自启
systemctl enable futureagent

# 查看状态
systemctl status futureagent

# 查看日志
journalctl -u futureagent -f
```

#### D.7 验证

在浏览器打开 `http://你的服务器IP:8000/api/health`

#### D.8 安全组配置

如果无法访问，检查腾讯云安全组：
1. 进入 **云服务器** → **安全组**
2. 入站规则添加：
   - 协议：TCP
   - 端口：8000
   - 来源：0.0.0.0/0

---

## 第三步：部署前端到 Tencent EdgeOne Pages

### 3.1 登录 EdgeOne Pages

1. 打开 https://console.cloud.tencent.com/edgeone/pages
2. 使用腾讯云账号登录
3. 如果没有账号，需要先注册腾讯云

### 3.2 创建项目

1. 在 EdgeOne Pages 首页，点击 **创建项目**
2. 选择 **导入 Git 仓库**

### 3.3 关联 GitHub

1. 如果是第一次使用，需要关联 GitHub 账号
2. 点击 **关联 GitHub** → 授权 EdgeOne Pages 访问你的仓库
3. 授权后选择你的 `futureagent` 仓库

### 3.4 配置构建

填写以下配置：

| 配置项 | 填写内容 |
|--------|----------|
| **项目名称** | `futureagent`（可自定义） |
| **框架预设** | 选择 `Vite` |
| **根目录** | `frontend` |
| **构建命令** | `npm install && npm run build` |
| **输出目录** | `dist` |
| **Node.js 版本** | `20`（如果没有 20 就选 18） |

### 3.5 添加环境变量

1. 在同一配置页面，找到 **环境变量** 区域
2. 添加：

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://你的后端URL` |

> 例如：`https://futureagent-backend.onrender.com`（Render 的 URL）
>
> **不要** 加 `/api` 后缀！代码会自动拼接。

### 3.6 部署

1. 点击 **部署** 或 **Deploy** 按钮
2. 等待 2-5 分钟完成构建
3. 构建成功后会分配一个域名，如 `https://futureagent.pages.edgeone.com`
4. **记录这个域名**

### 3.7 更新后端 CORS

前端域名确定后，需要更新后端的 CORS 配置，让后端允许前端跨域请求：

**Render：**
1. 进入 Render Dashboard → 你的服务 → **Environment**
2. 修改 `CORS_ORIGINS` 的值为：
   ```
   ["https://futureagent.pages.edgeone.com","http://localhost:5173"]
   ```
3. 保存后 Render 会自动重新部署

**Railway：**
1. 进入 Railway Dashboard → 你的服务 → **Variables**
2. 修改 `CORS_ORIGINS`
3. 保存后自动重新部署

**Fly.io：**
```bash
fly secrets set CORS_ORIGINS='["https://futureagent.pages.edgeone.com","http://localhost:5173"]'
```

**腾讯云服务器：**
```bash
# 编辑 .env 文件
nano /root/futureagent/backend/.env
# 修改 CORS_ORIGINS 为：
# CORS_ORIGINS=["https://futureagent.pages.edgeone.com","http://localhost:5173"]

# 重启服务
systemctl restart futureagent
```

---

## 第四步：验证部署

### 4.1 验证后端

打开浏览器访问：`https://你的后端URL/api/health`

期望看到：
```json
{"status":"ok","app_name":"Composite Visual AI Agent Coordination System","version":"0.1.0","timestamp":"2025-..."}
```

如果看到这个 JSON，说明后端正常运行。

### 4.2 验证前端

1. 打开浏览器访问：`https://你的前端域名.pages.edgeone.com`
2. 应该看到 FutureAgent 的暗色主题页面
3. 页面包含：
   - Hero 标题 "FutureAgent"
   - Goal 输入框
   - 3 个示例 Goal 按钮
   - Demo Tips 引导区域
   - 4 张系统亮点卡片

### 4.3 验证完整流程

1. **创建 Run**
   - 在输入框输入一个目标（或点击示例 Goal 按钮）
   - 选择 Planner 模式为 `Mock`（不需要 API Key）
   - 点击 **Create Run**

2. **Start 执行**
   - 创建成功后，出现 Run 信息卡片
   - 点击 **Start Execution** 按钮
   - 观察任务列表中的状态从 `pending` → `running` → `completed`

3. **查看 Matrix**
   - Agent×Task 矩阵显示状态色块
   - 点击矩阵格子可以查看 ToolCall / ModelCall 详情

4. **查看 DAG**
   - DAG 依赖视图显示任务之间的依赖关系

5. **下载 Final Report**
   - Run 完成后，Final Report 区域出现
   - 点击下载按钮获取 Markdown 报告

### 4.4 检查浏览器控制台

按 `F12` 打开浏览器开发者工具，切换到 **Console** 标签页：

- **无红色错误** → 部署成功
- **CORS 错误** → 回到第三步第 3.7 节，确认后端 CORS_ORIGINS 包含前端域名
- **404 错误** → 检查 VITE_API_BASE_URL 是否正确

再切换到 **Network** 标签页：

- 查看 API 请求的 URL，应该是 `https://你的后端URL/api/...`（不是前端域名）
- 状态码应该是 `200`

---

## 第五步：本地开发环境

本地开发不需要 Supabase，使用 SQLite 即可。

### 5.1 后端

```bash
cd backend

# 复制配置（默认使用 SQLite）
cp .env.example .env

# 安装依赖
pip install -r requirements.txt

# 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后会自动：
- 创建 SQLite 数据库文件 `data/futureagent.db`
- 创建数据库表
- Seed 5 个默认 Agent

### 5.2 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

Vite 会自动将 `/api` 请求代理到 `http://localhost:8000`，不需要设置 `VITE_API_BASE_URL`。

### 5.3 运行测试

```bash
cd backend
python -m pytest tests/ -v
```

应该看到 22 个测试全部通过。

### 5.4 Docker 本地运行

```bash
# 在项目根目录
docker compose up --build -d

# 访问前端：http://localhost:3000
# 访问后端：http://localhost:8000
# Swagger UI：http://localhost:8000/docs

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

---

## 常见问题排查

### Q1: 前端页面打开后，创建 Run 时请求 404

**原因：** 前端请求发到了错误的地址。

**排查步骤：**
1. 按 F12 打开浏览器开发者工具
2. 切换到 **Network** 标签页
3. 点击 Create Run，观察请求的 URL
4. 如果 URL 是 `https://你的前端域名/api/runs`（没有后端域名），说明 `VITE_API_BASE_URL` 没生效

**解决：**
1. 去 EdgeOne Pages 确认 `VITE_API_BASE_URL` 已设置为后端完整 URL
2. **修改环境变量后必须重新部署**（点重新构建/Deploy）
3. 确认 URL 不含末尾 `/` 或 `/api` 后缀

---

### Q2: 浏览器控制台显示 CORS 错误

**错误信息示例：**
```
Access to fetch at 'https://your-backend.com/api/runs' from origin
'https://your-frontend.pages.edgeone.com' has been blocked by CORS policy
```

**解决：**
1. 确认后端 `CORS_ORIGINS` 环境变量包含前端域名
2. 域名格式必须完全匹配：
   - ✅ `https://futureagent.pages.edgeone.com`
   - ❌ `http://futureagent.pages.edgeone.com`（协议不对）
   - ❌ `https://futureagent.pages.edgeone.com/`（多了末尾斜杠）
3. 修改后重启后端（Render 自动重启，腾讯云手动 `systemctl restart`）

---

### Q3: DATABASE_URL 格式错误

**症状：** 后端启动失败，日志显示连接错误。

**检查清单：**
1. 协议必须是 `postgresql+asyncpg://`（不是 `postgres://` 或 `postgresql://`）
2. 密码中的特殊字符必须 URL 编码（见第一步第 1.5 节）
3. 确认没有多余的空格或换行

**快速测试（本地）：**
```bash
cd backend
python -c "
import asyncio
from app.db import engine
async def test():
    async with engine.connect() as conn:
        from sqlalchemy import text
        result = await conn.execute(text('SELECT 1'))
        print('数据库连接成功:', result.scalar())
    await engine.dispose()
asyncio.run(test())
"
```

---

### Q4: Supabase 连接失败（timeout / connection refused）

**排查步骤：**
1. 登录 Supabase Dashboard，确认项目状态为 **Active**（不是 Paused）
2. 免费版项目如果 7 天无活动会自动暂停，点击 **Restore** 恢复
3. 确认连接串中的 Host 和 Port 正确
4. 如果使用 Transaction Pooler（端口 6543）遇到 `prepared statement "xxx" does not exist` 错误，改用 Session Pooler（端口 5432）

---

### Q5: 选择 Real 模式后任务执行失败

**原因：** 没有配置 LLM API Key。

**解决：**
1. 确认后端环境变量中设置了 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL`
2. 如果不想用真实 LLM，选择 `Mock` 模式即可（不需要任何 API Key）

---

### Q6: EdgeOne Pages 构建成功但页面空白

**排查步骤：**
1. 确认 **根目录** 设置为 `frontend`（不是项目根目录，也不是 `frontend/src`）
2. 确认 **输出目录** 设置为 `dist`
3. 查看构建日志，确认输出了 `dist/index.html`
4. 确认 Node.js 版本为 18 或 20

---

### Q7: Render 后端冷启动太慢

**原因：** Render 免费版 15 分钟无请求后休眠。

**解决（免费方案）：**
1. 注册 [UptimeRobot](https://uptimerobot.com)（免费）
2. 添加 HTTP Monitor
3. URL 填：`https://你的后端URL/api/health`
4. 监控间隔设为 5 分钟
5. 这样每隔 5 分钟会 ping 一次后端，保持不休眠

---

### Q8: PostgreSQL 连接数超限

**症状：** `FATAL: too many connections for role "postgres"`

**解决：**
1. 优先使用 Session Pooler 或 Transaction Pooler（Supabase 管理连接池，不直接占你的连接数）
2. 如果使用 Direct Connection，Supabase 免费版限制 60 个并发连接
3. 升级 Supabase 付费版可获得更高连接限制

---

### Q9: 密码中有特殊字符导致连接失败

**排查：**
1. 检查密码中的 `@`、`#`、`%`、`/` 是否已 URL 编码
2. 重新去 Supabase Dashboard 获取原始连接串
3. 逐步转换：先改 `postgresql://` → `postgresql+asyncpg://`，再编码特殊字符

---

## 环境变量速查表

### 后端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | ✅ | `sqlite+aiosqlite:///./data/futureagent.db` | 数据库连接串 |
| `DEBUG` | ❌ | `true` | 生产环境设为 `false` |
| `HOST` | ❌ | `0.0.0.0` | 监听地址 |
| `PORT` | ❌ | `8000` | 监听端口（Render 使用 `$PORT`） |
| `CORS_ORIGINS` | ✅ | `["http://localhost:5173",...]` | CORS 允许来源（JSON 数组） |
| `DEFAULT_PROVIDER` | ❌ | `mock` | `mock` / `rule` / `mimo` / `openai_compatible` |
| `DEFAULT_MODEL` | ❌ | `default` | 模型名称 |
| `OPENAI_API_KEY` | ❌ | 空 | OpenAI-compatible API Key |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | OpenAI-compatible API 地址 |
| `MIMO_API_KEY` | ❌ | 空 | MiMo API Key |
| `MIMO_BASE_URL` | ❌ | 空 | MiMo API 地址 |

### 前端环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_API_BASE_URL` | ✅（生产） | 后端完整 URL，如 `https://your-backend.onrender.com`。不加 `/api` 后缀。本地开发不需要设置。 |

---

## 部署检查清单

部署完成后，逐项确认：

- [ ] Supabase 项目状态为 Active
- [ ] 后端 `/api/health` 返回 `{"status":"ok"}`
- [ ] 前端页面正常加载（暗色主题、Hero 标题、Goal 输入框）
- [ ] 前端 Network 面板中 API 请求发往后端域名（不是前端域名）
- [ ] 无 CORS 错误（浏览器 Console 无红色报错）
- [ ] 创建 Run 成功
- [ ] Start Execution 后任务状态从 pending → running → completed
- [ ] Agent×Task 矩阵正常显示
- [ ] DAG 依赖视图正常显示
- [ ] Final Report 可以下载
- [ ] `.env` 文件没有提交到 Git
