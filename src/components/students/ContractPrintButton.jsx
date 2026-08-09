import { useRef, useState } from 'react'
import { ContractDocument } from './ContractPreviewModal'
import { createSinglePageContractPdf } from './contractPdf'

export function ContractPrintButton({ contract, student, organization }) {
  const documentRef = useRef(null)
  const [printing, setPrinting] = useState(false)
  const print = async () => {
    const printWindow = window.open('', '_blank')
    try {
      setPrinting(true)
      const pdf = await createSinglePageContractPdf(documentRef.current, { autoPrint: true })
      const url = URL.createObjectURL(pdf.output('blob'))
      if (printWindow) printWindow.location.href = url
      else window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      printWindow?.close()
      throw error
    } finally {
      setPrinting(false)
    }
  }
  return <><button onClick={print} disabled={printing} aria-label="Chop etish" title="Chop etish"><svg viewBox="0 0 24 24"><path d="M6 9V3H18V9M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14H18V21H6Z"/></svg></button><div className="contract-download-source" aria-hidden="true"><ContractDocument ref={documentRef} contract={contract} student={student} organization={organization} /></div></>
}
