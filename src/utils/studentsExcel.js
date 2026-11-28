import dayjs from 'dayjs'
import { educationTypeLabel, getPaymentTimingDetail, paymentStatusLabel, studentStatusLabel } from './studentLabels.js'

const columns = [
  { header: '№', key: 'number', width: 7 },
  { header: 'Talaba F.I.Sh.', key: 'fullName', width: 30 },
  { header: 'Rasm havolasi', key: 'photo', width: 30 },
  { header: 'Xona', key: 'room', width: 12 },
  { header: 'O‘rin', key: 'bed', width: 9 },
  { header: 'Blok', key: 'block', width: 10 },
  { header: 'Qavat', key: 'floor', width: 10 },
  { header: 'Tuzilgan sana', key: 'createdAt', width: 21 },
  { header: 'Kirgan sana', key: 'startDate', width: 15 },
  { header: 'Tugash sanasi', key: 'endDate', width: 15 },
  { header: 'Bu oy vaqtida to‘ladi', key: 'paymentStatus', width: 24 },
  { header: 'To‘lov muddati holati', key: 'paymentDetail', width: 32 },
  { header: 'Oxirgi to‘lov', key: 'lastPaidAt', width: 15 },
  { header: 'Holati', key: 'status', width: 14 },
  { header: 'Soliq hujjat', key: 'taxContract', width: 15 },
  { header: 'Telefon', key: 'phone', width: 20 },
  { header: 'Ota-ona telefoni', key: 'parentPhone', width: 20 },
  { header: 'Universitet', key: 'university', width: 28 },
  { header: 'Fakultet', key: 'faculty', width: 28 },
  { header: 'Kurs', key: 'course', width: 9 },
  { header: 'Ta’lim turi', key: 'educationType', width: 16 },
  { header: 'Izoh', key: 'note', width: 50 },
]

const formatDate = (value, format = 'DD.MM.YYYY') => value ? dayjs(value).format(format) : '—'

export async function createStudentsWorkbook(students) {
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = ExcelJSImport.default || ExcelJSImport
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tizim Plus'
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet('Talabalar', {
    views: [{ state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 30 },
  })
  worksheet.columns = columns
  worksheet.insertRows(1, [
    ['Talabalar ro‘yxati'],
    [`Jami: ${students.length} ta talaba · Eksport sanasi: ${dayjs().format('DD.MM.YYYY HH:mm')}`],
    [],
  ])
  worksheet.mergeCells(1, 1, 1, columns.length)
  worksheet.mergeCells(2, 1, 2, columns.length)
  worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF173B3A' } }
  worksheet.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } }
  const headerRow = worksheet.getRow(4)
  headerRow.height = 34
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  students.forEach((student, index) => {
    const room = student.activeRoom
    const paymentStatus = student.currentPaymentStatus
    const row = worksheet.addRow({
      number: index + 1,
      fullName: student.fullName || null,
      photo: student.photo?.url || student.photo?.thumbnailUrl || null,
      room: room?.roomNumber ?? '—',
      bed: student.activeBedNumber ?? '—',
      block: room?.block || '—',
      floor: room?.floor ?? '—',
      createdAt: formatDate(student.activeContractCreatedAt, 'DD.MM.YYYY HH:mm'),
      startDate: formatDate(student.activeContractStartDate),
      endDate: formatDate(student.activeContractEndDate),
      paymentStatus: paymentStatusLabel[paymentStatus] || '—',
      paymentDetail: paymentStatus ? getPaymentTimingDetail(paymentStatus, student.currentPaymentDays) : '—',
      lastPaidAt: formatDate(student.currentPaymentLastPaidAt),
      status: studentStatusLabel[student.studentStatus || 'green'] || '—',
      taxContract: student.hasTaxContract ? 'Ha' : 'Yo‘q',
      phone: student.phone || null,
      parentPhone: student.parentPhone || null,
      university: student.university?.shortName || student.university?.name || '—',
      faculty: student.faculty?.name || '—',
      course: student.course ?? null,
      educationType: educationTypeLabel[student.educationType] || '—',
      note: student.note || null,
    })
    row.font = { name: 'Arial', size: 10 }
    row.alignment = { vertical: 'middle', wrapText: true }
    if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4FAF8' } }
  })
  worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: worksheet.rowCount, column: columns.length } }
  for (const key of ['phone', 'parentPhone', 'room']) worksheet.getColumn(key).numFmt = '@'
  return workbook
}

export async function downloadStudentsExcel(students) {
  const workbook = await createStudentsWorkbook(students)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Talabalar-${dayjs().format('YYYY-MM-DD')}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
