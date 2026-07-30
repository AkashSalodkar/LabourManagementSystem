import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';
import { projectService } from '../../services/projectService';
import ProjectList from './ProjectList';
import AddProjectModal from './AddProjectModal';
import ProfileModal from '../profile/ProfileModal';
import BottomNav from './BottomNav';
import ProjectPicker from './ProjectPicker';
import SubscribePage from '../subscriptions/SubscribePage';
import AttendanceScreen from '../attendance/AttendanceScreen';
import PaymentsScreen from '../payments/PaymentsScreen';
import ProjectView from '../projects/ProjectView';

const Dashboard = () => {
  const { loggedInUser, profileImg, logout } = useAuth();
  const { t } = useLanguage();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [activeSiteViewId, setActiveSiteViewId] = useState(null);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [projectPickerPurpose, setProjectPickerPurpose] = useState(null);
  const [isSubscribePageOpen, setIsSubscribePageOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isPaymentsPageOpen, setIsPaymentsPageOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [selectedProjectDropdown, setSelectedProjectDropdown] = useState('');
  const [projectSortMode, setProjectSortMode] = useState('az');
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  const formatSiteName = (name) => {
    if (!name) return '';
    return name.length > 11 ? `${name.substring(0, 11)}..` : name;
  };

  const TUTORIAL_VIDEO_URL = 'https://www.youtube.com/watch?v=6rRRAVSilss';
  const handleWatchTutorialVideo = async () => {
    try {
      window.open(TUTORIAL_VIDEO_URL, '_blank');
    } catch (error) {
      console.error('Unable to open tutorial video:', error);
    }
  };

  const goHome = () => {
    setActiveSiteViewId(null);
    setIsPaymentsPageOpen(false);
    setIsAttendanceModalOpen(false);
    setIsAddProjectOpen(false);
    setIsProjectPickerOpen(false);
    setIsSubscribePageOpen(false);
  };

  const openPicker = (purpose) => {
    setActiveSiteViewId(null);
    setIsPaymentsPageOpen(false);
    setIsAttendanceModalOpen(false);
    setIsAddProjectOpen(false);
    setIsSubscribePageOpen(false);
    setProjectPickerPurpose(purpose);
    setIsProjectPickerOpen(true);
  };

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const userId = loggedInUser?.userId || 1;
        const response = await projectService.getProjects(userId);
        
        // Format projects for the frontend
        const formattedProjects = response.map(p => ({
          id: p.id,
          name: p.projectName,
          address: p.projectAddress,
          workersCount: p.workerCount || 0,
          presentCount: p.presentToday || 0,
          employees: p.employees || [],
          lastModifiedAt: p.lastModifiedAt,
          isActive: p.isActive
        }));
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // If API fails, use empty array
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [loggedInUser]);

  // Loading state
  if (loading) {
    return (
      <div style={themeStyles.authDashboardContainer}>
        {/* Header */}
        <div style={themeStyles.authHeader}>
          <div onClick={() => setIsProfileModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {profileImg ? (
                <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                loggedInUser?.fullName
                  ? loggedInUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  : "GS"
              )}
            </div>
            <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '15px' }}>
              {t('greetingHi')}, {loggedInUser?.fullName || 'Guest'} 👋
            </span>
          </div>
          <button type="button" onClick={handleWatchTutorialVideo} style={themeStyles.logoutIconBtn}>
            <span style={{ marginRight: '5px' }}>▶️</span>Watch Video
          </button>
        </div>

        {/* Loading Spinner */}
        <div style={themeStyles.contentCardBody}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #0B3C9B',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
              <p style={{ color: '#64748B' }}>Loading dashboard...</p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab="home"
          onHomePress={goHome}
          onAttendancePress={() => openPicker('attendance')}
          onPaymentsPress={() => openPicker('payments')}
          onSubscribePress={() => setIsSubscribePageOpen(true)}
        />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={themeStyles.authHeader}>
        <div onClick={() => setIsProfileModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {profileImg ? (
              <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              loggedInUser?.fullName
                ? loggedInUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : "GS"
            )}
          </div>
          <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '15px' }}>
            {t('greetingHi')}, {loggedInUser?.fullName || 'Guest'} 👋
          </span>
        </div>
        <button type="button" onClick={handleWatchTutorialVideo} style={themeStyles.logoutIconBtn}>
          <span style={{ marginRight: '5px' }}>▶️</span>Watch Video
        </button>
      </div>

      {/* Main Content */}
      {activeSiteViewId ? (
        <ProjectView
          projectId={activeSiteViewId}
          onBack={() => setActiveSiteViewId(null)}
          projects={projects}
          setProjects={setProjects}
        />
      ) : isAttendanceModalOpen ? (
        <AttendanceScreen
          projectId={activeSiteViewId}
          onBack={() => setIsAttendanceModalOpen(false)}
          projects={projects}
          setProjects={setProjects}
        />
      ) : isPaymentsPageOpen ? (
        <PaymentsScreen
          projectId={activeSiteViewId}
          onBack={() => setIsPaymentsPageOpen(false)}
          projects={projects}
          setProjects={setProjects}
        />
      ) : isAddProjectOpen ? (
        <AddProjectModal
          onClose={() => setIsAddProjectOpen(false)}
          projects={projects}
          setProjects={setProjects}
        />
      ) : isSubscribePageOpen ? (
        <SubscribePage onClose={() => setIsSubscribePageOpen(false)} />
      ) : isProjectPickerOpen ? (
        <ProjectPicker
          purpose={projectPickerPurpose}
          projects={projects}
          onSelectProject={(projectId) => {
            setActiveSiteViewId(projectId);
            setIsProjectPickerOpen(false);
            if (projectPickerPurpose === 'payments') {
              setIsPaymentsPageOpen(true);
            } else {
              setIsAttendanceModalOpen(true);
            }
          }}
          onClose={() => setIsProjectPickerOpen(false)}
        />
      ) : (
        // Project List - This is the default view
        <ProjectList
          projects={projects}
          setProjects={setProjects}
          siteSearchQuery={siteSearchQuery}
          setSiteSearchQuery={setSiteSearchQuery}
          selectedProjectDropdown={selectedProjectDropdown}
          setSelectedProjectDropdown={setSelectedProjectDropdown}
          projectSortMode={projectSortMode}
          setProjectSortMode={setProjectSortMode}
          onSelectProject={(projectId) => setActiveSiteViewId(projectId)}
          onAddProject={() => setIsAddProjectOpen(true)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={
          activeSiteViewId ? 'home' :
          isAttendanceModalOpen ? 'attendance' :
          isPaymentsPageOpen ? 'payments' :
          isSubscribePageOpen ? 'subscribe' :
          isProjectPickerOpen ? 
            (projectPickerPurpose === 'attendance' ? 'attendance' : 'payments') :
          'home'
        }
        onHomePress={goHome}
        onAttendancePress={() => openPicker('attendance')}
        onPaymentsPress={() => openPicker('payments')}
        onSubscribePress={() => setIsSubscribePageOpen(true)}
      />

      {/* Modals */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={logout}
        />
      )}
    </>
  );
};

export default Dashboard;