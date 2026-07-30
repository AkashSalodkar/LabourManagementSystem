import React, { useState } from 'react';
import { themeStyles } from '../../styles/theme';

const ProjectPicker = ({ purpose, projects, onSelectProject, onClose }) => {
  const [projectPickerSearch, setProjectPickerSearch] = useState('');
  const [projectPickerDropdown, setProjectPickerDropdown] = useState('');

  const pickerMatches = projects.filter(p => 
    p.name.toLowerCase().includes(projectPickerSearch.toLowerCase())
  );
  const sortedPickerMatches = [...pickerMatches].sort((a, b) => a.name.localeCompare(b.name));
  const actionButtonLabel = purpose === 'payments' ? 'Payment' : 'Mark attendance';

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f4f6f9',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
        <div style={{ ...themeStyles.searchBarContainer, flex: 1 }}>
          <span style={themeStyles.searchIconMarker}>🔍</span>
          <input
            type="text"
            placeholder="Enter Project Name"
            value={projectPickerSearch}
            onChange={(e) => { setProjectPickerSearch(e.target.value); setProjectPickerDropdown(''); }}
            style={themeStyles.searchField}
          />
        </div>
        <select
          value={projectPickerDropdown}
          onChange={(e) => { setProjectPickerDropdown(e.target.value); setProjectPickerSearch(e.target.value); }}
          style={themeStyles.projectDropdown}
        >
          <option value="">All Projects</option>
          {[...projects].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        {sortedPickerMatches.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedPickerMatches.map(project => (
              <div key={project.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={themeStyles.siteIconWrapper}>🏗️</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>{project.name}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                    {(project.employees || []).length} worker(s)
                  </p>
                </div>
                <button
                  onClick={() => onSelectProject(project.id)}
                  style={{
                    flexShrink: 0,
                    padding: '9px 14px',
                    backgroundColor: '#0B3C9B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {actionButtonLabel}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>
            No worksites match your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectPicker;