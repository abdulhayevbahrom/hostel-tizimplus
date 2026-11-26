const tashkentDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isContractEndingToday(value, now = new Date()) {
  if (!value) return false;
  const endDate = new Date(value);
  return !Number.isNaN(endDate.getTime())
    && tashkentDate.format(endDate) === tashkentDate.format(now);
}
