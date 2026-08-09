import { useRef, useState } from 'react'
import { ContractDocument } from './ContractPreviewModal'

export function ContractDownloadButton({ contract, student, organization }) {
  const documentRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const download = async () => {
    try {
      setDownloading(true)
      const { default: html2pdf } = await import('html2pdf.js')
      const worker = html2pdf().set({
        margin: 0,
        filename: `Shartnoma-${contract.contractNumber}.pdf`,
        image: { type: 'jpeg', quality: .98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1200 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(documentRef.current).toPdf()
      await worker.save()
    } finally { setDownloading(false) }
  }
  return <><button onClick={download} disabled={downloading} aria-label="PDF yuklab olish" title="PDF yuklab olish"><svg viewBox="0 0 24 24"><path d="M12 3V15M7 10L12 15L17 10M4 20H20"/></svg></button><div className="contract-download-source" aria-hidden="true"><ContractDocument ref={documentRef} contract={contract} student={student} organization={organization} /></div></>
}
