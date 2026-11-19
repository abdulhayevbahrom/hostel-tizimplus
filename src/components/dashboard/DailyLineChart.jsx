import { useId, useState } from "react";

const compact = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)} mlrd`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)} mln`;
  if (amount >= 1e3) return `${Math.round(amount / 1e3)} ming`;
  return amount.toLocaleString("uz-UZ");
};
const monthlyFinanceSeries = [
  { key: "income", label: "Tushum", tone: "income", format: compact },
  { key: "expenses", label: "Xarajat", tone: "expense", format: compact },
];

export function DailyLineChart({ rows, series = monthlyFinanceSeries, label = "Kunlik tushum va xarajat grafigi", countScale = false, width = 1100 }) {
  const [activeDay, setActiveDay] = useState(null);
  const gradientId = useId();
  const height = 220, left = 62, right = 18, top = 18, bottom = 30;
  const plotWidth = width - left - right;
  const plotBottom = height - bottom;
  const dayWidth = plotWidth / Math.max(1, rows.length - 1);
  const x = (index) => left + (rows.length === 1 ? plotWidth / 2 : dayWidth * index);
  const values = rows.flatMap((row) => series.map(({ key }) => row[key]).filter((value) => value != null));
  const min = countScale && values.length ? Math.max(0, Math.min(...values) - 1) : 0;
  const max = Math.max(min + (countScale ? 5 : 1), ...values);
  const y = (value) => top + (plotBottom - top) * (max - value) / (max - min);
  const selectedIndex = rows.findIndex((row) => row.day === activeDay);
  const selected = rows[selectedIndex];
  const tooltipWidth = 190;
  const tooltipX = Math.min(width - tooltipWidth - 6, Math.max(6, x(selectedIndex) - tooltipWidth / 2));
  const describe = (row, { key, format }) => row[key] == null ? "—" : format(Math.round(row[key]));
  const plot = series.map(({ key, tone }) => {
    const segments = [];
    let points = [];
    rows.forEach((row, index) => {
      if (row[key] != null) {
        points.push([x(index), y(row[key])]);
      } else if (points.length) {
        segments.push(points);
        points = [];
      }
    });
    if (points.length) segments.push(points);
    return { key, tone, segments };
  });

  if (!values.length) {
    return <p className="student-expense-empty">Tanlangan oy bo‘yicha ma’lumot yo‘q.</p>;
  }

  return (
    <div className="daily-chart-wrap">
      <svg className="daily-chart" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}
        onPointerLeave={() => setActiveDay(null)}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2d8177" stopOpacity=".22" />
            <stop offset="1" stopColor="#2d8177" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => {
          const value = min + (max - min) * tick;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} />
              <text x={left - 9} y={y(value) + 4} textAnchor="end">
                {countScale ? Math.round(value) : compact(Math.round(value))}
              </text>
            </g>
          );
        })}
        {plot.map(({ key, tone, segments }, seriesIndex) => segments.map((points, index) => {
          const coordinates = points.map((point) => point.join(",")).join(" ");
          return (
            <g key={`${key}-${index}`}>
              {seriesIndex === 0 && points.length > 1 && (
                <polygon points={`${points[0][0]},${plotBottom} ${coordinates} ${points.at(-1)[0]},${plotBottom}`} fill={`url(#${gradientId})`} />
              )}
              <polyline points={coordinates} className={`${tone}-line`} />
            </g>
          );
        }))}
        {rows.map((row, index) => {
          const active = activeDay === row.day;
          const hitStart = Math.max(left - 8, x(index) - dayWidth / 2);
          const hitEnd = Math.min(width - right + 8, x(index) + dayWidth / 2);
          return (
            <g key={row.day}>
              <rect className="daily-chart-hit" x={hitStart} y={top} width={hitEnd - hitStart}
                height={plotBottom - top} tabIndex={0}
                aria-label={`${row.detailLabel ?? `${row.day}-kun`}. ${series.map((item) => `${item.label}: ${describe(row, item)}`).join(". ")}`}
                onFocus={() => setActiveDay(row.day)}
                onBlur={() => setActiveDay(null)}
                onPointerEnter={() => setActiveDay(row.day)}
                onPointerDown={() => setActiveDay(row.day)}
              />
              {series.map(({ key, tone }) => row[key] != null && (
                <circle key={key} className={`${tone}-dot`} cx={x(index)} cy={y(row[key])} r={active ? 4 : 2.5} />
              ))}
              <text x={x(index)} y={height - 8} textAnchor="middle">{row.label ?? row.day}</text>
            </g>
          );
        })}
        {selected && (
          <g className="daily-tooltip" aria-hidden="true" transform={`translate(${tooltipX} 3)`}>
            <rect width={tooltipWidth} height={25 + series.length * 16} rx="7" />
            <text x="10" y="16">{selected.detailLabel ?? `${selected.day}-kun`}</text>
            {series.map((item, index) => (
              <text key={item.key} x="10" y={33 + index * 16}>{item.label}: {describe(selected, item)}</text>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

