import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import lmsLogo from './assets/LMSLogo.jpg';

export default function App() {
  const API_BASE_URL = 'https://localhost:7036/api/auth';

  // Authentication & Session States
  const [isLoginView, setIsLoginView] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(true);

  // Form Fields State (Shared / Registration)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  // Universal Employer Profile States
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGSTNumber] = useState(''); 
  const [city, setCity] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState(''); // Named 'stateRegion' to avoid collision with React keywords

  // Core Functional States (Employees, Attendance, Payroll)
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Smith', role: 'Manager', dailyWage: 50 },
    { id: 2, name: 'Bob Jones', role: 'Associate', dailyWage: 35 }
  ]);
  const [attendance, setAttendance] = useState({}); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // UI Navigation States
  const [activePage, setActivePage] = useState('dashboard');

  // Operational App Flags
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Add-Employee Form State
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
          setIsPasswordRequired(false);
          return;
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsUserAuthenticated(false);
    setLoggedInUser(null);
    setIsPasswordRequired(true);
  }, [isLoginView]);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setOtp('');
    setOtpSent(false);
    setFullName('');
    setPassword('');
    setCompanyName('');
    setIndustry('');
    setAddress('');
    setGSTNumber('');
    setPanNumber('');
    setCity('');
    setPincode('');
    setState('');
  };

  const isRegistrationFormValid = () => {
    return (
      companyName.trim() !== '' &&
      industry.trim() !== '' &&
      address.trim() !== '' &&
      gstNumber.trim() !== '' &&
      fullName.trim() !== '' &&
      mobileNumber.length === 10 &&
      password.trim() !== ''
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
    if (!password.trim()) {
      alert('Please enter your password.');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, companyName, industry })
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
        alert(data.message || 'Failed to dispatch verification code packages.');
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
      ? { mobileNumber: mobileNumber.trim(), password, otp, IsPasswordRequired: isPasswordRequired }
      : {
          mobileNumber: mobileNumber.trim(),
          passwordHash: password,
          otp,
          fullName,
          companyName,
          industry,
          address,
          gstNumber,
          panNumber,
          city,
          pincode,
          state
        };

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
            name: data.fullName || data.name || 'Employer',
            companyName: data.companyName || companyName,
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
          setPassword('');
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
    setIsPasswordRequired(true);
    setOtp('');
    setOtpSent(false);
    setMobileNumber('');
    setPassword('');
    window.location.reload();
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmpName || !newEmpWage) return;
    const newEmp = {
      id: employees.length + 1,
      name: newEmpName,
      role: newEmpRole || 'Staff',
      dailyWage: Number(newEmpWage)
    };
    setEmployees([...employees, newEmp]);
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpWage('');
    alert('Employee added successfully!');
  };
    const labelStyle = {
      fontSize: '13px',
      fontWeight: '600',
      color: '#475569',
      display: 'block',
      marginBottom: '4px'
    };

  const handleAttendanceChange = (employeeId) => {
    const key = `${employeeId}-${selectedDate}`;
    setAttendance({
      ...attendance,
      [key]: !attendance[key]
    });
  };

  const getDaysPresentCount = (employeeId) => {
    return Object.keys(attendance).filter((key) => key.startsWith(`${employeeId}-`) && attendance[key]).length;
  };

  const inputStyle = {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '12px',
    backgroundColor: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '14px',
    marginTop: '5px'
  };

  if (isUserAuthenticated && loggedInUser) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', boxSizing: 'border-box', margin: 0, padding: 0, overflow: 'hidden' }}>
        <aside style={{ width: '260px', minWidth: '260px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', padding: '24px 16px', boxSizing: 'border-box', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
            <div style={{ height: '36px', width: '36px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={lmsLogo} alt="Logo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>{loggedInUser?.companyName || 'Staff Portal'}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginTop: '2px' }}>Industry: {loggedInUser?.industry || 'General'}</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <button onClick={() => setActivePage('dashboard')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', backgroundColor: activePage === 'dashboard' ? '#1e293b' : 'transparent', color: activePage === 'dashboard' ? '#38bdf8' : '#94a3b8' }}>📊 Overview Dashboard</button>
            <button onClick={() => setActivePage('add-employee')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', backgroundColor: activePage === 'add-employee' ? '#1e293b' : 'transparent', color: activePage === 'add-employee' ? '#38bdf8' : '#94a3b8' }}>➕ Add New Employee</button>
            <button onClick={() => setActivePage('attendance')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', backgroundColor: activePage === 'attendance' ? '#1e293b' : 'transparent', color: activePage === 'attendance' ? '#38bdf8' : '#94a3b8' }}>📅 Daily Attendance Log</button>
            <button onClick={() => setActivePage('payroll')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', backgroundColor: activePage === 'payroll' ? '#1e293b' : 'transparent', color: activePage === 'payroll' ? '#38bdf8' : '#94a3b8' }}>💰 Payroll & Compensation</button>
            <button onClick={handleFullLogout} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#311212', color: '#f87171', border: '1px solid #7f1d1d', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', textAlign: 'center', marginTop: 'auto' }}>🚪 Sign Out Account</button>
          </nav>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
          <main style={{ padding: '32px', boxSizing: 'border-box' }}>
            {activePage === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Total Active Staff</span>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f4c94', marginTop: '6px' }}>{employees.length} Members</div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Industry Model Classification</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#047857', marginTop: '10px' }}>{loggedInUser?.industry || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {activePage === 'add-employee' && (
              <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '14px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f4c94', fontWeight: 'bold' }}>Register Employee Workspace Profiles</h3>
                <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <input type="text" required value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="Jane Miller" style={inputStyle} />
                  <input type="text" value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value)} placeholder="Operations Executive" style={inputStyle} />
                  <input type="number" required value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} placeholder="45" style={inputStyle} />
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '8px', backgroundColor: '#004d5a', color: '#ffffff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save Workspace Employee</button>
                    <button type="button" onClick={() => setActivePage('dashboard')} style={{ padding: '14px 20px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            {activePage === 'attendance' && (
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b' }}>Daily Shift Attendance Register</h3>
                <div style={{ marginBottom: '20px' }}>
                  Select Tracking Operation Date:
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
            )}
            {activePage === 'payroll' && (
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f4c94' }}>Dynamic Compensation Metrics Generator</h3>
                <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 20px 0' }}>Disbursement summary maps base dynamic wage values multiplied by cumulative verified active dates saved in system records history log.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '16px', fontFamily: 'sans-serif', boxSizing: 'border-box', margin: 0 }}>
      <div style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', height: '96px', width: '96px', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', backgroundColor: '#ffffff', border: '1px solid #f1f5f9', marginBottom: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <img src={lmsLogo} alt="LMS Logo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.025em', color: '#0f4c94', margin: 0 }}>Workforce Hub</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLoginView && (
            <>
              <div>
                <label style={labelStyle}>Enter Full Name<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Enter Company Name<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Global Corporation" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Select Industry Segment<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <select required value={industry} onChange={(e) => setIndustry(e.target.value)} style={inputStyle}>
                  <option value="">Select your Industry Segment</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Retail & Commerce">Retail & Commerce</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                  <option value="Education & Academia">Education & Academia</option>
                  <option value="Construction & Real Estate">Construction & Real Estate</option>
                  <option value="Other Business Services">Other Business Services</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Enter GST Number<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={gstNumber} onChange={(e) => setGSTNumber(e.target.value.toUpperCase())} placeholder="ABCD1234EF12Z" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Enter PAN Number<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Enter Corporate HQ Address Details<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Corporate HQ Address Details" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={labelStyle}>Enter City<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Enter State<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Enter Pincode<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
                <input type="text" required maxLength="6" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="400001" style={inputStyle} />
              </div>
            </>
          )}

          <div>
          <label style={labelStyle}>Enter Mobile Number<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
          <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px', backgroundColor: '#f8fafc', marginTop: '5px' }}>
            <span style={{ color: '#94a3b8', marginRight: '8px', fontWeight: '600', fontSize: '14px' }}>+91</span>
            <input type="tel" required maxLength="10" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} placeholder="9876543210" style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#1e293b', fontWeight: '600', fontSize: '14px' }} />
          </div>
        </div>
          {(!isLoginView || isPasswordRequired) && (
            <div>
              <label style={labelStyle}>Enter Password<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px', backgroundColor: '#f8fafc', marginTop: '5px' }}>
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#1e293b', fontWeight: '600', fontSize: '14px', paddingRight: '40px' }} />
                <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
              </div>
            </div>
          )}
          <div style={{ paddingTop: '4px' }}>
            <button type="button" onClick={handleSendOtp} disabled={sendingOtp || mobileNumber.length !== 10 || !password.trim() || (!isLoginView && !isRegistrationFormValid())} style={{ width: '100%', borderRadius: '12px', border: '2px solid #004d5a', backgroundColor: 'transparent', color: '#004d5a', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', opacity: sendingOtp || mobileNumber.length !== 10 || !password.trim() || (!isLoginView && !isRegistrationFormValid()) ? 0.3 : 1, transition: 'all 0.15s' }}>{sendingOtp ? 'Generating Token...' : otpSent ? '🔄 Resend Verification Code' : '📩 Send OTP Code'}</button>
          </div>

          <div>
            <label style={labelStyle}>Verification OTP<span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></label>
            <input type="text" required maxLength="6" disabled={!otpSent} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder={otpSent ? 'Enter 6-digit code' : 'Unlock by requesting OTP'} style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px', backgroundColor: !otpSent ? '#f1f5f9' : '#f8fafc', color: '#1e293b', outline: 'none', fontWeight: 'bold', fontSize: '14px', letterSpacing: otpSent ? '0.25em' : 'normal', cursor: !otpSent ? 'not-allowed' : 'text', marginTop: '5px' }} />
          </div>
          <button type="submit" disabled={!otpSent || otp.length !== 6 || loading} style={{ width: '100%', borderRadius: '12px', backgroundColor: '#004d5a', color: '#ffffff', padding: '14px', textAlign: 'center', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: !otpSent || otp.length !== 6 || loading ? 0.4 : 1, transition: 'all 0.15s' }}>{loading ? 'Processing Context...' : isLoginView ? 'Confirm & Secure Login' : 'Complete Platform Registration'}</button>
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <p style={{ color: '#64748b', fontWeight: '500', margin: 0 }}>{isLoginView ? "Don't have an employer account yet?" : 'Already registered corporate manager?'}</p>
            <button type="button" onClick={toggleView} style={{ color: '#0f4c94', fontWeight: 'bold', marginLeft: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '13px' }}>{isLoginView ? 'Register Corporate Hub Here' : 'Go to Gateway Login'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
