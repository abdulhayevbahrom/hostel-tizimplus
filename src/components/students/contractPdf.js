export async function createSinglePageContractPdf(element, { autoPrint = false } = {}) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: 1200,
    backgroundColor: '#ffffff',
  })
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 5
  const scale = Math.min(
    (pageWidth - margin * 2) / canvas.width,
    (pageHeight - margin * 2) / canvas.height,
  )
  const width = canvas.width * scale
  const height = canvas.height * scale
  const x = (pageWidth - width) / 2
  const y = (pageHeight - height) / 2
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', x, y, width, height)
  if (autoPrint) pdf.autoPrint()
  return pdf
}
