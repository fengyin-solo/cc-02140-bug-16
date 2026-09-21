import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 登录态存储键（当前版本）
export const AUTH_STORAGE_KEY = 'library_auth'
// 历史版本遗留的登录键，初始化时统一清理，避免越权残留
const LEGACY_STORAGE_KEY = 'library_user'
// 会话有效期：2 小时
const SESSION_DURATION = 2 * 60 * 60 * 1000

// 生成模拟令牌
function generateToken() {
  return `tk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

// 从 localStorage 读取会话，过期或损坏的数据直接清除
function readStorage() {
  // 清理旧版本残留，防止旧登录态被误认为有效
  localStorage.removeItem(LEGACY_STORAGE_KEY)

  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    if (!data || !data.token || !data.user || !data.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    // 令牌已过期：立即清除，按未登录处理
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return data
  } catch (e) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = readStorage()

  const user = ref(session?.user || null)
  const token = ref(session?.token || '')
  const expiresAt = ref(session?.expiresAt || 0)

  const isAuthenticated = computed(
    () => Boolean(token.value) && Date.now() < expiresAt.value
  )
  const userRole = computed(() => user.value?.role || '')

  function persist() {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: user.value,
        token: token.value,
        expiresAt: expiresAt.value
      })
    )
  }

  // 登录：统一写入用户、令牌与过期时间
  function login(account) {
    user.value = {
      username: account.username,
      name: account.name,
      role: account.role,
      avatar: account.avatar
    }
    token.value = generateToken()
    expiresAt.value = Date.now() + SESSION_DURATION
    persist()
  }

  // 退出：清理内存状态与全部登录存储
  function logout() {
    user.value = null
    token.value = ''
    expiresAt.value = 0
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }

  // 校验当前会话；已过期则立即清理并返回 false
  function checkSession() {
    if (!token.value) return false
    if (Date.now() >= expiresAt.value) {
      logout()
      return false
    }
    return true
  }

  // 角色权限校验：roles 为空表示所有登录用户可访问
  function hasRole(roles) {
    if (!roles || roles.length === 0) return true
    return roles.includes(userRole.value)
  }

  return {
    user,
    token,
    expiresAt,
    isAuthenticated,
    userRole,
    login,
    logout,
    checkSession,
    hasRole
  }
})
