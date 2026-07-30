import React from 'react';
import { themeStyles } from '../../styles/theme';

const ProjectCard = ({
  project,
  workerCount = 0,
  presentCount = 0,
  totalDue = 0,
  lastAttendanceDate,
  isAttendanceStale = true,
  onSelect,
  pluralizeEmployee,
  formatShortDayLabel,
  t,
}) => {
  // Safety check - if project is undefined, return null
  if (!project) return null;

  return (
    <div onClick={onSelect} style={{ ...themeStyles.worksiteCard, cursor: 'pointer' }}>
      <div style={themeStyles.cardHeadingRow}>
        <div style={themeStyles.siteIconWrapper}>🏗️</div>
        <h4 style={themeStyles.siteTitle}>{project.name || 'Unnamed Project'}</h4>
        <span style={themeStyles.arrowNavIndicator}>›</span>
      </div>
      
      <div style={themeStyles.metricsGridRow}>
        <div style={themeStyles.metricCell}>
          <p style={themeStyles.metricValue}>{workerCount}</p>
          <span style={themeStyles.metricLabelText}>{pluralizeEmployee(workerCount)}</span>
        </div>
        <div style={themeStyles.metricCell}>
          <p style={{ ...themeStyles.metricValue, color: '#10B981' }}>{presentCount}</p>
          <span style={themeStyles.metricLabelText}>{t('present')}</span>
        </div>
        <div style={themeStyles.metricCell}>
          <p style={{ ...themeStyles.metricValueDue, color: totalDue <= 0 ? '#10B981' : '#DC2626' }}>
            ₹{Math.abs(totalDue).toLocaleString('en-IN')}
          </p>
          <span style={themeStyles.metricLabelText}>
            {totalDue <= 0 ? t('extraPaid') : t('totalDue')}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '12px' }}>{isAttendanceStale ? '⚠️' : '✅'}</span>
        <span style={{ fontSize: '11px', color: isAttendanceStale ? '#DC2626' : '#94A3B8', fontWeight: isAttendanceStale ? '600' : '500' }}>
          {lastAttendanceDate
            ? (lastAttendanceDate === new Date().toISOString().split('T')[0]
                ? t('attendanceMarkedToday')
                : `Attendance last marked on ${formatShortDayLabel(lastAttendanceDate)}`)
            : t('attendanceNotMarked')}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;