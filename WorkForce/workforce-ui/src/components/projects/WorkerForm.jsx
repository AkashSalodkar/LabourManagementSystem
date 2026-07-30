import React, { useState, useEffect } from 'react';
import { toLocalISODate } from '../../utils/dateHelpers';

const WorkerForm = ({
  isSubFormOpen,
  setIsSubFormOpen,
  workersList,
  setWorkersList,
  editingWorkerId,
  setEditingWorkerId,
  projectName,
  isAddProjectOpen,
}) => {
  const [tempWorkerName, setTempWorkerName] = useState('');
  const [tempWorkerPhone, setTempWorkerPhone] = useState('');
  const [tempWorkerJoiningDate, setTempWorkerJoiningDate] = useState('');
  const [tempWorkerWageAmount, setTempWorkerWageAmount] = useState('');
  const [tempWorkerAdvance, setTempWorkerAdvance] = useState('');
  const [tempWorkerBonus, setTempWorkerBonus] = useState('');

  const todayStr = toLocalISODate(new Date());

  useEffect(() => {
    if (isSubFormOpen && editingWorkerId) {
      const worker = workersList.find(w => w.id === editingWorkerId);
      if (worker) {
        setTempWorkerName(worker.name || '');
        setTempWorkerPhone(worker.mobileNumber || '');
        setTempWorkerJoiningDate(worker.joiningDate || '2026-07-01');
        setTempWorkerWageAmount(String(worker.dailyWage || '400'));
        setTempWorkerAdvance(worker.advance ? String(worker.advance) : '');
        setTempWorkerBonus(worker.bonus ? String(worker.bonus) : '');
      }
    }
  }, [isSubFormOpen, editingWorkerId, workersList]);

  const resetForm = () => {
    setTempWorkerName('');
    setTempWorkerPhone('');
    setTempWorkerJoiningDate('');
    setTempWorkerWageAmount('');
    setTempWorkerAdvance('');
    setTempWorkerBonus('');
    if (setEditingWorkerId) setEditingWorkerId(null);
    setIsSubFormOpen(false);
  };

  const isNameDuplicate = !editingWorkerId && workersList.some(
    w => w.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase()
  );

  const isFormValid = tempWorkerName.trim() !== '' &&
    tempWorkerJoiningDate.trim() !== '' &&
    tempWorkerJoiningDate <= todayStr &&
    tempWorkerWageAmount.trim() !== '' &&
    !isNameDuplicate;

  const handleSave = () => {
    const missingRequiredFields = [];
    if (!tempWorkerName.trim()) missingRequiredFields.push('Full Name');
    if (!tempWorkerJoiningDate) missingRequiredFields.push('Date of Joining');
    if (!tempWorkerWageAmount.trim()) missingRequiredFields.push('Daily Wage');

    if (missingRequiredFields.length > 0) {
      alert(`Please fill in the following required field(s) before saving:\n• ${missingRequiredFields.join('\n• ')}`);
      return;
    }

    if (isNameDuplicate) {
      alert(`An employee named "${tempWorkerName.trim()}" is already added to this project.`);
      return;
    }

    if (tempWorkerJoiningDate > todayStr) {
      alert("Date of Joining cannot be a future date.");
      return;
    }

    const targetWorkerId = editingWorkerId || Date.now();
    const compiledWorker = {
      id: targetWorkerId,
      name: tempWorkerName.trim(),
      mobileNumber: tempWorkerPhone.trim(),
      joiningDate: tempWorkerJoiningDate,
      dailyWage: parseFloat(tempWorkerWageAmount) || 0,
      advance: tempWorkerAdvance === '' ? 0 : parseFloat(tempWorkerAdvance) || 0,
      bonus: tempWorkerBonus === '' ? 0 : parseFloat(tempWorkerBonus) || 0,
      role: 'Employee',
      lastUpdatedAt: Date.now(),
    };

    if (editingWorkerId) {
      setWorkersList(workersList.map(w =>
        w.id === editingWorkerId
          ? { ...w, ...compiledWorker, attendance: w.attendance || {}, wageOverrides: w.wageOverrides || [], payments: w.payments || [] }
          : w
      ));
    } else {
      setWorkersList([...workersList, { ...compiledWorker, attendance: {}, wageOverrides: [], payments: [] }]);
    }

    resetForm();
  };

  if (!isSubFormOpen) return null;

  return (
    <div style={{
      position: isAddProjectOpen ? 'relative' : 'absolute',
      top: isAddProjectOpen ? 'auto' : 0,
      left: isAddProjectOpen ? 'auto' : 0,
      width: isAddProjectOpen ? '100%' : '100%',
      height: isAddProjectOpen ? 'auto' : '100%',
      backgroundColor: '#ffffff',
      zIndex: isAddProjectOpen ? 1 : 999,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {!isAddProjectOpen && (
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #F1F5F9' }}>
          <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
              {editingWorkerId ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
              Register worker to {projectName}
            </p>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        padding: isAddProjectOpen ? '0' : '16px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>
            Full Name<span style={{ color: '#DC2626' }}>*</span>
          </label>
          <input
            type="text"
            value={tempWorkerName}
            onChange={(e) => setTempWorkerName(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px',
              borderRadius: '8px',
              border: isNameDuplicate ? '1px solid #DC2626' : '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: '#F8FAFC',
            }}
          />
        </div>

        {isNameDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ width: '104px', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>
              ⚠️ An employee named "{tempWorkerName.trim()}" is already added to this project.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>
            Mobile Number
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0 10px',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}>
            <span style={{ marginRight: '4px', fontSize: '13px', color: '#64748B', fontWeight: '600', userSelect: 'none', flexShrink: 0 }}>+91</span>
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={tempWorkerPhone}
              onChange={(e) => {
                const cleanDigits = e.target.value.replace(/\D/g, '');
                setTempWorkerPhone(cleanDigits.slice(0, 10));
              }}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>
            Date of Joining <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <input
            type="date"
            required
            value={tempWorkerJoiningDate}
            max={todayStr}
            onChange={(e) => setTempWorkerJoiningDate(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#1E293B',
              fontWeight: '600',
              outline: 'none',
              backgroundColor: '#F8FAFC',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>
            Daily Wage <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0 10px',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}>
            <span style={{ marginRight: '6px', fontWeight: '600', color: '#475569', fontSize: '13px', flexShrink: 0 }}>₹</span>
            <input
              type="number"
              required
              value={tempWorkerWageAmount}
              onChange={(e) => setTempWorkerWageAmount(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontWeight: '600',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', width: '104px', flexShrink: 0 }}>
            Advance
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '0 10px',
            backgroundColor: '#FEF2F2',
            boxSizing: 'border-box',
          }}>
            <span style={{ marginRight: '4px', fontWeight: '600', color: '#DC2626', fontSize: '13px', flexShrink: 0 }}>₹</span>
            <input
              type="number"
              placeholder="0"
              value={tempWorkerAdvance}
              onChange={(e) => setTempWorkerAdvance(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontWeight: '600',
                color: '#DC2626',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#10B981', width: '104px', flexShrink: 0 }}>
            Bonus
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            border: '1px solid #6EE7B7',
            borderRadius: '8px',
            padding: '0 10px',
            backgroundColor: '#ECFDF5',
            boxSizing: 'border-box',
          }}>
            <span style={{ marginRight: '4px', fontWeight: '600', color: '#10B981', fontSize: '13px', flexShrink: 0 }}>₹</span>
            <input
              type="number"
              placeholder="0"
              value={tempWorkerBonus}
              onChange={(e) => setTempWorkerBonus(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontWeight: '600',
                color: '#10B981',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '16px', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              width: '100%',
              display: 'block',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isFormValid ? '#0B3C9B' : '#8FA4D6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              boxSizing: 'border-box',
              transition: 'background-color 0.2s ease',
            }}
          >
            Save worker
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerForm;