import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import 'ant-design-vue/dist/reset.css'
import './styles/global.less'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 启动时恢复登录态：校验令牌与有效期，清理过期、损坏及旧版本残留数据
useAuthStore().restore()

app.use(router)
app.use(Antd)

app.mount('#app')
