import { AVATAR_COLOR_PALETTE } from './constants';
import { toLocalISODate } from '../../shared/helpers';

export const getEmployeeAvatarColors = (name) => {
  const trimmed = (name || '').trim();
  const firstLetter = trimmed ? trimmed[0].toUpperCase() : 'W';
  const code = firstLetter.charCodeAt(0);
  const paletteLen = AVATAR_COLOR_PALETTE.length;
  const index = ((code - 65) % paletteLen + paletteLen) % paletteLen;
  return AVATAR_COLOR_PALETTE[index];
};

// ===== DTO <-> UI SHAPE MAPPERS =====
// ASP.NET's System.Text.Json serializer camelCases property names
// (FullName -> fullName, PaymentId -> paymentId, etc). The UI was built around
// a simpler local shape (name, mobileNumber, wageOverrides with
// {from,to,amount,note}, payments with {id,date,amount,method,note}, ...).
// These helpers translate real API responses into that shape so every screen
// keeps working against real data without a full UI rewrite.
export const mapWorkerFromApi = (w) => ({
  id: w.id,
  name: w.fullName,
  mobileNumber: w.mobileNumber || '',
  joiningDate: w.joiningDate,
  dailyWage: w.dailyWage,
  role: w.role,
  advance: w.advance || 0,
  bonus: w.bonus || 0,
  lastUpdatedAt: w.lastUpdatedAt,
  isActive: w.isActive,
  projectId: w.projectId,
  attendance: Object.fromEntries(
    Object.entries(w.attendance || {}).map(([dateStr, rec]) => [dateStr, { status: rec.status }])
  ),
  wageOverrides: (w.wageOverrides || []).map(o => ({
    id: o.overrideId,
    from: o.effectiveFrom,
    to: o.effectiveTo,
    amount: o.dailyWageAmount,
    note: o.note || '',
  })),
  payments: (w.payments || []).map(p => ({
    id: p.paymentId,
    date: p.paymentDate,
    amount: p.amount,
    method: p.paymentMethod,
    note: p.note || '',
  })),
  advancePayments: (w.advancePayments || []).map(a => ({
    id: a.advanceId,
    date: a.advanceDate,
    amount: a.amount,
    method: a.paymentMethod,
    note: a.note || '',
  })),
  bonusPayments: (w.bonusPayments || []).map(b => ({
    id: b.bonusId,
    date: b.bonusDate,
    amount: b.amount,
    method: b.paymentMethod,
    note: b.note || '',
  })),
});

export const mapProjectFromApi = (p) => ({
  id: p.id,
  name: p.projectName ?? 'Unnamed Project',
  address: p.projectAddress,
  workersCount: p.workerCount || 0,
  presentCount: p.presentToday || 0,
  totalDue: p.totalDue || 0,
  employees: (p.employees || []).map(mapWorkerFromApi),
  lastModifiedAt: p.lastModifiedAt,
  isActive: p.isActive,
});

export const formatSiteName = (name) => {
  if (!name) return '';
  return name.length > 11 ? `${name.substring(0, 11)}..` : name;
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

export const formatLargeDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

export const formatShortDayLabel = (dateString) => {
    if (!dateString) return '';
    const todayStr = toLocalISODate(new Date());
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;
    const dayMonth = parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return dateString === todayStr ? `Today, ${dayMonth}` : dayMonth;
  };

export const getEffectiveWage = (worker, dateStr) => {
    const base = worker.dailyWage || 400;
    if (!worker.wageOverrides || worker.wageOverrides.length === 0) return base;
    let amount = base;
    worker.wageOverrides.forEach(ov => {
      const afterFrom = !ov.from || dateStr >= ov.from;
      const beforeTo = !ov.to || dateStr <= ov.to;
      if (afterFrom && beforeTo) amount = ov.amount;
    });
    return amount;
  };

export const isWageRangeAlreadyAtAmount = (worker, range, amount) => {
    if (!worker || !range) return false;
    const { from, to } = range;
    const withinRange = (d) => (!from || d >= from) && (!to || d <= to);
    const candidateDates = new Set();
    if (from) candidateDates.add(from);
    if (to) candidateDates.add(to);
    (worker.wageOverrides || []).forEach(ov => {
      if (ov.from && withinRange(ov.from)) candidateDates.add(ov.from);
      if (ov.to && withinRange(ov.to)) candidateDates.add(ov.to);
    });
    if (candidateDates.size === 0) return false;
    return Array.from(candidateDates).every(d => getEffectiveWage(worker, d) === amount);
  };

export const calculateNetDaily = (baseWage, status) => {
    let multiplier = 1;
    if (status === 'HD') multiplier = 0.5;
    if (status === 'A') multiplier = 0;
    return Math.round(baseWage * multiplier);
  };

export const getPaymentStartDate = (worker) => worker.paymentStartDate || worker.joiningDate || '2026-07-01';

  // Most recent date (YYYY-MM-DD) attendance was marked for this worker, or null if none
  // has ever been recorded. Used for the Deactive list's "Last Date" column and for the
  // "Last Day" card on the Deactive Employee Details screen.
export const getLastAttendanceDate = (worker) => {
    const dates = Object.keys(worker?.attendance || {});
    if (dates.length === 0) return null;
    return dates.reduce((latest, d) => (d > latest ? d : latest), dates[0]);
  };

export const calcWageForDateRange = (worker, fromDate, toDate) => {
    const startBound = getPaymentStartDate(worker);
    let total = 0;
    Object.entries(worker.attendance || {}).forEach(([dateStr, record]) => {
      if (dateStr < startBound) return;
      if (fromDate && dateStr < fromDate) return;
      if (toDate && dateStr > toDate) return;
      const wage = getEffectiveWage(worker, dateStr);
      total += calculateNetDaily(wage, record.status);
    });
    return total;
  };

export const calcTotalWageAllTime = (worker) => calcWageForDateRange(worker, null, null);

export const calcPaidInRange = (worker, fromDate, toDate) => {
    return (worker.payments || []).reduce((sum, p) => {
      if (fromDate && p.date < fromDate) return sum;
      if (toDate && p.date > toDate) return sum;
      return sum + (p.amount || 0);
    }, 0);
  };

export const calcTotalPaid = (worker) => calcPaidInRange(worker, null, null);

export const calcTotalDue = (worker) => calcTotalWageAllTime(worker) + - (worker.advance || 0) - calcTotalPaid(worker);

export const calcCarryForward = (worker, fromDate) => {
    if (!fromDate) return 0;
    const startBound = getPaymentStartDate(worker);
    
    const parts = fromDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const cutoff = `${yyyy}-${mm}-${dd}`;
    
    if (cutoff < startBound) return 0;
    
    const wageBefore = calcWageForDateRange(worker, startBound, cutoff);
    const paidBefore = calcPaidInRange(worker, null, cutoff);
    
    return wageBefore - paidBefore;
  };

export const calcPaymentDueForRange = (worker, fromDate, toDate) => calcCarryForward(worker, fromDate) + calcWageForDateRange(worker, fromDate, toDate);

export const computeProjectTotalDue = (project) => (project.employees || []).reduce((sum, w) => sum + calcTotalDue(w), 0);

  // Deactive project card metrics - deliberately built from the simple cumulative fields
  // already kept per-employee (payments list + running advance/bonus totals) rather than
  // re-deriving from attendance, since those are what "Amount Paid", "Advance Paid" and
  // "Bonus Paid" already mean everywhere else in the app.
export const computeProjectTotalWages = (project) => (project.employees || []).reduce((sum, w) => {
    const amountPaid = (w.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const advancePaid = w.advance || 0;
    return sum + amountPaid + advancePaid;
  }, 0);

export const computeProjectTotalBonus = (project) => (project.employees || []).reduce((sum, w) => sum + (w.bonus || 0), 0);

export const computeProjectLastAttendanceDate = (project) => {
    let latest = null;
    (project.employees || []).forEach(w => {
      Object.keys(w.attendance || {}).forEach(dateStr => {
        if (!latest || dateStr > latest) latest = dateStr;
      });
    });
    return latest;
  };
