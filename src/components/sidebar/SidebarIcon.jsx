import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WalletOutlined,
} from '@ant-design/icons'

export function SidebarIcon({ name }) {
  const icons = {
    home: HomeOutlined,
    students: TeamOutlined,
    contracts: FileTextOutlined,
    rooms: ApartmentOutlined,
    attendance: CalendarOutlined,
    payments: CreditCardOutlined,
    debtors: UserSwitchOutlined,
    fines: AuditOutlined,
    employees: IdcardOutlined,
    salaries: WalletOutlined,
    expenses: ShoppingCartOutlined,
    reports: BarChartOutlined,
    settings: SettingOutlined,
  }
  const Icon = icons[name] || FileDoneOutlined
  return <Icon className="sidebar-icon" aria-hidden="true" />
}
