import { useEffect, useRef, useState } from 'react'
import { Modal, Upload } from 'antd'

export function StudentPhotoField({ currentPhoto, fileList, removed, onChange, onRemoveCurrent }) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const hasPhoto = Boolean(fileList.length || (currentPhoto && !removed))

  useEffect(() => {
    if (!cameraOpen) return undefined
    let cancelled = false
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then((stream) => {
      if (cancelled) return stream.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      return undefined
    }).catch(() => setCameraError('Kameraga ruxsat berilmadi yoki kamera topilmadi'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [cameraOpen])

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return setCameraError('Kamera hali tayyor emas')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `student-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onChange([{ uid: String(Date.now()), name: file.name, status: 'done', originFileObj: file, thumbUrl: URL.createObjectURL(blob) }])
      setCameraOpen(false)
    }, 'image/jpeg', .9)
  }

  return (
    <div className="student-photo-field">
      <div className="student-photo-controls">
        {currentPhoto && !removed && !fileList.length && <div className="student-current-photo"><img src={currentPhoto.displayUrl || currentPhoto.url} alt="Talaba rasmi" /><button type="button" onClick={onRemoveCurrent}>×</button></div>}
        <Upload accept="image/jpeg,image/png,image/webp" listType="picture-card" fileList={fileList} maxCount={1} beforeUpload={() => false} onChange={({ fileList: items }) => onChange(items.slice(-1))}>{!hasPhoto ? <div className="student-upload-label"><b>+</b><span>Rasm tanlash</span></div> : null}</Upload>
        {!hasPhoto && <button className="student-camera-btn" type="button" onClick={() => { setCameraError(''); setCameraOpen(true) }}><svg viewBox="0 0 24 24"><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z"/><circle cx="12" cy="13" r="4"/></svg>Kamera</button>}
      </div>
      <small>Aniq yuz rasmi, yaxshi yoritish, neytral ifoda · maksimal 5 MB</small>
      <Modal open={cameraOpen} onCancel={() => setCameraOpen(false)} footer={null} width={640} rootClassName="student-camera-modal" title="Kameradan suratga olish">
        <div className="student-camera-view">{cameraError ? <div className="form-error">{cameraError}</div> : <video ref={videoRef} autoPlay playsInline muted />}</div>
        <button type="button" className="student-capture-btn" onClick={capture}>Suratga olish</button>
      </Modal>
    </div>
  )
}
