export const calculateNetDaily = (baseWage, status) => {
  let multiplier = 1;
  if (status === 'HD') multiplier = 0.5;
  if (status === 'A') multiplier = 0;
  return Math.round(baseWage * multiplier);
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

export const getPaymentStartDate = (worker) => worker.paymentStartDate || worker.joiningDate || '2026-07-01';

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

export const calcPaidInRange = (worker, fromDate, toDate) => {
  return (worker.payments || []).reduce((sum, p) => {
    if (fromDate && p.date < fromDate) return sum;
    if (toDate && p.date > toDate) return sum;
    return sum + (p.amount || 0);
  }, 0);
};

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

export const calcPaymentDueForRange = (worker, fromDate, toDate) => {
  return calcCarryForward(worker, fromDate) + calcWageForDateRange(worker, fromDate, toDate);
};

export const computeProjectPresentToday = (project) => {
  const todayStr = toLocalISODate(new Date());
  return (project.employees || []).filter(w => {
    const rec = w.attendance?.[todayStr];
    return rec && (rec.status === 'P' || rec.status === 'HD');
  }).length;
};

export const computeProjectTotalDue = (project) => {
  return (project.employees || []).reduce((sum, w) => sum + calcTotalDue(w), 0);
};

export const calcTotalDue = (worker) => {
  const totalWage = calcWageForDateRange(worker, null, null);
  const totalPaid = calcPaidInRange(worker, null, null);
  return totalWage + (worker.bonus || 0) - (worker.advance || 0) - totalPaid;
};

export const computeProjectLastAttendanceDate = (project) => {
  let latest = null;
  (project.employees || []).forEach(w => {
    Object.keys(w.attendance || {}).forEach(dateStr => {
      if (!latest || dateStr > latest) latest = dateStr;
    });
  });
  return latest;
};