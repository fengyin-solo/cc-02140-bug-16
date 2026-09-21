import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 登录态存储键（当前版本）
export const AUTH_STORAGE_KEY = 'library_auth'
// 历史遗留存储键（旧版本残留，启动与退出时一并清理）
const LEGACY_STORAGE_KEY = 'library_user'

// 会话有效期：2 小时
const SESSION_DURATION = 2 * 60 * 60 * 1000

// 系统内合法角色，存储数据角色不在此列一律视为无效
const VALID_ROLES = ['admin', 'librarian']

function generateToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `token_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// 校验存储数据结构是否完整合法
function isValidAuthData(data) {
  return Boolean(
    data &&
    typeof data.token === 'string' && data.token &&
    data.user && typeof data.user === 'object' &&
    typeof data.user.username === 'string' &&
    VALID_ROLES.includes(data.user.role) &&
    typeof data.expiresAt === 'number'
  )
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const expiresAt = ref(null)

  // 是否已登录（供模板展示用；导航与拦截场景请使用 checkSession 做实时校验）
  const isAuthenticated = computed(() =>
    Boolean(token.value) && Boolean(user.value) &&
    typeof expiresAt.value === 'number' && Date.now() < expiresAt.value
  )
  const userRole = computed(() => user.value?.role || '')

  function persist() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      token: token.value,
      user: user.value,
      expiresAt: expiresAt.value
    }))
  }

  // 登录：写入令牌、用户信息与有效期，并清理旧版本残留
  function login(userInfo) {
    token.value = generateToken()
    user.value = { ...userInfo }
    expiresAt.value = Date.now() + SESSION_DURATION
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    persist()
  }

  // 退出：清空内存状态与本地存储（含旧版本残留键）
  function logout() {
    token.value = null
    user.value = null
    expiresAt.value = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  }

  // 从本地存储恢复登录态；数据缺失、损坏、角色非法或已过期一律清理并视为未登录
  function restore() {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      // 存储中已无登录态（如其他标签页已退出）：同步清空内存状态
      token.value = null
      user.value = null
      expiresAt.value = null
      return
    }
    try {
      const data = JSON.parse(raw)
      if (!isValidAuthData(data)) {
        throw new Error('invalid auth data')
      }
      token.value = data.token
      user.value = data.user
      expiresAt.value = data.expiresAt
      // 已过期则立即清理
      checkSession()
    } catch (e) {
      logout()
    }
  }

  // 实时校验当前会话；令牌缺失或已过期则立即清理。返回是否仍处于登录状态
  function checkSession() {
    if (!token.value || !user.value) return false
    if (typeof expiresAt.value !== 'number' || Date.now() >= expiresAt.value) {
      logout()
      return false
    }
    return true
  }

  // 角色校验：roles 为空表示所有登录用户可访问
  function hasRole(roles) {
    if (!Array.isArray(roles) || roles.length === 0) return true
    return checkSession() && roles.includes(userRole.value)
  }

  return {
    user,
    token,
    expiresAt,
    isAuthenticated,
    userRole,
    login,
    logout,
    restore,
    checkSession,
    hasRole
  }
})
