<template>
  <a-layout class="main-layout" :class="{ 'sider-collapsed': collapsed }">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="sider"
      width="220"
      :collapsed-width="70"
    >
      <div class="logo">
        <BookOutlined class="logo-icon" />
        <span v-show="!collapsed" class="logo-text">图书馆管理系统</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        :inline-collapsed="collapsed"
        @click="handleMenuClick"
      >
        <a-menu-item v-for="item in visibleMenuItems" :key="item.key">
          <template #icon><component :is="item.icon" /></template>
          <span>{{ item.title }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <MenuFoldOutlined
            v-if="!collapsed"
            class="trigger"
            @click="collapsed = true"
          />
          <MenuUnfoldOutlined
            v-else
            class="trigger"
            @click="collapsed = false"
          />
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>
              <span class="breadcrumb-link" @click="$router.push('/dashboard')">首页</span>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ currentTitle }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-dropdown>
            <div class="user-info">
              <a-avatar :src="userInfo.avatar" :size="32">
                {{ userInfo.name?.charAt(0) }}
              </a-avatar>
              <span class="user-name">{{ userInfo.name }}</span>
              <DownOutlined />
            </div>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item key="role" disabled class="role-item">
                  当前角色：{{ roleName }}
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="content">
        <router-view />
      </a-layout-content>

      <a-layout-footer class="footer">
        图书馆管理系统 ©2024 · 基于 Vue 3 + Ant Design Vue
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  SwapOutlined,
  AppstoreOutlined,
  DownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useAuthStore, AUTH_STORAGE_KEY } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref(['dashboard'])

// 菜单配置：roles 与路由 meta.roles 保持一致，按当前登录角色过滤
const menuItems = [
  { key: 'dashboard', title: '首页概览', icon: DashboardOutlined, roles: ['admin', 'librarian'] },
  { key: 'books', title: '图书管理', icon: BookOutlined, roles: ['admin', 'librarian'] },
  { key: 'readers', title: '读者管理', icon: UserOutlined, roles: ['admin'] },
  { key: 'borrow', title: '借阅管理', icon: SwapOutlined, roles: ['admin', 'librarian'] },
  { key: 'categories', title: '分类管理', icon: AppstoreOutlined, roles: ['admin'] }
]

const visibleMenuItems = computed(() =>
  menuItems.filter(item => authStore.hasRole(item.roles))
)

const userInfo = computed(() => authStore.user || { name: '用户', avatar: '' })

const roleNames = { admin: '管理员', librarian: '图书管理员' }
const roleName = computed(() => roleNames[authStore.userRole] || '未知角色')

const currentTitle = computed(() => {
  const current = menuItems.find(item => item.key === selectedKeys.value[0])
  return current ? current.title : ''
})

watch(
  () => route.name,
  (name) => {
    if (name) {
      selectedKeys.value = [name.toLowerCase()]
    }
  },
  { immediate: true }
)

function handleMenuClick({ key }) {
  router.push(`/${key}`)
}

// 用户下拉菜单统一在菜单级处理点击，避免菜单项级事件偶发丢失
function handleUserMenuClick({ key }) {
  if (key === 'logout') {
    handleLogout()
  }
}

function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      doLogout('已退出登录')
    }
  })
}

// 退出清理：清空登录状态与本地存储，并替换当前历史记录，
// 确保退出后通过浏览器后退也无法再回到管理页面
function doLogout(tip) {
  authStore.logout()
  if (tip) {
    message.success(tip)
  }
  router.replace('/login')
}

// 会话失效（过期或已被清理）时立即中止当前操作并回到登录页
function handleSessionExpired(tip) {
  authStore.logout()
  message.warning(tip)
  router.replace('/login')
}

// 其他标签页退出或清理登录态时，本页同步失效
function handleStorageSync(event) {
  if (event.key && event.key !== AUTH_STORAGE_KEY) return
  authStore.restore()
  if (!authStore.checkSession()) {
    handleSessionExpired('登录状态已失效，请重新登录')
  }
}

let sessionTimer = null

onMounted(() => {
  // 定时校验令牌有效期，防止令牌失效后页面仍显示为已登录
  sessionTimer = setInterval(() => {
    if (!authStore.checkSession()) {
      handleSessionExpired('登录已过期，请重新登录')
    }
  }, 30 * 1000)
  window.addEventListener('storage', handleStorageSync)
})

onUnmounted(() => {
  clearInterval(sessionTimer)
  window.removeEventListener('storage', handleStorageSync)
})
</script>

<style lang="less" scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sider {
  background: linear-gradient(180deg, #001529 0%, #002140 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;

  // 菜单项样式 - 固定左边距
  :deep(.ant-menu-item) {
    display: flex;
    align-items: center;
    padding-left: 24px !important;

    .anticon {
      font-size: 16px;
      min-width: 16px;
    }
  }

  // 收起状态 - 只隐藏文字，图标位置不变
  :deep(.ant-menu-inline-collapsed) {
    .ant-menu-item {
      padding-left: 24px !important;

      span:not(.anticon) {
        display: none;
      }
    }
  }
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 22px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;

  .logo-icon {
    font-size: 28px;
    color: #1890ff;
    flex-shrink: 0;
  }

  .logo-text {
    margin-left: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
  }
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 99;
  border-bottom: 1px solid #f0f0f0;
  position: fixed;
  top: 0;
  right: 0;
  left: 220px;
  height: 64px;
  transition: left 0.2s;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 6px;

  &:hover {
    color: #1890ff;
    background: #e6f7ff;
  }
}

.breadcrumb {
  margin-left: 16px;

  .breadcrumb-link {
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #1890ff;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;

  .user-name {
    margin: 0 8px;
    font-weight: 500;
    color: #333;
  }
}

// 下拉菜单中的角色展示项
.role-item {
  cursor: default !important;
}

.content {
  padding: 24px;
  padding-top: 88px; // 64px header + 24px padding
  min-height: calc(100vh - 70px); // 减去 footer 高度
}

.footer {
  text-align: center;
  color: #999;
  background: #f5f7fa;
  border-top: 1px solid #e8e8e8;
  font-size: 13px;
  padding: 24px;
}

// 右侧内容区域布局
:deep(.ant-layout) {
  margin-left: 220px;
  transition: margin-left 0.2s;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

// 侧边栏收起时的样式调整
&.sider-collapsed {
  .header {
    left: 70px;
  }
  
  :deep(.ant-layout) {
    margin-left: 70px;
  }
}
</style>
