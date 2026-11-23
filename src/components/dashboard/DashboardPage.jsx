import { useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage, useGetDashboardQuery } from "../../store/baseApi";
import "./Dashboard.css";
import { DailyLineChart } from "./DailyLineChart";
import { DashboardPaymentProgress } from "./DashboardPaymentProgress";
import { LiveVacancyLossPanel } from "./LiveVacancyLossPanel";
import { VacancyLossPanel } from "./VacancyLossPanel";
import { StudentCountTable } from "./StudentCountTable";

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;
const methodLabels = {
  cash: "Naqd",
  card: "Karta",
  bank: "Bank o‘tkazma",
  online: "Click / Online",
};

function CardIcon({ type }) {
  const paths = {
    income: (
      <>
        <path d="M5 19 19 5M10 5h9v9" />
      </>
    ),
    expense: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    balance: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
    salary: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9.5c0-1 1.2-1.8 3-1.8s3 .7 3 1.8-1 1.7-3 2-3 1-3 2 1.2 1.8 3 1.8 3-.8 3-1.8M12 6v12" />
      </>
    ),
    debt: (
      <>
        <path d="M4 7h16v12H4zM7 4h10v3" />
        <path d="M14 12h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
    students: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c0-4 2-7 5-7s5 3 5 7M14 14c3-1 6 1 7 5" />
      </>
    ),
    rooms: (
      <>
        <path d="M3 20V5h14v15M17 9h4v11M2 20h20" />
        <path d="M7 8h3M7 12h3M7 16h3M13 8h1M13 12h1" />
      </>
    ),
    employee: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
      </>
    ),
    fine: (
      <>
        <path d="M12 3 3 20h18L12 3Z" />
        <path d="M12 9v5M12 17v.1" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function StatCard({ tone, icon, label, value, detail, onClick }) {
  return (
    <button className={`summary-card ${tone}`} onClick={onClick}>
      <div>
        <i>
          <CardIcon type={icon} />
        </i>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
  );
}

function RoomDonut({ rooms }) {
  const total = Math.max(1, Number(rooms.total || 0));
  const occupiedRooms = Math.min(
    rooms.available || 0,
    Math.ceil(((rooms.available || 0) * (rooms.occupancyRate || 0)) / 100),
  );
  const freeRooms = Math.max(0, (rooms.available || 0) - occupiedRooms);
  const repair = rooms.maintenance || 0;
  const circumference = 2 * Math.PI * 54;
  const occupiedLength = (circumference * occupiedRooms) / total;
  const freeLength = (circumference * freeRooms) / total;
  return (
    <div className="room-chart">
      <div className="donut">
        <svg viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="54" className="donut-bg" />
          <circle
            cx="65"
            cy="65"
            r="54"
            className="donut-occupied"
            strokeDasharray={`${occupiedLength} ${circumference - occupiedLength}`}
          />
          <circle
            cx="65"
            cy="65"
            r="54"
            className="donut-free"
            strokeDasharray={`${freeLength} ${circumference - freeLength}`}
            strokeDashoffset={-occupiedLength}
          />
          <circle
            cx="65"
            cy="65"
            r="54"
            className="donut-repair"
            strokeDasharray={`${(circumference * repair) / total} ${circumference}`}
            strokeDashoffset={-(occupiedLength + freeLength)}
          />
        </svg>
        <span>
          <strong>{rooms.total || 0}</strong>
          <small>xona</small>
        </span>
      </div>
      <div className="room-legend">
        <div>
          <i className="occupied" />
          <span>Band xonalar</span>
          <b>{occupiedRooms} ta</b>
        </div>
        <div>
          <i className="free" />
          <span>Bo‘sh xonalar</span>
          <b>{freeRooms} ta</b>
        </div>
        <div>
          <i className="beds" />
          <span>Bo‘sh o‘rinlar</span>
          <b>{rooms.free || 0} ta</b>
        </div>
        <div>
          <i className="repair" />
          <span>Ta’mirdagi</span>
          <b>{repair} ta</b>
        </div>
        <footer>
          <em>Jami: {rooms.total || 0} ta</em>
          <em>Bandlik: {rooms.occupancyRate || 0}%</em>
        </footer>
      </div>
    </div>
  );
}

function AttendanceDonut({ attendance }) {
  const total = Math.max(1, Number(attendance.total || 0));
  const circumference = 2 * Math.PI * 54;
  const items = [
    { key: "present", label: "Keldi", value: attendance.present || 0 },
    { key: "late", label: "Kechikdi", value: attendance.late || 0 },
    { key: "absent", label: "Kelmadi", value: attendance.absent || 0 },
    { key: "unmarked", label: "Belgilanmagan", value: attendance.unmarked || 0 },
  ];
  let offset = 0;
  return (
    <div className="attendance-chart">
      <div className="attendance-donut">
        <svg viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="54" className="attendance-donut-bg" />
          {items.map((item) => {
            const length = (circumference * item.value) / total;
            const segment = (
              <circle key={item.key} cx="65" cy="65" r="54" className={`attendance-segment ${item.key}`} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />
            );
            offset += length;
            return segment;
          })}
        </svg>
        <span><strong>{attendance.total || 0}</strong><small>talaba</small></span>
      </div>
      <div className="attendance-legend">
        {items.map((item) => <div key={item.key}><i className={item.key} /><span>{item.label}</span><b>{item.value} ta</b><em>{attendance.total ? Math.round((item.value / attendance.total) * 100) : 0}%</em></div>)}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [methodPeriod, setMethodPeriod] = useState("month");
  const [countPeriod, setCountPeriod] = useState("month");
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardQuery({
    period: period.format("YYYY-MM"),
    date: selectedDate.format("YYYY-MM-DD"),
  }, { refetchOnFocus: true, refetchOnReconnect: true });
  if (isLoading)
    return (
      <div className="dashboard-loading">
        <span />
        Dashboard tayyorlanmoqda
      </div>
    );
  if (error)
    return (
      <div className="dashboard-error">
        <p>{apiErrorMessage(error)}</p>
        <button onClick={refetch}>Qayta yuklash</button>
      </div>
    );
  const f = data.finance || {},
    d = data.debt || {},
    r = data.rooms || {},
    a = data.attendance || {};
  const latestStudentExpense = data.studentExpenses?.rows?.at(-1);
  const monthLabel = period.format("MMMM YYYY");
  const selectedMethods =
    methodPeriod === "month"
      ? data.paymentMethods || []
      : data.dailyPaymentMethods || [];
  const methods = Object.fromEntries(
    selectedMethods.map((item) => [item._id, item]),
  );
  const methodMax = Math.max(1, ...selectedMethods.map((item) => item.amount));
  return (
    <div className={`reference-dashboard ${isFetching ? "refreshing" : ""}`}>
      <div className="dashboard-toolbar">
        <div>
          <h1>Boshqaruv paneli</h1>
          <p>Barcha muhim ko‘rsatkichlar bir joyda</p>
        </div>
        <div className="dashboard-date-filters">
          <DatePicker
            allowClear={false}
            value={selectedDate}
            format="DD.MM.YYYY"
            disabledDate={(current) =>
              current && current.isAfter(dayjs(), "day")
            }
            onChange={(value) => value && setSelectedDate(value)}
          />
          <DatePicker
            picker="month"
            allowClear={false}
            value={period}
            format="MMMM YYYY"
            onChange={(value) => value && setPeriod(value)}
          />
        </div>
      </div>
      <LiveVacancyLossPanel summary={data.vacancyLoss} period={data.period} />

      <DashboardPaymentProgress period={data.period} />

      <section className="summary-grid">
        <StatCard
          tone="purple"
          icon="income"
          label="Kunlik kirim"
          value={money(f.todayIncome)}
          detail={`${selectedDate.format("DD.MM.YYYY")} kuni qabul qilingan kirimlar`}
          onClick={() => navigate("/payments")}
        />
        <StatCard
          tone="red"
          icon="expense"
          label="Kunlik xarajat"
          value={money(f.todayExpense)}
          detail={`${selectedDate.format("DD.MM.YYYY")} kuni kiritilgan xarajatlar`}
          onClick={() => navigate("/expenses")}
        />
        <StatCard
          tone="cyan"
          icon="balance"
          label="Kunlik balans"
          value={money(f.todayBalance)}
          detail="Kunlik kirim − xarajati"
        />
        <StatCard
          tone="purple"
          icon="income"
          label="Oylik kirim"
          value={money(f.income)}
          detail={`${monthLabel}da qabul qilingan ${f.incomeCount || 0} ta to‘lov; boshqa oylar uchun to‘lovlar ham kiradi`}
          onClick={() => navigate("/payments")}
        />
        <StatCard
          tone="red"
          icon="expense"
          label="Oylik xarajat"
          value={money(f.expenses)}
          detail={`${monthLabel} bo‘yicha ${f.expenseCount || 0} ta xarajat`}
          onClick={() => navigate("/expenses")}
        />
        <StatCard
          tone="orange"
          icon="salary"
          label="Berilgan oylik"
          value={money(f.salaryPaid)}
          detail={`Hisoblangan oylik: ${money(f.salaryFund)}`}
          onClick={() => navigate("/salaries")}
        />
        <StatCard
          tone="cyan"
          icon="balance"
          label="Oylik balans"
          value={money(f.balance)}
          detail="Oy kirimi − xarajat − berilgan oylik"
        />
        <StatCard
          tone="slate"
          icon="balance"
          label="Oylik hisob"
          value={money(d.billedAmount)}
          detail={period.isAfter(dayjs(), "month")
            ? `Shu oy hisobi uchun to‘langan: ${money(d.paidAmount)}; qolgan qismi kutilmoqda`
            : `Shu oy hisobi uchun to‘langan ${money(d.paidAmount)} + qarz ${money(d.amount)}`}
        />
        <StatCard
          tone="pink"
          icon="debt"
          label="Talabalar jami qarzi"
          value={money(d.amount)}
          detail={`${monthLabel} qarzi · ${d.students || 0} talaba`}
          onClick={() => navigate("/debtors")}
        />
        <StatCard
          tone="red"
          icon="expense"
          label="Bir talabaga to‘g‘ri keladigan xarajat"
          value={latestStudentExpense?.cost == null ? "—" : money(Math.round(latestStudentExpense.cost * 100) / 100)}
          detail={latestStudentExpense
            ? `${String(latestStudentExpense.day).padStart(2, "0")}.${data.period.slice(5)}.${data.period.slice(0, 4)} holatiga · ${latestStudentExpense.studentCount} talaba · oy boshidan`
            : "Tanlangan davr bo‘yicha ma’lumot yo‘q"}
        />
      </section>

      <section className="overview-row">
        <article className="light-panel center-status">
          <h2>Yotoqxona holati</h2>
          <div>
            <button onClick={() => navigate("/contracts")}>
              <i className="pink">
                <CardIcon type="students" />
              </i>
              <span>
                <b>Faol yashovchilar</b>
                <strong>{data.students?.active || 0}</strong>
                <small>Aktiv shartnomali talabalar</small>
              </span>
            </button>
            <button onClick={() => navigate("/rooms")}>
              <i className="blue">
                <CardIcon type="rooms" />
              </i>
              <span>
                <b>Xonalar</b>
                <strong>{r.total || 0}</strong>
                <small>{r.free || 0} ta bo‘sh joy</small>
              </span>
            </button>
            <button onClick={() => navigate("/employees")}>
              <i className="gold">
                <CardIcon type="employee" />
              </i>
              <span>
                <b>Xodimlar</b>
                <strong>{data.employees?.active || 0}</strong>
                <small>Faol xodimlar</small>
              </span>
            </button>
            <button onClick={() => navigate("/fines")}>
              <i className="green">
                <CardIcon type="fine" />
              </i>
              <span>
                <b>Jarimalar</b>
                <strong>{d.fineStudents || 0}</strong>
                <small>{money(d.fineAmount)} qoldiq</small>
              </span>
            </button>
          </div>
        </article>
        <article className="light-panel rooms-panel">
          <header>
            <h2>Xonalar holati</h2>
            <span>{selectedDate.format("DD.MM.YYYY")}</span>
          </header>
          <RoomDonut rooms={r} />
        </article>
        <article className="light-panel payment-methods">
          <div className="payment-method-head">
            <h2>To‘lov usullari</h2>
            <span>
              <button
                className={methodPeriod === "month" ? "active" : ""}
                onClick={() => setMethodPeriod("month")}
              >
                Oylik
              </button>
              <button
                className={methodPeriod === "day" ? "active" : ""}
                onClick={() => setMethodPeriod("day")}
              >
                Kunlik
              </button>
            </span>
          </div>
          {["cash", "card", "bank", "online"].map((key) => (
            <div key={key}>
              <span>
                {methodLabels[key]}
                <b>{money(methods[key]?.amount)}</b>
              </span>
              <i>
                <em
                  style={{
                    width: `${((methods[key]?.amount || 0) / methodMax) * 100}%`,
                  }}
                />
              </i>
            </div>
          ))}
        </article>
      </section>

      <section className="visual-row">
        <article className="light-panel attendance-panel">
          <header>
            <h2>Tanlangan kun davomati</h2>
            <span>{selectedDate.format("DD.MM.YYYY")}</span>
          </header>
          <AttendanceDonut attendance={a} />
        </article>
        <article className="light-panel debtors-panel">
          <header>
            <h2>Eng katta qarzdorlar</h2>
            <button onClick={() => navigate("/debtors")}>Barchasi →</button>
          </header>
          <table>
            <thead>
              <tr>
                <th>Talaba</th>
                <th>Xona</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              {(data.topDebtors || []).map((item) => (
                <tr key={item.student.id}>
                  <td>
                    <strong>{item.student.fullName}</strong>
                  </td>
                  <td>
                    {item.room
                      ? `${item.room.block} · ${item.room.roomNumber}`
                      : "—"}
                  </td>
                  <td>
                    <b>{money(item.debt)}</b>
                  </td>
                </tr>
              ))}
              {!data.topDebtors?.length && (
                <tr>
                  <td colSpan="3" className="empty">
                    Qarzdorlar yo‘q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>

      <section className="light-panel dynamics-panel">
        <header>
          <div>
            <h2>Oylik dinamika</h2>
            <span className="chart-keys">
              <i className="income" />
              Tushgan to‘lov <i className="expense" />
              Xarajat
            </span>
          </div>
          <span>{period.format("YYYY-MM")}</span>
        </header>
        <div className="chart-totals">
          <b>Jami tushum: {money(f.income)}</b>
          <b>Jami xarajat: {money(f.expenses)}</b>
        </div>
        <DailyLineChart rows={data.dailyTrends || []} />
      </section>

      <StudentCountTable key={data.period} period={data.period} summary={data.studentExpenses}
        yearlyCounts={data.yearlyStudentCounts} countPeriod={countPeriod} onCountPeriodChange={setCountPeriod} />

      <VacancyLossPanel summary={data.vacancyLoss} period={data.period} />

      <section className="light-panel recent-panel">
        <header>
          <h2>Oxirgi amallar</h2>
          <span>So‘nggi pul harakatlari</span>
        </header>
        <div className="recent-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sana</th>
                <th>Amal</th>
                <th>Nomi</th>
                <th>Summa</th>
              </tr>
            </thead>
            <tbody>
              {(data.transactions || []).map((item) => (
                <tr key={item.id}>
                  <td className="recent-date-cell">
                    <strong>{dayjs(item.createdAt).format("DD.MM.YYYY")}</strong>
                    <small>{dayjs(item.createdAt).format("HH:mm")}</small>
                  </td>
                  <td>
                    <div className="recent-action-cell">
                      <span className={`operation ${item.type}`}>
                        {item.type === "income"
                          ? "Kirim"
                          : item.type === "salary"
                            ? "Oylik"
                            : "Xarajat"}
                      </span>
                      <b className={item.type}>
                        {item.type === "income" ? "+" : "−"} {money(item.amount)}
                      </b>
                    </div>
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </td>
                  <td className="recent-amount-cell">
                    <b className={item.type}>
                      {item.type === "income" ? "+" : "−"} {money(item.amount)}
                    </b>
                  </td>
                </tr>
              ))}
              {!data.transactions?.length && (
                <tr>
                  <td colSpan="4" className="empty">
                    Ma’lumot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
