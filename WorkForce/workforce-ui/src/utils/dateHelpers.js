export const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatShortDayLabel = (dateString) => {
  if (!dateString) return '';
  const todayStr = toLocalISODate(new Date());
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return dateString;
  const dayMonth = parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return dateString === todayStr ? `Today, ${dayMonth}` : dayMonth;
};

export const formatLargeDateHeader = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatConversationalDate = (dateString) => {
  if (!dateString) return '';
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return dateString;
  return parsedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatWeekday = (dateString) => {
  if (!dateString) return '';
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleDateString('en-GB', { weekday: 'long' });
};

export const formatSelectedDatesLabel = (dateStrings) => {
  if (!dateStrings || dateStrings.length === 0) return '';
  const sorted = [...dateStrings].sort();
  const groups = [];
  sorted.forEach(dateStr => {
    const d = new Date(dateStr);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const day = String(d.getDate()).padStart(2, '0');
    const monthAbbr = d.toLocaleDateString('en-GB', { month: 'short' });
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.key === monthKey) {
      lastGroup.days.push(day);
    } else {
      groups.push({ key: monthKey, days: [day], monthAbbr });
    }
  });
  return groups.map(g => `${g.days.join(', ')} ${g.monthAbbr}`).join(', ');
};

export const getEarliestJoiningDate = (project) => {
  const joinDates = (project?.employees || []).map(w => w.joiningDate || '2026-07-01');
  if (joinDates.length === 0) return '2026-07-01';
  return joinDates.reduce((earliest, d) => (d < earliest ? d : earliest));
};

export const getSavedAttendanceDatesSet = (project) => {
  const set = new Set();
  (project?.employees || []).forEach(w => {
    Object.entries(w.attendance || {}).forEach(([dateStr, rec]) => {
      if (rec && rec.status) set.add(dateStr);
    });
  });
  return set;
};