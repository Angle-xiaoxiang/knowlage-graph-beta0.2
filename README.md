# Knowledge Graph 1.0

一个基于React和D3.js的交互式知识图谱应用，用于可视化、管理和探索词条之间的复杂关系。

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

## 核心功能

### 📊 交互式图谱可视化
- 使用D3.js实现的高性能知识图谱
- 支持拖拽、缩放、节点选择和关系查看
- 节点按分类自动着色，关系权重可视化
- 实时更新和动态布局算法

### 📝 完整的词条管理
- 创建、编辑、删除和分类管理词条
- 支持自定义扩展信息模块
- 批量管理和CMS系统
- 词条详情页和侧边栏快速编辑

### 🔗 灵活的关系管理
- 创建、编辑、删除词条间的多种关系类型
- 支持关系权重设置和可视化
- 关系类型自定义和管理

### 🤖 AI辅助功能
- AI生成词条描述（支持Google Gemini和Doubao）
- 智能建议词条间的潜在关系
- 自动化知识图谱扩展

### 📋 多视图支持
- 图谱视图：可视化展示关系网络
- 看板视图：列表式词条管理
- 详情视图：完整的词条信息展示

### ⚙️ 配置和设置
- 数据库连接配置
- AI服务配置
- 系统设置和偏好

## 目录结构

```
knowledge-graph/
├── components/          # React组件
├── data/                # 数据相关
├── server/              # 后端代码
├── services/            # 服务层
├── .env                 # 环境变量配置
├── .env.example         # 环境变量示例
├── App.tsx              # 应用入口组件
├── index.css            # 全局样式
├── index.html           # HTML模板
├── index.tsx            # 应用入口文件
├── package.json         # 项目配置和依赖
├── tailwind.config.js   # Tailwind CSS配置
├── tsconfig.json        # TypeScript配置
├── types.ts             # TypeScript类型定义
└── vite.config.ts       # Vite配置
```

## 快速开始

### 前置要求
- Node.js 18+
- MySQL 5.7+

### 安装和运行

1. **克隆项目**
   ```bash
git clone <repository-url>
cd knowledge-graph
   ```

2. **安装依赖**
   ```bash
npm install
   ```

3. **配置环境变量**
   ```bash
cp .env.example .env
# 编辑.env文件配置数据库和AI服务
   ```

4. **启动开发服务器**
   ```bash
npm run start
   ```

5. **访问应用**
   ```
http://localhost:3000
   ```

### 构建生产版本

```bash
# 同时构建前端和服务器代码
npm run build

# 启动生产服务器
npm run server:prod
```

## 部署说明

### 🚀 生产部署

1. **构建生产版本**
   ```bash
   npm run build
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.production
   # 编辑.env.production配置生产环境
   ```

3. **运行生产服务器**
   - **直接运行**：
     ```bash
     npm run server:prod
     ```
   
   - **使用PM2进程管理（推荐）**：
     ```bash
     npm install -g pm2
     npm run server:prod-pm2
     ```

4. **反向代理配置**
   - 支持Nginx和Apache
   - 配置示例见项目文档

### ⚙️ 环境变量配置

主要配置项：

| 配置项 | 描述 | 必填 |
|--------|------|------|
| DB_HOST | 数据库主机地址 | ✅ |
| DB_PORT | 数据库端口 | ✅ |
| DB_USER | 数据库用户名 | ✅ |
| DB_PASSWORD | 数据库密码 | ✅ |
| DB_NAME | 数据库名称 | ✅ |
| GEMINI_API_KEY | Google Gemini API密钥 | 🔴 |
| DOUBAO_API_KEY | Doubao API密钥 | 🔴 |
| PORT | 服务器端口 | 🔴 |

### 📊 数据库配置

项目自动创建所需表结构，无需手动执行SQL。首次启动时会自动初始化数据库。

支持的数据库：
- MySQL 5.7+
- MariaDB 10.3+

### 🤖 AI服务配置

项目支持两种AI服务，可任选其一或同时配置：
- **Google Gemini**：需要`GEMINI_API_KEY`
- **Doubao**：需要`DOUBAO_API_KEY`

## 开发指南

### 🏗️ 项目架构

- **前端**：React 18 + TypeScript + D3.js + Tailwind CSS
- **后端**：Express + TypeScript + MySQL
- **AI服务**：Google Gemini + Doubao

### 📁 组件结构

- **GraphView** - 核心图谱可视化组件
- **Sidebar** - 词条编辑和详情侧边栏
- **KanbanView** - 列表式词条管理
- **CMSPage** - 内容管理系统
- **AISuggestionModal** - AI建议弹窗

### 📝 类型定义

所有类型定义位于`types.ts`：
- **Entry**：词条类型
- **Relationship**：关系类型
- **RelationType**：关系类型枚举
- **EntryModule**：扩展信息模块类型

### 🛠️ 服务层

- **aiService**：AI服务接口
- **apiService**：API通信服务
- **dbService**：数据库操作服务
- **geminiService**：Google Gemini实现
- **doubaoService**：Doubao实现

## 许可证

MIT License

## 版本说明

### Knowledge Graph 1.0

**✨ 新功能**
- 完整的知识图谱可视化
- AI辅助知识图谱构建
- 多视图支持
- 完整的CMS系统
- 灵活的关系管理
- 可扩展的词条模块

**🚀 性能优化**
- 优化的D3.js渲染
- 高效的数据库查询
- 响应式设计

**📱 兼容性**
- 支持现代浏览器
- 响应式布局

**🔒 安全**
- 环境变量管理
- 数据库连接安全
- API安全考虑

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目仓库：<repository-url>
- 问题反馈：<issues-url>
