const educationTypeLabels = { daytime: 'Kunduzgi', evening: 'Kechki', extramural: 'Sirtqi', employed: 'Ishlaydi' }

const columns = [
  { header: '№', key: 'number', width: 7 },
  { header: 'Talaba F.I.Sh.', key: 'student', width: 28 },
  { header: 'Telefon', key: 'phone', width: 18 },
  { header: 'Universitet', key: 'university', width: 25 },
  { header: 'Fakultet', key: 'faculty', width: 25 },
  { header: 'Kurs', key: 'course', width: 9 },
  { header: 'Ta’lim turi / bandligi', key: 'educationType', width: 22 },
  { header: 'Blok', key: 'block', width: 10 },
  { header: 'Qavat', key: 'floor', width: 10 },
  { header: 'Xona', key: 'room', width: 11 },
  { header: 'Shartnoma raqami', key: 'contractNumber', width: 20 },
  { header: 'Tuzilgan sana', key: 'createdAt', width: 16 },
  { header: 'Kirgan sana', key: 'startDate', width: 16 },
  { header: 'Tugash sanasi', key: 'endDate', width: 16 },
  { header: 'To‘lov turi', key: 'paymentType', width: 14 },
  { header: 'Tarif (so‘m)', key: 'paymentAmount', width: 18 },
  { header: 'Shartnoma summasi (so‘m)', key: 'totalAmount', width: 25 },
  { header: 'Holati', key: 'status', width: 13 },
]

const asDate = (value) => value ? new Date(value) : null

export async function downloadContractsExcel(contracts, filters = {}) {
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = ExcelJSImport.default || ExcelJSImport
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tizim Plus'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Shartnomalar', {
    views: [{ state: 'frozen', ySplit: 5 }],
    properties: { defaultRowHeight: 20 },
  })
  worksheet.columns = columns

  worksheet.insertRow(1, ['Amaldagi shartnomalar'])
  worksheet.mergeCells('A1:R1')
  worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF173B3A' } }
  worksheet.getCell('A1').alignment = { vertical: 'middle' }
  worksheet.getRow(1).height = 28

  const filterText = [
    filters.search && `Qidiruv: ${filters.search}`,
    filters.contractType && `Shartnoma turi: ${filters.contractType === 'student_contract' ? 'Talaba SH' : 'Oddiy SH'}`,
    filters.roomLabel && `Xona: ${filters.roomLabel}`,
  ].filter(Boolean).join(' · ') || 'Barcha amaldagi shartnomalar'

  worksheet.insertRow(2, [filterText])
  worksheet.mergeCells('A2:R2')
  worksheet.insertRow(3, [`Eksport sanasi: ${new Date().toLocaleString('uz-UZ')}`])
  worksheet.mergeCells('A3:R3')
  for (const rowNumber of [2, 3]) worksheet.getCell(`A${rowNumber}`).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } }
  worksheet.insertRow(4, [])

  const headerRow = worksheet.getRow(5)
  headerRow.values = columns.map((column) => column.header)
  headerRow.height = 34
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD5E8E3' } } }
  })

  contracts.forEach((contract, index) => {
    const row = worksheet.addRow({
      number: index + 1,
      student: contract.student?.fullName || '',
      phone: contract.student?.phone || '',
      university: contract.student?.university?.shortName || contract.student?.university?.name || '',
      faculty: contract.student?.faculty?.name || '',
      course: contract.student?.course || '',
      educationType: educationTypeLabels[contract.student?.educationType] || '',
      block: contract.room?.block || '',
      floor: contract.room?.floor || '',
      room: contract.room?.roomNumber || '',
      contractNumber: contract.contractNumber || '',
      createdAt: asDate(contract.createdAt),
      startDate: asDate(contract.startDate),
      endDate: asDate(contract.endDate),
      paymentType: contract.paymentType === 'daily' ? 'Kunlik' : 'Oylik',
      paymentAmount: Number(contract.paymentAmount || 0),
      totalAmount: Number(contract.totalAmount || 0),
      status: 'Aktiv',
    })
    row.font = { name: 'Arial', size: 10 }
    row.alignment = { vertical: 'middle' }
    if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4FAF8' } }
  })

  worksheet.autoFilter = { from: 'A5', to: 'R5' }
  worksheet.getColumn('phone').numFmt = '@'
  worksheet.getColumn('contractNumber').numFmt = '@'
  for (const key of ['createdAt', 'startDate', 'endDate']) worksheet.getColumn(key).numFmt = 'dd.mm.yyyy'
  for (const key of ['paymentAmount', 'totalAmount']) worksheet.getColumn(key).numFmt = '#,##0'
  for (const key of ['number', 'course', 'block', 'floor', 'room', 'paymentType', 'status']) worksheet.getColumn(key).alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getColumn('status').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF087B69' } }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `Amaldagi-shartnomalar-${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
