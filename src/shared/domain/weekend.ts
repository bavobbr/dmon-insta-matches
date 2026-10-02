function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// During Saturday/Sunday, keep the weekend already in progress selected.
export function getWeekendRange(today = new Date(), weekOffset = 0) {
  const saturday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilSaturday = today.getDay() === 0 ? -1 : (6 - today.getDay() + 7) % 7;
  saturday.setDate(saturday.getDate() + daysUntilSaturday + weekOffset * 7);
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);

  const formatter = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return {
    startDate: formatLocalDate(saturday),
    endDate: formatLocalDate(sunday),
    label: formatter.formatRange(saturday, sunday),
  };
}
