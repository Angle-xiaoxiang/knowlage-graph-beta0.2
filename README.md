# Knowlage Graph

一个基于React和D3.js的知识图谱应用，用于可视化和管理词条之间的关系。

## 技术栈

### 前端
- **React 18** - 用于构建用户界面
- **TypeScript** - 提供类型安全
- **D3.js** - 用于图谱可视化
- **Tailwind CSS** - 用于样式设计
- **React Router** - 用于路由管理
- **Lucide React** - 用于图标

### 后端
- **Express** - 用于构建API服务器
- **MySQL** - 用于数据存储
- **TypeScript** - 提供类型安全

### 开发工具
- **Vite** - 用于构建和开发服务器
- **TSX** - 用于运行TypeScript文件
- **Tailwind CSS** - 用于样式设计
- **PostCSS** - 用于CSS处理
- **Autoprefixer** - 用于自动添加CSS前缀
- **Concurrently** - 用于并行运行多个命令

### AI服务
- **Google Gemini** - 用于AI生成和关系建议
- **Doubao** - 用于AI生成和关系建议

## 目录结构

```
knowlage-graph-beta0.2/
├── components/          # React组件
│   ├── CMSEditModal.tsx    # CMS编辑弹窗
│   ├── CMSPage.tsx         # CMS管理页面
│   ├── EntryDetailView.tsx # 词条详情页面
│   ├── GraphPage.tsx       # 图谱页面
│   ├── GraphView.tsx       # 图谱可视化组件
│   ├── KanbanView.tsx      # 看板视图组件
│   ├── Settings.tsx        # 设置组件
│   └── Sidebar.tsx         # 侧边栏组件
├── data/                # 数据相关
│   └── seedData.ts         # 初始数据
├── server/              # 后端代码
│   └── index.ts            # 服务器入口
├── services/            # 服务层
│   ├── aiService.ts        # AI服务接口
│   ├── apiService.ts       # API服务
│   ├── dbService.ts        # 数据库服务
│   ├── doubaoService.ts    # 豆包AI服务
│   └── geminiService.ts    # Gemini AI服务
├── .env                 # 环境变量配置
├── .gitignore           # Git忽略文件
├── App.tsx              # 应用入口组件
├── index.css            # 全局样式
├── index.html           # HTML模板
├── index.tsx            # 应用入口文件
├── metadata.json        # 项目元数据
├── package-lock.json    # 依赖锁定文件
├── package.json         # 项目配置和依赖
├── postcss.config.js    # PostCSS配置
├── tailwind.config.js   # Tailwind CSS配置
├── tsconfig.json        # TypeScript配置
├── tsconfig.node.json   # TypeScript Node配置
├── types.ts             # TypeScript类型定义
└── vite.config.ts       # Vite配置
```

## 核心功能

1. **知识图谱可视化**
   - 使用D3.js实现的交互式图谱
   - 支持拖拽、缩放、节点选择
   - 节点按分类显示不同颜色

2. **词条管理**
   - 创建、编辑、删除词条
   - 支持分类管理
   - 支持扩展信息模块

3. **关系管理**
   - 创建、编辑、删除词条间的关系
   - 支持多种关系类型
   - 支持关系权重设置

4. **AI辅助功能**
   - AI生成词条描述
   - AI建议词条间的关系
   - 支持多种AI服务提供商

5. **CMS管理**
   - 批量管理词条
   - 支持编辑扩展信息模块
   - 预设模块类型

6. **多种视图**
   - 图谱视图
   - 看板视图
   - 词条详情视图

## 安装和运行

### 前置要求
- Node.js 16+ 
- MySQL数据库

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建`.env`文件并配置以下环境变量：

```
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=knowlage_graph

# AI服务配置
GEMINI_API_KEY=your_gemini_api_key
DOUBAO_API_KEY=your_doubao_api_key
```

### 运行项目

开发模式（同时启动前端和后端）：

```bash
npm run start
```

或者分别启动：

```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器
npm run server:dev
```

### 构建项目

项目构建分为前端构建和服务器构建两部分：

```bash
# 同时构建前端和服务器代码（推荐）
npm run build

# 或者分别构建
# 构建前端代码
npm run build:client

# 构建服务器代码
npm run build:server
```

## 部署到服务器

### 1. 生产构建

首先，在本地或服务器上构建生产版本：

```bash
npm run build
```

构建完成后，会生成一个`dist`目录，包含所有静态资源和服务器代码。

### 2. 环境配置

在服务器上创建`.env`文件，配置生产环境变量：

```
# 数据库配置
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=your_production_db_name

# AI服务配置（可选，根据需要配置）
GEMINI_API_KEY=your_gemini_api_key
DOUBAO_API_KEY=your_doubao_api_key

# 服务器配置（可选，用于自定义端口）
PORT=3000
```

### 3. 运行生产服务器

#### 使用Node.js直接运行

```bash
# 安装依赖（如果尚未安装）
npm install

# 构建项目
npm run build

# 启动生产服务器
npm run server:prod
```

#### 使用PM2进行进程管理（推荐）

PM2是一个用于Node.js应用的进程管理器，可以自动重启应用并提供日志管理。

```bash
# 安装依赖（如果尚未安装）
npm install

# 构建项目
npm run build

# 安装PM2（如果尚未安装）
npm install -g pm2

# 启动应用（使用项目中已配置的ecosystem.config.js）
npm run server:prod-pm2
```

PM2常用命令：

```bash
# 查看应用状态
npm run server:pm2-status

# 重启应用
npm run server:pm2-restart

# 停止应用
npm run server:pm2-stop

# 查看日志
npm run server:pm2-logs
```

### 4. 反向代理设置

#### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

#### Apache配置示例

```apache
<VirtualHost *:80>
    ServerName your-domain.com

    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    <Location />
        Allow from all
        Order allow,deny
        AllowOverride All
    </Location>
</VirtualHost>
```

### 5. 安全考虑

1. **数据库安全**：
   - 使用强密码
   - 限制数据库用户的访问权限
   - 考虑使用SSL连接数据库

2. **环境变量安全**：
   - 不要将敏感信息提交到版本控制
   - 考虑使用环境变量管理服务

3. **HTTPS配置**：
   - 为生产服务器配置SSL证书（推荐使用Let's Encrypt）
   - 强制所有请求使用HTTPS

4. **API安全**：
   - 考虑添加API密钥验证
   - 实现速率限制
   - 验证所有用户输入

### 6. 监控和维护

1. **日志监控**：
   - 使用PM2日志或其他日志管理工具
   - 设置日志轮换和保留策略

2. **定期备份**：
   - 定期备份数据库
   - 备份重要配置文件

3. **更新依赖**：
   - 定期更新项目依赖以修复安全漏洞
   - 使用`npm audit`检查依赖安全

4. **性能监控**：
   - 监控服务器CPU、内存和磁盘使用情况
   - 考虑使用APM工具（如New Relic、Datadog）

### 7. 常见问题排查

1. **数据库连接失败**：
   - 检查数据库服务是否运行
   - 验证数据库配置是否正确
   - 检查防火墙设置

2. **端口被占用**：
   - 使用`lsof -i :3000`（Linux）或`netstat -ano | findstr :3000`（Windows）查看端口占用情况
   - 杀死占用端口的进程或修改配置使用其他端口

3. **静态资源无法访问**：
   - 检查构建是否成功
   - 验证静态资源路径配置
   - 检查反向代理配置

4. **AI服务调用失败**：
   - 验证API密钥是否有效
   - 检查网络连接
   - 查看服务器日志获取详细错误信息

## 配置说明

### 数据库配置

项目使用MySQL数据库，需要先创建数据库和表。可以使用以下SQL语句创建表：

```sql
CREATE TABLE entries (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  tags JSON,
  x FLOAT,
  y FLOAT,
  vx FLOAT,
  vy FLOAT,
  modules JSON
);

CREATE TABLE relationships (
  id VARCHAR(255) PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  target VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  weight INT NOT NULL
);
```

### 连接到其他MySQL服务器

如果需要连接到另外一台MySQL数据库服务器，只需要修改`.env`文件中的数据库配置即可，无需修改代码。

#### 修改步骤

1. 打开项目根目录下的`.env`文件
2. 修改以下数据库配置为目标MySQL服务器的参数：

```
# 数据库配置
DB_HOST=目标服务器IP地址或域名
DB_PORT=目标服务器端口（默认3306）
DB_USER=目标服务器用户名
DB_PASSWORD=目标服务器密码
DB_NAME=目标数据库名称
```

#### 无需修改的代码

当前项目的两个核心数据库连接文件都已经使用了环境变量，所以不需要修改代码：

- **`services/dbService.ts`**：使用`process.env.DB_*`环境变量
- **`server/index.ts`**：使用`process.env.DB_*`环境变量

#### 重启服务

修改完`.env`文件后，需要重启开发服务器才能使新配置生效：

```bash
# 停止当前运行的服务（如果正在运行）
# 然后重新启动
npm run start
```

#### 验证连接

服务器启动后，会自动测试数据库连接，控制台会显示连接状态：
- 成功：`✅ Database connection successful`
- 失败：`❌ Database connection failed:` 加上具体错误信息

#### 注意事项

1. **确保目标MySQL服务器允许远程连接**：
   - 检查目标服务器的防火墙设置
   - 确保MySQL配置文件中`bind-address`允许远程连接
   - 确保用户有远程访问权限（可以使用`%`通配符）

2. **确保目标数据库已存在**：
   - 如果目标数据库不存在，需要先创建
   - 或者确保代码中的`initDatabase()`函数能在目标服务器上正常创建表结构

3. **数据库版本兼容性**：
   - 确保目标MySQL服务器版本与当前代码兼容（当前使用MySQL 5.7+语法）

### AI服务配置

项目支持两种AI服务：

1. **Google Gemini** - 需要配置`GEMINI_API_KEY`
2. **Doubao** - 需要配置`DOUBAO_API_KEY`

可以在`services/aiService.ts`中切换默认的AI服务。

## 开发说明

### 组件结构

- **GraphPage** - 图谱页面，包含图谱视图和看板视图
- **GraphView** - 图谱可视化组件，使用D3.js实现
- **KanbanView** - 看板视图组件，用于列表展示词条
- **Sidebar** - 侧边栏组件，用于显示和编辑词条详情
- **EntryDetailView** - 词条详情页面，用于查看词条的完整信息
- **CMSEditModal** - CMS编辑弹窗，用于编辑词条信息
- **CMSPage** - CMS管理页面，用于批量管理词条

### 类型定义

所有类型定义都在`types.ts`文件中，包括：

- **Entry** - 词条类型
- **Relationship** - 关系类型
- **RelationType** - 关系类型枚举
- **EntryModule** - 扩展信息模块类型

### 服务层

服务层包含以下服务：

- **aiService** - AI服务接口，用于生成词条描述和关系建议
- **apiService** - API服务，用于与后端通信
- **dbService** - 数据库服务，用于操作数据库
- **doubaoService** - 豆包AI服务实现
- **geminiService** - Gemini AI服务实现

## 依赖说明

### 核心依赖

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| react | ^18.2.0 | 构建用户界面 |
| react-dom | ^18.2.0 | React DOM渲染 |
| typescript | ^5.2.2 | 类型安全 |
| d3 | ^7.9.0 | 图谱可视化 |
| react-router-dom | ^6.22.3 | 路由管理 |
| lucide-react | ^0.344.0 | 图标 |
| express | ^4.19.2 | API服务器 |
| mysql2 | ^3.15.3 | 数据库连接 |
| @google/genai | ^1.30.0 | Google Gemini AI服务 |

### 开发依赖

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| vite | ^5.1.6 | 构建和开发服务器 |
| tailwindcss | ^3.4.1 | 样式设计 |
| postcss | ^8.4.35 | CSS处理 |
| autoprefixer | ^10.4.18 | 自动添加CSS前缀 |
| concurrently | ^8.2.2 | 并行运行多个命令 |
| tsx | ^4.19.1 | 运行TypeScript文件 |
| @types/* | 多种 | TypeScript类型定义 |

## 许可证

MIT License
