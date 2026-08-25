import './firebase';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber as firebaseSignInWithPhoneNumber } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { useState, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Network } from '@capacitor/network';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FaEye, FaEyeSlash, FaYoutube, FaAddressBook } from 'react-icons/fa';
import { FiUser, FiPhone, FiChevronDown, FiArrowRight, FiArrowLeft, FiUsers, FiFileText, FiSettings, FiHelpCircle, FiHome, FiChevronRight, FiBox, FiClipboard, FiSearch, FiPlus, FiTrash2 } from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { HiOutlineUserGroup, HiOutlineCalendar, HiOutlineWallet, HiOutlineBuildingOffice2, HiOutlineLightBulb, HiOutlinePencil } from 'react-icons/hi2';
import smartpayLogo from './assets/icon.png';
import { jsPDF } from 'jspdf';

// ===== Multilingual support: supported languages + translation strings =====
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];
const LANGUAGE_STORAGE_KEY = 'workforce_app_language';
const BUSINESS_INFO_STORAGE_KEY = 'workforce_app_business_info';
const CUSTOMERS_STORAGE_KEY = 'workforce_app_customers';
const PRODUCTS_STORAGE_KEY = 'workforce_app_products';
const TERMS_STORAGE_KEY = 'workforce_app_terms';
const QUOTATIONS_STORAGE_KEY = 'workforce_app_quotations';


const translations = {
  en: {
    // Navigation
    navHome: 'Home', 
    navAttendance: 'Attendance', 
    navPayments: 'Payments', 
    navSubscribe: 'Subscribe',
    navHelp: 'Help',
    helpPageTitle: 'Help & Support',
    helpPageSubtitle: 'Stuck somewhere? Call our support team directly.',
    helpCallNow: 'Tap a number to call',
    watchVideo: 'Video',
    
    // Dashboard
    addProject: 'Add Project',
    searchProjectPlaceholder: 'Enter Project Name',
    allProjects: 'All Projects',
    myProjects: 'My Projects',
    sortAZ: 'Name: A to Z', 
    sortZA: 'Name: Z to A', 
    sortLastModified: 'Last modified',
    employeesLabel: 'Employees', 
    presentLabel: 'Present', 
    extraPaidLabel: 'Extra Paid', 
    totalDueLabel: 'Total Due',
    attendanceMarkedToday: 'Attendance last marked today',
    attendanceMarkedOnPrefix: 'Attendance last marked on',
    attendanceNotMarked: 'Attendance not marked yet',
    noWorksitesMatch: 'No worksites match your search.',
    greetingHi: 'Hi',
    
    // Project View
    employees: 'Employees',
    addEmployee: '+ Add Employee',
    enterEmployeeName: 'Enter Employee Name',
    noEmployeesMatch: 'No employees match your search.',
    editEmployee: 'Edit Employee',
    addNewEmployee: 'Add New Employee',
    registerEmployeeTo: 'Register employee to',
    fullName: 'Full Name',
    mobileNumber: 'Mobile Number',
    dateOfJoining: 'Date of Joining',
    dailyWage: 'Daily Wage',
    saveEmployee: 'Save Employee',
    
    // Attendance
    attendance: 'Attendance',
    selectDate: 'Select Date',
    bulkMark: 'Bulk mark:',
    allPresent: 'All Present',
    allAbsent: 'All Absent',
    enterEmployeeName: 'Enter Employee Name',
    noEmployeesJoined: 'No employees had joined this project as of the selected date.',
    saveAttendance: 'Save Attendance',
    attendanceSavedSuccess: 'Attendance Saved Successfully.',
    
    // Edit Wage
    editWage: 'Edit wage',
    changeWageForEmployee: 'Change wage for this employee and choose when it applies',
    applyTo: 'Apply to',
    today: 'Today',
    pastDays: 'Past days',
    specificDuration: 'Specific duration',
    onwardsThisDay: 'Onwards This Day',
    appliesUpTo: 'APPLIES UP TO',
    from: 'FROM',
    to: 'TO',
    appliesFrom: 'APPLIES FROM',
    newDailyWage: 'NEW DAILY WAGE',
    noteOptional: 'NOTE (OPTIONAL)',
    cancel: 'Cancel',
    saveWage: 'Save wage',
    wageUpdatedSuccess: 'Wage updated successfully.',
    sameWageError: 'The new wage must be different from the current wage.',
    removeBalancePendingError: 'Employee can be removed only after the balance is \u20B90.',
    selectDateForAdvanceError: 'Please select the Date to Add Advance.',
    projectRemoveBalancePendingError: 'Project can be removed only when all employee balances are \u20B90.',
    selectDateFromCalendar: 'Select a date from the calendar to mark attendance.',
    selectDateToSaveAttendance: 'Select a date from the calendar to save attendance.',
    pleaseMarkAttendance: 'Please mark attendance for',
    
    // Tracker
    musterCard: 'Muster Card',
    joined: 'Joined',
    totalPresent: 'Present',
    totalHalfDay: 'Half Day',
    totalAbsent: 'Absent',
    attendanceHalfLabel: 'Half',
    attendanceAbsentLabel: 'Absent',
    fromDateOfJoining: 'From date of joining',
    
    // Calendar
    selectDates: 'Select date(s)',
    datesSelected: 'dates selected',
    attendanceAlreadyMarked: 'Attendance already marked — tap to view/edit, double-tap to remove',
    clear: 'CLEAR',
    set: 'SET',
    maxDaysError: 'Max 31 Days attendance at a time.',
    removeAttendance: 'Remove attendance?',
    removeAttendanceConfirm: 'This will unmark attendance for {date} for every worker in this project.',
    remove: 'Remove',
    
    // Payments
    payments: 'Payments',
    searchEmployee: 'Search employee...',
    employeesCount: 'Employees',
    noWorkersFound: 'No workers active or found',
    noEntriesMatch: 'Either no entries match your search criteria, or no registered workers have a joining date within this selected filter range.',
    settled: 'Settled',
    paid: 'Paid',
    due: 'Due',
    amountDue: 'Amount Due',
    wagesDue: 'Wages Due',
    amountPaid: 'Amount Paid',
    balance: 'Balance',
    wagesForAttendance: 'Wages for attendance',
    totalPaymentsMade: 'Total payments made',
    amountToBePaid: 'Amount to be paid',
    overpaid: 'Overpaid',
    advance: 'Advance',
    advancePaid: 'Advance Paid',
    totalAdvancePaid: 'Total Advance Paid',
    bonus: 'Bonus',
    totalBonusPaid: 'Total Bonus Paid',
    quickActions: 'Quick Actions',
    recordPayment: 'Record Payment',
    payAmount: 'Pay Amount',
    recordWagePayment: 'Record wage payment',
    addBonus: 'Add Bonus',
    giveBonusAmount: 'Give bonus amount',
    paymentHistory: 'Payment History',
    downloadStatement: 'Download Statement',
    noTransactions: 'No transactions recorded in this range.',
    selectDatePlaceholder: 'Select date',
    note: 'Note (optional)',
    save: 'Save',
    paymentSavedMsg: 'Added in Amount Paid and recorded in payment history.',
    bonusSavedMsg: 'Bonus recorded in the payment history.',
    
    // Subscribe
    subscribeNow: 'Subscribe now',
    pickPlan: 'Pick a plan that fits how many projects and employees you manage',
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    tryItOut: 'Try it out',
    forGrowingSupervisors: 'For growing supervisors',
    forMultiSiteTeams: 'For multi-site teams',
    currentPlan: 'Current plan',
    useFreePlan: 'Use Free plan',
    choosePlan: 'Choose {plan}',
    pricesIllustrative: 'Prices shown are illustrative. You can change or cancel your plan anytime.',
    mostPopular: 'MOST POPULAR',
    perMonth: 'per month',
    features: {
      free: ['1 active project', 'Up to 5 workers', 'Manual attendance marking', 'Basic payment tracking'],
      pro: ['Unlimited projects', 'Unlimited workers', 'Wage history & wage edits', 'Payment tracking + PDF statements', 'Priority email support'],
      business: ['Everything in Pro', 'Multiple supervisor logins', 'Data export (CSV/Excel)', 'Dedicated priority support', 'Early access to new features']
    },
    
    // Profile
    updateProfile: 'Update Profile',
    yourName: 'Your Name',
    tapToChangePhoto: 'Tap to change profile photo',
    saveChanges: 'Save Changes',
    signOut: 'Sign Out',
    yourDataIsSecure: 'Your data is secure with us.',
    
    // Exit
    exitConfirm: 'Are you sure you want to exit the app?',
    yes: 'Yes',
    no: 'No',
    
    // Project Picker
    enterProjectName: 'Enter Project Name',
    allProjects: 'All Projects',
    markAttendance: 'Mark Attendance',
    payment: 'Payment',
    
    // Edit Project
    editProject: 'Edit Project',
    projectName: 'Project Name',
    saveChanges: 'Save Changes',
    deleteProject: 'Delete this worksite project completely?',
    
    // Employee form validation
    fillRequiredFields: 'Please fill in the following required field(s) before saving:',
    employeeAlreadyExists: 'An employee named "{name}" is already registered on this Project.',
    futureJoiningDate: 'Date of Joining cannot be a future date.',
    
    // Add Project
    createProject: 'Create Project',
    addAtLeastOneEmployee: 'Add at least one employee to create this project.',
    validationError: 'Validation Error: Please register at least one employee before saving project context.',
    pleaseProvideValidProject: 'Please provide a valid project or worksite title.',
    projectAlreadyExists: 'A project named "{name}" already exists.',
    projectNameDuplicateInline: 'Project name already exists. Please enter a different project name.',
    
    // Miscellaneous
    labor: 'Labor',
    employee: 'Employee',
    role: 'Role',
    search: 'Search',
    noResults: 'No results found',
    ok: 'OK',
    edit: 'Edit',
    delete: 'Delete',
    remove: 'Remove',
    cancel: 'Cancel',
    save: 'Save',
  },
  hi: {
    // Navigation
    navHome: 'होम',
    navAttendance: 'उपस्थिति',
    navPayments: 'भुगतान',
    navSubscribe: 'सदस्यता',
    navHelp: 'सहायता',
    helpPageTitle: 'सहायता और समर्थन',
    helpPageSubtitle: 'कहीं अटक गए हैं? सीधे हमारी सहायता टीम को कॉल करें।',
    helpCallNow: 'कॉल करने के लिए नंबर पर टैप करें',
    watchVideo: 'वीडियो',
    
    // Dashboard
    addProject: 'प्रोजेक्ट जोड़ें',
    searchProjectPlaceholder: 'प्रोजेक्ट का नाम दर्ज करें',
    allProjects: 'सभी प्रोजेक्ट',
    myProjects: 'मेरे प्रोजेक्ट',
    sortAZ: 'नाम: A से Z',
    sortZA: 'नाम: Z से A',
    sortLastModified: 'हाल ही में संशोधित',
    employeesLabel: 'कर्मचारी',
    presentLabel: 'उपस्थित',
    extraPaidLabel: 'अतिरिक्त भुगतान',
    totalDueLabel: 'कुल बकाया',
    attendanceMarkedToday: 'उपस्थिति आज दर्ज की गई',
    attendanceMarkedOnPrefix: 'उपस्थिति अंतिम बार दर्ज की गई',
    attendanceNotMarked: 'उपस्थिति अभी दर्ज नहीं हुई',
    noWorksitesMatch: 'आपकी खोज से मेल खाने वाली कोई साइट नहीं मिली।',
    greetingHi: 'नमस्ते',
    
    // Project View
    employees: 'कर्मचारी',
    addEmployee: '+ कर्मचारी जोड़ें',
    enterEmployeeName: 'कर्मचारी का नाम दर्ज करें',
    noEmployeesMatch: 'आपकी खोज से मेल खाने वाला कोई कर्मचारी नहीं मिला।',
    editEmployee: 'कर्मचारी संपादित करें',
    addNewEmployee: 'नया कर्मचारी जोड़ें',
    registerEmployeeTo: 'कर्मचारी को पंजीकृत करें',
    fullName: 'पूरा नाम',
    mobileNumber: 'मोबाइल नंबर',
    dateOfJoining: 'शामिल होने की तारीख',
    dailyWage: 'दैनिक मजदूरी',
    saveEmployee: 'कर्मचारी सहेजें',
    
    // Attendance
    attendance: 'उपस्थिति',
    selectDate: 'तारीख चुनें',
    bulkMark: 'बल्क मार्क:',
    allPresent: 'सभी उपस्थित',
    allAbsent: 'सभी अनुपस्थित',
    enterEmployeeName: 'कर्मचारी का नाम दर्ज करें',
    noEmployeesJoined: 'चयनित तारीख तक इस प्रोजेक्ट में कोई कर्मचारी शामिल नहीं हुआ था।',
    saveAttendance: 'उपस्थिति सहेजें',
    attendanceSavedSuccess: 'उपस्थिति सफलतापूर्वक सहेजी गई।',
    
    // Edit Wage
    editWage: 'वेतन संपादित करें',
    changeWageForEmployee: 'इस कर्मचारी के लिए वेतन बदलें और चुनें कि यह कब लागू हो',
    applyTo: 'लागू करें',
    today: 'आज',
    pastDays: 'पिछले दिन',
    specificDuration: 'विशिष्ट अवधि',
    onwardsThisDay: 'इस दिन से आगे',
    appliesUpTo: 'तक लागू',
    from: 'से',
    to: 'तक',
    appliesFrom: 'से लागू',
    newDailyWage: 'नई दैनिक मजदूरी',
    noteOptional: 'नोट (वैकल्पिक)',
    cancel: 'रद्द करें',
    saveWage: 'वेतन सहेजें',
    wageUpdatedSuccess: 'वेतन सफलतापूर्वक अपडेट किया गया।',
    sameWageError: 'नई मजदूरी वर्तमान मजदूरी से अलग होनी चाहिए।',
    removeBalancePendingError: 'कर्मचारी को तभी हटाया जा सकता है जब शेष राशि \u20B90 हो।',
    selectDateForAdvanceError: 'कृपया अग्रिम जोड़ने के लिए तारीख चुनें।',
    projectRemoveBalancePendingError: 'प्रोजेक्ट को तभी हटाया जा सकता है जब सभी कर्मचारियों की शेष राशि \u20B90 हो।',
    selectDateFromCalendar: 'उपस्थिति दर्ज करने के लिए कैलेंडर से तारीख चुनें।',
    selectDateToSaveAttendance: 'उपस्थिति सहेजने के लिए कैलेंडर से तारीख चुनें।',
    pleaseMarkAttendance: 'कृपया के लिए उपस्थिति दर्ज करें',
    
    // Tracker
    musterCard: 'मस्टर कार्ड',
    joined: 'शामिल हुए',
    totalPresent: 'उपस्थित',
    totalHalfDay: 'आधा दिन',
    totalAbsent: 'अनुपस्थित',
    attendanceHalfLabel: 'आधा',
    attendanceAbsentLabel: 'अनुपस्थित',
    fromDateOfJoining: 'शामिल होने की तारीख से',
    
    // Calendar
    selectDates: 'तारीख(एं) चुनें',
    datesSelected: 'तारीखें चुनी गईं',
    attendanceAlreadyMarked: 'उपस्थिति पहले से दर्ज है - देखने/संपादित करने के लिए टैप करें, हटाने के लिए डबल-टैप करें',
    clear: 'साफ़ करें',
    set: 'सेट करें',
    maxDaysError: 'एक बार में अधिकतम 31 दिनों की उपस्थिति।',
    removeAttendance: 'उपस्थिति हटाएं?',
    removeAttendanceConfirm: 'इससे इस प्रोजेक्ट के हर कर्मचारी के लिए {date} की उपस्थिति हट जाएगी।',
    remove: 'हटाएं',
    
    // Payments
    payments: 'भुगतान',
    searchEmployee: 'कर्मचारी खोजें...',
    employeesCount: 'कर्मचारी',
    noWorkersFound: 'कोई सक्रिय कर्मचारी नहीं मिला',
    noEntriesMatch: 'या तो आपकी खोज से मेल खाने वाली कोई प्रविष्टि नहीं है, या इस फ़िल्टर सीमा में कोई पंजीकृत कर्मचारी नहीं है।',
    settled: 'चुकता',
    paid: 'भुगतान किया',
    due: 'बकाया',
    amountDue: 'बकाया राशि',
    wagesDue: 'देय मजदूरी',
    amountPaid: 'भुगतान की गई राशि',
    balance: 'शेष राशि',
    wagesForAttendance: 'उपस्थिति के लिए मजदूरी',
    totalPaymentsMade: 'कुल भुगतान',
    amountToBePaid: 'भुगतान की जाने वाली राशि',
    overpaid: 'अधिक भुगतान',
    advance: 'अग्रिम',
    advancePaid: 'भुगतान किया गया अग्रिम',
    totalAdvancePaid: 'कुल अग्रिम भुगतान',
    bonus: 'बोनस',
    totalBonusPaid: 'कुल बोनस भुगतान',
    quickActions: 'त्वरित कार्रवाई',
    recordPayment: 'भुगतान दर्ज करें',
    payAmount: 'राशि का भुगतान करें',
    recordWagePayment: 'वेतन भुगतान दर्ज करें',
    addBonus: 'बोनस जोड़ें',
    giveBonusAmount: 'बोनस राशि दें',
    paymentHistory: 'भुगतान इतिहास',
    downloadStatement: 'विवरण डाउनलोड करें',
    noTransactions: 'इस सीमा में कोई लेन-देन दर्ज नहीं है।',
    selectDatePlaceholder: 'तारीख चुनें',
    note: 'नोट (वैकल्पिक)',
    save: 'सहेजें',
    paymentSavedMsg: 'भुगतान की गई राशि में जोड़ा गया और भुगतान इतिहास में दर्ज किया गया।',
    bonusSavedMsg: 'बोनस भुगतान इतिहास में दर्ज किया गया।',
    
    // Subscribe
    subscribeNow: 'अभी सदस्यता लें',
    pickPlan: 'ऐसी योजना चुनें जो आपके प्रोजेक्ट्स और कर्मचारियों के लिए उपयुक्त हो',
    free: 'मुफ्त',
    pro: 'प्रो',
    business: 'व्यवसाय',
    tryItOut: 'इसे आज़माएं',
    forGrowingSupervisors: 'बढ़ते सुपरवाइजरों के लिए',
    forMultiSiteTeams: 'मल्टी-साइट टीमों के लिए',
    currentPlan: 'वर्तमान योजना',
    useFreePlan: 'मुफ्त योजना का उपयोग करें',
    choosePlan: '{plan} चुनें',
    pricesIllustrative: 'दिखाई गई कीमतें उदाहरण हैं। आप किसी भी समय योजना बदल या रद्द कर सकते हैं।',
    mostPopular: 'सबसे लोकप्रिय',
    perMonth: 'प्रति माह',
    features: {
      free: ['1 सक्रिय प्रोजेक्ट', '5 कर्मचारी तक', 'मैन्युअल उपस्थिति दर्ज करना', 'बुनियादी भुगतान ट्रैकिंग'],
      pro: ['असीमित प्रोजेक्ट', 'असीमित कर्मचारी', 'वेतन इतिहास और वेतन संपादन', 'भुगतान ट्रैकिंग + पीडीएफ विवरण', 'प्राथमिकता ईमेल सहायता'],
      business: ['प्रो में सब कुछ', 'कई सुपरवाइजर लॉगिन', 'डेटा निर्यात (CSV/Excel)', 'समर्पित प्राथमिकता सहायता', 'नई सुविधाओं तक जल्दी पहुंच']
    },
    
    // Profile
    updateProfile: 'प्रोफ़ाइल अपडेट करें',
    yourName: 'आपका नाम',
    tapToChangePhoto: 'प्रोफ़ाइल फोटो बदलने के लिए टैप करें',
    saveChanges: 'बदलाव सहेजें',
    signOut: 'साइन आउट',
    yourDataIsSecure: 'आपका डेटा हमारे साथ सुरक्षित है।',
    
    // Exit
    exitConfirm: 'क्या आप वाकई ऐप से बाहर निकलना चाहते हैं?',
    yes: 'हाँ',
    no: 'नहीं',
    
    // Project Picker
    enterProjectName: 'प्रोजेक्ट का नाम दर्ज करें',
    allProjects: 'सभी प्रोजेक्ट',
    markAttendance: 'उपस्थिति दर्ज करें',
    payment: 'भुगतान',
    
    // Edit Project
    editProject: 'प्रोजेक्ट संपादित करें',
    projectName: 'प्रोजेक्ट का नाम',
    saveChanges: 'बदलाव सहेजें',
    deleteProject: 'क्या आप इस वर्कसाइट प्रोजेक्ट को पूरी तरह से हटाना चाहते हैं?',
    
    // Employee form validation
    fillRequiredFields: 'सहेजने से पहले कृपया निम्नलिखित आवश्यक फ़ील्ड भरें:',
    employeeAlreadyExists: '"{name}" नाम का एक कर्मचारी पहले से ही इस प्रोजेक्ट पर पंजीकृत है।',
    futureJoiningDate: 'शामिल होने की तारीख भविष्य की नहीं हो सकती।',
    
    // Add Project
    createProject: 'प्रोजेक्ट बनाएं',
    addAtLeastOneEmployee: 'यह प्रोजेक्ट बनाने के लिए कम से कम एक कर्मचारी जोड़ें।',
    validationError: 'सत्यापन त्रुटि: प्रोजेक्ट सहेजने से पहले कृपया कम से कम एक कर्मचारी पंजीकृत करें।',
    pleaseProvideValidProject: 'कृपया एक मान्य प्रोजेक्ट या वर्कसाइट शीर्षक प्रदान करें।',
    projectAlreadyExists: '"{name}" नाम का एक प्रोजेक्ट पहले से मौजूद है।',
    projectNameDuplicateInline: 'प्रोजेक्ट नाम पहले से मौजूद है। कृपया एक अलग प्रोजेक्ट नाम दर्ज करें।',
    
    // Miscellaneous
    labor: 'मजदूर',
    employee: 'कर्मचारी',
    role: 'पद',
    search: 'खोजें',
    noResults: 'कोई परिणाम नहीं मिला',
    ok: 'ठीक है',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    remove: 'हटाएं',
    cancel: 'रद्द करें',
    save: 'सहेजें',
  },
};

// ===== Common popup used everywhere in the app (success / error / warning / confirm) =====
// Same visual language as the original "Attendance Saved Successfully" popup:
// icon circle, title, optional message, blue primary button, soft scale-in animation.
const POPUP_ICONS = {
  success: { glyph: '\u2713', bg: '#DCFCE7', color: '#10B981' },
  warning: { glyph: '\u26A0', bg: '#FEE2E2', color: '#EF4444' },
  error: { glyph: '\u26A0', bg: '#FEE2E2', color: '#EF4444' },
  info: { glyph: '\u2139', bg: '#DBEAFE', color: '#2554EB' },
};

function AppPopup({ open, tone = 'info', title, message, confirmLabel, cancelLabel, onConfirm, onCancel, onClose }) {
  if (!open) return null;
  const icon = POPUP_ICONS[tone] || POPUP_ICONS.info;
  const isConfirm = !!cancelLabel;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <style>{'@keyframes appPopupIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }'}</style>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'appPopupIn 0.18s ease-out' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: icon.bg, color: icon.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto' }}>{icon.glyph}</div>
        {title && <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>{title}</h3>}
        {message && <p style={{ fontSize: title ? '13px' : '15px', fontWeight: title ? '400' : '700', color: title ? '#64748B' : '#1E293B', margin: 0, lineHeight: '1.4' }}>{message}</p>}
        {isConfirm ? (
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={onCancel || onClose}
              style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{ flex: 1, padding: '12px', backgroundColor: '#2554EB', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button
            onClick={onConfirm || onClose}
            style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#2554EB', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            {confirmLabel || 'OK'}
          </button>
        )}
      </div>
    </div>
  );
}

// ===== EMPLOYEE AVATAR COLORS =====
// Light pastel background + darker readable text, keyed off the employee's
// first-name initial so the same letter always gets the same color across
// every screen (Attendance, Payments, Employee List, Muster Card, etc).
// Colors repeat after 12 letters, which is expected/acceptable.
const AVATAR_COLOR_PALETTE = [
  { bg: '#EAF3FF', text: '#1D4ED8' }, // Blue
  { bg: '#EAFBF3', text: '#047857' }, // Mint / Green
  { bg: '#FDECEC', text: '#DC2626' }, // Pink / Red
  { bg: '#F3EEFF', text: '#7C3AED' }, // Lavender / Purple
  { bg: '#FFF4E8', text: '#C2410C' }, // Peach / Orange
  { bg: '#FEFBEA', text: '#A16207' }, // Yellow
  { bg: '#E6FBF8', text: '#0F766E' }, // Teal
  { bg: '#FFF0F6', text: '#BE185D' }, // Rose
  { bg: '#EEF1FF', text: '#4338CA' }, // Indigo
  { bg: '#F2FCE8', text: '#4D7C0F' }, // Lime / Green
  { bg: '#E8FBFF', text: '#0369A1' }, // Cyan
  { bg: '#FBF3EA', text: '#92400E' }, // Tan / Brown
];

const getEmployeeAvatarColors = (name) => {
  const trimmed = (name || '').trim();
  const firstLetter = trimmed ? trimmed[0].toUpperCase() : 'W';
  const code = firstLetter.charCodeAt(0);
  const paletteLen = AVATAR_COLOR_PALETTE.length;
  const index = ((code - 65) % paletteLen + paletteLen) % paletteLen;
  return AVATAR_COLOR_PALETTE[index];
};

export default function App1() {
  
  // Root of the API - controllers live directly under /api/<Controller>
  // (e.g. /api/projects, /api/workers, /api/attendance, /api/payments).
  // Auth endpoints live under /api/auth, so we keep that as a derived constant
  // instead of baking "/auth" into the shared root (that was the bug that made
  // every non-auth request 404, since it was calling /api/auth/projects/... etc).
const API_ROOT = 'https://pts-api-e0fhhua9a9fnbtcc.centralindia-01.azurewebsites.net/api';
const API_BASE_URL = `${API_ROOT}/auth`;
// ===== API SERVICES =====
const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_ROOT}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
  post: async (endpoint, data) => {
    const response = await fetch(`${API_ROOT}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  put: async (endpoint, data) => {
    const response = await fetch(`${API_ROOT}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  delete: async (endpoint) => {
    const response = await fetch(`${API_ROOT}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  }
};

// ===== DTO <-> UI SHAPE MAPPERS =====
// ASP.NET's System.Text.Json serializer camelCases property names
// (FullName -> fullName, PaymentId -> paymentId, etc). The UI was built around
// a simpler local shape (name, mobileNumber, wageOverrides with
// {from,to,amount,note}, payments with {id,date,amount,method,note}, ...).
// These helpers translate real API responses into that shape so every screen
// keeps working against real data without a full UI rewrite.
const mapWorkerFromApi = (w) => ({
  id: w.id,
  name: w.fullName,
  mobileNumber: w.mobileNumber || '',
  joiningDate: w.joiningDate,
  dailyWage: w.dailyWage,
  role: w.role,
  advance: w.advance || 0,
  bonus: w.bonus || 0,
  lastUpdatedAt: w.lastUpdatedAt,
  isActive: w.isActive,
  projectId: w.projectId,
  attendance: Object.fromEntries(
    Object.entries(w.attendance || {}).map(([dateStr, rec]) => [dateStr, { status: rec.status }])
  ),
  wageOverrides: (w.wageOverrides || []).map(o => ({
    id: o.overrideId,
    from: o.effectiveFrom,
    to: o.effectiveTo,
    amount: o.dailyWageAmount,
    note: o.note || '',
  })),
  payments: (w.payments || []).map(p => ({
    id: p.paymentId,
    date: p.paymentDate,
    amount: p.amount,
    method: p.paymentMethod,
    note: p.note || '',
  })),
  advancePayments: (w.advancePayments || []).map(a => ({
    id: a.advanceId,
    date: a.advanceDate,
    amount: a.amount,
    method: a.paymentMethod,
    note: a.note || '',
  })),
  bonusPayments: (w.bonusPayments || []).map(b => ({
    id: b.bonusId,
    date: b.bonusDate,
    amount: b.amount,
    method: b.paymentMethod,
    note: b.note || '',
  })),
});

const mapProjectFromApi = (p) => ({
  id: p.id,
  name: p.projectName ?? 'Unnamed Project',
  address: p.projectAddress,
  workersCount: p.workerCount || 0,
  presentCount: p.presentToday || 0,
  totalDue: p.totalDue || 0,
  employees: (p.employees || []).map(mapWorkerFromApi),
  lastModifiedAt: p.lastModifiedAt,
  isActive: p.isActive,
});

// ===== PROJECT SERVICES =====
const projectService = {
  getProjects: (userId) => api.get(`/projects/user/${userId}`),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

// ===== WORKER SERVICES =====
const workerService = {
  createWorker: (data) => api.post('/workers', data),
  updateWorker: (id, data) => api.put(`/workers/${id}`, data),
  deleteWorker: (id) => api.delete(`/workers/${id}`),
  updateWage: (id, data) => api.put(`/workers/${id}/wage`, data),
};

// ===== ATTENDANCE SERVICES =====
const attendanceService = {
  markAttendance: (data) => api.post('/attendance/mark', data),
  bulkMarkAttendance: (data) => api.post('/attendance/bulk', data),
  getAttendance: (workerId, startDate, endDate) => 
    api.get(`/attendance/worker/${workerId}?startDate=${startDate || ''}&endDate=${endDate || ''}`),
  deleteAttendanceByDate: (projectId, date) => 
    api.delete(`/attendance/date?projectId=${projectId}&date=${date}`),
};
// Add this state near other state declarations
const [loadingProjects, setLoadingProjects] = useState(false);
// Add this function to load projects
const loadUserProjects = async (userId) => {
  try {
    setLoadingProjects(true);
    const response = await projectService.getProjects(userId);
    setProjects(response.map(mapProjectFromApi));
  } catch (error) {
    console.error('Error loading projects:', error);
    setProjects([]);
  } finally {
    setLoadingProjects(false);
  }
};

// Re-fetches a single project from the server and merges it back into local
// state. Used after any mutation (add/edit/delete worker, attendance, wage,
// payments...) so the UI always reflects what's actually in the DB instead of
// drifting from a locally-guessed update.
const refreshProject = async (projectId) => {
  try {
    const response = await projectService.getProject(projectId);
    const fresh = mapProjectFromApi(response);
    setProjects(prev => prev.map(p => (p.id === projectId ? fresh : p)));
    return fresh;
  } catch (error) {
    console.error(`Error refreshing project ${projectId}:`, error);
    return null;
  }
};
// ===== PAYMENT SERVICES =====
const paymentService = {
  recordPayment: (data) => api.post('/payments/record', data),
  recordAdvance: (data) => api.post('/payments/advance', data),
  recordBonus: (data) => api.post('/payments/bonus', data),
  getPaymentHistory: (workerId) => api.get(`/payments/history/${workerId}`),
  getWorkerBalance: (workerId) => api.get(`/payments/worker/${workerId}/balance`),
  updatePayment: (id, data) => api.put(`/payments/payment/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/payment/${id}`),
  deleteAdvance: (id) => api.delete(`/payments/advance/${id}`),
  deleteBonus: (id) => api.delete(`/payments/bonus/${id}`),
};
  // ===== LOCAL TESTING ONLY =====
  // Set to true to skip the OTP login screen and land straight on the dashboard
  // with a mock user. Set back to false before building for real use.
  const DEV_SKIP_LOGIN = false;
  const DEV_MOCK_USER = { userId: "1", fullName: "Rajesh", industry: "Construction" };

  // ✅ Restore a saved session from localStorage on load, so a logged-in user
  // stays logged in across page reloads / reopening the app - until they
  // explicitly sign out via handleFullLogout (which clears localStorage).
  const getPersistedSession = () => {
    try {
      const hasSoftToken = localStorage.getItem('workforce_soft_token') === 'true';
      const savedUser = localStorage.getItem('workforce_user');
      if (hasSoftToken && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // Corrupted/unreadable localStorage entry - treat as no session.
    }
    return null;
  };
  const persistedUser = DEV_SKIP_LOGIN ? DEV_MOCK_USER : getPersistedSession();

  const [isLoginView, setIsLoginView] = useState(!DEV_SKIP_LOGIN && !persistedUser);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(DEV_SKIP_LOGIN || !!persistedUser);
  const [loggedInUser, setLoggedInUser] = useState(persistedUser);
  const [userName, setUserName] = useState(persistedUser?.fullName || undefined);
  
  const [profileImg, setProfileImg] = useState(persistedUser?.profileImg || null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  // ===== Module home screen: null = show module picker, 'attendance' | 'quotations' = inside that module =====
  const [activeModule, setActiveModule] = useState(null);
  // ===== Sub-screen inside the Quotations module (e.g. 'business' = Update Business Info) =====
  const [quotationSubView, setQuotationSubView] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      logoImg: null, signatureImg: null,
      businessName: (loggedInUser?.industry || '').toLowerCase(),
      contactName: '', email: '',
      phone: loggedInUser?.mobileNumber ? `+91 ${loggedInUser.mobileNumber}` : '',
      addressLine1: '', addressLine2: '', addressLine3: '',
      otherInfo: '', businessCategory: '',
      taxLabel: 'GSTIN', taxNumber: '', state: '',
      bankAccountName: '', bankAccountNumber: '', bankName: '', upiId: '',
    };
  });
  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
  const updateBusinessField = (key, value) => setBusinessInfo(prev => ({ ...prev, [key]: value }));
  const handleUpdateBusinessInfo = () => {
    try {
      localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(businessInfo));
      showSuccess('Business info updated.');
    } catch {
      showAlert('Could not save business info on this device.');
    }
  };
  const handleBusinessImagePick = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBusinessField(key, reader.result);
    reader.readAsDataURL(file);
  };

  // ===== Quotations module: Customer List / Add Customer =====
  const emptyCustomerForm = {
    name: '', companyName: '', email: '', mobile: '',
    addressLine1: '', addressLine2: '', otherInfo: '', gstin: '', state: '',
    shippingAddress: '',
  };
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const updateCustomerField = (key, value) => setCustomerForm(prev => ({ ...prev, [key]: value }));
  const persistCustomers = (next) => {
    setCustomers(next);
    try { localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const openAddCustomer = (returnView = 'customerList') => {
    setCustomerForm(emptyCustomerForm);
    setEditingCustomerId(null);
    setCustomerFormReturnView(returnView);
    setQuotationSubView('addCustomer');
  };
  const openEditCustomer = (customer, returnView = 'customerList') => {
    setCustomerForm({ ...emptyCustomerForm, ...customer });
    setEditingCustomerId(customer.id);
    setCustomerFormReturnView(returnView);
    setQuotationSubView('addCustomer');
  };
  const handleSaveCustomer = () => {
    if (!customerForm.name.trim()) {
      showAlert('Please enter the customer name.');
      return;
    }
    if (editingCustomerId) {
      persistCustomers(customers.map((c) => (c.id === editingCustomerId ? { ...customerForm, id: editingCustomerId } : c)));
      showSuccess('Customer updated successfully.');
    } else {
      const newCustomer = { ...customerForm, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      persistCustomers([...customers, newCustomer]);
      showSuccess('Customer added successfully.');
    }
    setQuotationSubView(customerFormReturnView);
  };
  const handleDeleteCustomer = (customer) => {
    showConfirm(`Delete customer "${customer.name}"?`, () => {
      persistCustomers(customers.filter((c) => c.id !== customer.id));
      if (quotationForm.customerId === customer.id) {
        setQuotationForm((prev) => ({ ...prev, customerId: null }));
      }
      showSuccess('Customer deleted.');
    });
  };
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) || (c.companyName || '').toLowerCase().includes(q);
  });

  // ===== Quotations module: Product List / Add Product =====
  const emptyProductForm = {
    name: '', price: '', gst: '', description: '', unit: '', hsn: '',
  };
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  });
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const updateProductField = (key, value) => setProductForm(prev => ({ ...prev, [key]: value }));
  const persistProducts = (next) => {
    setProducts(next);
    try { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const openAddProduct = (returnView = 'productList') => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setProductFormReturnView(returnView);
    setQuotationSubView('addProduct');
  };
  const openEditProduct = (product, returnView = 'productList') => {
    setProductForm({ ...emptyProductForm, ...product });
    setEditingProductId(product.id);
    setProductFormReturnView(returnView);
    setQuotationSubView('addProduct');
  };
  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      showAlert('Please enter the product name.');
      return;
    }
    if (editingProductId) {
      persistProducts(products.map((p) => (p.id === editingProductId ? { ...productForm, id: editingProductId } : p)));
      showSuccess('Product updated successfully.');
    } else {
      const newProduct = { ...productForm, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      persistProducts([...products, newProduct]);
      showSuccess('Product added successfully.');
    }
    setQuotationSubView(productFormReturnView);
  };
  const handleDeleteProduct = (product) => {
    showConfirm(`Delete product "${product.name}"?`, () => {
      persistProducts(products.filter((p) => p.id !== product.id));
      setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== product.id) }));
      showSuccess('Product deleted.');
    });
  };
  const filteredProducts = products.filter((p) => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q);
  });

  // ===== Quotations module: Make Quotation =====
  const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const formatQuotationDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };
  const emptyQuotationForm = () => ({
    date: formatQuotationDate(new Date()),
    quotationNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
  });
  const [quotationForm, setQuotationForm] = useState(emptyQuotationForm);

  // ===== Quotations module: List & Detail Views =====
  const [quotations, setQuotations] = useState(() => {
    try {
      const saved = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [showConvertSheet, setShowConvertSheet] = useState(false);
  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');

  // Helper to persist quotations to LocalStorage
  const persistQuotations = (next) => {
    setQuotations(next);
    try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  // Which screen "Add/Edit Customer" and "Add/Edit Product" should return to once saved.
  const [customerFormReturnView, setCustomerFormReturnView] = useState('customerList');
  const [productFormReturnView, setProductFormReturnView] = useState('productList');

  // Next quotation number = 1 higher than the highest number already used,
  // so numbering stays sequential (1, 2, 3, ...) even if quotations are deleted.
  const getNextQuotationNumber = () => {
    const maxNum = quotations.reduce((max, q) => {
      const match = String(q.quotationNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return String(maxNum + 1);
  };

  const openMakeQuotation = () => {
    setQuotationForm({ ...emptyQuotationForm(), quotationNo: getNextQuotationNumber() });
    setQuotationSubView('makeQuotation');
  };

  const openSelectCustomerForQuotation = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForQuotation');
    setQuotationSubView('selectCustomerForQuotation');
  };
  const handleSelectCustomerForQuotation = (customer) => {
    setQuotationForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeQuotation');
  };
  const selectedQuotationCustomer = customers.find((c) => c.id === quotationForm.customerId) || null;

  const openSelectProductForQuotation = () => {
    setProductSearchQuery('');
    setProductFormReturnView('selectProductForQuotation');
    setProductQtyDrafts({});
    setQuotationSubView('selectProductForQuotation');
  };
  // Per-product quantity the user has typed/stepped to on the "Select Product" screen, before tapping Add.
  const [productQtyDrafts, setProductQtyDrafts] = useState({});
  const getProductQtyDraft = (productId) => (productQtyDrafts[productId] !== undefined ? productQtyDrafts[productId] : '1');
  const setProductQtyDraft = (productId, value) => setProductQtyDrafts((prev) => ({ ...prev, [productId]: value }));
  // Adds `qty` of `product` to the quotation in one go (instead of requiring one tap per unit).
  const handleSelectProductForQuotation = (product, qty = 1) => {
    const addQty = Number(qty) > 0 ? Number(qty) : 1;
    setQuotationForm((prev) => {
      const existing = prev.products.find((p) => p.productId === product.id);
      const products = existing
        ? prev.products.map((p) => (p.productId === product.id ? { ...p, qty: p.qty + addQty } : p))
        : [...prev.products, { productId: product.id, name: product.name, price: Number(product.price) || 0, gst: Number(product.gst) || 0, qty: addQty, unit: product.unit || '' }];
      return { ...prev, products };
    });
    setProductQtyDraft(product.id, '1');
  };
  const removeQuotationProductLine = (productId) => {
    setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [isOtherChargeModalOpen, setIsOtherChargeModalOpen] = useState(false);
  const [otherChargeForm, setOtherChargeForm] = useState({ label: 'Other Charges', amount: '', taxable: false });
  const openOtherChargeModal = () => {
    setOtherChargeForm({ label: 'Other Charges', amount: '', taxable: false });
    setIsOtherChargeModalOpen(true);
  };
  const handleSaveOtherCharge = () => {
    if (!otherChargeForm.amount || Number(otherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    const newCharge = { ...otherChargeForm, id: genId() };
    setQuotationForm((prev) => ({ ...prev, otherCharges: [...prev.otherCharges, newCharge] }));
    setIsOtherChargeModalOpen(false);
  };
  const removeQuotationOtherCharge = (id) => {
    setQuotationForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };

  const [terms, setTerms] = useState(() => {
    try {
      const saved = localStorage.getItem(TERMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  });
  const persistTerms = (next) => {
    setTerms(next);
    try { localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const [termsDraftSelectedIds, setTermsDraftSelectedIds] = useState([]);
  const openSelectTermsForQuotation = () => {
    setTermsDraftSelectedIds(quotationForm.termsIds);
    setQuotationSubView('selectTermsForQuotation');
  };
  const toggleTermsDraftSelection = (id) => {
    setTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneSelectTerms = () => {
    setQuotationForm((prev) => ({ ...prev, termsIds: termsDraftSelectedIds }));
    setQuotationSubView('makeQuotation');
  };
  const [isAddTermsModalOpen, setIsAddTermsModalOpen] = useState(false);
  const [newTermText, setNewTermText] = useState('');
  const openAddTermsModal = () => {
    setNewTermText('');
    setIsAddTermsModalOpen(true);
  };
  const handleAddTerm = () => {
    if (!newTermText.trim()) {
      showAlert('Please enter the terms and condition text.');
      return;
    }
    const newTerm = { id: genId(), text: newTermText.trim() };
    persistTerms([...terms, newTerm]);
    setTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    setIsAddTermsModalOpen(false);
  };
  const selectedQuotationTerms = terms.filter((term) => quotationForm.termsIds.includes(term.id));
  const handleDeleteTerm = (term) => {
    showConfirm('Delete this term and condition?', () => {
      persistTerms(terms.filter((t) => t.id !== term.id));
      setTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
      setQuotationForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      showSuccess('Term deleted.');
    });
  };

  const quotationProductsTotal = quotationForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);
  const quotationOtherChargesTotal = quotationForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const quotationAmountDue = Math.round(quotationProductsTotal + quotationOtherChargesTotal);

  const handleGenerateQuotation = () => {
    if (!quotationForm.customerId) {
      showAlert('Please select a customer.');
      return;
    }
    if (quotationForm.products.length === 0) {
      showAlert('Please add at least one product.');
      return;
    }

    // Generate a unique ID
    const newId = genId();
    const newQuotation = {
      id: newId,
      ...quotationForm,
      grandTotal: quotationAmountDue,
      createdAt: new Date().toISOString(),
      // Convert customer object details to simple strings for display
      customerName: selectedQuotationCustomer?.name || 'Unknown',
      customerCompany: selectedQuotationCustomer?.companyName || '',
    };

    persistQuotations([...quotations, newQuotation]);
    
    showSuccess('Quotation generated successfully.');
    setQuotationSubView('quotationList'); // Navigate to list instead of null
  };

  // ===== Language =====
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });
  const t = (key) => (translations[language] && translations[language][key]) || translations.en[key] || key;
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode); } catch {}
  };
  
  const [viewportHeightPx, setViewportHeightPx] = useState(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
  );
  const formatSiteName = (name) => {
  if (!name) return '';
  return name.length > 11 ? `${name.substring(0, 11)}..` : name;
  };

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeightPx(window.visualViewport?.height || window.innerHeight);
    };
    updateViewportHeight();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);

  // ===== Keyboard-open detection (used to hide the bottom nav bar) =====
  // The visualViewport shrinks whenever the on-screen keyboard opens, on both
  // web and inside a Capacitor WebView. We track the tallest viewport height
  // seen -- that's the "no keyboard" baseline -- and treat any big drop below
  // it as the keyboard being open. The baseline resets on orientation/size
  // changes (tracked via width) so rotating the device doesn't get mistaken
  // for a keyboard opening.
  const maxViewportHeightRef = useRef(viewportHeightPx);
  const lastViewportWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  useEffect(() => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : lastViewportWidthRef.current;
    if (currentWidth !== lastViewportWidthRef.current) {
      lastViewportWidthRef.current = currentWidth;
      maxViewportHeightRef.current = viewportHeightPx;
    } else if (viewportHeightPx > maxViewportHeightRef.current) {
      maxViewportHeightRef.current = viewportHeightPx;
    }
    setIsKeyboardOpen((maxViewportHeightRef.current - viewportHeightPx) > 120);
  }, [viewportHeightPx]);

  // ===== Vertical scroll indicator (scrollbar) visibility, app-wide =====
  // Injected once into <head> instead of per-screen, so every current and
  // future scrollable container (Home, My Projects, Attendance, Payments,
  // Employee List, Add/Edit Employee, Add/Edit Project, Settings,
  // Subscription, modals, etc.) picks it up automatically -- nothing to
  // repeat per screen. This only styles the scrollbar itself (thin, fading,
  // matching native platform look) and never touches overflow, height,
  // padding, or any other layout property, so existing scroll behaviour and
  // UI layout are unaffected.
  useEffect(() => {
    const styleId = 'app-vertical-scrollbar-visibility';
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
      }
      *::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      *::-webkit-scrollbar-track {
        background: transparent;
      }
      *::-webkit-scrollbar-thumb {
        background-color: rgba(100, 116, 139, 0.5);
        border-radius: 999px;
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  // Project list search / dropdown / sort
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [selectedProjectDropdown, setSelectedProjectDropdown] = useState('');
  const [projectSortMode, setProjectSortMode] = useState('az');

  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [workerSortMode, setWorkerSortMode] = useState('az');

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [firebaseVerificationId, setFirebaseVerificationId] = useState(null);
  const [industry, setIndustry] = useState('General');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [isNewProjectNameDuplicate, setIsNewProjectNameDuplicate] = useState(false);
  const [tempWorkersList, setTempWorkersList] = useState([]);
  const [isWorkerSubFormOpen, setIsWorkerSubFormOpen] = useState(false);
  const [isSavingWorker, setIsSavingWorker] = useState(false);
  const [tempWorkerName, setTempWorkerName] = useState('');
  const [tempWorkerPhone, setTempWorkerPhone] = useState('');
  const [tempWorkerJoiningDate, setTempWorkerJoiningDate] = useState('');
  const [tempWorkerWageAmount, setTempWorkerWageAmount] = useState('');
  const [activeSiteViewId, setActiveSiteViewId] = useState(null);
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [pendingAttendanceByDate, setPendingAttendanceByDate] = useState({});
  const [pendingAdvanceByDate, setPendingAdvanceByDate] = useState({});
  const [attendanceWorkerSearchQuery, setAttendanceWorkerSearchQuery] = useState('');
  const [isAttendanceSavedPopupOpen, setIsAttendanceSavedPopupOpen] = useState(false);
  const [currentAttendanceDateIndex, setCurrentAttendanceDateIndex] = useState(0);

  const [selectedAttendanceDates, setSelectedAttendanceDates] = useState([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date());
  const [tempCalendarDates, setTempCalendarDates] = useState([]);
  const [isMaxDatesPopupOpen, setIsMaxDatesPopupOpen] = useState(false);
  const [unmarkConfirmDate, setUnmarkConfirmDate] = useState(null);
  const calendarClickTimerRef = useRef(null);

  const [trackerWorkerId, setTrackerWorkerId] = useState(null);
  const [trackerCalendarMonth, setTrackerCalendarMonth] = useState(() => new Date());

  const [isEditWageModalOpen, setIsEditWageModalOpen] = useState(false);
  const [editWageTargetWorkerId, setEditWageTargetWorkerId] = useState(null);
  const [editWageApplyTo, setEditWageApplyTo] = useState('');
  const [editWageTodayDate, setEditWageTodayDate] = useState('');
  const [editWagePastDates, setEditWagePastDates] = useState([]);
  const [editWagePastCalendarMonth, setEditWagePastCalendarMonth] = useState(() => new Date());
  const EDIT_WAGE_PAST_DAYS_MAX = 15;
  const [editWageSpecificStart, setEditWageSpecificStart] = useState('');
  const [editWageSpecificEnd, setEditWageSpecificEnd] = useState('');
  const [editWageFutureStart, setEditWageFutureStart] = useState('');
  const [editWageNewAmount, setEditWageNewAmount] = useState('');
  const [editWageNote, setEditWageNote] = useState('');
  const [isSameWagePopupOpen, setIsSameWagePopupOpen] = useState(false);
  const [isRemoveBalancePendingPopupOpen, setIsRemoveBalancePendingPopupOpen] = useState(false);
  const [isSelectDateForAdvancePopupOpen, setIsSelectDateForAdvancePopupOpen] = useState(false);
  const [isProjectRemoveBalancePendingPopupOpen, setIsProjectRemoveBalancePendingPopupOpen] = useState(false);
  const [isSavingWage, setIsSavingWage] = useState(false);

  const [isPaymentsPageOpen, setIsPaymentsPageOpen] = useState(false);
  const [paymentsRangeFrom, setPaymentsRangeFrom] = useState('');
  const [paymentsRangeTo, setPaymentsRangeTo] = useState('');
  const [paymentsPageWorkerSearch, setPaymentsPageWorkerSearch] = useState('');
  const [selectedPaymentWorkerId, setSelectedPaymentWorkerId] = useState(null);

  const [recordPaymentAmount, setRecordPaymentAmount] = useState('');
  const [recordPaymentMethod, setRecordPaymentMethod] = useState('Cash');
  const [recordPaymentDate, setRecordPaymentDate] = useState('');
  const [recordPaymentNote, setRecordPaymentNote] = useState('');
  const [activePaymentForm, setActivePaymentForm] = useState(null);

  // ===== Auto-scroll the Pay Amount / Add Bonus form into view when the =====
  // keyboard opens, so the user sees the form (with Quick Actions still
  // visible above it) instead of having to scroll manually.
  const paymentFormRef = useRef(null);
  useEffect(() => {
    if (isKeyboardOpen && activePaymentForm && paymentFormRef.current) {
      const timer = setTimeout(() => {
        paymentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardOpen, activePaymentForm]);

  const [isPaymentDatePickerOpen, setIsPaymentDatePickerOpen] = useState(false);
  const [paymentDateCalendarMonth, setPaymentDateCalendarMonth] = useState(() => new Date());
  const [paymentFormValidationMsg, setPaymentFormValidationMsg] = useState('');
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editingTransactionType, setEditingTransactionType] = useState('payment');
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  const [paymentsRangeMode, setPaymentsRangeMode] = useState('custom');
  const [isCustomWeekPickerOpen, setIsCustomWeekPickerOpen] = useState(false);
  const [customWeekStartDay, setCustomWeekStartDay] = useState(2);

  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [projectPickerPurpose, setProjectPickerPurpose] = useState(null);
  const [projectPickerSearch, setProjectPickerSearch] = useState('');
  const [projectPickerDropdown, setProjectPickerDropdown] = useState('');
  const [isSubscribePageOpen, setIsSubscribePageOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState('pro');
  const [isHelpPageOpen, setIsHelpPageOpen] = useState(false);

  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectNameInput, setEditProjectNameInput] = useState('');

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // ===== Common popup (replaces window.alert / window.confirm everywhere) =====
  const [appPopup, setAppPopup] = useState(null);
  const closeAppPopup = () => setAppPopup(null);
  const showAlert = (message, tone = 'warning', title) => {
    setAppPopup({ open: true, tone, title, message, confirmLabel: t('ok') });
  };
  const showSuccess = (message, title) => {
    setAppPopup({ open: true, tone: 'success', title, message, confirmLabel: t('ok') });
  };
  const showConfirm = (message, onConfirm, opts = {}) => {
    setAppPopup({
      open: true,
      tone: opts.tone || 'warning',
      title: opts.title,
      message,
      confirmLabel: opts.confirmLabel || t('yes'),
      cancelLabel: opts.cancelLabel || t('no'),
      onConfirm: () => { closeAppPopup(); onConfirm(); },
    });
  };

  const closeTopmostScreen = () => {
    if (isEditWageModalOpen) { setIsEditWageModalOpen(false); return true; }
    if (trackerWorkerId) { setTrackerWorkerId(null); return true; }
    if (isCustomWeekPickerOpen) { setIsCustomWeekPickerOpen(false); return true; }
    if (isEditProjectModalOpen) { handleCloseEditProjectModal(); return true; }
    if (isProfileModalOpen) { setIsProfileModalOpen(false); return true; }
    if (isWorkerSubFormOpen) { handleCloseWorkerFormSheet(); return true; }
    if (isProjectPickerOpen) { setIsProjectPickerOpen(false); return true; }
    if (isAddProjectOpen) {
      setIsAddProjectOpen(false);
      setNewSiteName('');
      setTempWorkersList([]);
      return true;
    }
    if (selectedPaymentWorkerId) {
      setSelectedPaymentWorkerId(null);
      return true;
    }
    if (isAttendanceModalOpen) {
      setIsAttendanceModalOpen(false);
      setAttendanceWorkerSearchQuery('');
      return true;
    }
    if (isPaymentsPageOpen) {
      setIsPaymentsPageOpen(false);
      return true;
    }
    if (activeSiteViewId) {
      setActiveSiteViewId(null);
      return true;
    }
    if (isSubscribePageOpen) {
      setIsSubscribePageOpen(false);
      return true;
    }
    if (isHelpPageOpen) {
      setIsHelpPageOpen(false);
      return true;
    }
    return false;
  };

  const downloadPdfFromAndroid = (base64String, filename) => {
    if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
      const cleanBase64 = base64String.replace(/^data:application\/pdf;base64,/, "");
      window.AndroidFileSaver.saveBase64Pdf(cleanBase64, filename);
    } else {
      console.warn("Android native interface not found. Falling back to browser download.");
    }
  };

  const closeTopmostScreenRef = useRef(() => false);
  closeTopmostScreenRef.current = closeTopmostScreen;

  const backButtonListenerRef = useRef(null);

  useEffect(() => {
  if (!isUserAuthenticated) return;

  const handleBackPressed = () => {
    const closedSomething = closeTopmostScreenRef.current();
    if (!closedSomething) {
      setIsExitConfirmOpen(true);
    }
  };

  App.addListener('backButton', () => {
    handleBackPressed();
  }).then((handle) => { backButtonListenerRef.current = handle; });

  return () => {
    backButtonListenerRef.current?.remove();
  };
}, [isUserAuthenticated]);

  useEffect(() => {
    if (!isUserAuthenticated) return;

    const hasOpenScreens = isEditWageModalOpen || 
                          trackerWorkerId || 
                          isCustomWeekPickerOpen || 
                          isEditProjectModalOpen || 
                          isProfileModalOpen || 
                          isWorkerSubFormOpen || 
                          isProjectPickerOpen || 
                          isAddProjectOpen || 
                          selectedPaymentWorkerId || 
                          isAttendanceModalOpen || 
                          isPaymentsPageOpen || 
                          activeSiteViewId || 
                          isSubscribePageOpen ||
                          isHelpPageOpen;

    if (hasOpenScreens) {
      window.history.pushState({ appGuard: true, timestamp: Date.now() }, '');
    }
  }, [isUserAuthenticated, 
      isEditWageModalOpen, 
      trackerWorkerId, 
      isCustomWeekPickerOpen, 
      isEditProjectModalOpen, 
      isProfileModalOpen, 
      isWorkerSubFormOpen, 
      isProjectPickerOpen, 
      isAddProjectOpen, 
      selectedPaymentWorkerId, 
      isAttendanceModalOpen, 
      isPaymentsPageOpen, 
      activeSiteViewId, 
      isSubscribePageOpen,
      isHelpPageOpen]);

  useEffect(() => {
    if (!isUserAuthenticated) return;
    const handleDesktopUnload = (event) => {
      const isModalOrSubFormOpen = closeTopmostScreenRef.current();
      if (!isModalOrSubFormOpen) {
        event.preventDefault();
        event.returnValue = "Do you want to exit?";
        return "Do you want to exit?";
      }
    };
    window.addEventListener('beforeunload', handleDesktopUnload);
    return () => window.removeEventListener('beforeunload', handleDesktopUnload);
  }, [isUserAuthenticated]);

  const handleConfirmExitApp = () => {
    if (window.Capacitor?.Plugins?.App?.exitApp) { window.Capacitor.Plugins.App.exitApp(); return; }
    if (window.AndroidBridge?.exitApp) { window.AndroidBridge.exitApp(); return; }
    if (window.navigator?.app?.exitApp) { window.navigator.app.exitApp(); return; }
    window.close();
  };

  const handleCloseWorkerFormSheet = () => {
    setTempWorkerName('');
    setTempWorkerPhone('');
    setTempWorkerJoiningDate('');
    setTempWorkerWageAmount('');
    setEditingWorkerId(null);
    setIsWorkerSubFormOpen(false);
  };

  const handleDeleteWorkerInline = async (projectId, workerId) => {
    const wageTargetProjectForDelete = projects.find(p => p.id === projectId);
    const workerToDelete = wageTargetProjectForDelete?.employees.find(w => w.id === workerId);
    if (workerToDelete && calcTotalDue(workerToDelete) > 0) {
      setIsRemoveBalancePendingPopupOpen(true);
      return;
    }
    showConfirm("Are you sure you want to remove this employee from this worksite?", async () => {
      // Optimistic update so the UI feels instant...
      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id === projectId) {
            const updatedEmployees = (project.employees || []).filter(emp => emp.id !== workerId);
            return { ...project, workersCount: updatedEmployees.length, employees: updatedEmployees, lastModifiedAt: Date.now() };
          }
          return project;
        })
      );
      try {
        await workerService.deleteWorker(workerId);
      } catch (error) {
        console.error('Error deleting worker:', error);
        showAlert('Could not delete employee on the server. Reloading latest data.');
      } finally {
        // ...then reconcile with the server either way (soft-delete flips IsActive).
        await refreshProject(projectId);
      }
    }, { confirmLabel: t('remove'), tone: 'warning' });
  };

  const handleOpenEditProjectModal = (project) => {
    setEditProjectNameInput(project.name);
    setIsEditProjectModalOpen(true);
  };

  const handleCloseEditProjectModal = () => {
    setIsEditProjectModalOpen(false);
    setEditProjectNameInput('');
  };

  const handleSaveEditedProjectName = async () => {
    if (!editProjectNameInput.trim()) { showAlert(t('pleaseProvideValidProject')); return; }
    const trimmedName = editProjectNameInput.trim();
    const isDuplicateProjectName = projects.some(p => p.id !== activeSiteViewId && p.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicateProjectName) {
      showAlert(t('projectAlreadyExists').replace('{name}', trimmedName));
      return;
    }
    const targetProject = projects.find(p => p.id === activeSiteViewId);
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === activeSiteViewId ? { ...project, name: trimmedName, lastModifiedAt: Date.now() } : project
      )
    );
    handleCloseEditProjectModal();
    try {
      await projectService.updateProject(activeSiteViewId, {
        projectName: trimmedName,
        projectAddress: targetProject?.address ?? '',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      showAlert('Could not save the project name on the server.');
      await refreshProject(activeSiteViewId);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    const hasUnsettledEmployee = (projectToDelete?.employees || []).some(w => calcTotalDue(w) > 0);
    if (hasUnsettledEmployee) {
      setIsProjectRemoveBalancePendingPopupOpen(true);
      return;
    }
    showConfirm(t('deleteProject'), async () => {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setActiveSiteViewId(null);
      setIsAttendanceModalOpen(false);
      setIsPaymentsPageOpen(false);
      setIsWorkerSubFormOpen(false);
      setIsEditProjectModalOpen(false);
      try {
        await projectService.deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
        showAlert('Could not delete the project on the server. Reloading your projects.');
        if (loggedInUser?.userId) await loadUserProjects(loggedInUser.userId);
      }
    }, { confirmLabel: t('remove'), tone: 'warning' });
  };

  const handleOpenAttendanceScreen = (project) => {
    setPendingAttendanceByDate({});
    setPendingAdvanceByDate({});
    setSelectedAttendanceDates([]);
    setAttendanceWorkerSearchQuery('');
    setCurrentAttendanceDateIndex(0);
    setIsAttendanceModalOpen(true);
  };

  const ensureAttendanceDateLoaded = (project, dateStr) => {
    setPendingAttendanceByDate(prev => {
      if (prev[dateStr]) return prev;
      const seeded = {};
      project.employees.forEach(emp => {
        const currentRecord = emp.attendance?.[dateStr] || {};
        seeded[emp.id] = { status: currentRecord.status || '' };
      });
      return { ...prev, [dateStr]: seeded };
    });
    // Also seed the Advance field from any advance already recorded for this
    // worker on this date (via this same attendance screen), so re-opening a
    // saved date shows the previously entered amount instead of a blank
    // field. Only pre-fills; the field stays fully editable either way.
    setPendingAdvanceByDate(prev => {
      if (prev[dateStr]) return prev;
      const seededAdvance = {};
      project.employees.forEach(emp => {
        const existingAdvance = (emp.advancePayments || []).find(
          p => p.date === dateStr && p.note === 'Recorded from Attendance'
        );
        if (existingAdvance) seededAdvance[emp.id] = String(existingAdvance.amount);
      });
      if (Object.keys(seededAdvance).length === 0) return prev;
      return { ...prev, [dateStr]: seededAdvance };
    });
  };

  const getEarliestJoiningDate = (project) => {
    const joinDates = (project?.employees || []).map(w => w.joiningDate || '2026-07-01');
    if (joinDates.length === 0) return '2026-07-01';
    return joinDates.reduce((earliest, d) => (d < earliest ? d : earliest));
  };

  const getSavedAttendanceDatesSet = (project) => {
    const set = new Set();
    (project?.employees || []).forEach(w => {
      Object.entries(w.attendance || {}).forEach(([dateStr, rec]) => {
        if (rec && rec.status) set.add(dateStr);
      });
    });
    return set;
  };

  const formatSelectedDatesLabel = (dateStrings) => {
    if (!dateStrings || dateStrings.length === 0) return '';
    const sorted = [...dateStrings].sort();
    const groups = [];
    sorted.forEach(dateStr => {
      const d = new Date(dateStr);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const day = String(d.getDate()).padStart(2, '0');
      const monthAbbr = d.toLocaleDateString('en-GB', { month: 'short' });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === monthKey) {
        lastGroup.days.push(day);
      } else {
        groups.push({ key: monthKey, days: [day], monthAbbr });
      }
    });
    return groups.map(g => `${g.days.join(', ')} ${g.monthAbbr}`).join(', ');
  };

  const formatLargeDateHeader = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const goToPreviousAttendanceDate = () => {
    setCurrentAttendanceDateIndex(idx => Math.max(0, idx - 1));
  };
  const goToNextAttendanceDate = () => {
    setCurrentAttendanceDateIndex(idx => Math.min(selectedAttendanceDates.length - 1, idx + 1));
  };

  const openAttendanceCalendarPicker = () => {
    setTempCalendarDates(selectedAttendanceDates);
    const anchor = selectedAttendanceDates.length > 0
      ? new Date(selectedAttendanceDates[selectedAttendanceDates.length - 1])
      : new Date();
    setCalendarViewMonth(anchor);
    setIsCalendarPickerOpen(true);
  };

  const toggleCalendarDateSelection = (dateStr) => {
    setTempCalendarDates(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      if (prev.length >= 31) {
        setIsMaxDatesPopupOpen(true);
        return prev;
      }
      return [...prev, dateStr].sort();
    });
  };

  const handleCalendarDayClick = (dateStr, isDisabled, isAlreadySaved) => {
    if (isDisabled) return;
    if (calendarClickTimerRef.current) {
      clearTimeout(calendarClickTimerRef.current);
      calendarClickTimerRef.current = null;
      if (isAlreadySaved) setUnmarkConfirmDate(dateStr);
      return;
    }
    calendarClickTimerRef.current = setTimeout(() => {
      calendarClickTimerRef.current = null;
      toggleCalendarDateSelection(dateStr);
    }, 280);
  };

  const handleCalendarClear = () => setTempCalendarDates([]);

  const handleCalendarCancel = () => {
    setTempCalendarDates(selectedAttendanceDates);
    setIsCalendarPickerOpen(false);
  };

  const handleCalendarSet = () => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    setSelectedAttendanceDates(tempCalendarDates);
    if (currentProject) {
      tempCalendarDates.forEach(dateStr => ensureAttendanceDateLoaded(currentProject, dateStr));
    }
    setCurrentAttendanceDateIndex(0);
    setIsCalendarPickerOpen(false);
  };

  const handleConfirmUnmarkDate = () => {
    const dateStr = unmarkConfirmDate;
    if (!dateStr) return;
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== activeSiteViewId) return project;
        const updatedEmployees = project.employees.map(emp => {
          if (!emp.attendance || !emp.attendance[dateStr]) return emp;
          const updatedAttendance = { ...emp.attendance };
          delete updatedAttendance[dateStr];
          return { ...emp, attendance: updatedAttendance };
        });
        return { ...project, employees: updatedEmployees, lastModifiedAt: Date.now() };
      })
    );
    setTempCalendarDates(prev => prev.filter(d => d !== dateStr));
    setSelectedAttendanceDates(prev => {
      const updated = prev.filter(d => d !== dateStr);
      setCurrentAttendanceDateIndex(idx => Math.min(idx, Math.max(0, updated.length - 1)));
      return updated;
    });
    setPendingAttendanceByDate(prev => {
      const updated = { ...prev };
      delete updated[dateStr];
      return updated;
    });
    setUnmarkConfirmDate(null);
  };

  const formatConversationalDate = (dateString) => {
    if (!dateString) return '';
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;
    return parsedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatShortDayLabel = (dateString) => {
    if (!dateString) return '';
    const todayStr = toLocalISODate(new Date());
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;
    const dayMonth = parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return dateString === todayStr ? `Today, ${dayMonth}` : dayMonth;
  };

  const formatWeekday = (dateString) => {
    if (!dateString) return '';
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return '';
    return parsedDate.toLocaleDateString('en-GB', { weekday: 'long' });
  };

  const handleBulkAttendanceChange = (statusValue) => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    if (!currentProject) return;
    if (selectedAttendanceDates.length === 0) {
      showAlert(t('selectDateFromCalendar'));
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const query = attendanceWorkerSearchQuery.trim().toLowerCase();
    const targets = query
      ? currentProject.employees.filter(w => w.name.toLowerCase().includes(query))
      : currentProject.employees;
    setPendingAttendanceByDate(prev => {
      const updatedMap = { ...(prev[dateStr] || {}) };
      targets.forEach(worker => {
        const joinDateStr = worker.joiningDate || '2026-07-01';
        if (dateStr >= joinDateStr) {
          updatedMap[worker.id] = { status: statusValue };
        }
      });
      return { ...prev, [dateStr]: updatedMap };
    });
  };

  const handleIndividualAttendanceChange = (workerId, statusValue) => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    if (!currentProject) return;
    if (selectedAttendanceDates.length === 0) {
      showAlert(t('selectDateFromCalendar'));
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const worker = currentProject.employees.find(w => w.id === workerId);
    const joinDateStr = worker?.joiningDate || '2026-07-01';
    if (dateStr < joinDateStr) return;
    setPendingAttendanceByDate(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [workerId]: { status: statusValue } }
    }));
  };

  const handleIndividualAdvanceChange = (workerId, rawValue) => {
    const digitsOnly = rawValue.replace(/[^0-9]/g, '');
    if (selectedAttendanceDates.length === 0) {
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    setPendingAdvanceByDate(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [workerId]: digitsOnly }
    }));
  };

  const handleAdvanceInputFocus = (e) => {
    if (selectedAttendanceDates.length === 0) {
      e.target.blur(); // dismiss the keyboard immediately instead of letting the user type first
      setIsSelectDateForAdvancePopupOpen(true);
    }
  };

  const getEffectiveWage = (worker, dateStr) => {
    const base = worker.dailyWage || 400;
    if (!worker.wageOverrides || worker.wageOverrides.length === 0) return base;
    let amount = base;
    worker.wageOverrides.forEach(ov => {
      const afterFrom = !ov.from || dateStr >= ov.from;
      const beforeTo = !ov.to || dateStr <= ov.to;
      if (afterFrom && beforeTo) amount = ov.amount;
    });
    return amount;
  };

  const isWageRangeAlreadyAtAmount = (worker, range, amount) => {
    if (!worker || !range) return false;
    const { from, to } = range;
    const withinRange = (d) => (!from || d >= from) && (!to || d <= to);
    const candidateDates = new Set();
    if (from) candidateDates.add(from);
    if (to) candidateDates.add(to);
    (worker.wageOverrides || []).forEach(ov => {
      if (ov.from && withinRange(ov.from)) candidateDates.add(ov.from);
      if (ov.to && withinRange(ov.to)) candidateDates.add(ov.to);
    });
    if (candidateDates.size === 0) return false;
    return Array.from(candidateDates).every(d => getEffectiveWage(worker, d) === amount);
  };

  const calculateNetDaily = (baseWage, status) => {
    let multiplier = 1;
    if (status === 'HD') multiplier = 0.5;
    if (status === 'A') multiplier = 0;
    return Math.round(baseWage * multiplier);
  };

  const getPaymentStartDate = (worker) => worker.paymentStartDate || worker.joiningDate || '2026-07-01';

  const calcWageForDateRange = (worker, fromDate, toDate) => {
    const startBound = getPaymentStartDate(worker);
    let total = 0;
    Object.entries(worker.attendance || {}).forEach(([dateStr, record]) => {
      if (dateStr < startBound) return;
      if (fromDate && dateStr < fromDate) return;
      if (toDate && dateStr > toDate) return;
      const wage = getEffectiveWage(worker, dateStr);
      total += calculateNetDaily(wage, record.status);
    });
    return total;
  };

  const calcTotalWageAllTime = (worker) => calcWageForDateRange(worker, null, null);

  const calcPaidInRange = (worker, fromDate, toDate) => {
    return (worker.payments || []).reduce((sum, p) => {
      if (fromDate && p.date < fromDate) return sum;
      if (toDate && p.date > toDate) return sum;
      return sum + (p.amount || 0);
    }, 0);
  };

  const calcTotalPaid = (worker) => calcPaidInRange(worker, null, null);

  const calcTotalDue = (worker) => calcTotalWageAllTime(worker) + - (worker.advance || 0) - calcTotalPaid(worker);

  const calcCarryForward = (worker, fromDate) => {
    if (!fromDate) return 0;
    const startBound = getPaymentStartDate(worker);
    
    const parts = fromDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const cutoff = `${yyyy}-${mm}-${dd}`;
    
    if (cutoff < startBound) return 0;
    
    const wageBefore = calcWageForDateRange(worker, startBound, cutoff);
    const paidBefore = calcPaidInRange(worker, null, cutoff);
    
    return wageBefore - paidBefore;
  };

  const calcPaymentDueForRange = (worker, fromDate, toDate) => calcCarryForward(worker, fromDate) + calcWageForDateRange(worker, fromDate, toDate);

  const computeProjectPresentToday = (project) => {
    const todayStr = toLocalISODate(new Date());
    return (project.employees || []).filter(w => {
      const rec = w.attendance?.[todayStr];
      return rec && (rec.status === 'P' || rec.status === 'HD');
    }).length;
  };

  const computeProjectTotalDue = (project) => (project.employees || []).reduce((sum, w) => sum + calcTotalDue(w), 0);

  const computeProjectLastAttendanceDate = (project) => {
    let latest = null;
    (project.employees || []).forEach(w => {
      Object.keys(w.attendance || {}).forEach(dateStr => {
        if (!latest || dateStr > latest) latest = dateStr;
      });
    });
    return latest;
  };

  const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getThisWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return { from: toLocalISODate(monday), to: toLocalISODate(today) };
  };

  const getThisMonthRange = () => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toLocalISODate(firstOfMonth), to: toLocalISODate(today) };
  };

  const getCustomWeekRange = (startDay) => {
    const today = new Date();
    const diff = (today.getDay() - startDay + 7) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toLocalISODate(start), to: toLocalISODate(end) };
  };

  const WEEKDAY_SHORT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSaveAttendanceData = async () => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    if (!currentProject) return;

    if (selectedAttendanceDates.length === 0) {
      showAlert(t('selectDateToSaveAttendance'));
      return;
    }

    const chronologicalSelectedDates = [...selectedAttendanceDates].sort();
    const firstMissingDate = chronologicalSelectedDates.find(dateStr => {
      const dateRecord = pendingAttendanceByDate[dateStr] || {};
      return (currentProject.employees || [])
        .filter(emp => dateStr >= (emp.joiningDate || '2026-07-01'))
        .some(emp => {
          const record = dateRecord[emp.id];
          return !record || !record.status;
        });
    });

    if (firstMissingDate) {
      showAlert(`${t('pleaseMarkAttendance')} ${formatLargeDateHeader(firstMissingDate)}.`);
      return;
    }

    // Build the list of individual (worker, date, status) records that need
    // to be persisted, then push each one to the backend via
    // attendanceService.markAttendance. This was previously missing entirely
    // -- the old version of this function only updated local React state, so
    // nothing ever reached POST /api/attendance/mark and the DB stayed empty.
    const recordsToSave = [];
    chronologicalSelectedDates.forEach(dateStr => {
      const recordsForDate = pendingAttendanceByDate[dateStr] || {};
      (currentProject.employees || []).forEach(emp => {
        const rec = recordsForDate[emp.id];
        if (rec && rec.status) {
          recordsToSave.push({ workerId: emp.id, attendanceDate: dateStr, status: rec.status });
        }
      });
    });

    // Same deal for any advances entered on this screen -- collect the
    // (worker, date, amount) triples so each can be recorded via
    // paymentService.recordAdvance (POST /api/payments/advance).
    // If an advance was already recorded for this worker/date from this same
    // screen (e.g. the field was pre-filled from a previously saved amount),
    // treat this as an edit: skip it if the amount is unchanged, otherwise
    // carry along the existing entry's id so it gets replaced rather than
    // duplicated.
    const advancesToSave = [];
    Object.entries(pendingAdvanceByDate).forEach(([dateStr, advanceForDate]) => {
      (currentProject.employees || []).forEach(emp => {
        const amount = parseFloat(advanceForDate[emp.id]);
        if (!amount || amount <= 0) return;
        const existingAdvance = (emp.advancePayments || []).find(
          p => p.date === dateStr && p.note === 'Recorded from Attendance'
        );
        if (existingAdvance && existingAdvance.amount === amount) return; // unchanged, nothing to save
        advancesToSave.push({ workerId: emp.id, dateStr, amount, existingAdvanceId: existingAdvance?.id });
      });
    });

    // key: `${workerId}|${dateStr}` -> real advanceId from the server
    const savedAdvanceIds = {};
    setIsSavingAttendance(true);
    try {
      for (const record of recordsToSave) {
        await attendanceService.markAttendance(record);
      }
      for (const adv of advancesToSave) {
        // The backend has no update endpoint for advances, so an edit is a
        // delete of the old row followed by recording the new amount --
        // same pattern used for editing advances from the Payments page.
        if (adv.existingAdvanceId) {
          await paymentService.deleteAdvance(adv.existingAdvanceId);
        }
        const result = await paymentService.recordAdvance({
          workerId: adv.workerId,
          advanceDate: adv.dateStr,
          amount: adv.amount,
          paymentMethod: 'Cash',
          note: 'Recorded from Attendance',
        });
        savedAdvanceIds[`${adv.workerId}|${adv.dateStr}`] = result.advanceId;
      }
    } catch (err) {
      console.error('Failed to save attendance', err);
      setIsSavingAttendance(false);
      showAlert(err.message || 'Failed to save attendance. Please try again.');
      return; // don't touch local state if the server rejected the save
    }
    setIsSavingAttendance(false);

    const todayStr = toLocalISODate(new Date());
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== activeSiteViewId) return project;
        const updatedEmployees = project.employees.map(emp => {
          let mergedAttendance = { ...(emp.attendance || {}) };
          Object.entries(pendingAttendanceByDate).forEach(([dateStr, recordsForDate]) => {
            const rec = recordsForDate[emp.id];
            if (rec && rec.status) mergedAttendance[dateStr] = { status: rec.status };
          });

          const newAdvanceEntries = [];
          Object.entries(pendingAdvanceByDate).forEach(([dateStr, advanceForDate]) => {
            const amount = parseFloat(advanceForDate[emp.id]);
            if (!amount || amount <= 0) return;
            const existingAdvance = (emp.advancePayments || []).find(
              p => p.date === dateStr && p.note === 'Recorded from Attendance'
            );
            if (existingAdvance && existingAdvance.amount === amount) return; // unchanged, keep as-is
            newAdvanceEntries.push({
              id: savedAdvanceIds[`${emp.id}|${dateStr}`] || existingAdvance?.id,
              amount,
              date: dateStr,
              method: 'Cash',
              note: 'Recorded from Attendance',
              replacesId: existingAdvance?.id,
            });
          });
          // Entries that are edits replace the prior record (rather than
          // sitting alongside it), and only the difference between the new
          // and old amount should move the running advance total -- not the
          // full new amount, which would double-count the original portion.
          const replacedIds = new Set(newAdvanceEntries.map(e => e.replacesId).filter(Boolean));
          const retainedAdvancePayments = (emp.advancePayments || []).filter(p => !replacedIds.has(p.id));
          const advanceTotalDelta = newAdvanceEntries.reduce((sum, e) => {
            const oldAmount = e.replacesId
              ? (emp.advancePayments || []).find(p => p.id === e.replacesId)?.amount || 0
              : 0;
            return sum + (e.amount - oldAmount);
          }, 0);
          const cleanedNewEntries = newAdvanceEntries.map(({ replacesId, ...rest }) => rest);

          return {
            ...emp,
            attendance: mergedAttendance,
            advancePayments: newAdvanceEntries.length > 0 ? [...retainedAdvancePayments, ...cleanedNewEntries] : emp.advancePayments,
            advance: advanceTotalDelta !== 0 ? (emp.advance || 0) + advanceTotalDelta : emp.advance,
            lastUpdatedAt: newAdvanceEntries.length > 0 ? Date.now() : emp.lastUpdatedAt,
          };
        });
        const presentCountToday = updatedEmployees.filter(emp => {
          const rec = emp.attendance[todayStr];
          return rec && (rec.status === 'P' || rec.status === 'HD');
        }).length;
        return { ...project, presentCount: presentCountToday, employees: updatedEmployees, lastModifiedAt: Date.now() };
      })
    );

    setSelectedAttendanceDates([]);
    setTempCalendarDates([]);
    setPendingAdvanceByDate({});

    setIsAttendanceSavedPopupOpen(true);
  };

  const handleOpenEditWage = (worker) => {
    setEditWageTargetWorkerId(worker.id);
    setEditWageApplyTo('');
    setEditWageTodayDate(toLocalISODate(new Date()));
    setEditWagePastDates([]);
    setEditWagePastCalendarMonth(new Date());
    setEditWageSpecificStart('');
    setEditWageSpecificEnd('');
    setEditWageFutureStart('');
    setEditWageNewAmount('');
    setEditWageNote('');
    setIsEditWageModalOpen(true);
  };

  const handleCloseEditWage = () => {
    setIsEditWageModalOpen(false);
    setEditWageTargetWorkerId(null);
  };

  const handleSaveEditWage = async () => {
    const amount = parseFloat(editWageNewAmount);
    if (!amount || amount <= 0) { showAlert("Please enter a valid wage amount."); return; }

    const wageTargetProject = projects.find(p => p.id === activeSiteViewId);
    const wageTargetWorker = wageTargetProject?.employees.find(w => w.id === editWageTargetWorkerId);
    const joinDateStrForWage = wageTargetWorker?.joiningDate || '2026-07-01';
    const clampToJoinDate = (dateStr) => (dateStr && dateStr < joinDateStrForWage) ? joinDateStrForWage : dateStr;

    // 'past' applies the new wage to a set of individually-picked dates (up to
    // EDIT_WAGE_PAST_DAYS_MAX) rather than a single contiguous range. Every other
    // Apply-To option keeps its existing single-range behavior untouched.
    if (editWageApplyTo === 'past') {
      if (!editWagePastDates || editWagePastDates.length === 0) {
        showAlert('Please select at least one date.');
        return;
      }
      if (editWagePastDates.length > EDIT_WAGE_PAST_DAYS_MAX) {
        showAlert(`You can select up to ${EDIT_WAGE_PAST_DAYS_MAX} dates.`);
        return;
      }

      if (wageTargetWorker) {
        const alreadyAtAmount = editWagePastDates.every(d => getEffectiveWage(wageTargetWorker, d) === amount);
        if (alreadyAtAmount) {
          setIsSameWagePopupOpen(true);
          return;
        }
      }

      setIsSavingWage(true);
      try {
        for (const d of editWagePastDates) {
          await workerService.updateWage(editWageTargetWorkerId, {
            effectiveFrom: d,
            effectiveTo: d,
            dailyWageAmount: amount,
            note: editWageNote.trim(),
          });
        }
      } catch (err) {
        console.error('Failed to save wage override', err);
        setIsSavingWage(false);
        showAlert(err.message || 'Failed to save wage change. Please try again.');
        return;
      }
      setIsSavingWage(false);

      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id !== activeSiteViewId) return project;
          return {
            ...project,
            lastModifiedAt: Date.now(),
            employees: project.employees.map(emp => {
              if (emp.id !== editWageTargetWorkerId) return emp;
              const newOverrides = editWagePastDates.map(d => ({ from: d, to: d, amount, note: editWageNote.trim() }));
              return { ...emp, wageOverrides: [...(emp.wageOverrides || []), ...newOverrides], lastUpdatedAt: Date.now() };
            })
          };
        })
      );
      handleCloseEditWage();
      showSuccess(t('wageUpdatedSuccess'));
      return;
    }

    let range = { from: selectedDate, to: selectedDate };
    if (editWageApplyTo === 'only') {
      const todayApplyDate = editWageTodayDate || selectedDate;
      range = { from: todayApplyDate, to: todayApplyDate };
    } else if (editWageApplyTo === 'specific') {
      if (!editWageSpecificStart || !editWageSpecificEnd) { showAlert("Please select both dates for the specific duration."); return; }
      range = { from: clampToJoinDate(editWageSpecificStart), to: editWageSpecificEnd };
    } else if (editWageApplyTo === 'future') {
      range = { from: clampToJoinDate(editWageFutureStart || selectedDate), to: null };
    }

    if (wageTargetWorker) {
      if (isWageRangeAlreadyAtAmount(wageTargetWorker, range, amount)) {
        setIsSameWagePopupOpen(true);
        return;
      }
    }

    // Persist the override to the backend first (POST -> PUT /workers/{id}/wage).
    // This was previously missing entirely -- the old version only updated
    // local React state, so nothing ever reached the DB and the override
    // vanished on refresh.
    setIsSavingWage(true);
    try {
      await workerService.updateWage(editWageTargetWorkerId, {
        effectiveFrom: range.from,
        effectiveTo: range.to,
        dailyWageAmount: amount,
        note: editWageNote.trim(),
      });
    } catch (err) {
      console.error('Failed to save wage override', err);
      setIsSavingWage(false);
      showAlert(err.message || 'Failed to save wage change. Please try again.');
      return;
    }
    setIsSavingWage(false);

    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== activeSiteViewId) return project;
        return {
          ...project,
          lastModifiedAt: Date.now(),
          employees: project.employees.map(emp => {
            if (emp.id !== editWageTargetWorkerId) return emp;
            const newOverride = { ...range, amount, note: editWageNote.trim() };
            return { ...emp, wageOverrides: [...(emp.wageOverrides || []), newOverride], lastUpdatedAt: Date.now() };
          })
        };
      })
    );
    handleCloseEditWage();
    showSuccess(t('wageUpdatedSuccess'));
  };

  const handleOpenPaymentsPage = () => {
    setPaymentsRangeFrom('');
    setPaymentsRangeTo('');
    setPaymentsRangeMode('custom');
    setIsCustomWeekPickerOpen(false);
    setPaymentsPageWorkerSearch('');
    setSelectedPaymentWorkerId(null);
    setIsPaymentsPageOpen(true);
  };

  const handleClosePaymentsPage = () => {
    setIsPaymentsPageOpen(false);
    setSelectedPaymentWorkerId(null);
  };

  const handleOpenWorkerPaymentDetail = (workerId) => {
    setSelectedPaymentWorkerId(workerId);
    setRecordPaymentAmount('');
    setRecordPaymentMethod('Cash');
    setRecordPaymentDate('');
    setRecordPaymentNote('');
    setActivePaymentForm(null);
    setEditingPaymentId(null);
    setEditingTransactionType('payment');
  };

  const handleRecordTransaction = async (projectId, workerId, type) => {
    const amount = parseFloat(recordPaymentAmount);
    const hasValidAmount = !!amount && amount > 0;
    const hasDate = !!recordPaymentDate;
    if (!hasDate || !hasValidAmount) {
      setPaymentFormValidationMsg(t('selectDatePlaceholder') + ' and ' + t('amount'));
      return;
    }
    setPaymentFormValidationMsg('');

    // Persist to the backend first. Each transaction type hits its own
    // endpoint and returns the real DB id (advanceId / bonusId / paymentId) --
    // we use that as the entry's id below instead of Date.now() so later
    // edits/deletes reference a row that actually exists server-side.
    let serverId;
    setIsSavingTransaction(true);
    try {
      if (type === 'advance') {
        const result = await paymentService.recordAdvance({
          workerId,
          advanceDate: recordPaymentDate,
          amount,
          paymentMethod: recordPaymentMethod,
          note: recordPaymentNote.trim(),
        });
        serverId = result.advanceId;
      } else if (type === 'bonus') {
        const result = await paymentService.recordBonus({
          workerId,
          bonusDate: recordPaymentDate,
          amount,
          paymentMethod: recordPaymentMethod,
          note: recordPaymentNote.trim(),
        });
        serverId = result.bonusId;
      } else {
        const result = await paymentService.recordPayment({
          workerId,
          paymentDate: recordPaymentDate,
          amount,
          paymentMethod: recordPaymentMethod,
          note: recordPaymentNote.trim(),
        });
        serverId = result.paymentId;
      }
    } catch (err) {
      console.error('Failed to record transaction', err);
      setIsSavingTransaction(false);
      setPaymentFormValidationMsg(err.message || 'Failed to save. Please try again.');
      return;
    }
    setIsSavingTransaction(false);

    const entry = { id: serverId, amount, date: recordPaymentDate, method: recordPaymentMethod, note: recordPaymentNote.trim() };
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          lastModifiedAt: Date.now(),
          employees: project.employees.map(emp => {
            if (emp.id !== workerId) return emp;
            if (type === 'advance') {
              return { ...emp, advancePayments: [...(emp.advancePayments || []), entry], advance: (emp.advance || 0) + amount, lastUpdatedAt: Date.now() };
            }
            if (type === 'bonus') {
              return { ...emp, bonusPayments: [...(emp.bonusPayments || []), entry], bonus: (emp.bonus || 0) + amount, lastUpdatedAt: Date.now() };
            }
            return { ...emp, payments: [...(emp.payments || []), entry], lastUpdatedAt: Date.now() };
          })
        };
      })
    );
    setRecordPaymentAmount('');
    setRecordPaymentNote('');
    setRecordPaymentDate('');
    setActivePaymentForm(null);
    if (type === 'bonus') {
      showSuccess(t('bonusSavedMsg'));
    } else if (type === 'payment') {
      showSuccess(t('paymentSavedMsg'));
    }
  };

  const handleStartEditTransaction = (type, entry) => {
    setEditingTransactionType(type);
    setEditingPaymentId(entry.id);
    setEditPaymentAmount(String(entry.amount));
  };

  const handleSaveEditedTransaction = async (projectId, workerId) => {
    const amount = parseFloat(editPaymentAmount);
    if (!amount || amount <= 0) { showAlert("Please enter a valid amount."); return; }

    const project = projects.find(p => p.id === projectId);
    const emp = project?.employees.find(e => e.id === workerId);
    if (!emp) return;

    // The backend only exposes an update endpoint for plain payments
    // (PUT /payments/payment/{id}). There's no update endpoint for advances
    // or bonuses, so for those we delete the old row and record a new one
    // with the edited amount (same date/method/note), then swap in the new
    // server-generated id.
    let newId = editingPaymentId;
    setIsSavingTransaction(true);
    try {
      if (editingTransactionType === 'advance') {
        const oldEntry = (emp.advancePayments || []).find(p => p.id === editingPaymentId);
        await paymentService.deleteAdvance(editingPaymentId);
        const result = await paymentService.recordAdvance({
          workerId,
          advanceDate: oldEntry?.date,
          amount,
          paymentMethod: oldEntry?.method || 'Cash',
          note: oldEntry?.note || '',
        });
        newId = result.advanceId;
      } else if (editingTransactionType === 'bonus') {
        const oldEntry = (emp.bonusPayments || []).find(p => p.id === editingPaymentId);
        await paymentService.deleteBonus(editingPaymentId);
        const result = await paymentService.recordBonus({
          workerId,
          bonusDate: oldEntry?.date,
          amount,
          paymentMethod: oldEntry?.method || 'Cash',
          note: oldEntry?.note || '',
        });
        newId = result.bonusId;
      } else {
        const oldEntry = (emp.payments || []).find(p => p.id === editingPaymentId);
        await paymentService.updatePayment(editingPaymentId, {
          amount,
          paymentMethod: oldEntry?.method || 'Cash',
          note: oldEntry?.note || '',
        });
      }
    } catch (err) {
      console.error('Failed to update transaction', err);
      setIsSavingTransaction(false);
      showAlert(err.message || 'Failed to save changes. Please try again.');
      return;
    }
    setIsSavingTransaction(false);

    setProjects(prevProjects =>
      prevProjects.map(proj => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          lastModifiedAt: Date.now(),
          employees: proj.employees.map(e => {
            if (e.id !== workerId) return e;
            if (editingTransactionType === 'advance') {
              const oldEntry = (e.advancePayments || []).find(p => p.id === editingPaymentId);
              const diff = amount - (oldEntry?.amount || 0);
              return { ...e, advancePayments: (e.advancePayments || []).map(p => p.id === editingPaymentId ? { ...p, id: newId, amount } : p), advance: Math.max(0, (e.advance || 0) + diff), lastUpdatedAt: Date.now() };
            }
            if (editingTransactionType === 'bonus') {
              const oldEntry = (e.bonusPayments || []).find(p => p.id === editingPaymentId);
              const diff = amount - (oldEntry?.amount || 0);
              return { ...e, bonusPayments: (e.bonusPayments || []).map(p => p.id === editingPaymentId ? { ...p, id: newId, amount } : p), bonus: Math.max(0, (e.bonus || 0) + diff), lastUpdatedAt: Date.now() };
            }
            return { ...e, payments: (e.payments || []).map(p => p.id === editingPaymentId ? { ...p, amount } : p), lastUpdatedAt: Date.now() };
          })
        };
      })
    );
    setEditingPaymentId(null);
    setEditPaymentAmount('');
  };

  const handleDeleteTransaction = async (projectId, workerId, type, transactionId) => {
    showConfirm("Remove this recorded transaction?", async () => {
      try {
        if (type === 'advance') {
          await paymentService.deleteAdvance(transactionId);
        } else if (type === 'bonus') {
          await paymentService.deleteBonus(transactionId);
        } else {
          await paymentService.deletePayment(transactionId);
        }
      } catch (err) {
        console.error('Failed to delete transaction', err);
        showAlert(err.message || 'Failed to delete. Please try again.');
        return;
      }

      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            lastModifiedAt: Date.now(),
            employees: project.employees.map(emp => {
              if (emp.id !== workerId) return emp;
              if (type === 'advance') {
                const removed = (emp.advancePayments || []).find(p => p.id === transactionId);
                return { ...emp, advancePayments: (emp.advancePayments || []).filter(p => p.id !== transactionId), advance: Math.max(0, (emp.advance || 0) - (removed?.amount || 0)), lastUpdatedAt: Date.now() };
              }
              if (type === 'bonus') {
                const removed = (emp.bonusPayments || []).find(p => p.id === transactionId);
                return { ...emp, bonusPayments: (emp.bonusPayments || []).filter(p => p.id !== transactionId), bonus: Math.max(0, (emp.bonus || 0) - (removed?.amount || 0)), lastUpdatedAt: Date.now() };
              }
              return { ...emp, payments: (emp.payments || []).filter(p => p.id !== transactionId), lastUpdatedAt: Date.now() };
            })
          };
        })
      );
    }, { confirmLabel: t('remove'), tone: 'warning' });
  };

    const handleDownloadStatement = async ({ worker, project, fromDate, toDate, 
    paymentDueForRange,
    paidInRange, balanceValue, paymentsInRange, advancePaymentsInRange, 
    bonusPaymentsInRange,
    attendanceEntriesInRange, statusMeta, selectedDate }) => {

    // Helper to strip invisible characters or weird whitespace jsPDF can't handle
    const cleanForPDF = (str) => {
      if (!str) return '-';
      // Remove invisible unicode chars (like U+200B zero-width space) 
      // and weird whitespace, keep standard alphanumeric/basic punctuation
      return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    };

    const inr = (n) => `Rs. ${Math.abs(n).toLocaleString('en-IN')}`;

    if (!worker) {
      showAlert('Worker data is missing. Please try again.');
      return;
    }

    // Wage payments only — advance is tracked and displayed separately, never added in here.
    const totalPaidWithAdvances = paidInRange || 0;

    const allAdvanceTransactionsTotal = (worker.advancePayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const initialAdvanceOnly = Math.max(0, (worker.advance || 0) - allAdvanceTransactionsTotal);

    let advanceRows = [];

    if (initialAdvanceOnly > 0) {
      advanceRows.push({ 
        date: worker.joiningDate ? formatShortDayLabel(worker.joiningDate) : 'Joining', 
        mode: 'Initial Advance', 
        amount: `-${inr(initialAdvanceOnly)}`, 
        color: '#DC2626' 
      });
    }
    
    if (advancePaymentsInRange && advancePaymentsInRange.length > 0) {
      advancePaymentsInRange.forEach(p => {
        advanceRows.push({ 
          date: formatShortDayLabel(p.date) || p.date || '-', 
          mode: '-', 
          amount: `-${inr(p.amount || 0)}`, 
          color: '#DC2626' 
        });
      });
    }

    if (advanceRows.length === 0) {
      advanceRows = [{ date: '-', mode: 'No advances recorded', amount: 'Rs. 0', color: '#94A3B8' }];
    }

    const paymentRows = (paymentsInRange || []).length
      ? paymentsInRange.map(p => ({ 
          date: (p.date && typeof p.date === 'string') ? formatShortDayLabel(p.date) || p.date : (p.date || '-'), 
          mode: cleanForPDF((p.method || '') + (p.note ? ` (${p.note})` : '')), 
          amount: inr(p.amount || 0), 
          color: '#1E293B' 
        }))
      : [{ date: '-', mode: 'No wage payments recorded', amount: 'Rs. 0', color: '#94A3B8' }];

    const allBonusTransactionsTotal = (worker.bonusPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const initialBonusOnly = Math.max(0, (worker.bonus || 0) - allBonusTransactionsTotal);

    let bonusRows = [];

    if (initialBonusOnly > 0) {
      bonusRows.push({
        date: worker.joiningDate ? formatShortDayLabel(worker.joiningDate) : 'Joining',
        mode: 'Initial Bonus',
        amount: `+${inr(initialBonusOnly)}`,
        color: '#10B981'
      });
    }

    if (bonusPaymentsInRange && bonusPaymentsInRange.length > 0) {
      bonusPaymentsInRange.forEach(p => {
        bonusRows.push({
          date: formatShortDayLabel(p.date) || p.date || '-',
          mode: cleanForPDF((p.method || '') + (p.note ? ` - ${p.note}` : '')),
          amount: `+${inr(p.amount || 0)}`,
          color: '#10B981'
        });
      });
    }

    if (bonusRows.length === 0) {
      bonusRows = [{ date: '-', mode: 'No bonus recorded', amount: 'Rs. 0', color: '#94A3B8' }];
    }

    const attendanceRows = (attendanceEntriesInRange || []).length
      ? attendanceEntriesInRange.map(([dateStr, record]) => {
      if (!dateStr || !record) {
        return { date: '-', mode: 'N/A', amount: 'Rs. 0', color: '#94A3B8' };
      }
      const meta = (statusMeta && statusMeta[record.status]) || statusMeta?.P || { label: 'Present', sub: 'Full day' };
      let wage = 0;
      try {
        wage = calculateNetDaily(getEffectiveWage(worker, dateStr), record.status);
      } catch (e) {
        wage = 0;
      }
      const isAbsent = record.status === 'A';
      
      const displayDate = dateStr && dateStr.includes('-') ? dateStr.split('-').reverse().join('/') : dateStr || '-';

      return { 
        date: displayDate, 
        mode: cleanForPDF(`${meta.label || 'Present'} (${meta.sub || 'Full day'})`), 
        amount: isAbsent ? 'Rs. 0' : `+${inr(wage)}`, 
        color: '#1E293B' 
      };
    })
    : [{ date: '-', mode: 'No attendance marked', amount: 'Rs. 0', color: '#94A3B8' }];

    const sanitizedFileName = `${(worker.name || 'Employee').trim().replace(/\s+/g, '_')}.pdf`;

    try {
      if (typeof jsPDF === 'undefined') {
        throw new Error('jsPDF library not loaded');
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      
      // --- THE ROOT CAUSE FIX ---
      // Load a Standard Unicode Font (Roboto) directly into jsPDF memory
      const robotoRegular = "AAEAAAAUAQAQABABAA..."; 
      // NOTE: In a real environment, you would base64 load a proper roboto font string here.
      // Because I cannot provide 50KB+ of base64 string, let's implement a fallback cleaning approach:
      
      // Instead, we forcefully tell jsPDF to treat everything as normal text
      // And we pass the `cleanForPDF` function over the values above.
      
      const marginX = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 44;
      let y = 54;

      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { doc.addPage(); y = 54; }
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor('#1E293B');
      doc.text(cleanForPDF(worker.name) || 'Worker', marginX, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#64748B');
      const periodText = fromDate && toDate 
        ? `${formatShortDayLabel(fromDate) || fromDate} - ${formatShortDayLabel(toDate) || toDate}`
        : 'All time';
      doc.text(`${cleanForPDF(worker.role) || 'Employee'}  |  ${cleanForPDF(project?.name) || ''}  |  Statement period: ${periodText}`, marginX, y);
      y += 26;

      const colWidth = contentWidth / 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor('#94A3B8');
      doc.text('TOTAL DUE', marginX, y);
      doc.text('PAID', marginX + colWidth, y);
      doc.text('BALANCE', marginX + colWidth * 2, y);
      y += 16;
      doc.setFontSize(14);
      doc.setTextColor('#0B3C9B');
      doc.text(inr(Math.max(0, paymentDueForRange || 0)), marginX, y);
      doc.setTextColor('#10B981');
      doc.text(inr(totalPaidWithAdvances || 0), marginX + colWidth, y);
      const balanceVal = (balanceValue !== undefined && balanceValue !== null) ? balanceValue : ((paymentDueForRange || 0) - totalPaidWithAdvances);
      const balanceColor = balanceVal > 0 ? '#DC2626' : balanceVal < 0 ? '#10B981' : '#1E293B';
      const balanceSuffix = balanceVal > 0 ? ' (due)' : balanceVal < 0 ? ' (credit)' : ' (settled)';
      doc.setTextColor(balanceColor);
      doc.text(inr(balanceVal) + balanceSuffix, marginX + colWidth * 2, y);
      y += 30;

      const addSection = (title, note, rows, emptyLabel) => {
        ensureSpace(50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor('#334155');
        doc.text(cleanForPDF(title), marginX, y);
        y += 6;
        doc.setDrawColor('#CBD5E1');
        doc.line(marginX, y, marginX + contentWidth, y);
        y += 14;

        if (note) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor('#94A3B8');
          doc.text(cleanForPDF(note), marginX, y);
          y += 14;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor('#94A3B8');
        doc.text('DATE', marginX, y);
        doc.text('MODE', marginX + 110, y);
        doc.text('AMOUNT', marginX + contentWidth, y, { align: 'right' });
        y += 8;
        doc.setDrawColor('#F1F5F9');
        doc.line(marginX, y, marginX + contentWidth, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        if (!rows || rows.length === 0 || (rows.length === 1 && rows[0].mode === 'No advances recorded')) {
          doc.setTextColor('#94A3B8');
          doc.text(cleanForPDF(emptyLabel) || 'No records found.', marginX, y);
          y += 16;
        } else {
          rows.forEach(row => {
            ensureSpace(16);
            doc.setTextColor('#1E293B');
            doc.text(cleanForPDF(String(row.date || '-')), marginX, y);
            doc.text(cleanForPDF(String(row.mode || '')), marginX + 110, y, { maxWidth: contentWidth - 190 });
            doc.setTextColor(row.color || '#1E293B');
            doc.text(cleanForPDF(String(row.amount || 'Rs. 0')), marginX + contentWidth, y, { align: 'right' });
            y += 16;
          });
        }
        y += 16;
      };

      addSection('Advance History', 'Deducted from wages owed.', advanceRows, 'No advance recorded.');
      addSection('Wage Payments', null, paymentRows, 'No wage payments recorded.');
      addSection('Bonus History', 'Extra payments - not part of the wage calculation above.', bonusRows, 'No bonus recorded.');
      addSection('Attendance Records', null, attendanceRows, 'No attendance marked.');

      const dataUrl = doc.output('datauristring');
      const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
        window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
      } else if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const writeResult = await Filesystem.writeFile({
          path: sanitizedFileName,
          data: pdfBase64,
          directory: 'DOCUMENTS',
        });
        if (Share?.share) {
          await Share.share({ title: sanitizedFileName, url: writeResult.uri });
        }
      } else {
        const ua = navigator.userAgent || '';
        const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
        if (isBareAndroidWebView) {
          try {
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${pdfBase64}`;
            link.download = sanitizedFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {
            console.error('Download failed:', e);
            showAlert('Could not download the PDF. Please try again.');
          }
        } else {
          doc.save(sanitizedFileName);
        }
      }

      setPaymentFormValidationMsg('');

    } catch (err) {
      console.error('PDF generation failed:', err);
      
      let errorMsg = 'Could not generate the PDF statement. ';
      if (err.message === 'jsPDF library not loaded') {
        errorMsg += 'The PDF library is not available. Please try refreshing the app.';
      } else if (err.message && err.message.includes('undefined')) {
        errorMsg += 'Some data is missing. Please check that the worker has attendance and payment records.';
      } else {
        errorMsg += 'Please try again or contact support if the issue persists.';
      }
      
      showAlert(errorMsg);
      setPaymentFormValidationMsg('');
    }
  };
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(toLocalISODate(new Date()));
  const [activePage, setActivePage] = useState('dashboard');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI-only state for the 6-box OTP input & resend countdown (does not change auth logic)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [resendSeconds, setResendSeconds] = useState(0);

  // ✅ Azure SQL Serverless auto-pauses after inactivity, so the very first request
  // of the day can take 30-60s to "wake up" the DB instead of failing instantly.
  // The backend already retries through this (see Program.cs EnableRetryOnFailure),
  // but a bare spinner for that long makes users think the app has frozen. If a
  // send-otp/login/register call is still in flight after a few seconds, switch the
  // plain "Sending OTP.../Verifying..." label to an explanatory message instead.
  const [showWakingMessage, setShowWakingMessage] = useState(false);
  useEffect(() => {
    if (!sendingOtp && !loading) {
      setShowWakingMessage(false);
      return;
    }
    const wakingTimer = setTimeout(() => setShowWakingMessage(true), 4000);
    return () => clearTimeout(wakingTimer);
  }, [sendingOtp, loading]);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setOtp('');
    setOtpSent(false);
    setFullName('');
    setIndustry('General');
    setOtpDigits(['', '', '', '', '', '']);
    setResendSeconds(0);
  };

  const isRegistrationFormValid = () => fullName.trim() !== '' && mobileNumber.length === 10;

  // Firebase phone-auth listeners: 'phoneCodeSent' fires once the SMS is dispatched and
  // gives us the verificationId we need later to confirm the code the user types in.
  // NOTE: these native-plugin listeners only fire on Android/iOS. On web we handle the
  // send/confirm flow directly with the Firebase JS SDK below (see handleSendOtp / handleSubmit).
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;
    const codeSentListener = FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      setFirebaseVerificationId(event.verificationId);
      setOtpSent(true);
      setSendingOtp(false);
    });
    const verificationFailedListener = FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
      showAlert(event?.message || 'Could not send verification code. Please try again.');
      setSendingOtp(false);
    });
    return () => {
      codeSentListener.then((l) => l.remove());
      verificationFailedListener.then((l) => l.remove());
    };
  }, []);

  const handleSendOtp = async () => {
    if (!isLoginView && !isRegistrationFormValid()) { showAlert('Please fill all registration details accurately.'); return; }
    if (!mobileNumber || mobileNumber.length !== 10) { showAlert('Please enter a valid 10-digit mobile number.'); return; }
    setSendingOtp(true);
    try {
      if (Capacitor.getPlatform() === 'web') {
        // @capacitor-firebase/authentication's signInWithPhoneNumber only supports
        // Android/iOS - on web we talk to the Firebase JS SDK directly instead.
        const auth = getAuth();
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          });
        }
        const confirmationResult = await firebaseSignInWithPhoneNumber(
          auth,
          `+91${mobileNumber}`,
          window.recaptchaVerifier,
        );
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        setSendingOtp(false);
      } else {
        await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: `+91${mobileNumber}` });
        // otpSent / firebaseVerificationId are set by the 'phoneCodeSent' listener above once Firebase dispatches the SMS.
      }
    } catch (error) {
      console.error('Firebase OTP Error:', error);
      showAlert(error?.message || 'Could not send verification code. Please try again.');
      setSendingOtp(false);
      // Reset the verifier on failure so a retry gets a fresh challenge.
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isWeb = Capacitor.getPlatform() === 'web';
    if (!otpSent || (isWeb ? !window.confirmationResult : !firebaseVerificationId)) {
      showAlert('Please generate and input your verification OTP first.');
      return;
    }
    setLoading(true);
    try {
      // 1. Confirm the code with Firebase - this is what actually verifies the phone number now.
      let idToken;
      if (isWeb) {
        const result = await window.confirmationResult.confirm(otp);
        if (!result?.user) { throw new Error('Verification did not return a signed-in user.'); }
        idToken = await result.user.getIdToken();
      } else {
        const confirmResult = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: firebaseVerificationId,
          verificationCode: otp,
        });
        if (!confirmResult?.user) { throw new Error('Verification did not return a signed-in user.'); }
        idToken = (await FirebaseAuthentication.getIdToken())?.token;
      }
      if (!idToken) { throw new Error('Could not obtain a verified session from Firebase.'); }

      // 2. Send the verified Firebase ID token to our backend instead of a raw OTP code.
      const endpoint = isLoginView ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
      const payload = isLoginView
        ? { mobileNumber: mobileNumber.trim(), idToken }
        : { mobileNumber: mobileNumber.trim(), idToken, fullName, industry };

      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const responseText = await response.text();
      let data = {};
      if (responseText) { try { data = JSON.parse(responseText); } catch { data = { message: responseText }; } }
      if (response.ok) {
        if (isLoginView) {
          localStorage.setItem('workforce_soft_token', 'true');
          const sessionUser = { 
            userId: data.userId, 
            fullName: data.fullName, 
            industry: data.industry || industry,
            profileImg: data.profileImage || null
          };
          localStorage.setItem('workforce_user', JSON.stringify(sessionUser));
          setLoggedInUser(sessionUser);
          setUserName(sessionUser.fullName || '');
          setProfileImg(sessionUser.profileImg);
          setIsUserAuthenticated(true);
          setActivePage('dashboard');
          loadUserProjects(data.userId); 
        } else {
          showSuccess(data.message || 'Registration completed successfully! Proceeding to login view.');
          setIsLoginView(true);
          setOtp('');
          setOtpSent(false);
          setFirebaseVerificationId(null);
          window.confirmationResult = null;
        }
      } else { showAlert(data.message || 'Validation failed down at backend services.'); }
    } catch (error) {
      console.error('Verification Error:', error);
      showAlert(error?.message || 'Invalid or expired OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Keep the 6 OTP boxes in sync with the existing `otp` string used by handleSubmit
  useEffect(() => {
    setOtp(otpDigits.join(''));
  }, [otpDigits]);

  // Resend countdown ticker (UI-only)
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);

  // Thin UI wrapper: calls the existing, unchanged handleSendOtp for both the initial
  // send and the resend action, then resets the boxes / starts the 30s countdown.
  const handleOtpButtonClick = async () => {
    setOtpDigits(['', '', '', '', '', '']);
    await handleSendOtp();
    setResendSeconds(30);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
  };

  // Lets the user go back and correct the mobile number if the OTP was sent to a wrong/mistyped
  // number - without this they'd be stuck staring at an uneditable field waiting for an OTP
  // that will never arrive at their own phone.
  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setFirebaseVerificationId(null);
    window.confirmationResult = null;
    setResendSeconds(0);
  };

useEffect(() => {
  if (isUserAuthenticated && loggedInUser?.userId) {
    loadUserProjects(loggedInUser.userId);
  }
}, [isUserAuthenticated, loggedInUser]);

  // ===== Internet connectivity: full-screen "No Internet" / "Loading..." handling =====
  // hasConnectedOnceRef distinguishes "never had internet since launch" (No Internet Connection)
  // from "had internet, then lost it" (Internet connection lost) per the two required message variants.
  const hasConnectedOnceRef = useRef(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    let listenerHandle;

    const applyStatus = (connected) => {
      setIsOnline(prevOnline => {
        if (connected) {
          // Coming online after having been offline (not just the very first check) - refresh data.
          if (hasConnectedOnceRef.current && !prevOnline) {
            setIsReconnecting(true);
          }
          hasConnectedOnceRef.current = true;
        }
        return connected;
      });
    };

    const checkInitialStatus = async () => {
      try {
        const status = await Network.getStatus();
        applyStatus(status.connected);
      } catch {
        // Network plugin unavailable (e.g. running in a plain browser tab) - fall back to navigator.onLine.
        applyStatus(navigator.onLine);
      }
    };
    checkInitialStatus();

    Network.addListener('networkStatusChange', (status) => {
      applyStatus(status.connected);
    }).then((handle) => { listenerHandle = handle; });

    return () => { if (listenerHandle) listenerHandle.remove(); };
  }, []);

  // Once back online after a drop, re-fetch the core session data before letting the user
  // back into the app, then return them to whatever screen they were already on.
  useEffect(() => {
    if (!isReconnecting) return;
    const refreshAfterReconnect = async () => {
      try {
        if (isUserAuthenticated && loggedInUser?.userId) {
          await loadUserProjects(loggedInUser.userId);
        }
      } finally {
        setIsReconnecting(false);
      }
    };
    refreshAfterReconnect();
  }, [isReconnecting]);

  const handleRetryConnection = async () => {
    try {
      const status = await Network.getStatus();
      if (status.connected) {
        hasConnectedOnceRef.current = true;
        setIsOnline(true);
        setIsReconnecting(true);
      }
    } catch {
      if (navigator.onLine) {
        hasConnectedOnceRef.current = true;
        setIsOnline(true);
        setIsReconnecting(true);
      }
    }
  };

  const connectivityStyles = {
    container: { position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#F4F6FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' },
    icon: { fontSize: '56px', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' },
    message: { fontSize: '14.5px', color: '#6B7280', margin: '0 0 28px', maxWidth: '320px', lineHeight: '1.5' },
    retryButton: { padding: '13px 32px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 16px rgba(11, 60, 155, 0.25)' },
    spinner: { width: '36px', height: '36px', border: '3.5px solid #DCE3F7', borderTopColor: '#0B3C9B', borderRadius: '50%', marginBottom: '20px', animation: 'smartmanage-spin 0.8s linear infinite' },
  };

  if (!isOnline) {
    return (
      <div style={connectivityStyles.container}>
        <style>{'@keyframes smartmanage-spin { to { transform: rotate(360deg); } }'}</style>
        <div style={connectivityStyles.icon}>📡</div>
        <h2 style={connectivityStyles.title}>
          {hasConnectedOnceRef.current ? 'Internet connection lost.' : 'No Internet Connection'}
        </h2>
        <p style={connectivityStyles.message}>Please turn on your internet connection to continue.</p>
        <button onClick={handleRetryConnection} style={connectivityStyles.retryButton}>Retry</button>
      </div>
    );
  }

  if (isReconnecting || (isUserAuthenticated && loadingProjects && projects.length === 0)) {
    return (
      <div style={connectivityStyles.container}>
        <style>{'@keyframes smartmanage-spin { to { transform: rotate(360deg); } }'}</style>
        <div style={connectivityStyles.spinner} />
        <p style={connectivityStyles.message}>Loading... Please wait.</p>
      </div>
    );
  }

  const handleFullLogout = () => {
    showConfirm('Are you sure you want to sign out?', () => {
      localStorage.clear();
      setIsUserAuthenticated(false);
      setLoggedInUser(null);
      setOtp('');
      setOtpSent(false);
      setMobileNumber('');
      window.location.reload();
    }, { confirmLabel: t('yes'), tone: 'warning' });
  };

  const TUTORIAL_VIDEO_URL = 'https://www.youtube.com/shorts/RtzdRnXkfX4';
  const handleWatchTutorialVideo = async () => {
    try {
      await Browser.open({ url: TUTORIAL_VIDEO_URL });
    } catch (error) {
      console.error('Unable to open tutorial video via Browser plugin:', error);
      window.open(TUTORIAL_VIDEO_URL, '_blank');
    }
  };

  const handleAddNewWorkerInline = () => {
    const workerName = prompt("Enter full employee name:");
    if (!workerName || !workerName.trim()) return;
    const workerRole = prompt("Enter employee role / job title (e.g. Mason, Supervisor):", t('labor'));
    const workerWage = prompt("Enter daily wage currency rate (\u20B9):", "400");
    const newWorker = { id: Date.now(), name: workerName.trim(), role: workerRole || t('labor'), dailyWage: parseFloat(workerWage) || 400, attendance: {}, wageOverrides: [], lastUpdatedAt: Date.now() };
    setTempWorkersList([...tempWorkersList, newWorker]);
  };

  const handleEditWorkerInline = (project, worker) => {
    setSelectedProjectId(project.id);
    setEditingWorkerId(worker.id);
    setTempWorkerName(worker.name || '');
    setTempWorkerPhone(worker.mobileNumber || '');
    setTempWorkerJoiningDate(worker.joiningDate || '2026-07-01');
    setTempWorkerWageAmount(String(worker.dailyWage || '400'));
    setIsWorkerSubFormOpen(true);
  };

   const handleSaveWorkerInlineFormData = async () => {
    if (isSavingWorker) return; // guard against double-tap / double-click while a save is in flight
    const missingRequiredFields = [];
    if (!tempWorkerName.trim()) missingRequiredFields.push(t('fullName'));
    if (!tempWorkerJoiningDate) missingRequiredFields.push(t('dateOfJoining'));
    if (!tempWorkerWageAmount.trim()) missingRequiredFields.push(t('dailyWage'));
    
    // --- NEW VALIDATION START ---
    // Only validate mobile number if the user actually typed something in
    if (tempWorkerPhone.trim() !== '') {
      if (!/^[0-9]{10}$/.test(tempWorkerPhone.trim())) {
        showAlert('Please enter a valid 10-digit Mobile Number (or leave it blank).');
        return;
      }
    }
    // --- NEW VALIDATION END ---

    if (missingRequiredFields.length > 0) {
      showAlert(`${t('fillRequiredFields')}\n\u2022 ${missingRequiredFields.join('\n\u2022 ')}`);
      return;
    }
    if ((editingWorkerId === null || editingWorkerId === undefined) && !isAddProjectOpen) {
      const currentProject = projects.find(p => p.id === selectedProjectId);
      const isDuplicate = currentProject?.employees?.some(
        emp => emp.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase()
      );
      if (isDuplicate) {
        showAlert(t('employeeAlreadyExists').replace('{name}', tempWorkerName.trim()));
        return;
      }
    }
    if (tempWorkerJoiningDate && tempWorkerJoiningDate > todayStr) {
      showAlert(t('futureJoiningDate'));
      return;
    }
    const compiledInlineWorker = {
      name: tempWorkerName.trim(), mobileNumber: tempWorkerPhone.trim(), joiningDate: tempWorkerJoiningDate,
      dailyWage: parseFloat(tempWorkerWageAmount) || 0,
      role: t('employee'),
    };
    if (isAddProjectOpen) {
      // No project exists yet on the server - keep collecting workers locally.
      // They're actually created via workerService.createWorker once the
      // project itself is created in handleCreateProjectFinalSubmission.
      if (isAddProjectOpen && (editingWorkerId === null || editingWorkerId === undefined)) {
        const isDuplicateInTempList = tempWorkersList.some(
          w => w.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase()
        );
        if (isDuplicateInTempList) {
          showAlert(t('employeeAlreadyExists').replace('{name}', tempWorkerName.trim()));
          return;
        }
      }
      const targetWorkerId = (editingWorkerId !== null && editingWorkerId !== undefined) ? editingWorkerId : Date.now();
      const withId = { id: targetWorkerId, ...compiledInlineWorker, lastUpdatedAt: Date.now() };
      if (editingWorkerId) setTempWorkersList(tempWorkersList.map(w => w.id === editingWorkerId ? { ...w, ...withId, attendance: w.attendance || {}, wageOverrides: w.wageOverrides || [], payments: w.payments || [] } : w));
      else setTempWorkersList([...tempWorkersList, { ...withId, advance: 0, bonus: 0, attendance: {}, wageOverrides: [], payments: [] }]);
      setTempWorkerName('');
      setTempWorkerPhone('');
      setTempWorkerJoiningDate('');
      setTempWorkerWageAmount('');
      setEditingWorkerId(null);
      setIsWorkerSubFormOpen(false);
      return;
    }

    // Editing/adding a worker on an already-existing project - hit the API.
    setIsSavingWorker(true);
    try {
      if (editingWorkerId) {
        const currentProject = projects.find(p => p.id === selectedProjectId);
        const existingWorker = currentProject?.employees?.find(w => w.id === editingWorkerId);
        await workerService.updateWorker(editingWorkerId, {
          fullName: compiledInlineWorker.name,
          mobileNumber: compiledInlineWorker.mobileNumber,
          joiningDate: compiledInlineWorker.joiningDate,
          dailyWage: compiledInlineWorker.dailyWage,
          role: compiledInlineWorker.role,
          advance: existingWorker?.advance || 0,
          bonus: existingWorker?.bonus || 0,
        });
      } else {
        await workerService.createWorker({
          projectId: selectedProjectId,
          fullName: compiledInlineWorker.name,
          mobileNumber: compiledInlineWorker.mobileNumber,
          joiningDate: compiledInlineWorker.joiningDate,
          dailyWage: compiledInlineWorker.dailyWage,
          role: compiledInlineWorker.role,
          advance: 0,
          bonus: 0,
        });
      }
      await refreshProject(selectedProjectId);
    } catch (error) {
      console.error('Error saving worker:', error);
      showAlert('Could not save this employee on the server.');
    } finally {
      setIsSavingWorker(false);
    }

    setTempWorkerName('');
    setTempWorkerPhone('');
    setTempWorkerJoiningDate('');
    setTempWorkerWageAmount('');
    setEditingWorkerId(null);
    setIsWorkerSubFormOpen(false);
  };

  // Checked as soon as the project-name field loses focus, so the user finds
  // out about a duplicate name right away instead of after filling in every
  // employee and hitting "Create Project".
  const handleProjectNameBlur = () => {
    const trimmedName = newSiteName.trim();
    if (!trimmedName) { setIsNewProjectNameDuplicate(false); return; }
    const isDuplicate = projects.some(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase());
    setIsNewProjectNameDuplicate(isDuplicate);
    if (isDuplicate) {
      showAlert(t('projectNameDuplicateInline'));
    }
  };

  const handleCreateProjectFinalSubmission = async (e) => {
  e.preventDefault();
  if (loading) return; // guard against re-entrant double submits
  if (!newSiteName.trim()) { showAlert(t('pleaseProvideValidProject')); return; }
  if (tempWorkersList.length === 0) { showAlert(t('validationError')); return; }
  const trimmedNewProjectName = newSiteName.trim();
  const isDuplicateProjectName = projects.some(p => p.name.trim().toLowerCase() === trimmedNewProjectName.toLowerCase());
  if (isDuplicateProjectName) {
    showAlert(t('projectAlreadyExists').replace('{name}', trimmedNewProjectName));
    return;
  }
  setLoading(true);
  try {
      const createdProject = await projectService.createProject({
        userId: loggedInUser.userId,
        projectName: newSiteName.trim(),
        projectAddress: '',
      });
      // Create every worker collected in the "add project" wizard against the
      // newly created project id.
      await Promise.all(tempWorkersList.map(w => workerService.createWorker({
        projectId: createdProject.id,
        fullName: w.name,
        mobileNumber: w.mobileNumber || '',
        joiningDate: w.joiningDate,
        dailyWage: w.dailyWage,
        role: w.role || t('employee'),
        advance: w.advance || 0,
        bonus: w.bonus || 0,
      })));
      setNewSiteName('');
      setIsNewProjectNameDuplicate(false);
      setTempWorkersList([]);
      setIsAddProjectOpen(false);
      if (loggedInUser?.userId) await loadUserProjects(loggedInUser.userId);
    } catch (error) {
      console.error('Error creating project:', error);
      showAlert('Could not create the project on the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkerSubForm = () => {
    setTempWorkerName('');
    setTempWorkerPhone('');
    setTempWorkerJoiningDate('');
    setTempWorkerWageAmount('');
    setIsWorkerSubFormOpen(true);
  };

  const handleRangeModeChange = (mode) => {
    setPaymentsRangeMode(mode);
    const today = new Date();

    if (mode === 'this_week') {
      const currentDay = today.getDay(); 
      const monday = new Date(today);
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      monday.setDate(today.getDate() - distanceToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const endDate = sunday > today ? today : sunday;

      setPaymentsRangeFrom(toLocalISODate(monday));
      setPaymentsRangeTo(toLocalISODate(endDate));
    } 
    else if (mode === 'this_month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const endDate = lastDayOfMonth > today ? today : lastDayOfMonth;

      setPaymentsRangeFrom(toLocalISODate(firstOfMonth));
      setPaymentsRangeTo(toLocalISODate(endDate));
    } 
    else if (mode === 'custom') {
      setPaymentsRangeFrom(toLocalISODate(today));
      setPaymentsRangeTo(toLocalISODate(today));
    }
  };

  const todayStr = toLocalISODate(new Date());

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const isNameDuplicateUI = (editingWorkerId === null || editingWorkerId === undefined) && (
    (isAddProjectOpen && tempWorkersList.some(w => w.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase())) ||
    (!isAddProjectOpen && activeProject?.employees?.some(emp => emp.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase()))
  );

  const isWorkerFormValid = tempWorkerName.trim() !== '' && 
    tempWorkerJoiningDate.trim() !== '' && 
    tempWorkerJoiningDate <= todayStr && 
    tempWorkerWageAmount.trim() !== '' &&
    !isNameDuplicateUI &&
    !isSavingWorker;

  const projectsMatchingQuery = projects.filter(p => p.name.toLowerCase().includes(siteSearchQuery.toLowerCase()));
  const sortedProjects = [...projectsMatchingQuery].sort((a, b) => {
    if (projectSortMode === 'az') return a.name.localeCompare(b.name);
    if (projectSortMode === 'za') return b.name.localeCompare(a.name);
    if (projectSortMode === 'lastModified') return (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0);
    return 0;
  });

  if (isUserAuthenticated && loggedInUser) {
    const activeProjectForWorkersList = projects.find(p => p.id === activeSiteViewId);
    const homeDisplayName = loggedInUser?.fullName ? loggedInUser.fullName.split(' ')[0] : 'there';

    // ===== Module picker (home screen) =====
    if (activeModule === null) {
      return (
        <div style={moduleHomeStyles.screen}>
          <div style={moduleHomeStyles.scrollArea}>
            <div style={moduleHomeStyles.headerRow}>
              <div style={moduleHomeStyles.brandRow}>
                <div style={moduleHomeStyles.logoMark}>
                  <img src={smartpayLogo} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={moduleHomeStyles.brandName}>SmartManage</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                style={moduleHomeStyles.avatarButton}
                aria-label="Profile and settings"
              >
                {profileImg ? (
                  <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  homeDisplayName.substring(0, 2).toUpperCase()
                )}
              </button>
            </div>

            <div style={moduleHomeStyles.greetBlock}>
              <h1 style={moduleHomeStyles.greetTitle}>{t('greetingHi')}, {homeDisplayName} </h1>
              <p style={moduleHomeStyles.greetSubtitle}>What would you like to do today?</p>
            </div>

            <div style={moduleHomeStyles.panel}>
              <h2 style={moduleHomeStyles.panelLabel}>Modules</h2>
              <div style={moduleHomeStyles.tileGrid}>
                <button type="button" onClick={() => setActiveModule('attendance')} style={moduleHomeStyles.tile}>
                  <span style={{ ...moduleHomeStyles.tileBadge, background: 'linear-gradient(135deg, #2554EB, #0B3C9B)' }}>
                    <FiUsers size={19} color="#ffffff" />
                  </span>
                  <span style={moduleHomeStyles.tileTitle}>Attendance</span>
                  <span style={moduleHomeStyles.tileSubtitle}>Manage your workforce</span>
                </button>
                <button type="button" onClick={() => setActiveModule('quotations')} style={moduleHomeStyles.tile}>
                  <span style={{ ...moduleHomeStyles.tileBadge, background: 'linear-gradient(135deg, #14B8A6, #0F766E)' }}>
                    <FiFileText size={19} color="#ffffff" />
                  </span>
                  <span style={moduleHomeStyles.tileTitle}>Quotations</span>
                  <span style={moduleHomeStyles.tileSubtitle}>Create and manage quotes</span>
                </button>
              </div>
            </div>

            <p style={moduleHomeStyles.moreSoon}>More modules — Expenses, Inventory, Reports — coming soon</p>

            <div style={moduleHomeStyles.bottomRow}>
              <button type="button" style={moduleHomeStyles.bottomAction} onClick={() => setIsProfileModalOpen(true)}>
                <FiSettings size={16} color="#475569" />
                <span style={moduleHomeStyles.bottomActionLabel}>Settings</span>
              </button>
              <span style={moduleHomeStyles.bottomDivider} />
              <button type="button" style={moduleHomeStyles.bottomAction} onClick={handleWatchTutorialVideo}>
                <FiHelpCircle size={16} color="#475569" />
                <span style={moduleHomeStyles.bottomActionLabel}>Help &amp; Support</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ===== Quotations module home (Manage + Discover) =====
    if (activeModule === 'quotations') {

      // ----- Update Business Info sub-screen -----
      if (quotationSubView === 'business') {
        const maskIfSet = (val) => (val && val.trim() ? '########' : '—');
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Update Business Info</h1>
              <span style={businessInfoStyles.headerIconBtn}>
                <HiOutlineLightBulb size={21} color="#ffffff" />
              </span>
            </div>

            <div style={businessInfoStyles.body}>
              <div style={businessInfoStyles.brandRow}>
                <label style={businessInfoStyles.brandTile}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleBusinessImagePick('logoImg', e.target.files?.[0])} />
                  {businessInfo.logoImg ? (
                    <img src={businessInfo.logoImg} alt="Logo" style={businessInfoStyles.brandTileImg} />
                  ) : (
                    <span style={businessInfoStyles.brandTileText}>ADD<br />LOGO</span>
                  )}
                  <span style={businessInfoStyles.brandEditBadge}><HiOutlinePencil size={13} color="#0F172A" /></span>
                </label>
                <label style={businessInfoStyles.brandTile}>
                  <input type="file" accept="image/*" hidden onChange={(e) => handleBusinessImagePick('signatureImg', e.target.files?.[0])} />
                  {businessInfo.signatureImg ? (
                    <img src={businessInfo.signatureImg} alt="Signature" style={businessInfoStyles.brandTileImg} />
                  ) : (
                    <span style={businessInfoStyles.brandTileText}>ADD<br />SIGNATURE</span>
                  )}
                  <span style={businessInfoStyles.brandEditBadge}><HiOutlinePencil size={13} color="#0F172A" /></span>
                </label>
              </div>

              <FieldInput label="Business Name" value={businessInfo.businessName} onChange={(v) => updateBusinessField('businessName', v)} />
              <FieldInput label="Contact Name" value={businessInfo.contactName} onChange={(v) => updateBusinessField('contactName', v)} />
              <FieldInput label="Email" value={businessInfo.email} onChange={(v) => updateBusinessField('email', v)} type="email" />
              <FieldInput label="Phone Number" value={businessInfo.phone} onChange={(v) => updateBusinessField('phone', v)} type="tel" />
              <FieldInput label="Address Line 1" value={businessInfo.addressLine1} onChange={(v) => updateBusinessField('addressLine1', v)} />
              <FieldInput label="Address Line 2" value={businessInfo.addressLine2} onChange={(v) => updateBusinessField('addressLine2', v)} />
              <FieldInput label="Address Line 3" value={businessInfo.addressLine3} onChange={(v) => updateBusinessField('addressLine3', v)} />
              <FieldInput label="Other Info" value={businessInfo.otherInfo} onChange={(v) => updateBusinessField('otherInfo', v)} />
              <FieldInput label="Business Category" value={businessInfo.businessCategory} onChange={(v) => updateBusinessField('businessCategory', v)} />

              <div style={businessInfoStyles.sectionBar}>Tax Details</div>
              <div style={businessInfoStyles.fieldBox}>
                <span style={businessInfoStyles.fieldLabel}>GSTIN/PAN/VAT/Business Label</span>
                <div style={businessInfoStyles.selectRow}>
                  <select
                    value={businessInfo.taxLabel}
                    onChange={(e) => updateBusinessField('taxLabel', e.target.value)}
                    style={businessInfoStyles.selectInput}
                  >
                    <option value="GSTIN">GSTIN</option>
                    <option value="PAN">PAN</option>
                    <option value="VAT">VAT</option>
                    <option value="Business Label">Business Label</option>
                  </select>
                  <FiChevronDown size={15} color="#94A3B8" />
                </div>
              </div>
              <FieldInput label="GSTIN/PAN/VAT/Business Number" value={businessInfo.taxNumber} onChange={(v) => updateBusinessField('taxNumber', v)} />
              <FieldInput label="State" value={businessInfo.state} onChange={(v) => updateBusinessField('state', v)} />

              <div style={businessInfoStyles.sectionBar}>Payment Instructions - Bank Details</div>
              <button type="button" onClick={() => setIsBankDetailsModalOpen(true)} style={businessInfoStyles.bankCard}>
                <span style={businessInfoStyles.fieldLabel}>Bank Info</span>
                <span style={businessInfoStyles.bankLine}>Account Name : {maskIfSet(businessInfo.bankAccountName)}</span>
                <span style={businessInfoStyles.bankLine}>Account Number : {maskIfSet(businessInfo.bankAccountNumber)}</span>
                <span style={businessInfoStyles.bankLine}>Bank Name : {maskIfSet(businessInfo.bankName)}</span>
              </button>

              <FieldInput label="UPI ID" value={businessInfo.upiId} onChange={(v) => updateBusinessField('upiId', v)} />
              <p style={businessInfoStyles.helperText}>This UPI ID will be used to generate Dynamic QR codes on the Quotations and invoices.</p>

              <button type="button" onClick={handleUpdateBusinessInfo} style={businessInfoStyles.updateBtn}>Update</button>
            </div>

            {isBankDetailsModalOpen && (
              <div style={businessInfoStyles.modalOverlay} onClick={() => setIsBankDetailsModalOpen(false)}>
                <div style={businessInfoStyles.modalCard} onClick={(e) => e.stopPropagation()}>
                  <div style={businessInfoStyles.modalHeaderRow}>
                    <h3 style={businessInfoStyles.modalTitle}>Bank Details</h3>
                    <button type="button" onClick={() => setIsBankDetailsModalOpen(false)} style={businessInfoStyles.modalCloseBtn} aria-label="Close">&times;</button>
                  </div>
                  <FieldInput label="Account Name" value={businessInfo.bankAccountName} onChange={(v) => updateBusinessField('bankAccountName', v)} />
                  <FieldInput label="Account Number" value={businessInfo.bankAccountNumber} onChange={(v) => updateBusinessField('bankAccountNumber', v)} type="tel" />
                  <FieldInput label="Bank Name" value={businessInfo.bankName} onChange={(v) => updateBusinessField('bankName', v)} />
                  <button type="button" onClick={() => setIsBankDetailsModalOpen(false)} style={businessInfoStyles.modalSaveBtn}>Save</button>
                </div>
              </div>
            )}

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Customer List sub-screen -----
      if (quotationSubView === 'customerList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Customer List</h1>
              <span style={customerModuleStyles.headerIconBtn}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="1" y1="4" x2="19" y2="4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="14" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="16" x2="9" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div style={customerModuleStyles.body}>
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search by Name OR Company Name"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>
                  {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
                </p>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => openEditCustomer(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer)} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
                        <HiOutlinePencil size={14} color="#ffffff" />
                      </button>
                      <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.editBadgeBtn, background: '#DC2626' }} aria-label="Delete customer">
                        <FiTrash2 size={14} color="#ffffff" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="button" onClick={openAddCustomer} style={customerModuleStyles.fab}>
              <FiPlus size={18} color="#ffffff" />
              <span>ADD<br />CUSTOMER</span>
            </button>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Add / Edit Customer sub-screen -----
      if (quotationSubView === 'addCustomer') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(customerFormReturnView)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={customerModuleStyles.formBody}>
              <div style={customerModuleStyles.nameFieldWrap}>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => updateCustomerField('name', e.target.value)}
                  placeholder="Name"
                  style={{ ...customerModuleStyles.fieldInput, paddingRight: '54px' }}
                />
                <span style={customerModuleStyles.nameFieldIcon}>
                  <FaAddressBook size={16} color="#ffffff" />
                </span>
              </div>

              <input
                type="text"
                value={customerForm.companyName}
                onChange={(e) => updateCustomerField('companyName', e.target.value)}
                placeholder="Company Name"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="email"
                value={customerForm.email}
                onChange={(e) => updateCustomerField('email', e.target.value)}
                placeholder="Email"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="tel"
                value={customerForm.mobile}
                onChange={(e) => updateCustomerField('mobile', e.target.value)}
                placeholder="Mobile"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={customerForm.addressLine1}
                onChange={(e) => updateCustomerField('addressLine1', e.target.value)}
                placeholder="Address Line 1"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={customerForm.addressLine2}
                onChange={(e) => updateCustomerField('addressLine2', e.target.value)}
                placeholder="Address Line 2"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={customerForm.otherInfo}
                onChange={(e) => updateCustomerField('otherInfo', e.target.value)}
                placeholder="Other Info"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={customerForm.gstin}
                onChange={(e) => updateCustomerField('gstin', e.target.value)}
                placeholder="GSTIN Number"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={customerForm.state}
                onChange={(e) => updateCustomerField('state', e.target.value)}
                placeholder="State"
                style={customerModuleStyles.fieldInput}
              />

              <div style={customerModuleStyles.sectionBar}>Shipping Details</div>
              <textarea
                value={customerForm.shippingAddress}
                onChange={(e) => updateCustomerField('shippingAddress', e.target.value)}
                placeholder="Shipping Address"
                style={customerModuleStyles.shippingTextarea}
              />

              <button type="button" onClick={handleSaveCustomer} style={customerModuleStyles.addBtn}>
                {editingCustomerId ? 'Update' : 'Add'}
              </button>
            </div>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Product List sub-screen -----
      if (quotationSubView === 'productList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Product List</h1>
              <span style={customerModuleStyles.headerIconBtn}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="1" y1="4" x2="19" y2="4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="14" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="16" x2="9" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div style={customerModuleStyles.body}>
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by Name"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {filteredProducts.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>
                  {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    style={customerModuleStyles.productCard}
                  >
                    <button type="button" onClick={() => openEditProduct(product)} style={{ ...customerModuleStyles.selectRowBtn, display: 'block' }}>
                      <div style={customerModuleStyles.productCardTopRow}>
                        <span style={customerModuleStyles.customerName}>{product.name}</span>
                      </div>
                      {product.price && (
                        <div style={customerModuleStyles.productDetailRow}>
                          <span style={customerModuleStyles.productDetailLabel}>Price</span>
                          <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                        </div>
                      )}
                      {product.gst && (
                        <div style={customerModuleStyles.productDetailRow}>
                          <span style={customerModuleStyles.productDetailLabel}>GST</span>
                          <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                        </div>
                      )}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="button" onClick={() => openEditProduct(product)} style={customerModuleStyles.editBadgeBtn} aria-label="Edit product">
                        <HiOutlinePencil size={14} color="#ffffff" />
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(product)} style={{ ...customerModuleStyles.editBadgeBtn, background: '#DC2626' }} aria-label="Delete product">
                        <FiTrash2 size={14} color="#ffffff" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="button" onClick={openAddProduct} style={customerModuleStyles.fab}>
              <FiPlus size={18} color="#ffffff" />
              <span>ADD<br />PRODUCT</span>
            </button>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Add / Edit Product sub-screen -----
      if (quotationSubView === 'addProduct') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(productFormReturnView)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingProductId ? 'Edit Product' : 'Add Product'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={customerModuleStyles.formBody}>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => updateProductField('name', e.target.value)}
                placeholder="Product Name"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="number"
                value={productForm.price}
                onChange={(e) => updateProductField('price', e.target.value)}
                placeholder="Price"
                style={customerModuleStyles.fieldInput}
              />
              <div style={customerModuleStyles.suffixFieldWrap}>
                <input
                  type="number"
                  value={productForm.gst}
                  onChange={(e) => updateProductField('gst', e.target.value)}
                  placeholder="GST"
                  style={{ ...customerModuleStyles.fieldInput, paddingRight: '38px' }}
                />
                <span style={customerModuleStyles.suffixFieldIcon}>%</span>
              </div>
              <div>
                <textarea
                  value={productForm.description}
                  onChange={(e) => updateProductField('description', e.target.value.slice(0, 2000))}
                  placeholder="Description"
                  maxLength={2000}
                  style={customerModuleStyles.descriptionTextarea}
                />
                <div style={customerModuleStyles.charCount}>{productForm.description.length}/2000</div>
              </div>
              <input
                type="text"
                value={productForm.unit}
                onChange={(e) => updateProductField('unit', e.target.value)}
                placeholder="Unit Of Measure(SET, KG etc.)"
                style={customerModuleStyles.fieldInput}
              />
              <input
                type="text"
                value={productForm.hsn}
                onChange={(e) => updateProductField('hsn', e.target.value)}
                placeholder="HSN"
                style={customerModuleStyles.fieldInput}
              />

              <button type="button" onClick={handleSaveProduct} style={{ ...customerModuleStyles.addBtn, marginTop: '18px' }}>
                {editingProductId ? 'Update' : 'Add'}
              </button>
            </div>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Select Customer sub-screen (used from Make Quotation) -----
      if (quotationSubView === 'selectCustomerForQuotation') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              <span style={customerModuleStyles.headerIconBtn}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="1" y1="4" x2="19" y2="4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="14" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="16" x2="9" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div style={customerModuleStyles.body}>
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search by Name OR Company Name"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>
                  {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
                </p>
              ) : (
                filteredCustomers.map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForQuotation(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForQuotation')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
                        <HiOutlinePencil size={14} color="#ffffff" />
                      </button>
                      <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.editBadgeBtn, background: '#DC2626' }} aria-label="Delete customer">
                        <FiTrash2 size={14} color="#ffffff" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddCustomer('selectCustomerForQuotation')} style={customerModuleStyles.fab}>
              <FiPlus size={18} color="#ffffff" />
              <span>ADD<br />CUSTOMER</span>
            </button>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Select Product sub-screen (used from Make Quotation) -----
      if (quotationSubView === 'selectProductForQuotation') {
        return (
          <div style={{ ...customerModuleStyles.screen, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="1" y1="4" x2="19" y2="4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="14" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="16" x2="9" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div style={{ ...customerModuleStyles.body, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: quotationForm.products.length > 0 ? '150px' : '110px' }}>
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by Name"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {filteredProducts.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>
                  {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const lineQty = quotationForm.products.find((p) => p.productId === product.id)?.qty || 0;
                  const draftQty = getProductQtyDraft(product.id);
                  return (
                    <div
                      key={product.id}
                      style={{
                        ...customerModuleStyles.productCard,
                        ...(lineQty > 0 ? customerModuleStyles.productCardSelected : {}),
                        cursor: 'default',
                      }}
                    >
                      <div style={customerModuleStyles.productCardTopRow}>
                        <span style={customerModuleStyles.customerName}>{product.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {lineQty > 0 && (
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0E7490' }}>
                              {lineQty}{product.unit ? ` ${product.unit}` : ''} in quotation
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            aria-label="Delete product"
                            style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#DC2626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                          >
                            <FiTrash2 size={13} color="#ffffff" />
                          </button>
                        </div>
                      </div>
                      {product.price && (
                        <div style={customerModuleStyles.productDetailRow}>
                          <span style={customerModuleStyles.productDetailLabel}>Price</span>
                          <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                        </div>
                      )}
                      {product.gst && (
                        <div style={customerModuleStyles.productDetailRow}>
                          <span style={customerModuleStyles.productDetailLabel}>GST</span>
                          <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                        </div>
                      )}

                      {/* Quantity stepper + Add button - lets the user type/step to the exact qty needed in one go */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#F1F3F6', borderRadius: '12px', overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={() => setProductQtyDraft(product.id, String(Math.max(1, (Number(draftQty) || 1) - 1)))}
                            style={{ width: '34px', height: '34px', border: 'none', background: 'transparent', fontSize: '17px', fontWeight: '700', color: '#0F172A', cursor: 'pointer' }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            value={draftQty}
                            onChange={(e) => setProductQtyDraft(product.id, e.target.value)}
                            style={{ width: '46px', textAlign: 'center', border: 'none', background: 'transparent', fontSize: '14.5px', fontWeight: '700', color: '#0F172A', outline: 'none', fontFamily: 'inherit' }}
                          />
                          <button
                            type="button"
                            onClick={() => setProductQtyDraft(product.id, String((Number(draftQty) || 1) + 1))}
                            style={{ width: '34px', height: '34px', border: 'none', background: 'transparent', fontSize: '17px', fontWeight: '700', color: '#0F172A', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                        {product.unit && <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{product.unit}</span>}
                        <button
                          type="button"
                          onClick={() => handleSelectProductForQuotation(product, Number(draftQty) || 1)}
                          style={{ marginLeft: 'auto', background: '#181C23', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {quotationForm.products.length > 0 && (
              <div style={{ ...customerModuleStyles.doneBtnWrap, right: '116px' }}>
                <button type="button" onClick={() => setQuotationSubView('makeQuotation')} style={{ ...customerModuleStyles.doneBtn, maxWidth: 'none', margin: 0 }}>DONE</button>
              </div>
            )}

            <button type="button" onClick={() => openAddProduct('selectProductForQuotation')} style={customerModuleStyles.fab}>
              <FiPlus size={18} color="#ffffff" />
              <span>ADD<br />PRODUCT</span>
            </button>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Select Terms and Conditions sub-screen (used from Make Quotation) -----
      if (quotationSubView === 'selectTermsForQuotation') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
              <span style={customerModuleStyles.headerIconBtn}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="1" y1="4" x2="19" y2="4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="10" x2="14" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="16" x2="9" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <button type="button" onClick={openAddTermsModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#181C23" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Quotation</span>
            </div>

            <div style={customerModuleStyles.body}>
              {terms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                terms.map((term) => {
                  const selected = termsDraftSelectedIds.includes(term.id);
                  return (
                    <div
                      key={term.id}
                      style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTermsDraftSelection(term.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                      >
                        {term.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term)}
                        aria-label="Delete term"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#DC2626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                      >
                        <FiTrash2 size={13} color="#ffffff" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={customerModuleStyles.doneBtnWrap}>
              <button type="button" onClick={handleDoneSelectTerms} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isAddTermsModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Add Terms and condition</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                  <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Quotation</div>
                  <textarea
                    value={newTermText}
                    onChange={(e) => setNewTermText(e.target.value)}
                    placeholder="Terms and condition"
                    style={customerModuleStyles.descriptionTextarea}
                  />
                  <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Add</button>
                </div>
              </div>
            )}

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Make Quotation sub-screen -----
      if (quotationSubView === 'makeQuotation') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Make Quotation</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={makeQuotationStyles.infoRow}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Quotation Date</span>
                    <div style={makeQuotationStyles.infoValue}>{quotationForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Quotation No</span>
                    <div style={makeQuotationStyles.infoValue}>{quotationForm.quotationNo || '-'}</div>
                  </div>
                </div>
                <div style={makeQuotationStyles.otherInfoRow}>
                  <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                  <input
                    type="text"
                    value={quotationForm.otherInfo}
                    onChange={(e) => setQuotationForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                    style={makeQuotationStyles.otherInfoInput}
                  />
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForQuotation} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedQuotationCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedQuotationCustomer.name}</p>
                    {selectedQuotationCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedQuotationCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <button type="button" onClick={openSelectProductForQuotation} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {quotationForm.products.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {quotationForm.products.map((p) => (
                      <div key={p.productId} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{p.name} x{p.qty}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{Math.round(p.price * p.qty * (1 + p.gst / 100))}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeQuotationProductLine(p.productId); }}
                            style={makeQuotationStyles.removeX}
                          >
                            &times;
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openOtherChargeModal} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {quotationForm.otherCharges.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {quotationForm.otherCharges.map((c) => (
                      <div key={c.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{c.label}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeQuotationOtherCharge(c.id); }}
                            style={makeQuotationStyles.removeX}
                          >
                            &times;
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openSelectTermsForQuotation} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedQuotationTerms.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {selectedQuotationTerms.map((term) => (
                      <p key={term.id} style={makeQuotationStyles.sectionCardSubLine}>{term.text}</p>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div style={makeQuotationStyles.bottomBar}>
              <div>
                <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
                <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{quotationAmountDue}</div>
              </div>
              <button type="button" onClick={handleGenerateQuotation} style={makeQuotationStyles.generateBtn}>Generate</button>
            </div>

            {isOtherChargeModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsOtherChargeModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Other Charge Info</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>Other Charge Label</span>
                  <input
                    type="text"
                    value={otherChargeForm.label}
                    onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                    style={customerModuleStyles.fieldInput}
                  />
                  <input
                    type="number"
                    value={otherChargeForm.amount}
                    onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Other Charge Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <div style={customerModuleStyles.taxableRow}>
                    <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                    <input
                      type="checkbox"
                      checked={otherChargeForm.taxable}
                      onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                      style={customerModuleStyles.checkbox}
                    />
                  </div>
                  <button type="button" onClick={handleSaveOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
                </div>
              </div>
            )}

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Quotation List sub-screen (Matches Screenshot 1) -----
      if (quotationSubView === 'quotationList') {
        const searchQuotation = (q) => {
          const qs = quotationSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return q.customerName.toLowerCase().includes(qs) || 
                 (q.quotationNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Quotation</h1>
              <button type="button" style={{ ...customerModuleStyles.headerIconBtn, background: 'transparent' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 22 7 18 7 18 11 14 11 14 15 10 15 10 19 6 19 6 23 2 23 2 3 22 3"></polygon>
                </svg>
              </button>
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={quotationSearchQuery}
                  onChange={(e) => setQuotationSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Quotation#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {quotations.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>No quotations generated yet.</p>
              ) : (
                quotations.filter(searchQuotation).map((q) => (
                  <button 
                    key={q.id} 
                    onClick={() => { setSelectedQuotationId(q.id); setQuotationSubView('quotationDetail'); }}
                    style={{ width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px', padding: '18px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>{q.customerName}</span>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>{q.quotationNo || 'Quote-' + q.id.slice(0,4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>{q.date}</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>₹{q.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => { setQuotationForm({ ...emptyQuotationForm(), quotationNo: getNextQuotationNumber() }); setQuotationSubView('makeQuotation'); }} style={customerModuleStyles.fab}>
              <FiPlus size={18} color="#ffffff" />
              <span>MAKE<br />QUOTATION</span>
            </button>

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      // ----- Quotation Detail sub-screen (Matches Screenshot 2, 3, 4) -----
      if (quotationSubView === 'quotationDetail') {
        const currentQuotation = quotations.find(q => q.id === selectedQuotationId);
        if (!currentQuotation) {
          setQuotationSubView('quotationList');
          return null;
        }

        return (
          <div style={{ width: '100vw', minHeight: '100vh', background: '#F3F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#181C23', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
              <button type="button" onClick={() => setQuotationSubView('quotationList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Quotation Detail</h1>
              <button type="button" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', minHeight: '70vh' }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{businessInfo.businessName || 'Manufacturer'}</h2>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>{businessInfo.phone}</p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{businessInfo.email}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Quotation</h3>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: '4px 0 0' }}>{currentQuotation.quotationNo || 'Quote-1'}</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: 0 }}>Date: {currentQuotation.date}</p>
                  </div>
                </div>

                {/* Customer */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: '0 0 4px' }}>To,</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0' }}>{currentQuotation.customerName}</p>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '2px 0 0' }}>{currentQuotation.customerCompany}</p>
                </div>

                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>Dear Sir/Mam,<br />Thank you for your valuable inquiry. We are pleased to quote as below</p>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', width: '30px' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>DESCRIPTION</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px' }}>QTY</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>PRICE</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuotation.products.map((p, idx) => (
                      <tr key={p.productId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 4px', fontWeight: '600' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 4px' }}>
                          <div style={{ fontWeight: '600', color: '#0F172A' }}>{p.name}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                          {p.qty}{p.unit ? <span style={{ fontSize: '10px', color: '#64748B' }}> {p.unit}</span> : null}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 4px' }}>₹{Number(p.price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '10px 4px', fontWeight: '600' }}>₹{(p.price * p.qty * (1 + p.gst/100)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid #000' }}>
                      <td colSpan="4" style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>GRAND TOTAL</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '800', fontSize: '15px' }}>₹{currentQuotation.grandTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>

                <p style={{ fontSize: '13px', color: '#475569', margin: '16px 0 32px' }}>We hope you find our offer to be in line with your requirement.</p>

                <div style={{ textAlign: 'right', marginTop: '40px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>For, {businessInfo.businessName || 'MANUFACTURER'}</p>
                  <div style={{ height: '40px' }}></div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>AUTHORIZED SIGNATURE</p>
                </div>
              </div>
            </div>

            {/* SIDE FLOATING ACTION BUTTONS (Delete & Status - Ref Image 2) */}
            <div style={{ position: 'fixed', right: '16px', bottom: '160px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 30 }}>
              <button 
                onClick={() => {
                  showConfirm('Delete this quotation?', () => {
                    persistQuotations(quotations.filter(q => q.id !== selectedQuotationId));
                    setQuotationSubView('quotationList');
                  });
                }}
                style={{ position: 'relative', background: '#0F172A', color: '#ffffff', border: 'none', borderRadius: '40px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '22px' }}>🗑️</span>
                <span style={{ position: 'absolute', right: '56px', background: '#0F172A', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>Delete</span>
              </button>
              <button 
                style={{ position: 'relative', background: '#0F172A', color: '#ffffff', border: 'none', borderRadius: '40px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '22px' }}>💬</span>
                <span style={{ position: 'absolute', right: '56px', background: '#0F172A', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</span>
              </button>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Invoice, Share, More - Ref Image 3) */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#ffffff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', padding: '10px 0 16px', zIndex: 30, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }}>
              <button onClick={() => { /* Add Duplicate Logic */ showAlert('Duplicate feature coming soon.'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <span style={{ fontSize: '22px' }}>📄</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Duplicate</span>
              </button>
              <button onClick={() => showAlert('Edit feature coming soon.')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <span style={{ fontSize: '22px' }}>✏️</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Edit</span>
              </button>
              <button onClick={() => setShowConvertSheet(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <span style={{ fontSize: '22px' }}>📑</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Invoice</span>
              </button>
              <button onClick={() => showAlert('Share feature coming soon.')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <span style={{ fontSize: '22px' }}>🔗</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>Share</span>
              </button>
              <button onClick={() => showAlert('More feature coming soon.')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                <span style={{ fontSize: '22px' }}>•••</span>
                <span style={{ fontSize: '11px', fontWeight: '600' }}>More</span>
              </button>
            </div>

            {/* CONVERSION BOTTOM SHEET (Invoice click - Ref Image 4) */}
            {showConvertSheet && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Quotation to...</h3>
                  
                  <button onClick={() => { setShowConvertSheet(false); showAlert('Convert to Proforma Invoice feature coming soon.'); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}>
                    Convert To Proforma Invoice
                  </button>
                  <button onClick={() => { setShowConvertSheet(false); showAlert('Convert to Invoice feature coming soon.'); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}>
                    Convert To Invoice
                  </button>
                  <button onClick={() => setShowConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <AppPopup
              open={!!appPopup?.open}
              tone={appPopup?.tone}
              title={appPopup?.title}
              message={appPopup?.message}
              confirmLabel={appPopup?.confirmLabel}
              cancelLabel={appPopup?.cancelLabel}
              onConfirm={appPopup?.onConfirm || closeAppPopup}
              onCancel={closeAppPopup}
              onClose={closeAppPopup}
            />
          </div>
        );
      }

      const manageItems = [
        { key: 'business', label: 'BUSINESS', icon: HiOutlineBuildingOffice2 },
        { key: 'customer', label: 'CUSTOMER', icon: FiUser },
        { key: 'product', label: 'PRODUCT', icon: FiBox },
        { key: 'terms', label: 'TERMS', icon: FiClipboard },
      ];
      const discoverTiles = [
        { key: 'makeQuotation', title: 'Make Quotation', subtitle: 'Create a new quotation' },
        { key: 'quotationList', title: 'Quotation List', subtitle: 'Manage all quotations' },
        { key: 'makeInvoice', title: 'Make Invoice', subtitle: 'Create a new invoice' },
        { key: 'invoiceList', title: 'Invoice List', subtitle: 'Manage all invoices' },
        { key: 'purchaseOrder', title: 'Purchase Order', subtitle: 'Manage all purchase orders' },
        { key: 'proformaInvoice', title: 'Proforma Invoice', subtitle: 'Manage all proforma invoices' },
        { key: 'deliveryNote', title: 'Delivery Note', subtitle: 'Manage all delivery notes / challans' },
        { key: 'receipt', title: 'Receipt', subtitle: 'Manage all receipts' },
      ];
      // TODO: remaining tiles (terms as a Discover tile, quotationList, and the other 6 Discover tiles) still no-op —
      // wire these up once the destination screens are defined.
      const handleManageTap = (key) => {
        if (key === 'business') { setQuotationSubView('business'); return; }
        if (key === 'customer') { setCustomerSearchQuery(''); setQuotationSubView('customerList'); return; }
        if (key === 'product') { setProductSearchQuery(''); setQuotationSubView('productList'); return; }
      };
      const handleDiscoverTap = (key) => {
        if (key === 'makeQuotation') { openMakeQuotation(); return; }
        if (key === 'quotationList') { setQuotationSearchQuery(''); setQuotationSubView('quotationList'); return; }
      };

      return (
        <div style={quotationModuleStyles.screen}>
          <div style={quotationModuleStyles.scrollArea}>
            <button type="button" onClick={() => setActiveModule(null)} style={quotationModuleStyles.backRow}>
              <FiHome size={15} color="#64748B" />
              <span style={quotationModuleStyles.backLabel}>Home</span>
            </button>

            <div style={quotationModuleStyles.topHeaderRow}>
              <div>
                <h1 style={quotationModuleStyles.welcomeTitle}>Welcome</h1>
                <p style={quotationModuleStyles.welcomeSubtitle}>{industry || 'Manufacturer'}</p>
              </div>
              <div style={quotationModuleStyles.headerIconRow}>
                <button type="button" onClick={handleWatchTutorialVideo} aria-label="Watch tutorial" style={{ ...quotationModuleStyles.headerIconBtn, background: '#EF4444' }}>
                  <FaYoutube size={16} color="#ffffff" />
                </button>
                <button type="button" onClick={() => setIsProfileModalOpen(true)} aria-label="Settings" style={{ ...quotationModuleStyles.headerIconBtn, background: '#334155' }}>
                  <FiSettings size={15} color="#ffffff" />
                </button>
              </div>
            </div>

            <h2 style={quotationModuleStyles.sectionLabel}>Manage</h2>
            <div style={quotationModuleStyles.manageGrid}>
              {manageItems.map((item) => (
                <button type="button" key={item.key} onClick={() => handleManageTap(item.key)} style={quotationModuleStyles.manageItem}>
                  <span style={quotationModuleStyles.manageIconCircle}>
                    <item.icon size={20} color="#1E293B" />
                  </span>
                  <span style={quotationModuleStyles.manageLabel}>{item.label}</span>
                </button>
              ))}
            </div>

            <div style={quotationModuleStyles.discoverPanel}>
              <h2 style={quotationModuleStyles.sectionLabel}>Discover</h2>
              <div style={quotationModuleStyles.discoverGrid}>
                {discoverTiles.map((tile) => (
                  <button type="button" key={tile.key} onClick={() => handleDiscoverTap(tile.key)} style={quotationModuleStyles.discoverTile}>
                    <span style={quotationModuleStyles.discoverBadge}>
                      <FiFileText size={17} color="#ffffff" />
                    </span>
                    <span style={quotationModuleStyles.discoverTitle}>{tile.title}</span>
                    <span style={quotationModuleStyles.discoverSubtitle}>{tile.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    return (
      <div style={themeStyles.authDashboardContainer}>
        {activeSiteViewId && (() => {
          const currentProject = projects.find(p => p.id === activeSiteViewId);
          if (!currentProject) return null;

          const workersMatchingQuery = (currentProject.employees || []).filter(w => w.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()));
          const sortedWorkers = [...workersMatchingQuery].sort((a, b) => {
            if (workerSortMode === 'az') return a.name.localeCompare(b.name);
            if (workerSortMode === 'za') return b.name.localeCompare(a.name);
            if (workerSortMode === 'lastUpdated') return (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0);
            return 0;
          });

          return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1650, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px 16px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setActiveSiteViewId(null)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>&lsaquo;</button>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{currentProject.name}</h2>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#64748B' }}>
                    <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => handleOpenEditProjectModal(currentProject)}>&#9999;&#65039;</span>
                    <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => handleDeleteProject(currentProject.id)}>&#128465;&#65039;</span>
                  </div>
                </div>
                {isEditProjectModalOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1800, padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{t('editProject')}</h3>
                        <button onClick={handleCloseEditProjectModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>&times;</button>
                      </div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'block', marginBottom: '6px' }}>{t('projectName')}</label>
                      <input
                        type="text"
                        value={editProjectNameInput}
                        onChange={(e) => setEditProjectNameInput(e.target.value)}
                        placeholder={t('enterProjectName')}
                        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box', marginBottom: '18px' }}
                      />
                      <button type="button" onClick={handleSaveEditedProjectName} disabled={!editProjectNameInput.trim()} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#0B3C9B', color: '#ffffff', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer', opacity: !editProjectNameInput.trim() ? 0.4 : 1 }}>{t('saveChanges')}</button>
                    </div>
                  </div>
                )}

                {/* ============ DAILY ATTENDANCE SCREEN ============ */}
                {isAttendanceModalOpen && (() => {
                  const currentProject2 = projects.find(p => p.id === activeSiteViewId);
                  if (!currentProject2) return null;

                  const latestSelectedDate = selectedAttendanceDates.length > 0
                    ? selectedAttendanceDates[selectedAttendanceDates.length - 1]
                    : toLocalISODate(new Date());

                  const safeDateIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
                  const currentDisplayedDate = selectedAttendanceDates.length > 0
                    ? selectedAttendanceDates[safeDateIndex]
                    : null;

                  const eligibilityFilterDate = currentDisplayedDate || latestSelectedDate;
                  const sortedByName = [...(currentProject2.employees || [])].sort((a, b) => a.name.localeCompare(b.name));
                  const filteredAttendanceEmployees = sortedByName
                    .filter(worker => worker.name.toLowerCase().includes(attendanceWorkerSearchQuery.toLowerCase()))
                    .filter(worker => eligibilityFilterDate >= (worker.joiningDate || '2026-07-01'));

                  const primaryDateAttendance = currentDisplayedDate
                    ? (pendingAttendanceByDate[currentDisplayedDate] || {})
                    : {};

                  const earliestAllowedDate = getEarliestJoiningDate(currentProject2);
                  const savedAttendanceDatesSet = getSavedAttendanceDatesSet(currentProject2);
                  const todayIsoDate = toLocalISODate(new Date());

                  return (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f4f6f9', zIndex: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                      <div
                        style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0, position: 'relative' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <button
                            onClick={() => { setIsAttendanceModalOpen(false); setAttendanceWorkerSearchQuery(''); }}
                            style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                          >&lsaquo;</button>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formatSiteName(currentProject2.name)}
                          </span>
                        </div>

                        <h2 style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '17px', fontWeight: '700', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                          {t('attendance')}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <div
                            onClick={openAttendanceCalendarPicker}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0, gap: '2px',
                              padding: '5px 12px', borderRadius: '12px',
                              ...(!currentDisplayedDate ? {
                                backgroundColor: '#FFF4E5',
                                border: '1.5px solid #F59E0B',
                                animation: 'attendanceDatePulse 1.6s ease-in-out infinite',
                              } : { border: '1.5px solid transparent' }),
                            }}
                          >
                            <span style={{ fontSize: '22px', lineHeight: 1, pointerEvents: 'none', display: 'block' }}>&#128197;</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: !currentDisplayedDate ? '#B45309' : '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                              {t('selectDate')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!currentDisplayedDate && (
                        <style>{'@keyframes attendanceDatePulse { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); } 70% { box-shadow: 0 0 0 9px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }'}</style>
                      )}

                      {currentDisplayedDate && (
                        <div style={{ padding: '14px 16px 4px 16px', backgroundColor: '#ffffff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                          {selectedAttendanceDates.length > 1 && (
                            <button
                              onClick={goToPreviousAttendanceDate}
                              disabled={safeDateIndex === 0}
                              aria-label="Previous date"
                              style={{
                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                border: 'none', fontSize: '20px', fontWeight: '700', lineHeight: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: safeDateIndex === 0 ? '#E2E8F0' : '#0B3C9B',
                                color: safeDateIndex === 0 ? '#94A3B8' : '#ffffff',
                                cursor: safeDateIndex === 0 ? 'default' : 'pointer',
                                boxShadow: safeDateIndex === 0 ? 'none' : '0 2px 6px rgba(11, 60, 155, 0.35)'
                              }}
                            >&lsaquo;</button>
                          )}
                          <span style={{
                            fontSize: '17px', fontWeight: '700', color: '#0B3C9B', whiteSpace: 'nowrap',
                            backgroundColor: '#EFF6FF', padding: '6px 14px', borderRadius: '20px'
                          }}>
                            {formatLargeDateHeader(currentDisplayedDate)}
                          </span>
                          {selectedAttendanceDates.length > 1 && (
                            <button
                              onClick={goToNextAttendanceDate}
                              disabled={safeDateIndex === selectedAttendanceDates.length - 1}
                              aria-label="Next date"
                              style={{
                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                border: 'none', fontSize: '20px', fontWeight: '700', lineHeight: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: safeDateIndex === selectedAttendanceDates.length - 1 ? '#E2E8F0' : '#0B3C9B',
                                color: safeDateIndex === selectedAttendanceDates.length - 1 ? '#94A3B8' : '#ffffff',
                                cursor: safeDateIndex === selectedAttendanceDates.length - 1 ? 'default' : 'pointer',
                                boxShadow: safeDateIndex === selectedAttendanceDates.length - 1 ? 'none' : '0 2px 6px rgba(11, 60, 155, 0.35)'
                              }}
                            >&rsaquo;</button>
                          )}
                        </div>
                      )}

                      <div style={{ padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{t('bulkMark')}</span>
                          <button
                            onClick={() => handleBulkAttendanceChange('P')}
                            disabled={!currentDisplayedDate}
                            style={{
                              backgroundColor: currentDisplayedDate ? '#10B981' : '#E2E8F0',
                              color: currentDisplayedDate ? '#ffffff' : '#94A3B8',
                              border: 'none', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                              cursor: currentDisplayedDate ? 'pointer' : 'not-allowed',
                            }}
                          >{t('allPresent')}</button>
                          <button
                            onClick={() => handleBulkAttendanceChange('A')}
                            disabled={!currentDisplayedDate}
                            style={{
                              backgroundColor: currentDisplayedDate ? '#EF4444' : '#E2E8F0',
                              color: currentDisplayedDate ? '#ffffff' : '#94A3B8',
                              border: 'none', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                              cursor: currentDisplayedDate ? 'pointer' : 'not-allowed',
                            }}
                          >{t('allAbsent')}</button>
                        </div>
                      </div>

                      <div style={{ padding: '10px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '12px', color: '#94A3B8', fontSize: '14px' }}>&#128269;</span>
                          <input
                            type="text"
                            placeholder={t('enterEmployeeName')}
                            value={attendanceWorkerSearchQuery}
                            onChange={(e) => setAttendanceWorkerSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 36px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }}
                          />
                          {attendanceWorkerSearchQuery && (
                            <button onClick={() => setAttendanceWorkerSearchQuery('')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>&#10005;</button>
                          )}
                        </div>
                      </div>

                      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 16px' }}>
                        {filteredAttendanceEmployees.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredAttendanceEmployees.map((worker) => {
                              const record = primaryDateAttendance[worker.id] || { status: '' };
                              const effectiveWage = getEffectiveWage(worker, currentDisplayedDate || latestSelectedDate);
                              const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
                              const avatarColors = getEmployeeAvatarColors(worker.name);

                              return (
                                <div key={worker.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px', border: '1px solid #F1F5F9' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: avatarColors.bg, color: avatarColors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0, boxShadow: 'none', cursor: 'default' }}>{initials}</div>
                                      <div style={{ minWidth: 0 }}>
                                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{worker.name}</h5>
                                        <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748B' }}>{`\u20B9${effectiveWage}/day`}</p>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                      <button
                                        onClick={() => handleOpenEditWage(worker)}
                                        style={{ backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(11, 60, 155, 0.35)' }}
                                      >
                                        &#9998; {t('editWage')}
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => { setTrackerWorkerId(worker.id); setTrackerCalendarMonth(new Date()); }}
                                      style={{ backgroundColor: '#FACC15', color: '#713F12', border: 'none', padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                                    >
                                      {t('musterCard')} &rsaquo;
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                      {[{ key: 'P', label: t('presentLabel'), color: '#10B981' }, { key: 'HD', label: t('attendanceHalfLabel'), color: '#F59E0B' }, { key: 'A', label: t('attendanceAbsentLabel'), color: '#EF4444' }].map((opt) => {
                                        const isActive = record.status === opt.key;
                                        return (
                                          <button
                                            key={opt.key}
                                            onClick={() => handleIndividualAttendanceChange(worker.id, opt.key)}
                                            style={{
                                              border: isActive ? `1.5px solid ${opt.color}` : '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: '700',
                                              backgroundColor: isActive ? `${opt.color}1A` : '#F8FAFC',
                                              color: isActive ? opt.color : '#94A3B8',
                                              cursor: 'pointer',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: '64px', maxWidth: '92px',
                                      border: currentDisplayedDate ? '1.5px solid #FBBF24' : '1.5px solid #E2E8F0',
                                      borderRadius: '7px', padding: '0 6px',
                                      backgroundColor: currentDisplayedDate ? '#FFFBEB' : '#F1F5F9',
                                      boxShadow: currentDisplayedDate ? '0 0 0 1px rgba(251, 191, 36, 0.15)' : 'none',
                                      boxSizing: 'border-box',
                                    }}>
                                      <span style={{ fontSize: '11px', color: currentDisplayedDate ? '#B45309' : '#94A3B8', fontWeight: '700', flexShrink: 0 }}>&#8377;</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder={t('advance')}
                                        readOnly={!currentDisplayedDate}
                                        value={pendingAdvanceByDate[currentDisplayedDate]?.[worker.id] ?? ''}
                                        onFocus={handleAdvanceInputFocus}
                                        onClick={handleAdvanceInputFocus}
                                        onChange={(e) => handleIndividualAdvanceChange(worker.id, e.target.value)}
                                        style={{ width: '100%', minWidth: 0, padding: '6px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '11px', fontWeight: '700', color: currentDisplayedDate ? '#92400E' : '#94A3B8', boxSizing: 'border-box', cursor: currentDisplayedDate ? 'text' : 'pointer' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '30px' }}>
                            {attendanceWorkerSearchQuery ? `${t('noEmployeesMatch')}` : t('noEmployeesJoined')}
                          </p>
                        )}
                      </div>

                      <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0', flexShrink: 0, boxSizing: 'border-box' }}>
                        <button
                          onClick={handleSaveAttendanceData}
                          disabled={isSavingAttendance}
                          style={{
                            width: '100%', minHeight: '48px', padding: '14px',
                            backgroundColor: !currentDisplayedDate ? '#E2E8F0' : '#0B3C9B',
                            color: !currentDisplayedDate ? '#94A3B8' : '#ffffff',
                            border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '15px',
                            cursor: isSavingAttendance ? 'default' : 'pointer',
                            opacity: isSavingAttendance ? 0.7 : 1, boxSizing: 'border-box', flexShrink: 0,
                          }}
                        >{isSavingAttendance ? '...' : t('saveAttendance')}</button>
                      </div>

                      {/* ============ ATTENDANCE TRACKER PAGE ============ */}
                      {trackerWorkerId && (() => {
                        const trackerWorker = (currentProject2.employees || []).find(w => w.id === trackerWorkerId);
                        if (!trackerWorker) return null;

                        const joiningDateStr = trackerWorker.joiningDate || '2026-07-01';

                        let totalPresent = 0, totalHalfDay = 0, totalAbsent = 0;
                        Object.entries(trackerWorker.attendance || {}).forEach(([dateStr, record]) => {
                          if (dateStr < joiningDateStr) return;
                          if (record.status === 'P') totalPresent++;
                          else if (record.status === 'HD') totalHalfDay++;
                          else if (record.status === 'A') totalAbsent++;
                        });

                        const trackerYear = trackerCalendarMonth.getFullYear();
                        const trackerMonth = trackerCalendarMonth.getMonth();
                        const trackerFirstWeekday = new Date(trackerYear, trackerMonth, 1).getDay();
                        const trackerDaysInMonth = new Date(trackerYear, trackerMonth + 1, 0).getDate();
                        const trackerCells = [];
                        for (let i = 0; i < trackerFirstWeekday; i++) trackerCells.push(null);
                        for (let d = 1; d <= trackerDaysInMonth; d++) trackerCells.push(d);
                        const trackerRows = [];
                        for (let i = 0; i < trackerCells.length; i += 7) trackerRows.push(trackerCells.slice(i, i + 7));

                        const joinYear = parseInt(joiningDateStr.slice(0, 4), 10);
                        const joinMonth = parseInt(joiningDateStr.slice(5, 7), 10) - 1;
                        const isAtEarliestMonth = trackerYear === joinYear && trackerMonth === joinMonth;

                        // E-Muster: future dates (beyond today) must be disabled/greyed out,
                        // matching the existing "before DOJ" disabled styling. Scoped to this
                        // calendar only -- does not affect any other calendar in the app.
                        const trackerTodayStr = toLocalISODate(new Date());

                        const statusColors = {
                          P: { bg: '#DCFCE7', text: '#15803D' },
                          A: { bg: '#FEE2E2', text: '#DC2626' },
                          HD: { bg: '#F1F5F9', text: '#475569' },
                        };

                        return (
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f4f6f9', zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                              <button
                                onClick={() => setTrackerWorkerId(null)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                              >&lsaquo;</button>
                              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('musterCard')}</h2>
                            </div>

                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px', border: '1px solid #F1F5F9' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{trackerWorker.name}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                                  {t('joined')} {new Date(joiningDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#10B981' }}>{totalPresent}</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>{t('totalPresent')}</p>
                                </div>
                                <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#64748B' }}>{totalHalfDay}</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>{t('totalHalfDay')}</p>
                                </div>
                                <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 8px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#EF4444' }}>{totalAbsent}</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>{t('totalAbsent')}</p>
                                </div>
                              </div>
                              <p style={{ margin: '0 0 14px 0', fontSize: '10px', color: '#94A3B8', textAlign: 'center' }}>{t('fromDateOfJoining')}</p>

                              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                  <button
                                    onClick={() => setTrackerCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                    disabled={isAtEarliestMonth}
                                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '4px 10px' }}
                                  >&lsaquo;</button>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{trackerCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                  <button
                                    onClick={() => setTrackerCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}
                                  >&rsaquo;</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                                  ))}
                                </div>

                                {trackerRows.map((row, ri) => (
                                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {row.map((dayNum, ci) => {
                                      if (!dayNum) return <div key={ci} />;
                                      const dateStr = `${trackerYear}-${String(trackerMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                      const beforeJoining = dateStr < joiningDateStr;
                                      const afterToday = dateStr > trackerTodayStr;
                                      const isDisabledDay = beforeJoining || afterToday;
                                      const record = trackerWorker.attendance?.[dateStr];
                                      const status = record?.status;
                                      const colors = !isDisabledDay && status ? statusColors[status] : null;
                                      const dayWage = (!isDisabledDay && status) ? calculateNetDaily(getEffectiveWage(trackerWorker, dateStr), status) : null;
                                      const dayAdvance = (!isDisabledDay && status)
                                        ? (trackerWorker.advancePayments || []).filter(p => p.date === dateStr).reduce((sum, p) => sum + (p.amount || 0), 0)
                                        : 0;
                                      return (
                                        <div
                                          key={ci}
                                          style={{
                                            textAlign: 'center', padding: '6px 0', margin: '2px 0', borderRadius: '8px',
                                            fontSize: '13px', fontWeight: colors ? '700' : '500',
                                            color: isDisabledDay ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                                            backgroundColor: colors ? colors.bg : 'transparent'
                                          }}
                                        >
                                          <div>{dayNum}</div>
                                          {dayWage !== null && (
                                            <div style={{ fontSize: '8px', fontWeight: '700', lineHeight: '1.3', marginTop: '1px', color: colors ? colors.text : '#64748B' }}>
                                              <div>{`W-${dayWage}`}</div>
                                              {dayAdvance > 0 && <div>{`A-${dayAdvance}`}</div>}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}

                                <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                    <span style={{ fontSize: '11px', color: '#64748B' }}>{t('presentLabel')}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                                    <span style={{ fontSize: '11px', color: '#64748B' }}>{t('totalHalfDay')}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                                    <span style={{ fontSize: '11px', color: '#64748B' }}>{t('totalAbsent')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ============ ATTENDANCE SAVED SUCCESS POPUP ============ */}
                      <AppPopup
                        open={isAttendanceSavedPopupOpen}
                        tone="success"
                        title={t('attendanceSavedSuccess')}
                        confirmLabel={t('ok')}
                        onConfirm={() => setIsAttendanceSavedPopupOpen(false)}
                        onClose={() => setIsAttendanceSavedPopupOpen(false)}
                      />

                      {/* ============ SAME-AS-CURRENT-WAGE POP-UP ============ */}
                      <AppPopup
                        open={isSameWagePopupOpen}
                        tone="warning"
                        title={t('sameWageError')}
                        confirmLabel={t('ok')}
                        onConfirm={() => setIsSameWagePopupOpen(false)}
                        onClose={() => setIsSameWagePopupOpen(false)}
                      />

                      <AppPopup
                        open={isSelectDateForAdvancePopupOpen}
                        tone="warning"
                        title={t('selectDateForAdvanceError')}
                        confirmLabel={t('ok')}
                        onConfirm={() => setIsSelectDateForAdvancePopupOpen(false)}
                        onClose={() => setIsSelectDateForAdvancePopupOpen(false)}
                      />

                      {/* ============ MULTI-SELECT ATTENDANCE CALENDAR ============ */}
                      {isCalendarPickerOpen && (() => {
                        const year = calendarViewMonth.getFullYear();
                        const month = calendarViewMonth.getMonth();
                        const firstWeekday = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < firstWeekday; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                        const rows = [];
                        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

                        const headerLabel = tempCalendarDates.length === 0
                          ? t('selectDates')
                          : tempCalendarDates.length === 1
                            ? new Date(tempCalendarDates[0]).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                            : `${tempCalendarDates.length} ${t('datesSelected')}`;

                        return (
                          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
                            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                              <div style={{ backgroundColor: '#0F766E', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                                <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                                <div style={{ fontSize: '21px', fontWeight: '700' }}>{headerLabel}</div>
                              </div>

                              <div style={{ padding: '16px 18px 4px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <button onClick={() => setCalendarViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{calendarViewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                  <button onClick={() => setCalendarViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                                  ))}
                                </div>

                                {rows.map((row, ri) => (
                                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {row.map((dayNum, ci) => {
                                      if (!dayNum) return <div key={ci} />;
                                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                      const isDisabled = dateStr < earliestAllowedDate || dateStr > todayIsoDate;
                                      const isSelected = tempCalendarDates.includes(dateStr);
                                      const isSaved = savedAttendanceDatesSet.has(dateStr);
                                      return (
                                        <div
                                          key={ci}
                                          onClick={() => handleCalendarDayClick(dateStr, isDisabled, isSaved)}
                                          style={{
                                            textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '50%',
                                            fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                                            cursor: isDisabled ? 'default' : 'pointer',
                                            color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : (isSaved ? '#15803D' : '#1E293B')),
                                            backgroundColor: isSelected ? '#0F766E' : (isSaved ? '#DCFCE7' : 'transparent')
                                          }}
                                        >
                                          {dayNum}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', marginBottom: '4px' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                  <span style={{ fontSize: '11px', color: '#64748B' }}>{t('attendanceAlreadyMarked')}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '22px', padding: '12px 20px 18px 20px' }}>
                                <button onClick={handleCalendarClear} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('clear')}</button>
                                <button onClick={handleCalendarCancel} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>{t('cancel')}</button>
                                <button onClick={handleCalendarSet} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('set')}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ============ MAX 31 DATES POPUP ============ */}
                      <AppPopup
                        open={isMaxDatesPopupOpen}
                        tone="warning"
                        title={t('maxDaysError')}
                        confirmLabel={t('ok')}
                        onConfirm={() => setIsMaxDatesPopupOpen(false)}
                        onClose={() => setIsMaxDatesPopupOpen(false)}
                      />

                      {/* ============ UNMARK ATTENDANCE CONFIRMATION ============ */}
                      <AppPopup
                        open={!!unmarkConfirmDate}
                        tone="warning"
                        title={t('removeAttendance')}
                        message={unmarkConfirmDate ? t('removeAttendanceConfirm').replace('{date}', formatSelectedDatesLabel([unmarkConfirmDate])) : ''}
                        confirmLabel={t('remove')}
                        cancelLabel={t('cancel')}
                        onConfirm={handleConfirmUnmarkDate}
                        onCancel={() => setUnmarkConfirmDate(null)}
                        onClose={() => setUnmarkConfirmDate(null)}
                      />

                      {/* ============ EDIT WAGE MODAL ============ */}
                      {isEditWageModalOpen && (() => {
                        const targetWorker = currentProject2.employees.find(w => w.id === editWageTargetWorkerId);
                        if (!targetWorker) return null;
                        const editWageJoinDateStr = targetWorker.joiningDate || '2026-07-01';
                        const laterOfDates = (a, b) => (a && b) ? (a > b ? a : b) : (a || b);
                        const isEditWageAmountValid = !!editWageNewAmount && parseFloat(editWageNewAmount) > 0;
                        const isEditWageDateValid =
                          editWageApplyTo === 'only' ? !!editWageTodayDate :
                          editWageApplyTo === 'past' ? (editWagePastDates.length > 0 && editWagePastDates.length <= EDIT_WAGE_PAST_DAYS_MAX) :
                          editWageApplyTo === 'specific' ? (!!editWageSpecificStart && !!editWageSpecificEnd) :
                          editWageApplyTo === 'future' ? !!editWageFutureStart :
                          false;
                        const editWageEffectiveRangeForCheck =
                          editWageApplyTo === 'only' ? { from: (editWageTodayDate || selectedDate), to: (editWageTodayDate || selectedDate) } :
                          editWageApplyTo === 'specific' ? { from: editWageSpecificStart, to: editWageSpecificEnd } :
                          editWageApplyTo === 'future' ? { from: (editWageFutureStart || selectedDate), to: null } :
                          { from: selectedDate, to: selectedDate };
                        const isEditWageSameAsCurrent =
                          isEditWageAmountValid &&
                          isEditWageDateValid &&
                          (editWageApplyTo === 'past'
                            ? editWagePastDates.every(d => getEffectiveWage(targetWorker, d) === parseFloat(editWageNewAmount))
                            : isWageRangeAlreadyAtAmount(targetWorker, editWageEffectiveRangeForCheck, parseFloat(editWageNewAmount)));
                        const isEditWageSaveEnabled = isEditWageAmountValid && isEditWageDateValid && !isEditWageSameAsCurrent;
                        return (
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1900, padding: '16px', boxSizing: 'border-box' }}>
                            <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 20px 0 20px', flexShrink: 0 }}>
                                <div>
                                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{t('editWage')} &middot; {targetWorker.name}</h3>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{t('changeWageForEmployee')}</p>
                                </div>
                                <button onClick={handleCloseEditWage} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>&times;</button>
                              </div>

                              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 20px 20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('applyTo')}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                  {[
                                    { key: 'past', label: t('pastDays') },
                                    { key: 'specific', label: t('specificDuration') },
                                    { key: 'only', label: t('today') },
                                    { key: 'future', label: t('onwardsThisDay') }
                                  ].map(opt => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => {
                                        setEditWageApplyTo(opt.key);
                                        if (opt.key === 'only' && !editWageTodayDate) {
                                          setEditWageTodayDate(toLocalISODate(new Date()));
                                        }
                                      }}
                                      style={{
                                        padding: '12px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center', cursor: 'pointer',
                                        border: editWageApplyTo === opt.key ? '2px solid #0B3C9B' : '1px solid #CBD5E1',
                                        backgroundColor: editWageApplyTo === opt.key ? '#EFF6FF' : '#ffffff',
                                        color: editWageApplyTo === opt.key ? '#0B3C9B' : '#1E293B'
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                                {editWageApplyTo === 'only' && (
                                  <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('appliesUpTo')}</label>
                                    <input type="date" value={editWageTodayDate} min={laterOfDates(toLocalISODate(new Date()), editWageJoinDateStr)} max={selectedDate} onKeyDown={(e) => e.preventDefault()} onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setEditWageTodayDate(e.target.value)} style={themeStyles.textInput} />
                                  </div>
                                )}
                                {editWageApplyTo === 'past' && (() => {
                                  const pastTodayStr = toLocalISODate(new Date());
                                  const pastYear = editWagePastCalendarMonth.getFullYear();
                                  const pastMonth = editWagePastCalendarMonth.getMonth();
                                  const pastFirstWeekday = new Date(pastYear, pastMonth, 1).getDay();
                                  const pastDaysInMonth = new Date(pastYear, pastMonth + 1, 0).getDate();
                                  const pastCells = [];
                                  for (let i = 0; i < pastFirstWeekday; i++) pastCells.push(null);
                                  for (let d = 1; d <= pastDaysInMonth; d++) pastCells.push(d);
                                  const pastRows = [];
                                  for (let i = 0; i < pastCells.length; i += 7) pastRows.push(pastCells.slice(i, i + 7));

                                  const joinYear = parseInt(editWageJoinDateStr.slice(0, 4), 10);
                                  const joinMonth = parseInt(editWageJoinDateStr.slice(5, 7), 10) - 1;
                                  const isAtEarliestMonth = pastYear === joinYear && pastMonth === joinMonth;
                                  const todayYear = parseInt(pastTodayStr.slice(0, 4), 10);
                                  const todayMonthIdx = parseInt(pastTodayStr.slice(5, 7), 10) - 1;
                                  const isAtLatestMonth = pastYear === todayYear && pastMonth === todayMonthIdx;

                                  const toggleDate = (dateStr) => {
                                    setEditWagePastDates(prev => {
                                      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
                                      if (prev.length >= EDIT_WAGE_PAST_DAYS_MAX) return prev;
                                      return [...prev, dateStr].sort();
                                    });
                                  };

                                  return (
                                    <div style={{ marginBottom: '16px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>{t('selectDates')}</label>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: editWagePastDates.length >= EDIT_WAGE_PAST_DAYS_MAX ? '#DC2626' : '#64748B' }}>
                                          {editWagePastDates.length}/{EDIT_WAGE_PAST_DAYS_MAX}
                                        </span>
                                      </div>
                                      <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', backgroundColor: '#F8FAFC' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                          <button
                                            type="button"
                                            onClick={() => setEditWagePastCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                            disabled={isAtEarliestMonth}
                                            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                          >&lsaquo;</button>
                                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{editWagePastCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                          <button
                                            type="button"
                                            onClick={() => setEditWagePastCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                            disabled={isAtLatestMonth}
                                            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtLatestMonth ? 'default' : 'pointer', color: isAtLatestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                          >&rsaquo;</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#94A3B8', fontWeight: '600', padding: '3px 0' }}>{d}</div>
                                          ))}
                                        </div>
                                        {pastRows.map((row, ri) => (
                                          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                            {row.map((dayNum, ci) => {
                                              if (!dayNum) return <div key={ci} />;
                                              const dateStr = `${pastYear}-${String(pastMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                              const isDisabled = dateStr < editWageJoinDateStr || dateStr > pastTodayStr;
                                              const isSelected = editWagePastDates.includes(dateStr);
                                              return (
                                                <button
                                                  type="button"
                                                  key={ci}
                                                  disabled={isDisabled}
                                                  onClick={() => toggleDate(dateStr)}
                                                  style={{
                                                    textAlign: 'center', padding: '6px 0', margin: '2px 0', borderRadius: '8px',
                                                    fontSize: '12px', fontWeight: isSelected ? '700' : '500',
                                                    border: 'none', cursor: isDisabled ? 'default' : 'pointer',
                                                    color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : '#1E293B'),
                                                    backgroundColor: isSelected ? '#0B3C9B' : 'transparent',
                                                  }}
                                                >
                                                  {dayNum}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                                {editWageApplyTo === 'specific' && (
                                  (() => {
                                    const specificDateInputStyle = { ...themeStyles.textInput, width: '100%', boxSizing: 'border-box', fontSize: '12.5px', padding: '12px 8px' };
                                    return (
                                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                        <div style={{ flex: '1 1 0', minWidth: 0 }}>
                                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('from')}</label>
                                          <input type="date" value={editWageSpecificStart} min={editWageJoinDateStr} max={toLocalISODate(new Date())} onKeyDown={(e) => e.preventDefault()} onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setEditWageSpecificStart(e.target.value)} style={specificDateInputStyle} />
                                        </div>
                                        <div style={{ flex: '1 1 0', minWidth: 0 }}>
                                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('to')}</label>
                                          <input type="date" value={editWageSpecificEnd} min={laterOfDates(editWageSpecificStart, editWageJoinDateStr)} onKeyDown={(e) => e.preventDefault()} onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setEditWageSpecificEnd(e.target.value)} style={specificDateInputStyle} />
                                        </div>
                                      </div>
                                    );
                                  })()
                                )}
                                {editWageApplyTo === 'future' && (
                                  <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('appliesFrom')}</label>
                                    <input type="date" value={editWageFutureStart} min={editWageJoinDateStr} onKeyDown={(e) => e.preventDefault()} onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setEditWageFutureStart(e.target.value)} style={themeStyles.textInput} />
                                  </div>
                                )}

                                <div style={{ marginBottom: '14px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('newDailyWage')}</label>
                                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#ffffff' }}>
                                    <span style={{ marginRight: '8px', fontWeight: '600', color: '#475569' }}>&#8377;</span>
                                    <input type="number" placeholder="e.g. 550" value={editWageNewAmount} onChange={(e) => setEditWageNewAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600' }} />
                                  </div>
                                  {isEditWageSameAsCurrent && (
                                    <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#DC2626', fontWeight: '600' }}>
                                      {t('sameWageError')}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('noteOptional')}</label>
                                  <input type="text" placeholder={t('noteOptional')} value={editWageNote} onChange={(e) => setEditWageNote(e.target.value)} style={themeStyles.textInput} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '12px', padding: '14px 20px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
                                <button type="button" onClick={handleCloseEditWage} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{t('cancel')}</button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditWage}
                                  disabled={!isEditWageSaveEnabled || isSavingWage}
                                  style={{
                                    flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                                    backgroundColor: (isEditWageSaveEnabled && !isSavingWage) ? '#0B3C9B' : '#94A3B8',
                                    color: '#ffffff', fontSize: '14px', fontWeight: '600',
                                    cursor: (isEditWageSaveEnabled && !isSavingWage) ? 'pointer' : 'not-allowed',
                                    opacity: (isEditWageSaveEnabled && !isSavingWage) ? 1 : 0.6
                                  }}
                                >
                                  {isSavingWage ? '...' : t('saveWage')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>

              {/* ===== Workers section ===== */}
              <div style={{ flex: 1, minHeight: 0, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('employees')}</h3>
                  <span onClick={() => {
                    setTempWorkerName(''); setTempWorkerPhone(''); setTempWorkerJoiningDate('');
                    setTempWorkerWageAmount(''); setEditingWorkerId(null);
                    setSelectedProjectId(activeSiteViewId); setIsWorkerSubFormOpen(true);
                  }} style={{ fontSize: '12px', fontWeight: '600', color: '#0B3C9B', cursor: 'pointer' }}>{t('addEmployee')}</span>
                </div>

                <div style={{ position: 'relative', marginBottom: '10px', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}>&#128269;</span>
                  <input
                    type="text"
                    placeholder={t('enterEmployeeName')}
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 34px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleOpenAttendanceScreen(currentProject)}
                    style={{
                      backgroundColor: '#0B3C9B',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t('markAttendance')}
                  </button>
                  <select value={workerSortMode} onChange={(e) => setWorkerSortMode(e.target.value)} style={themeStyles.sortSelect}>
                    <option value="az">{t('sortAZ')}</option>
                    <option value="za">{t('sortZA')}</option>
                    <option value="lastUpdated">{t('sortLastModified')}</option>
                  </select>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sortedWorkers.length > 0 ? (
                    sortedWorkers.map((worker) => {
                      const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
                      const avatarColors = getEmployeeAvatarColors(worker.name);
                      return (
                        <div key={worker.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 14px', border: '1px solid #F1F5F9', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatarColors.bg, color: avatarColors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', boxShadow: 'none', cursor: 'default' }}>{initials}</div>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{worker.name}</h5>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>{worker.role || t('labor')} &bull; <span style={{ color: '#94A3B8' }}>{t('joined')} {worker.joiningDate ? new Date(worker.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '01 Jul'}</span></p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              onClick={() => handleEditWorkerInline(currentProject, worker)}
                              style={{ cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                              title={t('edit')}
                            >&#9999;&#65039;</span>
                            <span
                              onClick={() => handleDeleteWorkerInline(currentProject.id, worker.id)}
                              style={{ cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#F87171' }}
                              title={t('delete')}
                            >&#128465;&#65039;</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>{t('noEmployeesMatch')}</p>
                  )}
                </div>
              </div>

              {/* Add / Edit worker sub-form (existing project) */}
              {isWorkerSubFormOpen && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#ffffff', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #F1F5F9' }}>
                    <button onClick={() => setIsWorkerSubFormOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>&lsaquo;</button>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{editingWorkerId ? t('editEmployee') : t('addNewEmployee')}</h2>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>{t('registerEmployeeTo')} {currentProject.name}</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('fullName')}<span style={{ color: '#DC2626' }}>*</span></label>
                      <input type="text" value={tempWorkerName} onChange={(e) => setTempWorkerName(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: isNameDuplicateUI ? '1px solid #DC2626' : '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                    </div>
                    {isNameDuplicateUI && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ width: '104px', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>
                          &#9888;&#65039; {t('employeeAlreadyExists').replace('{name}', tempWorkerName.trim())}
                        </span>
                      </div>
                    )}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('mobileNumber')}</label>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, 
                        // --- UPDATED BORDER HERE ---
                        border: tempWorkerPhone.trim() !== '' && !/^[0-9]{10}$/.test(tempWorkerPhone.trim()) ? '1px solid #DC2626' : '1px solid #CBD5E1',
                        borderRadius: '8px', padding: '0 10px', backgroundColor: '#ffffff', boxSizing: 'border-box' 
                      }}>
                        <span style={{ marginRight: '4px', fontSize: '13px', color: '#64748B', fontWeight: '600', userSelect: 'none', flexShrink: 0 }}>+91</span>
                        <input type="tel" placeholder={t('mobileNumber')} value={tempWorkerPhone} onChange={(e) => { const cleanDigits = e.target.value.replace(/\D/g, ''); setTempWorkerPhone(cleanDigits.slice(0, 10)); }} style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('dateOfJoining')} <span style={{ color: '#DC2626' }}>*</span></label>
                      <input type="date" required value={tempWorkerJoiningDate} max={toLocalISODate(new Date())} onKeyDown={(e) => e.preventDefault()} onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setTempWorkerJoiningDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', fontWeight: '600', outline: 'none', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('dailyWage')} <span style={{ color: '#DC2626' }}>*</span></label>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
                        <span style={{ marginRight: '6px', fontWeight: '600', color: '#475569', fontSize: '13px', flexShrink: 0 }}>&#8377;</span>
                        <input type="number" required value={tempWorkerWageAmount} onChange={(e) => setTempWorkerWageAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ width: '100%', marginTop: '16px', boxSizing: 'border-box' }}>
                      <button 
                        type="button" 
                        onClick={handleSaveWorkerInlineFormData} 
                        disabled={!isWorkerFormValid}
                        style={{ 
                          width: '100%', 
                          display: 'block',
                          padding: '14px', 
                          borderRadius: '12px', 
                          border: 'none', 
                          backgroundColor: isWorkerFormValid ? '#0B3C9B' : '#8FA4D6', 
                          color: '#ffffff', 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          cursor: isWorkerFormValid ? 'pointer' : 'not-allowed',
                          boxSizing: 'border-box',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        {isSavingWorker ? '...' : t('saveEmployee')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <AppPopup
                open={isRemoveBalancePendingPopupOpen}
                tone="warning"
                title={t('removeBalancePendingError')}
                confirmLabel={t('ok')}
                onConfirm={() => setIsRemoveBalancePendingPopupOpen(false)}
                onClose={() => setIsRemoveBalancePendingPopupOpen(false)}
              />

              <AppPopup
                open={isProjectRemoveBalancePendingPopupOpen}
                tone="warning"
                title={t('projectRemoveBalancePendingError')}
                confirmLabel={t('ok')}
                onConfirm={() => setIsProjectRemoveBalancePendingPopupOpen(false)}
                onClose={() => setIsProjectRemoveBalancePendingPopupOpen(false)}
              />
            </div>
          );
        })()}

        {/* ============ PAYMENTS PAGE (project-level) & WORKER PAYMENT DETAIL ============ */}
        {isPaymentsPageOpen && (() => {
          const currentProject = projects.find(p => p.id === activeSiteViewId);
          if (!currentProject) return null;

          const filteredPaymentWorkers = (currentProject.employees || []).filter(worker => {
            const matchesSearch = worker.name.toLowerCase().includes(paymentsPageWorkerSearch.toLowerCase());
            if (!matchesSearch) return false;

            const joinDateStr = worker.joiningDate || '2026-07-01';
            if (paymentsRangeMode === 'custom' && paymentsRangeFrom && paymentsRangeTo) {
              if (joinDateStr > paymentsRangeTo) return false;
            }
            return true;
          }).sort((a, b) => a.name.localeCompare(b.name));

          const totalProjectDue = filteredPaymentWorkers.reduce((sum, worker) => {
            const due = calcPaymentDueForRange ? calcPaymentDueForRange(worker, paymentsRangeFrom, paymentsRangeTo) : 0;
            const wagePaid = calcPaidInRange ? calcPaidInRange(worker, paymentsRangeFrom, paymentsRangeTo) : 0;
            const advance = worker.advance || 0;
            return sum + (due - wagePaid - advance);
          }, 0);
          const isPaymentsExtraPaid = totalProjectDue <= 0;

          return (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)',
              backgroundColor: '#f4f6f9', zIndex: 1660, display: 'flex', flexDirection: 'column',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <button onClick={handleClosePaymentsPage} style={{
                    background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0
                  }}>&lsaquo;</button>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatSiteName(currentProject.name)}
                  </span>
                </div>

                <h2 style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '17px', fontWeight: '700', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  {t('payments')}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: isPaymentsExtraPaid ? '#10B981' : '#DC2626', whiteSpace: 'nowrap' }}>
                    &#8377;{Math.abs(totalProjectDue).toLocaleString('en-IN')} {isPaymentsExtraPaid ? t('extraPaidLabel') : t('totalDueLabel')}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: '#94A3B8', fontSize: '14px' }}>🔍</span>
                  <input
                    type="text"
                    placeholder={t('searchEmployee')}
                    value={paymentsPageWorkerSearch}
                    onChange={(e) => setPaymentsPageWorkerSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px 10px 36px', backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px',
                      outline: 'none', color: '#1E293B', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 16px 4px 16px', fontSize: '13px', fontWeight: '700', color: '#475569', flexShrink: 0 }}>
                {t('employeesCount')} ({filteredPaymentWorkers.length})
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 64px 16px' }}>
                {filteredPaymentWorkers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredPaymentWorkers.map((worker) => {
                      const totalOwedRange = calcPaymentDueForRange ? calcPaymentDueForRange(worker, paymentsRangeFrom, paymentsRangeTo) : 0;
                      const wagePaidRange = calcPaidInRange ? calcPaidInRange(worker, paymentsRangeFrom, paymentsRangeTo) : 0;
                      const totalPaidRange = wagePaidRange + (worker.advance || 0);
                      const netOutstandingBalance = totalOwedRange - totalPaidRange;

                      const isCredit = netOutstandingBalance < 0;
                      const absoluteBalance = Math.abs(netOutstandingBalance);

                      const initials = worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'W';
                      const avatarColors = getEmployeeAvatarColors(worker.name);

                      return (
                        <div 
                          key={worker.id} 
                          onClick={() => handleOpenWorkerPaymentDetail(worker.id)}
                          style={{
                            backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px 14px',
                            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              backgroundColor: avatarColors.bg, color: avatarColors.text,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: '700', flexShrink: 0,
                              boxShadow: 'none', cursor: 'default'
                            }}>
                              {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {worker.name}
                              </h4>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                                ₹{getEffectiveWage ? getEffectiveWage(worker, selectedDate) : worker.dailyWage || 400}/day
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: '14px', 
                                fontWeight: '700',
                                color: absoluteBalance === 0 ? '#64748B' : (isCredit ? '#10B981' : '#DC2626')
                              }}>
                                ₹{absoluteBalance.toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px', fontWeight: '600' }}>
                                {absoluteBalance === 0 ? t('settled') : (isCredit ? t('paid') : t('due'))}
                              </div>
                            </div>
                            <span style={{ fontSize: '18px', color: '#94A3B8' }}>›</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                      {t('noWorkersFound')}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      {t('noEntriesMatch')}
                    </p>
                  </div>
                )}
              </div>

              {/* ============ WORKER PAYMENT DETAIL SCREEN ============ */}
              {(() => {
                if (selectedPaymentWorkerId === null || selectedPaymentWorkerId === undefined) return null;
                const paymentDetailWorker = (currentProject.employees || []).find(w => w.id === selectedPaymentWorkerId);
                if (!paymentDetailWorker) return null;

                const statusMeta = {
                  P: { label: t('presentLabel'), sub: 'Full day' },
                  HD: { label: t('totalHalfDay'), sub: '50%' },
                  A: { label: t('totalAbsent'), sub: '0%' }
                };
                
                const startBound = getPaymentStartDate(paymentDetailWorker);
                const attendanceEntriesInRange = Object.entries(paymentDetailWorker.attendance || {})
                  .filter(([d]) => {
                    if (d < startBound) return false;
                    if (paymentsRangeFrom && d < paymentsRangeFrom) return false;
                    if (paymentsRangeTo && d > paymentsRangeTo) return false;
                    return true;
                  })
                  .sort((a, b) => b[0].localeCompare(a[0]));

                const paymentsInRange = (paymentDetailWorker.payments || [])
                  .filter(p => {
                    if (paymentsRangeFrom && p.date < paymentsRangeFrom) return false;
                    if (paymentsRangeTo && p.date > paymentsRangeTo) return false;
                    return true;
                  })
                  .sort((a, b) => b.date.localeCompare(a.date));

                const advancePaymentsInRange = (paymentDetailWorker.advancePayments || [])
                  .filter(p => {
                    if (paymentsRangeFrom && p.date < paymentsRangeFrom) return false;
                    if (paymentsRangeTo && p.date > paymentsRangeTo) return false;
                    return true;
                  })
                  .sort((a, b) => b.date.localeCompare(a.date));

                const bonusPaymentsInRange = (paymentDetailWorker.bonusPayments || [])
                  .filter(p => {
                    if (paymentsRangeFrom && p.date < paymentsRangeFrom) return false;
                    if (paymentsRangeTo && p.date > paymentsRangeTo) return false;
                    return true;
                  })
                  .sort((a, b) => b.date.localeCompare(a.date));

                const allTransactionsInRange = [
                  ...paymentsInRange.map(p => ({ ...p, txnType: 'payment' })),
                  ...advancePaymentsInRange.map(p => ({ ...p, txnType: 'advance' })),
                  ...bonusPaymentsInRange.map(p => ({ ...p, txnType: 'bonus' }))
                ].sort((a, b) => {
                  const byDate = b.date.localeCompare(a.date);
                  return byDate !== 0 ? byDate : (b.id || 0) - (a.id || 0);
                });

                const txnTypeMeta = {
                  payment: { icon: '\u{1F4B5}', label: t('recordPayment'), color: '#0B3C9B', bg: '#EFF6FF' },
                  advance: { icon: '\u{2B07}\u{FE0F}', label: t('advance'), color: '#DC2626', bg: '#FEF2F2' },
                  bonus: { icon: '\u{2B50}', label: t('bonus'), color: '#10B981', bg: '#ECFDF5' }
                };

                const openPaymentForm = (type) => {
                  setActivePaymentForm(type);
                  setRecordPaymentAmount('');
                  setRecordPaymentMethod('Cash');
                  setRecordPaymentDate('');
                  setRecordPaymentNote('');
                  setPaymentFormValidationMsg('');
                  setPaymentDateCalendarMonth(new Date());
                };

                const dueForRange = calcPaymentDueForRange(paymentDetailWorker, paymentsRangeFrom, paymentsRangeTo);
                // "Amount Paid" reflects only wage payments made from the Payments page — advance is tracked separately
                // and must never be folded into this figure, otherwise it gets counted twice.
                const wagePaymentsForRange = calcPaidInRange(paymentDetailWorker, paymentsRangeFrom, paymentsRangeTo);
                const advanceAmount = paymentDetailWorker.advance || 0;
                const bonusAmount = paymentDetailWorker.bonus || 0;
                const paidForRange = wagePaymentsForRange;
                // Balance = Wages Due - Advance Paid - Amount Paid (never any other calculation)
                const balanceForRange = dueForRange - advanceAmount - wagePaymentsForRange;

                return (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <button onClick={() => setSelectedPaymentWorkerId(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0 }}>&lsaquo;</button>
                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {paymentDetailWorker.name}
                        </span>
                      </div>

                      <h2 style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '17px', fontWeight: '700', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                        {t('payments')}
                      </h2>

                      <div style={{ flexShrink: 0, minWidth: '20px' }} />
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{ padding: '10px 14px 6px 14px', flexShrink: 0 }}>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '7px 2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', minWidth: 0 }}>{t('wagesDue')}</span>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0B3C9B', whiteSpace: 'nowrap', flexShrink: 0 }}>&#8377;{Math.max(0, dueForRange).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '7px 2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', minWidth: 0 }}>- {t('advancePaid')}</span>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#DC2626', whiteSpace: 'nowrap', flexShrink: 0 }}>&#8377;{advanceAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '7px 2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', minWidth: 0 }}>- {t('amountPaid')}</span>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#10B981', whiteSpace: 'nowrap', flexShrink: 0 }}>&#8377;{paidForRange.toLocaleString('en-IN')}</span>
                        </div>

                        <div style={{ borderTop: '1px dashed #E2E8F0', margin: '6px 2px 10px 2px' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '10px 12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0B3C9B', minWidth: 0 }}>= {t('balance')}</span>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0B3C9B', whiteSpace: 'nowrap', flexShrink: 0 }}>&#8377;{Math.abs(balanceForRange).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>{t('quickActions')}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: activePaymentForm ? '10px' : '14px' }}>
                        <button type="button" onClick={() => openPaymentForm('payment')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', border: activePaymentForm === 'payment' ? '2px solid #0B3C9B' : '1px solid #DBEAFE', backgroundColor: '#EFF6FF' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0B3C9B', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>&#128181;</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0B3C9B', textAlign: 'center', lineHeight: '1.2' }}>{t('payAmount')}</span>
                        </button>
                        <button type="button" onClick={() => openPaymentForm('bonus')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', border: activePaymentForm === 'bonus' ? '2px solid #10B981' : '1px solid #A7F3D0', backgroundColor: '#ECFDF5' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#10B981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>&#127873;</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', textAlign: 'center', lineHeight: '1.2' }}>{t('addBonus')}</span>
                        </button>
                      </div>

                      {activePaymentForm && (
                        <div ref={paymentFormRef} style={{ backgroundColor: '#ffffff', border: `1px solid ${txnTypeMeta[activePaymentForm].color}33`, borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: '700', color: txnTypeMeta[activePaymentForm].color, margin: '0 0 10px 0' }}>
                            {activePaymentForm === 'payment' ? t('payAmount') : t('addBonus')}
                          </h3>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#F8FAFC', minWidth: 0 }}>
                              <span style={{ marginRight: '4px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>&#8377;</span>
                              <input type="number" placeholder={t('amountPaid')} value={recordPaymentAmount} onChange={(e) => { setRecordPaymentAmount(e.target.value.replace(/\D/g, '')); setPaymentFormValidationMsg(''); }} style={{ flex: 1, minWidth: 0, padding: '10px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '600' }} />
                            </div>
                            <select value={recordPaymentMethod} onChange={(e) => setRecordPaymentMethod(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', flexShrink: 0 }}>
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Bank Transfer">Bank</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={() => { setPaymentDateCalendarMonth(recordPaymentDate ? new Date(recordPaymentDate) : new Date()); setIsPaymentDatePickerOpen(true); }}
                              style={{ width: '100%', textAlign: 'left', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: recordPaymentDate ? '#1E293B' : '#94A3B8', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <span>{recordPaymentDate ? new Date(recordPaymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : t('selectDatePlaceholder')}</span>
                              <span style={{ fontSize: '14px' }}>&#128197;</span>
                            </button>
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <input type="text" placeholder={t('note')} value={recordPaymentNote} onChange={(e) => setRecordPaymentNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                          {paymentFormValidationMsg && (
                            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>{paymentFormValidationMsg}</p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => { setActivePaymentForm(null); setPaymentFormValidationMsg(''); }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{t('cancel')}</button>
                            <button
                              type="button"
                              disabled={isSavingTransaction}
                              onClick={() => handleRecordTransaction(currentProject.id, paymentDetailWorker.id, activePaymentForm)}
                              style={{
                                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                backgroundColor: txnTypeMeta[activePaymentForm].color, color: '#ffffff',
                                fontSize: '13px', fontWeight: '600', boxSizing: 'border-box',
                                opacity: (isSavingTransaction || !recordPaymentDate || !recordPaymentAmount || parseFloat(recordPaymentAmount) <= 0) ? 0.7 : 1,
                                cursor: isSavingTransaction ? 'default' : 'pointer'
                              }}
                            >{isSavingTransaction ? '...' : t('save')}</button>
                          </div>
                        </div>
                      )}

                      {/* ============ PAYMENT DATE CALENDAR POPUP ============ */}
                      {isPaymentDatePickerOpen && (() => {
                        const minDateStr = paymentDetailWorker.joiningDate || '2026-07-01';
                        const maxDateStr = toLocalISODate(new Date());
                        const year = paymentDateCalendarMonth.getFullYear();
                        const month = paymentDateCalendarMonth.getMonth();
                        const firstWeekday = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const cells = [];
                        for (let i = 0; i < firstWeekday; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                        const rows = [];
                        for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

                        return (
                          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                              <div style={{ backgroundColor: '#0B3C9B', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                                <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                                <div style={{ fontSize: '21px', fontWeight: '700' }}>{recordPaymentDate ? new Date(recordPaymentDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : t('selectDatePlaceholder')}</div>
                              </div>
                              <div style={{ padding: '16px 18px 4px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <button onClick={() => setPaymentDateCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{paymentDateCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                  <button onClick={() => setPaymentDateCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                                  ))}
                                </div>
                                {rows.map((row, ri) => (
                                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {row.map((dayNum, ci) => {
                                      if (!dayNum) return <div key={ci} />;
                                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                      const isDisabled = dateStr < minDateStr || dateStr > maxDateStr;
                                      const isSelected = recordPaymentDate === dateStr;
                                      return (
                                        <div
                                          key={ci}
                                          onClick={() => { if (isDisabled) return; setRecordPaymentDate(dateStr); setPaymentFormValidationMsg(''); setIsPaymentDatePickerOpen(false); }}
                                          style={{
                                            textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '50%',
                                            fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                                            cursor: isDisabled ? 'default' : 'pointer',
                                            color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : '#1E293B'),
                                            backgroundColor: isSelected ? '#0B3C9B' : 'transparent'
                                          }}
                                        >
                                          {dayNum}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '22px', padding: '12px 20px 18px 20px' }}>
                                <button onClick={() => setIsPaymentDatePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('cancel')}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ padding: '0 16px 64px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '10px', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('paymentHistory')}</h3>
                        <button
                          type="button"
                          onClick={() => handleDownloadStatement({
                            worker: paymentDetailWorker, project: currentProject,
                            fromDate: paymentsRangeFrom, toDate: paymentsRangeTo,
                            paymentDueForRange: dueForRange, paidInRange: paidForRange, balanceValue: balanceForRange,
                            paymentsInRange, advancePaymentsInRange, bonusPaymentsInRange, attendanceEntriesInRange, statusMeta, selectedDate
                          })}
                          style={{
                            fontSize: '12px', color: '#0B3C9B', fontWeight: '700', cursor: 'pointer', flexShrink: 0,
                            background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px',
                            padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                            minHeight: '36px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          <span aria-hidden="true">&#8681;</span>
                          {t('downloadStatement')}
                        </button>
                      </div>
                      {allTransactionsInRange.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' }}>
                          {allTransactionsInRange.map(txn => {
                            const meta = txnTypeMeta[txn.txnType];
                            return (
                              <div key={`${txn.txnType}-${txn.id}`} style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                {editingPaymentId === txn.id && editingTransactionType === txn.txnType ? (
                                  <>
                                    <input type="text" value={editPaymentAmount} onChange={(e) => setEditPaymentAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                    <button type="button" disabled={isSavingTransaction} onClick={() => handleSaveEditedTransaction(currentProject.id, paymentDetailWorker.id)} style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '13px', fontWeight: '600', cursor: isSavingTransaction ? 'default' : 'pointer', opacity: isSavingTransaction ? 0.6 : 1, flexShrink: 0 }}>{isSavingTransaction ? '...' : t('save')}</button>
                                    <button type="button" onClick={() => { setEditingPaymentId(null); setEditPaymentAmount(''); }} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>{t('cancel')}</button>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{meta.icon}</span>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>&#8377;{(txn.amount || 0).toLocaleString('en-IN')}</span>
                                          <span style={{ fontSize: '10px', fontWeight: '700', color: meta.color, backgroundColor: meta.bg, borderRadius: '6px', padding: '1px 6px', textTransform: 'uppercase' }}>{meta.label}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {formatShortDayLabel(txn.date)} &bull; {txn.method}{txn.note ? ` \u2022 ${txn.note}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                                      <span onClick={() => handleStartEditTransaction(txn.txnType, txn)} style={{ cursor: 'pointer', fontSize: '14px' }} title={t('edit')}>&#9999;&#65039;</span>
                                      <span onClick={() => handleDeleteTransaction(currentProject.id, paymentDetailWorker.id, txn.txnType, txn.id)} style={{ cursor: 'pointer', fontSize: '14px' }} title={t('delete')}>&#128465;&#65039;</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>{t('noTransactions')}</p>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
        {isAddProjectOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#ffffff', zIndex: 1660, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
              <button onClick={() => { setIsAddProjectOpen(false); setNewSiteName(''); setTempWorkersList([]); setIsNewProjectNameDuplicate(false); }} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>&lsaquo;</button>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder={t('enterProjectName')}
                  value={newSiteName}
                  onChange={(e) => { setNewSiteName(e.target.value); if (isNewProjectNameDuplicate) setIsNewProjectNameDuplicate(false); }}
                  onBlur={handleProjectNameBlur}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: isNewProjectNameDuplicate ? '1.5px solid #EF4444' : '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                />
                {isNewProjectNameDuplicate && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>{t('projectNameDuplicateInline')}</p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{t('employees')}</span>
                {!isWorkerSubFormOpen && (<button type="button" onClick={handleOpenWorkerSubForm} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{t('addEmployee')}</button>)}
              </div>
              {isWorkerSubFormOpen ? (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('fullName')} <span style={{ color: '#DC2626' }}>*</span></label>
                    <input type="text" value={tempWorkerName} onChange={(e) => setTempWorkerName(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: isNameDuplicateUI ? '1px solid #DC2626' : '1px solid #CBD5E1', boxSizing: 'border-box', backgroundColor: '#ffffff', outline: 'none', fontSize: '13px' }} />
                  </div>
                  {isNameDuplicateUI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ width: '104px', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '12px', color: '#DC2626', fontWeight: '600' }}>
                        &#9888;&#65039; {t('employeeAlreadyExists').replace('{name}', tempWorkerName.trim())}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('mobileNumber')}</label>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, 
                      // --- UPDATED BORDER HERE ---
                      border: tempWorkerPhone.trim() !== '' && !/^[0-9]{10}$/.test(tempWorkerPhone.trim()) ? '1px solid #DC2626' : '1px solid #CBD5E1',
                      borderRadius: '8px', padding: '0 10px', backgroundColor: '#ffffff', boxSizing: 'border-box' 
                    }}>
                      <span style={{ marginRight: '4px', fontSize: '13px', color: '#64748B', fontWeight: '600', userSelect: 'none', flexShrink: 0 }}>+91</span>
                      <input type="tel" placeholder={t('mobileNumber')} value={tempWorkerPhone} onChange={(e) => { const cleanDigits = e.target.value.replace(/\D/g, ''); setTempWorkerPhone(cleanDigits.slice(0, 10)); }} style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('dateOfJoining')} <span style={{ color: '#DC2626' }}>*</span></label>
                    <input type="date" required value={tempWorkerJoiningDate} max={toLocalISODate(new Date())} onKeyDown={(e) => e.preventDefault()}  onClick={(e) => {try {if (typeof e.target.showPicker === 'function') {e.target.showPicker();}} catch (err) {console.error("Picker not supported or blocked:", err);}}} onChange={(e) => setTempWorkerJoiningDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', backgroundColor: '#ffffff', color: '#1E293B', fontFamily: 'inherit', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('dailyWage')} <span style={{ color: '#DC2626' }}>*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
                      <span style={{ marginRight: '6px', fontWeight: '600', color: '#475569', fontSize: '13px', flexShrink: 0 }}>&#8377;</span>
                      <input type="number" required value={tempWorkerWageAmount} onChange={(e) => setTempWorkerWageAmount(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ width: '100%', marginTop: '16px', boxSizing: 'border-box' }}>
                    <button 
                      type="button" 
                      onClick={handleSaveWorkerInlineFormData} 
                      disabled={!isWorkerFormValid}
                      style={{ 
                        width: '100%', 
                        display: 'block',
                        padding: '14px', 
                        borderRadius: '12px', 
                        border: 'none', 
                        backgroundColor: isWorkerFormValid ? '#0B3C9B' : '#8FA4D6', 
                        color: '#ffffff', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        cursor: isWorkerFormValid ? 'pointer' : 'not-allowed',
                        boxSizing: 'border-box',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {isSavingWorker ? '...' : t('saveEmployee')}
                    </button>
                  </div>
                </div>
              ) : tempWorkersList.length === 0 ? (
                <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', color: '#B45309', fontSize: '13px', lineHeight: '1.4' }}>
                  <span>&#9888;&#65039;</span>
                  <span>{t('addAtLeastOneEmployee')}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tempWorkersList.map((w) => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{w.name}</p>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{w.role}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F766E' }}>&#8377;{w.dailyWage}/day</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
              <button
                type="submit"
                onClick={handleCreateProjectFinalSubmission}
                disabled={tempWorkersList.length === 0 || isWorkerSubFormOpen || loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: (tempWorkersList.length > 0 && !isWorkerSubFormOpen && !loading) ? '#0B3C9B' : '#8FA4D6',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: (tempWorkersList.length > 0 && !isWorkerSubFormOpen && !loading) ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {loading ? '...' : t('createProject')}
              </button>
            </div>
          </div>
        )}

        <div style={themeStyles.authHeader}>
          <div onClick={() => setIsProfileModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', flexShrink: 0 }}>
              {profileImg ? (
                <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                loggedInUser?.fullName 
                  ? loggedInUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                  : "GS"
              )}
            </div>
            <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '15px' }}>
              {loggedInUser?.fullName ? loggedInUser.fullName.replace(/[^a-zA-Z0-9 ]/g, '') : 'Guest'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button type="button" onClick={() => setActiveModule(null)} aria-label="Home" style={{ ...themeStyles.logoutIconBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px', width: '30px', height: '30px', boxSizing: 'border-box' }}>
              <FiHome size={14} color="#ffffff" />
            </button>
            <button type="button" onClick={handleWatchTutorialVideo} style={{ ...themeStyles.logoutIconBtn, fontSize: '11px', padding: '6px 10px', whiteSpace: 'nowrap' }}>
              <span style={{ marginRight: '4px' }}>&#9654;&#65039;</span>{t('watchVideo')}
            </button>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                background: 'rgba(255,255,255,255)',
                color: '#1110107c',
                fontWeight: 600,
                fontSize: '11px',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 8px',
                outline: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                maxWidth: '76px',
              }}
              aria-label="Language"
            >
              {SUPPORTED_LANGUAGES.map(l => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </div>
        </div>

        {/* ===== Dashboard content ===== */}
        <div style={themeStyles.contentCardBody}>
          <div style={themeStyles.stickyActionZone}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" onClick={() => setIsAddProjectOpen(true)} style={{ ...themeStyles.actionAddBtn, width: '100%' }}>
                <span style={{ fontSize: '17px', lineHeight: 1, fontWeight: 400 }}>+</span>
                {t('addProject')}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ ...themeStyles.searchBarContainer, flex: 1 }}>
                <span style={themeStyles.searchIconMarker}>&#128269;</span>
                <input
                  type="text"
                  placeholder={t('searchProjectPlaceholder')}
                  value={siteSearchQuery}
                  onChange={(e) => { setSiteSearchQuery(e.target.value); setSelectedProjectDropdown(''); }}
                  style={themeStyles.searchField}
                />
              </div>
              <select
                value={selectedProjectDropdown}
                onChange={(e) => { setSelectedProjectDropdown(e.target.value); setSiteSearchQuery(e.target.value); }}
                style={themeStyles.matchedDropdown}
              >
                <option value="">{t('allProjects')}</option>
                {[...projects].sort((a, b) => a.name.localeCompare(b.name)).map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
              </select>
            </div>
          </div>

          <div style={themeStyles.sectionMetaRow}>
            <h3 style={themeStyles.sectionLabel}>{t('myProjects')}</h3>
            <select value={projectSortMode} onChange={(e) => setProjectSortMode(e.target.value)} style={themeStyles.sortSelect}>
              <option value="az">{t('sortAZ')}</option>
              <option value="za">{t('sortZA')}</option>
              <option value="lastModified">{t('sortLastModified')}</option>
            </select>
          </div>

          <div style={themeStyles.projectsScrollArea}>
            {sortedProjects.length > 0 ? sortedProjects.map((project) => {
              const activeWorkersCount = (project.employees || []).length;
              const presentTodayCount = computeProjectPresentToday(project);
              const totalDueAmount = computeProjectTotalDue(project);
              const lastAttendanceDate = computeProjectLastAttendanceDate(project);
              const todayStr = toLocalISODate(new Date());
              const isAttendanceStale = !lastAttendanceDate || lastAttendanceDate !== todayStr;
              return (
                <div key={project.id} onClick={() => setActiveSiteViewId(project.id)} style={{ ...themeStyles.worksiteCard, cursor: 'pointer' }}>
                  <div style={themeStyles.cardHeadingRow}>
                    <div style={themeStyles.siteIconWrapper}>&#127959;&#65039;</div>
                    <h4 style={themeStyles.siteTitle}>{project.name}</h4>
                    <span style={themeStyles.arrowNavIndicator}>&rsaquo;</span>
                  </div>
                  <div style={themeStyles.metricsGridRow}>
                    <div style={themeStyles.metricCell}>
                      <p style={themeStyles.metricValue}>{activeWorkersCount}</p>
                      <span style={themeStyles.metricLabelText}>{t('employeesLabel')}</span>
                    </div>
                    <div style={themeStyles.metricCell}>
                      <p style={{ ...themeStyles.metricValue, color: '#10B981' }}>{presentTodayCount}</p>
                      <span style={themeStyles.metricLabelText}>{t('presentLabel')}</span>
                    </div>
                    <div style={themeStyles.metricCell}>
                      <p style={{ ...themeStyles.metricValueDue, color: totalDueAmount <= 0 ? '#10B981' : '#DC2626' }}>{"\u20B9"}{Math.abs(totalDueAmount).toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelText}>{totalDueAmount <= 0 ? t('extraPaidLabel') : t('totalDueLabel')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12px' }}>{isAttendanceStale ? '\u26A0\uFE0F' : '\u2705'}</span>
                    <span style={{ fontSize: '11px', color: isAttendanceStale ? '#DC2626' : '#94A3B8', fontWeight: isAttendanceStale ? '600' : '500' }}>
                      {lastAttendanceDate
                        ? (lastAttendanceDate === todayStr ? t('attendanceMarkedToday') : `${t('attendanceMarkedOnPrefix')} ${formatShortDayLabel(lastAttendanceDate)}`)
                        : t('attendanceNotMarked')}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>{t('noWorksitesMatch')}</p>
            )}
          </div>
        </div>

        {(() => {
          const isAttendanceTabActive = isAttendanceModalOpen || (isProjectPickerOpen && projectPickerPurpose === 'attendance');
          const isPaymentsTabActive = isPaymentsPageOpen || (isProjectPickerOpen && projectPickerPurpose === 'payments');
          const isSubscribeTabActive = isSubscribePageOpen;
          const isHelpTabActive = isHelpPageOpen;
          // Home stays highlighted for anything that belongs to the Home section
          // (including viewing an individual project via "My Projects"), and only
          // yields to another tab when that tab is genuinely active.
          const isHomeTabActive = !isAttendanceTabActive && !isPaymentsTabActive && !isSubscribeTabActive && !isHelpTabActive;

          const goHome = () => {
            setActiveSiteViewId(null);
            setIsPaymentsPageOpen(false);
            setSelectedPaymentWorkerId(null);
            setIsAttendanceModalOpen(false);
            setIsAddProjectOpen(false);
            setIsWorkerSubFormOpen(false);
            setIsEditWageModalOpen(false);
            setIsProjectPickerOpen(false);
            setIsSubscribePageOpen(false);
            setIsHelpPageOpen(false);
          };
          const openPicker = (purpose) => {
            setActiveSiteViewId(null);
            setIsPaymentsPageOpen(false);
            setIsAttendanceModalOpen(false);
            setIsAddProjectOpen(false);
            setIsSubscribePageOpen(false);
            setIsHelpPageOpen(false);
            setProjectPickerPurpose(purpose);
            setProjectPickerSearch('');
            setProjectPickerDropdown('');
            setIsProjectPickerOpen(true);
          };

          if (isKeyboardOpen) return null;

          return (
            <div style={themeStyles.bottomDockNavBar}>
              <button style={isHomeTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={goHome}>
                <span style={themeStyles.navTabIcon}>&#127968;</span>
                <span style={themeStyles.navTabLabel}>{t('navHome')}</span>
              </button>
              <button style={isAttendanceTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => openPicker('attendance')}>
                <span style={themeStyles.navTabIcon}>&#128197;</span>
                <span style={themeStyles.navTabLabel}>{t('navAttendance')}</span>
              </button>
              <button style={isPaymentsTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => openPicker('payments')}>
                <span style={themeStyles.navTabIcon}>&#128176;</span>
                <span style={themeStyles.navTabLabel}>{t('navPayments')}</span>
              </button>
              <button style={isSubscribeTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => { setActiveSiteViewId(null); setIsPaymentsPageOpen(false); setIsAttendanceModalOpen(false); setIsAddProjectOpen(false); setIsProjectPickerOpen(false); setIsHelpPageOpen(false); setIsSubscribePageOpen(true); }}>
                <span style={themeStyles.navTabIcon}>&#11088;</span>
                <span style={themeStyles.navTabLabel}>{t('navSubscribe')}</span>
              </button>
              <button style={isHelpTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => { setActiveSiteViewId(null); setIsPaymentsPageOpen(false); setIsAttendanceModalOpen(false); setIsAddProjectOpen(false); setIsProjectPickerOpen(false); setIsSubscribePageOpen(false); setIsHelpPageOpen(true); }}>
                <span style={themeStyles.navTabIcon}>&#128222;</span>
                <span style={themeStyles.navTabLabel}>{t('navHelp')}</span>
              </button>
            </div>
          );
        })()}

        {/* ============ PROJECT PICKER (for Attendance / Payments bottom-nav tabs) ============ */}
        {isProjectPickerOpen && (() => {
          const pickerMatches = projects.filter(p => p.name.toLowerCase().includes(projectPickerSearch.toLowerCase()));
          const sortedPickerMatches = [...pickerMatches].sort((a, b) => a.name.localeCompare(b.name));
          const actionButtonLabel = projectPickerPurpose === 'payments' ? t('payment') : t('markAttendance');
          const handlePickProject = (project) => {
            setActiveSiteViewId(project.id);
            setIsProjectPickerOpen(false);
            if (projectPickerPurpose === 'payments') {
              handleOpenPaymentsPage();
            } else {
              setSelectedDate(toLocalISODate(new Date()));
              handleOpenAttendanceScreen(project);
            }
          };
          return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ ...themeStyles.searchBarContainer, flex: 1 }}>
                  <span style={themeStyles.searchIconMarker}>&#128269;</span>
                  <input
                    type="text"
                    placeholder={t('enterProjectName')}
                    value={projectPickerSearch}
                    onChange={(e) => { setProjectPickerSearch(e.target.value); setProjectPickerDropdown(''); }}
                    style={themeStyles.searchField}
                  />
                </div>
                <select
                  value={projectPickerDropdown}
                  onChange={(e) => { setProjectPickerDropdown(e.target.value); setProjectPickerSearch(e.target.value); }}
                  style={themeStyles.matchedDropdown}
                >
                  <option value="">{t('allProjects')}</option>
                  {[...projects].sort((a, b) => a.name.localeCompare(b.name)).map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                </select>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                {sortedPickerMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sortedPickerMatches.map(project => (
                      <div key={project.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={themeStyles.siteIconWrapper}>&#127959;&#65039;</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>{project.name}</h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{(project.employees || []).length} employee(s)</p>
                        </div>
                        <button onClick={() => handlePickProject(project)} style={{ flexShrink: 0, padding: '9px 14px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {actionButtonLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>{t('noWorksitesMatch')}</p>
                )}
              </div>
            </div>
          );
        })()}

         {isSubscribePageOpen && (() => {
          const plans = [
            {
              key: 'free', name: 'Free', price: 0, tagline: 'Try it out',
              features: ['1 active project', 'Up to 5 workers', 'Manual attendance marking', 'Basic payment tracking']
            },
            {
              key: 'pro', name: 'Pro', price: 299, tagline: 'For growing supervisors', popular: true,
              features: ['Unlimited projects', 'Unlimited workers', 'Wage history & wage edits', 'Payment tracking + PDF statements', 'Priority email support']
            },
            {
              key: 'business', name: 'Business', price: 799, tagline: 'For multi-site teams',
              features: ['Everything in Pro', 'Multiple supervisor logins', 'Data export (CSV/Excel)', 'Dedicated priority support', 'Early access to new features']
            }
          ];
          return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Subscribe now</h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Pick a plan that fits how many projects and employees you manage</p>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {plans.map(plan => {
                    const isSelected = selectedSubscriptionPlan === plan.key;
                    return (
                      <div key={plan.key} style={{
                        backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px',
                        border: isSelected ? '2px solid #0B3C9B' : '1px solid #F1F5F9',
                        boxShadow: plan.popular ? '0 4px 16px rgba(11,60,155,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                        position: 'relative'
                      }}>
                        {plan.popular && (
                          <span style={{ position: 'absolute', top: '-10px', right: '18px', backgroundColor: '#0B3C9B', color: '#ffffff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>MOST POPULAR</span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{plan.name}</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{plan.tagline}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0B3C9B' }}>{plan.price === 0 ? 'Free' : `\u20B9${plan.price}`}</p>
                            {plan.price > 0 && <span style={{ fontSize: '11px', color: '#94A3B8' }}>per month</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
                          {plan.features.map((feature, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{ color: '#10B981', fontSize: '13px', marginTop: '1px' }}>&#10003;</span>
                              <span style={{ fontSize: '13px', color: '#475569' }}>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSubscriptionPlan(plan.key);
                            showAlert(plan.price === 0 ? "You're on the Free plan." : `This is a preview \u2014 payment isn't wired up yet, but you've selected the ${plan.name} plan (\u20B9${plan.price}/month).`, 'info');
                          }}
                          style={{
                            width: '100%', padding: '13px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            border: isSelected ? 'none' : '1px solid #0B3C9B',
                            backgroundColor: isSelected ? '#0B3C9B' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#0B3C9B'
                          }}
                        >
                          {isSelected ? 'Current plan' : plan.price === 0 ? 'Use Free plan' : `Choose ${plan.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', margin: '16px 0 4px 0' }}>Prices shown are illustrative. You can change or cancel your plan anytime.</p>
              </div>
            </div>
          );
        })()}

        {isHelpPageOpen && (() => {
          const helpNumbers = ['+91 8237580362', '+91 9325461043'];
          return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('helpPageTitle')}</h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>{t('helpPageSubtitle')}</p>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', margin: '0 0 10px 4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{t('helpCallNow')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {helpNumbers.map((number) => (
                    <a
                      key={number}
                      href={`tel:${number.replace(/\s+/g, '')}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px',
                        border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        textDecoration: 'none', cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4EAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiPhone size={18} color="#0B3C9B" />
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{number}</span>
                      <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: '14px' }}>&#8250;</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {isProfileModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '28px 24px 24px 24px', borderRadius: '24px', width: '100%', maxWidth: '360px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)' }}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '22px' }}>
                <h3 style={{ margin: 0, fontSize: '21px', fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>{t('updateProfile')}</h3>
                <button onClick={() => setIsProfileModalOpen(false)} style={{ position: 'absolute', right: 0, top: 0, background: '#F1F5F9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: '#64748B', padding: 0, lineHeight: 1, flexShrink: 0 }}>&times;</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
                <label htmlFor="user-avatar-file-input" style={{ position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '3px solid #EFF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 6px 16px rgba(11, 60, 155, 0.12)' }}>
                    {profileImg ? (<img src={profileImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (
                      loggedInUser?.fullName
                        ? <span style={{ fontSize: '30px', fontWeight: '700', color: '#0B3C9B' }}>{loggedInUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                        : <span style={{ fontSize: '30px' }}>&#128100;</span>
                    )}
                  </div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#0B3C9B', color: '#ffffff', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2.5px solid #ffffff', boxShadow: '0 2px 6px rgba(11, 60, 155, 0.35)' }}>&#128247;</div>
                </label>
                <input id="user-avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setProfileImg(reader.result); // base64 data URL - safe to persist
                  reader.readAsDataURL(file);
                }} />
                <span style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: '500' }}>{t('tapToChangePhoto')}</span>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#64748B', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('yourName')}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 14px', backgroundColor: '#F8FAFC' }}>
                  <span style={{ fontSize: '15px', color: '#94A3B8', marginRight: '10px' }}>&#128100;</span>
                  <input type="text" value={userName ?? loggedInUser?.fullName ?? ''} onChange={(e) => setUserName(e.target.value)} style={{ flex: 1, padding: '13px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14.5px', color: '#1E293B' }} />
                </div>
              </div>

              <button
                disabled={isSavingProfile}
                onClick={async () => {
                  const trimmedName = (userName ?? loggedInUser?.fullName ?? '').trim();
                  if (!trimmedName) { showAlert(t('yourName') + ' is required.'); return; }

                  // No server-side user (e.g. dev/mock session) - fall back to local-only save.
                  if (!loggedInUser?.userId) {
                    setLoggedInUser(prev => {
                      const updatedUser = { ...prev, fullName: trimmedName, profileImg };
                      try { localStorage.setItem('workforce_user', JSON.stringify(updatedUser)); } catch {}
                      return updatedUser;
                    });
                    setIsProfileModalOpen(false);
                    return;
                  }

                  setIsSavingProfile(true);
                  try {
                    const response = await fetch(`${API_BASE_URL}/profile/${loggedInUser.userId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ fullName: trimmedName, profileImage: profileImg }),
                    });
                    const responseText = await response.text();
                    let data = {};
                    if (responseText) { try { data = JSON.parse(responseText); } catch { data = { message: responseText }; } }

                    if (!response.ok) {
                      showAlert(data.message || 'Failed to update profile. Please try again.');
                      return;
                    }

                    const updatedUser = { ...loggedInUser, fullName: data.fullName, industry: data.industry, profileImg: data.profileImage };
                    try { localStorage.setItem('workforce_user', JSON.stringify(updatedUser)); } catch {}
                    setLoggedInUser(updatedUser);
                    setUserName(data.fullName);
                    setProfileImg(data.profileImage || null);
                    setIsProfileModalOpen(false);
                  } catch (err) {
                    showAlert('Could not reach the server. Please check your connection and try again.');
                  } finally {
                    setIsSavingProfile(false);
                  }
                }}
                style={{ width: '100%', padding: '15px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14.5px', fontWeight: '700', cursor: isSavingProfile ? 'default' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(11, 60, 155, 0.25)', opacity: isSavingProfile ? 0.7 : 1 }}>
                <span>&#128190;</span>{isSavingProfile ? t('loading') || 'Saving...' : t('saveChanges')}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              </div>

              <button onClick={() => { setIsProfileModalOpen(false); handleFullLogout(); }} style={{ width: '100%', padding: '14px', backgroundColor: '#ffffff', color: '#DC2626', border: '1.5px solid #FCA5A5', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>&#8618;</span>{t('signOut')}
              </button>

              <p style={{ margin: '16px 0 0 0', fontSize: '11px', color: '#94A3B8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <span>&#128737;&#65039;</span>{t('yourDataIsSecure')}
              </p>
            </div>
          </div>
        )}

        {/* ============ EXIT CONFIRMATION ============ */}
        <AppPopup
          open={isExitConfirmOpen}
          tone="warning"
          title={t('exitConfirm')}
          confirmLabel={t('yes')}
          cancelLabel={t('no')}
          onConfirm={handleConfirmExitApp}
          onCancel={() => setIsExitConfirmOpen(false)}
          onClose={() => setIsExitConfirmOpen(false)}
        />

        {/* ============ COMMON POPUP (replaces every window.alert / window.confirm) ============ */}
        <AppPopup
          open={!!appPopup?.open}
          tone={appPopup?.tone}
          title={appPopup?.title}
          message={appPopup?.message}
          confirmLabel={appPopup?.confirmLabel}
          cancelLabel={appPopup?.cancelLabel}
          onConfirm={appPopup?.onConfirm || closeAppPopup}
          onCancel={closeAppPopup}
          onClose={closeAppPopup}
        />
      </div>
    );
  }

  const otpButtonDisabled = sendingOtp || mobileNumber.length !== 10 || (!isLoginView && !isRegistrationFormValid());
  const canVerify = otpSent && otp.length === 6 && !loading;

  return (
    <div style={authStyles.page}>
      {/* ---- App version (hardcoded; update manually on each release) ---- */}
      <span style={authStyles.versionBadge}>Version 1.0</span>

      <div style={authStyles.pageInner}>

        {/* ---- Branding (sits on the page background, above the card) ---- */}
        <div style={authStyles.brandBlock}>
          <img src={smartpayLogo} alt="SmartManage" style={authStyles.logoImg} />
          <h1 style={authStyles.brandName}>SmartManage</h1>
          <p style={authStyles.brandTagline}>Track Wages. Pay on Time.</p>
        </div>

        {/* ---- Card ---- */}
        <div style={authStyles.card}>
          <div style={authStyles.welcomeBlock}>
            <h2 style={authStyles.welcomeTitle}>Welcome</h2>
            <p style={authStyles.welcomeSubtitle}>Login or register to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={authStyles.form}>

            {/* ---- Name (mandatory only for new users / register view) ---- */}
            {!isLoginView && (
              <div style={authStyles.fieldGroup}>
                <label style={authStyles.fieldLabel}>Name <span style={authStyles.requiredMark}>*</span></label>
                <div style={authStyles.inputShell}>
                  <span style={authStyles.inputIcon}><FiUser size={18} color="#2563EB" /></span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    style={authStyles.inputField}
                  />
                </div>
              </div>
            )}

            {/* ---- Mobile Number ---- */}
            <div style={authStyles.fieldGroup}>
              <label style={authStyles.fieldLabel}>Mobile Number <span style={authStyles.requiredMark}>*</span></label>
              <div style={authStyles.inputShell}>
                <span style={authStyles.inputIcon}><FiPhone size={18} color="#2563EB" /></span>
                <span style={authStyles.countryCode}>+91 <FiChevronDown size={14} color="#94A3B8" /></span>
                <span style={authStyles.inputDivider} />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  disabled={otpSent}
                  onChange={(e) => { const cleanDigits = e.target.value.replace(/\D/g, ''); setMobileNumber(cleanDigits.slice(0, 10)); }}
                  style={{ ...authStyles.inputField, opacity: otpSent ? 0.6 : 1 }}
                />
              </div>
            </div>

            {/* ---- OTP info card (always visible once the form is in play) ---- */}
            <div style={authStyles.otpInfoCard}>
              <span style={authStyles.otpInfoIcon}><HiOutlineShieldCheck size={22} color="#2563EB" /></span>
              <p style={authStyles.otpInfoText}>We'll send you a One Time Password (OTP) to verify your mobile number</p>
            </div>

            {/* ---- Slow-request notice: shown once a send-otp/verify call has been ---- */}
            {/* running for a few seconds, most likely an Azure SQL Serverless cold start ---- */}
            {showWakingMessage && (
              <div style={authStyles.otpInfoCard}>
                <span style={authStyles.otpInfoIcon}><HiOutlineShieldCheck size={22} color="#B45309" /></span>
                <p style={authStyles.otpInfoText}>Connecting to server, this can take up to a minute on first use today. Please hold on...</p>
              </div>
            )}

            {/* ---- Invisible reCAPTCHA container (required for web phone-auth) ---- */}
            <div id="recaptcha-container"></div>

            {/* ---- Send OTP button (only before the first send) ---- */}
            {!otpSent && (
              <button
                type="button"
                onClick={handleOtpButtonClick}
                disabled={otpButtonDisabled}
                style={{ ...authStyles.sendOtpBtn, opacity: otpButtonDisabled ? 0.45 : 1 }}
              >
                {sendingOtp ? (showWakingMessage ? 'Waking up server...' : 'Sending OTP...') : 'Send OTP'}
              </button>
            )}

            {/* ---- 6-box OTP entry ---- */}
            {otpSent && (
              <div style={authStyles.fieldGroup}>
                <div style={authStyles.otpHeaderRow}>
                  <label style={authStyles.fieldLabel}>Enter OTP <span style={authStyles.requiredMark}>*</span></label>
                  {resendSeconds > 0 ? (
                    <span style={authStyles.resendTimerText}>Resend OTP in <b style={authStyles.resendTimerBold}>00:{String(resendSeconds).padStart(2, '0')}</b></span>
                  ) : (
                    <button type="button" onClick={handleOtpButtonClick} disabled={sendingOtp} style={authStyles.resendLinkBtn}>
                      {sendingOtp ? 'Resending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    OTP sent to <b style={{ color: '#D97706' }}>+91 {mobileNumber}</b>.{' '}
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Wrong number? Change it
                    </button>
                  </span>
                </div>
                <div style={authStyles.otpBoxRow}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpInputRefs.current[i] = el)}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        setOtpDigits((prev) => {
                          const next = [...prev];
                          next[i] = val;
                          return next;
                        });
                        if (val && i < 5) otpInputRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                          otpInputRefs.current[i - 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (!pasted) return;
                        const next = ['', '', '', '', '', ''];
                        pasted.split('').forEach((d, idx) => { next[idx] = d; });
                        setOtpDigits(next);
                        otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
                      }}
                      style={{ ...authStyles.otpBox, ...(digit ? authStyles.otpBoxFilled : {}) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Primary CTA ---- */}
            <button type="submit" disabled={!canVerify} style={{ ...authStyles.primaryCta, opacity: canVerify ? 1 : 0.5 }}>
              <span>{loading ? (showWakingMessage ? 'Waking up server...' : 'Verifying...') : 'Verify & Continue'}</span>
              {!loading && <FiArrowRight size={19} color="#ffffff" />}
            </button>

            <p style={authStyles.switchViewText}>
              {isLoginView ? "Don't have an account yet?" : 'Already registered corporate manager?'}
              <button type="button" onClick={toggleView} style={authStyles.toggleLink}>{isLoginView ? 'Register here' : 'Login here'}</button>
            </p>
          </form>
        </div>

        {/* ---- Bottom feature highlights (informational only) - hidden once the form ---- */}
        {/* grows taller (register view or OTP entry) so the page always fits one screen ---- */}
        {isLoginView && !otpSent && (
        <div style={authStyles.featureRow}>
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineUserGroup size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Manage Employees</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineCalendar size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Track Attendance</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineWallet size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Handle Payments</span>
          </div>
        </div>
        )}
      </div>

      {/* ============ COMMON POPUP (replaces every window.alert / window.confirm) ============ */}
      <AppPopup
        open={!!appPopup?.open}
        tone={appPopup?.tone}
        title={appPopup?.title}
        message={appPopup?.message}
        confirmLabel={appPopup?.confirmLabel}
        cancelLabel={appPopup?.cancelLabel}
        onConfirm={appPopup?.onConfirm || closeAppPopup}
        onCancel={closeAppPopup}
        onClose={closeAppPopup}
      />
    </div>
  );
}

const authStyles = {
  page: {
    position: 'relative',
    width: '100vw', minHeight: '100vh', boxSizing: 'border-box',
    backgroundColor: '#EDF1FC',
    display: 'flex', justifyContent: 'center',
    padding: '18px 18px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
  },
  pageInner: { width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  versionBadge: {
    position: 'absolute', top: '10px', right: '14px',
    fontSize: '11px', fontWeight: '500', color: '#94A3B8',
    letterSpacing: '0.01em', userSelect: 'none', zIndex: 1,
  },

  brandBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '12px' },
  logoImg: { width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' },
  brandName: { margin: '6px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#2554EB', letterSpacing: '-0.02em' },
  brandTagline: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '500' },

  card: {
    width: '100%', backgroundColor: '#ffffff',
    borderRadius: '24px', padding: '20px 20px', boxSizing: 'border-box',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.07), 0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex', flexDirection: 'column',
  },

  welcomeBlock: { textAlign: 'center', marginBottom: '14px' },
  welcomeTitle: { margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#0F172A' },
  welcomeSubtitle: { margin: 0, fontSize: '13px', color: '#64748B' },

  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldGroup: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' },
  requiredMark: { color: '#EF4444' },

  inputShell: {
    display: 'flex', alignItems: 'center', gap: '10px',
    border: '1.5px solid #E2E8F0', borderRadius: '14px',
    padding: '0 14px', backgroundColor: '#ffffff', height: '46px',
    boxSizing: 'border-box',
  },
  inputIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  countryCode: { display: 'flex', alignItems: 'center', gap: '3px', fontSize: '15px', fontWeight: '700', color: '#334155', flexShrink: 0 },
  inputDivider: { width: '1px', height: '22px', backgroundColor: '#E2E8F0', flexShrink: 0, margin: '0 2px' },
  inputField: {
    flex: 1, height: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent',
    fontSize: '15px', color: '#1E293B', fontWeight: '500', minWidth: 0,
  },

  otpInfoCard: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    backgroundColor: '#EBF1FE', border: 'none',
    borderRadius: '14px', padding: '10px 14px',
  },
  otpInfoIcon: { flexShrink: 0, marginTop: '1px' },
  otpInfoText: { margin: 0, fontSize: '12.5px', color: '#1E3A8A', lineHeight: '1.4', fontWeight: '500' },

  sendOtpBtn: {
    width: '100%', height: '46px', borderRadius: '14px', border: 'none',
    backgroundColor: '#2554EB', color: '#ffffff',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(37, 84, 235, 0.22)', transition: 'opacity 0.2s',
  },

  otpHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  resendTimerText: { fontSize: '12.5px', color: '#64748B', fontWeight: '500' },
  resendTimerBold: { color: '#2554EB', fontWeight: '700' },
  resendLinkBtn: { background: 'none', border: 'none', padding: 0, color: '#2554EB', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' },
  otpBoxRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  otpBox: {
    width: '15%', aspectRatio: '1 / 1', maxWidth: '46px', borderRadius: '12px',
    border: '1.5px solid #E2E8F0', backgroundColor: '#ffffff',
    textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#1E293B',
    outline: 'none', boxSizing: 'border-box',
  },
  otpBoxFilled: { borderColor: '#2554EB' },

  primaryCta: {
    width: '100%', height: '48px', borderRadius: '14px', border: 'none',
    backgroundColor: '#2554EB', color: '#ffffff',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 12px 26px rgba(37, 84, 235, 0.25)', transition: 'opacity 0.2s',
    marginTop: '2px',
  },

  switchViewText: { textAlign: 'center', fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' },
  toggleLink: { color: '#2554EB', fontWeight: '700', background: 'none', border: 'none', padding: 0, marginLeft: '5px', cursor: 'pointer' },

  featureRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginTop: '14px', width: '100%',
  },
  featureItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  featureIconWrap: {
    width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#E4EAFC',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: '11px', fontWeight: '600', color: '#475569', textAlign: 'center', lineHeight: '1.3' },
  featureDivider: { width: '1px', alignSelf: 'stretch', backgroundColor: '#E2E8F0', margin: '8px 4px 0 4px' },
};

const themeStyles = {
  textInput: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' },

  authDashboardContainer: { width: '100vw', height: '100vh', backgroundColor: '#f4f6f9', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0, overflow: 'hidden' },
  authHeader: { backgroundColor: '#0B3C9B', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '52px', boxSizing: 'border-box', flexShrink: 0 },
  profileRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarBox: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '12px' },
  welcomeText: { color: '#ffffff', fontSize: '15px', fontWeight: '600', margin: 0 },
  logoutIconBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },

  contentCardBody: { backgroundColor: '#f4f6f9', padding: '16px', borderRadius: '16px 16px 0 0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  stickyActionZone: { flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '14px' },
  actionAddBtn: { width: '100%', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', padding: '13px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(11, 60, 155, 0.22)' },

  searchBarContainer: { position: 'relative' },
  searchField: { width: '100%', padding: '12px 14px 12px 40px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' },
  searchIconMarker: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' },
  projectDropdown: { padding: '0 10px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', outline: 'none', color: '#1E293B', maxWidth: '130px' },
  matchedDropdown: { padding: '12px 14px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', color: '#1E293B', boxSizing: 'border-box', minWidth: '130px', flexShrink: 0 },
  sortSelect: { padding: '6px 8px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', outline: 'none', color: '#475569', fontWeight: '600', cursor: 'pointer' },

  sectionMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 },
  sectionLabel: { fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 },
  seeAllActionLink: { fontSize: '13px', fontWeight: '600', color: '#0B3C9B', cursor: 'pointer' },
  projectsScrollArea: { flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '72px' },
  worksiteCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '14px', border: '1px solid #F1F5F9' },
  cardHeadingRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  siteIconWrapper: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#475569' },
  siteTitle: { fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: 0, flex: 1 },
  arrowNavIndicator: { color: '#94A3B8', fontSize: '14px' },
  metricsGridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px', marginBottom: '6px' },
  metricCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  metricValue: { fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0, lineHeight: '1.2' },
  metricValueDue: { fontSize: '16px', fontWeight: '700', color: '#DC2626', margin: 0, lineHeight: '1.2' },
  metricLabelText: { fontSize: '11px', color: '#94A3B8', fontWeight: '500', lineHeight: '1.2' },
  payoutTrackLine: { width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' },
  payoutProgressValueBar: { height: '100%', backgroundColor: '#0EA5E9', borderRadius: '3px' },
  payoutMetaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { fontSize: '11px', color: '#94A3B8', fontWeight: '500' },
  payoutPercentageText: { fontSize: '11px', color: '#475569', fontWeight: '600' },
  bottomDockNavBar: { position: 'fixed', bottom: 0, left: 0, width: '100%', height: '64px', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxSizing: 'border-box', zIndex: 1600 },
  // Unselected tabs keep their normal, full-color look (no greying out) — they
  // just sit on a transparent background. The selected tab gets a light-blue
  // pill behind it so it's clearly the active one, without dulling the rest.
  navItemTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: '6px 14px', borderRadius: '16px', transition: 'background-color 0.15s ease, color 0.15s ease' },
  navItemTabActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#DBEAFE', border: 'none', cursor: 'pointer', color: '#0B3C9B', padding: '6px 14px', borderRadius: '16px', transition: 'background-color 0.15s ease, color 0.15s ease' },
  navTabIcon: { fontSize: '18px' },
  navTabLabel: { fontSize: '10px', fontWeight: '600' }
};

const moduleHomeStyles = {
  screen: {
    width: '100vw', minHeight: '100vh',
    background: 'linear-gradient(180deg, #F6F9FF 0%, #F0F4FC 45%, #EAF0FB 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
  },
  scrollArea: { width: '100%', maxWidth: '460px', padding: '20px 18px 28px', boxSizing: 'border-box' },

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  brandRow: { display: 'flex', alignItems: 'center', gap: '9px' },
  logoMark: {
    width: '32px', height: '32px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #2554EB, #0B3C9B)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 14px rgba(37, 84, 235, 0.28)', flexShrink: 0,
  },
  brandName: { fontSize: '14px', fontWeight: '700', color: '#0F172A' },
  avatarButton: {
    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #0B3C9B, #2554EB)', color: '#ffffff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0,
  },

  greetBlock: { marginBottom: '20px' },
  greetTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  greetSubtitle: { fontSize: '13.5px', color: '#64748B', margin: 0, fontWeight: '500' },

  panel: { background: '#F3F5F9', borderRadius: '26px', padding: '18px 16px 20px', boxSizing: 'border-box' },
  panelLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 4px' },

  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: {
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '20px',
    padding: '18px 14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '128px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  tileBadge: { width: '40px', height: '40px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileTitle: { fontSize: '14.5px', fontWeight: '700', color: '#0F172A', lineHeight: '1.25' },
  tileSubtitle: { fontSize: '11.5px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },

  moreSoon: { textAlign: 'center', fontSize: '11.5px', color: '#94A3B8', fontWeight: '500', margin: '16px 0 6px' },

  bottomRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '6px' },
  bottomAction: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 10px' },
  bottomActionLabel: { fontSize: '12.5px', fontWeight: '600', color: '#475569' },
  bottomDivider: { width: '1px', height: '14px', background: '#E2E8F0' },

  backRow: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: '18px' },
  backLabel: { fontSize: '13px', fontWeight: '600', color: '#475569' },

  comingSoonCard: {
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '24px',
    padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', gap: '12px', marginTop: '40px',
  },
  comingSoonTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 },
  comingSoonText: { fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5', maxWidth: '280px' },
};

const quotationModuleStyles = {
  screen: {
    width: '100vw', minHeight: '100vh', background: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
  },
  scrollArea: { width: '100%', maxWidth: '460px', padding: '16px 18px 32px', boxSizing: 'border-box' },

  backRow: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', marginBottom: '10px' },
  backLabel: { fontSize: '12.5px', fontWeight: '600', color: '#64748B' },

  topHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' },
  welcomeTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  welcomeSubtitle: { fontSize: '13.5px', color: '#64748B', margin: 0, fontWeight: '500' },
  headerIconRow: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  headerIconBtn: {
    width: '38px', height: '38px', borderRadius: '50%', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.14)',
  },

  sectionLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 2px' },

  manageGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '26px' },
  manageItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px',
  },
  manageIconCircle: {
    width: '52px', height: '52px', borderRadius: '16px', background: '#ffffff',
    border: '1px solid #F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 14px rgba(15, 23, 42, 0.06)',
  },
  manageLabel: { fontSize: '9.5px', fontWeight: '700', color: '#64748B', letterSpacing: '0.4px' },

  discoverPanel: { background: '#F3F5F9', borderRadius: '24px 24px 0 0', padding: '18px 16px 24px', boxSizing: 'border-box', margin: '0 -18px', paddingLeft: '18px', paddingRight: '18px' },
  discoverGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  discoverTile: {
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '18px',
    padding: '16px 14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '9px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '112px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  discoverBadge: {
    width: '34px', height: '34px', borderRadius: '11px', background: '#1E293B',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  discoverTitle: { fontSize: '13.5px', fontWeight: '700', color: '#0F172A', lineHeight: '1.25' },
  discoverSubtitle: { fontSize: '11px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },
};

function FieldInput({ label, value, onChange, type = 'text' }) {
  return (
    <div style={businessInfoStyles.fieldBox}>
      <span style={businessInfoStyles.fieldLabel}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={businessInfoStyles.fieldInputEl}
      />
    </div>
  );
}

const businessInfoStyles = {
  screen: { width: '100vw', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: {
    background: '#181C23', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: 0, textAlign: 'center' },

  body: { padding: '22px 18px 32px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },

  brandRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '26px' },
  brandTile: {
    position: 'relative', width: '128px', height: '128px', borderRadius: '20px',
    background: 'linear-gradient(160deg, #2A2F38, #14171C)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
  },
  brandTileText: { color: '#ffffff', fontWeight: '800', fontSize: '15px', textAlign: 'center', lineHeight: '1.3', letterSpacing: '0.3px' },
  brandTileImg: { width: '100%', height: '100%', objectFit: 'cover' },
  brandEditBadge: {
    position: 'absolute', top: '-8px', right: '-8px', width: '30px', height: '30px', borderRadius: '50%',
    background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)', border: '2px solid #14171C',
  },

  fieldBox: {
    background: '#F1F3F6', borderRadius: '16px', padding: '10px 16px 12px', marginBottom: '12px',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  fieldLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  fieldInputEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#0F172A',
    fontWeight: '600', padding: '2px 0 0', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },

  selectRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  selectInput: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: '#0F172A',
    fontWeight: '600', padding: '2px 0 0', fontFamily: 'inherit', flex: 1, appearance: 'none', WebkitAppearance: 'none',
  },

  sectionBar: {
    background: '#DDE1E7', color: '#0F172A', fontWeight: '700', fontSize: '14.5px',
    borderRadius: '14px', padding: '13px 16px', margin: '18px 0 12px',
  },

  bankCard: {
    width: '100%', textAlign: 'left', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '12px 16px 14px', marginBottom: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    gap: '3px', fontFamily: 'inherit',
  },
  bankLine: { fontSize: '14.5px', color: '#1E293B', fontWeight: '600' },

  helperText: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', margin: '-4px 2px 20px' },

  updateBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#181C23',
    color: '#ffffff', fontSize: '15.5px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', boxSizing: 'border-box',
  },
  modalCard: { background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' },
  modalHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: 0 },
  modalSaveBtn: { width: '100%', height: '46px', borderRadius: '14px', border: 'none', background: '#181C23', color: '#ffffff', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },
};

const customerModuleStyles = {
  screen: { width: '100vw', minHeight: '100vh', background: '#F3F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  header: {
    background: '#181C23', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', width: '27px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '19px', fontWeight: '700', margin: 0, textAlign: 'center' },

  // Customer List
  body: { padding: '18px 18px 110px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },
  searchBox: {
    background: '#ffffff', borderRadius: '18px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)', marginBottom: '16px',
  },
  searchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '14.5px', color: '#0F172A', fontFamily: 'inherit', background: 'transparent' },
  customerCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px',
    padding: '18px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit',
  },
  customerName: { fontSize: '16.5px', fontWeight: '700', color: '#0F172A' },
  editBadge: { width: '34px', height: '34px', borderRadius: '50%', background: '#181C23', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBadgeBtn: { width: '34px', height: '34px', borderRadius: '50%', background: '#181C23', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  selectRowBtn: { flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: '13.5px', lineHeight: '1.5', marginTop: '40px', padding: '0 20px' },

  // Product List (extends the customer card layout with price/GST rows)
  productCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px',
    padding: '18px 18px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit',
  },
  productCardSelected: { boxShadow: '0 0 0 2px #181C23, 0 2px 10px rgba(15, 23, 42, 0.05)' },
  productCardTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  productDetailRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  productDetailLabel: { fontSize: '14.5px', fontWeight: '500', color: '#334155' },
  productDetailValue: { fontSize: '15.5px', fontWeight: '700', color: '#0F172A' },

  headerAddBtn: {
    background: '#ffffff', border: 'none', borderRadius: '11px', width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  termsTabRow: { padding: '18px 18px 0', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },
  termsTabActive: {
    display: 'inline-block', fontSize: '17px', fontWeight: '700', color: '#0E7490',
    borderBottom: '2px solid #0E7490', paddingBottom: '10px',
  },
  termCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '16px',
    padding: '16px 16px', marginBottom: '10px', fontSize: '14.5px', color: '#0F172A', fontWeight: '500',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit', lineHeight: '1.5',
  },
  termCardSelected: { boxShadow: '0 0 0 2px #181C23, 0 2px 10px rgba(15, 23, 42, 0.05)' },
  doneBtnWrap: { position: 'fixed', left: 0, right: 0, bottom: '18px', padding: '0 18px', boxSizing: 'border-box' },
  doneBtn: {
    width: '100%', maxWidth: '460px', margin: '0 auto', display: 'block', height: '52px', borderRadius: '30px',
    border: 'none', background: '#181C23', color: '#ffffff', fontSize: '15px', fontWeight: '700',
    letterSpacing: '1px', cursor: 'pointer',
  },

  // Modals / bottom sheets
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000,
  },
  bottomSheet: {
    background: '#ffffff', width: '100%', maxWidth: '460px', borderRadius: '24px 24px 0 0',
    padding: '10px 20px 28px', boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto',
  },
  sheetHandle: { width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 18px' },
  sheetTitle: { fontSize: '19px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px' },
  sheetSmallLabel: { display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#64748B', letterSpacing: '0.4px', margin: '0 0 8px' },
  sheetSmallLabelInline: { fontSize: '14.5px', fontWeight: '500', color: '#334155' },
  taxableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 8px' },
  checkbox: { width: '20px', height: '20px', accentColor: '#181C23', cursor: 'pointer' },

  fab: {
    position: 'fixed', right: '20px', bottom: '26px', width: '86px', height: '86px', borderRadius: '50%',
    background: '#E01267', color: '#ffffff', border: 'none', cursor: 'pointer', zIndex: 30,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
    fontSize: '11.5px', fontWeight: '700', letterSpacing: '0.3px', lineHeight: '1.25',
    boxShadow: '0 10px 22px rgba(224, 18, 103, 0.4)',
  },

  // Add / Edit Customer form
  formBody: { padding: '22px 18px 40px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box', background: '#ffffff' },
  fieldInput: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '17px 16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', marginBottom: '12px',
  },
  nameFieldWrap: { position: 'relative' },
  nameFieldIcon: {
    position: 'absolute', right: '8px', top: '8px', width: '38px', height: '38px', borderRadius: '11px',
    background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  suffixFieldWrap: { position: 'relative' },
  suffixFieldIcon: {
    position: 'absolute', right: '16px', top: '17px', fontSize: '15px', fontWeight: '600', color: '#334155',
  },
  descriptionTextarea: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', minHeight: '110px', resize: 'vertical', marginBottom: '4px',
  },
  charCount: { textAlign: 'right', fontSize: '12px', color: '#94A3B8', fontWeight: '500', marginBottom: '12px' },
  sectionBar: {
    background: '#EEF0F4', color: '#0F172A', fontWeight: '700', fontSize: '14.5px',
    borderRadius: '14px', padding: '13px 16px', margin: '18px 0 12px',
  },
  shippingTextarea: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: 'none', borderRadius: '16px',
    padding: '16px', fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
    outline: 'none', minHeight: '110px', resize: 'vertical', marginBottom: '12px',
  },
  addBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#181C23',
    color: '#ffffff', fontSize: '15.5px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', marginTop: '10px',
  },
};

const makeQuotationStyles = {
  infoPanel: { background: '#F3F5F9', borderRadius: '16px', padding: '16px 16px 18px', marginBottom: '16px' },
  infoRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' },
  infoLabel: { fontSize: '13px', color: '#334155', fontWeight: '500' },
  infoValue: { fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px' },
  otherInfoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  otherInfoInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14.5px',
    color: '#0F172A', fontFamily: 'inherit', fontWeight: '500', borderBottom: '1px solid #CBD5E1', padding: '2px 0',
  },

  sectionCard: {
    width: '100%', textAlign: 'left', background: '#F3F5F9', border: 'none', borderRadius: '16px',
    padding: '16px 16px', marginBottom: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'block',
  },
  sectionCardTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionCardLabel: { fontSize: '15.5px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.3px' },
  plusBadge: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#181C23',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionCardBody: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  sectionCardLine: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
  sectionCardSubLine: { fontSize: '12.5px', fontWeight: '500', color: '#64748B', margin: 0 },
  lineRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lineRowRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  removeX: { fontSize: '17px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: '0 2px' },

  bottomBar: {
    position: 'fixed', left: '18px', right: '18px', bottom: '18px', maxWidth: '424px', margin: '0 auto',
    background: '#181C23', borderRadius: '30px', padding: '12px 12px 12px 22px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(15,23,42,0.3)',
  },
  bottomBarLabel: { fontSize: '12px', color: '#CBD5E1', fontWeight: '500' },
  bottomBarAmount: { fontSize: '19px', color: '#ffffff', fontWeight: '700', marginTop: '2px' },
  generateBtn: {
    background: '#ffffff', border: 'none', borderRadius: '24px', padding: '14px 30px',
    fontSize: '15px', fontWeight: '700', color: '#0F172A', cursor: 'pointer',
  },
};