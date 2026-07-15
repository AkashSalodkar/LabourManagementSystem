import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import lmsLogo from './assets/LMSLogo.jpg';

export default function App() {
  const API_BASE_URL = 'https://localhost:7036/api/auth';

  // Authentication & Session States
  const [isLoginView, setIsLoginView] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Form Fields State (Shared / Registration)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [industry, setIndustry] = useState('');

  // Operational App Flags & Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);

    // Add Project View States
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [tempWorkersList, setTempWorkersList] = useState([]);

    // Add Worker Nested Form States
  const [isWorkerSubFormOpen, setIsWorkerSubFormOpen] = useState(false);
  const [tempWorkerName, setTempWorkerName] = useState('');
  const [tempWorkerPhone, setTempWorkerPhone] = useState('');
  const [tempWorkerJoiningDate, setTempWorkerJoiningDate] = useState('2026-07-01');
  const [tempWorkerWageType, setTempWorkerWageType] = useState('Daily'); // 'Daily' or 'Monthly'
  const [tempWorkerWageAmount, setTempWorkerWageAmount] = useState('400');

     // Worksite Detail Screen Navigation Flag
  const [activeSiteViewId, setActiveSiteViewId] = useState(null); // stores clicked project ID or null
      // Track the ID of the worker being edited (null when creating a new worker)
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  // Attendance Modal view toggle state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  // Local temporary storage state to record values before final save
  const [tempAttendanceMap, setTempAttendanceMap] = useState({}); // { workerId: { status: 'P', overtime: 0, penalty: 0 } }
  // Track search inputs for filtering workers inside the attendance modal view
  const [attendanceWorkerSearchQuery, setAttendanceWorkerSearchQuery] = useState('');


  const handleCloseWorkerFormSheet = () => {
  setTempWorkerName('');
  setTempWorkerPhone('');
  setTempWorkerJoiningDate('2026-07-01');
  setTempWorkerWageType('Daily');
  setTempWorkerWageAmount('400');
  setEditingWorkerId(null); // Clear target pointers
  setIsWorkerSubFormOpen(false); // Close drawer view frame container
};

// Handle removing a worker completely from a live project structure
const handleDeleteWorkerInline = (projectId, workerId) => {
  if (!window.confirm("Are you sure you want to remove this worker from this worksite?")) return;

  setProjects(prevProjects =>
    prevProjects.map(project => {
      if (project.id === projectId) {
        const updatedEmployees = (project.employees || []).filter(emp => emp.id !== workerId);
        return {
          ...project,
          workersCount: updatedEmployees.length,
          employees: updatedEmployees
        };
      }
      return project;
    })
  );
  alert("Worker profile successfully removed from this site registry.");
};

  // Initialize structural map context fields when opening the modal panel
const handleOpenAttendanceScreen = (project) => {
  const initialMap = {};
  project.employees.forEach(emp => {
    // Read existing state value flags if present, or assign fallback default baselines
    const currentRecord = emp.attendance?.[selectedDate] || {};
    initialMap[emp.id] = {
      status: currentRecord.status || 'P',
      overtime: currentRecord.overtime || '',
      penalty: currentRecord.penalty || ''
    };
  });
  setTempAttendanceMap(initialMap);
  setIsAttendanceModalOpen(true);
};
// Helper to transform YYYY-MM-DD to a standard long conversational string format
const formatConversationalDate = (dateString) => {
  if (!dateString) return '';
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return dateString;
  
  return parsedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Bulk Entry: Update all entries uniformly across the board
// Bulk Entry: Update all entries uniformly across the board except pre-joining workers
const handleBulkAttendanceChange = (statusValue) => {
  const currentProject = projects.find(p => p.id === activeSiteViewId);
  if (!currentProject) return;

  const updatedMap = { ...tempAttendanceMap };
  
  currentProject.employees.forEach(worker => {
    // Update fallback to prevent bulk entry system lockouts on early dates
const joinDateStr = worker.joiningDate || '2026-07-01';

    
    // Only permit updates if the currently viewed ledger date matches or succeeds registration
    if (selectedDate >= joinDateStr) {
      if (!updatedMap[worker.id]) {
        updatedMap[worker.id] = { status: statusValue, overtime: '', penalty: '' };
      } else {
        updatedMap[worker.id].status = statusValue;
      }
    }
  });
  
  setTempAttendanceMap(updatedMap);
};

// Inline Change: Update a single column cell metric field entry value block
const handleIndividualAttendanceChange = (workerId, key, value) => {
  setTempAttendanceMap(prev => ({
    ...prev,
    [workerId]: {
      ...prev[workerId],
      [key]: value
    }
  }));
};

// Net Daily Calculation function block
const calculateNetDaily = (baseWage, record) => {
  if (!record) return baseWage;
  let multiplier = 1;
  if (record.status === 'HD') multiplier = 0.5;
  if (record.status === 'A') multiplier = 0;
  
  const base = baseWage * multiplier;
  const overtime = parseFloat(record.overtime) || 0;
  const penalty = parseFloat(record.penalty) || 0;
  return Math.max(0, base + overtime - penalty);
};

// Save back changes into the primary core state registry tree structures safely
const handleSaveAttendanceData = () => {
  setProjects(prevProjects =>
    prevProjects.map(project => {
      if (project.id === activeSiteViewId) {
        let presentCountToday = 0;
        const updatedEmployees = project.employees.map(emp => {
          const tempRecord = tempAttendanceMap[emp.id];
          if (tempRecord && (tempRecord.status === 'P' || tempRecord.status === 'HD')) {
            presentCountToday++;
          }
          return {
            ...emp,
            attendance: {
              ...(emp.attendance || {}),
              [selectedDate]: tempRecord ? { ...tempRecord } : { status: 'P', overtime: 0, penalty: 0 }
            }
          };
        });

        return {
          ...project,
          presentCount: presentCountToday,
          employees: updatedEmployees
        };
      }
      return project;
    })
  );
  setIsAttendanceModalOpen(false);
  alert("Success: Attendance values mapped and saved securely.");
};

  // Core Functional States (Projects & Site-Specific Employees)
  const [projects, setProjects] = useState([
    { 
      id: 1, 
      name: 'Green Valley Tower', 
      workersCount: 28,
      presentCount: 24,
      amountDue: 142000,
      payoutProgress: 82,
      employees: [
        { 
          id: 1, 
          name: 'Alice Smith',
          role: 'Manager', 
          dailyWage: 500, 
          attendance: { "2026-07-01": "Present", "2026-07-02": "Half-Day" },
          advances: { "2026-06": 500 }, 
          bonuses: { "2026-06": 1000 }
        }
      ]
    },
    { 
      id: 2, 
      name: 'City Care Hospital', 
      workersCount: 12,
      presentCount: 11,
      amountDue: 84500,
      payoutProgress: 45,
      employees: []
    }
  ]);

  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [newProjectName, setNewProjectName] = useState('');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6);
  
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Smith', role: 'Manager', dailyWage: 50 },
    { id: 2, name: 'Bob Jones', role: 'Associate', dailyWage: 35 }
  ]);
  const [attendance, setAttendance] = useState({}); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePage, setActivePage] = useState('dashboard');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');

  useEffect(() => {
    const hasSoftToken = localStorage.getItem('workforce_soft_token');
    const storedUser = localStorage.getItem('workforce_user');
    if (hasSoftToken === 'true' && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setLoggedInUser(parsedUser);
          setIsUserAuthenticated(true);
          return;
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsUserAuthenticated(false);
    setLoggedInUser(null);
  }, [isLoginView]);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setOtp('');
    setOtpSent(false);
    setFullName('');
    setIndustry('');
  };

  const isRegistrationFormValid = () => {
    return (
      industry.trim() !== '' &&
      fullName.trim() !== '' &&
      mobileNumber.length === 10
    );
  };

  const handleSendOtp = async () => {
    if (!isLoginView && !isRegistrationFormValid()) {
      alert('Please fill all registration details accurately.');
      return;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSendingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, industry })
      });
      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      if (response.ok) {
        setOtpSent(true);
        alert(data.message || `OTP verification code dispatched to +91 ${mobileNumber}`);
      } else {
        alert(data.message || 'Failed to dispatch verification code.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Could not establish contact with backend services.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert('Please generate and input your verification OTP first.');
      return;
    }
    setLoading(true);
    const endpoint = isLoginView ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
    const payload = isLoginView
      ? { mobileNumber: mobileNumber.trim(), otp }
      : { mobileNumber: mobileNumber.trim(), otp, fullName, industry };
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      if (response.ok) {
        if (isLoginView) {
          alert('Login Successful! Welcome to your Workforce Dashboard.');
          localStorage.setItem('workforce_soft_token', 'true');
          const sessionUser = {
            userId: data.userId,
            fullName: data.fullName || fullName || 'Rajesh',
            industry: data.industry || industry
          };
          localStorage.setItem('workforce_user', JSON.stringify(sessionUser));
          setLoggedInUser(sessionUser);
          setIsUserAuthenticated(true);
          setActivePage('dashboard');
        } else {
          alert(data.message || 'Registration completed successfully! Proceeding to login view.');
          setIsLoginView(true);
          setOtp('');
          setOtpSent(false);
        }
      } else {
        alert(data.message || 'Validation failed down at backend services.');
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('Connection error occurred while processing server tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleFullLogout = () => {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    localStorage.clear();
    setIsUserAuthenticated(false);
    setLoggedInUser(null);
    setOtp('');
    setOtpSent(false);
    setMobileNumber('');
    window.location.reload();
  };

  const handleAddProjectPlaceholder = () => {
    const name = prompt("Enter new worksite project name:");
    if (!name || name.trim() === "") return;
    const newProj = {
      id: Date.now(),
      name: name.trim(),
      workersCount: 0,
      presentCount: 0,
      amountDue: 0,
      payoutProgress: 0,
      employees: []
    };
    setProjects([...projects, newProj]);
  };
  const handleAddNewWorkerInline = () => {
    const workerName = prompt("Enter full worker name:");
    if (!workerName || !workerName.trim()) return;
    
    const workerRole = prompt("Enter worker role / job title (e.g. Mason, Supervisor):", "Labor");
    const workerWage = prompt("Enter daily wage currency rate (₹):", "400");
    
    const newWorker = {
      id: Date.now(),
      name: workerName.trim(),
      role: workerRole || 'Labor',
      dailyWage: parseFloat(workerWage) || 400,
      attendance: {},
      advances: {},
      bonuses: {}
    };
    
    setTempWorkersList([...tempWorkersList, newWorker]);
  };

// 2. Updated final submission interceptor to handle existing project routing
// 1. Triggered when clicking an edit button next to a worker's name
const handleEditWorkerInline = (project, worker) => {
  setSelectedProjectId(project.id);
  setEditingWorkerId(worker.id);
  
  // Populate form with existing worker data
  setTempWorkerName(worker.name || '');
  setTempWorkerPhone(worker.mobileNumber || '');
  setTempWorkerJoiningDate(worker.joiningDate || '2026-07-01');
  setTempWorkerWageType(worker.wageType || 'Daily');
  setTempWorkerWageAmount(String(worker.dailyWage || worker.wageAmount || '400'));
  
  // Open the modern sheet UI
  setIsWorkerSubFormOpen(true);
};

// 2. Updated multi-purpose save operation handler
const handleSaveWorkerInlineFormData = () => {
  if (!tempWorkerName.trim()) {
    alert("Please specify the worker's full identification name.");
    return;
  }

  // Check if we are updating an existing entry or forging a brand new profile
  const targetWorkerId = editingWorkerId || Date.now();

  const compiledInlineWorker = {
    id: targetWorkerId,
    name: tempWorkerName.trim(),
    mobileNumber: tempWorkerPhone.trim(),
    joiningDate: tempWorkerJoiningDate,
    wageType: tempWorkerWageType,
    dailyWage: parseFloat(tempWorkerWageAmount) || 0,
    role: tempWorkerWageType === 'Daily' ? 'Daily Wage Crew' : 'Monthly Salary Staff',
    attendance: {},
    advances: {},
    bonuses: {}
  };

  if (isAddProjectOpen) {
    // Flow A: Inside "Add New Project" view layout container flow
    if (editingWorkerId) {
      setTempWorkersList(tempWorkersList.map(w => w.id === editingWorkerId ? { ...w, ...compiledInlineWorker } : w));
    } else {
      setTempWorkersList([...tempWorkersList, compiledInlineWorker]);
    }
    alert(`Worker profile updated successfully.`);
  } else {
    // Flow B: Direct live workspace dynamic state data store injection
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id === selectedProjectId) {
          let updatedEmployees;
          if (editingWorkerId) {
            // Update existing worker fields inline
            updatedEmployees = project.employees.map(emp => emp.id === editingWorkerId ? { ...emp, ...compiledInlineWorker } : emp);
          } else {
            // Append clean new profile registry block
            updatedEmployees = [...(project.employees || []), compiledInlineWorker];
          }

          return {
            ...project,
            workersCount: updatedEmployees.length,
            employees: updatedEmployees
          };
        }
        return project;
      })
    );
    alert(`Worker database configurations written successfully.`);
  }

  // Close form overlay views and flush operational form context fields
  setTempWorkerName('');
  setTempWorkerPhone('');
  setTempWorkerJoiningDate('2026-07-01');
  setTempWorkerWageType('Daily');
  setTempWorkerWageAmount('400');
  setEditingWorkerId(null);
  setIsWorkerSubFormOpen(false);
};


const handleCreateProjectFinalSubmission = (e) => {
    e.preventDefault();
    if (!newSiteName.trim()) {
      alert("Please provide a valid project or worksite title.");
      return;
    }
    if (tempWorkersList.length === 0) {
      alert("Validation Error: Please register at least one worker before saving project context.");
      return;
    }

    const createdProjectStructure = {
      id: Date.now(),
      name: newSiteName.trim(),
      workersCount: tempWorkersList.length,
      presentCount: tempWorkersList.length, // Initial placeholder state setup
      amountDue: 0,
      payoutProgress: 0,
      employees: tempWorkersList
    };

    setProjects([createdProjectStructure, ...projects]);
    
    // Clear operational overlay views
    setNewSiteName('');
    setTempWorkersList([]);
    setIsAddProjectOpen(false);
    alert("Success: Worksite project saved successfully!");
  };
  const handleOpenWorkerSubForm = () => {
    // Reset state inputs to defaults before presenting sheet
    setTempWorkerName('');
    setTempWorkerPhone('');
    setTempWorkerJoiningDate('2026-07-01');
    setTempWorkerWageType('Daily');
    setTempWorkerWageAmount('400');
    setIsWorkerSubFormOpen(true);
  };
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(siteSearchQuery.toLowerCase())
  );

  // Authenticated View Dashboard Render
  if (isUserAuthenticated && loggedInUser) {
    return (
      <div style={themeStyles.authDashboardContainer}>
                {/* PROJECT DETAILS VIEW OVERLAY SCREEN */}
{activeSiteViewId && (() => {
  const currentProject = projects.find(p => p.id === activeSiteViewId);
  if (!currentProject) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#f4f6f9', zIndex: 998, display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header Container Area */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px 16px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setActiveSiteViewId(null)} // Go back to Home Dashboard
              style={{ background: 'none', border: 'none', fontSize: '22px', color: '#1E293B', cursor: 'pointer', padding: 0 }}
            >
              ‹
            </button>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{currentProject.name}</h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>{currentProject.workersCount} workers</p>
            </div>
          </div>
          {/* Action icons row (Edit pencil & Delete trash) */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#64748B' }}>
            <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => alert('Edit project functionality coming soon!')}>✏️</span>
            <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => {
              if (window.confirm('Delete this worksite project completely?')) {
                setProjects(projects.filter(p => p.id !== currentProject.id));
                setActiveSiteViewId(null);
              }
            }}>🗑️</span>
          </div>
        </div>

        {/* Worksite Metric Summary Card Section */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', 
          backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' 
        }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContext: 'center', fontSize: '18px' }}>🏗️</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{currentProject.name}</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
              {currentProject.workersCount} workers • <span style={{ color: '#10B981', fontWeight: '600' }}>{currentProject.presentCount} present today</span>
            </p>
          </div>
        </div>

        {/* Mark Attendance Blue Action Button */}
        <button
          onClick={() => handleOpenAttendanceScreen(currentProject)}
          style={{
            width: '100%', padding: '14px', backgroundColor: '#0B3C9B', color: '#ffffff',
            border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '14px',
            marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          📅 Mark attendance
        </button>
        {/* ATTENDANCE MARKING MODAL SCREEN CONTAINER OVERLAY LAYOUT */}
{/* ATTENDANCE MARKING MODAL SCREEN CONTAINER OVERLAY LAYOUT */}
{isAttendanceModalOpen && (() => {
  const currentProject = projects.find(p => p.id === activeSiteViewId);
  if (!currentProject) return null;

  {/* Apply filtering dynamically on the current workers array before rendering */}
  const filteredAttendanceEmployees = (currentProject.employees || []).filter(worker =>
    worker.name.toLowerCase().includes(attendanceWorkerSearchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#ffffff', zIndex: 999, display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Structural Track Navigation Action Title Line Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setIsAttendanceModalOpen(false); setAttendanceWorkerSearchQuery(''); }} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#1E293B', cursor: 'pointer' }}>‹</button>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Attendance Roster</h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>{currentProject.name}</p>
          </div>
        </div>
        <button onClick={handleSaveAttendanceData} style={{ backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Save Logs</button>
      </div>

      {/* NEW SECTION: Date selector header contextual grid layout */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: '700', color: '#0B3C9B' }}>
            <span>📅</span> Daily Shift Logs & Attendance
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
            Current View: <span style={{ fontWeight: '700', color: '#1E293B' }}>{formatConversationalDate(selectedDate)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Change Date Context:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => {
              setSelectedDate(e.target.value);
              // Trigger reload matrix block to populate historical states safely when date switches
              const initialMap = {};
              currentProject.employees.forEach(emp => {
                const currentRecord = emp.attendance?.[e.target.value] || {};
                initialMap[emp.id] = {
                  status: currentRecord.status || 'P',
                  overtime: currentRecord.overtime || 0,
                  penalty: currentRecord.penalty || 0
                };
              });
              setTempAttendanceMap(initialMap);
            }} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', fontWeight: '600', outline: 'none', backgroundColor: '#F8FAFC' }} 
          />
        </div>
      </div>

      {/* NEW SECTION: Interactive Inline Search filter text box bar input */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search employee by name..."
            value={attendanceWorkerSearchQuery}
            onChange={(e) => setAttendanceWorkerSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#1E293B' }}
          />
          {attendanceWorkerSearchQuery && (
            <button onClick={() => setAttendanceWorkerSearchQuery('')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          )}
        </div>
      </div>

      {/* Bulk Operational Actions Segment Deck Row */}
      <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>⚡ Bulk Entry Actions:</span>
        <button onClick={() => handleBulkAttendanceChange('P')} style={{ backgroundColor: '#10B981', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Mark All Present (P)</button>
        <button onClick={() => handleBulkAttendanceChange('A')} style={{ backgroundColor: '#EF4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Mark All Absent (Holiday / A)</button>
      </div>

         {/* Roster Listing Grid Column Content Layout Section Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {/* Table Header Section Labels Line Deck Track row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: '1px solid #E2E8F0', fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ textAlign: 'left' }}>Employee Profile Details</div>
          <div>Attendance</div>
          <div>Overtime(₹)</div>
          <div>Penalty(₹)</div>
          <div>Calculated Net Daily</div>
        </div>

                {filteredAttendanceEmployees.length > 0 ? (
          filteredAttendanceEmployees.map((worker) => {
            const record = tempAttendanceMap[worker.id] || { status: 'P', overtime: '', penalty: '' };
            const baseWage = worker.dailyWage || worker.wageAmount || 400;
            
            // Extract the user profile joining date context
            const joinDateStr = worker.joiningDate || '2026-07-14'; 
            
            // Check if active selector context date is strictly before the employee's registration
            const isBeforeJoiningDate = selectedDate < joinDateStr;

            // Enforce zero payouts if viewing an inactive date context frame
            const computedNet = isBeforeJoiningDate ? 0 : calculateNetDaily(baseWage, record);

            return (
              <div 
                key={worker.id} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', 
                  alignItems: 'center', 
                  padding: '16px 0', 
                  borderBottom: '1px solid #F1F5F9', 
                  textAlign: 'center',
                  opacity: isBeforeJoiningDate ? 0.45 : 1,
                  backgroundColor: isBeforeJoiningDate ? '#F8FAFC' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Visual Details Badge Cell Item Block */}
                <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{worker.name}</h5>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                      {isBeforeJoiningDate ? (
                        <span style={{ color: '#EF4444', fontWeight: '600' }}>⚠️ Joined on {joinDateStr}</span>
                      ) : (
                        `Base: ₹${baseWage}/Day`
                      )}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      handleDeleteWorkerInline(currentProject.id, worker.id);
                      const updatedMap = { ...tempAttendanceMap };
                      delete updatedMap[worker.id];
                      setTempAttendanceMap(updatedMap);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', filter: 'grayscale(1)', padding: '4px' }}
                    title="Remove worker from site"
                  >
                    🗑️
                  </button>
                </div>

                {/* Triple State Toggle Choice Select Button Action Options */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  {['P', 'HD', 'A'].map((statusOption) => {
                    const isActive = !isBeforeJoiningDate && record.status === statusOption;
                    let activeBg = '#CBD5E1';
                    if (isActive) {
                      if (statusOption === 'P') activeBg = '#10B981';
                      if (statusOption === 'HD') activeBg = '#F59E0B';
                      if (statusOption === 'A') activeBg = '#EF4444';
                    }
                    return (
                      <button
                        key={statusOption}
                        disabled={isBeforeJoiningDate}
                        onClick={() => handleIndividualAttendanceChange(worker.id, 'status', statusOption)}
                        style={{
                          border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                          backgroundColor: isActive ? activeBg : '#F1F5F9',
                          color: isActive ? '#ffffff' : '#64748B', 
                          cursor: isBeforeJoiningDate ? 'not-allowed' : 'pointer', 
                          minWidth: '28px'
                        }}
                      >
                        {statusOption}
                      </button>
                    );
                  })}
                </div>

                {/* Overtime Value Input Number Field Cell Element */}
                <div>
                  <input
                    type="text" 
                    placeholder="0"
                    disabled={isBeforeJoiningDate}
                    value={isBeforeJoiningDate ? '' : (record.overtime === 0 ? '' : record.overtime)}
                    onChange={(e) => handleIndividualAttendanceChange(worker.id, 'overtime', e.target.value.replace(/\D/g, ''))}
                    style={{ 
                      width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', 
                      fontSize: '12px', textAlign: 'center', outline: 'none',
                      backgroundColor: isBeforeJoiningDate ? '#E2E8F0' : '#ffffff',
                      cursor: isBeforeJoiningDate ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                {/* Penalty Value Input Number Field Cell Element */}
                <div>
                  <input
                    type="text" 
                    placeholder="0"
                    disabled={isBeforeJoiningDate}
                    value={isBeforeJoiningDate ? '' : (record.penalty === 0 ? '' : record.penalty)}
                    onChange={(e) => handleIndividualAttendanceChange(worker.id, 'penalty', e.target.value.replace(/\D/g, ''))}
                    style={{ 
                      width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', 
                      fontSize: '12px', textAlign: 'center', outline: 'none',
                      backgroundColor: isBeforeJoiningDate ? '#E2E8F0' : '#ffffff',
                      cursor: isBeforeJoiningDate ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                {/* Calculated Live Dynamic Result Label Container Element */}
                <div style={{ fontSize: '13px', fontWeight: '700', color: isBeforeJoiningDate ? '#94A3B8' : '#0B3C9B' }}>
                  ₹{computedNet}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '30px', gridColumn: 'span 5' }}>
            No workforce entries match "{attendanceWorkerSearchQuery}".
          </p>
        )}
      </div>
    </div>
  );
})()}


      </div>

      {/* Main Workers Content List Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Workers</h3>
          <span
            onClick={() => {
              // 1. Reset values and flush editing context locks
              setTempWorkerName('');
              setTempWorkerPhone('');
              setTempWorkerJoiningDate('2026-07-01');
              setTempWorkerWageType('Daily');
              setTempWorkerWageAmount('400');
              setEditingWorkerId(null); 
              // 2. Explicitly bind current active tracking context 
             setSelectedProjectId(activeSiteViewId);
      
              // 3. Slide up the modern overlay screen
              setIsWorkerSubFormOpen(true);
            }}
             style={{ fontSize: '12px', fontWeight: '600', color: '#0B3C9B', cursor: 'pointer' }}
  >
              + Add worker
            </span>
          </div>
        {/* Workers Roster Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentProject.employees && currentProject.employees.length > 0 ? (
            currentProject.employees.map((worker) => {
              // Extract initials for the avatar badge
              const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
              
              // Pick an avatar background style color sequence based on the worker index ID
              const bgColors = ['#0070F3', '#10B981', '#7C3AED', '#F59E0B', '#EF4444'];
              const assignedBg = bgColors[worker.id % bgColors.length];

              return (
                <div key={worker.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 14px', border: '1px solid #F1F5F9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Visual Monogram Circular Profile Badge */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', backgroundColor: assignedBg,
                      color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'
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
                  {/* Locate where you render worker details block inside currentProject.employees.map */}
                  <div key={worker.id} style={{ /* your existing card container wrapper styles */ }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* avatar and name tags rendering code block here... */}
                    </div>
                    
                    {/* Update this layout row deck containing meta values */}
                    {/* Actions Layout Row Deck containing Edit and Delete Tools */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        onClick={() => handleEditWorkerInline(currentProject, worker)}
                        style={{ cursor: 'pointer', fontSize: '14px', padding: '4px', filter: 'grayscale(1)' }}
                        title="Edit Worker Info"
                      >
                        ✏️
                      </span>
                      <span
                        onClick={() => handleDeleteWorkerInline(currentProject.id, worker.id)}
                        style={{ cursor: 'pointer', fontSize: '14px', padding: '4px', filter: 'grayscale(1)' }}
                        title="Delete Worker From Site"
                      >
                        🗑️
                      </span>
                    </div>

                  </div>

                </div>
              );
            })
          ) : (
            <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>No workers registered to this site yet.</p>
          )}
        </div>
      </div>
      {/* MODERN OVERLAY SUB-FORM FOR EXISTING PROJECTS */}
{isWorkerSubFormOpen && !isAddProjectOpen && (
  <div style={{
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#ffffff', zIndex: 999, display: 'flex', flexDirection: 'column'
  }}>
    <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #F1F5F9' }}>
      <button onClick={() => setIsWorkerSubFormOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Add New Worker</h2>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Register worker to {currentProject.name}</p>
      </div>
    </div>
    
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
        <input type="text" placeholder="Worker's name" value={tempWorkerName} onChange={(e) => setTempWorkerName(e.target.value)} style={themeStyles.textInput} />
      </div>
      
      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>MOBILE NUMBER <span style={{ color: '#94A3B8', fontWeight: '400' }}>(OPTIONAL)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
          <span style={{ marginRight: '8px' }}>📱</span>
          <input type="tel" placeholder="For payment SMS / UPI" value={tempWorkerPhone} onChange={(e) => setTempWorkerPhone(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent' }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>DATE OF JOINING</label>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
          <span style={{ marginRight: '8px' }}>📅</span>
              <input 
              type="date" 
              value={tempWorkerJoiningDate} 
              onChange={(e) => setTempWorkerJoiningDate(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', 
              color: '#1E293B', fontWeight: '600', outline: 'none', backgroundColor: '#F8FAFC' }} 
              />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>WAGE TYPE</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => setTempWorkerWageType('Daily')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: tempWorkerWageType === 'Daily' ? '2px solid #0B3C9B' : '1px solid #CBD5E1', backgroundColor: tempWorkerWageType === 'Daily' ? '#EFF6FF' : '#ffffff', cursor: 'pointer' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: tempWorkerWageType === 'Daily' ? '#0B3C9B' : '#1E293B' }}>Daily</div>
          </button>
          <button type="button" onClick={() => setTempWorkerWageType('Monthly')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: tempWorkerWageType === 'Monthly' ? '2px solid #0B3C9B' : '1px solid #CBD5E1', backgroundColor: tempWorkerWageType === 'Monthly' ? '#EFF6FF' : '#ffffff', cursor: 'pointer' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: tempWorkerWageType === 'Monthly' ? '#0B3C9B' : '#1E293B' }}>Monthly</div>
          </button>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{tempWorkerWageType === 'Daily' ? 'DAILY WAGE' : 'MONTHLY WAGE'}</label>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
          <span style={{ marginRight: '8px', fontWeight: '600', color: '#475569' }}>₹</span>
          <input type="text" placeholder="400" value={tempWorkerWageAmount} onChange={(e) => setTempWorkerWageAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '20px' }}>
        <button type="button" onClick={() => setIsWorkerSubFormOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
        <button type="button" onClick={handleSaveWorkerInlineFormData} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#0B3C9B', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Save Worker</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
})()}

        {isAddProjectOpen && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: '#ffffff', zIndex: 999, display: 'flex', flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {/* Upper Navigation Track Title Header */}
            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #F1F5F9' }}>
              <button 
                onClick={() => { setIsAddProjectOpen(false); setNewSiteName(''); setTempWorkersList([]); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}
              >
                ‹
              </button>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Add New Project/Site</h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Create a worksite with workers</p>
              </div>
            </div>

            {/* Main Form Fields Container Area */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Project / site name
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Green Valley Tower"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #CBD5E1',
                    fontSize: '14px', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

             {/* Workers Inline Listing Header Meta Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Workers</span>
                {!isWorkerSubFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenWorkerSubForm}
                    style={{ background: 'none', border: 'none', color: '#0B3C9B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Add worker
                  </button>
                )}
              </div>

{/* Dynamic Nested Worker Form Layer */}
{isWorkerSubFormOpen ? (
  <div style={{
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  }}>
    {/* Full Name Input */}
    <div>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
        Full name
      </label>
      <input
        type="text"
        placeholder="Worker's name"
        value={tempWorkerName}
        onChange={(e) => setTempWorkerName(e.target.value)}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box', backgroundColor: '#ffffff', outline: 'none' }}
      />
    </div>

    {/* Mobile Number Input */}
    <div>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
        Mobile number <span style={{ color: '#94A3B8', fontWeight: '400' }}>(optional)</span>
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
        <span style={{ marginRight: '8px' }}>📱</span>
        <input
          type="tel"
          placeholder="For payment SMS / UPI"
          value={tempWorkerPhone}
          onChange={(e) => setTempWorkerPhone(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
        />
      </div>
    </div>

    {/* Date of Joining Input */}
    <div>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
        Date of joining
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
        <span style={{ marginRight: '8px' }}>📅</span>
        <input
          type="date"
          value={tempWorkerJoiningDate}
          onChange={(e) => setTempWorkerJoiningDate(e.target.value)}
          style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#1E293B', fontFamily: 'inherit' }}
        />
      </div>
      <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0 0 0', lineHeight: '1.3' }}>
        Attendance & payments start from this date. Past attendance won't appear in history.
      </p>
    </div>

    {/* Wage Type Selectors */}
    <div>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
        Wage type
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Daily Wage Option */}
        <button
          type="button"
          onClick={() => setTempWorkerWageType('Daily')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: tempWorkerWageType === 'Daily' ? '2px solid #0B3C9B' : '1px solid #CBD5E1',
            backgroundColor: tempWorkerWageType === 'Daily' ? '#EFF6FF' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: tempWorkerWageType === 'Daily' ? '#0B3C9B' : '#1E293B' }}>Daily</div>
          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Per day rate</div>
        </button>

        {/* Monthly Wage Option */}
        <button
          type="button"
          onClick={() => setTempWorkerWageType('Monthly')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: tempWorkerWageType === 'Monthly' ? '2px solid #0B3C9B' : '1px solid #CBD5E1',
            backgroundColor: tempWorkerWageType === 'Monthly' ? '#EFF6FF' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: tempWorkerWageType === 'Monthly' ? '#0B3C9B' : '#1E293B' }}>Monthly</div>
          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Fixed salary</div>
        </button>
      </div>
    </div>

    {/* Dynamic Wage Value Field */}
    <div>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
        {tempWorkerWageType === 'Daily' ? 'Daily wage' : 'Monthly wage'}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
        <span style={{ marginRight: '8px', fontWeight: '600', color: '#475569' }}>₹</span>
        <input
          type="text"
          placeholder="400"
          value={tempWorkerWageAmount}
          onChange={(e) => setTempWorkerWageAmount(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600' }}
        />
      </div>
    </div>

    {/* Form Embedded Action Sub-Row Buttons */}
    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
      <button
        type="button"
        onClick={() => setIsWorkerSubFormOpen(false)}
        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSaveWorkerInlineFormData}
        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0B3C9B', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
      >
        Save Worker
      </button>
    </div>
  </div>
) : tempWorkersList.length === 0 ? (
  /* Empty Registry Alert Notification */
  <div style={{
    display: 'flex', gap: '8px', padding: '12px 14px', backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A', borderRadius: '10px', color: '#B45309', fontSize: '13px', lineHeight: '1.4'
  }}>
    <span>⚠️</span>
    <span>Add at least one worker to create this project.</span>
  </div>
) : (
  /* Registered Crew Checklist Summary Display */
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {tempWorkersList.map((w) => (
      <div key={w.id} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{w.name}</p>
          <span style={{ fontSize: '11px', color: '#64748B' }}>{w.role}</span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E' }}>
          ₹{w.dailyWage}/{w.role === 'Daily Wage Crew' ? 'day' : 'mo'}
        </span>
      </div>
    ))}
  </div>
)}
</div> 

            {/* Bottom Actions Footer Trigger Panel Deck */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
              <button 
                type="button"
                onClick={handleCreateProjectFinalSubmission}
                disabled={!newSiteName.trim() || tempWorkersList.length === 0}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#0B3C9B',
                  color: '#ffffff', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer',
                  textAlign: 'center', transition: 'opacity 0.2s',
                  opacity: (!newSiteName.trim() || tempWorkersList.length === 0) ? 0.4 : 1
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        )}

        {/* Top Identification Header Profile Section */}
        <div style={themeStyles.authHeader}>
          <div style={themeStyles.profileRow}>
            <div style={themeStyles.avatarBox}>
              {loggedInUser.fullName ? loggedInUser.fullName.substring(0, 2).toUpperCase() : 'RS'}
            </div>
            <h2 style={themeStyles.welcomeText}>
              Hi, {loggedInUser.fullName || 'Rajesh'} 👋
            </h2>
          </div>
          <button type="button" onClick={handleFullLogout} style={themeStyles.logoutIconBtn}>
            Sign Out
          </button>
        </div>

        {/* Core Operations Container Area */}
        <div style={themeStyles.contentCardBody}>
            <button 
    type="button" 
    onClick={() => setIsAddProjectOpen(true)} 
    style={themeStyles.actionAddBtn}
  >
    + Add Project
  </button>


          <div style={themeStyles.searchBarContainer}>
            <span style={themeStyles.searchIconMarker}>🔍</span>
            <input
              type="text"
              placeholder="Search project by name..."
              value={siteSearchQuery}
              onChange={(e) => setSiteSearchQuery(e.target.value)}
              style={themeStyles.searchField}
            />
          </div>

          <div style={themeStyles.sectionMetaRow}>
            <h3 style={themeStyles.sectionLabel}>Your worksites</h3>
            <span style={themeStyles.seeAllActionLink} onClick={() => alert('Viewing all worksites')}>
              See all
            </span>
          </div>

          {/* Map and populate operational workspace records */}
        {filteredProjects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => setActiveSiteViewId(project.id)} // Opens the detailed screen view
            style={{ ...themeStyles.worksiteCard, cursor: 'pointer' }}
          >
          <div style={themeStyles.cardHeadingRow}>
            <div style={themeStyles.siteIconWrapper}>🏗️</div>
            <h4 style={themeStyles.siteTitle}>{project.name}</h4>
            <span style={themeStyles.arrowNavIndicator}>›</span>
          </div>

    <div style={themeStyles.metricsGridRow}>
      <div style={themeStyles.metricCell}>
        <p style={themeStyles.metricValue}>{project.workersCount}</p>
        <span style={themeStyles.metricLabelText}>Workers</span>
      </div>
      <div style={themeStyles.metricCell}>
        <p style={{ ...themeStyles.metricValue, color: '#10B981' }}>
          {project.presentCount}
        </p>
        <span style={themeStyles.metricLabelText}>Present</span>
      </div>
      <div style={themeStyles.metricCell}>
        <p style={themeStyles.metricValueDue}>
          {"\u20B9"}{project.amountDue.toLocaleString('en-IN')}
        </p>
        <span style={themeStyles.metricLabelText}>Due</span>
      </div>
    </div>

    <div style={themeStyles.payoutTrackLine}>
      <div style={{ ...themeStyles.payoutProgressValueBar, width: `${project.payoutProgress}%` }}></div>
    </div>
    <div style={themeStyles.payoutMetaRow}>
      <span style={themeStyles.payoutLabel}>Payout progress</span>
      <span style={themeStyles.payoutPercentageText}>{project.payoutProgress}%</span>
    </div>
  </div>
))}

  </div>

  {/* Global Persistent Bottom Action Dock Deck */}
  <div style={themeStyles.bottomDockNavBar}>
    <button style={themeStyles.navItemTabActive}>
      <span style={themeStyles.navTabIcon}>🏠</span>
      <span style={themeStyles.navTabLabel}>Home</span>
    </button>
    <button style={themeStyles.navItemTab} onClick={() => alert('Navigating to workers directory')}>
      <span style={themeStyles.navTabIcon}>👥</span>
      <span style={themeStyles.navTabLabel}>Workers</span>
    </button>
    <button style={themeStyles.navItemTab} onClick={() => alert('Navigating to accounts ledger')}>
      <span style={themeStyles.navTabIcon}>💰</span>
      <span style={themeStyles.navTabLabel}>Account</span>
    </button>
    <button style={themeStyles.navItemTab} onClick={() => alert('Navigating to history logs')}>
      <span style={themeStyles.navTabIcon}>📋</span>
      <span style={themeStyles.navTabLabel}>History</span>
    </button>
  </div>
</div>
);
}

// ==========================================
// Unauthenticated View Layout Template Render
// ==========================================
return (
<div style={themeStyles.container}>
  {/* SECTION 1: Blue Corporate Identity Banner Container */}
  <div style={themeStyles.topBrandSection}>
    <div style={themeStyles.logoBox}>₹</div>
    <div>
      <h1 style={themeStyles.mainHeading}>
        Track wages.<br />Pay on time.
      </h1>
    </div>
    <div>
      <p style={themeStyles.subText}>
        Attendance, overtime, advances & payouts for every worksite — in one simple app.
      </p>
    </div>
    <div style={themeStyles.badgeRow}>
      <div style={themeStyles.badgeItem}>
        <span>🛡️</span> Bank-grade OTP
      </div>
      <div style={themeStyles.badgeItem}>
        <span>👥</span> 12k+ supervisors
      </div>
    </div>
  </div>

  {/* SECTION 2: White Operations Core Modal Card */}
  <div style={themeStyles.formSheetModal}>
    <h2 style={themeStyles.formTitle}>
      {isLoginView ? 'Login to continue' : 'Create Employer Profile'}
    </h2>
    <p style={themeStyles.formSubTitle}>
      Enter your details — we'll send a 6-digit OTP to verify
    </p>

    <form onSubmit={handleSubmit}>
      {/* Dynamic Registration Row Fields */}
      {!isLoginView && (
        <>
          <div style={themeStyles.inputGroup}>
            <label style={themeStyles.fieldLabel}>Your name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              style={themeStyles.textInput}
            />
          </div>
          <div style={themeStyles.inputGroup}>
            <label style={themeStyles.fieldLabel}>Select Industry Segment *</label>
            <select
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={themeStyles.textInput}
            >
              <option value="">Select your Industry Segment</option>
              <option value="Construction & Real Estate">Construction & Real Estate</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Retail & Commerce">Retail & Commerce</option>
              <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
            </select>
          </div>
        </>
      )}

      {/* Primary Mobile Registration Field Element */}
      <div style={themeStyles.inputGroup}>
        <label style={themeStyles.fieldLabel}>Mobile number *</label>
        <div style={themeStyles.phoneInputContainer}>
          <span style={themeStyles.countryCode}>+91</span>
          <input
            type="tel"
            required
            maxLength="10"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="98765 43210"
            style={themeStyles.phoneField}
          />
        </div>
      </div>

      {/* Verification Code Dispatch Handler Switch */}
      <button
        type="button"
        onClick={handleSendOtp}
        disabled={sendingOtp || mobileNumber.length !== 10 || (!isLoginView && !isRegistrationFormValid())}
        style={{
          ...themeStyles.secondaryBtn,
          opacity: (sendingOtp || mobileNumber.length !== 10 || (!isLoginView && !isRegistrationFormValid())) ? 0.4 : 1
        }}
      >
        {sendingOtp ? 'Generating Token...' : otpSent ? '🔄 Resend Verification Code' : 'Send OTP \u2192'}
      </button>

      {/* Secure Secondary Password Validation Field */}
      <div style={{ ...themeStyles.inputGroup, marginTop: '20px' }}>
        <label style={themeStyles.fieldLabel}>Verification OTP *</label>
        <input
          type="text"
          required
          maxLength="6"
          disabled={!otpSent}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder={otpSent ? 'Enter 6-digit code' : 'Unlock by requesting OTP'}
          style={{
            ...themeStyles.textInput,
            letterSpacing: otpSent ? '0.2em' : 'normal',
            backgroundColor: !otpSent ? '#F1F5F9' : '#F8FAFC',
            cursor: !otpSent ? 'not-allowed' : 'text'
          }}
        />
      </div>

      {/* Gateway Routing Core Submission Element */}
      <button
        type="submit"
        disabled={!otpSent || otp.length !== 6 || loading}
        style={{
          ...themeStyles.primaryBtn,
          opacity: (!otpSent || otp.length !== 6 || loading) ? 0.4 : 1
        }}
      >
        {loading ? 'Processing Context...' : isLoginView ? 'Confirm & Secure Login' : 'Complete Platform Registration'}
      </button>

      {/* Authentication State Switch Footer */}
      <p style={themeStyles.switchViewText}>
        {isLoginView ? "Don't have an employer account yet?" : 'Already registered corporate manager?'}
        <button type="button" onClick={toggleView} style={themeStyles.toggleLink}>
          {isLoginView ? 'Register Corporate Hub Here' : 'Go to Gateway Login'}
        </button>
      </p>
    </form>
  </div>
</div>
);
}

// ==========================================
// GLOBALLY SCOPED STYLES (OUTSIDE APP SCOPE)
// ==========================================
const themeStyles = {
container: {
  width: '100vw',
  height: '100vh',
  backgroundColor: '#0B3C9B',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
  overflow: 'hidden'
},
topBrandSection: {
  padding: '40px 24px 28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
},
logoBox: {
  width: '48px',
  height: '48px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold'
},
mainHeading: {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: 0
},
subText: {
  color: '#A3C1F7',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: 0
},
badgeRow: {
  display: 'flex',
  gap: '16px',
  marginTop: '4px'
},
badgeItem: {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#ffffff',
  fontSize: '11px',
  opacity: 0.9
},
formSheetModal: {
  flex: 1,
  backgroundColor: '#ffffff',
  borderTopLeftRadius: '28px',
  borderTopRightRadius: '28px',
  padding: '32px 24px',
  overflowY: 'auto'
},
formTitle: {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1E293B',
  margin: '0 0 4px 0'
},
formSubTitle: {
  fontSize: '13px',
  color: '#64748B',
  margin: '0 0 24px 0'
},
inputGroup: {
  marginBottom: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
},
fieldLabel: {
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
},
textInput: {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '14px',
  color: '#1E293B',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#F8FAFC'
},
phoneInputContainer: {
  display: 'flex',
  alignItems: 'center',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  backgroundColor: '#F8FAFC',
  padding: '0 12px'
},
countryCode: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#475569',
  marginRight: '12px',
  borderRight: '1px solid #E2E8F0',
  paddingRight: '12px'
},
phoneField: {
  flex: 1,
  padding: '12px 0',
  border: 'none',
  backgroundColor: 'transparent',
  outline: 'none',
  fontSize: '14px',
  color: '#1E293B',
  fontWeight: '600'
},
primaryBtn: {
  width: '100%',
  padding: '14px',
  borderRadius: '8px',
  backgroundColor: '#0D6EFD',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center',
  marginTop: '8px',
  transition: 'opacity 0.2s'
},
secondaryBtn: {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #0D6EFD',
  backgroundColor: 'transparent',
  color: '#0D6EFD',
  fontWeight: '600',
  fontSize: '13px',
  cursor: 'pointer',
  marginTop: '10px'
},
    switchViewText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B',
    marginTop: '20px'
  },
  toggleLink: {
    color: '#0D6EFD',
    fontWeight: 'bold',
    background: 'none',
    border: 'none',
    padding: 0,
    marginLeft: '4px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  authDashboardContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  },
  authHeader: {
    backgroundColor: '#0B3C9B',
    padding: '24px 20px 60px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative'
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatarBox: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  logoutIconBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#ffffff',
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    marginLeft: 'auto'
  },
  contentCardBody: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    marginTop: '-40px',
    padding: '20px',
    overflowY: 'auto',
    paddingBottom: '100px'
  },
  actionAddBtn: {
    width: '100%',
    backgroundColor: '#0B3C9B',
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(11, 60, 155, 0.15)',
    marginBottom: '16px'
  },
  searchBarContainer: {
    position: 'relative',
    marginBottom: '20px'
  },
  searchField: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1E293B'
  },
  searchIconMarker: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
    fontSize: '14px'
  },
  sectionMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  sectionLabel: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0
  },
  seeAllActionLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0B3C9B',
    cursor: 'pointer'
  },
  worksiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    marginBottom: '14px',
    border: '1px solid #F1F5F9'
  },
  cardHeadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  siteIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#475569'
  },
  siteTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0,
    flex: 1
  },
  arrowNavIndicator: {
    color: '#94A3B8',
    fontSize: '14px'
  },
  metricsGridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr',
    gap: '8px',
    marginBottom: '14px'
  },
  metricCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0
  },
  metricValueDue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#DC2626',
    margin: 0
  },
  metricLabelText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  payoutTrackLine: {
    width: '100%',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px'
  },
  payoutProgressValueBar: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: '3px'
  },
  payoutMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  payoutLabel: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  payoutPercentageText: {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600'
  },
  bottomDockNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '64px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxSizing: 'border-box'
  },
  navItemTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8'
  },
  navItemTabActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#0B3C9B'
  },
  navTabIcon: {
    fontSize: '18px'
  },
  navTabLabel: {
    fontSize: '10px',
    fontWeight: '600'
  }
};
