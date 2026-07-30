import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';
import WorkerList from './WorkerList';
import WorkerForm from './WorkerForm';
import AttendanceScreen from '../attendance/AttendanceScreen';

const ProjectView = ({ projectId, onBack, projects, setProjects }) => {
  const { t } = useLanguage();
  const currentProject = projects.find(p => p.id === projectId);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectNameInput, setEditProjectNameInput] = useState('');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isWorkerSubFormOpen, setIsWorkerSubFormOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [workerSortMode, setWorkerSortMode] = useState('az');
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  if (!currentProject) return null;

  const handleEditProject = () => {
    setEditProjectNameInput(currentProject.name);
    setIsEditProjectModalOpen(true);
  };

  const handleSaveProjectName = () => {
    if (!editProjectNameInput.trim()) {
      alert('Please provide a valid project or worksite title.');
      return;
    }
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? { ...project, name: editProjectNameInput.trim(), lastModifiedAt: Date.now() }
          : project
      )
    );
    setIsEditProjectModalOpen(false);
  };

  const handleDeleteProject = () => {
    if (!window.confirm('Delete this worksite project completely?')) return;
    setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    onBack();
  };

  const workersMatchingQuery = (currentProject.employees || []).filter(w =>
    w.name.toLowerCase().includes(employeeSearchQuery.toLowerCase())
  );

  const sortedWorkers = [...workersMatchingQuery].sort((a, b) => {
    if (workerSortMode === 'az') return a.name.localeCompare(b.name);
    if (workerSortMode === 'za') return b.name.localeCompare(a.name);
    if (workerSortMode === 'lastUpdated') return (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0);
    return 0;
  });

  const pluralizeEmployee = (count) => count === 1 ? t('employee') : t('employees');

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f4f6f9',
      zIndex: 1650,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{currentProject.name}</h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#64748B' }}>
            <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={handleEditProject}>✏️</span>
            <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={handleDeleteProject}>🗑️</span>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {isEditProjectModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1800,
          padding: '16px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '440px',
            borderRadius: '16px',
            padding: '20px',
            boxSizing: 'border-box',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>Edit Project</h3>
              <button onClick={() => setIsEditProjectModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'block', marginBottom: '6px' }}>Project Name</label>
            <input
              type="text"
              value={editProjectNameInput}
              onChange={(e) => setEditProjectNameInput(e.target.value)}
              placeholder="Enter Project Name"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                color: '#1E293B',
                backgroundColor: '#F8FAFC',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '18px',
              }}
            />
            <button
              type="button"
              onClick={handleSaveProjectName}
              disabled={!editProjectNameInput.trim()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: !editProjectNameInput.trim() ? '#94A3B8' : '#0B3C9B',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: !editProjectNameInput.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Workers Section */}
      <WorkerList
        project={currentProject}
        workers={sortedWorkers}
        searchQuery={employeeSearchQuery}
        setSearchQuery={setEmployeeSearchQuery}
        sortMode={workerSortMode}
        setSortMode={setWorkerSortMode}
        onAddWorker={() => {
          setSelectedProjectId(projectId);
          setEditingWorkerId(null);
          setIsWorkerSubFormOpen(true);
        }}
        onEditWorker={(worker) => {
          setSelectedProjectId(projectId);
          setEditingWorkerId(worker.id);
          setIsWorkerSubFormOpen(true);
        }}
        onDeleteWorker={(workerId) => {
          if (!window.confirm("Are you sure you want to remove this worker from this worksite?")) return;
          setProjects(prevProjects =>
            prevProjects.map(project => {
              if (project.id === projectId) {
                const updatedEmployees = (project.employees || []).filter(emp => emp.id !== workerId);
                return { ...project, workersCount: updatedEmployees.length, employees: updatedEmployees, lastModifiedAt: Date.now() };
              }
              return project;
            })
          );
        }}
        onMarkAttendance={() => setIsAttendanceModalOpen(true)}
        pluralizeEmployee={pluralizeEmployee}
        t={t}
      />

      {/* Worker Form Modal */}
      <WorkerForm
        isSubFormOpen={isWorkerSubFormOpen}
        setIsSubFormOpen={setIsWorkerSubFormOpen}
        workersList={currentProject.employees || []}
        setWorkersList={(newList) => {
          setProjects(prevProjects =>
            prevProjects.map(project => {
              if (project.id === projectId) {
                return { ...project, employees: newList, workersCount: newList.length, lastModifiedAt: Date.now() };
              }
              return project;
            })
          );
        }}
        editingWorkerId={editingWorkerId}
        setEditingWorkerId={setEditingWorkerId}
        projectName={currentProject.name}
        isAddProjectOpen={false}
      />

      {/* Attendance Screen */}
      {isAttendanceModalOpen && (
        <AttendanceScreen
          projectId={projectId}
          onBack={() => setIsAttendanceModalOpen(false)}
          projects={projects}
          setProjects={setProjects}
        />
      )}
    </div>
  );
};

export default ProjectView;