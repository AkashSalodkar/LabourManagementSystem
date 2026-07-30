import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { themeStyles } from '../../styles/theme';
import ProjectCard from './ProjectCard';
import { projectService } from '../../services/projectService';
import { computeProjectPresentToday, computeProjectTotalDue, computeProjectLastAttendanceDate } from '../../utils/calculations';
import { toLocalISODate, formatShortDayLabel } from '../../utils/dateHelpers';

const ProjectList = ({
  projects: externalProjects = [],
  setProjects: setExternalProjects,
  siteSearchQuery = '',
  setSiteSearchQuery,
  selectedProjectDropdown = '',
  setSelectedProjectDropdown,
  projectSortMode = 'az',
  setProjectSortMode,
  onSelectProject,
  onAddProject,
}) => {
  const { t, appLanguage, changeLanguage, SUPPORTED_LANGUAGES } = useLanguage();
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If external projects are provided and have data, use them
        if (externalProjects && Array.isArray(externalProjects) && externalProjects.length > 0) {
          console.log('Using external projects:', externalProjects);
          setProjects(externalProjects);
          setLoading(false);
          return;
        }
        
        // Get user ID
        const userId = loggedInUser?.userId || 1;
        console.log('Fetching projects for user:', userId);
        
        // Fetch from API
        const response = await projectService.getProjects(userId);
        console.log('API Response:', response);
        
        // Ensure response is an array
        const projectsData = Array.isArray(response) ? response : [];
        
        // Transform response
        const formattedProjects = projectsData.map(p => ({
          id: p.id,
          name: p.projectName || 'Unnamed Project',
          address: p.projectAddress || '',
          workersCount: p.workerCount || 0,
          presentCount: p.presentToday || 0,
          employees: p.employees || [],
          lastModifiedAt: p.lastModifiedAt || new Date().toISOString(),
          isActive: p.isActive !== undefined ? p.isActive : true
        }));
        
        console.log('Formatted projects:', formattedProjects);
        setProjects(formattedProjects);
        
        if (setExternalProjects) {
          setExternalProjects(formattedProjects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [externalProjects, loggedInUser?.userId, setExternalProjects]);

  // Filter and sort projects with safety
  const filteredProjects = useMemo(() => {
    // Ensure we have a valid array
    const projectsArray = Array.isArray(projects) ? projects : [];
    
    if (projectsArray.length === 0) {
      return [];
    }
    
    const searchQuery = (siteSearchQuery || '').toLowerCase().trim();
    
    let filtered = projectsArray;
    
    // Apply search filter if query exists
    if (searchQuery) {
      filtered = projectsArray.filter(p => 
        p && p.name && p.name.toLowerCase().includes(searchQuery)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (projectSortMode === 'az') {
        return (a?.name || '').localeCompare(b?.name || '');
      }
      if (projectSortMode === 'za') {
        return (b?.name || '').localeCompare(a?.name || '');
      }
      if (projectSortMode === 'lastModified') {
        return (b?.lastModifiedAt || 0) - (a?.lastModifiedAt || 0);
      }
      return 0;
    });
  }, [projects, siteSearchQuery, projectSortMode]);

  // Ensure we always have an array for rendering
  const safeProjects = Array.isArray(filteredProjects) ? filteredProjects : [];

  const pluralizeEmployee = (count) => count === 1 ? t('employee') : t('employees');

  // ===== RENDER STATES =====

  // Loading state
  if (loading) {
    return (
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
            <p style={{ color: '#64748B' }}>Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={themeStyles.contentCardBody}>
        <div style={themeStyles.stickyActionZone}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onAddProject}
              style={{ ...themeStyles.actionAddBtn, width: 'auto', flex: 1, minWidth: 0 }}
            >
              <span style={{ fontSize: '17px', lineHeight: 1, fontWeight: 400 }}>+</span>
              {t('addProject')}
            </button>
            <select
              value={appLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t('language')}
              title={t('language')}
              style={{ ...themeStyles.projectDropdown, flexShrink: 0 }}
            >
              {Array.isArray(SUPPORTED_LANGUAGES) && SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#DC2626', marginBottom: '16px' }}>⚠️ {error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0B3C9B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No projects state
  if (safeProjects.length === 0) {
    return (
      <div style={themeStyles.contentCardBody}>
        <div style={themeStyles.stickyActionZone}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onAddProject}
              style={{ ...themeStyles.actionAddBtn, width: 'auto', flex: 1, minWidth: 0 }}
            >
              <span style={{ fontSize: '17px', lineHeight: 1, fontWeight: 400 }}>+</span>
              {t('addProject')}
            </button>
            <select
              value={appLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label={t('language')}
              title={t('language')}
              style={{ ...themeStyles.projectDropdown, flexShrink: 0 }}
            >
              {Array.isArray(SUPPORTED_LANGUAGES) && SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#64748B', marginBottom: '8px' }}>📋 No projects yet</p>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>Click "Add Project" to get started</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== ULTIMATE SAFETY CHECK: Ensure safeProjects is an array before mapping =====
  if (!Array.isArray(safeProjects)) {
    console.error('safeProjects is not an array:', safeProjects);
    return (
      <div style={themeStyles.contentCardBody}>
        <p style={{ textAlign: 'center', color: '#64748B' }}>No projects available</p>
      </div>
    );
  }

  // Projects exist - render them
  return (
    <div style={themeStyles.contentCardBody}>
      <div style={themeStyles.stickyActionZone}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onAddProject}
            style={{ ...themeStyles.actionAddBtn, width: 'auto', flex: 1, minWidth: 0 }}
          >
            <span style={{ fontSize: '17px', lineHeight: 1, fontWeight: 400 }}>+</span>
            {t('addProject')}
          </button>
          <select
            value={appLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label={t('language')}
            title={t('language')}
            style={{ ...themeStyles.projectDropdown, flexShrink: 0 }}
          >
            {Array.isArray(SUPPORTED_LANGUAGES) && SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ ...themeStyles.searchBarContainer, flex: 1 }}>
            <span style={themeStyles.searchIconMarker}>🔍</span>
            <input
              type="text"
              placeholder={t('enterProjectName')}
              value={siteSearchQuery}
              onChange={(e) => {
                setSiteSearchQuery(e.target.value);
                setSelectedProjectDropdown('');
              }}
              style={themeStyles.searchField}
            />
          </div>
          <select
            value={selectedProjectDropdown}
            onChange={(e) => {
              setSelectedProjectDropdown(e.target.value);
              setSiteSearchQuery(e.target.value);
            }}
            style={themeStyles.projectDropdown}
          >
            <option value="">{t('allProjects')}</option>
            {Array.isArray(projects) && projects.map(p => (
              <option key={p?.id || Math.random()} value={p?.name || ''}>
                {p?.name || 'Unnamed'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={themeStyles.sectionMetaRow}>
        <h3 style={themeStyles.sectionLabel}>{t('myProjects')}</h3>
        <select value={projectSortMode} onChange={(e) => setProjectSortMode(e.target.value)} style={themeStyles.sortSelect}>
          <option value="az">{t('nameAToZ')}</option>
          <option value="za">{t('nameZToA')}</option>
          <option value="lastModified">{t('lastModified')}</option>
        </select>
      </div>

      <div style={themeStyles.projectsScrollArea}>
        {safeProjects.map((project) => {
          // Safety check - if project is null/undefined, skip it
          if (!project) return null;
          
          const activeWorkersCount = (project.employees && Array.isArray(project.employees) 
            ? project.employees.length 
            : 0) || project.workersCount || 0;
          
          // Safely compute values with null checks
          let presentTodayCount = 0;
          let totalDueAmount = 0;
          let lastAttendanceDate = null;
          
          try {
            presentTodayCount = computeProjectPresentToday(project) || 0;
          } catch (e) {
            // Silently fail - default to 0
          }
          
          try {
            totalDueAmount = computeProjectTotalDue(project) || 0;
          } catch (e) {
            // Silently fail - default to 0
          }
          
          try {
            lastAttendanceDate = computeProjectLastAttendanceDate(project);
          } catch (e) {
            // Silently fail - default to null
          }
          
          const todayStr = toLocalISODate(new Date());
          const isAttendanceStale = !lastAttendanceDate || lastAttendanceDate !== todayStr;

          return (
            <ProjectCard
              key={project.id || Math.random()}
              project={project}
              workerCount={activeWorkersCount}
              presentCount={presentTodayCount}
              totalDue={totalDueAmount}
              lastAttendanceDate={lastAttendanceDate}
              isAttendanceStale={isAttendanceStale}
              onSelect={() => onSelectProject(project.id)}
              pluralizeEmployee={pluralizeEmployee}
              formatShortDayLabel={formatShortDayLabel}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;