# Frontend Admin - 图书馆管理系统前端

## How to Run

### 本地开发运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:8081
```

### Docker 运行

```bash
# 在项目根目录运行
docker-compose up --build -d

# 或在当前目录单独构建
docker build -t frontend-admin .
docker run -d -p 8081:80 --name frontend-admin frontend-admin
```

### 生产构建

```bash
npm run build
npm run preview
```

---

## Services

| 服务名称 | 端口 | 说明 |
|---------|------|------|
| frontend-admin | 8081 | 图书馆管理系统前端服务 |

---

## 测试账号

| 角色 | 用户名 | 密码 | 可访问页面 |
|------|--------|------|-----------|
| 管理员 | admin | admin123 | 全部页面 |
| 图书管理员 | librarian | lib123 | 首页概览、图书管理、借阅管理 |

## 登录与权限说明

- 登录成功后签发本地会话令牌（有效期 2 小时），存储于 `localStorage` 的 `library_auth`
- 未登录访问任何受限页面（含直接输入地址）会立即跳转登录页，登录后自动回跳原目标页面
- 「读者管理」「分类管理」仅管理员可见可进入，其他角色直接输入地址也会被拦截
- 退出登录会清空全部登录状态，退出后通过浏览器后退无法再回到管理页面
- 令牌过期或登录状态失效后，页面会立即中止当前操作并回到登录页

---

## 题目内容

帮我生成一个纯前端的图书馆管理项目，使用 Ant Design Vue，不需要和后端交互，要有默认数据。

---

## 项目结构

```
frontend-admin/
├── Dockerfile              # Docker 构建文件（支持 ARM64/AMD64）
├── nginx.conf              # Nginx 配置
├── package.json            # 项目依赖
├── vite.config.js          # Vite 配置
├── index.html              # HTML 入口
├── public/                 # 静态资源
│   └── favicon.svg
└── src/
    ├── main.js             # 应用入口
    ├── App.vue             # 根组件
    ├── router/             # 路由配置
    │   └── index.js
    ├── stores/             # Pinia 状态管理
    │   ├── book.js
    │   ├── borrow.js
    │   ├── category.js
    │   └── reader.js
    ├── layouts/            # 布局组件
    │   └── MainLayout.vue
    ├── views/              # 页面组件
    │   ├── Dashboard.vue
    │   ├── Login.vue
    │   ├── books/
    │   ├── borrow/
    │   ├── categories/
    │   └── readers/
    ├── data/               # 模拟数据
    │   └── mockData.js
    └── styles/             # 全局样式
        └── global.less
```

## 技术栈

- Vue 3 + Vite
- Ant Design Vue 4
- Pinia
- Vue Router
- Less
