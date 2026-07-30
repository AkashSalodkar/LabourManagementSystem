import React, { useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';
import { toLocalISODate, formatLargeDateHeader, formatSelectedDatesLabel, getEarliestJoiningDate, getSavedAttendanceDatesSet } from '../../utils/dateHelpers';
import { getEffectiveWage, calculateNetDaily } from '../../utils/calculations';

const AttendanceScreen = ({ projectId, onBack, projects, setProjects }) => {
  const { t } = useLanguage();
  const currentProject = projects.find(p => p.id === projectId);
  
  const [selectedAttendanceDates, setSelectedAttendanceDates] = useState([]);
  const [pendingAttendanceByDate, setPendingAttendanceByDate] = useState({});
  const [attendanceWorkerSearchQuery, setAttendanceWorkerSearchQuery] = useState('');
  const [currentAttendanceDateIndex, setCurrentAttendanceDateIndex] = useState(0);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date());
  const [tempCalendarDates, setTempCalendarDates] = useState([]);
  const [isMaxDatesPopupOpen, setIsMaxDatesPopupOpen] = useState(false);
  const [isAttendanceSavedPopupOpen, setIsAttendanceSavedPopupOpen] = useState(false);
  const [trackerWorkerId, setTrackerWorkerId] = useState(null);
  const [trackerCalendarMonth, setTrackerCalendarMonth] = useState(new Date());
  const [isEditWageModalOpen, setIsEditWageModalOpen] = useState(false);
  const [editWageTargetWorkerId, setEditWageTargetWorkerId] = useState(null);
  const [editWageApplyTo, setEditWageApplyTo] = useState('only');
  const [editWageTodayDate, setEditWageTodayDate] = useState(toLocalISODate(new Date()));
  const [editWagePastEndDate, setEditWagePastEndDate] = useState('');
  const [editWageSpecificStart, setEditWageSpecificStart] = useState('');
  const [editWageSpecificEnd, setEditWageSpecificEnd] = useState('');
  const [editWageFutureStart, setEditWageFutureStart] = useState('');
  const [editWageNewAmount, setEditWageNewAmount] = useState('');
  const [editWageNote, setEditWageNote] = useState('');
  const [isSameWagePopupOpen, setIsSameWagePopupOpen] = useState(false);
  const [unmarkConfirmDate, setUnmarkConfirmDate] = useState(null);
  const [isBeforeJoiningPopupOpen, setIsBeforeJoiningPopupOpen] = useState(false);
  const calendarClickTimerRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(toLocalISODate(new Date()));

  if (!currentProject) return null;

  const formatSiteName = (name) => {
    if (!name) return '';
    return name.length > 11 ? `${name.substring(0, 11)}..` : name;
  };

  // Ensure attendance date is loaded
  const ensureAttendanceDateLoaded = (project, dateStr) => {
    setPendingAttendanceByDate(prev => {
      if (prev[dateStr]) return prev;
      const seeded = {};
      project.employees.forEach(emp => {
        const currentRecord = emp.attendance?.[dateStr] || {};
        seeded[emp.id] = { status: currentRecord.status || '' };
      });
      return { ...prev, [dateStr]: seeded };
    });
  };

  // Navigation
  const goToPreviousAttendanceDate = () => {
    setCurrentAttendanceDateIndex(idx => Math.max(0, idx - 1));
  };
  const goToNextAttendanceDate = () => {
    setCurrentAttendanceDateIndex(idx => Math.min(selectedAttendanceDates.length - 1, idx + 1));
  };

  // Calendar functions
  const openAttendanceCalendarPicker = () => {
    setTempCalendarDates(selectedAttendanceDates);
    const anchor = selectedAttendanceDates.length > 0
      ? new Date(selectedAttendanceDates[selectedAttendanceDates.length - 1])
      : new Date();
    setCalendarViewMonth(anchor);
    setIsCalendarPickerOpen(true);
  };

  const toggleCalendarDateSelection = (dateStr) => {
    setTempCalendarDates(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      if (prev.length >= 31) {
        setIsMaxDatesPopupOpen(true);
        return prev;
      }
      return [...prev, dateStr].sort();
    });
  };

  const handleCalendarDayClick = (dateStr, isDisabled, isAlreadySaved) => {
    if (isDisabled) return;
    if (calendarClickTimerRef.current) {
      clearTimeout(calendarClickTimerRef.current);
      calendarClickTimerRef.current = null;
      if (isAlreadySaved) setUnmarkConfirmDate(dateStr);
      return;
    }
    calendarClickTimerRef.current = setTimeout(() => {
      calendarClickTimerRef.current = null;
      toggleCalendarDateSelection(dateStr);
    }, 280);
  };

  const handleCalendarClear = () => setTempCalendarDates([]);
  const handleCalendarCancel = () => {
    setTempCalendarDates(selectedAttendanceDates);
    setIsCalendarPickerOpen(false);
  };

  const handleCalendarSet = () => {
    setSelectedAttendanceDates(tempCalendarDates);
    tempCalendarDates.forEach(dateStr => ensureAttendanceDateLoaded(currentProject, dateStr));
    setCurrentAttendanceDateIndex(0);
    setIsCalendarPickerOpen(false);
  };

  // Bulk attendance
  const handleBulkAttendanceChange = (statusValue) => {
    if (selectedAttendanceDates.length === 0) {
      alert("Select date from the calendar to mark attendance.");
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const query = attendanceWorkerSearchQuery.trim().toLowerCase();
    const targets = query
      ? currentProject.employees.filter(w => w.name.toLowerCase().includes(query))
      : currentProject.employees;
    
    setPendingAttendanceByDate(prev => {
      const updatedMap = { ...(prev[dateStr] || {}) };
      targets.forEach(worker => {
        const joinDateStr = worker.joiningDate || '2026-07-01';
        if (dateStr >= joinDateStr) {
          updatedMap[worker.id] = { status: statusValue };
        }
      });
      return { ...prev, [dateStr]: updatedMap };
    });
  };

  // Individual attendance
  const handleIndividualAttendanceChange = (workerId, statusValue) => {
    if (selectedAttendanceDates.length === 0) {
      alert("Select date from the calendar to mark attendance.");
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const worker = currentProject.employees.find(w => w.id === workerId);
    const joinDateStr = worker?.joiningDate || '2026-07-01';
    if (dateStr < joinDateStr) {
      setIsBeforeJoiningPopupOpen(true);
      return;
    }
    setPendingAttendanceByDate(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [workerId]: { status: statusValue } }
    }));
  };

  // Save attendance
  const handleSaveAttendanceData = () => {
    if (selectedAttendanceDates.length === 0) {
      alert("Select date from the calendar to mark attendance.");
      return;
    }

    const hasUnmarkedWorkers = selectedAttendanceDates.some(dateStr => {
      const dateRecord = pendingAttendanceByDate[dateStr] || {};
      return (currentProject.employees || [])
        .filter(emp => dateStr >= (emp.joiningDate || '2026-07-01'))
        .some(emp => {
          const record = dateRecord[emp.id];
          return !record || !record.status;
        });
    });

    if (hasUnmarkedWorkers) {
      alert("Please mark attendance for all workers for all the selected dates before saving.");
      return;
    }

    const todayStr = toLocalISODate(new Date());
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== projectId) return project;
        const updatedEmployees = project.employees.map(emp => {
          let mergedAttendance = { ...(emp.attendance || {}) };
          Object.entries(pendingAttendanceByDate).forEach(([dateStr, recordsForDate]) => {
            const rec = recordsForDate[emp.id];
            if (rec && rec.status) mergedAttendance[dateStr] = { status: rec.status };
          });
          return { ...emp, attendance: mergedAttendance };
        });
        const presentCountToday = updatedEmployees.filter(emp => {
          const rec = emp.attendance[todayStr];
          return rec && (rec.status === 'P' || rec.status === 'HD');
        }).length;
        return { ...project, presentCount: presentCountToday, employees: updatedEmployees, lastModifiedAt: Date.now() };
      })
    );

    setSelectedAttendanceDates([]);
    setTempCalendarDates([]);
    setIsAttendanceSavedPopupOpen(true);
  };

  // Confirm unmark
  const handleConfirmUnmarkDate = () => {
    const dateStr = unmarkConfirmDate;
    if (!dateStr) return;
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== projectId) return project;
        const updatedEmployees = project.employees.map(emp => {
          if (!emp.attendance || !emp.attendance[dateStr]) return emp;
          const updatedAttendance = { ...emp.attendance };
          delete updatedAttendance[dateStr];
          return { ...emp, attendance: updatedAttendance };
        });
        return { ...project, employees: updatedEmployees, lastModifiedAt: Date.now() };
      })
    );
    setTempCalendarDates(prev => prev.filter(d => d !== dateStr));
    setSelectedAttendanceDates(prev => {
      const updated = prev.filter(d => d !== dateStr);
      setCurrentAttendanceDateIndex(idx => Math.min(idx, Math.max(0, updated.length - 1)));
      return updated;
    });
    setPendingAttendanceByDate(prev => {
      const updated = { ...prev };
      delete updated[dateStr];
      return updated;
    });
    setUnmarkConfirmDate(null);
  };

  // Edit Wage
  const handleOpenEditWage = (worker) => {
    setEditWageTargetWorkerId(worker.id);
    setEditWageApplyTo('only');
    setEditWageTodayDate(toLocalISODate(new Date()));
    setEditWagePastEndDate('');
    setEditWageSpecificStart('');
    setEditWageSpecificEnd('');
    setEditWageFutureStart('');
    setEditWageNewAmount('');
    setEditWageNote('');
    setIsEditWageModalOpen(true);
  };

  const handleCloseEditWage = () => {
    setIsEditWageModalOpen(false);
    setEditWageTargetWorkerId(null);
  };

  const isWageRangeAlreadyAtAmount = (worker, range, amount) => {
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

  const handleSaveEditWage = () => {
    const amount = parseFloat(editWageNewAmount);
    if (!amount || amount <= 0) { alert("Please enter a valid wage amount."); return; }

    const wageTargetWorker = currentProject.employees.find(w => w.id === editWageTargetWorkerId);
    const joinDateStrForWage = wageTargetWorker?.joiningDate || '2026-07-01';
    const clampToJoinDate = (dateStr) => (dateStr && dateStr < joinDateStrForWage) ? joinDateStrForWage : dateStr;

    let range = { from: selectedDate, to: selectedDate };
    if (editWageApplyTo === 'only') {
      const todayApplyDate = editWageTodayDate || selectedDate;
      range = { from: todayApplyDate, to: todayApplyDate };
    } else if (editWageApplyTo === 'past') {
      range = { from: null, to: editWagePastEndDate || selectedDate };
    } else if (editWageApplyTo === 'specific') {
      if (!editWageSpecificStart || !editWageSpecificEnd) { alert("Please select both dates for the specific duration."); return; }
      range = { from: clampToJoinDate(editWageSpecificStart), to: editWageSpecificEnd };
    } else if (editWageApplyTo === 'future') {
      range = { from: clampToJoinDate(editWageFutureStart || selectedDate), to: null };
    }

    if (wageTargetWorker) {
      if (isWageRangeAlreadyAtAmount(wageTargetWorker, range, amount)) {
        setIsSameWagePopupOpen(true);
        return;
      }
    }

    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          lastModifiedAt: Date.now(),
          employees: project.employees.map(emp => {
            if (emp.id !== editWageTargetWorkerId) return emp;
            const newOverride = { ...range, amount, note: editWageNote.trim() };
            return { ...emp, wageOverrides: [...(emp.wageOverrides || []), newOverride], lastUpdatedAt: Date.now() };
          })
        };
      })
    );
    handleCloseEditWage();
    alert("Wage updated successfully.");
  };

  // Muster Card (Attendance Tracker)
  const statusColors = {
    P: { bg: '#DCFCE7', text: '#15803D' },
    A: { bg: '#FEE2E2', text: '#DC2626' },
    HD: { bg: '#F1F5F9', text: '#475569' },
  };

  // Get current display date
  const safeDateIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
  const currentDisplayedDate = selectedAttendanceDates.length > 0
    ? selectedAttendanceDates[safeDateIndex]
    : null;

  const earliestAllowedDate = getEarliestJoiningDate(currentProject);
  const savedAttendanceDatesSet = getSavedAttendanceDatesSet(currentProject);
  const todayIsoDate = toLocalISODate(new Date());

  // Filter workers for the current date
  const eligibilityFilterDate = currentDisplayedDate || toLocalISODate(new Date());
  const sortedByName = [...(currentProject.employees || [])].sort((a, b) => a.name.localeCompare(b.name));
  const filteredAttendanceEmployees = sortedByName
    .filter(worker => worker.name.toLowerCase().includes(attendanceWorkerSearchQuery.toLowerCase()))
    .filter(worker => eligibilityFilterDate >= (worker.joiningDate || '2026-07-01'));

  // Calculate estimated payout
  let estPayout = 0;
  selectedAttendanceDates.forEach(dateStr => {
    const dateRecord = pendingAttendanceByDate[dateStr] || {};
    (currentProject.employees || []).forEach(worker => {
      if (dateStr < (worker.joiningDate || '2026-07-01')) return;
      const record = dateRecord[worker.id];
      if (record && record.status) {
        const wage = getEffectiveWage(worker, dateStr);
        estPayout += calculateNetDaily(wage, record.status);
      }
    });
  });

  const primaryDateAttendance = currentDisplayedDate
    ? (pendingAttendanceByDate[currentDisplayedDate] || {})
    : {};

  const bgColors = ['#0070F3', '#10B981', '#7C3AED', '#F59E0B', '#EF4444'];

  // Render Muster Card
  const renderMusterCard = () => {
    if (!trackerWorkerId) return null;
    const trackerWorker = currentProject.employees.find(w => w.id === trackerWorkerId);
    if (!trackerWorker) return null;

    const joiningDateStr = trackerWorker.joiningDate || '2026-07-01';
    let totalPresent = 0, totalHalfDay = 0, totalAbsent = 0;
    Object.entries(trackerWorker.attendance || {}).forEach(([dateStr, record]) => {
      if (dateStr < joiningDateStr) return;
      if (record.status === 'P') totalPresent++;
      else if (record.status === 'HD') totalHalfDay++;
      else if (record.status === 'A') totalAbsent++;
    });

    const trackerYear = trackerCalendarMonth.getFullYear();
    const trackerMonth = trackerCalendarMonth.getMonth();
    const trackerFirstWeekday = new Date(trackerYear, trackerMonth, 1).getDay();
    const trackerDaysInMonth = new Date(trackerYear, trackerMonth + 1, 0).getDate();
    const trackerCells = [];
    for (let i = 0; i < trackerFirstWeekday; i++) trackerCells.push(null);
    for (let d = 1; d <= trackerDaysInMonth; d++) trackerCells.push(d);
    const trackerRows = [];
    for (let i = 0; i < trackerCells.length; i += 7) trackerRows.push(trackerCells.slice(i, i + 7));

    const joinYear = parseInt(joiningDateStr.slice(0, 4), 10);
    const joinMonth = parseInt(joiningDateStr.slice(5, 7), 10) - 1;
    const isAtEarliestMonth = trackerYear === joinYear && trackerMonth === joinMonth;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f4f6f9', zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button onClick={() => setTrackerWorkerId(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Muster Card</h2>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px', border: '1px solid #F1F5F9' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{trackerWorker.name}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
              Joined {new Date(joiningDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10B981' }}>{totalPresent}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>Total Present</p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#64748B' }}>{totalHalfDay}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>Total Half Day</p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#EF4444' }}>{totalAbsent}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>Total Absent</p>
            </div>
          </div>
          <p style={{ margin: '0 0 14px 0', fontSize: '10px', color: '#94A3B8', textAlign: 'center' }}>From date of joining</p>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <button onClick={() => setTrackerCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} disabled={isAtEarliestMonth} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '4px 10px' }}>‹</button>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{trackerCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setTrackerCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {trackerRows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {row.map((dayNum, ci) => {
                  if (!dayNum) return <div key={ci} />;
                  const dateStr = `${trackerYear}-${String(trackerMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const beforeJoining = dateStr < joiningDateStr;
                  const record = trackerWorker.attendance?.[dateStr];
                  const status = record?.status;
                  const colors = !beforeJoining && status ? statusColors[status] : null;
                  return (
                    <div key={ci} style={{
                      textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '8px',
                      fontSize: '13px', fontWeight: colors ? '700' : '500',
                      color: beforeJoining ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                      backgroundColor: colors ? colors.bg : 'transparent'
                    }}>
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Half Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f4f6f9', zIndex: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0 }}>‹</button>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatSiteName(currentProject.name)}
          </span>
        </div>

        <h2 style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '17px', fontWeight: '700', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          Attendance
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              openAttendanceCalendarPicker();
            }} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              cursor: 'pointer', 
              flexShrink: 0, 
              gap: '2px',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '22px', lineHeight: 1, pointerEvents: 'none', display: 'block' }}>📅</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              Select Date
            </span>
          </div>
        </div>
      </div>

      {/* Selected date header */}
      {currentDisplayedDate && (
        <div style={{ padding: '14px 16px 4px 16px', backgroundColor: '#ffffff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          {selectedAttendanceDates.length > 1 && (
            <button onClick={goToPreviousAttendanceDate} disabled={safeDateIndex === 0} style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              border: 'none', fontSize: '20px', fontWeight: '700', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: safeDateIndex === 0 ? '#E2E8F0' : '#0B3C9B',
              color: safeDateIndex === 0 ? '#94A3B8' : '#ffffff',
              cursor: safeDateIndex === 0 ? 'default' : 'pointer',
              boxShadow: safeDateIndex === 0 ? 'none' : '0 2px 6px rgba(11, 60, 155, 0.35)'
            }}>‹</button>
          )}
          <span style={{
            fontSize: '17px', fontWeight: '700', color: '#0B3C9B', whiteSpace: 'nowrap',
            backgroundColor: '#EFF6FF', padding: '6px 14px', borderRadius: '20px'
          }}>
            {formatLargeDateHeader(currentDisplayedDate)}
          </span>
          {selectedAttendanceDates.length > 1 && (
            <button onClick={goToNextAttendanceDate} disabled={safeDateIndex === selectedAttendanceDates.length - 1} style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              border: 'none', fontSize: '20px', fontWeight: '700', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: safeDateIndex === selectedAttendanceDates.length - 1 ? '#E2E8F0' : '#0B3C9B',
              color: safeDateIndex === selectedAttendanceDates.length - 1 ? '#94A3B8' : '#ffffff',
              cursor: safeDateIndex === selectedAttendanceDates.length - 1 ? 'default' : 'pointer',
              boxShadow: safeDateIndex === selectedAttendanceDates.length - 1 ? 'none' : '0 2px 6px rgba(11, 60, 155, 0.35)'
            }}>›</button>
          )}
        </div>
      )}

      {/* Bulk mark */}
      <div style={{ padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Bulk mark:</span>
          <button onClick={() => handleBulkAttendanceChange('P')} style={{ backgroundColor: '#10B981', color: '#ffffff', border: 'none', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>All Present</button>
          <button onClick={() => handleBulkAttendanceChange('A')} style={{ backgroundColor: '#EF4444', color: '#ffffff', border: 'none', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>All Absent</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
          <input type="text" placeholder="Enter Employee Name" value={attendanceWorkerSearchQuery} onChange={(e) => setAttendanceWorkerSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 36px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }} />
          {attendanceWorkerSearchQuery && (
            <button onClick={() => setAttendanceWorkerSearchQuery('')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          )}
        </div>
      </div>

      {/* Worker list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 16px' }}>
        {filteredAttendanceEmployees.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAttendanceEmployees.map((worker) => {
              const record = primaryDateAttendance[worker.id] || { status: '' };
              const effectiveWage = getEffectiveWage(worker, currentDisplayedDate || toLocalISODate(new Date()));
              const joinDateStrForWorker = worker.joiningDate || '2026-07-01';
              const isBeforeJoining = !!currentDisplayedDate && currentDisplayedDate < joinDateStrForWorker;
              const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
              const assignedBg = bgColors[worker.id % bgColors.length];

              return (
                <div key={worker.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: assignedBg, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{worker.name}</h5>
                        <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748B' }}>{`₹${effectiveWage}/day`}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <button onClick={() => handleOpenEditWage(worker)} style={{ backgroundColor: '#EFF6FF', color: '#0B3C9B', border: 'none', padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>✏️ Wage</button>
                    </div>
                    <button onClick={() => { setTrackerWorkerId(worker.id); setTrackerCalendarMonth(new Date()); }} style={{ backgroundColor: '#FACC15', color: '#713F12', border: 'none', padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      Muster Card ›
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[{ key: 'P', label: 'Present', color: '#10B981' }, { key: 'HD', label: 'Half', color: '#F59E0B' }, { key: 'A', label: 'Absent', color: '#EF4444' }].map((opt) => {
                      const isActive = record.status === opt.key;
                      return (
                        <button key={opt.key} onClick={() => {
                          if (isBeforeJoining) {
                            setIsBeforeJoiningPopupOpen(true);
                            return;
                          }
                          handleIndividualAttendanceChange(worker.id, opt.key);
                        }} style={{
                          flex: 1, border: isActive && !isBeforeJoining ? `1.5px solid ${opt.color}` : '1px solid #E2E8F0', padding: '6px 4px', borderRadius: '7px', fontSize: '11px', fontWeight: '700',
                          backgroundColor: isBeforeJoining ? '#F1F5F9' : (isActive ? `${opt.color}1A` : '#F8FAFC'),
                          color: isBeforeJoining ? '#CBD5E1' : (isActive ? opt.color : '#94A3B8'),
                          cursor: isBeforeJoining ? 'not-allowed' : 'pointer'
                        }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '30px' }}>
            {attendanceWorkerSearchQuery ? `No workforce entries match "${attendanceWorkerSearchQuery}".` : 'No employees had joined this project as of the selected date.'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Est. Payout</span>
          <span style={{ fontSize: '18px', color: '#0B3C9B', fontWeight: '700' }}>₹{estPayout.toLocaleString('en-IN')}</span>
        </div>
        <button onClick={handleSaveAttendanceData} style={{ width: '100%', minHeight: '48px', padding: '14px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0 }}>
          Save Attendance
        </button>
      </div>

      {/* Modals and Popups */}
      {renderMusterCard()}

      {isAttendanceSavedPopupOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto' }}>✓</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>Attendance Saved Successfully.</h3>
            <button onClick={() => setIsAttendanceSavedPopupOpen(false)} style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {isBeforeJoiningPopupOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>Attendance cannot be marked before the joining date</h3>
            <button onClick={() => setIsBeforeJoiningPopupOpen(false)} style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {isSameWagePopupOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>The new wage must be different from the current wage.</h3>
            <button onClick={() => setIsSameWagePopupOpen(false)} style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {/* Calendar Picker */}
      {isCalendarPickerOpen && (() => {
        const year = calendarViewMonth.getFullYear();
        const month = calendarViewMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        const rows = [];
        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

        const headerLabel = tempCalendarDates.length === 0 ? 'Select date(s)' : tempCalendarDates.length === 1 ? new Date(tempCalendarDates[0]).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : `${tempCalendarDates.length} dates selected`;
        console.log('Calendar Picker State:', { 
          isCalendarPickerOpen, 
          tempCalendarDates, 
          selectedAttendanceDates 
        });
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ backgroundColor: '#0F766E', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                <div style={{ fontSize: '21px', fontWeight: '700' }}>{headerLabel}</div>
              </div>
              <div style={{ padding: '16px 18px 4px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <button onClick={() => setCalendarViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>‹</button>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{calendarViewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setCalendarViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>
                {rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {row.map((dayNum, ci) => {
                      if (!dayNum) return <div key={ci} />;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isDisabled = dateStr < earliestAllowedDate || dateStr > todayIsoDate;
                      const isSelected = tempCalendarDates.includes(dateStr);
                      const isSaved = savedAttendanceDatesSet.has(dateStr);
                      return (
                        <div key={ci} onClick={() => handleCalendarDayClick(dateStr, isDisabled, isSaved)} style={{
                          textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '50%',
                          fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                          cursor: isDisabled ? 'default' : 'pointer',
                          color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : (isSaved ? '#15803D' : '#1E293B')),
                          backgroundColor: isSelected ? '#0F766E' : (isSaved ? '#DCFCE7' : 'transparent')
                        }}>
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', marginBottom: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Attendance already marked — tap to view/edit, double-tap to remove</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '22px', padding: '12px 20px 18px 20px' }}>
                <button onClick={handleCalendarClear} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>CLEAR</button>
                <button onClick={handleCalendarCancel} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>CANCEL</button>
                <button onClick={handleCalendarSet} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>SET</button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Max 31 Days Popup */}
      {isMaxDatesPopupOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px 22px', width: '82%', maxWidth: '300px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', margin: '0 0 16px 0' }}>Max 31 Days attendance at a time.</p>
            <button onClick={() => setIsMaxDatesPopupOpen(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {/* Unmark Confirmation */}
      {unmarkConfirmDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px 22px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>Remove attendance?</h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 18px 0' }}>
              This will unmark attendance for {formatSelectedDatesLabel([unmarkConfirmDate])} for every worker in this project.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setUnmarkConfirmDate(null)} style={{ flex: 1, padding: '11px', backgroundColor: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmUnmarkDate} style={{ flex: 1, padding: '11px', backgroundColor: '#EF4444', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Wage Modal */}
      {isEditWageModalOpen && (() => {
        const targetWorker = currentProject.employees.find(w => w.id === editWageTargetWorkerId);
        if (!targetWorker) return null;
        const editWageJoinDateStr = targetWorker.joiningDate || '2026-07-01';
        const laterOfDates = (a, b) => (a && b) ? (a > b ? a : b) : (a || b);
        const isEditWageAmountValid = !!editWageNewAmount && parseFloat(editWageNewAmount) > 0;
        const isEditWageDateValid = editWageApplyTo === 'only' ? !!editWageTodayDate : editWageApplyTo === 'past' ? !!editWagePastEndDate : editWageApplyTo === 'specific' ? (!!editWageSpecificStart && !!editWageSpecificEnd) : editWageApplyTo === 'future' ? !!editWageFutureStart : false;
        const editWageEffectiveRangeForCheck = editWageApplyTo === 'only' ? { from: (editWageTodayDate || selectedDate), to: (editWageTodayDate || selectedDate) } : editWageApplyTo === 'past' ? { from: null, to: (editWagePastEndDate || selectedDate) } : editWageApplyTo === 'specific' ? { from: editWageSpecificStart, to: editWageSpecificEnd } : editWageApplyTo === 'future' ? { from: (editWageFutureStart || selectedDate), to: null } : { from: selectedDate, to: selectedDate };
        const isEditWageSameAsCurrent = isEditWageAmountValid && isEditWageDateValid && isWageRangeAlreadyAtAmount(targetWorker, editWageEffectiveRangeForCheck, parseFloat(editWageNewAmount));
        const isEditWageSaveEnabled = isEditWageAmountValid && isEditWageDateValid && !isEditWageSameAsCurrent;

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1900, padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 20px 0 20px', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>Edit wage · {targetWorker.name}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Change wage for this worker and choose when it applies</p>
                </div>
                <button onClick={handleCloseEditWage} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 20px 20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Apply to</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[{ key: 'only', label: 'Today' }, { key: 'past', label: 'Past days' }, { key: 'specific', label: 'Specific duration' }, { key: 'future', label: 'Onwards This Day' }].map(opt => (
                    <button key={opt.key} type="button" onClick={() => { setEditWageApplyTo(opt.key); if (opt.key === 'only' && !editWageTodayDate) { setEditWageTodayDate(toLocalISODate(new Date())); } }} style={{ padding: '12px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center', cursor: 'pointer', border: editWageApplyTo === opt.key ? '2px solid #0B3C9B' : '1px solid #CBD5E1', backgroundColor: editWageApplyTo === opt.key ? '#EFF6FF' : '#ffffff', color: editWageApplyTo === opt.key ? '#0B3C9B' : '#1E293B' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {editWageApplyTo === 'only' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>APPLIES UP TO</label>
                    <input type="date" value={editWageTodayDate} min={laterOfDates(toLocalISODate(new Date()), editWageJoinDateStr)} max={selectedDate} onChange={(e) => setEditWageTodayDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                  </div>
                )}
                {editWageApplyTo === 'past' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>APPLIES UP TO</label>
                    <input type="date" value={editWagePastEndDate} min={editWageJoinDateStr} max={selectedDate} onChange={(e) => setEditWagePastEndDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                  </div>
                )}
                {editWageApplyTo === 'specific' && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>FROM</label>
                      <input type="date" value={editWageSpecificStart} min={editWageJoinDateStr} max={toLocalISODate(new Date())} onChange={(e) => setEditWageSpecificStart(e.target.value)} style={{ width: '100%', padding: '12px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>TO</label>
                      <input type="date" value={editWageSpecificEnd} min={laterOfDates(editWageSpecificStart, editWageJoinDateStr)} onChange={(e) => setEditWageSpecificEnd(e.target.value)} style={{ width: '100%', padding: '12px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                    </div>
                  </div>
                )}
                {editWageApplyTo === 'future' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>APPLIES FROM</label>
                    <input type="date" value={editWageFutureStart} min={editWageJoinDateStr} onChange={(e) => setEditWageFutureStart(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                  </div>
                )}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>NEW DAILY WAGE</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
                    <span style={{ marginRight: '8px', fontWeight: '600', color: '#475569' }}>₹</span>
                    <input type="number" placeholder="e.g. 550" value={editWageNewAmount} onChange={(e) => setEditWageNewAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600' }} />
                  </div>
                  {isEditWageSameAsCurrent && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#DC2626', fontWeight: '600' }}>The new wage must be different from the current wage.</p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>NOTE (OPTIONAL)</label>
                  <input type="text" placeholder="e.g. Skill upgrade, Overtime" value={editWageNote} onChange={(e) => setEditWageNote(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', padding: '14px 20px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
                <button type="button" onClick={handleCloseEditWage} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleSaveEditWage} disabled={!isEditWageSaveEnabled} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: isEditWageSaveEnabled ? '#0B3C9B' : '#94A3B8', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: isEditWageSaveEnabled ? 'pointer' : 'not-allowed', opacity: isEditWageSaveEnabled ? 1 : 0.6 }}>
                  Save wage
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceScreen;