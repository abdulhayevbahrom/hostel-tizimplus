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
  FormOutlined,
  MessageOutlined,
} from '@ant-design/icons'

export function SidebarIcon({ name }) {
  const icons = {
    home: HomeOutlined,
    students: TeamOutlined,
    contracts: FileTextOutlined,
    rooms: ApartmentOutlined,
    attendance: CalendarOutlined,
    payments: CreditCardOutlined,
    'payment-statistics': BarChartOutlined,
    cash: WalletOutlined,
    debtors: UserSwitchOutlined,
    deposits: WalletOutlined,
    fines: AuditOutlined,
    employees: IdcardOutlined,
    salaries: WalletOutlined,
    expenses: ShoppingCartOutlined,
    reports: BarChartOutlined,
    surveys: FormOutlined,
    complaints: MessageOutlined,
    audit: FileDoneOutlined,
    settings: SettingOutlined,
  }
  const Icon = icons[name] || FileDoneOutlined
  return <Icon className="sidebar-icon" aria-hidden="true" />
}
