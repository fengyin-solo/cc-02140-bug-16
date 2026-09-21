import { createRouter, createWebHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'

// 所有登录用户可访问的角色
const ALL_ROLES = ['admin', 'librarian']

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
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'DashboardOutlined', roles: ALL_ROLES }
      },
      {
        path: 'books',
        name: 'Books',
        component: () => import('@/views/books/BookList.vue'),
        meta: { title: '图书管理', icon: 'BookOutlined', roles: ALL_ROLES }
      },
      {
        path: 'readers',
        name: 'Readers',
        component: () => import('@/views/readers/ReaderList.vue'),
        // 受限入口：仅管理员可访问
        meta: { title: '读者管理', icon: 'UserOutlined', roles: ['admin'] }
      },
      {
        path: 'borrow',
        name: 'Borrow',
        component: () => import('@/views/borrow/BorrowList.vue'),
        meta: { title: '借阅管理', icon: 'SwapOutlined', roles: ALL_ROLES }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/CategoryList.vue'),
        meta: { title: '分类管理', icon: 'AppstoreOutlined', roles: ALL_ROLES }
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

function setTitle(to) {
  document.title = to.meta.title ? `${to.meta.title} - 图书馆管理系统` : '图书馆管理系统'
}

// 路由守卫：统一登录态校验 + 角色权限校验
router.beforeEach((to) => {
  const authStore = useAuthStore()
  // 记录校验前是否持有会话，用于区分“未登录”与“会话过期”
  const hadSession = Boolean(authStore.token)
  // 校验会话有效性，过期会话在此处被清理
  const isValid = authStore.checkSession()

  // 登录页：已登录用户直接进入后台，未登录用户正常访问
  if (to.meta.public) {
    if (isValid) {
      return { path: '/dashboard', replace: true }
    }
    setTitle(to)
    return true
  }

  // 未登录或令牌已失效：立即中止并回到登录页
  if (!isValid) {
    if (hadSession) {
      message.warning('登录已过期，请重新登录')
    }
    return {
      path: '/login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : {},
      replace: true
    }
  }

  // 角色权限校验：无权访问的入口立即中止，回到有权限的首页
  if (!authStore.hasRole(to.meta.roles)) {
    message.warning('当前角色无权访问该页面')
    return { path: '/dashboard', replace: true }
  }

  setTitle(to)
  return true
})

export default router
