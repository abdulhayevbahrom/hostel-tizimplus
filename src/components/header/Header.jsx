import { useEffect, useRef, useState } from 'react'
import { MenuOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '../../store/baseApi'
import './Header.css'

let notificationAudioContext = null
let pendingNotificationAudio = false

const unlockNotificationAudio = async () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return false
  if (!notificationAudioContext) notificationAudioContext = new AudioContext()
  if (notificationAudioContext.state === 'suspended') {
    try { await notificationAudioContext.resume() } catch { return false }
  }
  return notificationAudioContext.state === 'running'
}

const playNotificationAudio = async () => {
  const unlocked = await unlockNotificationAudio()
  if (!unlocked || !notificationAudioContext) {
    pendingNotificationAudio = true
    return
  }
  pendingNotificationAudio = false
  const start = notificationAudioContext.currentTime
  ;[1318.51, 1567.98, 2093].forEach((frequency, index) => {
    const oscillator = notificationAudioContext.createOscillator()
    const gain = notificationAudioContext.createGain()
    const noteStart = start + index * 0.13
    oscillator.type = index === 1 ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(frequency, noteStart)
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(index === 2 ? 0.2 : 0.16, noteStart + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.28)
    oscillator.connect(gain); gain.connect(notificationAudioContext.destination)
    oscillator.start(noteStart); oscillator.stop(noteStart + 0.29)
  })
}

const primeNotificationAudio = async () => {
  const unlocked = await unlockNotificationAudio()
  if (unlocked && pendingNotificationAudio) playNotificationAudio()
}

export function Header({ title, onOpenMenu, employee, onLogout }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)
  const knownNotificationIdsRef = useRef(null)
  const navigate = useNavigate()
  const { data } = useGetNotificationsQuery()
  const [markRead] = useMarkNotificationReadMutation()
  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const openNotification = (notification) => {
    if (!notification.isRead) markRead(notification.id)
    setNotificationsOpen(false)
    navigate(notification.targetPath || '/contracts')
  }

  useEffect(() => {
    document.addEventListener('pointerdown', primeNotificationAudio, { capture: true })
    document.addEventListener('keydown', primeNotificationAudio, { capture: true })
    return () => {
      document.removeEventListener('pointerdown', primeNotificationAudio, { capture: true })
      document.removeEventListener('keydown', primeNotificationAudio, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const currentIds = new Set((data.notifications || []).map((notification) => notification.id))
    if (knownNotificationIdsRef.current === null) {
      knownNotificationIdsRef.current = currentIds
      return
    }
    const hasNewNotification = [...currentIds].some((id) => !knownNotificationIdsRef.current.has(id))
    knownNotificationIdsRef.current = currentIds
    if (hasNewNotification) playNotificationAudio()
  }, [data])

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
          <button className="header-icon-button" aria-label="Bildirishnomalar" aria-expanded={notificationsOpen} onClick={() => { primeNotificationAudio(); setNotificationsOpen((open) => !open) }}><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{unreadCount > 0 && <b className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</b>}</button>
          {notificationsOpen && <div className="notification-panel"><div className="notification-panel-head"><strong>Bildirishnomalar</strong><span>{unreadCount} ta yangi</span></div>{notifications.length ? <div className="notification-panel-list">{notifications.map((notification) => <button type="button" className={`${notification.isRead ? 'read' : 'unread'} notification-${notification.type}`} key={notification.id} onClick={() => openNotification(notification)}><i>{notification.type === 'complaint' ? '!' : notification.count}</i><span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleString('uz-UZ')}</time></span></button>)}</div> : <p>Yangi bildirishnoma yo‘q.</p>}</div>}
        </div>
        <span className="header-user">{employee ? `${employee.firstname} ${employee.lastname}` : 'Xodim'}</span>
        <button className="header-icon-button" aria-label="Chiqish" onClick={onLogout}><svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg></button>
      </div>
    </header>
  )
}
