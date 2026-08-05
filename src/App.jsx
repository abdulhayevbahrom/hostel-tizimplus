import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Header } from './components/header/Header'
import { Sidebar } from './components/sidebar/Sidebar'
import { navigationItems } from './constants/navigation'
import { EmployeesPage } from './components/employees/EmployeesPage'
import { RoomsPage } from './components/rooms/RoomsPage'
import { StudentsPage } from './components/students/StudentsPage'
import { StudentProfilePage } from './components/students/StudentProfilePage'
import { ActiveContractsTab } from './components/students/ActiveContractsTab'
import { BuildingBlocksPage } from './components/settings/BuildingBlocksPage'
import { GeneralSettingsPage } from './components/settings/GeneralSettingsPage'
import { SettingsSidebar } from './components/settings/SettingsSidebar'
import { UniversitiesPage } from './components/settings/UniversitiesPage'
import { PaymentsPage } from './components/payments/PaymentsPage'
import { DebtorsPage } from './components/debtors/DebtorsPage'
import { AttendancePage } from './components/attendance/AttendancePage'
import { ExpensesPage } from './components/expenses/ExpensesPage'
import { FinesPage } from './components/fines/FinesPage'
import { SalariesPage } from './components/salaries/SalariesPage'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { ReportsPage } from './components/reports/ReportsPage'
import { useGetGeneralSettingsQuery, useGetMeQuery } from './store/baseApi'
import { LoginPage } from './components/auth/LoginPage'
import './App.css'

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('hostelAuthToken'))
  const { data: meData, isLoading: authLoading, isError: authError, refetch: refetchMe } = useGetMeQuery(undefined, { skip: !authToken })
  const location = useLocation()
  const navigate = useNavigate()
  const { data: generalSettingsData } = useGetGeneralSettingsQuery()
  const generalSettings = generalSettingsData?.settings
  const isSettings = location.pathname.startsWith('/settings')
  const currentItem = navigationItems.find((item) => item.path === location.pathname || (item.id === 'students' && location.pathname.startsWith('/student/')) || (item.id === 'settings' && isSettings)) || navigationItems[0]
  const title = location.pathname.startsWith('/student/') ? 'Talaba profili' : location.pathname === '/settings/general' ? 'Umumiy sozlamalar' : location.pathname === '/settings/building-blocks' ? 'Bino / bloklar' : location.pathname.startsWith('/settings') ? 'Universitetlar' : currentItem.label
  const goTo = (path) => { navigate(path); setMobileNavOpen(false) }
  const logout = () => { localStorage.removeItem('hostelAuthToken'); setAuthToken(null) }

  useEffect(() => {
    const isAuthenticated = Boolean(authToken && meData?.employee && !authError)
    if ((!authToken || authError) && location.pathname !== '/login') navigate('/login', { replace: true })
    else if (isAuthenticated && location.pathname === '/login') navigate('/', { replace: true })
  }, [authError, authToken, location.pathname, meData?.employee, navigate])

  if (!authToken || authError) {
    if (authError && authToken) localStorage.removeItem('hostelAuthToken')
    return <LoginPage onLogin={(data) => { setAuthToken(data.token); setTimeout(() => refetchMe(), 0) }} />
  }
  if (authLoading || !meData?.employee) return <div className="hotel-page-loader"><span />Tizim yuklanmoqda</div>

  return (
    <main className={`edu-shell ${mobileNavOpen ? 'nav-open' : ''}`}>
      <button className="sidebar-backdrop" aria-label="Menyuni yopish" onClick={() => setMobileNavOpen(false)} />
      <Sidebar active={currentItem.id} hostelName={generalSettings?.hostelName} logoUrl={generalSettings?.logo?.thumbnailUrl || generalSettings?.logo?.url} onNavigate={goTo} onClose={() => setMobileNavOpen(false)} />
      <section className="edu-main">
        <Header title={title} employee={meData.employee} onLogout={logout} onOpenMenu={() => setMobileNavOpen(true)} />
        <div className={isSettings ? 'settings-workspace' : 'edu-workspace'}>
          {isSettings && <SettingsSidebar />}
          <section className="edu-content" aria-label={`${title} sahifasi`}>
            <Routes>
              <Route path="/" element={<DashboardPage employee={meData.employee} />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/contracts" element={<ActiveContractsTab />} />
              <Route path="/student/:id" element={<StudentProfilePage currentEmployee={meData.employee} />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/payments" element={<PaymentsPage currentEmployee={meData.employee} />} />
              <Route path="/debtors" element={<DebtorsPage />} />
              <Route path="/fines" element={<FinesPage currentEmployee={meData.employee} />} />
              <Route path="/employees" element={<EmployeesPage currentEmployee={meData.employee} />} />
              <Route path="/salaries" element={<SalariesPage currentEmployee={meData.employee} />} />
              <Route path="/expenses" element={<ExpensesPage currentEmployee={meData.employee} />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
              <Route path="/settings/general" element={<GeneralSettingsPage />} />
              <Route path="/settings/universities" element={<UniversitiesPage />} />
              <Route path="/settings/building-blocks" element={<BuildingBlocksPage />} />
              <Route path="/settings/faculties" element={<Navigate to="/settings/universities" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
