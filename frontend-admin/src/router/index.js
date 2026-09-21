import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'DashboardOutlined', roles: ['admin', 'librarian'] }
      },
      {
        path: 'books',
        name: 'Books',
        component: () => import('@/views/books/BookList.vue'),
        meta: { title: '图书管理', icon: 'BookOutlined', roles: ['admin', 'librarian'] }
      },
      {
        path: 'readers',
        name: 'Readers',
        component: () => import('@/views/readers/ReaderList.vue'),
        meta: { title: '读者管理', icon: 'UserOutlined', roles: ['admin'] }
      },
      {
        path: 'borrow',
        name: 'Borrow',
        component: () => import('@/views/borrow/BorrowList.vue'),
        meta: { title: '借阅管理', icon: 'SwapOutlined', roles: ['admin', 'librarian'] }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/CategoryList.vue'),
        meta: { title: '分类管理', icon: 'AppstoreOutlined', roles: ['admin'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function setDocumentTitle(to) {
  document.title = to.meta.title ? `${to.meta.title} - 图书馆管理系统` : '图书馆管理系统'
}

// 路由守卫：统一使用 auth store 作为登录状态与角色归属的唯一来源
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  // 实时校验会话：令牌缺失或已过期会在内部完成清理，并视为未登录
  const isLoggedIn = authStore.checkSession()

  // 已登录用户访问登录页 → 回到首页
  if (to.path === '/login') {
    if (isLoggedIn) {
      return next({ path: '/', replace: true })
    }
    setDocumentTitle(to)
    return next()
  }

  // 未登录访问受限页面 → 立即中止，跳转登录页并记录来源地址
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath }, replace: true })
  }

  // 角色受限页面 → 权限不足立即中止，回到可用首页
  if (to.meta.roles && !authStore.hasRole(to.meta.roles)) {
    message.warning('您没有权限访问该页面')
    return next({ path: '/dashboard', replace: true })
  }

  setDocumentTitle(to)
  next()
})

export default router
