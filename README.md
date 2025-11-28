# 布吉岛百科图谱 (Bujidao Encyclopedia Graph)

**专为少年儿童打造的可视化百科知识库**

这是一个基于 Web 的单页应用 (SPA)，旨在通过直观的力导向图谱（Force-Directed Graph）来展示和管理知识点之间的关系。项目集成了 **Google Gemini AI**，能够智能生成词条描述并建议词条之间的逻辑关系。

---

## 📁 目录结构

```
bujidao-graph/
├── components/          # React 组件
│   ├── CMSEditModal.tsx      # 词条编辑模态框
│   ├── CMSPage.tsx           # CMS 页面组件
│   ├── EntryDetailView.tsx   # 词条详情视图
│   ├── GraphPage.tsx         # 图谱页面组件
│   ├── GraphView.tsx         # 力导向图可视化组件
│   ├── KanbanView.tsx        # 看板视图组件
│   └── Sidebar.tsx           # 侧边栏组件
├── data/               # 数据相关
│   └── seedData.ts           # 初始种子数据
├── services/           # 服务层
│   └── geminiService.ts      # Google Gemini AI 服务
├── .gitignore          # Git 忽略文件配置
├── App.tsx             # 主应用组件
├── index.css           # 全局样式
├── index.html          # HTML 入口文件
├── index.tsx           # React 入口文件
├── metadata.json       # 项目元数据
├── package.json        # 项目配置和依赖
├── package-lock.json   # 依赖版本锁定文件
├── postcss.config.js   # PostCSS 配置
├── README.md           # 项目说明文档
├── tailwind.config.js  # Tailwind CSS 配置
├── tsconfig.json       # TypeScript 配置
├── tsconfig.node.json  # Node.js TypeScript 配置
├── types.ts            # 类型定义
└── vite.config.ts      # Vite 构建配置
```

### 目录说明

- **components/**：包含所有 React 组件，负责不同视图和功能模块
- **data/**：包含初始种子数据和数据处理相关文件
- **services/**：包含外部服务调用，如 AI 服务
- **App.tsx**：应用的主组件，管理全局状态和路由
- **GraphView.tsx**：核心的力导向图可视化组件，使用 D3.js 实现
- **Sidebar.tsx**：侧边栏组件，用于编辑和查看词条详情
- **types.ts**：定义项目中使用的所有 TypeScript 类型

---

## 🛠 修复与依赖说明 (重要)

本项目已使用最新稳定版本的依赖包，包括 `@google/genai@^1.30.0`。

请确保您的环境满足：
*   **Node.js**: v18.0.0 或更高版本
*   **npm**: v9.0.0 或更高版本

---

## 🚀 快速开始 (本地开发)

### 1. 下载代码
将项目文件下载到本地文件夹，例如 `bujidao-graph`。

### 2. 安装依赖
在项目根目录下打开终端（Terminal / CMD），运行：

```bash
npm install
```

> **注意**: 如果下载速度慢，可以使用淘宝源：`npm install --registry=https://registry.npmmirror.com`

### 3. 配置 API Key
为了使用 AI 功能，您需要配置 Google Gemini API Key。
在项目根目录创建一个名为 `.env` 的文件，填入您的 Key：

```env
VITE_API_KEY=your_gemini_api_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```
启动后，浏览器访问 `http://localhost:5173` 即可看到效果。

如果端口 5173 被占用或无法使用，可以指定其他端口：
```bash
npm run dev -- --port 3000
```
此时访问地址为 `http://localhost:3000`

---

## 📦 部署指南 (部署到服务器)

本项目是纯静态 SPA 应用，可以部署在 Nginx、Apache、Vercel 或任何静态文件托管服务上。

### 步骤 1：构建生产环境代码

在本地终端运行：

```bash
npm run build
```

运行成功后，项目根目录下会生成一个 **`dist`** 文件夹。
*   `dist/index.html` - 入口文件
*   `dist/assets/` - 打包后的 JS 和 CSS

**这个 `dist` 文件夹就是您需要上传到服务器的所有内容。**

---

### 步骤 2：服务器部署 (以 Nginx 为例)

假设您有一台 Linux 服务器 (Ubuntu/CentOS)。

#### 1. 上传文件
使用 SCP 或 FTP 工具将 `dist` 文件夹上传到服务器。
例如上传到：`/var/www/bujidao`

```bash
# 示例 SCP 命令 (在本地执行)
scp -r dist/* root@your_server_ip:/var/www/bujidao
```

#### 2. 配置 Nginx
编辑 Nginx 配置文件 (通常在 `/etc/nginx/conf.d/default.conf` 或 `/etc/nginx/sites-available/bujidao`)。

**关键点**: 因为是单页应用 (SPA)，必须配置 `try_files`，否则刷新页面会出现 404 错误。

```nginx
server {
    listen 80;
    server_name your_domain.com; # 替换为您的域名或 IP

    # 指向您上传 dist 文件的目录
    root /var/www/bujidao;
    index index.html;

    # 【重要】SPA 路由配置
    # 如果请求的文件不存在，这就返回 index.html，交给 React 处理路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存配置 (可选，优化性能)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # 开启 Gzip 压缩 (可选)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. 重启 Nginx
```bash
# 检查配置是否正确
sudo nginx -t

# 重启服务
sudo systemctl restart nginx
```

---

## ❓ 常见问题排查

**Q: `npm install` 报错 `@google/genai` 404?**
A: 本项目已更新 `@google/genai` 到最新稳定版本 `^1.30.0`。如果仍有问题，请尝试运行 `npm update` 或手动删除 `node_modules` 和 `package-lock.json` 后重新安装。

**Q: 启动开发服务器时出现 `Error: listen EACCES: permission denied`?**
A: 这是端口权限问题或端口被占用。请尝试使用其他端口启动：
```bash
npm run dev -- --port 3000
```

**Q: 启动开发服务器时出现 `Error: listen EADDRINUSE: address already in use`?**
A: 端口已被其他程序占用。请尝试使用其他端口启动，或关闭占用该端口的程序。

**Q: 部署后页面空白或报错?**
A: 打开浏览器控制台 (F12 -> Console)。
*   如果是 404 错误加载 JS/CSS：检查 Nginx 的 `root` 路径是否正确。
*   如果是代码报错：可能是 API Key 未配置。请确保在构建时 `.env` 文件存在，或者在构建命令中传入环境变量：`VITE_API_KEY=xxx npm run build`。

**Q: 刷新页面报 404?**
A: 这是因为 Nginx 试图寻找对应的 HTML 文件（例如 `/cms`）但找不到。请确保 Nginx 配置中包含了 `try_files $uri $uri/ /index.html;`。
