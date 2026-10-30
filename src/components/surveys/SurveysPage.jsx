import { useMemo, useState } from 'react'
import { Button, Checkbox, Empty, Input, Modal, Popconfirm, Segmented, Select, Switch, Tabs, Tag } from 'antd'
import { BarChartOutlined, CheckCircleOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'react-toastify'
import { useNavigate, useParams } from 'react-router-dom'
import {
  apiErrorMessage,
  useCreateSurveyMutation,
  useDeleteSurveyMutation,
  useGetSurveyActivationRecipientsQuery,
  useGetSurveyResultsQuery,
  useGetSurveysQuery,
  useSetSurveyStatusMutation,
  useUpdateSurveyMutation,
} from '../../store/baseApi'
import './Surveys.css'
import './SurveysCompact.css'
import './SurveysTable.css'

const typeOptions = [
  { value: 'choice', label: 'Variantli' }, { value: 'rating', label: '1–5 baholash' },
  { value: 'yes_no', label: 'Ha / yo‘q' }, { value: 'text', label: 'Erkin matn' },
]
const statusMeta = {
  draft: { label: 'Qoralama', color: 'default' }, active: { label: 'Faol', color: 'green' }, closed: { label: 'Yopilgan', color: 'red' },
}
const sentimentMeta = {
  positive: { label: 'Rozi', color: '#16a34a' }, neutral: { label: 'O‘rtacha', color: '#d97706' }, negative: { label: 'Norozi', color: '#dc2626' },
}
const blankQuestion = () => ({ key: crypto.randomUUID(), text: '', type: 'rating', required: true, options: [] })
const blankFollowUp = () => ({ enabled: false, text: '', type: 'text', required: true, options: [] })
const blankOption = (label = '', value = '', sentiment = 'neutral') => ({ label, value, sentiment, followUp: blankFollowUp() })
const blankSurvey = () => ({ title: '', description: '', questions: [blankQuestion()] })
const optionValue = (label, index) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `option_${index + 1}`
const activationRoomLabel = (room) => room ? `${room.block ? `${room.block} · ` : ''}${room.floor}-qavat · ${room.roomNumber}-xona` : 'Xona aniqlanmagan'

function SurveyEditor({ open, survey, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => survey ? {
    title: survey.title, description: survey.description || '', questions: survey.questions.map((q) => ({ ...q, key: q._id || crypto.randomUUID() })),
  } : blankSurvey())
  const changeQuestion = (index, patch) => setForm((current) => ({ ...current, questions: current.questions.map((q, i) => i === index ? { ...q, ...patch } : q) }))
  const changeOption = (questionIndex, optionIndex, patch) => changeQuestion(questionIndex, { options: form.questions[questionIndex].options.map((option, index) => index === optionIndex ? { ...option, ...patch } : option) })
  const changeFollowUp = (questionIndex, optionIndex, patch) => {
    const option = form.questions[questionIndex].options[optionIndex]
    changeOption(questionIndex, optionIndex, { followUp: { ...blankFollowUp(), ...(option.followUp || {}), ...patch } })
  }
  const submit = () => {
    if (!form.title.trim()) return toast.error('So‘rovnoma nomini kiriting')
    if (form.questions.some((q) => !q.text.trim())) return toast.error('Barcha savollar matnini kiriting')
    for (const [questionIndex, question] of form.questions.entries()) {
      for (const option of question.options || []) {
        if (!option.followUp?.enabled) continue
        if (!option.followUp.text?.trim()) return toast.error(`${questionIndex + 1}-savoldagi qo‘shimcha savol matnini kiriting`)
        if (option.followUp.type === 'choice' && (option.followUp.options || []).filter((item) => item.label?.trim()).length < 2) return toast.error(`${questionIndex + 1}-savoldagi qo‘shimcha savol uchun kamida 2 ta variant kiriting`)
      }
    }
    onSubmit({
      title: form.title.trim(), description: form.description.trim(),
      questions: form.questions.map((q) => ({ text: q.text.trim(), type: q.type, required: q.required, options: ['choice', 'yes_no'].includes(q.type) ? (q.options || []).filter((o) => o.label?.trim()).map((o, i) => ({ label: o.label.trim(), value: o.value || optionValue(o.label, i), sentiment: o.sentiment || 'neutral', followUp: o.followUp?.enabled ? { ...o.followUp, text: o.followUp.text?.trim() || '', options: o.followUp.type === 'choice' ? (o.followUp.options || []).filter((item) => item.label?.trim()).map((item, optionIndex) => ({ label: item.label.trim(), value: item.value || optionValue(item.label, optionIndex), sentiment: item.sentiment || 'neutral' })) : [] } : null })) : [] })),
    })
  }
  return <Modal className="survey-editor-modal" open={open} width="100vw" title={survey ? 'So‘rovnomani tahrirlash' : 'Yangi so‘rovnoma'} onCancel={onClose} footer={<><Button onClick={onClose}>Yopish</Button><Button type="primary" loading={saving} onClick={submit}>Saqlash</Button></>}>
    <div className="survey-editor">
      <label><span>Nomi *</span><Input value={form.title} maxLength={180} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Yotoqxona xizmatlari sifati" /></label>
      <label><span>Talabaga ko‘rinadigan izoh</span><Input.TextArea value={form.description} rows={2} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fikringiz biz uchun muhim" /></label>
      <div className="survey-editor-heading"><div><strong>Savollar</strong><small>Bot savollarni quyidagi tartibda beradi</small></div></div>
      {form.questions.map((question, index) => <article className={`question-editor tone-${index % 4}`} key={question.key}>
        <div className="question-number">{index + 1}</div>
        <div className="question-fields">
          <Input value={question.text} onChange={(e) => changeQuestion(index, { text: e.target.value })} placeholder="Savol matni" />
          <div className="question-settings">
            <div className="question-type-buttons">{typeOptions.map((option) => <button type="button" className={question.type === option.value ? 'active' : ''} key={option.value} onClick={() => changeQuestion(index, { type: option.value, options: option.value === 'choice' && !question.options?.length ? [blankOption('', '', 'positive'), blankOption('', '', 'negative')] : option.value === 'yes_no' ? [blankOption('Ha', 'yes', 'positive'), blankOption('Yo‘q', 'no', 'negative')] : question.options })}>{option.label}</button>)}</div>
            <label className="required-switch"><Switch checked={question.required} onChange={(required) => changeQuestion(index, { required })} /> Majburiy</label>
            <Button danger type="text" icon={<DeleteOutlined />} disabled={form.questions.length === 1} onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })} />
          </div>
          {['choice', 'yes_no'].includes(question.type) && <div className="option-editor conditional-options">
            {(question.options || []).map((option, optionIndex) => <section className="option-config" key={`${option.value}-${optionIndex}`}>
              <div className="option-main-row">
                <Input disabled={question.type === 'yes_no'} value={option.label} placeholder={`${optionIndex + 1}-variant`} onChange={(e) => changeOption(index, optionIndex, { label: e.target.value })} />
                <Select value={option.sentiment} options={[{ value: 'positive', label: 'Rozi' }, { value: 'neutral', label: 'O‘rtacha' }, { value: 'negative', label: 'Norozi' }]} onChange={(sentiment) => changeOption(index, optionIndex, { sentiment })} />
                <label className="follow-up-toggle"><Switch checked={Boolean(option.followUp?.enabled)} onChange={(enabled) => changeFollowUp(index, optionIndex, { enabled })} /> Qo‘shimcha savol</label>
                {question.type === 'choice' && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => changeQuestion(index, { options: question.options.filter((_, i) => i !== optionIndex) })} />}
              </div>
              {option.followUp?.enabled && <div className="follow-up-editor">
                <div className="follow-up-title"><b>“{option.label || `${optionIndex + 1}-variant`}” tanlansa</b><span>Talabaga ushbu savol beriladi</span></div>
                <Input value={option.followUp.text} placeholder="Qo‘shimcha savol matni" onChange={(e) => changeFollowUp(index, optionIndex, { text: e.target.value })} />
                <div className="follow-up-controls"><div className="question-type-buttons compact">{typeOptions.map((type) => <button type="button" className={option.followUp.type === type.value ? 'active' : ''} key={type.value} onClick={() => changeFollowUp(index, optionIndex, { type: type.value, options: type.value === 'choice' && !option.followUp.options?.length ? [blankOption(), blankOption()] : option.followUp.options })}>{type.label}</button>)}</div><label className="required-switch"><Switch checked={option.followUp.required !== false} onChange={(required) => changeFollowUp(index, optionIndex, { required })} /> Majburiy</label></div>
                {option.followUp.type === 'choice' && <div className="follow-up-options">{(option.followUp.options || []).map((item, followIndex) => <div key={followIndex}><Input value={item.label} placeholder={`${followIndex + 1}-variant`} onChange={(e) => changeFollowUp(index, optionIndex, { options: option.followUp.options.map((current, itemIndex) => itemIndex === followIndex ? { ...current, label: e.target.value } : current) })} /><Button type="text" danger icon={<DeleteOutlined />} onClick={() => changeFollowUp(index, optionIndex, { options: option.followUp.options.filter((_, itemIndex) => itemIndex !== followIndex) })} /></div>)}<Button type="dashed" onClick={() => changeFollowUp(index, optionIndex, { options: [...(option.followUp.options || []), blankOption()] })}>+ Variant</Button></div>}
              </div>}
            </section>)}
            {question.type === 'choice' && <Button type="dashed" onClick={() => changeQuestion(index, { options: [...question.options, blankOption()] })}>+ Variant</Button>}
          </div>}
          {question.type === 'rating' && <small className="question-help">1–2 norozi, 3 o‘rtacha, 4–5 rozi sifatida hisoblanadi.</small>}
        </div>
      </article>)}
      <Button className={`survey-add-question-bottom ${form.questions.length % 2 ? 'after-odd' : 'after-even'}`} type="dashed" icon={<PlusOutlined />} onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>Yangi savol qo‘shish</Button>
    </div>
  </Modal>
}

function SurveyActivationModal({ survey, loading, onClose, onActivate }) {
  const surveyId = survey?.id
  const { data, isLoading, error } = useGetSurveyActivationRecipientsQuery(undefined, { skip: !surveyId })
  const [search, setSearch] = useState('')
  const [excludedIds, setExcludedIds] = useState([])
  const selectedIds = useMemo(() => (data?.students || []).filter((student) => student.telegramLinked && !excludedIds.includes(student.id)).map((student) => student.id), [data?.students, excludedIds])
  const visibleStudents = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('uz-UZ')
    return (data?.students || []).filter((student) => !needle || `${student.fullName} ${student.phone} ${activationRoomLabel(student.room)}`.toLocaleLowerCase('uz-UZ').includes(needle))
  }, [data?.students, search])
  const visibleLinkedIds = visibleStudents.filter((student) => student.telegramLinked).map((student) => student.id)
  const allVisibleSelected = visibleLinkedIds.length > 0 && visibleLinkedIds.every((id) => selectedIds.includes(id))
  const toggleAllVisible = (checked) => setExcludedIds((current) => checked ? current.filter((id) => !visibleLinkedIds.includes(id)) : [...new Set([...current, ...visibleLinkedIds])])
  const toggleStudent = (id, checked) => setExcludedIds((current) => checked ? current.filter((studentId) => studentId !== id) : [...new Set([...current, id])])
  return <Modal className="survey-activation-modal" open={Boolean(survey)} width={760} title="So‘rovnomani faollashtirish" onCancel={onClose} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button type="primary" disabled={!selectedIds.length} loading={loading} onClick={() => onActivate(selectedIds)}>{selectedIds.length ? `Faollashtirish va ${selectedIds.length} talabaga yuborish` : 'Kamida bitta talabani tanlang'}</Button></>}>
    <div className="activation-intro"><strong>{survey?.title}</strong><p>So‘rovnoma faollashadi va oldingi faol so‘rovnoma yopiladi. Xabar faqat belgilangan hamda Telegram botga ulangan talabalarga yuboriladi.</p></div>
    <div className="activation-toolbar"><Input allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Talaba, telefon, xona yoki qavat bo‘yicha qidiring" /><div><Checkbox checked={allVisibleSelected} indeterminate={!allVisibleSelected && visibleLinkedIds.some((id) => selectedIds.includes(id))} onChange={(event) => toggleAllVisible(event.target.checked)}>Ko‘rinayotgan barchasini tanlash</Checkbox><span>{selectedIds.length} ta tanlandi</span></div></div>
    {error && <div className="form-error">{apiErrorMessage(error)}</div>}
    {isLoading ? <div className="activation-loading">Talabalar yuklanmoqda…</div> : <div className="activation-student-list">
      {visibleStudents.map((student) => <label className={!student.telegramLinked ? 'unavailable' : ''} key={student.id}><Checkbox disabled={!student.telegramLinked} checked={selectedIds.includes(student.id)} onChange={(event) => toggleStudent(student.id, event.target.checked)} /><span className="activation-avatar">{student.fullName?.charAt(0)}</span><span className="activation-student-info"><strong>{student.fullName}</strong><small>+998 {student.phone} · {activationRoomLabel(student.room)}</small></span><em className={student.telegramLinked ? 'linked' : ''}>{student.telegramLinked ? 'Telegram ulangan' : 'Botga ulanmagan'}</em></label>)}
      {!visibleStudents.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Talaba topilmadi" />}
    </div>}
  </Modal>
}

function SurveyResults({ id }) {
  const { data, isLoading, error } = useGetSurveyResultsQuery(id, { skip: !id })
  const [selected, setSelected] = useState(null)
  if (isLoading) return <div className="survey-state">Natijalar yuklanmoqda…</div>
  if (error) return <div className="form-error">{apiErrorMessage(error)}</div>
  const summary = data?.summary || {}
  return <div className="survey-results">
    <div className="result-summary">
      <article><small>Jami javob</small><strong>{summary.responseCount || 0}</strong><span>talaba</span></article>
      {Object.entries(sentimentMeta).map(([key, meta]) => <article key={key} style={{ '--mood': meta.color }}><small>{meta.label}</small><strong>{summary.percentages?.[key] || 0}%</strong><span>{summary.sentiment?.[key] || 0} ta baho</span></article>)}
    </div>
    <Tabs items={[
      { key: 'questions', label: 'Savollar bo‘yicha', children: <div className="question-stat-list">{(data?.questionStats || []).map((question, i) => <article key={question.questionId}><div><b>{i + 1}. {question.text}</b><div className="question-stat-meta"><span>{question.typeLabel}</span><span>{question.total} ta javob</span></div></div><div className="answer-bars">{Object.entries(question.values).sort((a, b) => b[1] - a[1]).map(([value, count]) => <div key={value}><span title={value}>{value || 'Javobsiz'}</span><i><em style={{ width: `${question.total ? count * 100 / question.total : 0}%` }} /></i><b>{count}</b></div>)}</div></article>)}</div> },
      { key: 'students', label: 'Talabalar javobi', children: <div className="response-table-wrap"><table className="response-table"><thead><tr><th>Talaba</th><th>Telefon</th><th>Holat</th><th>Sana</th><th>Amal</th></tr></thead><tbody>{(data?.responses || []).map((row) => <tr key={row.id}><td><b>{row.student?.fullName}</b></td><td>+998 {row.student?.phone}</td><td><span className={`response-status-pill ${row.sentiment}`}>{sentimentMeta[row.sentiment]?.label}</span></td><td>{new Date(row.completedAt).toLocaleString('uz-UZ')}</td><td><Button className="answer-view-button" icon={<EyeOutlined />} aria-label="Javoblarni ko‘rish" title="Javoblarni ko‘rish" onClick={() => setSelected(row)} /></td></tr>)}</tbody></table>{!data?.responses?.length && <Empty description="Hali javoblar yo‘q" />}</div> },
    ]} />
    <Modal open={Boolean(selected)} title={selected?.student?.fullName} footer={null} onCancel={() => setSelected(null)}>{selected?.answers?.map((answer, i) => <div className="answer-detail" key={answer.questionId}><small>{i + 1}. {answer.question}</small><strong>{String(answer.value)}</strong></div>)}</Modal>
  </div>
}

export function SurveyResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data } = useGetSurveyResultsQuery(id, { skip: !id })
  return <div className="survey-results-page">
    <header className="survey-results-header"><div><button type="button" onClick={() => navigate('/surveys')}>← So‘rovnomalarga qaytish</button><h2>{data?.survey?.title || 'So‘rovnoma natijalari'}</h2><p>Umumiy ko‘rsatkichlar, savollar tahlili va talabalar javoblari</p></div><span className="survey-results-status">{data?.summary?.responseCount || 0} ta javob</span></header>
    <section className="survey-results-panel"><SurveyResults id={id} /></section>
  </div>
}

export function SurveysPage({ currentEmployee }) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useGetSurveysQuery()
  const [createSurvey, createState] = useCreateSurveyMutation()
  const [updateSurvey, updateState] = useUpdateSurveyMutation()
  const [setStatus, setStatusState] = useSetSurveyStatusMutation()
  const [deleteSurvey] = useDeleteSurveyMutation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [activationSurvey, setActivationSurvey] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const canManage = ['owner', 'admin'].includes(currentEmployee?.role)
  const surveys = useMemo(() => data?.surveys || [], [data?.surveys])
  const overview = useMemo(() => ({
    total: surveys.length,
    active: surveys.filter((survey) => survey.status === 'active').length,
    responses: surveys.reduce((sum, survey) => sum + Number(survey.responseCount || 0), 0),
    questions: surveys.reduce((sum, survey) => sum + survey.questions.length, 0),
  }), [surveys])
  const visibleSurveys = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('uz-UZ')
    return surveys.filter((survey) => (statusFilter === 'all' || survey.status === statusFilter) && (!needle || `${survey.title} ${survey.description || ''}`.toLocaleLowerCase('uz-UZ').includes(needle)))
  }, [search, statusFilter, surveys])
  const save = async (body) => {
    try {
      if (editing) await updateSurvey({ id: editing.id, ...body }).unwrap(); else await createSurvey(body).unwrap()
      toast.success(editing ? 'So‘rovnoma yangilandi' : 'So‘rovnoma yaratildi'); setEditorOpen(false); setEditing(null)
    } catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }
  const changeStatus = async (id, status, studentIds) => { try { const result = await setStatus({ id, status, studentIds }).unwrap(); if (status === 'active') { const sent = result.notificationResult?.sent || 0; const failed = result.notificationResult?.failed || 0; toast.success(`So‘rovnoma faollashtirildi. ${sent} ta talabaga xabar yuborildi${failed ? `, ${failed} ta yuborilmadi` : ''}.`); setActivationSurvey(null) } else toast.success('So‘rovnoma yopildi') } catch (e) { toast.error(apiErrorMessage(e)) } }
  const remove = async (id) => { try { await deleteSurvey(id).unwrap(); toast.success('So‘rovnoma o‘chirildi') } catch (e) { toast.error(apiErrorMessage(e)) } }
  return <div className="surveys-page">
    <header className="surveys-hero">
      <div className="survey-hero-copy"><span className="survey-eyebrow">Talabalar fikri markazi</span><h2>Fikrlarni qarorlarga aylantiring</h2><p>So‘rovnomalarni yarating, Telegram orqali javob to‘plang va talabalar kayfiyatini bir joyda kuzating.</p></div>
      {canManage && <Button className="survey-create-button" type="primary" size="large" icon={<PlusOutlined />} onClick={() => { setEditing(null); setEditorOpen(true) }}>Yangi so‘rovnoma</Button>}
    </header>
    <div className="survey-overview">
      <article><span className="overview-icon teal"><FileTextOutlined /></span><div><strong>{overview.total}</strong><small>Jami so‘rovnoma</small></div></article>
      <article><span className="overview-icon green"><CheckCircleOutlined /></span><div><strong>{overview.active}</strong><small>Hozir faol</small></div></article>
      <article><span className="overview-icon blue"><BarChartOutlined /></span><div><strong>{overview.responses}</strong><small>Jami javob</small></div></article>
      <article><span className="overview-icon violet">?</span><div><strong>{overview.questions}</strong><small>Jami savol</small></div></article>
    </div>
    {error && <div className="form-error">{apiErrorMessage(error)}</div>}
    <section className="survey-library">
      <div className="survey-library-head"><div><h3>So‘rovnomalar kutubxonasi</h3><p>{visibleSurveys.length} ta natija ko‘rsatilmoqda</p></div><div className="survey-toolbar"><Input allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="So‘rovnomani qidiring" /><Segmented value={statusFilter} onChange={setStatusFilter} options={[{ label: 'Barchasi', value: 'all' }, { label: 'Faol', value: 'active' }, { label: 'Qoralama', value: 'draft' }, { label: 'Yopilgan', value: 'closed' }]} /></div></div>
      {isLoading ? <div className="survey-state"><span className="survey-loader" />So‘rovnomalar yuklanmoqda…</div> : visibleSurveys.length ? <div className="survey-table-wrap"><table className="survey-table">
        <thead><tr><th>Holati</th><th>So‘rovnoma</th><th>Javoblar</th><th>Savollar</th><th>Yaratilgan sana</th><th>Amallar</th></tr></thead>
        <tbody>{visibleSurveys.map((survey) => <tr key={survey.id}>
          <td data-label="Holati"><Tag className="survey-status" color={statusMeta[survey.status].color}><i />{statusMeta[survey.status].label}</Tag></td>
          <td data-label="So‘rovnoma"><div className="survey-name-cell"><strong>{survey.title}</strong><span>{survey.description || 'Talabalar fikrini o‘rganish uchun yaratilgan so‘rovnoma.'}</span></div></td>
          <td data-label="Javoblar"><span className="survey-count-cell"><BarChartOutlined /><b>{survey.responseCount || 0}</b></span></td>
          <td data-label="Savollar"><span className="survey-count-cell"><FileTextOutlined /><b>{survey.questions.length}</b></span></td>
          <td data-label="Yaratilgan sana"><time className="survey-date-cell">{new Date(survey.createdAt).toLocaleDateString('uz-UZ')}</time></td>
          <td data-label="Amallar"><div className="survey-table-actions"><Button className="result-button" onClick={() => navigate(`/surveys/${survey.id}/results`)}>Natijalar</Button>{canManage && survey.status !== 'active' && <Button onClick={() => { setEditing(survey); setEditorOpen(true) }}>Tahrirlash</Button>}{canManage && survey.status !== 'active' && <Button className="activate-button" type="primary" onClick={() => setActivationSurvey(survey)}>Faollashtirish</Button>}{canManage && survey.status === 'active' && <Popconfirm title="So‘rovnomani yopasizmi?" onConfirm={() => changeStatus(survey.id, 'closed')}><Button danger>Yopish</Button></Popconfirm>}{canManage && survey.status === 'draft' && <Popconfirm title="So‘rovnomani o‘chirasizmi?" onConfirm={() => remove(survey.id)}><Button className="survey-delete" danger type="text" icon={<DeleteOutlined />} aria-label="O‘chirish" /></Popconfirm>}</div></td>
        </tr>)}</tbody>
      </table></div> : <div className="survey-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={surveys.length ? 'Qidiruv bo‘yicha so‘rovnoma topilmadi' : 'Hali so‘rovnoma yaratilmagan'} />{canManage && !surveys.length && <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditorOpen(true)}>Birinchi so‘rovnomani yarating</Button>}</div>}
    </section>
    <SurveyEditor key={`${editing?.id || 'new'}-${editorOpen}`} open={editorOpen} survey={editing} saving={createState.isLoading || updateState.isLoading} onClose={() => { setEditorOpen(false); setEditing(null) }} onSubmit={save} />
    <SurveyActivationModal key={activationSurvey?.id || 'activation'} survey={activationSurvey} loading={setStatusState.isLoading} onClose={() => setActivationSurvey(null)} onActivate={(studentIds) => changeStatus(activationSurvey.id, 'active', studentIds)} />
  </div>
}
