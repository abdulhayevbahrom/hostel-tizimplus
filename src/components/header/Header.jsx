import { useEffect, useRef, useState } from 'react'
import { MenuOutlined } from '@ant-design/icons'
import './Header.css'

export function Header({ title, onOpenMenu, employee, onLogout }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)

  useEffect(() => {
    if (!notificationsOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !notificationRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [notificationsOpen])

  return (
    <header className="edu-header">
      <div className="edu-header-title"><button className="mobile-menu-button" onClick={onOpenMenu} aria-label="Menyu"><MenuOutlined /></button><h1>{title}</h1></div>
      <div className="edu-header-actions">
        <div className="notification-wrap" ref={notificationRef}>
          <button className="header-icon-button" aria-label="Bildirishnomalar" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></button>
          {notificationsOpen && <div className="notification-panel"><div className="notification-panel-head"><strong>Bildirishnomalar</strong><span>0 ta</span></div><p>Yangi bildirishnoma yo‘q.</p></div>}
        </div>
        <span className="header-user">{employee ? `${employee.firstname} ${employee.lastname}` : 'Xodim'}</span>
        <button className="header-icon-button" aria-label="Chiqish" onClick={onLogout}><svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg></button>
      </div>
    </header>
  )
}
