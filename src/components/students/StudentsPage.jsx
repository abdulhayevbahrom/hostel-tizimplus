import { useDeferredValue, useMemo, useState } from "react";
import { ConfigProvider, DatePicker, Modal, Pagination, Popconfirm, Select } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  apiErrorMessage,
  useDeleteStudentMutation,
  useGetFacultiesQuery,
  useGetRoomsQuery,
  useGetStudentsQuery,
  useGetUniversitiesQuery,
  useUpdateStudentMutation,
} from "../../store/baseApi";
import { StudentFormModal } from "./StudentFormModal";
import { StudentHistoryTab } from "./StudentHistoryTab";
import "./Students.css";
import "./StudentHistory.css";
import "./StudentsTabsCompact.css";

const studentStatusLabel = {
  green: "Qoladi",
  warning: "50/50",
  red: "Ketadi",
};
const paymentStatusLabel = {
  onTime: "Ha",
  almostOnTime: "Yo‘q",
  late: "Yo‘q",
  pending: "Kutilmoqda",
};
const paymentTimingDetailLabel = {
  onTime: "Vaqtida",
  almostOnTime: "Deyarli vaqtida",
  late: "Kechikkan",
  pending: "Kutilmoqda",
};
const paymentFilterLabels = {
  fullyPaid: "To‘liq to‘lagan",
  late: "Kechikkan",
  pending: "Kutilmoqda",
};

function getPaymentTimingDetail(status, days) {
  if (Number.isInteger(days)) {
    if (status === "pending") return `${days} kun qoldi`;
    if (status === "late") return `${days} kun kechikkan`;
  }
  return `Muddat holati: ${paymentTimingDetailLabel[status]}`;
}
const educationTypeLabel = {
  daytime: "Kunduzgi",
  evening: "Kechki",
  extramural: "Sirtqi",
  employed: "Ishlaydi",
};
const educationTypeOptions = Object.entries(educationTypeLabel).map(([value, label]) => ({ value, label }));
const courseOptions = [1, 2, 3, 4, 5, 6].map((value) => ({ value, label: `${value}-kurs` }));

function CourseFilter({ value, onChange }) {
  return <Select
    mode="multiple"
    allowClear
    placeholder="Kurs"
    value={value}
    maxTagCount="responsive"
    options={courseOptions}
    onChange={onChange}
    menuItemSelectedIcon={<span className="student-course-remove-icon">×</span>}
  />;
}

const isContractExpiringWithinTwoDays = (endDate) => {
  if (!endDate) return false;
  const daysLeft = dayjs(endDate).startOf("day").diff(dayjs().startOf("day"), "day");
  return daysLeft >= 0 && daysLeft <= 2;
};

function ContractDateFilter({ value, onChange }) {
  return <div className="students-contract-date-filter">
    <DatePicker.RangePicker value={value} onChange={onChange} format="DD.MM.YYYY" allowClear
      placeholder={["Boshlanish sanasi", "Tugash sanasi"]} aria-label="Shartnoma tuzilgan sana oralig‘i" />
  </div>;
}

function StudentsListTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [universityFilter, setUniversityFilter] = useState(undefined);
  const [facultyFilter, setFacultyFilter] = useState(undefined);
  const [courseFilter, setCourseFilter] = useState([]);
  const [educationTypeFilter, setEducationTypeFilter] = useState(undefined);
  const [floorFilter, setFloorFilter] = useState(undefined);
  const [roomFilter, setRoomFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [paymentFilter, setPaymentFilter] = useState(undefined);
  const [contractDateRange, setContractDateRange] = useState(null);
  const updateContractDateRange = (value) => {
    setContractDateRange(value);
    setPage(1);
  };
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const {
    data,
    isLoading,
    isFetching,
    error: listError,
  } = useGetStudentsQuery({
    search: deferredQuery,
    page,
    university: universityFilter,
    faculty: facultyFilter,
    course: courseFilter,
    educationType: educationTypeFilter,
    floor: floorFilter,
    room: roomFilter,
    studentStatus: statusFilter,
    paymentStatus: paymentFilter,
    contractCreatedFrom: contractDateRange?.[0]?.format("YYYY-MM-DD"),
    contractCreatedTo: contractDateRange?.[1]?.format("YYYY-MM-DD"),
  }, { refetchOnMountOrArgChange: true });
  const { data: universityData } = useGetUniversitiesQuery();
  const { data: facultyData } = useGetFacultiesQuery();
  const { data: roomData } = useGetRoomsQuery();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: deleting }] = useDeleteStudentMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const students = useMemo(() => data?.students || [], [data?.students]);
  const pagination = data?.pagination || { page: 1, total: 0, limit: 25 };
  const universities = useMemo(
    () => universityData?.universities || [],
    [universityData?.universities],
  );
  const faculties = useMemo(
    () =>
      (facultyData?.faculties || []).filter(
        (item) =>
          !universityFilter ||
          (item.university?.id || item.university) === universityFilter,
      ),
    [facultyData?.faculties, universityFilter],
  );
  const rooms = useMemo(() => roomData?.rooms || [], [roomData?.rooms]);
  const floorOptions = useMemo(
    () =>
      [...new Set(rooms.map((room) => String(room.floor)))]
        .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
        .map((floor) => ({ value: floor, label: `${floor}-qavat` })),
    [rooms],
  );
  const roomOptions = useMemo(
    () =>
      rooms.filter((room) => !floorFilter || room.floor === floorFilter).map((room) => ({
        value: room.id,
        label: `${room.block ? `${room.block} blok · ` : ""}${room.roomNumber}-xona · ${room.floor}-qavat`,
      })),
    [floorFilter, rooms],
  );
  const close = () => {
    setModalOpen(false);
    setEditing(null);
    setError("");
  };
  const submit = async ({ values, photoFiles, removePhoto }) => {
    try {
      setError("");
      const body = new FormData();
      body.append("payload", JSON.stringify({ ...values, removePhoto }));
      if (photoFiles[0]?.originFileObj)
        body.append("photo", photoFiles[0].originFileObj);
      await updateStudent({ id: editing.id, body }).unwrap();
      toast.success("Talaba yangilandi");
      close();
    } catch (requestError) {
      const message = apiErrorMessage(requestError);
      setError(message);
      toast.error(message);
    }
  };
  const remove = async (id) => {
    try {
      await deleteStudent(id).unwrap();
      toast.success("Talaba o‘chirildi");
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError));
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorBorder: "#8ca6ad", colorText: "#263b45", colorTextPlaceholder: "#5e7580", colorBgContainer: "#f8fbfc", colorPrimary: "#0f766e" } }}>
    <div className="students-page">
      <div className="students-card">
        <div className="students-toolbar">
          <div className="students-toolbar-controls">
            <div className="students-toolbar-actions">
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="F.I.O, telefon, JSHR yoki pasport"
              />
              <button
                type="button"
                className="students-filter-toggle"
                aria-label="Filterlarni ochish"
                onClick={() => setFiltersModalOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M7 12h10M10 17h4" />
                </svg>
              </button>
              <ContractDateFilter value={contractDateRange} onChange={updateContractDateRange} />
              <button type="button" className="students-create-button" onClick={() => navigate('/students/new')}>+ Yangi talaba</button>
            </div>
            <div className="students-toolbar-filters">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Universitet"
                value={universityFilter}
                options={universities.map((item) => ({
                  value: item.id,
                  label: item.shortName || item.name,
                }))}
                onChange={(value) => {
                  setUniversityFilter(value);
                  setFacultyFilter(undefined);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Fakultet"
                value={facultyFilter}
                options={faculties.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(value) => {
                  setFacultyFilter(value);
                  setPage(1);
                }}
              />
              <CourseFilter
                value={courseFilter}
                onChange={(value) => {
                  setCourseFilter(value);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                placeholder="Ta’lim turi"
                value={educationTypeFilter}
                options={educationTypeOptions}
                onChange={(value) => {
                  setEducationTypeFilter(value);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                placeholder="Qavat"
                value={floorFilter}
                options={floorOptions}
                onChange={(value) => {
                  setFloorFilter(value);
                  setRoomFilter(undefined);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Xona"
                value={roomFilter}
                options={roomOptions}
                onChange={(value) => {
                  setRoomFilter(value);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                aria-label="Bu oydagi to‘lov holati"
                placeholder="To‘lov holati"
                value={paymentFilter}
                options={Object.entries(paymentFilterLabels).map(([value, label]) => ({ value, label }))}
                onChange={(value) => {
                  setPaymentFilter(value);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                placeholder="Talaba holati"
                value={statusFilter}
                options={Object.entries(studentStatusLabel).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
        {listError && (
          <div className="form-error">{apiErrorMessage(listError)}</div>
        )}
        {isLoading ? (
          <div className="students-loading">Talabalar yuklanmoqda…</div>
        ) : (
          <>
            <div className="students-result-count" aria-live="polite">
              Jami: <strong>{pagination.total}</strong> ta talaba
            </div>
            <div
              className={`students-table-wrap ${isFetching ? "is-fetching" : ""}`}
            >
              <table className="students-table">
                <thead>
                  <tr>
                    <th className="student-person-cell">Talaba</th>
                    <th className="student-room-cell">Xona</th>
                    <th>Tuzilgan sana</th>
                    <th>Kirgan / tugash</th>
                    <th>Bu oy vaqtida to‘ladi</th>
                    <th>Holati</th>
                    <th>Soliq hujjat</th>
                    <th className="student-phone-cell">Telefon</th>
                    <th>Universitet</th>
                    <th>Kurs</th>
                    <th>Ta’lim turi</th>
                    <th className="student-note-cell">Izoh</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const status = student.studentStatus || "green";
                    const room = student.activeRoom;
                    const roomDetails = [
                      room?.block && `${room.block} blok`,
                      room?.floor && `${room.floor}-qavat`,
                    ].filter(Boolean).join(" · ");
                    return (
                      <tr
                        key={student.id}
                        className={[
                          student.disciplinaryStatus === "blacklisted" ? "student-row-blacklisted" : "",
                          isContractExpiringWithinTwoDays(student.activeContractEndDate) ? "student-row-contract-expiring" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <td className="student-person-cell" data-label="Talaba">
                          <div className="student-person">
                            {student.photo ? (
                              <img
                                src={
                                  student.photo.thumbnailUrl ||
                                  student.photo.url
                                }
                                alt={student.fullName}
                              />
                            ) : (
                              <span>
                                {student.fullName.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <Link to={`/student/${student.id}`} title={student.fullName}>
                              {student.fullName}
                            </Link>
                          </div>
                        </td>
                        <td className="student-room-cell" data-label="Xona">
                          {room ? (
                            <div className="student-room">
                              <strong>{room.roomNumber}-xona{student.activeBedNumber ? ` · ${student.activeBedNumber}-o‘rin` : ''}</strong>
                              {roomDetails && (
                                <small title={roomDetails}>{roomDetails}</small>
                              )}
                            </div>
                          ) : (
                            <span className="student-room-empty">—</span>
                          )}
                        </td>
                        <td data-label="Tuzilgan sana">
                          <span className="student-contract-created-at">
                            {student.activeContractCreatedAt
                              ? dayjs(student.activeContractCreatedAt).format("DD.MM.YYYY HH:mm")
                              : "—"}
                          </span>
                        </td>
                        <td data-label="Kirgan / tugash">
                          <div className="student-contract-dates">
                            <span className="student-contract-date-start">
                              Kirgan: {student.activeContractStartDate ? dayjs(student.activeContractStartDate).format("DD.MM.YYYY") : "—"}
                            </span>
                            <span className="student-contract-date-end">
                              Tugash: {student.activeContractEndDate ? dayjs(student.activeContractEndDate).format("DD.MM.YYYY") : "—"}
                            </span>
                          </div>
                        </td>
                        <td data-label="Bu oy vaqtida to‘ladi">
                          {student.currentPaymentStatus ? (
                            <span className={`student-payment-timing ${student.currentPaymentStatus}`}>
                              <strong>{paymentStatusLabel[student.currentPaymentStatus]}</strong>
                              <small>{getPaymentTimingDetail(student.currentPaymentStatus, student.currentPaymentDays)}</small>
                              <small>Oxirgi to‘lov: {student.currentPaymentLastPaidAt ? dayjs(student.currentPaymentLastPaidAt).format("DD.MM.YYYY") : "—"}</small>
                            </span>
                          ) : (
                            <span className="student-payment-timing unavailable">—</span>
                          )}
                        </td>
                        <td data-label="Holati">
                          <span className={`student-status-badge ${status}`}>
                            <i />
                            {studentStatusLabel[status]}
                          </span>
                        </td>
                        <td data-label="Soliq shartnomasi">
                          <span
                            className={`student-tax-contract ${student.hasTaxContract ? "checked" : "unchecked"}`}
                            role="img"
                            aria-label={
                              student.hasTaxContract
                                ? "Soliq shartnomasi mavjud"
                                : "Soliq shartnomasi mavjud emas"
                            }
                          >
                            {student.hasTaxContract ? "✓" : "×"}
                          </span>
                        </td>
                        <td className="student-phone-cell" data-label="Telefon">
                          <div className="student-phone">
                            <strong>{student.phone}</strong>
                            {student.parentPhone && (
                              <small>{student.parentPhone}</small>
                            )}
                          </div>
                        </td>
                        <td data-label="Universitet">
                          <div className="student-education">
                            <strong>
                              {student.university?.shortName ||
                                student.university?.name ||
                                "—"}
                            </strong>
                            <small>{student.faculty?.name || "—"}</small>
                          </div>
                        </td>
                        <td data-label="Kurs">
                          <span className="student-course">
                            {student.course}-kurs
                          </span>
                        </td>
                        <td data-label="Ta’lim turi">
                          <span className="student-education-type">
                            {educationTypeLabel[student.educationType] || "—"}
                          </span>
                        </td>
                        <td data-label="Izoh" className="student-note-cell">
                          <div className={`student-note ${student.note ? "has-note" : "student-note-empty"}`} title={student.note || ""}>
                            {student.note || "—"}
                          </div>
                        </td>
                        <td data-label="Amal">
                          <div className="student-actions">
                            <button
                              className="student-icon-btn"
                              onClick={() => {
                                setEditing(student);
                                setModalOpen(true);
                              }}
                              aria-label="Tahrirlash"
                              title="Tahrirlash"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M4 20H8L18 10L14 6L4 16V20Z" />
                                <path d="M12 8L16 12" />
                              </svg>
                            </button>
                            <Popconfirm
                              title="Talabani o‘chirish"
                              description="Ushbu amalni tasdiqlaysizmi?"
                              okText="O‘chirish"
                              cancelText="Bekor"
                              okButtonProps={{
                                danger: true,
                                loading: deleting,
                              }}
                              onConfirm={() => remove(student.id)}
                            >
                              <button
                                className="student-icon-btn danger"
                                disabled={deleting}
                                aria-label="O‘chirish"
                                title="O‘chirish"
                              >
                                <svg viewBox="0 0 24 24">
                                  <path d="M4 7H20M9 7V5H15V7M7 7L8 20H16L17 7" />
                                </svg>
                              </button>
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!students.length && (
                    <tr>
                      <td className="students-empty" colSpan={13}>
                        Talabalar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pagination.total > pagination.limit && (
              <div className="students-pagination">
                <Pagination
                  current={pagination.page}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  showSizeChanger={false}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
      <StudentFormModal
        open={modalOpen}
        student={editing}
        loading={updating}
        error={error}
        onClose={close}
        onSubmit={submit}
      />
      <Modal
        open={filtersModalOpen}
        title="Filterlar"
        footer={null}
        onCancel={() => setFiltersModalOpen(false)}
        className="students-filters-modal"
      >
        <div className="students-filters-modal-body">
          <ContractDateFilter value={contractDateRange} onChange={updateContractDateRange} />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Universitet"
            value={universityFilter}
            options={universities.map((item) => ({
              value: item.id,
              label: item.shortName || item.name,
            }))}
            onChange={(value) => {
              setUniversityFilter(value);
              setFacultyFilter(undefined);
              setPage(1);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Fakultet"
            value={facultyFilter}
            options={faculties.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(value) => {
              setFacultyFilter(value);
              setPage(1);
            }}
          />
          <CourseFilter
            value={courseFilter}
            onChange={(value) => {
              setCourseFilter(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Ta’lim turi"
            value={educationTypeFilter}
            options={educationTypeOptions}
            onChange={(value) => {
              setEducationTypeFilter(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Qavat"
            value={floorFilter}
            options={floorOptions}
            onChange={(value) => {
              setFloorFilter(value);
              setRoomFilter(undefined);
              setPage(1);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Xona"
            value={roomFilter}
            options={roomOptions}
            onChange={(value) => {
              setRoomFilter(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            aria-label="Bu oydagi to‘lov holati"
            placeholder="To‘lov holati"
            value={paymentFilter}
            options={Object.entries(paymentFilterLabels).map(([value, label]) => ({ value, label }))}
            onChange={(value) => {
              setPaymentFilter(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Talaba holati"
            value={statusFilter}
            options={Object.entries(studentStatusLabel).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          />
        </div>
      </Modal>
    </div>
    </ConfigProvider>
  );
}

export function StudentsPage() {
  const [activeTab, setActiveTab] = useState("students");
  return (
    <div className="students-module">
      <nav className="students-tabs" aria-label="Talabalar bo‘limlari">
        <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>Talabalar</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Talabalar tarixi</button>
      </nav>
      {activeTab === "students" ? <StudentsListTab /> : <StudentHistoryTab />}
    </div>
  );
}
