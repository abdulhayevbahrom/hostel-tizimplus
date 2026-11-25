import { StrictMode } from 'react'
import { ConfigProvider } from 'antd'
import uzUZ from 'antd/locale/uz_UZ'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/uz-latn'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { InstallPrompt } from './components/pwa/InstallPrompt.jsx'
import { store } from './store.js'

dayjs.locale('uz-latn')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={uzUZ}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <InstallPrompt />
        <ToastContainer position="top-right" autoClose={2500} />
      </Provider>
    </ConfigProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // An older PWA worker can survive a dev-server restart and serve stale HTML.
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      await Promise.all(registrations.filter((registration) => {
        const worker = registration.active || registration.waiting || registration.installing
        return worker && new URL(worker.scriptURL).pathname === '/sw.js'
      }).map((registration) => registration.unregister()))
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key.startsWith('hostel-pwa-')).map((key) => caches.delete(key)))
    }).catch((error) => console.error('Eski service worker tozalanmadi:', error))
  } else window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.error('Service worker ro‘yxatdan o‘tmadi:', error)
    })
  })
}
