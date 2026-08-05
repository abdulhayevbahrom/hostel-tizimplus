export function SidebarIcon({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    students: <><circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2.5A4.5 4.5 0 0 1 7 13h2a4.5 4.5 0 0 1 4.5 4.5V20M14 14.5a4 4 0 0 1 7 2.5v3"/></>,
    contracts: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/><path d="m9 8 1 1 2-2"/></>,
    rooms: <><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/><path d="M3 12h18M8 7h2M14 7h2M8 16h2M14 16h2"/></>,
    attendance: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 15l2 2 5-5"/></>,
    payments: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M7 15h3M16.5 14.5h.01"/></>,
    debtors: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="18" cy="16" r="4"/><path d="M18 14v2l1.5 1"/></>,
    fines: <><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h4"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M16.5 15v3"/></>,
    employees: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/><path d="M9 14.5 12 18l3-3.5"/></>,
    expenses: <><path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h3"/><path d="m15 15 2 2 3-4"/></>,
    reports: <><path d="M5 3h14v18H5zM9 17v-3M12 17V9M15 17v-5M8 7h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  }
  return <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
