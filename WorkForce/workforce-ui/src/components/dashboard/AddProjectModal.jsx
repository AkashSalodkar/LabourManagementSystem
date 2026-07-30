import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { themeStyles } from '../../styles/theme';
import WorkerForm from '../projects/WorkerForm';

const AddProjectModal = ({ onClose, projects, setProjects }) => {
  const { t } = useLanguage();
  const [newSiteName, setNewSiteName] = useState('');
  const [tempWorkersList, setTempWorkersList] = useState([]);
  const [isWorkerSubFormOpen, setIsWorkerSubFormOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState(null);

  const pluralizeEmployee = (count) => count === 1 ? 'Employee' : 'Employees';

  const handleCreateProject = () => {
    if (!newSiteName.trim()) {
      alert("Please provide a valid project or worksite title.");
      return;
    }
    if (tempWorkersList.length === 0) {
      alert("Validation Error: Please register at least one employee before saving project context.");
      return;
    }
    
    const createdProject = {
      id: Date.now(),
      name: newSiteName.trim(),
      workersCount: tempWorkersList.length,
      presentCount: 0,
      lastModifiedAt: Date.now(),
      employees: tempWorkersList,
    };
    
    setProjects([...projects, createdProject]);
    setNewSiteName('');
    setTempWorkersList([]);
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#ffffff',
      zIndex: 1660,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginLeft: '12px' }}>Add Project</span>
      </div>
      
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* Project Name Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#475569', 
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px'
          }}>
            Project Name <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <input
            type="text"
            placeholder={t('enterProjectName')}
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
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
            }}
          />
        </div>
        
        {/* Workers Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>
            {pluralizeEmployee(tempWorkersList.length)} ({tempWorkersList.length})
          </span>
          {!isWorkerSubFormOpen && (
            <button 
              type="button" 
              onClick={() => {
                setEditingWorkerId(null);
                setIsWorkerSubFormOpen(true);
              }} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#0B3C9B', 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: 'pointer' 
              }}
            >
              + Add Employee
            </button>
          )}
        </div>

        {/* Worker Form */}
        {isWorkerSubFormOpen ? (
          <WorkerForm
            isSubFormOpen={isWorkerSubFormOpen}
            setIsSubFormOpen={setIsWorkerSubFormOpen}
            workersList={tempWorkersList}
            setWorkersList={setTempWorkersList}
            editingWorkerId={editingWorkerId}
            setEditingWorkerId={setEditingWorkerId}
            projectName="this project"
            isAddProjectOpen={true}
          />
        ) : tempWorkersList.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '12px 14px', 
            backgroundColor: '#FFFBEB', 
            border: '1px solid #FDE68A', 
            borderRadius: '10px', 
            color: '#B45309', 
            fontSize: '13px', 
            lineHeight: '1.4' 
          }}>
            <span>⚠️</span>
            <span>Add at least one employee to create this project.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tempWorkersList.map((w) => (
              <div key={w.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 14px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '8px', 
                border: '1px solid #E2E8F0' 
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{w.name}</p>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{w.role || 'Employee'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E' }}>₹{w.dailyWage}/day</span>
                  <button
                    onClick={() => {
                      setEditingWorkerId(w.id);
                      setIsWorkerSubFormOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#0B3C9B', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${w.name} from this project?`)) {
                        setTempWorkersList(tempWorkersList.filter(worker => worker.id !== w.id));
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '14px' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
        <button
          type="submit"
          onClick={handleCreateProject}
          disabled={tempWorkersList.length === 0 || isWorkerSubFormOpen}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: (tempWorkersList.length > 0 && !isWorkerSubFormOpen) ? '#0B3C9B' : '#8FA4D6',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: (tempWorkersList.length > 0 && !isWorkerSubFormOpen) ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s ease',
          }}
        >
          Create Project
        </button>
        <p style={{ 
          fontSize: '11px', 
          color: '#94A3B8', 
          textAlign: 'center', 
          marginTop: '10px' 
        }}>
          {tempWorkersList.length === 0 ? 'Add at least one employee to create this project.' : 'Ready to create your project!'}
        </p>
      </div>
    </div>
  );
};

export default AddProjectModal;