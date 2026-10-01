import { useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
} from "antd";
import dayjs from "dayjs";
import { breakdownTotal, paymentMethods, paymentMethodsText } from "../../utils/paymentParts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  apiErrorMessage,
  useCreatePaymentMutation,
  useGetDebtorsQuery,
  useGetRoomsQuery,
  useSetDebtorDeadlineMutation,
} from "../../store/baseApi";
import "./Debtors.css";
import { printDebtorList } from "./debtorPrint";

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;
const tableMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");
const methods = paymentMethods;

export function DebtorsPage({ currentEmployee }) {
  const navigate = useNavigate();
  const [paymentForm] = Form.useForm();
  const [period, setPeriod] = useState(dayjs().format("YYYY-MM"));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [roomFilter, setRoomFilter] = useState();
  const [page, setPage] = useState(1);
  const debtorParams = useMemo(() => ({
    period,
    page,
    ...(query.trim() ? { search: query.trim() } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(roomFilter ? { room: roomFilter } : {}),
  }), [page, period, query, roomFilter, status]);
  const { data, isLoading, isFetching, error } = useGetDebtorsQuery(debtorParams);
  const [selected, setSelected] = useState(null);
  const [paymentDebtor, setPaymentDebtor] = useState(null);
  const [historyDebtor, setHistoryDebtor] = useState(null);
  const [actionDebtor, setActionDebtor] = useState(null);
  const [deadlineDebtor, setDeadlineDebtor] = useState(null);
  const [deadlineForm] = Form.useForm();
  const [createPayment, { isLoading: creatingPayment }] =
    useCreatePaymentMutation();
  const [setDebtorDeadline, { isLoading: savingDeadline }] = useSetDebtorDeadlineMutation();
  const { data: roomsData } = useGetRoomsQuery();
  const canManageDeadline = ["owner", "admin", "cashier"].includes(currentEmployee?.role);
  const watchedBreakdown = Form.useWatch("breakdown", paymentForm) || {};
  const paymentTotal = breakdownTotal(watchedBreakdown);
  const needsFundHolder = Number(watchedBreakdown.card || 0) > 0 || Number(watchedBreakdown.online || 0) > 0;
  const selectedInstallmentId = Form.useWatch("installment", paymentForm);
  const selectedPeriod = paymentDebtor?.periods.find(
    (item) => item.id === selectedInstallmentId,
  );
  const rooms = useMemo(() => roomsData?.rooms || [], [roomsData?.rooms]);
  const roomOptions = useMemo(() => rooms.map((room) => ({
    value: room.id,
    label: `${room.block ? `${room.block} blok · ` : ""}${room.roomNumber}-xona · ${room.floor}-qavat`,
  })), [rooms]);
  const debtors = data?.debtors || [];
  const pagination = data?.pagination || { page: 1, limit: 30, total: 0, totalPages: 1 };
  const updatePeriod = (date) => {
    setPeriod(date.format("YYYY-MM"));
    setPage(1);
  };
  const updateQuery = (value) => {
    setQuery(value);
    setPage(1);
  };
  const updateRoomFilter = (value) => {
    setRoomFilter(value);
    setPage(1);
  };
  const updateStatus = (value) => {
    setStatus(value);
    setPage(1);
  };
  const summary = data?.summary || {};
  const openPayment = (debtor) => {
    const first = debtor.periods[0];
    setPaymentDebtor(debtor);
    paymentForm.setFieldsValue({
      installment: first?.id,
      breakdown: { cash: null, card: null, online: null, bank: null },
      fundHolder: "organization",
      note: "",
    });
  };
  const acceptPayment = async (values) => {
    try {
      const paymentPeriod = paymentDebtor.periods.find(
        (item) => item.id === values.installment,
      );
      await createPayment({
        paymentPurpose: "contract",
        student: paymentDebtor.student.id,
        contract: paymentPeriod?.contractId,
        installment: paymentPeriod?.id,
        breakdown: values.breakdown,
        fundHolder: values.fundHolder,
        note: values.note || "",
      }).unwrap();
      toast.success("To‘lov muvaffaqiyatli qabul qilindi");
      setPaymentDebtor(null);
      paymentForm.resetFields();
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError));
    }
  };
  const openDeadline = (debtor) => {
    setDeadlineDebtor(debtor);
    deadlineForm.setFieldsValue({ deadline: debtor.paymentDeadline ? dayjs(debtor.paymentDeadline) : null });
  };
  const saveDeadline = async (values) => {
    try {
      await setDebtorDeadline({ studentId: deadlineDebtor.student.id, periodKey: period, deadline: values.deadline.format("YYYY-MM-DD") }).unwrap();
      toast.success("To‘lov deadline’i saqlandi");
      setDeadlineDebtor(null);
      deadlineForm.resetFields();
    } catch (requestError) { toast.error(apiErrorMessage(requestError)); }
  };
  const printDebtors = () => printDebtorList({
    debtors,
    periodLabel: dayjs(period).format("MMMM YYYY"),
    printedAt: dayjs().format("DD.MM.YYYY HH:mm"),
    isFuturePeriod: data?.isFuturePeriod,
    summary,
  });

  return (
    <div className="debtors-page">
      <section className="debtors-hero">
        <div>
          <span>TO‘LOV NAZORATI</span>
          <h2>
            {data?.isFuturePeriod
              ? "Kutilayotgan to‘lovlar"
              : "Qarzdor talabalar"}
          </h2>
          <p>Tanlangan oy bo‘yicha to‘lov holatini nazorat qiling.</p>
        </div>
        <DatePicker
          picker="month"
          allowClear={false}
          value={dayjs(period)}
          format="MMMM YYYY"
          suffixIcon={
            <svg
              className="debtor-calendar-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
          }
          onChange={updatePeriod}
        />
      </section>
      <section className="debtor-stats">
        <article className="count">
          <small>Oy uchun hisoblangan</small>
          <strong>{money(summary.scheduledAmount)}</strong>
        </article>
        <article className="partial">
          <small>To‘langan summa</small>
          <strong>{money(summary.paidAmount)}</strong>
        </article>
        <article className="total">
          <small>
            {data?.isFuturePeriod ? "Kutilayotgan summa" : "Qarzdorlik"}
          </small>
          <strong>
            {money(
              data?.isFuturePeriod ? summary.waitingAmount : summary.totalDebt,
            )}
          </strong>
        </article>
        <article className="overdue">
          <small>To‘lov qilgan talabalar</small>
          <strong>{summary.paidStudentCount || 0} ta</strong>
        </article>
        <article className="unpaid">
          <small>
            {data?.isFuturePeriod ? "To‘lov kutilmoqda" : "To‘lov qilmagan"}
          </small>
          <strong>{summary.noPaymentStudentCount || 0} ta</strong>
        </article>
      </section>
      <section className="debtors-card">
        <div className="debtors-card-head">
          <div>
            <h3>
              {data?.isFuturePeriod
                ? "To‘lov kutilayotgan talabalar"
                : "Qarzdorlar ro‘yxati"}
            </h3>
            <p>
              {debtors.length} ta natija · {period}
            </p>
          </div>
          <div className="debtor-filters">
            <div className="debtor-search">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
              <input
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Talaba, telefon, xona yoki shartnoma"
              />
            </div>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={roomFilter}
              placeholder="Xona bo‘yicha"
              options={roomOptions}
              onChange={updateRoomFilter}
            />
            <Select
              value={status}
              onChange={updateStatus}
              options={[
                { value: "all", label: "Barcha talabalar" },
                { value: "overdue", label: "Muddati o‘tgan" },
                { value: "partial", label: "Qisman to‘lagan" },
                { value: "unpaid", label: "Umuman to‘lamagan" },
              ]}
            />
            <button className="debtor-print-btn" onClick={printDebtors} disabled={isLoading} title="A4 formatda chop etish">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" /></svg>
              Chop etish
            </button>
          </div>
        </div>
        {error && <div className="form-error">{apiErrorMessage(error)}</div>}
        {isLoading ? (
          <div className="debtor-state">Ma’lumotlar yuklanmoqda…</div>
        ) : (
          <div className={`debtor-table-wrap ${isFetching && !isLoading ? "refreshing" : ""}`}>
            {isFetching && !isLoading && <div className="debtor-refreshing"><span />Ma’lumotlar yangilanmoqda…</div>}
            <table className="debtor-table">
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Universitet</th>
                  <th>Xona</th>
                  <th>
                    {data?.isFuturePeriod ? "To‘lov davri" : "Qarzdor davr"}
                  </th>
                  <th>To‘lov muddati</th>
                  <th>
                    {data?.isFuturePeriod ? "Kutilayotgan summa" : "Jami qarz"}
                  </th>
                  <th>Muddati o‘tgan</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((debtor) => {
                  const room = debtor.contracts?.[0]?.room;
                  return (
                    <tr key={debtor.student.id} className={debtor.isDeadlineReached ? "debtor-deadline-reached" : ""}>
                      <td data-label="Talaba">
                        <button
                          className="debtor-student"
                          onClick={() =>
                            navigate(`/student/${debtor.student.id}`)
                          }
                        >
                          {debtor.student.photo ? (
                            <img
                              src={
                                debtor.student.photo.thumbnailUrl ||
                                debtor.student.photo.url
                              }
                              alt=""
                            />
                          ) : (
                            <span>{debtor.student.fullName?.[0]}</span>
                          )}
                          <div>
                            <strong>{debtor.student.fullName}</strong>
                            <small>{debtor.student.phone}</small>
                          </div>
                        </button>
                      </td>
                      <td data-label="Universitet">
                        <strong>
                          {debtor.student.university?.name || "—"}
                        </strong>
                        <small>
                          {debtor.student.faculty?.name || ""} ·{" "}
                          {debtor.student.course}-kurs
                        </small>
                      </td>
                      <td data-label="Xona">
                        {room ? (
                          <>
                            <strong>
                              {room.block} · {room.roomNumber}-xona
                            </strong>
                            <small>{room.floor}-qavat</small>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Davrlar">
                        <span className="debt-period-count">
                          {debtor.periodCount} ta davr
                        </span>
                      </td>
                      <td data-label="To‘lov muddati">
                        {debtor.paymentDeadline ? (
                          <>
                            <strong className="debtor-deadline-date">{dayjs(debtor.paymentDeadline).format("DD.MM.YYYY")}</strong>
                            {debtor.isDeadlineReached && <small className="debtor-deadline-reached-label">Muddati yetgan</small>}
                          </>
                        ) : (
                          <span className="debtor-deadline-empty">Belgilanmagan</span>
                        )}
                      </td>
                      <td data-label="Summa">
                        <b className="debt-money">{tableMoney(data?.isFuturePeriod ? debtor.waitingAmount : debtor.totalDebt)}</b>
                        {!data?.isFuturePeriod && <small>Faqat shartnoma qarzdorligi</small>}
                      </td>
                      <td data-label="O‘tgan">
                        <b
                          className={debtor.overdueDebt ? "overdue-money" : ""}
                        >
                          {tableMoney(debtor.overdueDebt)}
                        </b>
                      </td>
                      <td data-label="Amal">
                        <div className="debtor-row-actions">
                          <button
                            className="debtor-pay-btn"
                            onClick={() => openPayment(debtor)}
                          >
                            To‘lov qilish
                          </button>
                          <button
                            className="debtor-history-btn"
                            onClick={() => setHistoryDebtor(debtor)}
                            title="To‘lov tarixini ko‘rish"
                          >
                            <svg viewBox="0 0 24 24">
                              <path d="M3 12a9 9 0 1 0 3-6.7" />
                              <path d="M3 4v5h5M12 7v5l3 2" />
                            </svg>
                            Tarix
                          </button>
                          <button
                            className="debtor-details-btn"
                            onClick={() => setSelected(debtor)}
                          >
                            Batafsil
                          </button>
                          {canManageDeadline && <button className="debtor-deadline-btn" onClick={() => openDeadline(debtor)}>{debtor.paymentDeadline ? "Muddatni o‘zgartirish" : "Muddat belgilash"}</button>}
                          <button className="debtor-more-btn" aria-label="Amallar" onClick={() => setActionDebtor(actionDebtor?.student?.id === debtor.student.id ? null : debtor)}>⋯</button>
                          {actionDebtor?.student?.id === debtor.student.id && <div className="debtor-inline-actions"><button onClick={() => { openPayment(debtor); setActionDebtor(null) }}>To‘lov</button><button onClick={() => { setHistoryDebtor(debtor); setActionDebtor(null) }}>Tarix</button><button onClick={() => { setSelected(debtor); setActionDebtor(null) }}>Batafsil</button>{canManageDeadline && <button onClick={() => { openDeadline(debtor); setActionDebtor(null) }}>{debtor.paymentDeadline ? "Muddatni o‘zgartirish" : "Muddat belgilash"}</button>}</div>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!debtors.length && (
                  <tr>
                    <td colSpan="9" className="debtor-state">
                      Tanlangan oy uchun ma’lumot topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {pagination.total > pagination.limit && (
              <div className="debtor-pagination">
                <Pagination
                  current={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  showSizeChanger={false}
                  disabled={isFetching}
                  onChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="debtor-print-sheet" aria-hidden="true">
        <header>
          <div>
            <h1>{data?.isFuturePeriod ? "Kutilayotgan to‘lovlar ro‘yxati" : "Qarzdor talabalar ro‘yxati"}</h1>
            <p>Hisobot davri: {dayjs(period).format("MMMM YYYY")}</p>
          </div>
          <small>Chop etilgan sana: {dayjs().format("DD.MM.YYYY HH:mm")}</small>
        </header>
        <div className="debtor-print-summary">
          <span>Talabalar soni: <b>{debtors.length}</b></span>
          <span>{data?.isFuturePeriod ? "Kutilayotgan summa" : "Jami qarzdorlik"}: <b>{money(data?.isFuturePeriod ? summary.waitingAmount : summary.totalDebt)}</b></span>
          {!data?.isFuturePeriod && <span>Muddati o‘tgan: <b>{money(summary.overdueDebt)}</b></span>}
        </div>
        <table>
          <thead><tr><th>№</th><th>Talaba</th><th>Telefon</th><th>Universitet</th><th>Xona</th><th>Qarzdor davr</th><th>To‘lov muddati</th><th>{data?.isFuturePeriod ? "Kutilayotgan" : "Jami qarz"}</th><th>Muddati o‘tgan</th></tr></thead>
          <tbody>
            {debtors.map((debtor, index) => {
              const room = debtor.contracts?.[0]?.room;
              return <tr key={debtor.student.id}>
                <td>{index + 1}</td><td>{debtor.student.fullName}</td><td>{debtor.student.phone || "—"}</td>
                <td>{debtor.student.university?.name || "—"}{debtor.student.faculty?.name ? `, ${debtor.student.faculty.name}` : ""}</td>
                <td>{room ? `${room.block} · ${room.roomNumber}-xona` : "—"}</td>
                <td>{debtor.periodCount} ta davr</td><td>{debtor.paymentDeadline ? dayjs(debtor.paymentDeadline).format("DD.MM.YYYY") : "Belgilanmagan"}</td>
                <td>{tableMoney(data?.isFuturePeriod ? debtor.waitingAmount : debtor.totalDebt)}</td><td>{tableMoney(debtor.overdueDebt)}</td>
              </tr>;
            })}
            {!debtors.length && <tr><td colSpan="9">Ma’lumot topilmadi</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal
        open={Boolean(selected)}
        onCancel={() => setSelected(null)}
        footer={null}
        width={760}
        title={data?.isFuturePeriod ? "Kutilayotgan to‘lov tafsilotlari" : "Qarzdorlik tafsilotlari"}
        rootClassName="debtor-modal"
      >
        <>
          {selected && (
            <div className="debtor-detail">
              <div className="debtor-detail-person">
                <div>
                  <h3>{selected.student.fullName}</h3>
                  <p>
                    {selected.student.university?.name || "—"} ·{" "}
                    {selected.student.course}-kurs
                  </p>
                </div>
                <div>
                  <a href={`tel:${selected.student.phone}`}>
                    {selected.student.phone}
                  </a>
                  <a href={`tel:${selected.student.parentPhone}`}>
                    {selected.student.parentPhone || "Ota-ona telefoni yo‘q"}
                  </a>
                </div>
              </div>
              <div className="debtor-detail-summary">
                <div>
                  <span>{data?.isFuturePeriod ? "Kutilayotgan summa" : "Jami qarz"}</span>
                  <strong>{money(data?.isFuturePeriod ? selected.waitingAmount : selected.totalDebt)}</strong>
                </div>
                <div>
                  <span>Muddati o‘tgan</span>
                  <strong>{money(selected.overdueDebt)}</strong>
                </div>
                <div>
                  <span>Joriy oy</span>
                  <strong>{money(selected.currentDebt)}</strong>
                </div>
              </div>
              <h4>{data?.isFuturePeriod ? "Kelgusi to‘lov davrlari" : "Qarzdorlik davrlari"}</h4>
              <div className="debtor-periods">
                {selected.periods.map((period) => (
                  <article key={period.id}>
                    <div>
                      <strong>{period.periodKey}</strong>
                      <span>{period.contractNumber}</span>
                    </div>
                    <div>
                      <small>Hisoblangan</small>
                      <b>{money(period.amount)}</b>
                    </div>
                    <div>
                      <small>To‘langan</small>
                      <b className="paid">{money(period.paidAmount)}</b>
                    </div>
                    <div>
                      <small>Qoldiq</small>
                      <b className="debt">{money(period.debt)}</b>
                    </div>
                    <div>
                      <small>Muddat</small>
                      <b>{dayjs(period.dueDate).format("DD.MM.YYYY")}</b>
                    </div>
                  </article>
                ))}
              </div>
              <div className="debtor-detail-actions">
                <button
                  onClick={() => navigate(`/student/${selected.student.id}`)}
                >
                  Talaba profilini ochish
                </button>
              </div>
            </div>
          )}
        </>
      </Modal>
      <Modal open={Boolean(deadlineDebtor)} onCancel={() => setDeadlineDebtor(null)} footer={null} title={deadlineDebtor ? `${deadlineDebtor.student.fullName} — to‘lov deadline’i` : "To‘lov deadline’i"} destroyOnHidden>
        <Form form={deadlineForm} layout="vertical" onFinish={saveDeadline} requiredMark={false}>
          <Form.Item name="deadline" label="To‘lov qilishi kerak bo‘lgan sana" rules={[{ required: true, message: "Sanani tanlang" }]}><DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} /></Form.Item>
          <div className="debtor-payment-actions"><Button onClick={() => setDeadlineDebtor(null)}>Bekor qilish</Button><Button type="primary" htmlType="submit" loading={savingDeadline}>Saqlash</Button></div>
        </Form>
      </Modal>
      <Modal
        open={Boolean(paymentDebtor)}
        onCancel={() => setPaymentDebtor(null)}
        footer={null}
        width={580}
        title={
          paymentDebtor
            ? `${paymentDebtor.student.fullName} — to‘lov qilish`
            : "To‘lov qilish"
        }
        rootClassName="debtor-payment-modal"
        destroyOnHidden
      >
        <Form
          form={paymentForm}
          layout="vertical"
          requiredMark={false}
          onFinish={acceptPayment}
        >
          <Form.Item
            name="installment"
            label="Qaysi oy uchun"
            rules={[{ required: true, message: "Davrni tanlang" }]}
          >
            <Select
              onChange={() => paymentForm.setFieldValue("breakdown", { cash: null, card: null, online: null, bank: null })}
              options={(paymentDebtor?.periods || []).map((paymentPeriod) => ({
                value: paymentPeriod.id,
                disabled: paymentPeriod.debt <= 0,
                label: `${paymentPeriod.periodKey} — ${paymentPeriod.debt <= 0 ? "to‘liq to‘langan" : `${money(paymentPeriod.debt)} qoldiq`}`,
              }))}
            />
          </Form.Item>
          {selectedPeriod && (
            <div className="debtor-payment-balance">
              <span>Tanlangan davr qarzdorligi</span>
              <strong>{money(selectedPeriod.debt)}</strong>
            </div>
          )}
          <div className="payment-split-field"><label>To‘lov usullari bo‘yicha summa</label><div className="payment-split-grid">{Object.entries(methods).map(([value, label]) => <Form.Item className={`payment-split-method ${value}`} name={["breakdown", value]} label={label} key={value}><InputNumber min={0} precision={0} placeholder="0" addonAfter="so‘m" formatter={(v) => String(v || "").replace(/\B(?=(\d{3})+(?!\d))/g, " ")} parser={(v) => String(v || "").replace(/[^\d]/g, "")} /></Form.Item>)}</div><div className={`payment-split-total ${paymentTotal > Number(selectedPeriod?.debt || 0) ? "invalid" : ""}`}><span>Jami to‘lov</span><strong>{money(paymentTotal)}</strong></div>{paymentTotal > Number(selectedPeriod?.debt || 0) && <div className="form-error">Jami summa qarzdorlikdan oshmasligi kerak</div>}</div>
          {currentEmployee?.role === "cashier" && needsFundHolder && <Form.Item name="fundHolder" label="Karta / Click puli qaysi hisobga tushdi?" rules={[{ required: true, message: "Hisobni tanlang" }]}><Select options={[{ value: "organization", label: "Tashkilot hisobiga" }, { value: "cashier", label: "Shaxsiy hisobimga (keyin topshiraman)" }]} /></Form.Item>}
          <Form.Item name="note" label="Izoh">
            <Input placeholder="Ixtiyoriy" />
          </Form.Item>
          <div className="debtor-payment-actions">
            <Button onClick={() => setPaymentDebtor(null)}>Bekor qilish</Button>
            <Button type="primary" htmlType="submit" loading={creatingPayment} disabled={paymentTotal <= 0 || paymentTotal > Number(selectedPeriod?.debt || 0)}>
              To‘lovni tasdiqlash
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={Boolean(historyDebtor)}
        onCancel={() => setHistoryDebtor(null)}
        footer={null}
        width={760}
        title={
          historyDebtor
            ? `${historyDebtor.student.fullName} — to‘lovlar tarixi`
            : "To‘lovlar tarixi"
        }
        rootClassName="debtor-history-modal"
      >
        <div className="debtor-history-wrap">
          <table className="debtor-history-table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Shartnoma</th>
                <th>Qaysi oy uchun</th>
                <th>To‘lov turi</th>
                <th>Summa</th>
                <th>Izoh</th>
              </tr>
            </thead>
            <tbody>
              {(historyDebtor?.paymentHistory || []).map((payment) => (
                <tr key={payment.id}>
                  <td>{dayjs(payment.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                  <td>{payment.contract?.contractNumber || "—"}</td>
                  <td>
                    <span>
                      {payment.allocations?.[0]?.installment?.periodKey || "—"}
                    </span>
                  </td>
                  <td><strong>{payment.paymentPurpose === "deposit" ? "Deposit" : "Shartnoma"}</strong><small>{paymentMethodsText(payment)}</small></td>
                  <td>
                    <strong>{money(payment.amount)}</strong>
                  </td>
                  <td>{payment.note || "—"}</td>
                </tr>
              ))}
              {!historyDebtor?.paymentHistory?.length && (
                <tr>
                  <td colSpan="6" className="debtor-state">
                    To‘lovlar tarixi mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
