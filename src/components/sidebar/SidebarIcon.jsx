import {
  ApartmentOutlined,
  FieldTimeOutlined,
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
  UserAddOutlined,
  WalletOutlined,
  FormOutlined,
  MessageOutlined,
} from '@ant-design/icons'

export function SidebarIcon({ name }) {
  const icons = {
    home: HomeOutlined,
    students: TeamOutlined,
    'student-add': UserAddOutlined,
    contracts: FileTextOutlined,
    rooms: ApartmentOutlined,
    attendance: CalendarOutlined,
    payments: CreditCardOutlined,
    'payment-progress': FieldTimeOutlined,
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
