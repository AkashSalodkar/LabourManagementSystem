import React from 'react';
import { themeStyles } from '../../styles/theme';

const WorkerList = ({
  project,
  workers,
  searchQuery,
  setSearchQuery,
  sortMode,
  setSortMode,
  onAddWorker,
  onEditWorker,
  onDeleteWorker,
  onMarkAttendance,
  pluralizeEmployee,
  t,
}) => {
  const bgColors = ['#0070F3', '#10B981', '#7C3AED', '#F59E0B', '#EF4444'];

  return (
    <div style={{ flex: 1, minHeight: 0, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
          {pluralizeEmployee((project.employees || []).length)}
        </h3>
        <span
          onClick={onAddWorker}
          style={{ fontSize: '12px', fontWeight: '600', color: '#0B3C9B', cursor: 'pointer' }}
        >
          + Add Employee
        </span>
      </div>

      <div style={{ position: 'relative', marginBottom: '10px', flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}>🔍</span>
        <input
          type="text"
          placeholder={t('enterEmployeeName')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px 9px 34px',
            backgroundColor: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '13px',
            outline: 'none',
            color: '#1E293B',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
        <button
          onClick={onMarkAttendance}
          style={{
            backgroundColor: '#0B3C9B',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t('markAttendance')}
        </button>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} style={themeStyles.sortSelect}>
          <option value="az">{t('nameAToZ')}</option>
          <option value="za">{t('nameZToA')}</option>
          <option value="lastUpdated">{t('lastUpdated')}</option>
        </select>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {workers.length > 0 ? (
          workers.map((worker) => {
            const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
            const assignedBg = bgColors[worker.id % bgColors.length];

            return (
              <div key={worker.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid #F1F5F9',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: assignedBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{worker.name}</h5>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                      {worker.role || 'Labor'} • <span style={{ color: '#94A3B8' }}>
                        Joined {worker.joiningDate ? new Date(worker.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '01 Jul'}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    onClick={() => onEditWorker(worker)}
                    style={{ cursor: 'pointer', fontSize: '14px', padding: '4px', filter: 'grayscale(1)' }}
                    title="Edit Employee Info"
                  >
                    ✏️
                  </span>
                  <span
                    onClick={() => onDeleteWorker(worker.id)}
                    style={{ cursor: 'pointer', fontSize: '14px', padding: '4px', filter: 'grayscale(1)' }}
                    title="Delete Employee From Site"
                  >
                    🗑️
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>
            No workers match your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkerList;