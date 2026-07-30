import { jsPDF } from 'jspdf';
import { formatShortDayLabel } from './dateHelpers';
import { calculateNetDaily, getEffectiveWage } from './calculations';

export const generateWorkerStatement = async ({
  worker,
  project,
  fromDate,
  toDate,
  paymentDueForRange,
  paidInRange,
  balanceValue,
  paymentsInRange,
  advancePaymentsInRange,
  bonusPaymentsInRange,
  attendanceEntriesInRange,
  statusMeta,
}) => {
  const inr = (n) => `Rs. ${Math.abs(n).toLocaleString('en-IN')}`;

  if (!worker) {
    throw new Error('Employee data is missing.');
  }

  const totalPaidWithAdvances = paidInRange || 0;

  // Advance History
  const allAdvanceTransactionsTotal = (worker.advancePayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const initialAdvanceOnly = Math.max(0, (worker.advance || 0) - allAdvanceTransactionsTotal);

  let advanceRows = [];

  if (initialAdvanceOnly > 0) {
    advanceRows.push({
      date: worker.joiningDate ? formatShortDayLabel(worker.joiningDate) : 'Joining',
      mode: 'Initial Advance',
      amount: `-${inr(initialAdvanceOnly)}`,
      color: '#DC2626'
    });
  }

  if (advancePaymentsInRange && advancePaymentsInRange.length > 0) {
    advancePaymentsInRange.forEach(p => {
      advanceRows.push({
        date: formatShortDayLabel(p.date) || p.date || '-',
        mode: (p.method || '') + (p.note ? ` - ${p.note}` : ''),
        amount: `-${inr(p.amount || 0)}`,
        color: '#DC2626'
      });
    });
  }

  if (advanceRows.length === 0) {
    advanceRows = [{ date: '-', mode: 'No advances recorded', amount: 'Rs. 0', color: '#94A3B8' }];
  }

  // Payment rows
  const paymentRows = (paymentsInRange || []).length
    ? paymentsInRange.map(p => ({
        date: formatShortDayLabel(p.date) || p.date || '-',
        mode: (p.method || '') + (p.note ? ` - ${p.note}` : ''),
        amount: inr(p.amount || 0),
        color: '#1E293B'
      }))
    : [{ date: '-', mode: 'No wage payments recorded', amount: 'Rs. 0', color: '#94A3B8' }];

  // Bonus rows
  const allBonusTransactionsTotal = (worker.bonusPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const initialBonusOnly = Math.max(0, (worker.bonus || 0) - allBonusTransactionsTotal);

  let bonusRows = [];

  if (initialBonusOnly > 0) {
    bonusRows.push({
      date: worker.joiningDate ? formatShortDayLabel(worker.joiningDate) : 'Joining',
      mode: 'Initial Bonus',
      amount: `+${inr(initialBonusOnly)}`,
      color: '#10B981'
    });
  }

  if (bonusPaymentsInRange && bonusPaymentsInRange.length > 0) {
    bonusPaymentsInRange.forEach(p => {
      bonusRows.push({
        date: formatShortDayLabel(p.date) || p.date || '-',
        mode: (p.method || '') + (p.note ? ` - ${p.note}` : ''),
        amount: `+${inr(p.amount || 0)}`,
        color: '#10B981'
      });
    });
  }

  if (bonusRows.length === 0) {
    bonusRows = [{ date: '-', mode: 'No bonus recorded', amount: 'Rs. 0', color: '#94A3B8' }];
  }

  // Attendance rows
  const attendanceRows = (attendanceEntriesInRange || []).length
    ? attendanceEntriesInRange.map(([dateStr, record]) => {
        if (!dateStr || !record) {
          return { date: '-', mode: 'N/A', amount: 'Rs. 0', color: '#94A3B8' };
        }
        const meta = statusMeta?.[record.status] || statusMeta?.P || { label: 'Present', sub: 'Full day' };
        let wage = 0;
        try {
          wage = calculateNetDaily(getEffectiveWage(worker, dateStr), record.status);
        } catch (e) {
          wage = 0;
        }
        const isAbsent = record.status === 'A';
        return {
          date: formatShortDayLabel(dateStr) || dateStr || '-',
          mode: `${meta.label || 'Present'} (${meta.sub || 'Full day'})`,
          amount: isAbsent ? 'Rs. 0' : `+${inr(wage)}`,
          color: '#1E293B'
        };
      })
    : [{ date: '-', mode: 'No attendance marked', amount: 'Rs. 0', color: '#94A3B8' }];

  const sanitizedFileName = `${(worker.name || 'Employee').trim().replace(/\s+/g, '_')}.pdf`;

  try {
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF library not loaded');
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginX * 2;
    const bottomLimit = pageHeight - 44;
    let y = 54;

    const ensureSpace = (needed) => {
      if (y + needed > bottomLimit) { doc.addPage(); y = 54; }
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor('#1E293B');
    doc.text(worker.name || 'Employee', marginX, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#64748B');
    const periodText = fromDate && toDate
      ? `${formatShortDayLabel(fromDate) || fromDate} - ${formatShortDayLabel(toDate) || toDate}`
      : 'All time';
    doc.text(`${worker.role || 'Employee'}  |  ${project?.name || ''}  |  Statement period: ${periodText}`, marginX, y);
    y += 26;

    // Summary row
    const colWidth = contentWidth / 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor('#94A3B8');
    doc.text('TOTAL DUE', marginX, y);
    doc.text('PAID', marginX + colWidth, y);
    doc.text('BALANCE', marginX + colWidth * 2, y);
    y += 16;
    doc.setFontSize(14);
    doc.setTextColor('#0B3C9B');
    doc.text(inr(Math.max(0, paymentDueForRange || 0)), marginX, y);
    doc.setTextColor('#10B981');
    doc.text(inr(totalPaidWithAdvances || 0), marginX + colWidth, y);
    const balanceVal = (balanceValue !== undefined && balanceValue !== null) ? balanceValue : ((paymentDueForRange || 0) - totalPaidWithAdvances);
    const balanceColor = balanceVal > 0 ? '#DC2626' : balanceVal < 0 ? '#10B981' : '#1E293B';
    const balanceSuffix = balanceVal > 0 ? ' (due)' : balanceVal < 0 ? ' (credit)' : ' (settled)';
    doc.setTextColor(balanceColor);
    doc.text(inr(balanceVal) + balanceSuffix, marginX + colWidth * 2, y);
    y += 30;

    const addSection = (title, note, rows, emptyLabel) => {
      ensureSpace(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#334155');
      doc.text(title, marginX, y);
      y += 6;
      doc.setDrawColor('#CBD5E1');
      doc.line(marginX, y, marginX + contentWidth, y);
      y += 14;

      if (note) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#94A3B8');
        doc.text(note, marginX, y);
        y += 14;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor('#94A3B8');
      doc.text('DATE', marginX, y);
      doc.text('MODE', marginX + 110, y);
      doc.text('AMOUNT', marginX + contentWidth, y, { align: 'right' });
      y += 8;
      doc.setDrawColor('#F1F5F9');
      doc.line(marginX, y, marginX + contentWidth, y);
      y += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      if (!rows || rows.length === 0 || (rows.length === 1 && rows[0].mode === 'No advances recorded')) {
        doc.setTextColor('#94A3B8');
        doc.text(emptyLabel || 'No records found.', marginX, y);
        y += 16;
      } else {
        rows.forEach(row => {
          ensureSpace(16);
          doc.setTextColor('#1E293B');
          doc.text(String(row.date || '-'), marginX, y);
          doc.text(String(row.mode || ''), marginX + 110, y, { maxWidth: contentWidth - 190 });
          doc.setTextColor(row.color || '#1E293B');
          doc.text(String(row.amount || 'Rs. 0'), marginX + contentWidth, y, { align: 'right' });
          y += 16;
        });
      }
      y += 16;
    };

    addSection('Advance History', 'Deducted from wages owed.', advanceRows, 'No advance recorded.');
    addSection('Wage Payments', null, paymentRows, 'No wage payments recorded.');
    addSection('Bonus History', 'Extra payments - not part of the wage calculation above.', bonusRows, 'No bonus recorded.');
    addSection('Attendance Records', null, attendanceRows, 'No attendance marked.');

    const dataUrl = doc.output('datauristring');
    const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    return { pdfBase64, fileName: sanitizedFileName };

  } catch (err) {
    console.error('PDF generation failed:', err);
    throw err;
  }
};