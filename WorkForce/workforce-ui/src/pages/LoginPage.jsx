const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {

    if (!role) {
        alert("Please select your role.");
        return;
    }

    if (!fullName.trim()) {
        alert("Please enter Full Name.");
        return;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
        alert("Please enter a valid mobile number.");
        return;
    }

    if (!password.trim()) {
        alert("Please enter Password.");
        return;
    }

    if (role === "Builder" && !isBuilderFormValid()) {
        alert("Please fill all Builder details before requesting OTP.");
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
        body: JSON.stringify({ mobileNumber: mobileNumber, role: role })
      });

      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }

      if (response.ok) {
        setOtpSent(true);
        alert(data.message || `Verification token generated successfully for +91 ${mobileNumber}`);
      } else {
        alert(data.message || 'Failed to dispatch verification code packets.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Could not establish contact with backend services.');
    } finally {
      setSendingOtp(false);
    }
  };

  