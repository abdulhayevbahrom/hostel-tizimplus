import { useGetStudentAuditLogsQuery } from '../../store/baseApi'
import { AuditLogList } from './AuditLogList'
import './AuditLogs.css'

export function StudentAuditTab({ student }) {
  const { data, isLoading, isFetching } = useGetStudentAuditLogsQuery(student.id)
  return <div className="student-audit"><div className="student-audit-title"><h3>Talabaga tegishli amallar</h3><p>Profil, shartnoma, to‘lov, jarima va boshqa o‘zgarishlar</p></div><AuditLogList logs={data?.logs} loading={isLoading || isFetching} compact /></div>
}
