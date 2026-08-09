import { useRef, useState } from 'react'
import { ContractDocument } from './ContractPreviewModal'
import { createContractCanvas } from './contractPdf'

export function ContractPrintButton({ contract, student, organization }) {
  const documentRef = useRef(null)
  const [printing, setPrinting] = useState(false)
  const print = async () => {
    let frame
    try {
      setPrinting(true)
      const canvas = await createContractCanvas(documentRef.current)
      frame = document.createElement('iframe')
      frame.setAttribute('title', 'Shartnomani chop etish')
      frame.style.cssText = 'position:fixed;inset:0;z-index:99999;width:100vw;height:100vh;height:100dvh;border:0;background:#fff'
      document.body.appendChild(frame)
      const printDocument = frame.contentDocument
      printDocument.open()
      printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>Shartnoma-${contract.contractNumber}</title><style>@page{size:A4 portrait;margin:0}html,body{width:210mm;height:297mm;margin:0;padding:0;background:#fff;overflow:hidden}body{display:grid;place-items:center}img{display:block;max-width:210mm;max-height:297mm;width:auto;height:auto;object-fit:contain}</style></head><body><img src="${canvas.toDataURL('image/jpeg', 0.98)}" alt="Shartnoma"></body></html>`)
      printDocument.close()
      const cleanup = () => frame?.remove()
      frame.contentWindow.addEventListener('afterprint', cleanup, { once: true })
      setTimeout(() => {
        frame.contentWindow.focus()
        frame.contentWindow.print()
      }, 500)
      setTimeout(() => {
        if (frame?.isConnected) cleanup()
      }, 60000)
    } catch (error) {
      frame?.remove()
      throw error
    } finally {
      setPrinting(false)
    }
  }
  return <><button onClick={print} disabled={printing} aria-label="Chop etish" title="Chop etish"><svg viewBox="0 0 24 24"><path d="M6 9V3H18V9M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14H18V21H6Z"/></svg></button><div className="contract-download-source" aria-hidden="true"><ContractDocument ref={documentRef} contract={contract} student={student} organization={organization} /></div></>
}
