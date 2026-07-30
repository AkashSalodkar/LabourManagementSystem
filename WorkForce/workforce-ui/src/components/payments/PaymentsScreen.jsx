import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';
import { toLocalISODate } from '../../utils/dateHelpers';
import { calcPaymentDueForRange, calcPaidInRange, getEffectiveWage } from '../../utils/calculations';

const PaymentsScreen = ({ projectId, onBack, projects, setProjects }) => {
  const { t } = useLanguage();
  const currentProject = projects.find(p => p.id === projectId);
  const [paymentsPageWorkerSearch, setPaymentsPageWorkerSearch] = useState('');
  const [selectedPaymentWorkerId, setSelectedPaymentWorkerId] = useState(null);
  const [paymentsRangeFrom, setPaymentsRangeFrom] = useState('');
  const [paymentsRangeTo, setPaymentsRangeTo] = useState('');
  const [paymentsRangeMode, setPaymentsRangeMode] = useState('custom');
  const [selectedDate] = useState(toLocalISODate(new Date()));

  if (!currentProject) return null;

  const filteredPaymentWorkers = (currentProject.employees || []).filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(paymentsPageWorkerSearch.toLowerCase());
    if (!matchesSearch) return false;
    const joinDateStr = worker.joiningDate || '2026-07-01';
    if (paymentsRangeMode === 'custom' && paymentsRangeFrom && paymentsRangeTo) {
      if (joinDateStr > paymentsRangeTo) return false;
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f4f6f9',
      zIndex: 1660,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0 }}
          >
            ‹
          </button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>
            Payments
          </span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        <p>Payments screen implementation - coming soon</p>
      </div>
    </div>
  );
};

export default PaymentsScreen;