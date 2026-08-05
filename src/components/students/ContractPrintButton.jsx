import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { ContractDocument } from './ContractPreviewModal'

export function ContractPrintButton({ contract, student, organization }) {
  const documentRef = useRef(null)
  const print = useReactToPrint({ contentRef: documentRef, documentTitle: `Shartnoma-${contract.contractNumber}` })
  return <><button onClick={print} aria-label="Chop etish" title="Chop etish"><svg viewBox="0 0 24 24"><path d="M6 9V3H18V9M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14H18V21H6Z"/></svg></button><div className="contract-print-source" aria-hidden="true"><ContractDocument ref={documentRef} contract={contract} student={student} organization={organization} /></div></>
}
