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
import { store } from './store.js'

dayjs.locale('uz-latn')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={uzUZ}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={2500} />
      </Provider>
    </ConfigProvider>
  </StrictMode>,
)
