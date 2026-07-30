import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';

const BottomNav = ({ activeTab, onHomePress, onAttendancePress, onPaymentsPress, onSubscribePress }) => {
  const { t } = useLanguage();

  const tabs = [
    { key: 'home', icon: '🏠', label: t('home'), onPress: onHomePress },
    { key: 'attendance', icon: '📅', label: t('attendance'), onPress: onAttendancePress },
    { key: 'payments', icon: '💰', label: t('payments'), onPress: onPaymentsPress },
    { key: 'subscribe', icon: '⭐', label: t('subscribe'), onPress: onSubscribePress },
  ];

  return (
    <div style={themeStyles.bottomDockNavBar}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          style={activeTab === tab.key ? themeStyles.navItemTabActive : themeStyles.navItemTab}
          onClick={tab.onPress}
        >
          <span style={themeStyles.navTabIcon}>{tab.icon}</span>
          <span style={themeStyles.navTabLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;