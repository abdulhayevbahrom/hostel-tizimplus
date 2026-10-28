import { useMemo, useState } from 'react'
import { Button, Empty, Input, Modal, Popconfirm, Segmented, Select, Switch, Tabs, Tag } from 'antd'
import { BarChartOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'react-toastify'
import {
  apiErrorMessage,
  useCreateSurveyMutation,
  useDeleteSurveyMutation,
  useGetSurveyResultsQuery,
  useGetSurveysQuery,
  useSetSurveyStatusMutation,
  useUpdateSurveyMutation,
} from '../../store/baseApi'
import './Surveys.css'

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
const blankSurvey = () => ({ title: '', description: '', questions: [blankQuestion()] })
const optionValue = (label, index) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `option_${index + 1}`

function SurveyEditor({ open, survey, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => survey ? {
    title: survey.title, description: survey.description || '', questions: survey.questions.map((q) => ({ ...q, key: q._id || crypto.randomUUID() })),
  } : blankSurvey())
  const changeQuestion = (index, patch) => setForm((current) => ({ ...current, questions: current.questions.map((q, i) => i === index ? { ...q, ...patch } : q) }))
  const submit = () => {
    if (!form.title.trim()) return toast.error('So‘rovnoma nomini kiriting')
    if (form.questions.some((q) => !q.text.trim())) return toast.error('Barcha savollar matnini kiriting')
    onSubmit({
      title: form.title.trim(), description: form.description.trim(),
      questions: form.questions.map((q) => ({ text: q.text.trim(), type: q.type, required: q.required, options: q.type === 'choice' ? (q.options || []).filter((o) => o.label?.trim()).map((o, i) => ({ label: o.label.trim(), value: o.value || optionValue(o.label, i), sentiment: o.sentiment || 'neutral' })) : [] })),
    })
  }
  return <Modal open={open} width={850} title={survey ? 'So‘rovnomani tahrirlash' : 'Yangi so‘rovnoma'} onCancel={onClose} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button type="primary" loading={saving} onClick={submit}>Saqlash</Button></>}>
    <div className="survey-editor">
      <label><span>Nomi *</span><Input value={form.title} maxLength={180} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Yotoqxona xizmatlari sifati" /></label>
      <label><span>Talabaga ko‘rinadigan izoh</span><Input.TextArea value={form.description} rows={2} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Fikringiz biz uchun muhim" /></label>
      <div className="survey-editor-heading"><div><strong>Savollar</strong><small>Bot savollarni quyidagi tartibda beradi</small></div><Button icon={<PlusOutlined />} onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>Savol qo‘shish</Button></div>
      {form.questions.map((question, index) => <article className="question-editor" key={question.key}>
        <div className="question-number">{index + 1}</div>
        <div className="question-fields">
          <Input value={question.text} onChange={(e) => changeQuestion(index, { text: e.target.value })} placeholder="Savol matni" />
          <div className="question-settings">
            <Select value={question.type} options={typeOptions} onChange={(type) => changeQuestion(index, { type, options: type === 'choice' && !question.options?.length ? [{ label: '', value: '', sentiment: 'positive' }, { label: '', value: '', sentiment: 'negative' }] : question.options })} />
            <label className="required-switch"><Switch checked={question.required} onChange={(required) => changeQuestion(index, { required })} /> Majburiy</label>
            <Button danger type="text" icon={<DeleteOutlined />} disabled={form.questions.length === 1} onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })} />
          </div>
          {question.type === 'choice' && <div className="option-editor">
            {(question.options || []).map((option, optionIndex) => <div key={optionIndex}>
              <Input value={option.label} placeholder={`${optionIndex + 1}-variant`} onChange={(e) => changeQuestion(index, { options: question.options.map((o, i) => i === optionIndex ? { ...o, label: e.target.value } : o) })} />
              <Select value={option.sentiment} options={[{ value: 'positive', label: 'Rozi' }, { value: 'neutral', label: 'O‘rtacha' }, { value: 'negative', label: 'Norozi' }]} onChange={(sentiment) => changeQuestion(index, { options: question.options.map((o, i) => i === optionIndex ? { ...o, sentiment } : o) })} />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => changeQuestion(index, { options: question.options.filter((_, i) => i !== optionIndex) })} />
            </div>)}
            <Button type="dashed" onClick={() => changeQuestion(index, { options: [...question.options, { label: '', value: '', sentiment: 'neutral' }] })}>+ Variant</Button>
          </div>}
          {question.type === 'rating' && <small className="question-help">1–2 norozi, 3 o‘rtacha, 4–5 rozi sifatida hisoblanadi.</small>}
        </div>
      </article>)}
    </div>
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
      { key: 'questions', label: 'Savollar bo‘yicha', children: <div className="question-stat-list">{(data?.questionStats || []).map((question, i) => <article key={question.questionId}><div><b>{i + 1}. {question.text}</b><small>{question.typeLabel} · {question.total} ta javob</small></div><div className="answer-bars">{Object.entries(question.values).sort((a, b) => b[1] - a[1]).map(([value, count]) => <div key={value}><span title={value}>{value || 'Javobsiz'}</span><i><em style={{ width: `${question.total ? count * 100 / question.total : 0}%` }} /></i><b>{count}</b></div>)}</div></article>)}</div> },
      { key: 'students', label: 'Talabalar javobi', children: <div className="response-table-wrap"><table className="response-table"><thead><tr><th>Talaba</th><th>Telefon</th><th>Holat</th><th>Sana</th><th /></tr></thead><tbody>{(data?.responses || []).map((row) => <tr key={row.id}><td><b>{row.student?.fullName}</b></td><td>+998 {row.student?.phone}</td><td><Tag color={row.sentiment === 'positive' ? 'green' : row.sentiment === 'negative' ? 'red' : 'gold'}>{sentimentMeta[row.sentiment]?.label}</Tag></td><td>{new Date(row.completedAt).toLocaleString('uz-UZ')}</td><td><Button type="text" icon={<EyeOutlined />} onClick={() => setSelected(row)}>Ko‘rish</Button></td></tr>)}</tbody></table>{!data?.responses?.length && <Empty description="Hali javoblar yo‘q" />}</div> },
    ]} />
    <Modal open={Boolean(selected)} title={selected?.student?.fullName} footer={null} onCancel={() => setSelected(null)}>{selected?.answers?.map((answer, i) => <div className="answer-detail" key={answer.questionId}><small>{i + 1}. {answer.question}</small><strong>{String(answer.value)}</strong></div>)}</Modal>
  </div>
}

export function SurveysPage({ currentEmployee }) {
  const { data, isLoading, error } = useGetSurveysQuery()
  const [createSurvey, createState] = useCreateSurveyMutation()
  const [updateSurvey, updateState] = useUpdateSurveyMutation()
  const [setStatus] = useSetSurveyStatusMutation()
  const [deleteSurvey] = useDeleteSurveyMutation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [resultsId, setResultsId] = useState(null)
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
  const changeStatus = async (id, status) => { try { await setStatus({ id, status }).unwrap(); toast.success(status === 'active' ? 'So‘rovnoma faollashtirildi' : 'So‘rovnoma yopildi') } catch (e) { toast.error(apiErrorMessage(e)) } }
  const remove = async (id) => { try { await deleteSurvey(id).unwrap(); toast.success('So‘rovnoma o‘chirildi') } catch (e) { toast.error(apiErrorMessage(e)) } }
  return <div className="surveys-page">
    <header className="surveys-hero">
      <div className="survey-hero-copy"><span className="survey-eyebrow">Talabalar fikri markazi</span><h2>Fikrlarni qarorlarga aylantiring</h2><p>So‘rovnomalarni yarating, Telegram orqali javob to‘plang va talabalar kayfiyatini bir joyda kuzating.</p></div>
      {canManage && <Button className="survey-create-button" type="primary" size="large" icon={<PlusOutlined />} onClick={() => { setEditing(null); setEditorOpen(true) }}>Yangi so‘rovnoma</Button>}
      <div className="survey-overview">
        <article><span className="overview-icon teal"><FileTextOutlined /></span><div><strong>{overview.total}</strong><small>Jami so‘rovnoma</small></div></article>
        <article><span className="overview-icon green"><CheckCircleOutlined /></span><div><strong>{overview.active}</strong><small>Hozir faol</small></div></article>
        <article><span className="overview-icon blue"><BarChartOutlined /></span><div><strong>{overview.responses}</strong><small>Jami javob</small></div></article>
        <article><span className="overview-icon violet">?</span><div><strong>{overview.questions}</strong><small>Jami savol</small></div></article>
      </div>
    </header>
    {error && <div className="form-error">{apiErrorMessage(error)}</div>}
    <section className="survey-library">
      <div className="survey-library-head"><div><h3>So‘rovnomalar kutubxonasi</h3><p>{visibleSurveys.length} ta natija ko‘rsatilmoqda</p></div><div className="survey-toolbar"><Input allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="So‘rovnomani qidiring" /><Segmented value={statusFilter} onChange={setStatusFilter} options={[{ label: 'Barchasi', value: 'all' }, { label: 'Faol', value: 'active' }, { label: 'Qoralama', value: 'draft' }, { label: 'Yopilgan', value: 'closed' }]} /></div></div>
      {isLoading ? <div className="survey-state"><span className="survey-loader" />So‘rovnomalar yuklanmoqda…</div> : <div className="survey-grid">{visibleSurveys.map((survey, index) => <article className={`survey-card ${survey.status}`} key={survey.id}>
        <div className="survey-card-accent" />
        <div className="survey-card-top"><Tag className="survey-status" color={statusMeta[survey.status].color}><i />{statusMeta[survey.status].label}</Tag><span className="survey-index">#{String(surveys.length - index).padStart(2, '0')}</span></div>
        <div className="survey-card-body"><h3>{survey.title}</h3><p>{survey.description || 'Talabalar fikrini o‘rganish uchun yaratilgan so‘rovnoma.'}</p></div>
        <div className="survey-card-metrics"><div><BarChartOutlined /><span><b>{survey.responseCount || 0}</b> javob</span></div><div><FileTextOutlined /><span><b>{survey.questions.length}</b> savol</span></div><time>{new Date(survey.createdAt).toLocaleDateString('uz-UZ')}</time></div>
        <div className="survey-actions"><Button className="result-button" type="primary" ghost icon={<EyeOutlined />} onClick={() => setResultsId(survey.id)}>Natijalar</Button>{canManage && survey.status !== 'active' && <Button icon={<EditOutlined />} onClick={() => { setEditing(survey); setEditorOpen(true) }}>Tahrirlash</Button>}{canManage && survey.status !== 'active' && <Popconfirm title="Ushbu so‘rovnomani faollashtirasizmi?" description="Hozirgi faol so‘rovnoma avtomatik yopiladi." onConfirm={() => changeStatus(survey.id, 'active')}><Button className="activate-button" type="primary">Faollashtirish</Button></Popconfirm>}{canManage && survey.status === 'active' && <Popconfirm title="So‘rovnomani yopasizmi?" onConfirm={() => changeStatus(survey.id, 'closed')}><Button danger>Yopish</Button></Popconfirm>}{canManage && survey.status === 'draft' && <Popconfirm title="So‘rovnomani o‘chirasizmi?" onConfirm={() => remove(survey.id)}><Button className="survey-delete" danger type="text" icon={<DeleteOutlined />} aria-label="O‘chirish" /></Popconfirm>}</div>
      </article>)}{!visibleSurveys.length && <div className="survey-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={surveys.length ? 'Qidiruv bo‘yicha so‘rovnoma topilmadi' : 'Hali so‘rovnoma yaratilmagan'} />{canManage && !surveys.length && <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditorOpen(true)}>Birinchi so‘rovnomani yarating</Button>}</div>}</div>}
    </section>
    <SurveyEditor key={`${editing?.id || 'new'}-${editorOpen}`} open={editorOpen} survey={editing} saving={createState.isLoading || updateState.isLoading} onClose={() => { setEditorOpen(false); setEditing(null) }} onSubmit={save} />
    <Modal open={Boolean(resultsId)} width={980} title={(data?.surveys || []).find((s) => s.id === resultsId)?.title || 'Natijalar'} footer={null} onCancel={() => setResultsId(null)}><SurveyResults id={resultsId} /></Modal>
  </div>
}
