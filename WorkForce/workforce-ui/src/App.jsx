import './firebase';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber as firebaseSignInWithPhoneNumber } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { useState, useEffect, useRef, Fragment } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Network } from '@capacitor/network';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FaEye, FaEyeSlash, FaAddressBook, FaWhatsapp } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';
import { FiUser, FiPhone, FiChevronDown, FiArrowRight, FiArrowLeft, FiFileText, FiChevronRight, FiBox, FiClipboard, FiSearch, FiPlus, FiTrash2, FiHash, FiList, FiTag, FiDollarSign, FiTruck, FiCreditCard, FiFilter, FiCheck, FiCamera, FiImage, FiEdit3, FiEye } from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { HiOutlineUserGroup, HiOutlineCalendar, HiOutlineWallet, HiOutlineBuildingOffice2, HiOutlineLightBulb, HiOutlinePencil, HiOutlineCog6Tooth } from 'react-icons/hi2';
import smartpayLogo from './assets/icon.png';
import { jsPDF } from 'jspdf';

// ===== Multilingual support: supported languages + translation strings =====
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];
const LANGUAGE_STORAGE_KEY = 'workforce_app_language';
const BUSINESS_INFO_STORAGE_KEY = 'workforce_app_business_info';
const QUOTATION_SETTINGS_STORAGE_KEY = 'workforce_app_quotation_settings';
const INVOICE_SETTINGS_STORAGE_KEY = 'workforce_app_invoice_settings';
const PURCHASE_ORDER_SETTINGS_STORAGE_KEY = 'workforce_app_purchase_order_settings';
const PROFORMA_INVOICE_SETTINGS_STORAGE_KEY = 'workforce_app_proforma_invoice_settings';
const DELIVERY_NOTE_SETTINGS_STORAGE_KEY = 'workforce_app_delivery_note_settings';
const RECEIPT_SETTINGS_STORAGE_KEY = 'workforce_app_receipt_settings';
// Bump this whenever the Top/Bottom Message Default/Customize/Hide feature's stored shape
// changes in a way that makes old saved data untrustworthy (e.g. an older build that used
// to pre-fill "Customize" with preset text). Settings saved under an older version are
// migrated back to "Default" mode on load rather than trying to guess whether their text
// is "real" custom content or stale leftovers - the user can always re-enter Customize and
// type their own message, which will then be saved under the current version and trusted
// on every later load.
const MESSAGE_MODE_SCHEMA_VERSION = 2;
const COLUMN_HEADING_SETTINGS_STORAGE_KEY = 'workforce_app_column_heading_settings';
const CUSTOMERS_STORAGE_KEY = 'workforce_app_customers';
const PRODUCTS_STORAGE_KEY = 'workforce_app_products';
const TERMS_STORAGE_KEY = 'workforce_app_terms'; // legacy shared key - kept only to migrate existing data into the per-type keys below
const QUOTATION_TERMS_STORAGE_KEY = 'workforce_app_terms_quotation';
const PURCHASE_ORDER_TERMS_STORAGE_KEY = 'workforce_app_terms_purchase_order';
const PROFORMA_INVOICE_TERMS_STORAGE_KEY = 'workforce_app_terms_proforma_invoice';
const DELIVERY_NOTE_TERMS_STORAGE_KEY = 'workforce_app_terms_delivery_note';
const INVOICE_TERMS_STORAGE_KEY = 'workforce_app_terms_invoice';
const QUOTATIONS_STORAGE_KEY = 'workforce_app_quotations';
const INVOICES_STORAGE_KEY = 'workforce_app_invoices';
const PURCHASE_ORDERS_STORAGE_KEY = 'workforce_app_purchase_orders';
const PROFORMA_INVOICES_STORAGE_KEY = 'workforce_app_proforma_invoices';
const DELIVERY_NOTES_STORAGE_KEY = 'workforce_app_delivery_notes';
const RECEIPTS_STORAGE_KEY = 'workforce_app_receipts';
const RECEIPT_PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

// ===== Image cropper helpers (logo / signature crop tool) =====
// Given a container's rendered size and an image's natural size, computes how the image
// is actually laid out inside the container when using `object-fit: contain` (i.e. the
// visible image rect, accounting for letterboxing on one axis).
function computeContainedLayout(containerW, containerH, imgW, imgH) {
  if (!containerW || !containerH || !imgW || !imgH) {
    return { renderW: containerW || 0, renderH: containerH || 0, offsetX: 0, offsetY: 0 };
  }
  const containerRatio = containerW / containerH;
  const imgRatio = imgW / imgH;
  let renderW, renderH;
  if (imgRatio > containerRatio) {
    renderW = containerW;
    renderH = containerW / imgRatio;
  } else {
    renderH = containerH;
    renderW = containerH * imgRatio;
  }
  return {
    renderW, renderH,
    offsetX: (containerW - renderW) / 2,
    offsetY: (containerH - renderH) / 2,
  };
}
const CROP_BOX_MIN_SIZE = 32;
// Keeps a crop box's edges within the visible image rect and enforces a minimum size.
function clampCropBox(box, layout) {
  if (!layout) return box;
  const minX = layout.offsetX;
  const minY = layout.offsetY;
  const maxX = layout.offsetX + layout.renderW;
  const maxY = layout.offsetY + layout.renderH;
  let { x, y, w, h } = box;
  w = Math.max(CROP_BOX_MIN_SIZE, Math.min(w, maxX - minX));
  h = Math.max(CROP_BOX_MIN_SIZE, Math.min(h, maxY - minY));
  x = Math.min(Math.max(x, minX), maxX - w);
  y = Math.min(Math.max(y, minY), maxY - h);
  return { x, y, w, h };
}

const translations = {
  en: {
    // Navigation
    navHome: 'Home', 
    navProjectsTab: 'Projects',
    navAttendance: 'Attendance', 
    navPayments: 'Payments', 
    navSubscribe: 'Subscribe',
    navHelp: 'Contact Us',
    helpPageTitle: 'Contact Us',
    helpPageSubtitle: 'For any custom requirement or any issue related to the app, please contact us.',
    helpCallNow: 'Tap a number to call',
    letsChat: "Let's Chat",
    contactAppName: 'SmartManage',
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
    navProjectsTab: 'प्रोजेक्ट्स',
    navAttendance: 'उपस्थिति',
    navPayments: 'भुगतान',
    navSubscribe: 'सदस्यता',
    navHelp: 'संपर्क करें',
    helpPageTitle: 'संपर्क करें',
    helpPageSubtitle: 'ऐप से संबंधित किसी भी कस्टम आवश्यकता या समस्या के लिए, कृपया हमसे संपर्क करें।',
    helpCallNow: 'कॉल करने के लिए नंबर पर टैप करें',
    letsChat: 'चैट करें',
    contactAppName: 'SmartManage',
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
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

// Persistent-label form field: label always shown above the value, so a
// filled-in field never becomes unreadable/ambiguous the way a bare
// `placeholder`-only input does once it has a value. Used throughout the
// single shared Add/Edit Customer form (all 6 document tiles + Manage ->
// Customers all render the exact same form/component, so this applies
// everywhere at once).
function LabeledField({ label, as = 'input', error, rightElement, boxStyle, inputStyle, children, ...fieldProps }) {
  const box = { ...customerModuleStyles.labeledFieldBox, ...(error ? customerModuleStyles.labeledFieldBoxError : null), ...boxStyle };
  return (
    <div>
      <div style={box}>
        <label style={customerModuleStyles.labeledFieldLabel}>{label}</label>
        {/* The field itself lives in a flex:1 wrapper so a fixed-size rightElement
            (e.g. the contact-picker icon) always sits pinned to the right edge and
            vertically centered on this row, no matter how wide/narrow the input's
            own content makes it. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {as === 'textarea' ? (
              <textarea {...fieldProps} style={{ ...customerModuleStyles.labeledFieldInput, resize: 'vertical', minHeight: '64px', ...inputStyle }} />
            ) : as === 'button' ? (
              <button type="button" {...fieldProps} style={{ ...customerModuleStyles.labeledFieldButton, ...inputStyle }}>
                {children}
              </button>
            ) : (
              <input {...fieldProps} style={{ ...customerModuleStyles.labeledFieldInput, ...inputStyle }} />
            )}
          </div>
          {rightElement}
        </div>
      </div>
      {error && typeof error === 'string' && <p style={customerModuleStyles.fieldErrorText}>{error}</p>}
    </div>
  );
}

// ===== Native "pick a contact" helper =====
// Opens the phone's own Contacts app so the user can choose an existing contact,
// then hands back whatever we could read off it. Used by both the Add/Edit
// Customer form and the Add/Edit Employee form's contact-book icon.
// - On a native Capacitor build this uses @capacitor-community/contacts, which
//   shows the real system contact picker and (once the user picks someone) only
//   returns that one contact's details - no broad "read all contacts" permission
//   prompt is needed for the picker itself.
// - In a mobile browser that supports the web Contact Picker API, we fall back to
//   navigator.contacts.select so the icon still works there.
// - Anywhere else (e.g. desktop browser preview) it simply does nothing.
// Returns { name, phone, email } (fields may be empty strings) or null if the
// user cancelled, denied permission, or no contact API is available.
async function pickPhoneContact() {
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await Contacts.requestPermissions();
      if (permission?.contacts && permission.contacts !== 'granted') return null;
      const result = await Contacts.pickContact({
        projection: { name: true, phones: true, emails: true },
      });
      const contact = result?.contact;
      if (!contact) return null;
      const name = contact.name?.display
        || [contact.name?.given, contact.name?.family].filter(Boolean).join(' ')
        || '';
      const rawPhone = contact.phones?.[0]?.number || '';
      const phone = rawPhone.replace(/\D/g, '').slice(-10);
      const email = contact.emails?.[0]?.address || '';
      return { name: name.trim(), phone, email: email.trim() };
    }
    if (typeof navigator !== 'undefined' && navigator.contacts && navigator.contacts.select) {
      const [contact] = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: false });
      if (!contact) return null;
      const name = (contact.name && contact.name[0]) || '';
      const rawPhone = (contact.tel && contact.tel[0]) || '';
      const phone = rawPhone.replace(/\D/g, '').slice(-10);
      const email = (contact.email && contact.email[0]) || '';
      return { name: name.trim(), phone, email: email.trim() };
    }
  } catch (err) {
    // User cancelling the picker, or permission being denied, both land here -
    // treat it the same as "nothing picked" rather than surfacing an error.
    console.error('Contact pick failed:', err);
  }
  return null;
}

// Small round contact-book button used next to a Name field to launch
// pickPhoneContact() and hand the result to the caller's onPick callback.
function ContactPickButton({ onPick, style, ariaLabel = 'Pick from contacts' }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const picked = await pickPhoneContact();
        if (picked) onPick(picked);
      }}
      aria-label={ariaLabel}
      style={{
        border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        width: '38px', height: '38px', borderRadius: '11px',
        background: 'linear-gradient(145deg, #12786B, #0A3D38)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}
    >
      <FaAddressBook size={16} color="#ffffff" />
    </button>
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

// ===== Indian States / Union Territories list (for "Select State" pickers) =====
// Standard GST-portal state list, used wherever a customer's State is captured.
const INDIAN_STATE_LIST = [
  'ANDAMAN AND NICOBAR ISLANDS', 'ANDHRA PRADESH', 'ANDHRA PRADESH(BEFORE DIVISION)',
  'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CENTRE JURISDICTION', 'CHANDIGARH',
  'CHHATTISGARH', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DELHI', 'GOA',
  'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR', 'JHARKHAND',
  'KARNATAKA', 'KERALA', 'LADAKH', 'LAKSHADWEEP', 'MADHYA PRADESH', 'MAHARASHTRA',
  'MANIPUR', 'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'OTHER TERRITORY',
  'PUDUCHERRY', 'PUNJAB', 'RAJASTHAN', 'SIKKIM', 'TAMIL NADU', 'TELANGANA',
  'TRIPURA', 'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
];

// Displays a state name in Title Case (e.g. "ANDHRA PRADESH" -> "Andhra Pradesh")
// without altering the underlying stored/matched value, which stays uppercase.
const toTitleCase = (str) => (str || '').toLowerCase().replace(/(^|[^a-zA-Z])([a-zA-Z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

// ===== GSTIN validation =====
// Standard 15-character GSTIN format: 2-digit state code, 10-char PAN,
// 1-digit entity number, fixed 'Z', and a final checksum char.
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const isValidGSTIN = (value) => GSTIN_REGEX.test((value || '').trim().toUpperCase());

// ===== Mobile number validation =====
// Standard Indian mobile: exactly 10 digits, starting 6-9. Also rejects obviously
// fake/placeholder numbers - all-same-digit (0000000000) and simple runs (1234567890) -
// which pass a plain "10 digits" check but aren't real numbers.
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const FAKE_MOBILE_NUMBERS = new Set(['0123456789', '1234567890', '9876543210', '0987654321']);
const isValidMobileNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (!MOBILE_REGEX.test(digits)) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  if (FAKE_MOBILE_NUMBERS.has(digits)) return false;
  return true;
};

// ===== Email validation =====
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmailAddress = (value) => EMAIL_REGEX.test((value || '').trim());

// ===== PIN code validation =====
// Standard Indian PIN code: exactly 6 digits, first digit 1-9 (0 is not a valid leading digit).
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const isValidPincode = (value) => PINCODE_REGEX.test((value || '').trim());

// ===== HSN code validation =====
// HSN/SAC codes on Indian tax documents are numeric, 4/6/8 digits long.
const HSN_REGEX = /^\d{4}(\d{2}){0,2}$/;
const isValidHSN = (value) => HSN_REGEX.test((value || '').trim());

// ===== PAN validation =====
// Standard 10-character PAN format: 5 letters, 4 digits, 1 letter.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const isValidPAN = (value) => PAN_REGEX.test((value || '').trim().toUpperCase());

// ===== IFSC code validation =====
// Standard 11-character IFSC format: 4 letters (bank code), fixed '0', then
// 6 alphanumeric characters (branch code).
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const isValidIFSC = (value) => IFSC_REGEX.test((value || '').trim().toUpperCase());

// ===== UPI ID validation =====
// e.g. "name@bankhandle" - handle part before @ plus a short alphabetic bank/app suffix.
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const isValidUPI = (value) => UPI_REGEX.test((value || '').trim());

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
  },
  patch: async (endpoint, data) => {
    const response = await fetch(`${API_ROOT}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  }
};

// ===== CUSTOMERS SERVICE ===== (Backed by CustomersController.cs)
const customerService = {
  getCustomers: (userId) => api.get(`/customers?userId=${userId}`),
  createCustomer: (userId, data) => api.post(`/customers?userId=${userId}`, data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

// ===== DOCUMENTS SERVICE (Quotations, Invoices, Purchase Orders, Proforma =====
// ===== Invoices, Delivery Notes, Receipts, Terms & Settings) =====
// Backed by DocumentsController.cs. Field names in QuotationRequestDto /
// QuotationResponseDto already camelCase-match the local `quotationForm` /
// `quotations[]` shape used throughout the UI (date, quotationNo, otherInfo,
// customerId, products[], otherCharges[], termsIds[], grandTotal, status,
// createdAt, updatedAt, customer* snapshot fields) so API responses can be
// used directly as quotation objects without extra mapping.
const documentService = {
  getQuotations: (userId) => api.get(`/documents/quotations?userId=${userId}`),
  getQuotation: (id) => api.get(`/documents/quotations/${id}`),
  createQuotation: (userId, data) => api.post(`/documents/quotations?userId=${userId}`, data),
  updateQuotation: (id, data) => api.put(`/documents/quotations/${id}`, data),
  updateQuotationStatus: (id, status) => api.patch(`/documents/quotations/${id}/status`, status),
  deleteQuotation: (id) => api.delete(`/documents/quotations/${id}`),
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
// ===== Add these service definitions after the existing services =====

// ===== BUSINESS INFO SERVICE =====
const businessInfoService = {
  getBusinessInfo: (userId) => api.get(`/businessinfo?userId=${userId}`),
  updateBusinessInfo: (userId, data) => api.put(`/businessinfo?userId=${userId}`, data),
};

// ===== PRODUCTS SERVICE =====
const productsService = {
  getProducts: (userId) => api.get(`/products?userId=${userId}`),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (userId, data) => api.post(`/products?userId=${userId}`, data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// ===== INVOICES SERVICE =====
const invoicesService = {
  getInvoices: (userId) => api.get(`/documents/invoices?userId=${userId}`),
  getInvoice: (id) => api.get(`/documents/invoices/${id}`),
  createInvoice: (userId, data) => api.post(`/documents/invoices?userId=${userId}`, data),
  updateInvoice: (id, data) => api.put(`/documents/invoices/${id}`, data),
  updateInvoiceStatus: (id, status) => api.patch(`/documents/invoices/${id}/status`, status),
  deleteInvoice: (id) => api.delete(`/documents/invoices/${id}`),
};

// ===== PURCHASE ORDERS SERVICE =====
const purchaseOrdersService = {
  getPurchaseOrders: (userId) => api.get(`/documents/purchaseorders?userId=${userId}`),
  getPurchaseOrder: (id) => api.get(`/documents/purchaseorders/${id}`),
  createPurchaseOrder: (userId, data) => api.post(`/documents/purchaseorders?userId=${userId}`, data),
  updatePurchaseOrder: (id, data) => api.put(`/documents/purchaseorders/${id}`, data),
  updatePurchaseOrderStatus: (id, status) => api.patch(`/documents/purchaseorders/${id}/status`, status),
  deletePurchaseOrder: (id) => api.delete(`/documents/purchaseorders/${id}`),
};

// ===== PROFORMA INVOICES SERVICE =====
const proformaInvoicesService = {
  getProformaInvoices: (userId) => api.get(`/documents/proformainvoices?userId=${userId}`),
  getProformaInvoice: (id) => api.get(`/documents/proformainvoices/${id}`),
  createProformaInvoice: (userId, data) => api.post(`/documents/proformainvoices?userId=${userId}`, data),
  updateProformaInvoice: (id, data) => api.put(`/documents/proformainvoices/${id}`, data),
  updateProformaInvoiceStatus: (id, status) => api.patch(`/documents/proformainvoices/${id}/status`, status),
  deleteProformaInvoice: (id) => api.delete(`/documents/proformainvoices/${id}`),
};

// ===== DELIVERY NOTES SERVICE =====
const deliveryNotesService = {
  getDeliveryNotes: (userId) => api.get(`/documents/deliverynotes?userId=${userId}`),
  getDeliveryNote: (id) => api.get(`/documents/deliverynotes/${id}`),
  createDeliveryNote: (userId, data) => api.post(`/documents/deliverynotes?userId=${userId}`, data),
  updateDeliveryNote: (id, data) => api.put(`/documents/deliverynotes/${id}`, data),
  updateDeliveryNoteStatus: (id, status) => api.patch(`/documents/deliverynotes/${id}/status`, status),
  deleteDeliveryNote: (id) => api.delete(`/documents/deliverynotes/${id}`),
};

// ===== RECEIPTS SERVICE =====
const receiptsService = {
  getReceipts: (userId) => api.get(`/documents/receipts?userId=${userId}`),
  getReceipt: (id) => api.get(`/documents/receipts/${id}`),
  createReceipt: (userId, data) => api.post(`/documents/receipts?userId=${userId}`, data),
  updateReceipt: (id, data) => api.put(`/documents/receipts/${id}`, data),
  updateReceiptStatus: (id, status) => api.patch(`/documents/receipts/${id}/status`, status),
  deleteReceipt: (id) => api.delete(`/documents/receipts/${id}`),
};

// ===== SETTINGS SERVICE =====
const settingsService = {
  // Get all settings in one call
  getSettings: (userId) => api.get(`/documents/settings?userId=${userId}`),
  // Individual settings updates
  updateQuotationSettings: (userId, data) => api.put(`/documents/settings/quotation?userId=${userId}`, data),
  updateInvoiceSettings: (userId, data) => api.put(`/documents/settings/invoice?userId=${userId}`, data),
  updatePurchaseOrderSettings: (userId, data) => api.put(`/documents/settings/purchaseorder?userId=${userId}`, data),
  updateProformaInvoiceSettings: (userId, data) => api.put(`/documents/settings/proformainvoice?userId=${userId}`, data),
  updateDeliveryNoteSettings: (userId, data) => api.put(`/documents/settings/deliverynote?userId=${userId}`, data),
  updateReceiptSettings: (userId, data) => api.put(`/documents/settings/receipt?userId=${userId}`, data),
  updateColumnHeadingSettings: (userId, data) => api.put(`/documents/settings/columnheading?userId=${userId}`, data),
};

// ===== TERMS SERVICE =====
const termsService = {
  getTerms: (userId, documentType) => api.get(`/documents/terms?userId=${userId}&documentType=${documentType}`),
  createTerm: (userId, documentType, data) => api.post(`/documents/terms?userId=${userId}&documentType=${documentType}`, data),
  deleteTerm: (id) => api.delete(`/documents/terms/${id}`),
};
// Add this state near other state declarations
// ===== LOAD BUSINESS INFO =====
const [loadingBusinessInfo, setLoadingBusinessInfo] = useState(false);
const loadUserBusinessInfo = async (userId) => {
  try {
    setLoadingBusinessInfo(true);
    const response = await businessInfoService.getBusinessInfo(userId);
    if (response) {
      setBusinessInfo(prev => ({
        ...prev,
        logoImg: response.logoImg || null,
        signatureImg: response.signatureImg || null,
        qrCodeImg: response.qrCodeImg || null,
        businessName: response.businessName || prev.businessName,
        contactName: response.contactName || '',
        email: response.email || '',
        phone: response.phone || '',
        addressLine1: response.addressLine1 || '',
        addressLine2: response.addressLine2 || '',
        addressLine3: response.city || '',
        otherInfo: response.otherInfo || '',
        businessCategory: response.businessCategory || '',
        taxLabel: response.taxLabel || 'GSTIN',
        taxNumber: response.taxNumber || '',
        state: response.state || '',
        pincode: response.pincode || '',
        bankAccountName: response.bankAccountName || '',
        bankAccountNumber: response.bankAccountNumber || '',
        bankName: response.bankName || '',
        ifscCode: response.ifscCode || '',
        upiId: response.upiId || '',
      }));
      try { localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(businessInfo)); } catch { /* ignore */ }
    }
  } catch (error) {
    console.error('Error loading business info:', error);
  } finally {
    setLoadingBusinessInfo(false);
  }
};

// ===== LOAD PRODUCTS =====
const [loadingProducts, setLoadingProducts] = useState(false);
const loadUserProducts = async (userId) => {
  try {
    setLoadingProducts(true);
    const response = await productsService.getProducts(userId);
    setProducts(response);
    try { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading products:', error);
    // Keep local cache on failure
  } finally {
    setLoadingProducts(false);
  }
};

// ===== LOAD INVOICES =====
const [loadingInvoices, setLoadingInvoices] = useState(false);
const loadUserInvoices = async (userId) => {
  try {
    setLoadingInvoices(true);
    const response = await invoicesService.getInvoices(userId);
    setInvoices(response);
    try { localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading invoices:', error);
  } finally {
    setLoadingInvoices(false);
  }
};

// ===== LOAD PURCHASE ORDERS =====
const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
const loadUserPurchaseOrders = async (userId) => {
  try {
    setLoadingPurchaseOrders(true);
    const response = await purchaseOrdersService.getPurchaseOrders(userId);
    setPurchaseOrders(response);
    try { localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading purchase orders:', error);
  } finally {
    setLoadingPurchaseOrders(false);
  }
};

// ===== LOAD PROFORMA INVOICES =====
const [loadingProformaInvoices, setLoadingProformaInvoices] = useState(false);
const loadUserProformaInvoices = async (userId) => {
  try {
    setLoadingProformaInvoices(true);
    const response = await proformaInvoicesService.getProformaInvoices(userId);
    setProformaInvoices(response);
    try { localStorage.setItem(PROFORMA_INVOICES_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading proforma invoices:', error);
  } finally {
    setLoadingProformaInvoices(false);
  }
};

// ===== LOAD DELIVERY NOTES =====
const [loadingDeliveryNotes, setLoadingDeliveryNotes] = useState(false);
const loadUserDeliveryNotes = async (userId) => {
  try {
    setLoadingDeliveryNotes(true);
    const response = await deliveryNotesService.getDeliveryNotes(userId);
    setDeliveryNotes(response);
    try { localStorage.setItem(DELIVERY_NOTES_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading delivery notes:', error);
  } finally {
    setLoadingDeliveryNotes(false);
  }
};

// ===== LOAD RECEIPTS =====
const [loadingReceipts, setLoadingReceipts] = useState(false);
const loadUserReceipts = async (userId) => {
  try {
    setLoadingReceipts(true);
    const response = await receiptsService.getReceipts(userId);
    setReceipts(response);
    try { localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading receipts:', error);
  } finally {
    setLoadingReceipts(false);
  }
};

// ===== LOAD SETTINGS =====
const [loadingSettings, setLoadingSettings] = useState(false);
const loadUserSettings = async (userId) => {
  try {
    setLoadingSettings(true);
    const response = await settingsService.getSettings(userId);
    
    if (response.quotation) {
      // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") coming
      // from the server to the supported Yes/No options, defaulting to "Yes".
      const normalizedQuotation = { ...response.quotation, taxType: response.quotation.taxType === 'No' ? 'No' : 'Yes' };
      setQuotationSettings(prev => ({ ...prev, ...normalizedQuotation }));
      localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedQuotation));
    }
    if (response.invoice) {
      const normalizedInvoice = { ...response.invoice, taxType: response.invoice.taxType === 'No' ? 'No' : 'Yes' };
      setInvoiceSettings(prev => ({ ...prev, ...normalizedInvoice }));
      localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedInvoice));
    }
    if (response.purchaseOrder) {
      const normalizedPurchaseOrder = { ...response.purchaseOrder, taxType: response.purchaseOrder.taxType === 'No' ? 'No' : 'Yes' };
      setPurchaseOrderSettings(prev => ({ ...prev, ...normalizedPurchaseOrder }));
      localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedPurchaseOrder));
    }
    if (response.proformaInvoice) {
      const normalizedProformaInvoice = { ...response.proformaInvoice, taxType: response.proformaInvoice.taxType === 'No' ? 'No' : 'Yes' };
      setProformaInvoiceSettings(prev => ({ ...prev, ...normalizedProformaInvoice }));
      localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedProformaInvoice));
    }
    if (response.deliveryNote) {
      setDeliveryNoteSettings(prev => ({ ...prev, ...response.deliveryNote }));
      localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(response.deliveryNote));
    }
    if (response.receipt) {
      setReceiptSettings(prev => ({ ...prev, ...response.receipt }));
      localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(response.receipt));
    }
    if (response.columnHeading) {
      setColumnHeadingSettings(prev => ({ ...prev, ...response.columnHeading }));
      localStorage.setItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY, JSON.stringify(response.columnHeading));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    setLoadingSettings(false);
  }
};

// ===== LOAD TERMS =====
const loadUserTerms = async (userId) => {
  try {
    // Load terms for each document type
    const types = ['Quotation', 'Invoice', 'PurchaseOrder', 'ProformaInvoice', 'DeliveryNote'];
    const results = await Promise.all(
      types.map(type => termsService.getTerms(userId, type).catch(() => []))
    );
    
    if (results[0]) setQuotationTerms(results[0]);
    if (results[1]) setInvoiceTerms(results[1]);
    if (results[2]) setPurchaseOrderTerms(results[2]);
    if (results[3]) setProformaInvoiceTerms(results[3]);
    if (results[4]) setDeliveryNoteTerms(results[4]);
  } catch (error) {
    console.error('Error loading terms:', error);
  }
};
// Loads this user's quotations from the server and replaces local state +
// the localStorage cache with what the DB actually has, the same pattern
// used for loadUserProjects above.
const loadUserQuotations = async (userId) => {
  try {
    setLoadingQuotations(true);
    const response = await documentService.getQuotations(userId);
    setQuotations(response);
    try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading quotations:', error);
    // Keep whatever was already loaded from the localStorage cache on failure,
    // so the user can still see their last-known quotations while offline.
  } finally {
    setLoadingQuotations(false);
  }
};

// Add this state near other state declarations
const [loadingCustomers, setLoadingCustomers] = useState(false);
// Loads this user's customers from the server and replaces local state +
// the localStorage cache with what the DB actually has - same pattern as
// loadUserQuotations above. This is what makes customer.id a real numeric
// DB id instead of the old client-generated string id.
const loadUserCustomers = async (userId) => {
  try {
    setLoadingCustomers(true);
    const response = await customerService.getCustomers(userId);
    setCustomers(response);
    try { localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading customers:', error);
    // Keep whatever was already loaded from the localStorage cache on failure.
  } finally {
    setLoadingCustomers(false);
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
  // Shared initials fallback (e.g. "Nilendra Gokhe" -> "NG") used everywhere the
  // profile photo is missing/removed - keeps the header avatar and the Update
  // Profile modal avatar consistent.
  const getInitials = (fullName) => {
    if (!fullName || !fullName.trim()) return '';
    return fullName.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  // ===== Module home screen: null = show module picker, 'attendance' | 'quotations' = inside that module =====
  const [activeModule, setActiveModule] = useState(null);
  // ===== Sub-screen inside the Quotations module (e.g. 'business' = Update Business Info) =====
  const [quotationSubView, setQuotationSubView] = useState(null);
  // Where the product-picker screen ("Select Product") should return to on Back - captured at
  // the moment it's opened, since it can be reached either directly from a document's PRODUCTS
  // row or from that document's Add Product line form (when changing an already-picked product).
  const [productPickerReturnView, setProductPickerReturnView] = useState(null);
  const [businessInfo, setBusinessInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      logoImg: null, signatureImg: null, qrCodeImg: null,
      businessName: (loggedInUser?.industry || '').toLowerCase(),
      contactName: '', email: '',
      phone: loggedInUser?.mobileNumber ? `+91 ${loggedInUser.mobileNumber}` : '',
      addressLine1: '', addressLine2: '', addressLine3: '',
      otherInfo: '', businessCategory: '',
      taxLabel: 'GSTIN', taxNumber: '', state: '', pincode: '',
      bankAccountName: '', bankAccountNumber: '', bankName: '', ifscCode: '', upiId: '',
    };
  });
  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
  const [businessInfoErrors, setBusinessInfoErrors] = useState({});
  const updateBusinessField = (key, value) => {
    setBusinessInfo(prev => ({ ...prev, [key]: value }));
    if (businessInfoErrors[key]) setBusinessInfoErrors(prev => ({ ...prev, [key]: false }));
  };
  const handleUpdateBusinessInfo = async () => {
  const errors = {};
  if (businessInfo.email.trim() && !isValidEmailAddress(businessInfo.email)) errors.email = 'Enter a valid email address';
  if (businessInfo.phone.trim() && !isValidMobileNumber(businessInfo.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (businessInfo.taxNumber.trim()) {
    if (businessInfo.taxLabel === 'GSTIN' && !isValidGSTIN(businessInfo.taxNumber)) errors.taxNumber = 'Enter a valid GSTIN';
    if (businessInfo.taxLabel === 'PAN' && !isValidPAN(businessInfo.taxNumber)) errors.taxNumber = 'Enter a valid PAN';
  }
  if (businessInfo.upiId.trim() && !isValidUPI(businessInfo.upiId)) errors.upiId = 'Enter a valid UPI ID';
  if ((businessInfo.pincode || '').trim() && !isValidPincode(businessInfo.pincode)) errors.pincode = 'Enter a valid 6-digit PIN code';
  if (businessInfo.ifscCode.trim() && !isValidIFSC(businessInfo.ifscCode)) errors.ifscCode = 'Enter a valid 11-character IFSC code';
  
  if (Object.keys(errors).length > 0) {
    setBusinessInfoErrors(errors);
    showAlert('Please correct the highlighted fields.', 'error');
    return;
  }
  
  setBusinessInfoErrors({});
  
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save business info.');
    return;
  }

  try {
    const result = await businessInfoService.updateBusinessInfo(loggedInUser.userId, {
      logoImg: businessInfo.logoImg,
      signatureImg: businessInfo.signatureImg,
      qrCodeImg: businessInfo.qrCodeImg,
      businessName: businessInfo.businessName,
      contactName: businessInfo.contactName,
      email: businessInfo.email,
      phone: businessInfo.phone,
      addressLine1: businessInfo.addressLine1,
      addressLine2: businessInfo.addressLine2,
      city: businessInfo.addressLine3,
      otherInfo: businessInfo.otherInfo,
      businessCategory: businessInfo.businessCategory,
      taxLabel: businessInfo.taxLabel,
      taxNumber: businessInfo.taxNumber,
      state: businessInfo.state,
      pincode: businessInfo.pincode,
      bankAccountName: businessInfo.bankAccountName,
      bankAccountNumber: businessInfo.bankAccountNumber,
      bankName: businessInfo.bankName,
      ifscCode: businessInfo.ifscCode,
      upiId: businessInfo.upiId,
    });
    
    // Update local state with server response
    setBusinessInfo(prev => ({
      ...prev,
      logoImg: result.logoImg || prev.logoImg,
      signatureImg: result.signatureImg || prev.signatureImg,
      qrCodeImg: result.qrCodeImg || prev.qrCodeImg,
      businessName: result.businessName || prev.businessName,
      contactName: result.contactName || prev.contactName,
      email: result.email || prev.email,
      phone: result.phone || prev.phone,
      addressLine1: result.addressLine1 || prev.addressLine1,
      addressLine2: result.addressLine2 || prev.addressLine2,
      addressLine3: result.city || prev.addressLine3,
      otherInfo: result.otherInfo || prev.otherInfo,
      businessCategory: result.businessCategory || prev.businessCategory,
      taxLabel: result.taxLabel || prev.taxLabel,
      taxNumber: result.taxNumber || prev.taxNumber,
      state: result.state || prev.state,
      pincode: result.pincode || prev.pincode,
      bankAccountName: result.bankAccountName || prev.bankAccountName,
      bankAccountNumber: result.bankAccountNumber || prev.bankAccountNumber,
      bankName: result.bankName || prev.bankName,
      ifscCode: result.ifscCode || prev.ifscCode,
      upiId: result.upiId || prev.upiId,
    }));
    
    try { localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(businessInfo)); } catch { /* ignore */ }
    showSuccess('Business info updated.');
    setQuotationSubView(null);
  } catch (error) {
    console.error('Error updating business info:', error);
    showAlert('Could not save business info. Please try again.');
  }
};
  const handleCloseBankDetailsModal = () => {
    if (businessInfo.ifscCode.trim() && !isValidIFSC(businessInfo.ifscCode)) {
      setBusinessInfoErrors(prev => ({ ...prev, ifscCode: 'Enter a valid 11-character IFSC code' }));
      showAlert('Please enter a valid IFSC code.', 'error');
      return;
    }
    setIsBankDetailsModalOpen(false);
  };
  const handleBusinessImagePick = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openImageCropper(key, reader.result);
    reader.readAsDataURL(file);
  };

  // ===== Business Info: Logo / Signature image action sheet, viewer, and signature drawing pad =====
  const [imageActionSheet, setImageActionSheet] = useState(null); // 'logo' | 'signature' | null
  const [imageViewerSrc, setImageViewerSrc] = useState(null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [signaturePadKey, setSignaturePadKey] = useState(0);
  const logoCameraInputRef = useRef(null);
  const logoPhotoInputRef = useRef(null);
  const signatureCameraInputRef = useRef(null);
  const signaturePhotoInputRef = useRef(null);
  const qrCodeCameraInputRef = useRef(null);
  const qrCodePhotoInputRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const signatureDrawingRef = useRef(false);
  const openImageActionSheet = (type) => setImageActionSheet(type);
  const closeImageActionSheet = () => setImageActionSheet(null);
  const handleRemoveBusinessImage = (key) => {
    updateBusinessField(key, null);
    closeImageActionSheet();
  };
  const openSignaturePad = () => {
    setSignaturePadKey((k) => k + 1);
    setIsSignaturePadOpen(true);
    closeImageActionSheet();
  };
  const getSignatureCanvasPoint = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  const handleSignaturePointerDown = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    signatureDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getSignatureCanvasPoint(e);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const handleSignaturePointerMove = (e) => {
    if (!signatureDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getSignatureCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const handleSignaturePointerUp = () => {
    signatureDrawingRef.current = false;
  };
  const handleClearSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };
  const handleSaveSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    updateBusinessField('signatureImg', canvas.toDataURL('image/png'));
    setIsSignaturePadOpen(false);
  };

  // ===== Business Info: Logo / Signature crop tool =====
  // Lets the user pick a rectangle from a picked photo and keep only that part - e.g. just
  // their face for the logo tile, or just the ink for a signature photo with a white margin.
  const [imageCropper, setImageCropper] = useState(null); // { key: 'logoImg' | 'signatureImg', src }
  const [cropBox, setCropBox] = useState(null); // { x, y, w, h } in crop-container CSS px
  const [cropImgLayout, setCropImgLayout] = useState(null); // { renderW, renderH, offsetX, offsetY }
  const cropContainerRef = useRef(null);
  const cropImgElRef = useRef(null);
  const cropDragRef = useRef(null); // { mode: 'move'|'nw'|'ne'|'sw'|'se', startPointerX, startPointerY, startBox }
  const openImageCropper = (key, src) => {
    setCropBox(null);
    setCropImgLayout(null);
    setImageCropper({ key, src });
  };
  const closeImageCropper = () => {
    setImageCropper(null);
    setCropBox(null);
    setCropImgLayout(null);
    cropDragRef.current = null;
  };
  const handleCropImageLoad = () => {
    const img = cropImgElRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    const layout = computeContainedLayout(rect.width, rect.height, img.naturalWidth, img.naturalHeight);
    setCropImgLayout(layout);
    // Default to the full image so tapping "Use Crop" without adjusting keeps everything.
    setCropBox({ x: layout.offsetX, y: layout.offsetY, w: layout.renderW, h: layout.renderH });
  };
  const handleCropPointerDown = (e, mode) => {
    if (!cropBox) return;
    e.stopPropagation();
    e.preventDefault();
    cropDragRef.current = { mode, startPointerX: e.clientX, startPointerY: e.clientY, startBox: { ...cropBox } };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const handleCropPointerMove = (e) => {
    const drag = cropDragRef.current;
    if (!drag || !cropImgLayout) return;
    const dx = e.clientX - drag.startPointerX;
    const dy = e.clientY - drag.startPointerY;
    const next = { ...drag.startBox };
    if (drag.mode === 'move') {
      next.x = drag.startBox.x + dx;
      next.y = drag.startBox.y + dy;
    } else {
      if (drag.mode.includes('e')) next.w = drag.startBox.w + dx;
      if (drag.mode.includes('s')) next.h = drag.startBox.h + dy;
      if (drag.mode.includes('w')) { next.x = drag.startBox.x + dx; next.w = drag.startBox.w - dx; }
      if (drag.mode.includes('n')) { next.y = drag.startBox.y + dy; next.h = drag.startBox.h - dy; }
    }
    setCropBox(clampCropBox(next, cropImgLayout));
  };
  const handleCropPointerUp = () => {
    cropDragRef.current = null;
  };
  const handleResetImageCrop = () => {
    if (!cropImgLayout) return;
    setCropBox({ x: cropImgLayout.offsetX, y: cropImgLayout.offsetY, w: cropImgLayout.renderW, h: cropImgLayout.renderH });
  };
  const handleConfirmImageCrop = () => {
    const img = cropImgElRef.current;
    if (!img || !cropBox || !cropImgLayout || !imageCropper) return;
    const scale = img.naturalWidth / cropImgLayout.renderW;
    const sx = (cropBox.x - cropImgLayout.offsetX) * scale;
    const sy = (cropBox.y - cropImgLayout.offsetY) * scale;
    const sw = cropBox.w * scale;
    const sh = cropBox.h * scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    if (imageCropper.key === 'profileImg') {
      setProfileImg(dataUrl);
    } else {
      updateBusinessField(imageCropper.key, dataUrl);
    }
    closeImageCropper();
  };

  // Shared crop tool UI - used for the Business Info logo/signature pickers AND the
  // Update Profile avatar picker, so every "pick a photo" flow in the app crops the same way.
  const renderImageCropperModal = () => {
    if (!imageCropper) return null;
    const cropTitle = imageCropper.key === 'signatureImg' ? 'Crop Signature' : (imageCropper.key === 'qrCodeImg' ? 'Crop QR Code' : 'Crop Photo');
    // zIndex explicitly bumped above the shared modalOverlay (2000) so the cropper
    // always sits on top of whichever modal launched it - e.g. Update Profile (9999).
    return (
      <div style={{ ...customerModuleStyles.modalOverlay, zIndex: 10000 }} onClick={closeImageCropper}>
        <div style={{ background: '#ffffff', width: 'calc(100% - 40px)', maxWidth: '460px', borderRadius: '24px', padding: '20px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px', textAlign: 'center' }}>
            {cropTitle}
          </h3>
          <div
            ref={cropContainerRef}
            style={{ position: 'relative', width: '100%', height: '300px', background: '#F1F5F9', borderRadius: '14px', overflow: 'hidden', touchAction: 'none' }}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerLeave={handleCropPointerUp}
          >
            <img
              ref={cropImgElRef}
              src={imageCropper.src}
              alt="To crop"
              onLoad={handleCropImageLoad}
              draggable={false}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
            />
            {cropBox && (
              <div
                onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                style={{
                  position: 'absolute', left: `${cropBox.x}px`, top: `${cropBox.y}px`,
                  width: `${cropBox.w}px`, height: `${cropBox.h}px`,
                  border: '2px solid #0F766E', boxShadow: '0 0 0 2000px rgba(15, 23, 42, 0.5)',
                  cursor: 'move', boxSizing: 'border-box',
                }}
              >
                {['nw', 'ne', 'sw', 'se'].map((corner) => (
                  <div
                    key={corner}
                    onPointerDown={(e) => handleCropPointerDown(e, corner)}
                    style={{
                      position: 'absolute', width: '22px', height: '22px', background: '#0F766E',
                      borderRadius: '50%', border: '2px solid #ffffff', boxSizing: 'border-box',
                      top: corner.includes('n') ? '-11px' : 'auto',
                      bottom: corner.includes('s') ? '-11px' : 'auto',
                      left: corner.includes('w') ? '-11px' : 'auto',
                      right: corner.includes('e') ? '-11px' : 'auto',
                      cursor: `${corner}-resize`,
                      touchAction: 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '14px' }}>
            <button type="button" onClick={closeImageCropper} style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#ffffff', color: '#334155', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="button" onClick={handleConfirmImageCrop} style={{ ...businessInfoStyles.modalSaveBtn, width: 'auto', flex: 1, marginTop: 0 }}>Crop</button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Quotations module: Quotation Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
  const QUOTATION_DEFAULT_TOP_MESSAGE = 'Thank you for considering us. Please find our quotation below';
  const QUOTATION_DEFAULT_BOTTOM_MESSAGE = 'We look forward to working with you';
  // The true, hardcoded factory defaults for Quotation Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
  const getDefaultQuotationSettings = () => ({
    numberPrefix: 'Quote-',
    serialNumber: '5',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: QUOTATION_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: QUOTATION_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });
  // Reads Quotation Settings from local storage (normalizing legacy fields), or falls back
  // to getDefaultQuotationSettings() below. Used only as the initial state on load - the
  // Reset button below intentionally does NOT use this (see getDefaultQuotationSettings).
  const loadQuotationSettings = () => {
    try {
      const saved = localStorage.getItem(QUOTATION_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes".
        {
          // Settings saved under an older schema version (before this migration existed,
          // or by a build that used to pre-fill "Customize" with preset text) can't be
          // trusted to reflect a real user choice - migrate them straight back to
          // "Default" mode/text. Settings already on the current version are honored as-is,
          // including a genuine Customize selection with the user's own typed message.
          const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
          const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
          const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
          return {
            ...parsed,
            taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
            messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
            topMessageMode: topMode,
            topMessage: topMode === 'Default' ? QUOTATION_DEFAULT_TOP_MESSAGE : parsed.topMessage,
            bottomMessageMode: bottomMode,
            bottomMessage: bottomMode === 'Default' ? QUOTATION_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
          };
        }
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultQuotationSettings();
  };
  const [quotationSettings, setQuotationSettings] = useState(loadQuotationSettings);
  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Quotation created, the same
  // way Update does. Any already-created Quotation documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetQuotationSettings = () => {
    showConfirm('Reset Quotation Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultQuotationSettings();
      setQuotationSettings(defaults);
      try { localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updateQuotationSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting quotation settings on server:', error);
        }
      }
      showSuccess('Quotation settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };
  const [activeSettingsSheet, setActiveSettingsSheet] = useState(null);
  const updateQuotationSettingField = (key, value) => setQuotationSettings(prev => ({ ...prev, [key]: value }));
  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Quotation
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyQuotationMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? QUOTATION_DEFAULT_TOP_MESSAGE : QUOTATION_DEFAULT_BOTTOM_MESSAGE;
    setQuotationSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };
  // ✅ CORRECT - Calls the API
const handleUpdateQuotationSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateQuotationSettings(loggedInUser.userId, quotationSettings);
    try { localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(quotationSettings)); } catch { /* ignore */ }
    showSuccess('Quotation settings updated.');
  } catch (error) {
    console.error('Error updating quotation settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  // ===== Quotations module: Invoice Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
  const INVOICE_DEFAULT_TOP_MESSAGE = 'Thank you for your continued business. Please find the invoice details below';
  const INVOICE_DEFAULT_BOTTOM_MESSAGE = 'Thank you for your prompt payment';
  // The true, hardcoded factory defaults for Invoice Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
  const getDefaultInvoiceSettings = () => ({
    numberPrefix: 'INV-',
    serialNumber: '2',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: INVOICE_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: INVOICE_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });
  // Reads Invoice Settings from local storage (normalizing legacy fields), or falls back to
  // getDefaultInvoiceSettings() below. Used only as the initial state on load - the Reset
  // button below intentionally does NOT use this (see getDefaultInvoiceSettings).
  const loadInvoiceSettings = () => {
    try {
      const saved = localStorage.getItem(INVOICE_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes". Settings saved under an older
        // schema version (before this migration existed, or by a build that used to
        // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
        // choice - migrate them straight back to "Default" mode/text. Settings already on
        // the current version are honored as-is, including a genuine Customize selection.
        const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
        const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
        const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
        return {
          ...parsed,
          taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
          messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
          topMessageMode: topMode,
          topMessage: topMode === 'Default' ? INVOICE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
          bottomMessageMode: bottomMode,
          bottomMessage: bottomMode === 'Default' ? INVOICE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
        };
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultInvoiceSettings();
  };
  const [invoiceSettings, setInvoiceSettings] = useState(loadInvoiceSettings);
  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Invoice created, the same
  // way Update does. Any already-created Invoice documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetInvoiceSettings = () => {
    showConfirm('Reset Invoice Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultInvoiceSettings();
      setInvoiceSettings(defaults);
      try { localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updateInvoiceSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting invoice settings on server:', error);
        }
      }
      showSuccess('Invoice settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };
  const updateInvoiceSettingField = (key, value) => setInvoiceSettings(prev => ({ ...prev, [key]: value }));
  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Invoice
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyInvoiceMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? INVOICE_DEFAULT_TOP_MESSAGE : INVOICE_DEFAULT_BOTTOM_MESSAGE;
    setInvoiceSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };
  const handleUpdateInvoiceSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateInvoiceSettings(loggedInUser.userId, invoiceSettings);
    try { localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(invoiceSettings)); } catch { /* ignore */ }
    showSuccess('Invoice settings updated.');
    setQuotationSubView('settingsMenu');
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  // ===== Quotations module: Purchase Order Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
  const PURCHASE_ORDER_DEFAULT_TOP_MESSAGE = 'Dear Sir/Madam,\nThank you for your interest. Please find below the purchase order for your review and approval.';
  const PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE = 'Thank you for your prompt attention to this order';
  // The true, hardcoded factory defaults for Purchase Order Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
  const getDefaultPurchaseOrderSettings = () => ({
    numberPrefix: 'PO-',
    serialNumber: '1',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: PURCHASE_ORDER_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });
  // Reads Purchase Order Settings from local storage (normalizing legacy fields), or falls
  // back to getDefaultPurchaseOrderSettings() below. Used only as the initial state on load -
  // the Reset button below intentionally does NOT use this (see getDefaultPurchaseOrderSettings).
  const loadPurchaseOrderSettings = () => {
    try {
      const saved = localStorage.getItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes". Settings saved under an older
        // schema version (before this migration existed, or by a build that used to
        // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
        // choice - migrate them straight back to "Default" mode/text. Settings already on
        // the current version are honored as-is, including a genuine Customize selection.
        const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
        const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
        const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
        return {
          ...parsed,
          taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
          messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
          topMessageMode: topMode,
          topMessage: topMode === 'Default' ? PURCHASE_ORDER_DEFAULT_TOP_MESSAGE : parsed.topMessage,
          bottomMessageMode: bottomMode,
          bottomMessage: bottomMode === 'Default' ? PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
        };
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultPurchaseOrderSettings();
  };
  const [purchaseOrderSettings, setPurchaseOrderSettings] = useState(loadPurchaseOrderSettings);
  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Purchase Order created, the
  // same way Update does. Any already-created Purchase Order documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetPurchaseOrderSettings = () => {
    showConfirm('Reset Purchase Order Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultPurchaseOrderSettings();
      setPurchaseOrderSettings(defaults);
      try { localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updatePurchaseOrderSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting purchase order settings on server:', error);
        }
      }
      showSuccess('Purchase order settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };
  const updatePurchaseOrderSettingField = (key, value) => setPurchaseOrderSettings(prev => ({ ...prev, [key]: value }));
  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Purchase Order
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyPurchaseOrderMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? PURCHASE_ORDER_DEFAULT_TOP_MESSAGE : PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE;
    setPurchaseOrderSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };
  const handleUpdatePurchaseOrderSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updatePurchaseOrderSettings(loggedInUser.userId, purchaseOrderSettings);
    try { localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(purchaseOrderSettings)); } catch { /* ignore */ }
    showSuccess('Purchase order settings updated.');
    setQuotationSubView('settingsMenu');
  } catch (error) {
    console.error('Error updating purchase order settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  // ===== Quotations module: Proforma Invoice Settings =====
  // ===== Quotations module: Proforma Invoice Settings =====
// Professional default copy used whenever "Default" mode is selected for the top/bottom
// message (also the fallback text for brand-new settings before the user has customized).
const PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE = 'Thank you for your interest. Please find the proforma invoice below';
const PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE = 'We look forward to your confirmation.';
// The true, hardcoded factory defaults for Proforma Invoice Settings - used (a) as the very
// first-run values before anything has ever been saved, and (b) by the Reset button, which
// must always land on these exact values regardless of whatever was previously saved/modified
// (i.e. Reset does NOT just reload the last-saved localStorage copy).
const getDefaultProformaInvoiceSettings = () => ({
  numberPrefix: 'PI-',
  serialNumber: '1',
  discountType: 'No Discount',
  taxType: 'Yes',
  showProductHSN: 'No',
  showShippingAddress: 'No',
  topMessageMode: 'Default',
  topMessage: PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE,
  bottomMessageMode: 'Default',
  bottomMessage: PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE,
  showBankInfo: 'No',
  showUpiInfo: 'No',
  showSignature: 'Yes',
  messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
});
// Reads Proforma Invoice Settings from local storage (normalizing legacy fields), or falls
// back to getDefaultProformaInvoiceSettings() below. Used only as the initial state on load -
// the Reset button below intentionally does NOT use this (see getDefaultProformaInvoiceSettings).
const loadProformaInvoiceSettings = () => {
  try {
    const saved = localStorage.getItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
      // supported Yes/No options, defaulting to "Yes". Settings saved under an older
      // schema version (before this migration existed, or by a build that used to
      // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
      // choice - migrate them straight back to "Default" mode/text. Settings already on
      // the current version are honored as-is, including a genuine Customize selection.
      const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
      const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
      return {
        ...parsed,
        taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: topMode,
        topMessage: topMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
        bottomMessageMode: bottomMode,
        bottomMessage: bottomMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
      };
    }
  } catch {
    // Corrupted/unreadable localStorage entry - fall back to defaults below.
  }
  return getDefaultProformaInvoiceSettings();
};
const [proformaInvoiceSettings, setProformaInvoiceSettings] = useState(loadProformaInvoiceSettings);
// Reset always reverts to the original factory defaults - regardless of any previously
// saved or modified settings - and persists that reset immediately (to local storage and,
// if signed in, to the server) so it takes effect for the next Proforma Invoice created, the
// same way Update does. Any already-created Proforma Invoice documents keep their own frozen
// docSnapshot and are unaffected until the user opens and re-saves them.
const handleResetProformaInvoiceSettings = () => {
  showConfirm('Reset Proforma Invoice Settings to the default values? This will discard any saved or unsaved changes.', async () => {
    const defaults = getDefaultProformaInvoiceSettings();
    setProformaInvoiceSettings(defaults);
    try { localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
    if (loggedInUser?.userId) {
      try {
        await settingsService.updateProformaInvoiceSettings(loggedInUser.userId, defaults);
      } catch (error) {
        console.error('Error resetting proforma invoice settings on server:', error);
      }
    }
    showSuccess('Proforma invoice settings reset to default.');
  }, { confirmLabel: 'Reset', tone: 'warning' });
};
  const updateProformaInvoiceSettingField = (key, value) => setProformaInvoiceSettings(prev => ({ ...prev, [key]: value }));

// Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Proforma Invoice
// Settings: switching to Customize seeds the field with the professional preset text as
// a starting point if it's currently empty (otherwise leaves any existing custom text
// as-is, instead of being wiped), switching to Default fills it with the professional
// preset text (read-only), and Hide simply stops the message from showing on the
// document (the underlying text is preserved so it's still there if the user switches back).
const applyProformaInvoiceMessageMode = (kind, mode) => {
  const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
  const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
  const defaultMsg = kind === 'top' ? PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE : PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE;
  setProformaInvoiceSettings(prev => {
    const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
    return {
      ...prev,
      [modeField]: mode,
      [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
    };
  });
};
  const handleUpdateProformaInvoiceSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateProformaInvoiceSettings(loggedInUser.userId, proformaInvoiceSettings);
    try { localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(proformaInvoiceSettings)); } catch { /* ignore */ }
    showSuccess('Proforma invoice settings updated.');
    setQuotationSubView('settingsMenu');
  } catch (error) {
    console.error('Error updating proforma invoice settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  // ===== Quotations module: Delivery Note Settings =====
  // ===== Quotations module: Delivery Note Settings =====
// Professional default copy used whenever "Default" mode is selected for the top/bottom
// message (also the fallback text for brand-new settings before the user has customized).
const DELIVERY_NOTE_DEFAULT_TOP_MESSAGE = 'Please find the delivery details below';
const DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE = 'Kindly acknowledge receipt of the goods.';
// The true, hardcoded factory defaults for Delivery Note Settings - used (a) as the very
// first-run values before anything has ever been saved, and (b) by the Reset button, which
// must always land on these exact values regardless of whatever was previously saved/modified
// (i.e. Reset does NOT just reload the last-saved localStorage copy).
const getDefaultDeliveryNoteSettings = () => ({
  numberPrefix: 'DN-',
  serialNumber: '1',
  showProductHSN: 'No',
  showShippingAddress: 'No',
  topMessageMode: 'Default',
  topMessage: DELIVERY_NOTE_DEFAULT_TOP_MESSAGE,
  bottomMessageMode: 'Default',
  bottomMessage: DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE,
  showSignature: 'Yes',
  messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
});
// Reads Delivery Note Settings from local storage (backfilling legacy fields), or falls
// back to getDefaultDeliveryNoteSettings() below. Used only as the initial state on load -
// the Reset button below intentionally does NOT use this (see getDefaultDeliveryNoteSettings).
const loadDeliveryNoteSettings = () => {
  try {
    const saved = localStorage.getItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Settings saved under an older schema version (before this migration existed, or
      // by a build that used to pre-fill "Customize" with preset text) can't be trusted
      // to reflect a real user choice - migrate them straight back to "Default" mode/text.
      // Settings already on the current version are honored as-is, including a genuine
      // Customize selection.
      const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
      const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
      return {
        ...parsed,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: topMode,
        topMessage: topMode === 'Default' ? DELIVERY_NOTE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
        bottomMessageMode: bottomMode,
        bottomMessage: bottomMode === 'Default' ? DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
      };
    }
  } catch {
    // Corrupted/unreadable localStorage entry - fall back to defaults below.
  }
  return getDefaultDeliveryNoteSettings();
};
const [deliveryNoteSettings, setDeliveryNoteSettings] = useState(loadDeliveryNoteSettings);
// Reset always reverts to the original factory defaults - regardless of any previously
// saved or modified settings - and persists that reset immediately (to local storage and,
// if signed in, to the server) so it takes effect for the next Delivery Note created, the
// same way Update does. Any already-created Delivery Note documents keep their own frozen
// docSnapshot and are unaffected until the user opens and re-saves them.
const handleResetDeliveryNoteSettings = () => {
  showConfirm('Reset Delivery Note Settings to the default values? This will discard any saved or unsaved changes.', async () => {
    const defaults = getDefaultDeliveryNoteSettings();
    setDeliveryNoteSettings(defaults);
    try { localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
    if (loggedInUser?.userId) {
      try {
        await settingsService.updateDeliveryNoteSettings(loggedInUser.userId, defaults);
      } catch (error) {
        console.error('Error resetting delivery note settings on server:', error);
      }
    }
    showSuccess('Delivery note settings reset to default.');
  }, { confirmLabel: 'Reset', tone: 'warning' });
};
  const updateDeliveryNoteSettingField = (key, value) => setDeliveryNoteSettings(prev => ({ ...prev, [key]: value }));

// Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Delivery Note
// Settings: switching to Customize seeds the field with the professional preset text as
// a starting point if it's currently empty (otherwise leaves any existing custom text
// as-is, instead of being wiped), switching to Default fills it with the professional
// preset text (read-only), and Hide simply stops the message from showing on the
// document (the underlying text is preserved so it's still there if the user switches back).
const applyDeliveryNoteMessageMode = (kind, mode) => {
  const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
  const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
  const defaultMsg = kind === 'top' ? DELIVERY_NOTE_DEFAULT_TOP_MESSAGE : DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE;
  setDeliveryNoteSettings(prev => {
    const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
    return {
      ...prev,
      [modeField]: mode,
      [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
    };
  });
};
  const handleUpdateDeliveryNoteSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateDeliveryNoteSettings(loggedInUser.userId, deliveryNoteSettings);
    try { localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(deliveryNoteSettings)); } catch { /* ignore */ }
    showSuccess('Delivery note settings updated.');
    setQuotationSubView('settingsMenu');
  } catch (error) {
    console.error('Error updating delivery note settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};
  // ===== Quotations module: Receipt Settings =====
  // Receipt Settings only has one field (Signature Display), so there is no Reset button
  // here - just Update. Reads from local storage, or falls back to the factory default
  // below (Signature: Yes), used only as the initial state on load.
  const loadReceiptSettings = () => {
    try {
      const saved = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      numberPrefix: 'RECEIPT-',
      serialNumber: '1',
      showSignature: 'Yes',
    };
  };
  const [receiptSettings, setReceiptSettings] = useState(loadReceiptSettings);
  const updateReceiptSettingField = (key, value) => setReceiptSettings(prev => ({ ...prev, [key]: value }));
  const handleUpdateReceiptSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateReceiptSettings(loggedInUser.userId, receiptSettings);
    try { localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(receiptSettings)); } catch { /* ignore */ }
    showSuccess('Receipt settings updated.');
    setQuotationSubView('settingsMenu');
  } catch (error) {
    console.error('Error updating receipt settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  // ===== Quotations module: Column Heading Settings =====
  // Reads Column Heading Settings from local storage, or falls back to the defaults below.
  // Used both as the initial state and by the Settings screen's Reset button (which re-runs
  // this to discard any unsaved in-memory edits).
  const loadColumnHeadingSettings = () => {
    try {
      const saved = localStorage.getItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      taxLabel: 'GST',
      hsnLabel: 'HSN',
      otherChargesLabel: 'Other Charges',
      showQty2Column: false,
    };
  };
  const [columnHeadingSettings, setColumnHeadingSettings] = useState(loadColumnHeadingSettings);
  const handleResetColumnHeadingSettings = () => {
    showConfirm('Discard all unsaved changes to Column Heading Settings?', () => {
      setColumnHeadingSettings(loadColumnHeadingSettings());
      showSuccess('Column heading settings reset.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };
  const updateColumnHeadingSettingField = (key, value) => setColumnHeadingSettings(prev => ({ ...prev, [key]: value }));
  const handleUpdateColumnHeadingSettings = () => {
    try {
      localStorage.setItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY, JSON.stringify(columnHeadingSettings));
      showSuccess('Column heading settings updated.');
    } catch {
      showAlert('Could not save column heading settings on this device.');
    }
  };

  // ===== Quotations module: Customer List / Add Customer =====
  const emptyCustomerForm = {
    name: '', companyName: '', email: '', mobile: '',
    addressLine1: '', addressLine2: '', addressLine3: '', otherInfo: '', gstin: '', state: '', pincode: '',
    shippingSameAsBilling: false,
    shippingAddressLine1: '', shippingAddressLine2: '', shippingCity: '', shippingState: '', shippingPincode: '',
    shippingAddress: '', billingAddress: '',
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
  const [customerGstinError, setCustomerGstinError] = useState(false);
  const [customerMobileError, setCustomerMobileError] = useState(false);
  const [customerEmailError, setCustomerEmailError] = useState(false);
  const [customerPincodeError, setCustomerPincodeError] = useState(false);
  const [customerShippingPincodeError, setCustomerShippingPincodeError] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  // Which form the shared State picker below should write its selection into -
  // 'customer' (Add/Edit Customer) or 'business' (Update Business Info).
  const [stateFieldTarget, setStateFieldTarget] = useState('customer');
  const filteredStateList = INDIAN_STATE_LIST.filter((s) =>
    s.toLowerCase().includes(stateSearchQuery.trim().toLowerCase())
  );
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
    setCustomerGstinError(false);
    setCustomerMobileError(false);
    setCustomerEmailError(false);
    setCustomerPincodeError(false);
    setCustomerShippingPincodeError(false);
    setStateSearchQuery('');
    setQuotationSubView('addCustomer');
  };
  const openEditCustomer = (customer, returnView = 'customerList') => {
    setCustomerForm({ ...emptyCustomerForm, ...customer });
    setEditingCustomerId(customer.id);
    setCustomerFormReturnView(returnView);
    setCustomerGstinError(false);
    setCustomerMobileError(false);
    setCustomerEmailError(false);
    setCustomerPincodeError(false);
    setCustomerShippingPincodeError(false);
    setStateSearchQuery('');
    setQuotationSubView('addCustomer');
  };
  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      showAlert('Please enter the customer name.');
      return;
    }
    if (customerForm.mobile.trim() && !isValidMobileNumber(customerForm.mobile)) {
      setCustomerMobileError(true);
      showAlert('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    setCustomerMobileError(false);
    if (customerForm.email.trim() && !isValidEmailAddress(customerForm.email)) {
      setCustomerEmailError(true);
      showAlert('Please enter a valid email address.', 'error');
      return;
    }
    setCustomerEmailError(false);
    if (customerForm.pincode.trim() && !isValidPincode(customerForm.pincode)) {
      setCustomerPincodeError(true);
      showAlert('Please enter a valid 6-digit PIN code.', 'error');
      return;
    }
    setCustomerPincodeError(false);
    if (customerForm.gstin.trim() && !isValidGSTIN(customerForm.gstin)) {
      setCustomerGstinError(true);
      showAlert('Please enter correct GST number.', 'error');
      return;
    }
    setCustomerGstinError(false);
    if (
      !customerForm.shippingSameAsBilling &&
      customerForm.shippingPincode.trim() &&
      !isValidPincode(customerForm.shippingPincode)
    ) {
      setCustomerShippingPincodeError(true);
      showAlert('Please enter a valid 6-digit shipping PIN code.', 'error');
      return;
    }
    setCustomerShippingPincodeError(false);

    // Build the flat billing/shipping address strings that quotations, invoices,
    // and other documents read - kept in sync with the structured fields above,
    // and copied straight from billing when "Same as Billing Address" is checked.
    const billingAddress = [
      customerForm.addressLine1, customerForm.addressLine2, customerForm.addressLine3,
      customerForm.state ? toTitleCase(customerForm.state) : '', customerForm.pincode,
    ].filter(Boolean).join(', ');
    const shippingAddress = customerForm.shippingSameAsBilling
      ? billingAddress
      : [
          customerForm.shippingAddressLine1, customerForm.shippingAddressLine2, customerForm.shippingCity,
          customerForm.shippingState ? toTitleCase(customerForm.shippingState) : '', customerForm.shippingPincode,
        ].filter(Boolean).join(', ');
    const finalCustomerForm = { ...customerForm, billingAddress, shippingAddress };

    if (!loggedInUser?.userId) {
      showAlert('You need to be signed in to save a customer.');
      return;
    }

    try {
      if (editingCustomerId) {
        const saved = await customerService.updateCustomer(editingCustomerId, finalCustomerForm);
        persistCustomers(customers.map((c) => (c.id === editingCustomerId ? saved : c)));
        showSuccess('Customer updated successfully.');
      } else {
        const saved = await customerService.createCustomer(loggedInUser.userId, finalCustomerForm);
        persistCustomers([...customers, saved]);
        showSuccess('Customer added successfully.');
      }
      setQuotationSubView(customerFormReturnView);
    } catch (error) {
      console.error('Error saving customer:', error);
      showAlert('Could not save the customer to the server. Please try again.');
    }
  };
  const handleDeleteCustomer = (customer) => {
    showConfirm(`Delete customer "${customer.name}"?`, async () => {
      try {
        await customerService.deleteCustomer(customer.id);
        persistCustomers(customers.filter((c) => c.id !== customer.id));
        if (quotationForm.customerId === customer.id) {
          setQuotationForm((prev) => ({ ...prev, customerId: null }));
        }
        if (invoiceForm.customerId === customer.id) {
          setInvoiceForm((prev) => ({ ...prev, customerId: null }));
        }
        showSuccess('Customer deleted.');
      } catch (error) {
        console.error('Error deleting customer:', error);
        showAlert('Could not delete the customer on the server. Please try again.');
      }
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
  const [productHsnError, setProductHsnError] = useState(false);
  const [productGstError, setProductGstError] = useState(false);
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
    setProductHsnError(false);
    setProductGstError(false);
    setQuotationSubView('addProduct');
  };
  const openEditProduct = (product, returnView = 'productList') => {
    setProductForm({ ...emptyProductForm, ...product });
    setEditingProductId(product.id);
    setProductFormReturnView(returnView);
    setProductHsnError(false);
    setProductGstError(false);
    setQuotationSubView('addProduct');
  };
  const handleSaveProduct = async () => {
  if (!productForm.name.trim()) {
    showAlert('Please enter the product name.');
    return;
  }
  if (String(productForm.gst).trim() !== '' && (isNaN(Number(productForm.gst)) || Number(productForm.gst) < 0 || Number(productForm.gst) > 100)) {
    setProductGstError(true);
    showAlert('Please enter a valid GST percentage (0-100).', 'error');
    return;
  }
  setProductGstError(false);
  if (productForm.hsn.trim() && !isValidHSN(productForm.hsn)) {
    setProductHsnError(true);
    showAlert('Please enter a valid HSN code (4, 6, or 8 digits).', 'error');
    return;
  }
  setProductHsnError(false);

  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a product.');
    return;
  }

  try {
    if (editingProductId) {
      const saved = await productsService.updateProduct(editingProductId, {
        name: productForm.name,
        price: Number(productForm.price) || 0,
        gst: Number(productForm.gst) || 0,
        description: productForm.description || '',
        unit: productForm.unit || '',
        hsn: productForm.hsn || '',
      });
      persistProducts(products.map((p) => (p.id === editingProductId ? saved : p)));
      showSuccess('Product updated successfully.');
    } else {
      const saved = await productsService.createProduct(loggedInUser.userId, {
        name: productForm.name,
        price: Number(productForm.price) || 0,
        gst: Number(productForm.gst) || 0,
        description: productForm.description || '',
        unit: productForm.unit || '',
        hsn: productForm.hsn || '',
      });
      persistProducts([...products, saved]);
      showSuccess('Product added successfully.');
    }
    setQuotationSubView(productFormReturnView);
  } catch (error) {
    console.error('Error saving product:', error);
    showAlert('Could not save the product. Please try again.');
  }
};

const handleDeleteProduct = (product) => {
  showConfirm(`Delete product "${product.name}"?`, async () => {
    try {
      await productsService.deleteProduct(product.id);
      persistProducts(products.filter((p) => p.id !== product.id));
      setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== product.id) }));
      setInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== product.id) }));
      showSuccess('Product deleted.');
    } catch (error) {
      console.error('Error deleting product:', error);
      showAlert('Could not delete the product. Please try again.');
    }
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
  // Parses a 'DD/MM/YYYY' string (as produced by formatQuotationDate) back into a Date object.
  const parseQuotationDate = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
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
  const [showQuotationMoreSheet, setShowQuotationMoreSheet] = useState(false);
  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');

  // ===== Quotations module: shared list sorting (Quotation, Invoice, Purchase Order, =====
  // ===== Proforma Invoice, Delivery Note, Receipt) — sorts by actual createdAt time =====
  const [documentSortOrder, setDocumentSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const sortDocumentsByCreated = (list) => {
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.date || 0).getTime();
      const tb = new Date(b.createdAt || b.date || 0).getTime();
      return documentSortOrder === 'newest' ? tb - ta : ta - tb;
    });
  };

  // Reusable Filter/Sort icon + dropdown menu, used in the header of every
  // document list screen (Quotation, Invoice, Purchase Order, Proforma Invoice,
  // Delivery Note, Receipt) so behaviour and appearance stay consistent.
  const renderSortMenu = () => (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setSortMenuOpen((prev) => !prev)}
        aria-label="Filter"
        style={{ ...customerModuleStyles.headerIconBtn, background: 'transparent' }}
      >
        <FiFilter size={19} color="#ffffff" />
      </button>
      {sortMenuOpen && (
        <>
          <div
            onClick={() => setSortMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={customerModuleStyles.sortMenu}>
            <button
              type="button"
              onClick={() => { setDocumentSortOrder('newest'); setSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={documentSortOrder === 'newest' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Newest to Oldest
              </span>
              {documentSortOrder === 'newest' && <FiCheck size={16} color="#0F766E" />}
            </button>
            <button
              type="button"
              onClick={() => { setDocumentSortOrder('oldest'); setSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={documentSortOrder === 'oldest' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Oldest to Newest
              </span>
              {documentSortOrder === 'oldest' && <FiCheck size={16} color="#0F766E" />}
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ===== Quotations module: shared name sorting (Customer List, Product List) =====
  const [nameSortOrder, setNameSortOrder] = useState('az'); // 'az' | 'za'
  const [nameSortMenuOpen, setNameSortMenuOpen] = useState(false);

  const sortByName = (list, getName) => {
    return [...list].sort((a, b) => {
      const na = (getName(a) || '').toLowerCase();
      const nb = (getName(b) || '').toLowerCase();
      if (na < nb) return nameSortOrder === 'az' ? -1 : 1;
      if (na > nb) return nameSortOrder === 'az' ? 1 : -1;
      return 0;
    });
  };

  // Reusable Filter/Sort icon + dropdown menu (A to Z / Z to A), used in the
  // header of Customer List and Product List so behaviour and appearance
  // stay consistent with the document list screens' filter menu.
  const renderNameSortMenu = () => (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setNameSortMenuOpen((prev) => !prev)}
        aria-label="Filter"
        style={{ ...customerModuleStyles.headerIconBtn, background: 'transparent' }}
      >
        <FiFilter size={19} color="#ffffff" />
      </button>
      {nameSortMenuOpen && (
        <>
          <div
            onClick={() => setNameSortMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={customerModuleStyles.sortMenu}>
            <button
              type="button"
              onClick={() => { setNameSortOrder('az'); setNameSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={nameSortOrder === 'az' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                A to Z
              </span>
              {nameSortOrder === 'az' && <FiCheck size={16} color="#0F766E" />}
            </button>
            <button
              type="button"
              onClick={() => { setNameSortOrder('za'); setNameSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={nameSortOrder === 'za' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Z to A
              </span>
              {nameSortOrder === 'za' && <FiCheck size={16} color="#0F766E" />}
            </button>
          </div>
        </>
      )}
    </div>
  );

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
    const prefix = quotationSettings.numberPrefix || 'Quote-';
    const maxNum = quotations.reduce((max, q) => {
      const match = String(q.quotationNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakeQuotation = () => {
    setEditingQuotationId(null);
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
        : [...prev.products, { productId: product.id, name: product.name, price: Number(product.price) || 0, gst: Number(product.gst) || 0, qty: addQty, unit: product.unit || '', hsn: product.hsn || '' }];
      return { ...prev, products };
    });
  };
  const removeQuotationProductLine = (productId) => {
    setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  // ===== Add Quotation Product (dedicated per-line form: Product / Quantity / Price / Description) =====
  const emptyQuotationProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };
  const [quotationProductLineForm, setQuotationProductLineForm] = useState(emptyQuotationProductLineForm);
  const [editingQuotationProductLineId, setEditingQuotationProductLineId] = useState(null);
  const openAddQuotationProductLine = () => {
    setQuotationProductLineForm(emptyQuotationProductLineForm);
    setEditingQuotationProductLineId(null);
    setQuotationSubView('addQuotationProductLine');
  };
  // Opens the same Add/Edit form pre-filled with an existing quotation line's data, so the
  // user can revise its quantity, price, or description and re-save it via "Add To Quotation".
  const openEditQuotationProductLine = (p) => {
    setQuotationProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingQuotationProductLineId(p.productId);
    setQuotationSubView('addQuotationProductLine');
  };
  const openPickProductForQuotationLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForQuotationLine');
  };
  const handlePickProductForQuotationLine = (product) => {
    setQuotationProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || prev.description,
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked,
                // instead of carrying over whatever quantity was typed for the previous pick.
    }));
    setQuotationSubView('addQuotationProductLine');
  };
  const handleAddQuotationProductLine = () => {
    if (!quotationProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(quotationProductLineForm.qty) > 0 ? Number(quotationProductLineForm.qty) : 1;
    const price = Number(quotationProductLineForm.price) || 0;
    setQuotationForm((prev) => {
      // If we're editing an existing line, drop it first so the save below fully replaces
      // its quantity/price/description instead of adding on top of the old quantity.
      const baseProducts = editingQuotationProductLineId
        ? prev.products.filter((p) => p.productId !== editingQuotationProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === quotationProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === quotationProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(quotationProductLineForm.gst) || 0, description: quotationProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: quotationProductLineForm.productId,
            name: quotationProductLineForm.name,
            price,
            gst: Number(quotationProductLineForm.gst) || 0,
            qty,
            unit: quotationProductLineForm.unit || '',
            hsn: quotationProductLineForm.hsn || '',
            description: quotationProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingQuotationProductLineId(null);
    setQuotationSubView('makeQuotation');
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
  // Removes a term from THIS quotation's selection only (does not delete the term
  // from the quotation terms catalog - that is handled separately by handleDeleteTerm).
  const removeQuotationSelectedTerm = (termId) => {
    setQuotationForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  // ===== Terms & Conditions: one independent catalog per document type =====
  // Each document type manages its own list of Terms & Conditions entries, so adding,
  // editing, or deleting a term in one document type never affects any other type.
  const loadTermsCatalog = (perTypeKey) => {
    try {
      const saved = localStorage.getItem(perTypeKey);
      if (saved) return JSON.parse(saved);
      // One-time migration: older versions of the app stored a single shared catalog.
      // Seed this document type's catalog from it so existing terms aren't lost, after
      // which each type is edited and persisted completely independently.
      const legacy = localStorage.getItem(TERMS_STORAGE_KEY);
      if (legacy) return JSON.parse(legacy);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  };
  const [quotationTerms, setQuotationTerms] = useState(() => loadTermsCatalog(QUOTATION_TERMS_STORAGE_KEY));
  const persistQuotationTerms = (next) => {
    setQuotationTerms(next);
    try { localStorage.setItem(QUOTATION_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const [purchaseOrderTerms, setPurchaseOrderTerms] = useState(() => loadTermsCatalog(PURCHASE_ORDER_TERMS_STORAGE_KEY));
  const persistPurchaseOrderTerms = (next) => {
    setPurchaseOrderTerms(next);
    try { localStorage.setItem(PURCHASE_ORDER_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const [proformaInvoiceTerms, setProformaInvoiceTerms] = useState(() => loadTermsCatalog(PROFORMA_INVOICE_TERMS_STORAGE_KEY));
  const persistProformaInvoiceTerms = (next) => {
    setProformaInvoiceTerms(next);
    try { localStorage.setItem(PROFORMA_INVOICE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const [deliveryNoteTerms, setDeliveryNoteTerms] = useState(() => loadTermsCatalog(DELIVERY_NOTE_TERMS_STORAGE_KEY));
  const persistDeliveryNoteTerms = (next) => {
    setDeliveryNoteTerms(next);
    try { localStorage.setItem(DELIVERY_NOTE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  const [invoiceTerms, setInvoiceTerms] = useState(() => loadTermsCatalog(INVOICE_TERMS_STORAGE_KEY));
  const persistInvoiceTerms = (next) => {
    setInvoiceTerms(next);
    try { localStorage.setItem(INVOICE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };
  // Looks up the right catalog/persist-function for a given "termsModalContext" value
  // ('quotation' | 'invoice' | 'purchaseOrder' | 'proformaInvoice' | 'deliveryNote').
  const getTermsCatalogByContext = (context) => {
    if (context === 'invoice') return invoiceTerms;
    if (context === 'purchaseOrder') return purchaseOrderTerms;
    if (context === 'proformaInvoice') return proformaInvoiceTerms;
    if (context === 'deliveryNote') return deliveryNoteTerms;
    return quotationTerms;
  };
  const persistTermsByContext = (context, next) => {
    if (context === 'invoice') { persistInvoiceTerms(next); return; }
    if (context === 'purchaseOrder') { persistPurchaseOrderTerms(next); return; }
    if (context === 'proformaInvoice') { persistProformaInvoiceTerms(next); return; }
    if (context === 'deliveryNote') { persistDeliveryNoteTerms(next); return; }
    persistQuotationTerms(next);
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
  const [termsModalContext, setTermsModalContext] = useState('quotation'); // 'quotation' | 'invoice' | 'purchaseOrder' | 'proformaInvoice' | 'deliveryNote'
  const openAddTermsModal = (context = 'quotation') => {
    setNewTermText('');
    setTermsModalContext(context);
    setIsAddTermsModalOpen(true);
  };
  // Find the openAddTermsModal function and update handleAddTerm:

const handleAddTerm = async () => {
  if (!newTermText.trim()) {
    showAlert('Please enter the terms and condition text.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save terms.');
    return;
  }

  try {
    const newTerm = await termsService.createTerm(
      loggedInUser.userId, 
      termsModalContext, 
      { text: newTermText.trim() }
    );
    const catalog = getTermsCatalogByContext(termsModalContext);
    persistTermsByContext(termsModalContext, [...catalog, newTerm]);
    
    if (termsModalContext === 'invoice') {
      setInvoiceTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'purchaseOrder') {
      setPurchaseOrderTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'proformaInvoice') {
      setProformaInvoiceTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'deliveryNote') {
      setDeliveryNoteTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else {
      setTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    }
    setIsAddTermsModalOpen(false);
  } catch (error) {
    console.error('Error adding term:', error);
    showAlert('Could not save the term. Please try again.');
  }
};
  const selectedQuotationTerms = quotationTerms.filter((term) => quotationForm.termsIds.includes(term.id));
  // Deletes a term from exactly one document type's own catalog/selection - the other
  // 4 document types' catalogs and selected terms are left completely untouched.
  const handleDeleteTerm = async (term, context = 'quotation') => {
  showConfirm('Delete this term and condition?', async () => {
    try {
      await termsService.deleteTerm(term.id);
      const catalog = getTermsCatalogByContext(context);
      persistTermsByContext(context, catalog.filter((t) => t.id !== term.id));
      if (context === 'invoice') {
        setInvoiceTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'purchaseOrder') {
        setPurchaseOrderTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setPurchaseOrderForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'proformaInvoice') {
        setProformaInvoiceTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setProformaInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'deliveryNote') {
        setDeliveryNoteTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setDeliveryNoteForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else {
        setTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setQuotationForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      }
      showSuccess('Term deleted.');
    } catch (error) {
      console.error('Error deleting term:', error);
      showAlert('Could not delete the term. Please try again.');
    }
  });
};


  const quotationProductsTotal = quotationForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);
  const quotationOtherChargesTotal = quotationForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const quotationAmountDue = Math.round(quotationProductsTotal + quotationOtherChargesTotal);

  const handleGenerateQuotation = async () => {
  if (!quotationForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (quotationForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a quotation.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedQuotationCustomer?.name || 'Unknown',
    customerCompany: selectedQuotationCustomer?.companyName || '',
    customerMobile: selectedQuotationCustomer?.mobile || '',
    customerEmail: selectedQuotationCustomer?.email || '',
    customerAddressLine1: selectedQuotationCustomer?.addressLine1 || '',
    customerAddressLine2: selectedQuotationCustomer?.addressLine2 || '',
    customerAddressLine3: selectedQuotationCustomer?.addressLine3 || '',
    customerBillingAddress: selectedQuotationCustomer?.billingAddress || '',
    customerShippingAddress: selectedQuotationCustomer?.shippingAddress || '',
  };

  const payload = { ...quotationForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(quotationSettings) };

  try {
    if (editingQuotationId) {
      const saved = await documentService.updateQuotation(editingQuotationId, payload);
      persistQuotations(quotations.map((q) => (q.id === editingQuotationId ? saved : q)));
      showSuccess('Quotation updated successfully.');
      setEditingQuotationId(null);
      setQuotationSubView('quotationDetail');
    } else {
      const created = await documentService.createQuotation(loggedInUser.userId, payload);
      persistQuotations([...quotations, created]);
      showSuccess('Quotation generated successfully.');
      setQuotationSubView('quotationList');
    }
  } catch (error) {
    console.error('Error saving quotation:', error);
    showAlert('Could not save the quotation. Please try again.');
  }
};


  // ===== Quotations module: Make Purchase Order =====
  const emptyPurchaseOrderForm = () => ({
    date: formatQuotationDate(new Date()),
    purchaseOrderNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
  });
  const [purchaseOrderForm, setPurchaseOrderForm] = useState(emptyPurchaseOrderForm);

  // ===== Purchase Order module: List & Detail Views =====
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(PURCHASE_ORDERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [purchaseOrderSearchQuery, setPurchaseOrderSearchQuery] = useState('');

  const persistPurchaseOrders = (next) => {
    setPurchaseOrders(next);
    try { localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const getNextPurchaseOrderNumber = () => {
    const prefix = purchaseOrderSettings.numberPrefix || 'PO-';
    const maxNum = purchaseOrders.reduce((max, q) => {
      const match = String(q.purchaseOrderNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakePurchaseOrder = () => {
    setEditingPurchaseOrderId(null);
    setPurchaseOrderForm({ ...emptyPurchaseOrderForm(), purchaseOrderNo: getNextPurchaseOrderNumber() });
    setQuotationSubView('makePurchaseOrder');
  };

  const openSelectCustomerForPurchaseOrder = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForPurchaseOrder');
    setQuotationSubView('selectCustomerForPurchaseOrder');
  };
  const handleSelectCustomerForPurchaseOrder = (customer) => {
    setPurchaseOrderForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makePurchaseOrder');
  };
  const selectedPurchaseOrderCustomer = customers.find((c) => c.id === purchaseOrderForm.customerId) || null;

  const removePurchaseOrderProductLine = (productId) => {
    setPurchaseOrderForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  // ===== Add Purchase Order Product (dedicated per-line form: Product / Quantity / Price / Description) =====
  const emptyPurchaseOrderProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };
  const [purchaseOrderProductLineForm, setPurchaseOrderProductLineForm] = useState(emptyPurchaseOrderProductLineForm);
  const [editingPurchaseOrderProductLineId, setEditingPurchaseOrderProductLineId] = useState(null);
  const openAddPurchaseOrderProductLine = () => {
    setPurchaseOrderProductLineForm(emptyPurchaseOrderProductLineForm);
    setEditingPurchaseOrderProductLineId(null);
    setQuotationSubView('addPurchaseOrderProductLine');
  };
  const openEditPurchaseOrderProductLine = (p) => {
    setPurchaseOrderProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingPurchaseOrderProductLineId(p.productId);
    setQuotationSubView('addPurchaseOrderProductLine');
  };
  const openPickProductForPurchaseOrderLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForPurchaseOrderLine');
  };
  const handlePickProductForPurchaseOrderLine = (product) => {
    setPurchaseOrderProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || prev.description,
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addPurchaseOrderProductLine');
  };
  const handleAddPurchaseOrderProductLine = () => {
    if (!purchaseOrderProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(purchaseOrderProductLineForm.qty) > 0 ? Number(purchaseOrderProductLineForm.qty) : 1;
    const price = Number(purchaseOrderProductLineForm.price) || 0;
    setPurchaseOrderForm((prev) => {
      const baseProducts = editingPurchaseOrderProductLineId
        ? prev.products.filter((p) => p.productId !== editingPurchaseOrderProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === purchaseOrderProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === purchaseOrderProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(purchaseOrderProductLineForm.gst) || 0, description: purchaseOrderProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: purchaseOrderProductLineForm.productId,
            name: purchaseOrderProductLineForm.name,
            price,
            gst: Number(purchaseOrderProductLineForm.gst) || 0,
            qty,
            unit: purchaseOrderProductLineForm.unit || '',
            hsn: purchaseOrderProductLineForm.hsn || '',
            description: purchaseOrderProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingPurchaseOrderProductLineId(null);
    setQuotationSubView('makePurchaseOrder');
  };


  const [isPurchaseOrderOtherChargeModalOpen, setIsPurchaseOrderOtherChargeModalOpen] = useState(false);
  const [purchaseOrderOtherChargeForm, setPurchaseOrderOtherChargeForm] = useState({ label: 'Other Charges', amount: '', taxable: false });
  const openPurchaseOrderOtherChargeModal = () => {
    setPurchaseOrderOtherChargeForm({ label: 'Other Charges', amount: '', taxable: false });
    setIsPurchaseOrderOtherChargeModalOpen(true);
  };
  const handleSavePurchaseOrderOtherCharge = () => {
    if (!purchaseOrderOtherChargeForm.amount || Number(purchaseOrderOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    const newCharge = { ...purchaseOrderOtherChargeForm, id: genId() };
    setPurchaseOrderForm((prev) => ({ ...prev, otherCharges: [...prev.otherCharges, newCharge] }));
    setIsPurchaseOrderOtherChargeModalOpen(false);
  };
  const removePurchaseOrderOtherCharge = (id) => {
    setPurchaseOrderForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };
  // Removes a term from THIS purchase order's selection only (does not delete the term
  // from the purchase order terms catalog - that is handled separately by handleDeleteTerm).
  const removePurchaseOrderSelectedTerm = (termId) => {
    setPurchaseOrderForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  const [purchaseOrderTermsDraftSelectedIds, setPurchaseOrderTermsDraftSelectedIds] = useState([]);
  const openSelectTermsForPurchaseOrder = () => {
    setPurchaseOrderTermsDraftSelectedIds(purchaseOrderForm.termsIds);
    setQuotationSubView('selectTermsForPurchaseOrder');
  };
  const togglePurchaseOrderTermsDraftSelection = (id) => {
    setPurchaseOrderTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneSelectPurchaseOrderTerms = () => {
    setPurchaseOrderForm((prev) => ({ ...prev, termsIds: purchaseOrderTermsDraftSelectedIds }));
    setQuotationSubView('makePurchaseOrder');
  };
  const selectedPurchaseOrderTerms = purchaseOrderTerms.filter((term) => purchaseOrderForm.termsIds.includes(term.id));

  const purchaseOrderProductsTotal = purchaseOrderForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);
  const purchaseOrderOtherChargesTotal = purchaseOrderForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const purchaseOrderAmountDue = Math.round(purchaseOrderProductsTotal + purchaseOrderOtherChargesTotal);

  const handleGeneratePurchaseOrder = async () => {
  if (!purchaseOrderForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (purchaseOrderForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a purchase order.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedPurchaseOrderCustomer?.name || 'Unknown',
    customerCompany: selectedPurchaseOrderCustomer?.companyName || '',
    customerMobile: selectedPurchaseOrderCustomer?.mobile || '',
    customerEmail: selectedPurchaseOrderCustomer?.email || '',
    customerAddressLine1: selectedPurchaseOrderCustomer?.addressLine1 || '',
    customerAddressLine2: selectedPurchaseOrderCustomer?.addressLine2 || '',
    customerAddressLine3: selectedPurchaseOrderCustomer?.addressLine3 || '',
    customerBillingAddress: selectedPurchaseOrderCustomer?.billingAddress || '',
    customerShippingAddress: selectedPurchaseOrderCustomer?.shippingAddress || '',
  };

  const payload = { ...purchaseOrderForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(purchaseOrderSettings) };

  try {
    if (editingPurchaseOrderId) {
      const saved = await purchaseOrdersService.updatePurchaseOrder(editingPurchaseOrderId, payload);
      persistPurchaseOrders(purchaseOrders.map((o) => (o.id === editingPurchaseOrderId ? saved : o)));
      showSuccess('Purchase Order updated successfully.');
      setEditingPurchaseOrderId(null);
      setQuotationSubView('purchaseOrderDetail');
    } else {
      const created = await purchaseOrdersService.createPurchaseOrder(loggedInUser.userId, payload);
      persistPurchaseOrders([...purchaseOrders, created]);
      showSuccess('Purchase Order generated successfully.');
      setQuotationSubView('purchaseOrderList');
    }
  } catch (error) {
    console.error('Error saving purchase order:', error);
    showAlert('Could not save the purchase order. Please try again.');
  }
};

  // ===== Quotations module: Make Proforma Invoice =====
  const emptyProformaInvoiceForm = () => ({
    date: formatQuotationDate(new Date()),
    proformaInvoiceNo: '',
    dueDate: '',
    poNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
    paidInfo: [], // { id, date, amount, note }
  });
  const [proformaInvoiceForm, setProformaInvoiceForm] = useState(emptyProformaInvoiceForm);

  // ===== Proforma Invoice module: List & Detail Views =====
  const [proformaInvoices, setProformaInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFORMA_INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedProformaInvoiceId, setSelectedProformaInvoiceId] = useState(null);
  const [proformaInvoiceSearchQuery, setProformaInvoiceSearchQuery] = useState('');

  const persistProformaInvoices = (next) => {
    setProformaInvoices(next);
    try { localStorage.setItem(PROFORMA_INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const getNextProformaInvoiceNumber = () => {
    const prefix = proformaInvoiceSettings.numberPrefix || 'PI-';
    const maxNum = proformaInvoices.reduce((max, q) => {
      const match = String(q.proformaInvoiceNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakeProformaInvoice = () => {
    setEditingProformaInvoiceId(null);
    setProformaInvoiceForm({ ...emptyProformaInvoiceForm(), proformaInvoiceNo: getNextProformaInvoiceNumber() });
    setQuotationSubView('makeProformaInvoice');
  };

  const openSelectCustomerForProformaInvoice = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForProformaInvoice');
    setQuotationSubView('selectCustomerForProformaInvoice');
  };
  const handleSelectCustomerForProformaInvoice = (customer) => {
    setProformaInvoiceForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeProformaInvoice');
  };
  const selectedProformaInvoiceCustomer = customers.find((c) => c.id === proformaInvoiceForm.customerId) || null;

  const removeProformaInvoiceProductLine = (productId) => {
    setProformaInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  // ===== Add Proforma Invoice Product (dedicated per-line form: Product / Quantity / Price / Description) =====
  const emptyProformaInvoiceProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };
  const [proformaInvoiceProductLineForm, setProformaInvoiceProductLineForm] = useState(emptyProformaInvoiceProductLineForm);
  const [editingProformaInvoiceProductLineId, setEditingProformaInvoiceProductLineId] = useState(null);
  const openAddProformaInvoiceProductLine = () => {
    setProformaInvoiceProductLineForm(emptyProformaInvoiceProductLineForm);
    setEditingProformaInvoiceProductLineId(null);
    setQuotationSubView('addProformaInvoiceProductLine');
  };
  const openEditProformaInvoiceProductLine = (p) => {
    setProformaInvoiceProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingProformaInvoiceProductLineId(p.productId);
    setQuotationSubView('addProformaInvoiceProductLine');
  };
  const openPickProductForProformaInvoiceLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForProformaInvoiceLine');
  };
  const handlePickProductForProformaInvoiceLine = (product) => {
    setProformaInvoiceProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || prev.description,
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addProformaInvoiceProductLine');
  };
  const handleAddProformaInvoiceProductLine = () => {
    if (!proformaInvoiceProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(proformaInvoiceProductLineForm.qty) > 0 ? Number(proformaInvoiceProductLineForm.qty) : 1;
    const price = Number(proformaInvoiceProductLineForm.price) || 0;
    setProformaInvoiceForm((prev) => {
      const baseProducts = editingProformaInvoiceProductLineId
        ? prev.products.filter((p) => p.productId !== editingProformaInvoiceProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === proformaInvoiceProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === proformaInvoiceProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(proformaInvoiceProductLineForm.gst) || 0, description: proformaInvoiceProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: proformaInvoiceProductLineForm.productId,
            name: proformaInvoiceProductLineForm.name,
            price,
            gst: Number(proformaInvoiceProductLineForm.gst) || 0,
            qty,
            unit: proformaInvoiceProductLineForm.unit || '',
            hsn: proformaInvoiceProductLineForm.hsn || '',
            description: proformaInvoiceProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingProformaInvoiceProductLineId(null);
    setQuotationSubView('makeProformaInvoice');
  };

  const [isProformaInvoiceOtherChargeModalOpen, setIsProformaInvoiceOtherChargeModalOpen] = useState(false);
  const [proformaInvoiceOtherChargeForm, setProformaInvoiceOtherChargeForm] = useState({ label: 'Other Charges', amount: '', taxable: false });
  const openProformaInvoiceOtherChargeModal = () => {
    setProformaInvoiceOtherChargeForm({ label: 'Other Charges', amount: '', taxable: false });
    setIsProformaInvoiceOtherChargeModalOpen(true);
  };
  const handleSaveProformaInvoiceOtherCharge = () => {
    if (!proformaInvoiceOtherChargeForm.amount || Number(proformaInvoiceOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    const newCharge = { ...proformaInvoiceOtherChargeForm, id: genId() };
    setProformaInvoiceForm((prev) => ({ ...prev, otherCharges: [...prev.otherCharges, newCharge] }));
    setIsProformaInvoiceOtherChargeModalOpen(false);
  };
  const removeProformaInvoiceOtherCharge = (id) => {
    setProformaInvoiceForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };
  // Removes a term from THIS proforma invoice's selection only (does not delete the term
  // from the proforma invoice terms catalog - that is handled separately by handleDeleteTerm).
  const removeProformaInvoiceSelectedTerm = (termId) => {
    setProformaInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  const [proformaInvoiceTermsDraftSelectedIds, setProformaInvoiceTermsDraftSelectedIds] = useState([]);
  const openSelectTermsForProformaInvoice = () => {
    setProformaInvoiceTermsDraftSelectedIds(proformaInvoiceForm.termsIds);
    setQuotationSubView('selectTermsForProformaInvoice');
  };
  const toggleProformaInvoiceTermsDraftSelection = (id) => {
    setProformaInvoiceTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneSelectProformaInvoiceTerms = () => {
    setProformaInvoiceForm((prev) => ({ ...prev, termsIds: proformaInvoiceTermsDraftSelectedIds }));
    setQuotationSubView('makeProformaInvoice');
  };
  const selectedProformaInvoiceTerms = proformaInvoiceTerms.filter((term) => proformaInvoiceForm.termsIds.includes(term.id));

  // Paid Info (extra field vs. Make Quotation)
  const emptyProformaPaidInfoForm = () => ({ date: '', amount: '', note: '' });
  const [isProformaPaidInfoModalOpen, setIsProformaPaidInfoModalOpen] = useState(false);
  const [proformaPaidInfoForm, setProformaPaidInfoForm] = useState(emptyProformaPaidInfoForm);
  const [isProformaPaidInfoDatePickerOpen, setIsProformaPaidInfoDatePickerOpen] = useState(false);
  const [proformaPaidInfoCalendarMonth, setProformaPaidInfoCalendarMonth] = useState(() => new Date());
  const openAddProformaPaidInfoModal = () => {
    setProformaPaidInfoForm(emptyProformaPaidInfoForm());
    setProformaPaidInfoCalendarMonth(new Date());
    setIsProformaPaidInfoModalOpen(true);
  };
  const handleSaveProformaPaidInfo = () => {
    if (!proformaPaidInfoForm.amount || Number(proformaPaidInfoForm.amount) <= 0) {
      showAlert('Please enter a valid paid amount.');
      return;
    }
    if (!proformaPaidInfoForm.date) {
      showAlert(t('selectDateForAdvanceError') || 'Please select the paid date.');
      return;
    }
    const newPaidInfo = { id: genId(), date: proformaPaidInfoForm.date, amount: Number(proformaPaidInfoForm.amount), note: proformaPaidInfoForm.note };
    setProformaInvoiceForm((prev) => ({ ...prev, paidInfo: [...prev.paidInfo, newPaidInfo] }));
    setIsProformaPaidInfoModalOpen(false);
  };
  const removeProformaPaidInfoLine = (id) => {
    setProformaInvoiceForm((prev) => ({ ...prev, paidInfo: prev.paidInfo.filter((p) => p.id !== id) }));
  };
  // Tap-to-select on Paid Info List entries - mirrors the Select Terms and Conditions
  // screen's draft-selection pattern (single or multi-select, highlighted card, Done
  // just closes the screen without any further data change).
  const [selectedProformaPaidInfoIds, setSelectedProformaPaidInfoIds] = useState([]);
  const openProformaPaidInfoList = () => {
    setSelectedProformaPaidInfoIds([]);
    setQuotationSubView('proformaPaidInfoList');
  };
  const toggleProformaPaidInfoSelection = (id) => {
    setSelectedProformaPaidInfoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneProformaPaidInfoList = () => {
    setSelectedProformaPaidInfoIds([]);
    setQuotationSubView('makeProformaInvoice');
  };

  const proformaInvoiceProductsTotal = proformaInvoiceForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);
  const proformaInvoiceOtherChargesTotal = proformaInvoiceForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const proformaInvoiceGrandTotal = Math.round(proformaInvoiceProductsTotal + proformaInvoiceOtherChargesTotal);
  const proformaInvoicePaidTotal = proformaInvoiceForm.paidInfo.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const proformaInvoiceAmountDue = Math.max(0, proformaInvoiceGrandTotal - proformaInvoicePaidTotal);

  const handleGenerateProformaInvoice = async () => {
  if (!proformaInvoiceForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (proformaInvoiceForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a proforma invoice.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedProformaInvoiceCustomer?.name || 'Unknown',
    customerCompany: selectedProformaInvoiceCustomer?.companyName || '',
    customerMobile: selectedProformaInvoiceCustomer?.mobile || '',
    customerEmail: selectedProformaInvoiceCustomer?.email || '',
    customerAddressLine1: selectedProformaInvoiceCustomer?.addressLine1 || '',
    customerAddressLine2: selectedProformaInvoiceCustomer?.addressLine2 || '',
    customerAddressLine3: selectedProformaInvoiceCustomer?.addressLine3 || '',
    customerBillingAddress: selectedProformaInvoiceCustomer?.billingAddress || '',
    customerShippingAddress: selectedProformaInvoiceCustomer?.shippingAddress || '',
  };

  const payload = { ...proformaInvoiceForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(proformaInvoiceSettings) };

  try {
    if (editingProformaInvoiceId) {
      const saved = await proformaInvoicesService.updateProformaInvoice(editingProformaInvoiceId, payload);
      persistProformaInvoices(proformaInvoices.map((inv) => (inv.id === editingProformaInvoiceId ? saved : inv)));
      showSuccess('Proforma Invoice updated successfully.');
      setEditingProformaInvoiceId(null);
      setQuotationSubView('proformaInvoiceDetail');
    } else {
      const created = await proformaInvoicesService.createProformaInvoice(loggedInUser.userId, payload);
      persistProformaInvoices([...proformaInvoices, created]);
      showSuccess('Proforma Invoice generated successfully.');
      setQuotationSubView('proformaInvoiceList');
    }
  } catch (error) {
    console.error('Error saving proforma invoice:', error);
    showAlert('Could not save the proforma invoice. Please try again.');
  }
};

  // ===== Quotations module: Make Delivery Note =====
  const emptyDeliveryNoteForm = () => ({
    date: formatQuotationDate(new Date()),
    deliveryNoteNo: '',
    refNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    termsIds: [],
  });
  const [deliveryNoteForm, setDeliveryNoteForm] = useState(emptyDeliveryNoteForm);

  // ===== Delivery Note module: List & Detail Views =====
  const [deliveryNotes, setDeliveryNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(DELIVERY_NOTES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedDeliveryNoteId, setSelectedDeliveryNoteId] = useState(null);
  const [deliveryNoteSearchQuery, setDeliveryNoteSearchQuery] = useState('');

  const persistDeliveryNotes = (next) => {
    setDeliveryNotes(next);
    try { localStorage.setItem(DELIVERY_NOTES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const getNextDeliveryNoteNumber = () => {
    const prefix = deliveryNoteSettings.numberPrefix || 'DN-';
    const maxNum = deliveryNotes.reduce((max, q) => {
      const match = String(q.deliveryNoteNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakeDeliveryNote = () => {
    setEditingDeliveryNoteId(null);
    setDeliveryNoteForm({ ...emptyDeliveryNoteForm(), deliveryNoteNo: getNextDeliveryNoteNumber() });
    setQuotationSubView('makeDeliveryNote');
  };

  const openSelectCustomerForDeliveryNote = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForDeliveryNote');
    setQuotationSubView('selectCustomerForDeliveryNote');
  };
  const handleSelectCustomerForDeliveryNote = (customer) => {
    setDeliveryNoteForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeDeliveryNote');
  };
  const selectedDeliveryNoteCustomer = customers.find((c) => c.id === deliveryNoteForm.customerId) || null;

  const removeDeliveryNoteProductLine = (productId) => {
    setDeliveryNoteForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  // ===== Add Delivery Note Product (dedicated per-line form: Product / Quantity / Price / Description) =====
  const emptyDeliveryNoteProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };
  const [deliveryNoteProductLineForm, setDeliveryNoteProductLineForm] = useState(emptyDeliveryNoteProductLineForm);
  const [editingDeliveryNoteProductLineId, setEditingDeliveryNoteProductLineId] = useState(null);
  const openAddDeliveryNoteProductLine = () => {
    setDeliveryNoteProductLineForm(emptyDeliveryNoteProductLineForm);
    setEditingDeliveryNoteProductLineId(null);
    setQuotationSubView('addDeliveryNoteProductLine');
  };
  const openEditDeliveryNoteProductLine = (p) => {
    setDeliveryNoteProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingDeliveryNoteProductLineId(p.productId);
    setQuotationSubView('addDeliveryNoteProductLine');
  };
  const openPickProductForDeliveryNoteLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForDeliveryNoteLine');
  };
  const handlePickProductForDeliveryNoteLine = (product) => {
    setDeliveryNoteProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || prev.description,
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addDeliveryNoteProductLine');
  };
  const handleAddDeliveryNoteProductLine = () => {
    if (!deliveryNoteProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(deliveryNoteProductLineForm.qty) > 0 ? Number(deliveryNoteProductLineForm.qty) : 1;
    const price = Number(deliveryNoteProductLineForm.price) || 0;
    setDeliveryNoteForm((prev) => {
      const baseProducts = editingDeliveryNoteProductLineId
        ? prev.products.filter((p) => p.productId !== editingDeliveryNoteProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === deliveryNoteProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === deliveryNoteProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(deliveryNoteProductLineForm.gst) || 0, description: deliveryNoteProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: deliveryNoteProductLineForm.productId,
            name: deliveryNoteProductLineForm.name,
            price,
            gst: Number(deliveryNoteProductLineForm.gst) || 0,
            qty,
            unit: deliveryNoteProductLineForm.unit || '',
            hsn: deliveryNoteProductLineForm.hsn || '',
            description: deliveryNoteProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingDeliveryNoteProductLineId(null);
    setQuotationSubView('makeDeliveryNote');
  };

  // Removes a term from THIS delivery note's selection only (does not delete the term
  // from the delivery note terms catalog - that is handled separately by handleDeleteTerm).
  const removeDeliveryNoteSelectedTerm = (termId) => {
    setDeliveryNoteForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  const [deliveryNoteTermsDraftSelectedIds, setDeliveryNoteTermsDraftSelectedIds] = useState([]);
  const openSelectTermsForDeliveryNote = () => {
    setDeliveryNoteTermsDraftSelectedIds(deliveryNoteForm.termsIds);
    setQuotationSubView('selectTermsForDeliveryNote');
  };
  const toggleDeliveryNoteTermsDraftSelection = (id) => {
    setDeliveryNoteTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneSelectDeliveryNoteTerms = () => {
    setDeliveryNoteForm((prev) => ({ ...prev, termsIds: deliveryNoteTermsDraftSelectedIds }));
    setQuotationSubView('makeDeliveryNote');
  };
  const selectedDeliveryNoteTerms = deliveryNoteTerms.filter((term) => deliveryNoteForm.termsIds.includes(term.id));

  const handleGenerateDeliveryNote = async () => {
  if (!deliveryNoteForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (deliveryNoteForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a delivery note.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedDeliveryNoteCustomer?.name || 'Unknown',
    customerCompany: selectedDeliveryNoteCustomer?.companyName || '',
    customerMobile: selectedDeliveryNoteCustomer?.mobile || '',
    customerEmail: selectedDeliveryNoteCustomer?.email || '',
    customerAddressLine1: selectedDeliveryNoteCustomer?.addressLine1 || '',
    customerAddressLine2: selectedDeliveryNoteCustomer?.addressLine2 || '',
    customerAddressLine3: selectedDeliveryNoteCustomer?.addressLine3 || '',
    customerBillingAddress: selectedDeliveryNoteCustomer?.billingAddress || '',
    customerShippingAddress: selectedDeliveryNoteCustomer?.shippingAddress || '',
  };

  const payload = { ...deliveryNoteForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(deliveryNoteSettings) };

  try {
    if (editingDeliveryNoteId) {
      const saved = await deliveryNotesService.updateDeliveryNote(editingDeliveryNoteId, payload);
      persistDeliveryNotes(deliveryNotes.map((dn) => (dn.id === editingDeliveryNoteId ? saved : dn)));
      showSuccess('Delivery Note updated successfully.');
      setEditingDeliveryNoteId(null);
      setQuotationSubView('deliveryNoteDetail');
    } else {
      const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
      persistDeliveryNotes([...deliveryNotes, created]);
      showSuccess('Delivery Note generated successfully.');
      setQuotationSubView('deliveryNoteList');
    }
  } catch (error) {
    console.error('Error saving delivery note:', error);
    showAlert('Could not save the delivery note. Please try again.');
  }
};

  // ===== Invoices module: Make Invoice =====
  const emptyInvoiceForm = () => ({
    date: formatQuotationDate(new Date()),
    invoiceNo: '',
    dueDate: '',
    poNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
    paidInfo: [], // { id, date, amount, note }
  });
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);

  // ===== Invoices module: List & Detail Views =====
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  const persistInvoices = (next) => {
    setInvoices(next);
    try { localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  // Next invoice number = 1 higher than the highest number already used (formatted as INV-n),
  // so numbering stays sequential even if invoices are deleted.
  const getNextInvoiceNumber = () => {
    const prefix = invoiceSettings.numberPrefix || 'INV-';
    const maxNum = invoices.reduce((max, inv) => {
      const match = String(inv.invoiceNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakeInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceForm({ ...emptyInvoiceForm(), invoiceNo: getNextInvoiceNumber() });
    setQuotationSubView('makeInvoice');
  };

  const openSelectCustomerForInvoice = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForInvoice');
    setQuotationSubView('selectCustomerForInvoice');
  };
  const handleSelectCustomerForInvoice = (customer) => {
    setInvoiceForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeInvoice');
  };
  const selectedInvoiceCustomer = customers.find((c) => c.id === invoiceForm.customerId) || null;

  const removeInvoiceProductLine = (productId) => {
    setInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  // ===== Add Invoice Product (dedicated per-line form: Product / Quantity / Price / Description) =====
  const emptyInvoiceProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };
  const [invoiceProductLineForm, setInvoiceProductLineForm] = useState(emptyInvoiceProductLineForm);
  const [editingInvoiceProductLineId, setEditingInvoiceProductLineId] = useState(null);
  const openAddInvoiceProductLine = () => {
    setInvoiceProductLineForm(emptyInvoiceProductLineForm);
    setEditingInvoiceProductLineId(null);
    setQuotationSubView('addInvoiceProductLine');
  };
  const openEditInvoiceProductLine = (p) => {
    setInvoiceProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingInvoiceProductLineId(p.productId);
    setQuotationSubView('addInvoiceProductLine');
  };
  const openPickProductForInvoiceLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForInvoiceLine');
  };
  const handlePickProductForInvoiceLine = (product) => {
    setInvoiceProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || prev.description,
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addInvoiceProductLine');
  };
  const handleAddInvoiceProductLine = () => {
    if (!invoiceProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(invoiceProductLineForm.qty) > 0 ? Number(invoiceProductLineForm.qty) : 1;
    const price = Number(invoiceProductLineForm.price) || 0;
    setInvoiceForm((prev) => {
      const baseProducts = editingInvoiceProductLineId
        ? prev.products.filter((p) => p.productId !== editingInvoiceProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === invoiceProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === invoiceProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(invoiceProductLineForm.gst) || 0, description: invoiceProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: invoiceProductLineForm.productId,
            name: invoiceProductLineForm.name,
            price,
            gst: Number(invoiceProductLineForm.gst) || 0,
            qty,
            unit: invoiceProductLineForm.unit || '',
            hsn: invoiceProductLineForm.hsn || '',
            description: invoiceProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingInvoiceProductLineId(null);
    setQuotationSubView('makeInvoice');
  };

  const [isInvoiceOtherChargeModalOpen, setIsInvoiceOtherChargeModalOpen] = useState(false);
  const [invoiceOtherChargeForm, setInvoiceOtherChargeForm] = useState({ label: 'Other Charges', amount: '', taxable: false });
  const openInvoiceOtherChargeModal = () => {
    setInvoiceOtherChargeForm({ label: 'Other Charges', amount: '', taxable: false });
    setIsInvoiceOtherChargeModalOpen(true);
  };
  const handleSaveInvoiceOtherCharge = () => {
    if (!invoiceOtherChargeForm.amount || Number(invoiceOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    const newCharge = { ...invoiceOtherChargeForm, id: genId() };
    setInvoiceForm((prev) => ({ ...prev, otherCharges: [...prev.otherCharges, newCharge] }));
    setIsInvoiceOtherChargeModalOpen(false);
  };
  const removeInvoiceOtherCharge = (id) => {
    setInvoiceForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };
  // Removes a term from THIS invoice's selection only (does not delete the term
  // from the invoice terms catalog - that is handled separately by handleDeleteTerm).
  const removeInvoiceSelectedTerm = (termId) => {
    setInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  const [invoiceTermsDraftSelectedIds, setInvoiceTermsDraftSelectedIds] = useState([]);
  const openSelectTermsForInvoice = () => {
    setInvoiceTermsDraftSelectedIds(invoiceForm.termsIds);
    setQuotationSubView('selectTermsForInvoice');
  };
  const toggleInvoiceTermsDraftSelection = (id) => {
    setInvoiceTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDoneSelectTermsInvoice = () => {
    setInvoiceForm((prev) => ({ ...prev, termsIds: invoiceTermsDraftSelectedIds }));
    setQuotationSubView('makeInvoice');
  };
  const selectedInvoiceTerms = invoiceTerms.filter((term) => invoiceForm.termsIds.includes(term.id));

  // Paid Info (extra field vs. Make Quotation)
  const emptyPaidInfoForm = () => ({ date: '', amount: '', note: '' });
  const [isPaidInfoModalOpen, setIsPaidInfoModalOpen] = useState(false);
  const [paidInfoForm, setPaidInfoForm] = useState(emptyPaidInfoForm);
  const [isPaidInfoDatePickerOpen, setIsPaidInfoDatePickerOpen] = useState(false);
  const [paidInfoCalendarMonth, setPaidInfoCalendarMonth] = useState(() => new Date());
  const openAddPaidInfoModal = () => {
    setPaidInfoForm(emptyPaidInfoForm());
    setPaidInfoCalendarMonth(new Date());
    setIsPaidInfoModalOpen(true);
  };
  const handleSavePaidInfo = () => {
    if (!paidInfoForm.amount || Number(paidInfoForm.amount) <= 0) {
      showAlert('Please enter a valid paid amount.');
      return;
    }
    if (!paidInfoForm.date) {
      showAlert(t('selectDateForAdvanceError') || 'Please select the paid date.');
      return;
    }
    const newPaidInfo = { id: genId(), date: paidInfoForm.date, amount: Number(paidInfoForm.amount), note: paidInfoForm.note };
    setInvoiceForm((prev) => ({ ...prev, paidInfo: [...prev.paidInfo, newPaidInfo] }));
    setIsPaidInfoModalOpen(false);
  };
  const removePaidInfoLine = (id) => {
    setInvoiceForm((prev) => ({ ...prev, paidInfo: prev.paidInfo.filter((p) => p.id !== id) }));
  };
  // Tap-to-select on Paid Info List entries - mirrors the Select Terms and Conditions
  // screen's draft-selection pattern (single or multi-select, highlighted card, Done
  // just closes the screen without any further data change).
  const [selectedPaidInfoIds, setSelectedPaidInfoIds] = useState([]);
  const openPaidInfoList = () => {
    setSelectedPaidInfoIds([]);
    setQuotationSubView('paidInfoList');
  };
  const togglePaidInfoSelection = (id) => {
    setSelectedPaidInfoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const handleDonePaidInfoList = () => {
    setSelectedPaidInfoIds([]);
    setQuotationSubView('makeInvoice');
  };

  const invoiceProductsTotal = invoiceForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);
  const invoiceOtherChargesTotal = invoiceForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const invoiceGrandTotal = Math.round(invoiceProductsTotal + invoiceOtherChargesTotal);
  const invoicePaidTotal = invoiceForm.paidInfo.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const invoiceAmountDue = Math.max(0, invoiceGrandTotal - invoicePaidTotal);

  const handleGenerateInvoice = async () => {
  if (!invoiceForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (invoiceForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save an invoice.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedInvoiceCustomer?.name || 'Unknown',
    customerCompany: selectedInvoiceCustomer?.companyName || '',
    customerMobile: selectedInvoiceCustomer?.mobile || '',
    customerEmail: selectedInvoiceCustomer?.email || '',
    customerAddressLine1: selectedInvoiceCustomer?.addressLine1 || '',
    customerAddressLine2: selectedInvoiceCustomer?.addressLine2 || '',
    customerAddressLine3: selectedInvoiceCustomer?.addressLine3 || '',
    customerBillingAddress: selectedInvoiceCustomer?.billingAddress || '',
    customerShippingAddress: selectedInvoiceCustomer?.shippingAddress || '',
  };

  const payload = { ...invoiceForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(invoiceSettings) };

  try {
    if (editingInvoiceId) {
      const saved = await invoicesService.updateInvoice(editingInvoiceId, payload);
      persistInvoices(invoices.map((inv) => (inv.id === editingInvoiceId ? saved : inv)));
      showSuccess('Invoice updated successfully.');
      setEditingInvoiceId(null);
      setQuotationSubView('invoiceDetail');
    } else {
      // New invoices default to 'Unpaid' until the user marks them Paid / Partially Paid / Cancelled.
      const created = await invoicesService.createInvoice(loggedInUser.userId, { ...payload, status: 'Unpaid' });
      persistInvoices([...invoices, created]);
      showSuccess('Invoice generated successfully.');
      setQuotationSubView('invoiceList');
    }
  } catch (error) {
    console.error('Error saving invoice:', error);
    showAlert('Could not save the invoice. Please try again.');
  }
};

  // ===== Receipts module: Make Receipt =====
  const emptyReceiptForm = () => ({
    date: formatQuotationDate(new Date()),
    receiptNo: '',
    customerId: null,
    paymentMode: '',
    referenceNo: '',
    paidAmount: '',
    paymentFor: '',
  });
  const [receiptForm, setReceiptForm] = useState(emptyReceiptForm);

  // ===== Receipts module: List & Detail Views =====
  const [receipts, setReceipts] = useState(() => {
    try {
      const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');

  const persistReceipts = (next) => {
    setReceipts(next);
    try { localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  // Next receipt number = 1 higher than the highest number already used (formatted with the
  // receipt settings prefix), so numbering stays sequential even if receipts are deleted.
  const getNextReceiptNumber = () => {
    const prefix = receiptSettings.numberPrefix || 'RECEIPT-';
    const maxNum = receipts.reduce((max, r) => {
      const match = String(r.receiptNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };

  const openMakeReceipt = () => {
    setEditingReceiptId(null);
    setReceiptForm({ ...emptyReceiptForm(), receiptNo: getNextReceiptNumber() });
    setQuotationSubView('makeReceipt');
  };

  const openSelectCustomerForReceipt = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForReceipt');
    setQuotationSubView('selectCustomerForReceipt');
  };
  const handleSelectCustomerForReceipt = (customer) => {
    setReceiptForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeReceipt');
  };
  const selectedReceiptCustomer = customers.find((c) => c.id === receiptForm.customerId) || null;

  // Receipt Payment Info sub-screen (Matches Screenshot 3)
  const emptyReceiptPaymentDraft = () => ({ paymentMode: '', referenceNo: '', paidAmount: '', paymentFor: '' });
  const [receiptPaymentDraft, setReceiptPaymentDraft] = useState(emptyReceiptPaymentDraft);
  const openReceiptPaymentInfo = () => {
    setReceiptPaymentDraft({
      paymentMode: receiptForm.paymentMode,
      referenceNo: receiptForm.referenceNo,
      paidAmount: receiptForm.paidAmount,
      paymentFor: receiptForm.paymentFor,
    });
    setQuotationSubView('receiptPaymentInfo');
  };
  const handleSaveReceiptPaymentInfo = () => {
    if (!receiptPaymentDraft.paidAmount || Number(receiptPaymentDraft.paidAmount) <= 0) {
      showAlert('Please enter a valid total amount paid.');
      return;
    }
    setReceiptForm((prev) => ({
      ...prev,
      paymentMode: receiptPaymentDraft.paymentMode,
      referenceNo: receiptPaymentDraft.referenceNo,
      paidAmount: receiptPaymentDraft.paidAmount,
      paymentFor: receiptPaymentDraft.paymentFor,
    }));
    setQuotationSubView('makeReceipt');
  };

  const receiptPaidAmount = Number(receiptForm.paidAmount) || 0;

  const handleGenerateReceipt = async () => {
  if (!receiptForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (!receiptForm.paidAmount || Number(receiptForm.paidAmount) <= 0) {
    showAlert('Please add payment info.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a receipt.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedReceiptCustomer?.name || 'Unknown',
    customerCompany: selectedReceiptCustomer?.companyName || '',
    customerMobile: selectedReceiptCustomer?.mobile || '',
    customerEmail: selectedReceiptCustomer?.email || '',
    customerAddressLine1: selectedReceiptCustomer?.addressLine1 || '',
    customerAddressLine2: selectedReceiptCustomer?.addressLine2 || '',
    customerAddressLine3: selectedReceiptCustomer?.addressLine3 || '',
    customerBillingAddress: selectedReceiptCustomer?.billingAddress || '',
    customerShippingAddress: selectedReceiptCustomer?.shippingAddress || '',
  };

  const payload = { ...receiptForm, ...customerSnapshot, docSnapshot: buildDocSettingsSnapshot(receiptSettings) };

  try {
    if (editingReceiptId) {
      const saved = await receiptsService.updateReceipt(editingReceiptId, payload);
      persistReceipts(receipts.map((r) => (r.id === editingReceiptId ? saved : r)));
      showSuccess('Receipt updated successfully.');
      setEditingReceiptId(null);
      setQuotationSubView('receiptDetail');
    } else {
      const created = await receiptsService.createReceipt(loggedInUser.userId, payload);
      persistReceipts([...receipts, created]);
      showSuccess('Receipt generated successfully.');
      setQuotationSubView('receiptList');
    }
  } catch (error) {
    console.error('Error saving receipt:', error);
    showAlert('Could not save the receipt. Please try again.');
  }
};

  // ===== Shared: Duplicate / Edit / Status / Share for all document modules =====
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [editingPurchaseOrderId, setEditingPurchaseOrderId] = useState(null);
  const [editingProformaInvoiceId, setEditingProformaInvoiceId] = useState(null);
  const [editingDeliveryNoteId, setEditingDeliveryNoteId] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editingReceiptId, setEditingReceiptId] = useState(null);

  const [showQuotationStatusSheet, setShowQuotationStatusSheet] = useState(false);
  const [showPurchaseOrderMoreSheet, setShowPurchaseOrderMoreSheet] = useState(false);
  const [showProformaInvoiceMoreSheet, setShowProformaInvoiceMoreSheet] = useState(false);
  const [showProformaInvoiceStatusSheet, setShowProformaInvoiceStatusSheet] = useState(false);
  const [showProformaInvoiceConvertSheet, setShowProformaInvoiceConvertSheet] = useState(false);
  const [showDeliveryNoteMoreSheet, setShowDeliveryNoteMoreSheet] = useState(false);
  const [showInvoiceMoreSheet, setShowInvoiceMoreSheet] = useState(false);
  const [showInvoiceStatusSheet, setShowInvoiceStatusSheet] = useState(false);
  const [showInvoiceConvertSheet, setShowInvoiceConvertSheet] = useState(false);
  const [showReceiptMoreSheet, setShowReceiptMoreSheet] = useState(false);
  const DOCUMENT_STATUS_OPTIONS = ['In-Progress', 'Approved', 'Rejected'];
  // Invoice Status uses its own set of options (Paid / Unpaid / Partially Paid / Cancelled)
  // instead of the generic In-Progress / Approved / Rejected set used by the other document modules.
  const INVOICE_STATUS_OPTIONS = ['Paid', 'Unpaid', 'Partially Paid', 'Cancelled'];
  // Older invoices (and any newly created/converted invoice that doesn't carry a status
  // yet) may still have a leftover generic status like 'In-Progress' / 'Approved' / 'Rejected',
  // or no status at all. Since the Invoice screen now only understands the Paid / Unpaid /
  // Partially Paid / Cancelled set, treat anything outside that set as 'Unpaid' by default.
  const normalizeInvoiceStatus = (status) => (
    INVOICE_STATUS_OPTIONS.includes(status) ? status : 'Unpaid'
  );
  const documentStatusColors = {
    'In-Progress': { bg: '#D97706', text: '#ffffff' },
    'Approved': { bg: '#16A34A', text: '#ffffff' },
    'Rejected': { bg: '#DC2626', text: '#ffffff' },
    'Paid': { bg: '#16A34A', text: '#ffffff' },
    'Unpaid': { bg: '#DC2626', text: '#ffffff' },
    'Partially Paid': { bg: '#D97706', text: '#ffffff' },
    'Cancelled': { bg: '#64748B', text: '#ffffff' },
  };
  const DocumentStatusBadge = ({ status }) => {
    if (!status) return null;
    const meta = documentStatusColors[status] || documentStatusColors['In-Progress'];
    return (
      <div style={{ position: 'absolute', top: '10px', right: '16px', background: meta.bg, color: meta.text, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
        {status}
      </div>
    );
  };
  // Reusable "Quotation Status"-style bottom sheet used by every document module's More > Status action.
  // `options` lets individual document modules (e.g. Invoice) show their own status list instead of
  // the default DOCUMENT_STATUS_OPTIONS.
  const DocumentStatusSheet = ({ open, title, onSelect, onClose, options }) => {
    if (!open) return null;
    const statusOptions = options || DOCUMENT_STATUS_OPTIONS;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
        <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>{title}</h3>
          {statusOptions.map((status, idx) => (
            <button
              key={status}
              onClick={() => onSelect(status)}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: idx < statusOptions.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Reusable document-list row card: customer/company name on the left,
  // document number / date / amount (+ status when present) stacked on the
  // right — used by every list screen in the Quotation Module (Quotation,
  // Invoice, Purchase Order, Proforma Invoice, Delivery Note, Receipt) so
  // the information hierarchy stays identical across document types.
  // Pass either `amount` (a number, rendered as ₹X) or `amountText` (a raw
  // string, e.g. "2 items") for document types that don't carry a price.
  const DocumentListCard = ({ name, docNumber, date, amount, amountText, status, onClick, rightAccessory }) => {
    const statusMeta = status ? (documentStatusColors[status] || documentStatusColors['In-Progress']) : null;
    return (
      <button type="button" onClick={onClick} style={customerModuleStyles.docCard}>
        <span style={customerModuleStyles.docCardName}>{name}</span>
        <div style={customerModuleStyles.docCardRight}>
          <span style={customerModuleStyles.docCardNumber}>{docNumber}</span>
          <span style={customerModuleStyles.docCardDate}>{date}</span>
          <div style={customerModuleStyles.docCardBottomRow}>
            {rightAccessory}
            {statusMeta && (
              <span style={{ ...customerModuleStyles.docCardStatusPill, background: statusMeta.bg, color: statusMeta.text }}>
                {status}
              </span>
            )}
            <span style={customerModuleStyles.docCardAmount}>
              {amountText !== undefined ? amountText : `₹${Number(amount || 0).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // ===== Shared professional-document design system =====
  // One consistent typography/spacing scale used by every generated-document preview
  // screen (Quotation, Purchase Order, Proforma Invoice, Delivery Note, Invoice, Receipt)
  // so all documents in the Quotation Module look like one coherent, business-grade product.
  const DOC_FONT = "'Helvetica Neue', Arial, 'Segoe UI', sans-serif";
  const docStyles = {
    page: {
      background: '#ffffff', padding: '26px 22px 24px', borderRadius: '10px',
      boxShadow: '0 1px 8px rgba(15,23,42,0.06)', minHeight: '70vh',
      fontFamily: DOC_FONT, WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%',
    },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0', gap: '12px' },
    // Matches toName (the customer name, e.g. under "To,") so the business name and
    // customer name render in the same font/size/weight across every document type.
    businessName: { fontSize: '12.5px', fontWeight: '700', color: '#0F172A', margin: 0, lineHeight: 1.4 },
    contactLine: { fontSize: '10px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 },
    docTypeLabel: { fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' },
    docMetaLine: { fontSize: '10.5px', fontWeight: '500', color: '#64748B', margin: '3px 0 0', lineHeight: 1.4 },
    sectionLabel: { fontSize: '10px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px', margin: '0 0 5px', textTransform: 'uppercase' },
    toName: { fontSize: '12.5px', fontWeight: '700', color: '#0F172A', margin: 0, lineHeight: 1.4 },
    addressLine: { fontSize: '10.5px', color: '#64748B', margin: '2px 0 0', lineHeight: 1.4 },
    bodyText: { fontSize: '11px', color: '#475569', lineHeight: 1.55, margin: '0 0 14px' },
    tableWrap: { marginBottom: '14px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', tableLayout: 'fixed' },
    th: { textAlign: 'left', padding: '7px 5px', fontSize: '9.5px', fontWeight: '700', color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase', borderTop: '1.5px solid #0F172A', borderBottom: '1.5px solid #0F172A' },
    td: { padding: '8px 5px', fontSize: '10.5px', color: '#334155', borderBottom: '1px solid #EEF1F5', verticalAlign: 'top' },
    tdBold: { fontWeight: '600', color: '#0F172A' },
    totalsLabel: { padding: '5px 5px', textAlign: 'right', fontSize: '10.5px', color: '#64748B', fontWeight: '500' },
    totalsValue: { padding: '5px 5px', textAlign: 'right', fontSize: '10.5px', color: '#334155', fontWeight: '600' },
    grandTotalLabel: { padding: '9px 5px', textAlign: 'right', fontSize: '11.5px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.3px' },
    grandTotalValue: { padding: '9px 5px', textAlign: 'right', fontSize: '13.5px', fontWeight: '800', color: '#0F172A' },
    closingText: { fontSize: '10.5px', color: '#64748B', lineHeight: 1.55, margin: '14px 0 26px' },
    signatureLabel: { fontSize: '11.5px', fontWeight: '700', color: '#0F172A', margin: 0 },
    signatureCaption: { fontSize: '9px', color: '#94A3B8', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' },
  };
  // Shared footer action bar (Duplicate / Edit / Invoice / Status / Delete) used on every
  // document detail screen. Every action — including Delete — shares the same button shape
  // and a fixed-height icon wrapper, so emoji icons and the FiTrash2 svg icon all sit on the
  // exact same baseline instead of Delete appearing to float higher than the rest.
  const docActionBarStyles = {
    bar: { background: '#ffffff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 16px', flexShrink: 0, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    btn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 },
    iconWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px', lineHeight: 1 },
    label: { fontSize: '11px', fontWeight: '600', lineHeight: 1 },
  };

  // Small top-right brand mark shown on every generated document: a compact logo with the
  // app name directly below it. Kept subtle/professional and away from document title,
  // customer details, and totals. Bottom-of-document branding was removed as redundant.
  const DocBrandHeader = () => (
    <div style={{ textAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <img src={smartpayLogo} alt="SmartManage" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', display: 'block' }} />
      <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', letterSpacing: '0.2px', fontFamily: DOC_FONT }}>SmartManage</span>
    </div>
  );

  // Single source of truth for the Quotation document's content: both the in-app
  // "Quotation Detail" preview and the shared PDF read from this exact same model,
  // so the two can never drift apart again (header layout, To/Date, table rows,
  // Sub Total / Other Charges / Grand Total, Terms & Conditions, signature block).
  const getDocDisplayNumber = (docNo) => {
    const match = String(docNo || '').match(/(\d+)\s*$/);
    return match ? match[1] : (docNo || '');
  };
  // Splits a settings "Top Message" (which may contain a literal newline, e.g.
  // "Dear Sir/Mam,\nThank you...") into separate greeting lines for display.
  const splitTopMessageLines = (msg) => (msg || '').split('\n').map((s) => s.trim()).filter(Boolean);
  // Builds the "To," customer block used by every document preview/PDF. Company + contact
  // name are combined onto one line, and Address Line 1 / Address Line 2 / City
  // (customerAddressLine1-3) are combined onto a second line - condensed from what would
  // otherwise be 5 separate lines, so more product rows fit on the first PDF page.
  const buildCustomerLines = (entity) => {
    const companyNameLine = (entity.customerCompany && entity.customerName)
      ? `${entity.customerCompany} -> ${entity.customerName}`
      : (entity.customerCompany || entity.customerName);
    // Prefer the full billing address (Address Line 1, Address Line 2, City, State, Pincode)
    // saved on the entity; fall back to the raw line1-3 join for older records that predate it.
    const addressLine = entity.customerBillingAddress
      || [entity.customerAddressLine1, entity.customerAddressLine2, entity.customerAddressLine3].filter(Boolean).join(', ');
    return [
      companyNameLine,
      addressLine,
      entity.customerMobile ? `Mobile: ${entity.customerMobile}` : null,
      entity.customerEmail ? `Email: ${entity.customerEmail}` : null,
    ].filter(Boolean);
  };
  // Captures every Business Info + Settings-driven field a document's preview/PDF depends
  // on (business name/contact/logo/signature, bank & UPI/QR details, HSN column label, and
  // that document type's Top/Bottom Message + display-toggle settings), at the exact moment
  // a document is generated or edited-and-updated. Stored as `docSnapshot` on the document
  // itself so later changes to Business Info, that document type's Settings, or Column
  // Heading Settings never alter an already-created document - it only picks up new values
  // the next time the user opens that specific document in Edit and taps Update/Generate.
  const buildDocSettingsSnapshot = (settings = {}) => ({
    topMessageMode: settings.topMessageMode,
    topMessage: settings.topMessage,
    bottomMessageMode: settings.bottomMessageMode,
    bottomMessage: settings.bottomMessage,
    showBankInfo: settings.showBankInfo,
    showUpiInfo: settings.showUpiInfo,
    showSignature: settings.showSignature,
    showProductHSN: settings.showProductHSN,
    showShippingAddress: settings.showShippingAddress,
    taxType: settings.taxType,
    hsnLabel: columnHeadingSettings.hsnLabel || 'HSN',
    businessName: businessInfo?.businessName || '',
    businessPhone: businessInfo?.phone || '',
    businessEmail: businessInfo?.email || '',
    logoImg: businessInfo?.logoImg || null,
    signatureImg: businessInfo?.signatureImg || null,
    bankAccountName: businessInfo?.bankAccountName || '',
    bankAccountNumber: businessInfo?.bankAccountNumber || '',
    bankName: businessInfo?.bankName || '',
    ifscCode: businessInfo?.ifscCode || '',
    upiId: businessInfo?.upiId || '',
    qrCodeImg: businessInfo?.qrCodeImg || null,
  });
  const buildQuotationDocModel = (q) => {
    const snap = q.docSnapshot || buildDocSettingsSnapshot(quotationSettings);
    const rows = (q.products || []).map((p, idx) => {
      const taxableAmt = (p.price || 0) * (p.qty || 0);
      const gstAmt = taxableAmt * (p.gst || 0) / 100;
      return {
        index: idx + 1, name: p.name, hsn: p.hsn || '-', qty: p.qty, unit: p.unit || '',
        price: p.price || 0, gstPct: p.gst || 0, gstAmt, total: taxableAmt + gstAmt,
      };
    });
    const subTotal = (q.products || []).reduce((sum, p) => sum + (p.price || 0) * (p.qty || 0), 0);
    const gstTotal = (q.products || []).reduce((sum, p) => sum + ((p.price || 0) * (p.qty || 0) * (p.gst || 0) / 100), 0);
    const extraChargesTotal = (q.otherCharges || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const customerLines = buildCustomerLines(q);
    const termsLines = quotationTerms.filter((t) => (q.termsIds || []).includes(t.id)).map((t) => t.text);
    return {
      quotationTitle: 'Quotation',
      docTitle: 'Quotation',
      toLabel: 'To,',
      pricing: true,
      businessName: snap.businessName || 'Manufacturer',
      businessPhone: snap.businessPhone || '',
      businessEmail: snap.businessEmail || '',
      hsnLabel: snap.hsnLabel || 'HSN',
      date: q.date,
      customerLines,
      shippingAddress: q.customerShippingAddress || '',
      rows,
      subTotal,
      gstTotal,
      otherChargesTotal: extraChargesTotal,
      grandTotal: q.grandTotal || 0,
      termsLines,
      greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
      closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
      signatureName: snap.businessName || 'Manufacturer',
      logoImg: snap.logoImg || null,
      signatureImg: snap.signatureImg || null,
      // Quotation Settings toggles: only shown on the Quotation PDF/preview when set to "Yes".
      showGst: snap.taxType !== 'No',
      showHsn: snap.showProductHSN === 'Yes',
      showShippingAddress: snap.showShippingAddress === 'Yes',
      showBankInfo: snap.showBankInfo === 'Yes',
      showUpi: snap.showUpiInfo === 'Yes',
      showSignature: snap.showSignature !== 'No',
      bankAccountName: snap.bankAccountName || '',
      bankAccountNumber: snap.bankAccountNumber || '',
      bankName: snap.bankName || '',
      ifscCode: snap.ifscCode || '',
      upiId: snap.upiId || '',
      qrCodeImg: snap.qrCodeImg || null,
    };
  };

  // Generic document-model builder shared by Invoice / Purchase Order / Proforma Invoice /
  // Delivery Note detail screens and their PDFs. Produces the exact same shape as
  // buildQuotationDocModel (header/business info + logo, To/Date, item rows, totals,
  // terms, signature + signature image) so every document type gets the identical layout
  // Quotation Detail already has — only the type-specific text/labels/fields passed in via
  // `opts` differ (doc title prefix, greeting/closing copy, which totals rows apply, etc).
  const buildDocModel = (doc, opts) => {
    const {
      docTypeLabel, docNo, terms, toLabel, greetingLines, closingText, pricing = true, hasPayment = false,
      showBankInfo = false, showUpi = false, showSignature = true, showHsn = true, showGst = true, showShippingAddress = false,
      snapshot = {},
    } = opts;
    const rows = (doc.products || []).map((p, idx) => {
      const taxableAmt = (p.price || 0) * (p.qty || 0);
      const gstAmt = taxableAmt * (p.gst || 0) / 100;
      return {
        index: idx + 1, name: p.name, hsn: p.hsn || '-', qty: p.qty, unit: p.unit || '',
        price: p.price || 0, gstPct: p.gst || 0, gstAmt, total: taxableAmt + gstAmt,
      };
    });
    const subTotal = (doc.products || []).reduce((sum, p) => sum + (p.price || 0) * (p.qty || 0), 0);
    const gstTotal = (doc.products || []).reduce((sum, p) => sum + ((p.price || 0) * (p.qty || 0) * (p.gst || 0) / 100), 0);
    const extraChargesTotal = (doc.otherCharges || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const customerLines = buildCustomerLines(doc);
    const termsLines = (terms || []).filter((t) => (doc.termsIds || []).includes(t.id)).map((t) => t.text);
    return {
      docTitle: docTypeLabel,
      businessName: snapshot.businessName || 'Manufacturer',
      businessPhone: snapshot.businessPhone || '',
      businessEmail: snapshot.businessEmail || '',
      hsnLabel: snapshot.hsnLabel || 'HSN',
      date: doc.date,
      toLabel: toLabel || 'To,',
      customerLines,
      shippingAddress: doc.customerShippingAddress || '',
      greetingLines: greetingLines || [],
      closingText: closingText || '',
      rows,
      subTotal,
      gstTotal,
      otherChargesTotal: extraChargesTotal,
      grandTotal: doc.grandTotal || 0,
      hasPayment,
      paidTotal: doc.paidTotal || 0,
      balanceDue: doc.balanceDue ?? doc.grandTotal ?? 0,
      paidInfo: doc.paidInfo || [],
      termsLines,
      signatureName: snapshot.businessName || 'Manufacturer',
      logoImg: snapshot.logoImg || null,
      signatureImg: snapshot.signatureImg || null,
      pricing,
      otherInfo: doc.otherInfo || '',
      // Settings toggles: only shown on this doc type's PDF/preview when the caller opts in
      // (driven by that document type's own Settings screen, e.g. Purchase Order Settings).
      showBankInfo,
      showUpi,
      showSignature,
      showHsn,
      showGst,
      showShippingAddress,
      bankAccountName: snapshot.bankAccountName || '',
      bankAccountNumber: snapshot.bankAccountNumber || '',
      bankName: snapshot.bankName || '',
      ifscCode: snapshot.ifscCode || '',
      upiId: snapshot.upiId || '',
      qrCodeImg: snapshot.qrCodeImg || null,
    };
  };

  // Type-specific wrappers around buildDocModel — each just supplies the doc-type label,
  // number field, terms catalog, and greeting/closing copy appropriate to that document,
  // while the shape (header + logo, To/Date, table, totals, terms, signature + signature
  // image) stays identical to Quotation Detail's design across every document type.
  const buildPurchaseOrderDocModel = (o) => {
    const snap = o.docSnapshot || buildDocSettingsSnapshot(purchaseOrderSettings);
    return buildDocModel(o, {
      docTypeLabel: 'Purchase Order',
      docNo: o.purchaseOrderNo,
      terms: purchaseOrderTerms,
      toLabel: 'To,',
      greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
      closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
      pricing: true,
      hasPayment: false,
      // Purchase Order Settings toggles: HSN and GST were previously always shown regardless
      // of the "Product HSN Display" / "GST Display" toggles below — wired up here so the
      // Purchase Order PDF/preview matches its own Settings screen, same as every other doc type.
      showHsn: snap.showProductHSN === 'Yes',
      showGst: snap.taxType !== 'No',
      showShippingAddress: snap.showShippingAddress === 'Yes',
      showBankInfo: snap.showBankInfo === 'Yes',
      showUpi: snap.showUpiInfo === 'Yes',
      showSignature: snap.showSignature !== 'No',
      snapshot: snap,
    });
  };
  const buildProformaInvoiceDocModel = (inv) => {
  const snap = inv.docSnapshot || buildDocSettingsSnapshot(proformaInvoiceSettings);
  return buildDocModel(inv, {
  docTypeLabel: 'Proforma Invoice',
  docNo: inv.proformaInvoiceNo,
  terms: proformaInvoiceTerms,
  toLabel: 'Bill To,',
  greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
  closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
  pricing: true,
  hasPayment: true,
  // Proforma Invoice Settings toggles: only shown on the Proforma Invoice PDF/preview
  // when set to "Yes", matching how Quotation/Invoice Settings drive their own detail screens.
  showHsn: snap.showProductHSN === 'Yes',
  showGst: snap.taxType !== 'No',
  showShippingAddress: snap.showShippingAddress === 'Yes',
  showBankInfo: snap.showBankInfo === 'Yes',
  showUpi: snap.showUpiInfo === 'Yes',
  showSignature: snap.showSignature !== 'No',
  snapshot: snap,
});
};
  const buildInvoiceDocModel = (inv) => {
    const snap = inv.docSnapshot || buildDocSettingsSnapshot(invoiceSettings);
    return buildDocModel(inv, {
      docTypeLabel: 'Invoice',
      docNo: inv.invoiceNo,
      terms: invoiceTerms,
      toLabel: 'Bill To,',
      greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
      closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
      pricing: true,
      hasPayment: true,
      // Invoice Settings toggles: only shown on the Invoice PDF/preview when set to "Yes",
      // matching how Quotation Settings drives Quotation Detail.
      showHsn: snap.showProductHSN === 'Yes',
      showGst: snap.taxType !== 'No',
      showShippingAddress: snap.showShippingAddress === 'Yes',
      showBankInfo: snap.showBankInfo === 'Yes',
      showUpi: snap.showUpiInfo === 'Yes',
      showSignature: snap.showSignature !== 'No',
      snapshot: snap,
    });
  };
  const buildDeliveryNoteDocModel = (dn) => {
  const snap = dn.docSnapshot || buildDocSettingsSnapshot(deliveryNoteSettings);
  return buildDocModel(dn, {
  docTypeLabel: 'Delivery Note',
  docNo: dn.deliveryNoteNo,
  terms: deliveryNoteTerms,
  toLabel: 'To,',
  greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
  closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
  pricing: false,
  hasPayment: false,
  // Delivery Note Settings toggles: HSN and Signature were previously always shown
  // regardless of the "Product HSN Display" / "Signature Display" toggles below — wired
  // up here so the Delivery Note PDF/preview matches its own Settings screen.
  showHsn: snap.showProductHSN === 'Yes',
  showSignature: snap.showSignature !== 'No',
  showShippingAddress: snap.showShippingAddress === 'Yes',
  // Delivery Note only: a "Received By" acknowledgement block (Name / Date / Signature)
  // is shown on the left, at the very bottom of the document - below Terms & Conditions
  // and any other trailing sections, alongside the business's own Authorized Signature
  // on the right. See showReceivedBy handling in GeneratedDocumentPreview and
  // shareStandardDocumentPdf.
  showReceivedBy: true,
  snapshot: snap,
});
};

  // Renders the full document body (header/logo, To+Date, greeting, item table, totals,
  // other info, closing text, terms, signature + signature image, brand footer) from a
  // model built by buildDocModel/buildQuotationDocModel — the exact same visual structure
  // Quotation Detail uses, reused by every other document type's in-app preview.
  const GeneratedDocumentPreview = ({ model }) => {
    // These settings-driven flags default to "on" (undefined !== false) for document types
    // that don't define them (Invoice/Purchase Order/Proforma Invoice/Delivery Note), so
    // their preview keeps behaving exactly as before. Only Quotation sets them explicitly,
    // driven by Quotation Settings.
    const showHsn = model.showHsn !== false;
    const showGst = model.showGst !== false;
    const showSignature = model.showSignature !== false;
    const showShippingAddress = !!model.showShippingAddress && !!model.shippingAddress;
    const showBankInfo = !!model.showBankInfo && (model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode);
    const showUpi = !!model.showUpi && (model.upiId || model.qrCodeImg);
    const showReceivedBy = !!model.showReceivedBy;
    const totalCols = 2 + (showHsn ? 1 : 0) + 1 + (model.pricing ? (1 + (showGst ? 1 : 0) + 1) : 0);
    const footerColSpan = totalCols - 1;
    return (
      <>
        {/* Header: Doc title (top, centered), then Business info + logo below */}
        <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
          <p style={{ ...docStyles.docTypeLabel, textTransform: 'none', textAlign: 'center', margin: '0 0 12px' }}>{model.docTitle}</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={docStyles.businessName}>{model.businessName}</h2>
              {model.businessPhone && <p style={docStyles.contactLine}>{model.businessPhone}</p>}
              {model.businessEmail && <p style={docStyles.contactLine}>{model.businessEmail}</p>}
            </div>
            {model.logoImg && (
              <img src={model.logoImg} alt="Business Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }} />
            )}
          </div>
        </div>

        {/* To, (left) | Date (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: showShippingAddress ? '10px' : '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>{model.toLabel}</p>
            {model.customerLines.map((line, idx) => (
              <p key={idx} style={idx === 0 ? docStyles.toName : docStyles.contactLine}>{line}</p>
            ))}
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <p style={docStyles.docMetaLine}>Date: {model.date}</p>
          </div>
        </div>

        {/* Shipping Address (Quotation only, when enabled in Quotation Settings) */}
        {showShippingAddress && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>Shipping Address</p>
            <p style={docStyles.contactLine}>{model.shippingAddress}</p>
          </div>
        )}

        {model.greetingLines.length > 0 && (
          <p style={docStyles.bodyText}>
            {model.greetingLines.map((line, idx) => (
              <Fragment key={idx}>
                {line}
                {idx < model.greetingLines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        )}

        {/* Table */}
        <div style={docStyles.tableWrap}>
          <table style={docStyles.table}>
            <thead>
              <tr>
                <th style={{ ...docStyles.th, width: model.pricing ? '6%' : '10%' }}>#</th>
                <th style={{ ...docStyles.th, width: model.pricing ? '22%' : '42%', wordBreak: 'break-word' }}>Item</th>
                {showHsn && <th style={{ ...docStyles.th, width: model.pricing ? '11%' : '23%', wordBreak: 'break-word' }}>{model.hsnLabel}</th>}
                <th style={{ ...docStyles.th, textAlign: 'center', width: model.pricing ? '11%' : '25%' }}>Qty</th>
                {model.pricing && <th style={{ ...docStyles.th, textAlign: 'right', width: '17%' }}>Price</th>}
                {model.pricing && showGst && <th style={{ ...docStyles.th, textAlign: 'right', width: '15%' }}>GST</th>}
                {model.pricing && <th style={{ ...docStyles.th, textAlign: 'right', width: '18%' }}>Total</th>}
              </tr>
            </thead>
            <tbody>
              {model.rows.map((r) => (
                <tr key={r.index}>
                  <td style={docStyles.td}>{r.index}</td>
                  <td style={docStyles.td}>
                    <div style={docStyles.tdBold}>{r.name}</div>
                  </td>
                  {showHsn && <td style={docStyles.td}>{r.hsn}</td>}
                  <td style={{ ...docStyles.td, textAlign: 'center' }}>
                    {r.qty}{r.unit ? <span style={{ fontSize: '9px', color: '#94A3B8' }}> {r.unit}</span> : null}
                  </td>
                  {model.pricing && <td style={{ ...docStyles.td, textAlign: 'right' }}>₹{Number(r.price).toFixed(2)}</td>}
                  {model.pricing && showGst && (
                    <td style={{ ...docStyles.td, textAlign: 'right' }}>
                      {r.gstPct}%
                      <div style={{ fontSize: '9px', color: '#94A3B8' }}>₹{r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </td>
                  )}
                  {model.pricing && <td style={{ ...docStyles.td, ...docStyles.tdBold, textAlign: 'right' }}>₹{r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>}
                </tr>
              ))}
            </tbody>
            {model.pricing && (
              <tfoot>
                <tr>
                  <td colSpan={footerColSpan} style={docStyles.totalsLabel}>Sub Total</td>
                  <td style={docStyles.totalsValue}>₹{model.subTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
                {model.otherChargesTotal > 0 && (
                  <tr>
                    <td colSpan={footerColSpan} style={docStyles.totalsLabel}>Other Charges</td>
                    <td style={docStyles.totalsValue}>₹{model.otherChargesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '1.5px solid #0F172A' }}>
                  <td colSpan={footerColSpan} style={docStyles.grandTotalLabel}>Grand Total</td>
                  <td style={docStyles.grandTotalValue}>₹{model.grandTotal.toLocaleString('en-IN')}</td>
                </tr>
                {model.hasPayment && model.paidTotal > 0 && (
                  <>
                    <tr>
                      <td colSpan={footerColSpan} style={{ padding: '6px 5px', textAlign: 'right', fontWeight: '600', fontSize: '10.5px', color: '#16A34A' }}>Paid</td>
                      <td style={{ padding: '6px 5px', textAlign: 'right', fontWeight: '700', fontSize: '10.5px', color: '#16A34A' }}>₹{model.paidTotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={footerColSpan} style={{ ...docStyles.totalsLabel, fontWeight: '700', color: '#0F172A' }}>Balance Due</td>
                      <td style={{ ...docStyles.totalsValue, fontSize: '11.5px', fontWeight: '800' }}>₹{model.balanceDue.toLocaleString('en-IN')}</td>
                    </tr>
                  </>
                )}
              </tfoot>
            )}
          </table>
        </div>

        {/* Left column (closing text, QR, Payment Instructions) runs alongside the Signature on the right, both starting right after Grand Total */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', margin: '4px 0 18px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {model.otherInfo && (
              <p style={{ ...docStyles.bodyText, margin: '0 0 16px' }}>{model.otherInfo}</p>
            )}

            {model.closingText && (
              <p style={{ ...docStyles.closingText, margin: '0 0 18px' }}>{model.closingText}</p>
            )}

            {/* UPI / QR Code (Quotation only, when enabled) */}
            {showUpi && (
              <div style={{ textAlign: 'left', marginBottom: '18px' }}>
                {model.qrCodeImg && (
                  <img src={model.qrCodeImg} alt="UPI QR Code" style={{ width: '120px', height: '120px', objectFit: 'contain', background: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'block', marginRight: 'auto', imageRendering: 'pixelated' }} />
                )}
                {model.upiId && <p style={{ ...docStyles.addressLine, margin: '4px 0 0' }}>{model.upiId}</p>}
              </div>
            )}

            {/* Payment Instructions (bank info) */}
            {showBankInfo && (
              <div>
                <p style={{ ...docStyles.sectionLabel, textTransform: 'uppercase', margin: '0 0 6px' }}>Payment Instructions</p>
                {model.bankAccountName && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Account Holder Name: {model.bankAccountName}</p>}
                {model.bankAccountNumber && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Account Number: {model.bankAccountNumber}</p>}
                {model.bankName && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>Bank Name: {model.bankName}</p>}
                {model.ifscCode && <p style={{ ...docStyles.addressLine, margin: '0 0 2px' }}>IFSC Code: {model.ifscCode}</p>}
              </div>
            )}
          </div>

          {showSignature && !showReceivedBy && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={docStyles.signatureLabel}>For, {model.signatureName}</p>
              {model.signatureImg ? (
                <img src={model.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
              ) : (
                <div style={{ height: '34px' }}></div>
              )}
              <p style={docStyles.signatureCaption}>Authorized Signature</p>
            </div>
          )}
        </div>

        {/* Terms & Conditions */}
        {model.termsLines.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ ...docStyles.sectionLabel, textTransform: 'uppercase', margin: '0 0 6px' }}>Terms & Conditions:</p>
            {model.termsLines.map((term, idx) => (
              <p key={idx} style={{ ...docStyles.addressLine, margin: '0 0 4px' }}>{'\u2022'} {term}</p>
            ))}
          </div>
        )}

        {/* Payment History */}
        {model.hasPayment && model.paidInfo.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={docStyles.sectionLabel}>Payment History</p>
            {model.paidInfo.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{p.amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Received By (Delivery Note only) - Name/Date/Signature acknowledgement on the
            left, business's own Authorized Signature on the right, both at the very
            bottom, below Terms & Conditions / Payment Instructions / QR above. */}
        {showReceivedBy && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginTop: '6px', marginBottom: '18px' }}>
            <div style={{ flex: 1, maxWidth: '260px' }}>
              <p style={{ ...docStyles.sectionLabel, textTransform: 'none', margin: '0 0 14px' }}>Received By:</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                <span style={docStyles.addressLine}>Name:</span>
                <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                <span style={docStyles.addressLine}>Date:</span>
                <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={docStyles.addressLine}>Signature:</span>
                <span style={{ flex: 1, borderBottom: '1px solid #94A3B8', height: '1px' }} />
              </div>
            </div>
            {showSignature && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={docStyles.signatureLabel}>For, {model.signatureName}</p>
                {model.signatureImg ? (
                  <img src={model.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
                ) : (
                  <div style={{ height: '34px' }}></div>
                )}
                <p style={docStyles.signatureCaption}>Authorized Signature</p>
              </div>
            )}
          </div>
        )}

        {/* Generated with SmartManage - brand footer */}
        <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={smartpayLogo} alt="SmartManage" style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'cover', display: 'block' }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.2px' }}>Generated with SmartManage</span>
        </div>
      </>
    );
  };



  // (Duplicate/Edit/Status live purely in-app; Share hands the user a real .pdf file
  // through the OS share sheet, same pattern already used for worker statements above.)
  // Loads the app's own logo (bundled asset) as a base64 PNG so it can be embedded in
  // generated PDFs. Cached after first successful load; silently returns null on failure
  // so a missing/blocked asset never breaks document sharing.
  const appLogoDataUrlRef = useRef(null);
  const getAppLogoDataUrl = async () => {
    if (appLogoDataUrlRef.current) return appLogoDataUrlRef.current;
    try {
      const res = await fetch(smartpayLogo);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      appLogoDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch (e) {
      return null;
    }
  };

  // Renders a clean, professional business-document PDF: consistent typography hierarchy,
  // a bold-but-not-oversized Grand Total, and a small "Generated with SmartManage" brand
  // mark bottom-left — the same design system used across every module in the app.
  const shareGeneratedDocumentPdf = async ({ fileNameBase, title, docNo, date, lines }) => {
    const sanitizedFileName = `${(fileNameBase || title || 'Document').toString().trim().replace(/\s+/g, '_')}.pdf`;
    try {
      if (typeof jsPDF === 'undefined') throw new Error('jsPDF library not loaded');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomLimit = pageHeight - 60;
      let y = 56;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 56; }
      };

      // Business name (left) + document type (right), same visual weight, no single
      // element allowed to dominate the page.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor('#0F172A');
      doc.text(businessInfo?.businessName || 'Manufacturer', marginX, y);
      doc.setFontSize(12);
      doc.text((title || 'Document').toUpperCase(), pageWidth - marginX, y, { align: 'right' });
      y += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      if (businessInfo?.phone) { doc.text(businessInfo.phone, marginX, y); }
      if (docNo) { doc.text(`${title} #: ${docNo}`, pageWidth - marginX, y, { align: 'right' }); }
      y += 11;
      if (businessInfo?.email) { doc.text(businessInfo.email, marginX, y); }
      if (date) { doc.text(`Date: ${date}`, pageWidth - marginX, y, { align: 'right' }); }
      y += 16;

      doc.setDrawColor('#CBD5E1');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // Body lines. A line beginning with "Grand Total" or "Balance Due" is treated as a
      // totals row: right-aligned, bold, set off with its own rule so it reads as
      // important without the oversized type the old layout used.
      (lines || []).forEach((raw) => {
        const line = String(raw);
        const isTotalRow = /^(grand total|balance due)/i.test(line.trim());
        if (line.trim() === '') { ensureSpace(8); y += 8; return; }
        if (isTotalRow) {
          ensureSpace(24);
          const [label, ...rest] = line.split(':');
          const value = rest.join(':').trim();
          doc.setDrawColor('#0F172A');
          doc.setLineWidth(0.75);
          doc.line(pageWidth - marginX - 190, y - 9, pageWidth - marginX, y - 9);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor('#0F172A');
          doc.text(label.trim().toUpperCase(), pageWidth - marginX - 190, y + 4);
          doc.setFontSize(12.5);
          doc.text(value, pageWidth - marginX, y + 4, { align: 'right' });
          y += 22;
        } else {
          ensureSpace(15);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor('#334155');
          doc.text(line, marginX, y, { maxWidth: pageWidth - marginX * 2 });
          y += 15;
        }
      });

      drawBrandFooter();

      const dataUrl = doc.output('datauristring');
      const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
        window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
        return;
      }
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const writeResult = await Filesystem.writeFile({ path: sanitizedFileName, data: pdfBase64, directory: 'DOCUMENTS' });
        if (Share?.share) await Share.share({ title: sanitizedFileName, url: writeResult.uri });
        return;
      }

      // Web/browser fallback: use the native OS share sheet (Screenshot 2/3 behaviour) when available,
      // otherwise just download the PDF.
      if (navigator.share) {
        try {
          const blob = doc.output('blob');
          const file = new File([blob], sanitizedFileName, { type: 'application/pdf' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: sanitizedFileName });
            return;
          }
        } catch (shareErr) {
          // User cancelled the share sheet, or the browser refused - fall through to download.
        }
      }

      const ua = navigator.userAgent || '';
      const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
      if (isBareAndroidWebView) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        doc.save(sanitizedFileName);
      }
    } catch (err) {
      console.error('PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };

  // Bank Info: shares the business's saved bank/payment details as a .pdf through the
  // OS share sheet, using the exact same generic PDF renderer + share pattern as every
  // other document in the app (shareGeneratedDocumentPdf).
  const handleShareBankInfo = () => {
    const lines = [
      `Account Holder Name: ${businessInfo?.bankAccountName || '-'}`,
      `Account Number: ${businessInfo?.bankAccountNumber || '-'}`,
      `Bank Name: ${businessInfo?.bankName || '-'}`,
      `IFSC Code: ${businessInfo?.ifscCode || '-'}`,
    ];
    if (businessInfo?.upiId) lines.push(`UPI ID: ${businessInfo.upiId}`);
    shareGeneratedDocumentPdf({
      fileNameBase: `${businessInfo?.businessName || 'Bank'}_Bank_Info`,
      title: 'Bank Info',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      lines,
    });
  };

  // Dedicated Quotation PDF renderer - draws the SAME header/To-Date/table/totals/
  // terms/signature layout as the in-app "Quotation Detail" preview, built from the
  // exact same buildQuotationDocModel() data, so Share always matches what's on screen.
  const shareQuotationPdf = async (q) => {
    const sanitizedFileName = `Quotation_${q.quotationNo || ''}`.trim().replace(/\s+/g, '_') + '.pdf';
    try {
      if (typeof jsPDF === 'undefined') throw new Error('jsPDF library not loaded');
      const model = buildQuotationDocModel(q);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 50;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
      };

      // ---- Header: Quotation N (top, centered), then Manufacturer info below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#0F172A');
      doc.text(model.quotationTitle, pageWidth / 2, y, { align: 'center' });
      y += 22;

      if (model.logoImg) {
        try { doc.addImage(model.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
      }

      // Business name uses the same size/weight as the customer name below (10.5pt bold)
      // so the two read as visually uniform, matching the in-app document preview.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor('#0F172A');
      doc.text(model.businessName, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      let by = y + 14;
      if (model.businessPhone) { doc.text(model.businessPhone, marginX, by); by += 11; }
      if (model.businessEmail) { doc.text(model.businessEmail, marginX, by); by += 11; }

      y = Math.max(by + 10, model.logoImg ? y + 34 : 0);
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // ---- To, (left) | Date (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text('To,', marginX, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#0F172A');
      doc.text(`Date: ${model.date || ''}`, pageWidth - marginX, y, { align: 'right' });
      y += 13;

      model.customerLines.forEach((line, idx) => {
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10.5 : 8.5);
        doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
        doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
        y += idx === 0 ? 13 : 11;
      });
      y += 10;

      // ---- Shipping Address (only when enabled in Quotation Settings)
      if (model.showShippingAddress && model.shippingAddress) {
        ensureSpace(24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor('#64748B');
        doc.text('Shipping Address', marginX, y);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#64748B');
        const shipLines = doc.splitTextToSize(model.shippingAddress, contentWidth);
        doc.text(shipLines, marginX, y);
        y += shipLines.length * 11 + 8;
      }

      // ---- Greeting / intro line (skipped when empty)
      if (model.greetingLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#475569');
        model.greetingLines.forEach((line) => {
          doc.text(line, marginX, y);
          y += 13;
        });
        y += 7;
      }

      // ---- Item table
      // Columns are built dynamically so the HSN and GST columns can be omitted entirely
      // (rather than just left blank) when Quotation Settings has them turned off, with the
      // remaining columns proportionally widened to fill the page.
      const showHsn = model.showHsn !== false;
      const showGst = model.showGst !== false;
      const colDefs = [
        { key: 'idx', label: '#', pct: 0.06, align: 'left' },
        { key: 'item', label: 'Item', pct: 0.15, align: 'left' },
        ...(showHsn ? [{ key: 'hsn', label: model.hsnLabel, pct: 0.11, align: 'left' }] : []),
        { key: 'qty', label: 'Qty', pct: 0.13, align: 'center' },
        { key: 'price', label: 'Price', pct: 0.18, align: 'right' },
        ...(showGst ? [{ key: 'gst', label: 'GST', pct: 0.16, align: 'right' }] : []),
        { key: 'total', label: 'Total', pct: 0.21, align: 'right' },
      ];
      const pctSum = colDefs.reduce((s, c) => s + c.pct, 0);
      const colWidths = colDefs.map((c) => (c.pct / pctSum) * contentWidth);
      const colX = [marginX];
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);
      const headers = colDefs.map((c) => c.label);
      const aligns = colDefs.map((c) => c.align);
      const colIndex = {};
      colDefs.forEach((c, i) => { colIndex[c.key] = i; });

      ensureSpace(24);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(1);
      doc.line(marginX, y - 9, pageWidth - marginX, y - 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#475569');
      headers.forEach((h, i) => {
        const align = aligns[i];
        const tx = align === 'right' ? colX[i] + colWidths[i] : align === 'center' ? colX[i] + colWidths[i] / 2 : colX[i];
        doc.text(h.toUpperCase(), tx, y, { align });
      });
      y += 4;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 13;

      model.rows.forEach((r) => {
        const nameLines = doc.splitTextToSize(String(r.name || ''), colWidths[colIndex.item] - 4);
        // When the GST column is shown, each row draws a small sub-line (the GST amount,
        // e.g. "Rs.33,600") 9pt below the main row baseline. rowH must account for that
        // sub-line's full height, or the divider line below gets drawn too early and
        // overlaps/"cuts" into the row's own text instead of sitting cleanly beneath it.
        const mainRowH = Math.max(13, nameLines.length * 10 + 3);
        const rowH = showGst ? Math.max(mainRowH, 9 + 10) : mainRowH;
        ensureSpace(rowH + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#334155');
        doc.text(String(r.index), colX[colIndex.idx], y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(nameLines, colX[colIndex.item], y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#334155');
        if (showHsn) doc.text(String(r.hsn), colX[colIndex.hsn], y);
        doc.text(`${r.qty}${r.unit ? ' ' + r.unit : ''}`, colX[colIndex.qty] + colWidths[colIndex.qty] / 2, y, { align: 'center' });
        doc.text(`Rs.${Number(r.price).toFixed(2)}`, colX[colIndex.price] + colWidths[colIndex.price], y, { align: 'right' });
        if (showGst) {
          doc.text(`${r.gstPct}%`, colX[colIndex.gst] + colWidths[colIndex.gst], y, { align: 'right' });
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          doc.text(`Rs.${r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[colIndex.gst] + colWidths[colIndex.gst], y + 9, { align: 'right' });
          doc.setFontSize(9);
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(`Rs.${r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[colIndex.total] + colWidths[colIndex.total], y, { align: 'right' });
        y += rowH + 6;
        doc.setDrawColor('#EEF1F5');
        doc.setLineWidth(0.5);
        doc.line(marginX, y - 4, pageWidth - marginX, y - 4);
      });
      y += 8;

      // ---- Sub Total / Other Charges / Grand Total
      const totalLabelX = pageWidth - marginX - 190;
      ensureSpace(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#64748B');
      doc.text('Sub Total', totalLabelX, y, { align: 'left' });
      doc.setTextColor('#334155');
      doc.text(`Rs.${model.subTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 15;

      if (model.otherChargesTotal > 0) {
        ensureSpace(18);
        doc.setTextColor('#64748B');
        doc.text('Other Charges', totalLabelX, y, { align: 'left' });
        doc.setTextColor('#334155');
        doc.text(`Rs.${model.otherChargesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
        y += 15;
      }
      y -= 3;

      ensureSpace(28);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(0.75);
      doc.line(totalLabelX, y, pageWidth - marginX, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#0F172A');
      doc.text('Grand Total', totalLabelX, y, { align: 'left' });
      doc.setFontSize(12.5);
      doc.text(`Rs.${model.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 26;

      // ---- Left column (closing text, QR, Payment Instructions) runs alongside the Signature
      // column on the right - both start at the same Y, right after Grand Total.
      const rowStartY = y;
      let leftY = rowStartY;

      if (model.closingText) {
        ensureSpace(15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        doc.text(model.closingText, marginX, leftY, { maxWidth: contentWidth * 0.55 });
        leftY += 22;
      }

      const hasBankFields = model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode;
      const hasUpiFields = model.upiId || model.qrCodeImg;
      if (model.showUpi && hasUpiFields) {
        ensureSpace(120);
        const qrSize = 96; // enlarged so the code stays sharp and easy to scan
        if (model.qrCodeImg) {
          try {
            doc.addImage(model.qrCodeImg, marginX, leftY, qrSize, qrSize);
          } catch (e) { /* ignore */ }
        }
        let upiBottomY = leftY + qrSize;
        if (model.upiId) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor('#475569');
          doc.text(model.upiId, marginX, upiBottomY + 10);
          upiBottomY += 14;
        }
        leftY = upiBottomY + 12;
      }

      if (model.showBankInfo && hasBankFields) {
        ensureSpace(60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('PAYMENT INSTRUCTIONS', marginX, leftY);
        leftY += 13;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#475569');
        const bankLines = [
          model.bankAccountName && `Account Holder Name: ${model.bankAccountName}`,
          model.bankAccountNumber && `Account Number: ${model.bankAccountNumber}`,
          model.bankName && `Bank Name: ${model.bankName}`,
          model.ifscCode && `IFSC Code: ${model.ifscCode}`,
        ].filter(Boolean);
        bankLines.forEach((line) => { doc.text(line, marginX, leftY); leftY += 11; });
        leftY += 10;
      }

      // ---- Signature block (right column, only when enabled in Quotation Settings)
      let sigY = rowStartY;
      if (model.showSignature) {
        ensureSpace(46);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${model.signatureName}`, pageWidth - marginX, sigY, { align: 'right' });
        if (model.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(model.signatureImg, pageWidth - marginX - sigW, sigY + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        sigY += 34;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, sigY, { align: 'right' });
        sigY += 8;
      }

      y = Math.max(leftY, sigY) + 8;

      // ---- Terms & Conditions (Quotation-specific only) - full width, below the row above
      if (model.termsLines.length > 0) {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('TERMS & CONDITIONS:', marginX, y);
        y += 13;
        model.termsLines.forEach((term) => {
          const lines = doc.splitTextToSize(`\u2022 ${term}`, contentWidth);
          ensureSpace(lines.length * 12 + 2);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor('#475569');
          doc.text(lines, marginX, y);
          y += lines.length * 12 + 2;
        });
        y += 10;
      }

      drawBrandFooter();

      const dataUrl = doc.output('datauristring');
      const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
        window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
        return;
      }
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const writeResult = await Filesystem.writeFile({ path: sanitizedFileName, data: pdfBase64, directory: 'DOCUMENTS' });
        if (Share?.share) await Share.share({ title: sanitizedFileName, url: writeResult.uri });
        return;
      }
      if (navigator.share) {
        try {
          const blob = doc.output('blob');
          const file = new File([blob], sanitizedFileName, { type: 'application/pdf' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: sanitizedFileName });
            return;
          }
        } catch (shareErr) {
          // User cancelled the share sheet, or the browser refused - fall through to download.
        }
      }
      const ua = navigator.userAgent || '';
      const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
      if (isBareAndroidWebView) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        doc.save(sanitizedFileName);
      }
    } catch (err) {
      console.error('Quotation PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };

  // Generic PDF renderer shared by Invoice / Purchase Order / Proforma Invoice / Delivery
  // Note — draws the exact same header/logo, To-Date, greeting, table, totals, other info,
  // closing text, terms, and signature/signature-image layout as shareQuotationPdf, driven
  // entirely by a model built from buildDocModel, so every document's Share PDF always
  // matches its in-app preview.
  const shareStandardDocumentPdf = async (model, fileNameBase) => {
    const sanitizedFileName = `${(fileNameBase || model.docTitle || 'Document').toString().trim().replace(/\s+/g, '_')}.pdf`;
    try {
      if (typeof jsPDF === 'undefined') throw new Error('jsPDF library not loaded');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 50;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
      };

      // ---- Header: Doc title (top, centered), then Business info + logo below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#0F172A');
      doc.text(model.docTitle, pageWidth / 2, y, { align: 'center' });
      y += 22;

      if (model.logoImg) {
        try { doc.addImage(model.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
      }

      // Business name uses the same size/weight as the customer name below (10.5pt bold)
      // so the two read as visually uniform, matching the in-app document preview.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor('#0F172A');
      doc.text(model.businessName, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      let by = y + 14;
      if (model.businessPhone) { doc.text(model.businessPhone, marginX, by); by += 11; }
      if (model.businessEmail) { doc.text(model.businessEmail, marginX, by); by += 11; }

      y = Math.max(by + 10, model.logoImg ? y + 34 : 0);
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // ---- To, (left) | Date (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text(model.toLabel || 'To,', marginX, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#0F172A');
      doc.text(`Date: ${model.date || ''}`, pageWidth - marginX, y, { align: 'right' });
      y += 13;

      model.customerLines.forEach((line, idx) => {
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10.5 : 8.5);
        doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
        doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
        y += idx === 0 ? 13 : 11;
      });
      y += 10;

      // ---- Greeting / intro lines (type-specific, skipped when empty)
      if (model.greetingLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#475569');
        model.greetingLines.forEach((line) => {
          doc.text(line, marginX, y);
          y += 13;
        });
        y += 7;
      }

      // ---- Item table (pricing/HSN/GST columns only when this doc type/its Settings enable them).
      // Column set is built dynamically so hidden columns (e.g. HSN or GST when a document's
      // Settings screen has them off) free up their space rather than leaving a gap.
      const showHsnCol = model.showHsn !== false;
      const showGstCol = model.pricing && model.showGst !== false;
      const cols = [
        { key: 'index', label: '#', pct: model.pricing ? 0.06 : 0.10, align: 'left' },
        { key: 'item', label: 'Item', pct: model.pricing ? 0.15 : 0.30, align: 'left' },
        ...(showHsnCol ? [{ key: 'hsn', label: model.hsnLabel, pct: model.pricing ? 0.11 : 0.23, align: 'left' }] : []),
        { key: 'qty', label: 'Qty', pct: model.pricing ? 0.13 : 0.25, align: 'center' },
        ...(model.pricing ? [{ key: 'price', label: 'Price', pct: 0.18, align: 'right' }] : []),
        ...(showGstCol ? [{ key: 'gst', label: 'GST', pct: 0.16, align: 'right' }] : []),
        ...(model.pricing ? [{ key: 'total', label: 'Total', pct: 0.21, align: 'right' }] : []),
      ];
      const pctSum = cols.reduce((sum, c) => sum + c.pct, 0) || 1;
      const colWidths = cols.map((c) => (c.pct / pctSum) * contentWidth);
      const colX = [marginX];
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);
      const colIndex = (key) => cols.findIndex((c) => c.key === key);
      const itemColIdx = colIndex('item');

      ensureSpace(24);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(1);
      doc.line(marginX, y - 9, pageWidth - marginX, y - 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#475569');
      cols.forEach((c, i) => {
        const tx = c.align === 'right' ? colX[i] + colWidths[i] : c.align === 'center' ? colX[i] + colWidths[i] / 2 : colX[i];
        doc.text(String(c.label).toUpperCase(), tx, y, { align: c.align });
      });
      y += 4;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 13;

      model.rows.forEach((r) => {
        const nameLines = doc.splitTextToSize(String(r.name || ''), colWidths[itemColIdx] - 4);
        // When the GST column is shown, each row draws a small sub-line (the GST amount,
        // e.g. "Rs.33,600") 9pt below the main row baseline. rowH must account for that
        // sub-line's full height, or the divider line below gets drawn too early and
        // overlaps/"cuts" into the row's own text instead of sitting cleanly beneath it.
        const mainRowH = Math.max(13, nameLines.length * 10 + 3);
        const rowH = showGstCol ? Math.max(mainRowH, 9 + 10) : mainRowH;
        ensureSpace(rowH + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#334155');
        doc.text(String(r.index), colX[colIndex('index')], y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(nameLines, colX[itemColIdx], y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#334155');
        if (showHsnCol) doc.text(String(r.hsn), colX[colIndex('hsn')], y);
        const qtyIdx = colIndex('qty');
        doc.text(`${r.qty}${r.unit ? ' ' + r.unit : ''}`, colX[qtyIdx] + colWidths[qtyIdx] / 2, y, { align: 'center' });
        if (model.pricing) {
          const priceIdx = colIndex('price');
          doc.text(`Rs.${Number(r.price).toFixed(2)}`, colX[priceIdx] + colWidths[priceIdx], y, { align: 'right' });
          if (showGstCol) {
            const gstIdx = colIndex('gst');
            doc.text(`${r.gstPct}%`, colX[gstIdx] + colWidths[gstIdx], y, { align: 'right' });
            doc.setFontSize(7.5);
            doc.setTextColor('#94A3B8');
            doc.text(`Rs.${r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[gstIdx] + colWidths[gstIdx], y + 9, { align: 'right' });
            doc.setFontSize(9);
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#0F172A');
          const totalIdx = colIndex('total');
          doc.text(`Rs.${r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[totalIdx] + colWidths[totalIdx], y, { align: 'right' });
        }
        y += rowH + 6;
        doc.setDrawColor('#EEF1F5');
        doc.setLineWidth(0.5);
        doc.line(marginX, y - 4, pageWidth - marginX, y - 4);
      });
      y += 8;

      // ---- Sub Total / Other Charges / Grand Total (+ Paid / Balance Due when applicable)
      if (model.pricing) {
        const totalLabelX = pageWidth - marginX - 190;
        ensureSpace(18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        doc.text('Sub Total', totalLabelX, y, { align: 'left' });
        doc.setTextColor('#334155');
        doc.text(`Rs.${model.subTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
        y += 15;

        if (model.otherChargesTotal > 0) {
          ensureSpace(18);
          doc.setTextColor('#64748B');
          doc.text('Other Charges', totalLabelX, y, { align: 'left' });
          doc.setTextColor('#334155');
          doc.text(`Rs.${model.otherChargesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
          y += 15;
        }
        y -= 3;

        ensureSpace(28);
        doc.setDrawColor('#0F172A');
        doc.setLineWidth(0.75);
        doc.line(totalLabelX, y, pageWidth - marginX, y);
        y += 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor('#0F172A');
        doc.text('Grand Total', totalLabelX, y, { align: 'left' });
        doc.setFontSize(12.5);
        doc.text(`Rs.${model.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
        y += 26;

        if (model.hasPayment && model.paidTotal > 0) {
          ensureSpace(30);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor('#16A34A');
          doc.text('Paid', totalLabelX, y, { align: 'left' });
          doc.text(`Rs.${model.paidTotal.toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
          y += 15;
          doc.setTextColor('#0F172A');
          doc.text('Balance Due', totalLabelX, y, { align: 'left' });
          doc.setFontSize(11);
          doc.text(`Rs.${model.balanceDue.toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
          y += 22;
        }
      }

      // ---- Left column (Other Info, Closing Text) runs alongside the Signature column on the
      // right - both start at the same Y, right after Grand Total.
      const rowStartY = y;
      let leftY = rowStartY;

      if (model.otherInfo) {
        ensureSpace(15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        const lines = doc.splitTextToSize(model.otherInfo, contentWidth * 0.55);
        doc.text(lines, marginX, leftY);
        leftY += lines.length * 13 + 8;
      }

      if (model.closingText) {
        ensureSpace(15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        doc.text(model.closingText, marginX, leftY, { maxWidth: contentWidth * 0.55 });
        leftY += 22;
      }

      // ---- UPI / QR Code (only shown when enabled in this document type's Settings)
      const hasBankFields = model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode;
      const hasUpiFields = model.upiId || model.qrCodeImg;
      if (model.showUpi && hasUpiFields) {
        ensureSpace(120);
        const qrSize = 96; // enlarged so the code stays sharp and easy to scan
        if (model.qrCodeImg) {
          try {
            doc.addImage(model.qrCodeImg, marginX, leftY, qrSize, qrSize);
          } catch (e) { /* ignore */ }
        }
        let upiBottomY = leftY + qrSize;
        if (model.upiId) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor('#475569');
          doc.text(model.upiId, marginX, upiBottomY + 10);
          upiBottomY += 14;
        }
        leftY = upiBottomY + 12;
      }

      // ---- Payment Instructions (bank info, only shown when enabled in this document type's Settings)
      if (model.showBankInfo && hasBankFields) {
        ensureSpace(60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('PAYMENT INSTRUCTIONS', marginX, leftY);
        leftY += 13;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#475569');
        const bankLines = [
          model.bankAccountName && `Account Holder Name: ${model.bankAccountName}`,
          model.bankAccountNumber && `Account Number: ${model.bankAccountNumber}`,
          model.bankName && `Bank Name: ${model.bankName}`,
          model.ifscCode && `IFSC Code: ${model.ifscCode}`,
        ].filter(Boolean);
        bankLines.forEach((line) => { doc.text(line, marginX, leftY); leftY += 11; });
        leftY += 10;
      }

      // ---- Signature block (right column, only when enabled in this document type's Settings).
      // Skipped here for Delivery Note (showReceivedBy) - drawn instead alongside the
      // "Received By" acknowledgement block after Terms & Conditions, below.
      let sigY = rowStartY;
      if (model.showSignature && !model.showReceivedBy) {
        ensureSpace(46);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${model.signatureName}`, pageWidth - marginX, sigY, { align: 'right' });
        if (model.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(model.signatureImg, pageWidth - marginX - sigW, sigY + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        sigY += 34;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, sigY, { align: 'right' });
        sigY += 8;
      }

      y = Math.max(leftY, sigY) + 8;

      // ---- Terms & Conditions - full width, below the row above
      if (model.termsLines.length > 0) {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('TERMS & CONDITIONS:', marginX, y);
        y += 13;
        model.termsLines.forEach((term) => {
          const lines = doc.splitTextToSize(`\u2022 ${term}`, contentWidth);
          ensureSpace(lines.length * 12 + 2);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor('#475569');
          doc.text(lines, marginX, y);
          y += lines.length * 12 + 2;
        });
        y += 10;
      }

      // ---- Payment History - full width, below the row above
      if (model.hasPayment && model.paidInfo.length > 0) {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('PAYMENT HISTORY:', marginX, y);
        y += 13;
        model.paidInfo.forEach((p) => {
          ensureSpace(13);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor('#475569');
          doc.text(`${p.date}${p.note ? ' — ' + p.note : ''}`, marginX, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#0F172A');
          doc.text(`Rs.${p.amount}`, pageWidth - marginX, y, { align: 'right' });
          y += 13;
        });
        y += 8;
      }

      // ---- Received By (Delivery Note only) - Name/Date/Signature acknowledgement on the
      // left, business's own Authorized Signature on the right, both at the very bottom,
      // below Terms & Conditions / Payment Instructions / QR above.
      if (model.showReceivedBy) {
        ensureSpace(90);
        const rbStartY = y;
        let rbY = rbStartY;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('Received By:', marginX, rbY);
        rbY += 22;
        const rbFieldWidth = contentWidth * 0.55;
        const rbLabelGap = 10;
        const drawBlankField = (label) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor('#475569');
          doc.text(label, marginX, rbY);
          const labelWidth = doc.getTextWidth(label);
          doc.setDrawColor('#94A3B8');
          doc.setLineWidth(0.6);
          doc.line(marginX + labelWidth + rbLabelGap, rbY, marginX + rbFieldWidth, rbY);
          rbY += 26;
        };
        drawBlankField('Name:');
        drawBlankField('Date:');
        drawBlankField('Signature:');

        let rbSigY = rbStartY;
        if (model.showSignature) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor('#0F172A');
          doc.text(`For, ${model.signatureName}`, pageWidth - marginX, rbSigY, { align: 'right' });
          if (model.signatureImg) {
            try {
              const sigW = 90, sigH = 30;
              doc.addImage(model.signatureImg, pageWidth - marginX - sigW, rbSigY + 4, sigW, sigH);
            } catch (e) { /* ignore */ }
          }
          rbSigY += 34;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, rbSigY, { align: 'right' });
          rbSigY += 8;
        }
        y = Math.max(rbY, rbSigY) + 8;
      }

      drawBrandFooter();

      const dataUrl = doc.output('datauristring');
      const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
        window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
        return;
      }
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const writeResult = await Filesystem.writeFile({ path: sanitizedFileName, data: pdfBase64, directory: 'DOCUMENTS' });
        if (Share?.share) await Share.share({ title: sanitizedFileName, url: writeResult.uri });
        return;
      }
      if (navigator.share) {
        try {
          const blob = doc.output('blob');
          const file = new File([blob], sanitizedFileName, { type: 'application/pdf' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: sanitizedFileName });
            return;
          }
        } catch (shareErr) {
          // User cancelled the share sheet, or the browser refused - fall through to download.
        }
      }
      const ua = navigator.userAgent || '';
      const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
      if (isBareAndroidWebView) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        doc.save(sanitizedFileName);
      }
    } catch (err) {
      console.error('Document PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };

  const productLineSummary = (p) => `${p.name} x${p.qty}${p.unit ? ' ' + p.unit : ''} - Rs.${Math.round((p.price || 0) * (p.qty || 0) * (1 + (p.gst || 0) / 100)).toLocaleString('en-IN')}`;

  // ----- Quotation: Duplicate / Edit / Status / Share -----
  const openEditQuotation = (q) => {
    setEditingQuotationId(q.id);
    setQuotationForm({
      date: q.date, quotationNo: q.quotationNo, otherInfo: q.otherInfo || '',
      customerId: q.customerId, products: q.products || [], otherCharges: q.otherCharges || [], termsIds: q.termsIds || [],
    });
    setQuotationSubView('makeQuotation');
  };
  const handleDuplicateQuotation = async (q) => {
    if (!loggedInUser?.userId) {
      showAlert('You need to be signed in to duplicate a quotation.');
      return;
    }
    const { id, createdAt, updatedAt, status, ...rest } = q;
    // A duplicate is a brand-new document created right now, so it picks up current
    // Business Info / Quotation Settings at the moment of duplication (like any other new
    // document) rather than inheriting the original's frozen docSnapshot.
    const payload = { ...rest, quotationNo: getNextQuotationNumber(), date: formatQuotationDate(new Date()), docSnapshot: buildDocSettingsSnapshot(quotationSettings) };
    try {
      const created = await documentService.createQuotation(loggedInUser.userId, payload);
      persistQuotations([...quotations, created]);
      showSuccess('Quotation duplicated successfully.');
      setQuotationSubView('quotationList');
    } catch (error) {
      console.error('Error duplicating quotation:', error);
      showAlert('Could not duplicate the quotation on the server. Please try again.');
    }
  };
 const handleSetQuotationStatus = async (status) => {
  const previous = quotations;
  persistQuotations(quotations.map((q) => (q.id === selectedQuotationId ? { ...q, status } : q)));
  setShowQuotationStatusSheet(false);
  setShowQuotationMoreSheet(false);
  try {
    await documentService.updateQuotationStatus(selectedQuotationId, status);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    persistQuotations(previous);
    showAlert('Could not update the quotation status. Please try again.');
  }
};
  const handleShareQuotation = (q) => {
    shareQuotationPdf(q);
  };

  // ----- Purchase Order: Duplicate / Edit / Status / Share -----
 const openEditPurchaseOrder = (o) => {
  setEditingPurchaseOrderId(o.id);
  setPurchaseOrderForm({
    date: o.date, 
    purchaseOrderNo: o.purchaseOrderNo, 
    otherInfo: o.otherInfo || '',
    customerId: o.customerId, 
    products: o.products || [], 
    otherCharges: o.otherCharges || [], 
    termsIds: o.termsIds || [],
  });
  setQuotationSubView('makePurchaseOrder');
};
  const handleDuplicatePurchaseOrder = async (o) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a purchase order.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = o;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Purchase Order Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    purchaseOrderNo: getNextPurchaseOrderNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: buildDocSettingsSnapshot(purchaseOrderSettings),
  };
  try {
    const created = await purchaseOrdersService.createPurchaseOrder(loggedInUser.userId, payload);
    persistPurchaseOrders([...purchaseOrders, created]);
    showSuccess('Purchase Order duplicated successfully.');
    setQuotationSubView('purchaseOrderList');
  } catch (error) {
    console.error('Error duplicating purchase order:', error);
    showAlert('Could not duplicate the purchase order. Please try again.');
  }
};
  const handleSharePurchaseOrder = (o) => {
    shareStandardDocumentPdf(buildPurchaseOrderDocModel(o), `PurchaseOrder_${o.purchaseOrderNo || ''}`);
  };

  // ----- Proforma Invoice: Duplicate / Edit / Status / Share -----
  const openEditProformaInvoice = (inv) => {
  setEditingProformaInvoiceId(inv.id);
  setProformaInvoiceForm({
    date: inv.date, 
    proformaInvoiceNo: inv.proformaInvoiceNo, 
    dueDate: inv.dueDate || '', 
    poNo: inv.poNo || '', 
    otherInfo: inv.otherInfo || '',
    customerId: inv.customerId, 
    products: inv.products || [], 
    otherCharges: inv.otherCharges || [], 
    termsIds: inv.termsIds || [], 
    paidInfo: inv.paidInfo || [],
  });
  setQuotationSubView('makeProformaInvoice');
};
  const handleDuplicateProformaInvoice = async (inv) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a proforma invoice.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = inv;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Proforma Invoice Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    proformaInvoiceNo: getNextProformaInvoiceNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: buildDocSettingsSnapshot(proformaInvoiceSettings),
  };
  try {
    const created = await proformaInvoicesService.createProformaInvoice(loggedInUser.userId, payload);
    persistProformaInvoices([...proformaInvoices, created]);
    showSuccess('Proforma Invoice duplicated successfully.');
    setQuotationSubView('proformaInvoiceList');
  } catch (error) {
    console.error('Error duplicating proforma invoice:', error);
    showAlert('Could not duplicate the proforma invoice. Please try again.');
  }
};
  const handleSetProformaInvoiceStatus = async (status) => {
  const previous = proformaInvoices;
  persistProformaInvoices(proformaInvoices.map((inv) => (inv.id === selectedProformaInvoiceId ? { ...inv, status } : inv)));
  setShowProformaInvoiceStatusSheet(false);
  setShowProformaInvoiceMoreSheet(false);
  try {
    await proformaInvoicesService.updateProformaInvoiceStatus(selectedProformaInvoiceId, status);
  } catch (error) {
    console.error('Error updating proforma invoice status:', error);
    persistProformaInvoices(previous);
    showAlert('Could not update the proforma invoice status. Please try again.');
  }
};
  const handleShareProformaInvoice = (inv) => {
    shareStandardDocumentPdf(buildProformaInvoiceDocModel(inv), `ProformaInvoice_${inv.proformaInvoiceNo || ''}`);
  };

  // ----- Delivery Note: Duplicate / Edit / Status / Share -----
  const openEditDeliveryNote = (dn) => {
  setEditingDeliveryNoteId(dn.id);
  setDeliveryNoteForm({
    date: dn.date, 
    deliveryNoteNo: dn.deliveryNoteNo, 
    refNo: dn.refNo || '', 
    otherInfo: dn.otherInfo || '',
    customerId: dn.customerId, 
    products: dn.products || [], 
    termsIds: dn.termsIds || [],
  });
  setQuotationSubView('makeDeliveryNote');
};
  const handleDuplicateDeliveryNote = async (dn) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a delivery note.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = dn;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Delivery Note Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    deliveryNoteNo: getNextDeliveryNoteNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: buildDocSettingsSnapshot(deliveryNoteSettings),
  };
  try {
    const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
    persistDeliveryNotes([...deliveryNotes, created]);
    showSuccess('Delivery Note duplicated successfully.');
    setQuotationSubView('deliveryNoteList');
  } catch (error) {
    console.error('Error duplicating delivery note:', error);
    showAlert('Could not duplicate the delivery note. Please try again.');
  }
};
  const handleShareDeliveryNote = (dn) => {
    shareStandardDocumentPdf(buildDeliveryNoteDocModel(dn), `DeliveryNote_${dn.deliveryNoteNo || ''}`);
  };

  // ----- Invoice: Duplicate / Edit / Status / Share -----
  const openEditInvoice = (inv) => {
    setEditingInvoiceId(inv.id);
    setInvoiceForm({
      date: inv.date, invoiceNo: inv.invoiceNo, dueDate: inv.dueDate || '', poNo: inv.poNo || '', otherInfo: inv.otherInfo || '',
      customerId: inv.customerId, products: inv.products || [], otherCharges: inv.otherCharges || [], termsIds: inv.termsIds || [], paidInfo: inv.paidInfo || [],
    });
    setQuotationSubView('makeInvoice');
  };
  const handleDuplicateInvoice = async (inv) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate an invoice.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = inv;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Invoice Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    invoiceNo: getNextInvoiceNumber(), 
    date: formatQuotationDate(new Date()),
    status: 'Unpaid', // Duplicated invoices start fresh as Unpaid, regardless of the original's status.
    docSnapshot: buildDocSettingsSnapshot(invoiceSettings),
  };
  try {
    const created = await invoicesService.createInvoice(loggedInUser.userId, payload);
    persistInvoices([...invoices, created]);
    showSuccess('Invoice duplicated successfully.');
    setQuotationSubView('invoiceList');
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    showAlert('Could not duplicate the invoice. Please try again.');
  }
};
  const handleSetInvoiceStatus = async (status) => {
  const previous = invoices;
  persistInvoices(invoices.map((inv) => (inv.id === selectedInvoiceId ? { ...inv, status } : inv)));
  setShowInvoiceStatusSheet(false);
  setShowInvoiceMoreSheet(false);
  try {
    await invoicesService.updateInvoiceStatus(selectedInvoiceId, status);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    persistInvoices(previous);
    showAlert('Could not update the invoice status. Please try again.');
  }
};
  const handleShareInvoice = (inv) => {
    shareStandardDocumentPdf(buildInvoiceDocModel(inv), `Invoice_${inv.invoiceNo || ''}`);
  };

  // ----- Receipt: Duplicate / Edit / Status / Share -----
  const openEditReceipt = (r) => {
  setEditingReceiptId(r.id);
  setReceiptForm({
    date: r.date, 
    receiptNo: r.receiptNo, 
    customerId: r.customerId,
    paymentMode: r.paymentMode || '', 
    referenceNo: r.referenceNo || '', 
    paidAmount: r.paidAmount != null ? String(r.paidAmount) : '', 
    paymentFor: r.paymentFor || '',
  });
  setQuotationSubView('makeReceipt');
};
  const handleDuplicateReceipt = async (r) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a receipt.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = r;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Receipt Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    receiptNo: getNextReceiptNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: buildDocSettingsSnapshot(receiptSettings),
  };
  try {
    const created = await receiptsService.createReceipt(loggedInUser.userId, payload);
    persistReceipts([...receipts, created]);
    showSuccess('Receipt duplicated successfully.');
    setQuotationSubView('receiptList');
  } catch (error) {
    console.error('Error duplicating receipt:', error);
    showAlert('Could not duplicate the receipt. Please try again.');
  }
};
  // Receipt PDF — draws the exact same header/logo, To-Date, and signature layout as
  // shareStandardDocumentPdf (Quotation/Invoice/etc.) so the Receipt PDF matches every
  // other document type instead of using its own one-off layout. The item table is
  // replaced with a Payment Details block, and the signature is always the business
  // (not the customer), matching the in-app Receipt Detail preview.
  const shareReceiptPdf = async (r) => {
    const sanitizedFileName = `${(`Receipt_${r.receiptNo || ''}`).toString().trim().replace(/\s+/g, '_')}.pdf`;
    // Frozen Business Info / Receipt Settings from when this receipt was created or
    // last edited-and-updated; falls back to live values only for receipts saved
    // before this snapshot existed.
    const snap = r.docSnapshot || buildDocSettingsSnapshot(receiptSettings);
    try {
      if (typeof jsPDF === 'undefined') throw new Error('jsPDF library not loaded');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 50;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
      };

      // ---- Header: Receipt # (top, centered), then Business info + logo below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#0F172A');
      doc.text('Receipt', pageWidth / 2, y, { align: 'center' });
      y += 22;

      if (snap.logoImg) {
        try { doc.addImage(snap.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor('#0F172A');
      doc.text(snap.businessName || 'Manufacturer', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      let by = y + 14;
      if (snap.businessPhone) { doc.text(snap.businessPhone, marginX, by); by += 11; }
      if (snap.businessEmail) { doc.text(snap.businessEmail, marginX, by); by += 11; }

      y = Math.max(by + 10, snap.logoImg ? y + 34 : 0);
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // ---- To, (left) | Date (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text('To,', marginX, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#0F172A');
      doc.text(`Date: ${r.date || ''}`, pageWidth - marginX, y, { align: 'right' });
      y += 13;

      const customerLines = buildCustomerLines(r);
      customerLines.forEach((line, idx) => {
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10.5 : 8.5);
        doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
        doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
        y += idx === 0 ? 13 : 11;
      });
      y += 14;

      // ---- Payment Details
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#0F172A');
      doc.text('PAYMENT DETAILS', marginX, y);
      y += 6;
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(1);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 17;

      const paymentRows = [
        ['Payment Mode', r.paymentMode || '-'],
        ['Reference No', r.referenceNo || '-'],
        ['Payment For', r.paymentFor || '-'],
      ];
      paymentRows.forEach(([label, value]) => {
        ensureSpace(17);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        doc.text(label, marginX, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(String(value), pageWidth - marginX, y, { align: 'right' });
        y += 13;
        doc.setDrawColor('#EEF1F5');
        doc.setLineWidth(0.5);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 12;
      });
      y += 4;

      // ---- Total Paid
      const totalLabelX = pageWidth - marginX - 190;
      ensureSpace(28);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(0.75);
      doc.line(totalLabelX, y, pageWidth - marginX, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#0F172A');
      doc.text('Total Paid', totalLabelX, y, { align: 'left' });
      doc.setFontSize(12.5);
      doc.text(`Rs.${Number(r.paidAmount || 0).toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
      y += 34;

      // ---- Signature block (only when Receipt Settings has "Signature Display" set to Yes)
      if (snap.showSignature !== 'No') {
        ensureSpace(46);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${snap.businessName || 'Manufacturer'}`, pageWidth - marginX, y, { align: 'right' });
        if (snap.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(snap.signatureImg, pageWidth - marginX - sigW, y + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        y += 34;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, y, { align: 'right' });
      }

      drawBrandFooter();

      const dataUrl = doc.output('datauristring');
      const pdfBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      if (window.AndroidFileSaver && typeof window.AndroidFileSaver.saveBase64Pdf === 'function') {
        window.AndroidFileSaver.saveBase64Pdf(pdfBase64, sanitizedFileName);
        return;
      }
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const writeResult = await Filesystem.writeFile({ path: sanitizedFileName, data: pdfBase64, directory: 'DOCUMENTS' });
        if (Share?.share) await Share.share({ title: sanitizedFileName, url: writeResult.uri });
        return;
      }
      if (navigator.share) {
        try {
          const blob = doc.output('blob');
          const file = new File([blob], sanitizedFileName, { type: 'application/pdf' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: sanitizedFileName });
            return;
          }
        } catch (shareErr) {
          // User cancelled the share sheet, or the browser refused - fall through to download.
        }
      }
      const ua = navigator.userAgent || '';
      const isBareAndroidWebView = /Android/.test(ua) && /; wv\)/.test(ua);
      if (isBareAndroidWebView) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        doc.save(sanitizedFileName);
      }
    } catch (err) {
      console.error('Receipt PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };
  const handleShareReceipt = (r) => {
    shareReceiptPdf(r);
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
    // Quotations module: hardware back closes an open sheet/picker before stepping out of a sub-screen.
    if (showStatePicker) { setShowStatePicker(false); return true; }
    // Quotations module: hardware back steps out of a sub-screen before leaving the module.
    if (activeModule === 'quotations' && quotationSubView !== null) {
      setQuotationSubView(null);
      return true;
    }
    // Any module's first/top-level page: hardware back returns to the Main page.
    if (activeModule !== null) {
      setActiveModule(null);
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

  // Set to true right before an intentional reload/navigation (e.g. sign out) so the
  // "Do you want to exit?" / Confirm Navigation prompt doesn't appear on that reload.
  const isIntentionalReloadRef = useRef(false);

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
      if (isIntentionalReloadRef.current) return;
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

  const isRegistrationFormValid = () => fullName.trim() !== '' && isValidMobileNumber(mobileNumber);

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

  // Registration-status ("already registered" / "not registered") is now enforced
  // by the backend's register/login endpoints themselves after OTP verification,
  // rather than via a separate pre-check call before sending the OTP.
  const handleSendOtp = async () => {
    if (!isLoginView && !isRegistrationFormValid()) { showAlert('Please fill all registration details accurately.'); return; }
    if (!mobileNumber || !isValidMobileNumber(mobileNumber)) { showAlert('Please enter a valid 10-digit mobile number.'); return; }
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
    const userId = loggedInUser.userId;
    loadUserProjects(userId);
    loadUserQuotations(userId);
    loadUserCustomers(userId);
    loadUserProducts(userId);
    loadUserInvoices(userId);
    loadUserPurchaseOrders(userId);
    loadUserProformaInvoices(userId);
    loadUserDeliveryNotes(userId);
    loadUserReceipts(userId);
    loadUserBusinessInfo(userId);
    loadUserSettings(userId);
    loadUserTerms(userId);
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
          await loadUserQuotations(loggedInUser.userId);
          await loadUserCustomers(loggedInUser.userId);
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
    brandBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '48px' },
    logoImg: { width: '68px', height: '68px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 10px 24px rgba(37, 84, 235, 0.18)' },
    brandName: { margin: '10px 0 0 0', fontSize: '25px', fontWeight: '800', color: '#2554EB', letterSpacing: '-0.02em' },
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
        <div style={connectivityStyles.brandBlock}>
          <img src={smartpayLogo} alt="SmartManage" style={connectivityStyles.logoImg} />
          <h1 style={connectivityStyles.brandName}>SmartManage</h1>
        </div>
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
        <div style={connectivityStyles.brandBlock}>
          <img src={smartpayLogo} alt="SmartManage" style={connectivityStyles.logoImg} />
          <h1 style={connectivityStyles.brandName}>SmartManage</h1>
        </div>
        <div style={connectivityStyles.spinner} />
        <p style={connectivityStyles.message}>Loading... Please wait.</p>
      </div>
    );
  }

  const handleFullLogout = () => {
    showConfirm('Are you sure you want to sign out?', () => {
      isIntentionalReloadRef.current = true;
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

  // Shared "Update Profile" modal — rendered from every top-level screen (Main page,
  // Quotations, Attendance/Payments) so it always opens exactly where it was triggered from.
  const renderProfileModal = () => {
    if (!isProfileModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
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
                    ? <span style={{ fontSize: '30px', fontWeight: '700', color: '#0B3C9B' }}>{getInitials(loggedInUser.fullName)}</span>
                    : <span style={{ fontSize: '30px' }}>&#128100;</span>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#0B3C9B', color: '#ffffff', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2.5px solid #ffffff', boxShadow: '0 2px 6px rgba(11, 60, 155, 0.35)' }}>&#128247;</div>
            </label>
            <input id="user-avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => openImageCropper('profileImg', reader.result);
              reader.readAsDataURL(file);
              e.target.value = '';
            }} />
            <span style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: '500' }}>{t('tapToChangePhoto')}</span>
            {profileImg && (
              <button
                type="button"
                onClick={() => setProfileImg(null)}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: '6px', fontSize: '12px', color: '#DC2626', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Remove Photo
              </button>
            )}
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
    );
  };

  // Shared "exit app" confirmation — only ever triggered from the Main page (see closeTopmostScreen).
  const renderExitConfirmPopup = () => (
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
  );

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
    
    // Only validate mobile number if the user actually typed something in
    if (tempWorkerPhone.trim() !== '') {
      if (!isValidMobileNumber(tempWorkerPhone.trim())) {
        showAlert('Please enter a valid 10-digit Mobile Number (or leave it blank).');
        return;
      }
    }

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
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                style={moduleHomeStyles.avatarButton}
                aria-label="Profile and settings"
              >
                {profileImg ? (
                  <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(loggedInUser?.fullName) || homeDisplayName.substring(0, 2).toUpperCase()
                )}
              </button>
              <div style={moduleHomeStyles.brandRow}>
                <img src={smartpayLogo} alt="SmartManage" style={moduleHomeStyles.logoImg} />
                <span style={moduleHomeStyles.brandName}>SmartManage</span>
              </div>
            </div>

            <div style={moduleHomeStyles.greetBlock}>
              <h1 style={moduleHomeStyles.greetTitle}>{t('greetingHi')}, {homeDisplayName} </h1>
              <p style={moduleHomeStyles.greetSubtitle}>What would you like to do today?</p>
            </div>

            <div style={moduleHomeStyles.panel}>
              <div style={moduleHomeStyles.tileGrid}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveModule('attendance')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModule('attendance'); }}
                  style={moduleHomeStyles.tile}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleWatchTutorialVideo(); }}
                    aria-label="Watch Manage Employee video"
                    style={moduleHomeStyles.tilePlayBadge}
                  >
                    <span style={{ marginLeft: '2px' }}>&#9654;&#65039;</span>
                  </button>
                  <span style={{ ...moduleHomeStyles.tileBadge, background: 'linear-gradient(135deg, #2554EB, #0B3C9B)' }}>
                    <HiOutlineUserGroup size={20} color="#ffffff" />
                  </span>
                  <span style={moduleHomeStyles.tileTitleAdjustable}>Manage Employee<br />Track Attendance<br />Handle Payments</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveModule('quotations')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModule('quotations'); }}
                  style={moduleHomeStyles.tile}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleWatchTutorialVideo(); }}
                    aria-label="Watch Create Quotation, Invoice & Business Docs video"
                    style={moduleHomeStyles.tilePlayBadge}
                  >
                    <span style={{ marginLeft: '2px' }}>&#9654;&#65039;</span>
                  </button>
                  <span style={{ ...moduleHomeStyles.tileBadge, background: 'linear-gradient(135deg, #14B8A6, #0F766E)' }}>
                    <FiFileText size={19} color="#ffffff" />
                  </span>
                  <span style={moduleHomeStyles.tileTitleAdjustable}>Quotation, Invoice<br />&amp; Business Docs</span>
                </div>
              </div>
            </div>

          </div>

          {/* Home / Subscribe / Contact Us — styled to match the Attendance module's bottom nav bar exactly */}
          <div style={themeStyles.bottomDockNavBar}>
            <button
              type="button"
              onClick={() => { setIsSubscribePageOpen(false); setIsHelpPageOpen(false); }}
              style={!isSubscribePageOpen && !isHelpPageOpen ? themeStyles.navItemTabActive : themeStyles.navItemTab}
            >
              <span style={themeStyles.navTabIcon}>&#128193;</span>
              <span style={themeStyles.navTabLabel}>{t('navHome')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsSubscribePageOpen(true); setIsHelpPageOpen(false); }}
              style={isSubscribePageOpen ? themeStyles.navItemTabActive : themeStyles.navItemTab}
            >
              <span style={themeStyles.navTabIcon}>&#11088;</span>
              <span style={themeStyles.navTabLabel}>{t('navSubscribe')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsHelpPageOpen(true); setIsSubscribePageOpen(false); }}
              style={isHelpPageOpen ? themeStyles.navItemTabActive : themeStyles.navItemTab}
            >
              <span style={themeStyles.navTabIcon}>&#128222;</span>
              <span style={themeStyles.navTabLabel}>{t('navHelp')}</span>
            </button>
          </div>

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
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" onClick={() => setIsSubscribePageOpen(false)} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <FiArrowLeft size={19} color="#1E293B" />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Subscribe now</h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Pick a plan that fits how many projects and employees you manage</p>
                  </div>
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
            const helpEmails = ['nilendra777@gmail.com', 'akash24101990@gmail.com'];
            return (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <div style={{ padding: '18px 16px 14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" onClick={() => setIsHelpPageOpen(false)} aria-label="Back" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <FiArrowLeft size={19} color="#1E293B" />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('helpPageTitle')}</h2>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px 32px' }}>
                  {/* Intro line */}
                  <p style={{ fontSize: '14.5px', color: '#334155', fontWeight: '500', lineHeight: '1.5', margin: '0 0 22px 0' }}>
                    {t('helpPageSubtitle')}
                  </p>

                  {/* Let's Chat buttons (WhatsApp) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {helpNumbers.map((number, idx) => (
                      <a
                        key={number}
                        href={`https://wa.me/${number.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          backgroundColor: '#1E293B', borderRadius: '16px', padding: '16px',
                          boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                          textDecoration: 'none', cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '15.5px', fontWeight: '700', color: '#ffffff' }}>{`${t('letsChat')} ${idx + 1}`}</span>
                        <FaWhatsapp size={20} color="#25D366" />
                      </a>
                    ))}
                  </div>

                  {/* App name, phone numbers, emails */}
                  <div style={{
                    backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px',
                    border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '0 0 14px 0' }}>{t('contactAppName')}</h3>

                    {helpNumbers.map((number) => (
                      <a
                        key={number}
                        href={`tel:${number.replace(/\s+/g, '')}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', margin: '0 0 10px 0' }}
                      >
                        <FiPhone size={16} color="#0B3C9B" />
                        <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A' }}>{number}</span>
                      </a>
                    ))}

                    {helpEmails.map((email) => (
                      <a
                        key={email}
                        href={`mailto:${email}`}
                        onClick={(e) => { e.preventDefault(); window.location.href = `mailto:${email}`; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', margin: '0 0 10px 0' }}
                      >
                        <HiOutlineMail size={17} color="#0B3C9B" />
                        <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A', wordBreak: 'break-all' }}>{email}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {renderProfileModal()}
          {renderImageCropperModal()}
          {renderExitConfirmPopup()}

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
              <span style={businessInfoStyles.headerIconBtn} />
            </div>

            <div style={businessInfoStyles.body}>
              <div style={businessInfoStyles.brandRow}>
                <div style={businessInfoStyles.brandTile}>
                  {businessInfo.logoImg ? (
                    <img src={businessInfo.logoImg} alt="Logo" style={businessInfoStyles.brandTileImg} />
                  ) : (
                    <span style={businessInfoStyles.brandTileText}>ADD<br />LOGO</span>
                  )}
                  <button type="button" onClick={() => openImageActionSheet('logo')} aria-label="Edit logo" style={businessInfoStyles.brandEditBadge}>
                    <HiOutlinePencil size={13} color="#0F172A" />
                  </button>
                </div>
                <div style={businessInfoStyles.brandTile}>
                  {businessInfo.signatureImg ? (
                    <img src={businessInfo.signatureImg} alt="Signature" style={businessInfoStyles.brandTileImg} />
                  ) : (
                    <span style={businessInfoStyles.brandTileText}>ADD<br />SIGNATURE</span>
                  )}
                  <button type="button" onClick={() => openImageActionSheet('signature')} aria-label="Edit signature" style={businessInfoStyles.brandEditBadge}>
                    <HiOutlinePencil size={13} color="#0F172A" />
                  </button>
                </div>
              </div>

              {/* Hidden file inputs - triggered programmatically from the image action sheet below */}
              <input ref={logoCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('logoImg', e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={logoPhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('logoImg', e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={signatureCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('signatureImg', e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={signaturePhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('signatureImg', e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={qrCodeCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('qrCodeImg', e.target.files?.[0]); e.target.value = ''; }} />
              <input ref={qrCodePhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('qrCodeImg', e.target.files?.[0]); e.target.value = ''; }} />

              <FieldInput label="Business Name" value={businessInfo.businessName} onChange={(v) => updateBusinessField('businessName', v)} />
              <FieldInput label="Contact Name" value={businessInfo.contactName} onChange={(v) => updateBusinessField('contactName', v)} />
              <FieldInput label="Email" value={businessInfo.email} onChange={(v) => updateBusinessField('email', v)} type="email" error={businessInfoErrors.email} />
              <FieldInput label="Phone Number" value={businessInfo.phone} onChange={(v) => updateBusinessField('phone', v.replace(/\D/g, '').slice(0, 10))} type="tel" error={businessInfoErrors.phone} />
              <FieldInput label="Address Line 1" value={businessInfo.addressLine1} onChange={(v) => updateBusinessField('addressLine1', v)} />
              <FieldInput label="Address Line 2" value={businessInfo.addressLine2} onChange={(v) => updateBusinessField('addressLine2', v)} />
              <FieldInput label="City" value={businessInfo.addressLine3} onChange={(v) => updateBusinessField('addressLine3', v)} />
              <button
                type="button"
                onClick={() => { setStateFieldTarget('business'); setStateSearchQuery(''); setShowStatePicker(true); }}
                style={{ ...businessInfoStyles.fieldBox, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}
              >
                <span style={businessInfoStyles.fieldLabel}>State</span>
                <span style={{ ...businessInfoStyles.fieldInputEl, color: businessInfo.state ? '#0F172A' : '#94A3B8' }}>
                  {businessInfo.state ? toTitleCase(businessInfo.state) : 'Select State'}
                </span>
              </button>
              <FieldInput
                label="PIN Code"
                value={businessInfo.pincode || ''}
                onChange={(v) => updateBusinessField('pincode', v.replace(/\D/g, '').slice(0, 6))}
                type="tel"
                error={businessInfoErrors.pincode}
              />
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
              <FieldInput label="GSTIN/PAN/VAT/Business Number" value={businessInfo.taxNumber} onChange={(v) => updateBusinessField('taxNumber', v)} error={businessInfoErrors.taxNumber} />

              <div style={businessInfoStyles.sectionBar}>Payment Instructions - Bank Details</div>
              <div style={businessInfoStyles.bankCard}>
                <div style={businessInfoStyles.bankCardHeaderRow}>
                  <button type="button" onClick={() => setIsBankDetailsModalOpen(true)} style={businessInfoStyles.bankCardLabelBtn}>
                    <span style={businessInfoStyles.fieldLabel}>Bank Info</span>
                  </button>
                  <button type="button" onClick={handleShareBankInfo} aria-label="Share bank info" style={businessInfoStyles.bankShareIconBtn}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  </button>
                </div>
                <button type="button" onClick={() => setIsBankDetailsModalOpen(true)} style={businessInfoStyles.bankCardBodyBtn}>
                  <span style={businessInfoStyles.bankLine}>Account Holder Name : {maskIfSet(businessInfo.bankAccountName)}</span>
                  <span style={businessInfoStyles.bankLine}>Account Number : {maskIfSet(businessInfo.bankAccountNumber)}</span>
                  <span style={businessInfoStyles.bankLine}>Bank Name : {maskIfSet(businessInfo.bankName)}</span>
                  <span style={businessInfoStyles.bankLine}>IFSC Code : {maskIfSet(businessInfo.ifscCode)}</span>
                </button>
              </div>

              <div style={businessInfoStyles.fieldBox}>
                <span style={businessInfoStyles.fieldLabel}>QR Code</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  {businessInfo.qrCodeImg && (
                    <img src={businessInfo.qrCodeImg} alt="QR Code" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                  )}
                  <button
                    type="button"
                    onClick={() => openImageActionSheet('qrCode')}
                    style={{
                      flex: businessInfo.qrCodeImg ? '0 0 auto' : '1 1 auto',
                      padding: businessInfo.qrCodeImg ? '9px 18px' : '11px 18px',
                      borderRadius: '12px', border: '1.5px solid #0F766E', background: businessInfo.qrCodeImg ? '#ffffff' : '#F0FDFA',
                      color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {businessInfo.qrCodeImg ? 'Change' : 'Upload'}
                  </button>
                </div>
              </div>

              <button type="button" onClick={handleUpdateBusinessInfo} style={businessInfoStyles.updateBtn}>Update</button>
            </div>

            {isBankDetailsModalOpen && (
              <div style={businessInfoStyles.modalOverlay} onClick={handleCloseBankDetailsModal}>
                <div style={businessInfoStyles.modalCard} onClick={(e) => e.stopPropagation()}>
                  <div style={businessInfoStyles.modalHeaderRow}>
                    <h3 style={businessInfoStyles.modalTitle}>Bank Details</h3>
                    <button type="button" onClick={handleCloseBankDetailsModal} style={businessInfoStyles.modalCloseBtn} aria-label="Close">&times;</button>
                  </div>
                  <FieldInput label="Account Holder Name" value={businessInfo.bankAccountName} onChange={(v) => updateBusinessField('bankAccountName', v)} />
                  <FieldInput label="Account Number" value={businessInfo.bankAccountNumber} onChange={(v) => updateBusinessField('bankAccountNumber', v)} type="tel" />
                  <FieldInput label="Bank Name" value={businessInfo.bankName} onChange={(v) => updateBusinessField('bankName', v)} />
                  <FieldInput
                    label="IFSC Code"
                    value={businessInfo.ifscCode}
                    onChange={(v) => updateBusinessField('ifscCode', v.toUpperCase().slice(0, 11))}
                    error={businessInfoErrors.ifscCode}
                  />
                  <button type="button" onClick={handleCloseBankDetailsModal} style={businessInfoStyles.modalSaveBtn}>Save</button>
                </div>
              </div>
            )}

            {imageActionSheet && (
              <div style={customerModuleStyles.modalOverlay} onClick={closeImageActionSheet}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  {(() => {
                    const isLogo = imageActionSheet === 'logo';
                    const isQrCode = imageActionSheet === 'qrCode';
                    const isSignature = !isLogo && !isQrCode;
                    const hasImage = isLogo ? !!businessInfo.logoImg : (isQrCode ? !!businessInfo.qrCodeImg : !!businessInfo.signatureImg);
                    const cameraRef = isLogo ? logoCameraInputRef : (isQrCode ? qrCodeCameraInputRef : signatureCameraInputRef);
                    const photoRef = isLogo ? logoPhotoInputRef : (isQrCode ? qrCodePhotoInputRef : signaturePhotoInputRef);
                    const imgSrc = isLogo ? businessInfo.logoImg : (isQrCode ? businessInfo.qrCodeImg : businessInfo.signatureImg);
                    const removeKey = isLogo ? 'logoImg' : (isQrCode ? 'qrCodeImg' : 'signatureImg');
                    return (
                      <>
                        <button type="button" onClick={() => { cameraRef.current?.click(); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                          <FiCamera size={19} color="#334155" />
                          <span>Camera</span>
                        </button>
                        <button type="button" onClick={() => { photoRef.current?.click(); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                          <FiImage size={19} color="#334155" />
                          <span>Photos</span>
                        </button>
                        {isSignature && (
                          <button type="button" onClick={openSignaturePad} style={businessInfoStyles.sheetActionRow}>
                            <FiEdit3 size={19} color="#334155" />
                            <span>Signature Pad</span>
                          </button>
                        )}
                        {hasImage && (
                          <button type="button" onClick={() => { setImageViewerSrc(imgSrc); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                            <FiEye size={19} color="#334155" />
                            <span>View Image</span>
                          </button>
                        )}
                        {hasImage && (
                          <button type="button" onClick={() => handleRemoveBusinessImage(removeKey)} style={{ ...businessInfoStyles.sheetActionRow, borderBottom: 'none', color: '#DC2626' }}>
                            <FiTrash2 size={19} color="#DC2626" />
                            <span>{isSignature ? 'Remove current image' : 'Remove current photo'}</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {isSignaturePadOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsSignaturePadOpen(false)}>
                <div style={{ background: '#ffffff', width: 'calc(100% - 40px)', maxWidth: '460px', borderRadius: '24px', padding: '20px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 12px' }}>Draw Signature</h3>
                  <canvas
                    key={signaturePadKey}
                    ref={signatureCanvasRef}
                    width={360}
                    height={180}
                    style={{ width: '100%', height: '180px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', touchAction: 'none', display: 'block' }}
                    onPointerDown={handleSignaturePointerDown}
                    onPointerMove={handleSignaturePointerMove}
                    onPointerUp={handleSignaturePointerUp}
                    onPointerLeave={handleSignaturePointerUp}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button type="button" onClick={handleClearSignaturePad} style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#ffffff', color: '#334155', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
                    <button type="button" onClick={handleSaveSignaturePad} style={businessInfoStyles.modalSaveBtn}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {renderImageCropperModal()}

            {imageViewerSrc && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '24px', boxSizing: 'border-box' }} onClick={() => setImageViewerSrc(null)}>
                <img src={imageViewerSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', objectFit: 'contain' }} />
                <button type="button" onClick={() => setImageViewerSrc(null)} aria-label="Close" style={{ position: 'absolute', top: '20px', right: '20px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>
            )}

            {showStatePicker && stateFieldTarget === 'business' && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setShowStatePicker(false)}>
                <div style={{ ...customerModuleStyles.bottomSheet, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Select State</h3>
                  <div style={customerModuleStyles.searchBox}>
                    <FiSearch size={17} color="#94A3B8" />
                    <input
                      type="text"
                      value={stateSearchQuery}
                      onChange={(e) => setStateSearchQuery(e.target.value)}
                      placeholder="Search by Name"
                      style={customerModuleStyles.searchInput}
                      autoFocus
                    />
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filteredStateList.length === 0 ? (
                      <p style={customerModuleStyles.emptyText}>No matching state found.</p>
                    ) : (
                      filteredStateList.map((s, idx) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { updateBusinessField('state', s); setShowStatePicker(false); setStateSearchQuery(''); }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', padding: '14px 2px', fontSize: '14.5px', fontWeight: '600', color: '#0F172A',
                            borderBottom: idx < filteredStateList.length - 1 ? '1px solid #E2E8F0' : 'none',
                          }}
                        >
                          {toTitleCase(s)}
                        </button>
                      ))
                    )}
                  </div>
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

      // ----- Settings menu sub-screen -----
      if (quotationSubView === 'settingsMenu') {
        const settingsMenuItems = [
          { key: 'quotationSettings', label: 'Quotation Settings' },
          { key: 'invoiceSettings', label: 'Invoice Settings' },
          { key: 'purchaseOrderSettings', label: 'Purchase Order Settings' },
          { key: 'proformaInvoiceSettings', label: 'Proforma Invoice Settings' },
          { key: 'deliveryNoteSettings', label: 'Delivery Note Settings' },
          { key: 'receiptSettings', label: 'Receipt Settings' },
        ];
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Settings</h1>
              <span style={{ width: '27px', flexShrink: 0 }} />
            </div>

            <div style={{ ...customerModuleStyles.body, padding: '10px 18px 40px' }}>
              <div style={{ background: '#ffffff', borderRadius: '18px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
                {settingsMenuItems.map((item, idx) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => {
                      if (item.key === 'quotationSettings') setQuotationSubView('quotationSettingsDetail');
                      else if (item.key === 'invoiceSettings') setQuotationSubView('invoiceSettingsDetail');
                      else if (item.key === 'purchaseOrderSettings') setQuotationSubView('purchaseOrderSettingsDetail');
                      else if (item.key === 'proformaInvoiceSettings') setQuotationSubView('proformaInvoiceSettingsDetail');
                      else if (item.key === 'deliveryNoteSettings') setQuotationSubView('deliveryNoteSettingsDetail');
                      else if (item.key === 'receiptSettings') setQuotationSubView('receiptSettingsDetail');
                      else if (item.key === 'columnHeadingSettings') setQuotationSubView('columnHeadingSettingsDetail');
                      else showAlert('Coming soon.');
                    }}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '10px', padding: '17px 18px',
                      borderBottom: idx < settingsMenuItems.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A', lineHeight: '1.35' }}>{item.label}</span>
                    <FiChevronRight size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                  </button>
                ))}
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

      // ----- Quotation Settings detail sub-screen -----
      if (quotationSubView === 'quotationSettingsDetail') {
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Quotation Settings</h1>
              <span style={businessInfoStyles.headerIconBtn}></span>
            </div>

            <div style={businessInfoStyles.body}>

              <ToggleSwitchRow icon={<FiDollarSign size={18} color="#1E293B" />} label="GST Display" value={quotationSettings.taxType} onChange={(v) => updateQuotationSettingField('taxType', v)} />
              <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={quotationSettings.showProductHSN} onChange={(v) => updateQuotationSettingField('showProductHSN', v)} />
              <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={quotationSettings.showShippingAddress} onChange={(v) => updateQuotationSettingField('showShippingAddress', v)} />

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Quotation Top Message"
                value={quotationSettings.topMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyQuotationMessageMode('top', opt)}
              />
              {quotationSettings.topMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={3}
                      value={quotationSettings.topMessage}
                      onChange={(e) => updateQuotationSettingField('topMessage', e.target.value)}
                      readOnly={quotationSettings.topMessageMode === 'Default'}
                      placeholder="Enter your custom top message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(quotationSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Quotation Bottom Message"
                value={quotationSettings.bottomMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyQuotationMessageMode('bottom', opt)}
              />
              {quotationSettings.bottomMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={2}
                      value={quotationSettings.bottomMessage}
                      onChange={(e) => updateQuotationSettingField('bottomMessage', e.target.value)}
                      readOnly={quotationSettings.bottomMessageMode === 'Default'}
                      placeholder="Enter your custom bottom message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(quotationSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={quotationSettings.showBankInfo} onChange={(v) => updateQuotationSettingField('showBankInfo', v)} />
              <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={quotationSettings.showUpiInfo} onChange={(v) => updateQuotationSettingField('showUpiInfo', v)} />
              <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={quotationSettings.showSignature} onChange={(v) => updateQuotationSettingField('showSignature', v)} />

              <div style={businessInfoStyles.settingsFooterRow}>
                <button type="button" onClick={handleResetQuotationSettings} style={businessInfoStyles.resetBtn}>Reset</button>
                <button type="button" onClick={handleUpdateQuotationSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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

      // ----- Invoice Settings detail sub-screen -----
      if (quotationSubView === 'invoiceSettingsDetail') {
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Invoice Settings</h1>
              <span style={businessInfoStyles.headerIconBtn}></span>
            </div>

            <div style={businessInfoStyles.body}>

              <ToggleSwitchRow icon={<FiDollarSign size={18} color="#1E293B" />} label="GST Display" value={invoiceSettings.taxType} onChange={(v) => updateInvoiceSettingField('taxType', v)} />
              <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={invoiceSettings.showProductHSN} onChange={(v) => updateInvoiceSettingField('showProductHSN', v)} />
              <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={invoiceSettings.showShippingAddress} onChange={(v) => updateInvoiceSettingField('showShippingAddress', v)} />

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Invoice Top Message"
                value={invoiceSettings.topMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyInvoiceMessageMode('top', opt)}
              />
              {invoiceSettings.topMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={3}
                      value={invoiceSettings.topMessage}
                      onChange={(e) => updateInvoiceSettingField('topMessage', e.target.value)}
                      readOnly={invoiceSettings.topMessageMode === 'Default'}
                      placeholder="Enter your custom top message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(invoiceSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Invoice Bottom Message"
                value={invoiceSettings.bottomMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyInvoiceMessageMode('bottom', opt)}
              />
              {invoiceSettings.bottomMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={2}
                      value={invoiceSettings.bottomMessage}
                      onChange={(e) => updateInvoiceSettingField('bottomMessage', e.target.value)}
                      readOnly={invoiceSettings.bottomMessageMode === 'Default'}
                      placeholder="Enter your custom bottom message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(invoiceSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={invoiceSettings.showBankInfo} onChange={(v) => updateInvoiceSettingField('showBankInfo', v)} />
              <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={invoiceSettings.showUpiInfo} onChange={(v) => updateInvoiceSettingField('showUpiInfo', v)} />
              <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={invoiceSettings.showSignature} onChange={(v) => updateInvoiceSettingField('showSignature', v)} />

              <div style={businessInfoStyles.settingsFooterRow}>
                <button type="button" onClick={handleResetInvoiceSettings} style={businessInfoStyles.resetBtn}>Reset</button>
                <button type="button" onClick={handleUpdateInvoiceSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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

      // ----- Purchase Order Settings detail sub-screen -----
      if (quotationSubView === 'purchaseOrderSettingsDetail') {
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Purchase Order Settings</h1>
              <span style={businessInfoStyles.headerIconBtn}></span>
            </div>

            <div style={businessInfoStyles.body}>

              <ToggleSwitchRow icon={<FiDollarSign size={18} color="#1E293B" />} label="GST Display" value={purchaseOrderSettings.taxType} onChange={(v) => updatePurchaseOrderSettingField('taxType', v)} />
              <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={purchaseOrderSettings.showProductHSN} onChange={(v) => updatePurchaseOrderSettingField('showProductHSN', v)} />
              <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={purchaseOrderSettings.showShippingAddress} onChange={(v) => updatePurchaseOrderSettingField('showShippingAddress', v)} />

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Purchase Order Top Message"
                value={purchaseOrderSettings.topMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyPurchaseOrderMessageMode('top', opt)}
              />
              {purchaseOrderSettings.topMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={3}
                      value={purchaseOrderSettings.topMessage}
                      onChange={(e) => updatePurchaseOrderSettingField('topMessage', e.target.value)}
                      readOnly={purchaseOrderSettings.topMessageMode === 'Default'}
                      placeholder="Enter your custom top message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(purchaseOrderSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <SegmentedModeRow
                icon={<FiCreditCard size={18} color="#1E293B" />}
                label="Purchase Order Bottom Message"
                value={purchaseOrderSettings.bottomMessageMode || 'Default'}
                options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
                onChange={(opt) => applyPurchaseOrderMessageMode('bottom', opt)}
              />
              {purchaseOrderSettings.bottomMessageMode !== 'Hide' && (
                <div style={quotationSettingsStyles.row}>
                  <span style={quotationSettingsStyles.rowIcon} />
                  <span style={quotationSettingsStyles.rowBody}>
                    <textarea
                      rows={2}
                      value={purchaseOrderSettings.bottomMessage}
                      onChange={(e) => updatePurchaseOrderSettingField('bottomMessage', e.target.value)}
                      readOnly={purchaseOrderSettings.bottomMessageMode === 'Default'}
                      placeholder="Enter your custom bottom message"
                      style={{
                        ...quotationSettingsStyles.textareaEl,
                        ...(purchaseOrderSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                      }}
                    />
                  </span>
                </div>
              )}

              <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={purchaseOrderSettings.showBankInfo} onChange={(v) => updatePurchaseOrderSettingField('showBankInfo', v)} />
              <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={purchaseOrderSettings.showUpiInfo} onChange={(v) => updatePurchaseOrderSettingField('showUpiInfo', v)} />
              <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={purchaseOrderSettings.showSignature} onChange={(v) => updatePurchaseOrderSettingField('showSignature', v)} />

              <div style={businessInfoStyles.settingsFooterRow}>
                <button type="button" onClick={handleResetPurchaseOrderSettings} style={businessInfoStyles.resetBtn}>Reset</button>
                <button type="button" onClick={handleUpdatePurchaseOrderSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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

      // ----- Proforma Invoice Settings detail sub-screen -----
      // ----- Proforma Invoice Settings detail sub-screen -----
if (quotationSubView === 'proformaInvoiceSettingsDetail') {
  return (
    <div style={businessInfoStyles.screen}>
      <div style={businessInfoStyles.header}>
        <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
          <FiArrowLeft size={19} color="#ffffff" />
        </button>
        <h1 style={businessInfoStyles.headerTitle}>Proforma Invoice Settings</h1>
        <span style={businessInfoStyles.headerIconBtn}></span>
      </div>

      <div style={businessInfoStyles.body}>

        <ToggleSwitchRow icon={<FiDollarSign size={18} color="#1E293B" />} label="GST Display" value={proformaInvoiceSettings.taxType} onChange={(v) => updateProformaInvoiceSettingField('taxType', v)} />
        <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={proformaInvoiceSettings.showProductHSN} onChange={(v) => updateProformaInvoiceSettingField('showProductHSN', v)} />
        <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={proformaInvoiceSettings.showShippingAddress} onChange={(v) => updateProformaInvoiceSettingField('showShippingAddress', v)} />

        <SegmentedModeRow
          icon={<FiCreditCard size={18} color="#1E293B" />}
          label="Proforma Invoice Top Message"
          value={proformaInvoiceSettings.topMessageMode || 'Default'}
          options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
          onChange={(opt) => applyProformaInvoiceMessageMode('top', opt)}
        />
        {proformaInvoiceSettings.topMessageMode !== 'Hide' && (
          <div style={quotationSettingsStyles.row}>
            <span style={quotationSettingsStyles.rowIcon} />
            <span style={quotationSettingsStyles.rowBody}>
              <textarea
                rows={3}
                value={proformaInvoiceSettings.topMessage}
                onChange={(e) => updateProformaInvoiceSettingField('topMessage', e.target.value)}
                readOnly={proformaInvoiceSettings.topMessageMode === 'Default'}
                placeholder="Enter your custom top message"
                style={{
                  ...quotationSettingsStyles.textareaEl,
                  ...(proformaInvoiceSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                }}
              />
            </span>
          </div>
        )}

        <SegmentedModeRow
          icon={<FiCreditCard size={18} color="#1E293B" />}
          label="Proforma Invoice Bottom Message"
          value={proformaInvoiceSettings.bottomMessageMode || 'Default'}
          options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
          onChange={(opt) => applyProformaInvoiceMessageMode('bottom', opt)}
        />
        {proformaInvoiceSettings.bottomMessageMode !== 'Hide' && (
          <div style={quotationSettingsStyles.row}>
            <span style={quotationSettingsStyles.rowIcon} />
            <span style={quotationSettingsStyles.rowBody}>
              <textarea
                rows={2}
                value={proformaInvoiceSettings.bottomMessage}
                onChange={(e) => updateProformaInvoiceSettingField('bottomMessage', e.target.value)}
                readOnly={proformaInvoiceSettings.bottomMessageMode === 'Default'}
                placeholder="Enter your custom bottom message"
                style={{
                  ...quotationSettingsStyles.textareaEl,
                  ...(proformaInvoiceSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                }}
              />
            </span>
          </div>
        )}

        <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={proformaInvoiceSettings.showBankInfo} onChange={(v) => updateProformaInvoiceSettingField('showBankInfo', v)} />
        <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={proformaInvoiceSettings.showUpiInfo} onChange={(v) => updateProformaInvoiceSettingField('showUpiInfo', v)} />
        <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={proformaInvoiceSettings.showSignature} onChange={(v) => updateProformaInvoiceSettingField('showSignature', v)} />

        <div style={businessInfoStyles.settingsFooterRow}>
          <button type="button" onClick={handleResetProformaInvoiceSettings} style={businessInfoStyles.resetBtn}>Reset</button>
          <button type="button" onClick={handleUpdateProformaInvoiceSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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

      // ----- Delivery Note Settings detail sub-screen -----
      // ----- Delivery Note Settings detail sub-screen -----
if (quotationSubView === 'deliveryNoteSettingsDetail') {
  return (
    <div style={businessInfoStyles.screen}>
      <div style={businessInfoStyles.header}>
        <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
          <FiArrowLeft size={19} color="#ffffff" />
        </button>
        <h1 style={businessInfoStyles.headerTitle}>Delivery Note Settings</h1>
        <span style={businessInfoStyles.headerIconBtn}></span>
      </div>

      <div style={businessInfoStyles.body}>

        <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={deliveryNoteSettings.showProductHSN} onChange={(v) => updateDeliveryNoteSettingField('showProductHSN', v)} />
        <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={deliveryNoteSettings.showShippingAddress} onChange={(v) => updateDeliveryNoteSettingField('showShippingAddress', v)} />

        <SegmentedModeRow
          icon={<FiCreditCard size={18} color="#1E293B" />}
          label="Delivery Note Top Message"
          value={deliveryNoteSettings.topMessageMode || 'Default'}
          options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
          onChange={(opt) => applyDeliveryNoteMessageMode('top', opt)}
        />
        {deliveryNoteSettings.topMessageMode !== 'Hide' && (
          <div style={quotationSettingsStyles.row}>
            <span style={quotationSettingsStyles.rowIcon} />
            <span style={quotationSettingsStyles.rowBody}>
              <textarea
                rows={3}
                value={deliveryNoteSettings.topMessage}
                onChange={(e) => updateDeliveryNoteSettingField('topMessage', e.target.value)}
                readOnly={deliveryNoteSettings.topMessageMode === 'Default'}
                placeholder="Enter your custom top message"
                style={{
                  ...quotationSettingsStyles.textareaEl,
                  ...(deliveryNoteSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                }}
              />
            </span>
          </div>
        )}

        <SegmentedModeRow
          icon={<FiCreditCard size={18} color="#1E293B" />}
          label="Delivery Note Bottom Message"
          value={deliveryNoteSettings.bottomMessageMode || 'Default'}
          options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
          onChange={(opt) => applyDeliveryNoteMessageMode('bottom', opt)}
        />
        {deliveryNoteSettings.bottomMessageMode !== 'Hide' && (
          <div style={quotationSettingsStyles.row}>
            <span style={quotationSettingsStyles.rowIcon} />
            <span style={quotationSettingsStyles.rowBody}>
              <textarea
                rows={2}
                value={deliveryNoteSettings.bottomMessage}
                onChange={(e) => updateDeliveryNoteSettingField('bottomMessage', e.target.value)}
                readOnly={deliveryNoteSettings.bottomMessageMode === 'Default'}
                placeholder="Enter your custom bottom message"
                style={{
                  ...quotationSettingsStyles.textareaEl,
                  ...(deliveryNoteSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                }}
              />
            </span>
          </div>
        )}

        <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={deliveryNoteSettings.showSignature} onChange={(v) => updateDeliveryNoteSettingField('showSignature', v)} />

        <div style={businessInfoStyles.settingsFooterRow}>
          <button type="button" onClick={handleResetDeliveryNoteSettings} style={businessInfoStyles.resetBtn}>Reset</button>
          <button type="button" onClick={handleUpdateDeliveryNoteSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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
      // ----- Receipt Settings detail sub-screen -----
      if (quotationSubView === 'receiptSettingsDetail') {
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Receipt Settings</h1>
              <span style={businessInfoStyles.headerIconBtn}></span>
            </div>

            <div style={businessInfoStyles.body}>

              <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={receiptSettings.showSignature} onChange={(v) => updateReceiptSettingField('showSignature', v)} />

              <div style={{ marginTop: '4px' }}>
                <button type="button" onClick={handleUpdateReceiptSettings} style={businessInfoStyles.updateBtn}>Update</button>
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

      // ----- Column Heading Settings detail sub-screen -----
      if (quotationSubView === 'columnHeadingSettingsDetail') {
        return (
          <div style={businessInfoStyles.screen}>
            <div style={businessInfoStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={businessInfoStyles.headerTitle}>Column Heading</h1>
              <span style={businessInfoStyles.headerIconBtn}></span>
            </div>

            <div style={businessInfoStyles.body}>
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
                <span style={quotationSettingsStyles.rowBody}>
                  <span style={quotationSettingsStyles.rowLabel}>Tax Label</span>
                  <input
                    type="text"
                    value={columnHeadingSettings.taxLabel}
                    onChange={(e) => updateColumnHeadingSettingField('taxLabel', e.target.value)}
                    style={quotationSettingsStyles.inputEl}
                  />
                </span>
              </div>

              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
                <span style={quotationSettingsStyles.rowBody}>
                  <span style={quotationSettingsStyles.rowLabel}>Product HSN Label</span>
                  <input
                    type="text"
                    value={columnHeadingSettings.hsnLabel}
                    onChange={(e) => updateColumnHeadingSettingField('hsnLabel', e.target.value)}
                    style={quotationSettingsStyles.inputEl}
                  />
                </span>
              </div>

              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
                <span style={quotationSettingsStyles.rowBody}>
                  <span style={quotationSettingsStyles.rowLabel}>Other Charges Label</span>
                  <input
                    type="text"
                    value={columnHeadingSettings.otherChargesLabel}
                    onChange={(e) => updateColumnHeadingSettingField('otherChargesLabel', e.target.value)}
                    style={quotationSettingsStyles.inputEl}
                  />
                </span>
              </div>

              <div style={{ ...quotationSettingsStyles.row, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
                  <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#1E293B' }}>Add QTY2 Column?</span>
                </span>
                <button
                  type="button"
                  onClick={() => updateColumnHeadingSettingField('showQty2Column', !columnHeadingSettings.showQty2Column)}
                  aria-label="Toggle Add QTY2 Column"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    width: '76px', height: '32px', borderRadius: '16px',
                    border: '1.5px solid #0F172A', background: '#ffffff',
                    padding: '2px', cursor: 'pointer', flexShrink: 0,
                    justifyContent: columnHeadingSettings.showQty2Column ? 'flex-end' : 'flex-start',
                    fontFamily: 'inherit',
                  }}
                >
                  {!columnHeadingSettings.showQty2Column && (
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A', flex: 1, textAlign: columnHeadingSettings.showQty2Column ? 'right' : 'left', paddingRight: columnHeadingSettings.showQty2Column ? '4px' : 0, paddingLeft: columnHeadingSettings.showQty2Column ? 0 : '2px' }}>
                    {columnHeadingSettings.showQty2Column ? 'YES' : 'NO'}
                  </span>
                  {columnHeadingSettings.showQty2Column && (
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', flexShrink: 0 }} />
                  )}
                </button>
              </div>

              <div style={businessInfoStyles.settingsFooterRow}>
                <button type="button" onClick={handleResetColumnHeadingSettings} style={businessInfoStyles.resetBtn}>Reset</button>
                <button type="button" onClick={handleUpdateColumnHeadingSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
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

      // ----- Customer List sub-screen -----
      if (quotationSubView === 'customerList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Customer List</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
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
              <FiPlus size={14} color="#ffffff" />
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
              <LabeledField
                label="Name"
                type="text"
                value={customerForm.name}
                onChange={(e) => updateCustomerField('name', e.target.value)}
                rightElement={
                  <ContactPickButton
                    ariaLabel="Pick customer from contacts"
                    onPick={({ name, phone, email }) => {
                      if (name) updateCustomerField('name', name);
                      if (phone) {
                        updateCustomerField('mobile', phone);
                        if (customerMobileError) setCustomerMobileError(false);
                      }
                      if (email) {
                        updateCustomerField('email', email);
                        if (customerEmailError) setCustomerEmailError(false);
                      }
                    }}
                  />
                }
              />

              <LabeledField
                label="Company Name"
                type="text"
                value={customerForm.companyName}
                onChange={(e) => updateCustomerField('companyName', e.target.value)}
              />
              <LabeledField
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(e) => {
                  updateCustomerField('email', e.target.value);
                  if (customerEmailError) setCustomerEmailError(false);
                }}
                error={customerEmailError ? 'Enter a valid email address' : null}
              />
              <LabeledField
                label="Mobile"
                type="tel"
                value={customerForm.mobile}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  updateCustomerField('mobile', digits);
                  if (customerMobileError) setCustomerMobileError(false);
                }}
                error={customerMobileError ? 'Enter a valid 10-digit mobile number' : null}
              />
              <LabeledField
                label="Address Line 1"
                type="text"
                value={customerForm.addressLine1}
                onChange={(e) => updateCustomerField('addressLine1', e.target.value)}
              />
              <LabeledField
                label="Address Line 2"
                type="text"
                value={customerForm.addressLine2}
                onChange={(e) => updateCustomerField('addressLine2', e.target.value)}
              />
              <LabeledField
                label="City"
                type="text"
                value={customerForm.addressLine3}
                onChange={(e) => updateCustomerField('addressLine3', e.target.value)}
              />
              <LabeledField
                label="State"
                as="button"
                onClick={() => { setStateFieldTarget('customer'); setStateSearchQuery(''); setShowStatePicker(true); }}
                inputStyle={{ color: customerForm.state ? '#0F172A' : '#94A3B8' }}
              >
                {customerForm.state ? toTitleCase(customerForm.state) : 'Select State'}
              </LabeledField>
              <LabeledField
                label="PIN Code"
                type="text"
                inputMode="numeric"
                value={customerForm.pincode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  updateCustomerField('pincode', digits);
                  if (customerPincodeError) setCustomerPincodeError(false);
                }}
                error={customerPincodeError ? 'Enter a valid 6-digit PIN code' : null}
              />
              <LabeledField
                label="GST Number"
                type="text"
                value={customerForm.gstin}
                onChange={(e) => {
                  updateCustomerField('gstin', e.target.value);
                  if (customerGstinError) setCustomerGstinError(false);
                }}
                error={customerGstinError ? 'Enter a valid GST number' : null}
              />

              <div style={customerModuleStyles.sectionBar}>Shipping Details</div>
              <div style={customerModuleStyles.taxableRow}>
                <span style={customerModuleStyles.sheetSmallLabelInline}>Same as Above</span>
                <input
                  type="checkbox"
                  checked={customerForm.shippingSameAsBilling}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCustomerForm((prev) => ({
                      ...prev,
                      shippingSameAsBilling: checked,
                      ...(checked ? {
                        shippingAddressLine1: prev.addressLine1,
                        shippingAddressLine2: prev.addressLine2,
                        shippingCity: prev.addressLine3,
                        shippingState: prev.state,
                        shippingPincode: prev.pincode,
                      } : {
                        // Unchecking should give the user a blank slate to type their own
                        // shipping address into, not leave it pre-filled with whatever was
                        // just copied over from the billing address.
                        shippingAddressLine1: '',
                        shippingAddressLine2: '',
                        shippingCity: '',
                        shippingState: '',
                        shippingPincode: '',
                      }),
                    }));
                    if (checked) setCustomerShippingPincodeError(false);
                  }}
                  style={customerModuleStyles.checkbox}
                />
              </div>

              {!customerForm.shippingSameAsBilling && (
                <>
                  <LabeledField
                    label="Shipping Address Line 1"
                    type="text"
                    value={customerForm.shippingAddressLine1}
                    onChange={(e) => updateCustomerField('shippingAddressLine1', e.target.value)}
                  />
                  <LabeledField
                    label="Shipping Address Line 2"
                    type="text"
                    value={customerForm.shippingAddressLine2}
                    onChange={(e) => updateCustomerField('shippingAddressLine2', e.target.value)}
                  />
                  <LabeledField
                    label="Shipping City"
                    type="text"
                    value={customerForm.shippingCity}
                    onChange={(e) => updateCustomerField('shippingCity', e.target.value)}
                  />
                  <LabeledField
                    label="Shipping State"
                    as="button"
                    onClick={() => { setStateFieldTarget('customerShipping'); setStateSearchQuery(''); setShowStatePicker(true); }}
                    inputStyle={{ color: customerForm.shippingState ? '#0F172A' : '#94A3B8' }}
                  >
                    {customerForm.shippingState ? toTitleCase(customerForm.shippingState) : 'Select State'}
                  </LabeledField>
                  <LabeledField
                    label="Shipping PIN Code"
                    type="text"
                    inputMode="numeric"
                    value={customerForm.shippingPincode}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      updateCustomerField('shippingPincode', digits);
                      if (customerShippingPincodeError) setCustomerShippingPincodeError(false);
                    }}
                    error={customerShippingPincodeError ? 'Enter a valid 6-digit PIN code' : null}
                  />
                </>
              )}

              <button type="button" onClick={handleSaveCustomer} style={customerModuleStyles.addBtn}>
                {editingCustomerId ? 'Update' : 'Add'}
              </button>
            </div>

            {showStatePicker && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setShowStatePicker(false)}>
                <div style={{ ...customerModuleStyles.bottomSheet, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Select State</h3>
                  <div style={customerModuleStyles.searchBox}>
                    <FiSearch size={17} color="#94A3B8" />
                    <input
                      type="text"
                      value={stateSearchQuery}
                      onChange={(e) => setStateSearchQuery(e.target.value)}
                      placeholder="Search by Name"
                      style={customerModuleStyles.searchInput}
                      autoFocus
                    />
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {filteredStateList.length === 0 ? (
                      <p style={customerModuleStyles.emptyText}>No matching state found.</p>
                    ) : (
                      filteredStateList.map((s, idx) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (stateFieldTarget === 'business') updateBusinessField('state', s);
                            else if (stateFieldTarget === 'customerShipping') updateCustomerField('shippingState', s);
                            else updateCustomerField('state', s);
                            setShowStatePicker(false);
                            setStateSearchQuery('');
                          }}
                          style={{
                            width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', padding: '14px 2px', fontSize: '14.5px', fontWeight: '600', color: '#0F172A',
                            borderBottom: idx < filteredStateList.length - 1 ? '1px solid #E2E8F0' : 'none',
                          }}
                        >
                          {toTitleCase(s)}
                        </button>
                      ))
                    )}
                  </div>
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

      // ----- Product List sub-screen -----
      if (quotationSubView === 'productList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Product List</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
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

            <button type="button" onClick={() => openAddProduct()} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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
                  onChange={(e) => { updateProductField('gst', e.target.value); if (productGstError) setProductGstError(false); }}
                  placeholder="GST"
                  style={{ ...customerModuleStyles.fieldInput, paddingRight: '38px', ...(productGstError ? { border: '1.5px solid #DC2626' } : null) }}
                />
                <span style={customerModuleStyles.suffixFieldIcon}>%</span>
              </div>
              {productGstError && <p style={customerModuleStyles.fieldErrorText}>Enter a valid GST percentage (0-100)</p>}
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
                onChange={(e) => { updateProductField('hsn', e.target.value.replace(/\D/g, '').slice(0, 8)); if (productHsnError) setProductHsnError(false); }}
                placeholder="HSN"
                style={{ ...customerModuleStyles.fieldInput, ...(productHsnError ? { border: '1.5px solid #DC2626' } : null) }}
              />
              {productHsnError && <p style={customerModuleStyles.fieldErrorText}>Enter a valid HSN code (4, 6, or 8 digits)</p>}

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
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
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
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Add Quotation Product sub-screen (Product / Quantity / Price / Description) -----
      if (quotationSubView === 'addQuotationProductLine') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingQuotationProductLineId ? 'Edit Quotation Product' : 'Add Quotation Product'}</h1>
              <button type="button" onClick={openPickProductForQuotationLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
                <FiSearch size={19} color="#ffffff" />
              </button>
            </div>

            <div style={customerModuleStyles.formBody}>
              <LabeledField
                label="Product"
                as="button"
                onClick={openPickProductForQuotationLine}
                rightElement={<FiChevronRight size={18} color="#94A3B8" />}
              >
                {quotationProductLineForm.name || 'Select Product'}
              </LabeledField>

              <LabeledField
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="1"
                value={quotationProductLineForm.qty}
                onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
              />

              <LabeledField
                label="Price"
                type="number"
                inputMode="decimal"
                value={quotationProductLineForm.price}
                onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
              />

              <div>
                <LabeledField
                  label="Description"
                  as="textarea"
                  value={quotationProductLineForm.description}
                  onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                  maxLength={2000}
                />
                <div style={customerModuleStyles.charCount}>{quotationProductLineForm.description.length}/2000</div>
              </div>

              <button type="button" onClick={handleAddQuotationProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
                Add To Quotation
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

      // ----- Pick Product sub-screen (choosing which product to add to a Quotation line) -----
      if (quotationSubView === 'pickProductForQuotationLine') {
        return (
          <div style={{ ...customerModuleStyles.screen}}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProductForQuotationLine(product)}
                    style={customerModuleStyles.productCard}
                  >
                    <div style={customerModuleStyles.productCardTopRow}>
                      <span style={customerModuleStyles.customerName}>{product.name}</span>
                      <FiChevronRight size={18} color="#94A3B8" />
                    </div>
                    {product.price !== undefined && product.price !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>Price</span>
                        <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                      </div>
                    )}
                    {product.gst !== undefined && product.gst !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>GST</span>
                        <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddProduct('pickProductForQuotationLine')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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
              <button type="button" onClick={openAddTermsModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Quotation</span>
            </div>

            <div style={customerModuleStyles.body}>
              {quotationTerms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                quotationTerms.map((term) => {
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
                        onClick={() => handleDeleteTerm(term, 'quotation')}
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
              <button
                type="button"
                onClick={() => {
                  if (editingQuotationId) { setEditingQuotationId(null); setQuotationSubView('quotationDetail'); }
                  else { setQuotationSubView(null); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingQuotationId ? 'Update Quotation' : 'Make Quotation'}</h1>
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

              <div style={makeQuotationStyles.sectionCard}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPickProductForQuotationLine}
                  style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
                >
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {quotationForm.products.length > 0 && (
                  <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                    {quotationForm.products.map((p) => {
                      const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                      const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                      const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      return (
                        <div
                          key={p.productId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditQuotationProductLine(p)}
                          style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeQuotationProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                            <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label={`Remove ${c.label}`}
                          >
                            <FiTrash2 size={16} color="#DC2626" />
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
                      <div key={term.id} style={makeQuotationStyles.lineRow}>
                        <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeQuotationSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
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
              <button type="button" onClick={handleGenerateQuotation} style={makeQuotationStyles.generateBtn}>{editingQuotationId ? 'Update' : 'Generate'}</button>
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
              {renderSortMenu()}
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
                sortDocumentsByCreated(quotations.filter(searchQuotation)).map((q) => (
                  <DocumentListCard
                    key={q.id}
                    onClick={() => { setSelectedQuotationId(q.id); setQuotationSubView('quotationDetail'); }}
                    name={q.customerName}
                    docNumber={q.quotationNo || 'Quote-' + q.id.slice(0, 4)}
                    date={q.date}
                    amount={q.grandTotal}
                    status={q.status}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={() => { setEditingQuotationId(null); setQuotationForm({ ...emptyQuotationForm(), quotationNo: getNextQuotationNumber() }); setQuotationSubView('makeQuotation'); }} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Quotation</span>
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
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('quotationList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Quotation Detail</h1>
              <button type="button" onClick={() => handleShareQuotation(currentQuotation)} aria-label="Share quotation" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <DocumentStatusBadge status={currentQuotation.status} />
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
                <div style={docStyles.page}>
                  <GeneratedDocumentPreview model={buildQuotationDocModel(currentQuotation)} />
                </div>
              </div>
            </div>


            {/* BOTTOM ACTION BAR (Duplicate, Edit, Invoice, Status, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicateQuotation(currentQuotation)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditQuotation(currentQuotation)} style={docActionBarStyles.btn}>
                {/* Standardized Edit icon - matches the Edit pencil icon and styling used in the
                    Attendance Module for the Project Name field in the header, so the Edit action
                    looks and behaves the same everywhere within the Quotation Module. */}
                <span style={docActionBarStyles.iconWrap}><span style={{ cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>&#9999;&#65039;</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button onClick={() => setShowConvertSheet(true)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
                <span style={docActionBarStyles.label}>Convert</span>
              </button>
              <button onClick={() => setShowQuotationStatusSheet(true)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>💬</span></span>
                <span style={docActionBarStyles.label}>Status</span>
              </button>
              <button
                onClick={() => {
                  showConfirm('Delete this quotation?', async () => {
                    const previous = quotations;
                    const deletedId = selectedQuotationId;
                    persistQuotations(quotations.filter(q => q.id !== deletedId));
                    setQuotationSubView('quotationList');
                    try {
                      await documentService.deleteQuotation(deletedId);
                    } catch (error) {
                      console.error('Error deleting quotation:', error);
                      persistQuotations(previous); // restore on failure
                      showAlert('Could not delete the quotation on the server. Reloading your quotations.');
                      if (loggedInUser?.userId) await loadUserQuotations(loggedInUser.userId);
                    }
                  });
                }}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
              </button>
            </div>

            {/* STATUS BOTTOM SHEET (Ref Image 4) */}
            <DocumentStatusSheet
              open={showQuotationStatusSheet}
              title="Quotation Status"
              onSelect={handleSetQuotationStatus}
              onClose={() => setShowQuotationStatusSheet(false)}
            />

            {/* CONVERSION BOTTOM SHEET (Invoice click - Ref Image 4) */}
            {showConvertSheet && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowConvertSheet(false)}>
                <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Quotation to...</h3>
                  
                  <button
                    onClick={() => {
                      setShowConvertSheet(false);
                      const newId = genId();
                      const newProformaInvoice = {
                        id: newId,
                        proformaInvoiceNo: getNextProformaInvoiceNumber(),
                        date: formatQuotationDate(new Date()),
                        dueDate: '', poNo: '', otherInfo: currentQuotation.otherInfo || '',
                        customerId: currentQuotation.customerId,
                        products: currentQuotation.products || [],
                        otherCharges: currentQuotation.otherCharges || [],
                        termsIds: currentQuotation.termsIds || [],
                        paidInfo: [],
                        grandTotal: currentQuotation.grandTotal,
                        paidTotal: 0,
                        balanceDue: currentQuotation.grandTotal,
                        createdAt: new Date().toISOString(),
                        customerName: currentQuotation.customerName,
                        customerCompany: currentQuotation.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(proformaInvoiceSettings),
                      };
                      persistProformaInvoices([...proformaInvoices, newProformaInvoice]);
                      showSuccess('Converted to Proforma Invoice successfully.');
                      setSelectedProformaInvoiceId(newId);
                      setQuotationSubView('proformaInvoiceDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Proforma Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowConvertSheet(false);
                      const newId = genId();
                      const newInvoice = {
                        id: newId,
                        invoiceNo: getNextInvoiceNumber(),
                        date: formatQuotationDate(new Date()),
                        dueDate: '', poNo: '', otherInfo: currentQuotation.otherInfo || '',
                        customerId: currentQuotation.customerId,
                        products: currentQuotation.products || [],
                        otherCharges: currentQuotation.otherCharges || [],
                        termsIds: currentQuotation.termsIds || [],
                        paidInfo: [],
                        grandTotal: currentQuotation.grandTotal,
                        paidTotal: 0,
                        balanceDue: currentQuotation.grandTotal,
                        status: 'Unpaid',
                        createdAt: new Date().toISOString(),
                        customerName: currentQuotation.customerName,
                        customerCompany: currentQuotation.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(invoiceSettings),
                      };
                      persistInvoices([...invoices, newInvoice]);
                      showSuccess('Converted to Invoice successfully.');
                      setSelectedInvoiceId(newId);
                      setQuotationSubView('invoiceDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
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

      if (quotationSubView === 'selectCustomerForPurchaseOrder') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForPurchaseOrder(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForPurchaseOrder')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
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

            <button type="button" onClick={() => openAddCustomer('selectCustomerForPurchaseOrder')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Add Purchase Order Product sub-screen (Product / Quantity / Price / Description) -----
      if (quotationSubView === 'addPurchaseOrderProductLine') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingPurchaseOrderProductLineId ? 'Edit Purchase Order Product' : 'Add Purchase Order Product'}</h1>
              <button type="button" onClick={openPickProductForPurchaseOrderLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
                <FiSearch size={19} color="#ffffff" />
              </button>
            </div>

            <div style={customerModuleStyles.formBody}>
              <LabeledField
                label="Product"
                as="button"
                onClick={openPickProductForPurchaseOrderLine}
                rightElement={<FiChevronRight size={18} color="#94A3B8" />}
              >
                {purchaseOrderProductLineForm.name || 'Select Product'}
              </LabeledField>

              <LabeledField
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="1"
                value={purchaseOrderProductLineForm.qty}
                onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
              />

              <LabeledField
                label="Price"
                type="number"
                inputMode="decimal"
                value={purchaseOrderProductLineForm.price}
                onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
              />

              <div>
                <LabeledField
                  label="Description"
                  as="textarea"
                  value={purchaseOrderProductLineForm.description}
                  onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                  maxLength={2000}
                />
                <div style={customerModuleStyles.charCount}>{purchaseOrderProductLineForm.description.length}/2000</div>
              </div>

              <button type="button" onClick={handleAddPurchaseOrderProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
                Add To Purchase Order
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

      // ----- Pick Product sub-screen (choosing which product to add to a Purchase Order line) -----
      if (quotationSubView === 'pickProductForPurchaseOrderLine') {
        return (
          <div style={{ ...customerModuleStyles.screen}}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProductForPurchaseOrderLine(product)}
                    style={customerModuleStyles.productCard}
                  >
                    <div style={customerModuleStyles.productCardTopRow}>
                      <span style={customerModuleStyles.customerName}>{product.name}</span>
                      <FiChevronRight size={18} color="#94A3B8" />
                    </div>
                    {product.price !== undefined && product.price !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>Price</span>
                        <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                      </div>
                    )}
                    {product.gst !== undefined && product.gst !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>GST</span>
                        <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddProduct('pickProductForPurchaseOrderLine')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Select Terms and Conditions sub-screen (used from Make Purchase Order) -----
      if (quotationSubView === 'selectTermsForPurchaseOrder') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
              <button type="button" onClick={() => openAddTermsModal('purchaseOrder')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Purchase Order</span>
            </div>

            <div style={customerModuleStyles.body}>
              {purchaseOrderTerms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                purchaseOrderTerms.map((term) => {
                  const selected = purchaseOrderTermsDraftSelectedIds.includes(term.id);
                  return (
                    <div
                      key={term.id}
                      style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <button
                        type="button"
                        onClick={() => togglePurchaseOrderTermsDraftSelection(term.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                      >
                        {term.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term, 'purchaseOrder')}
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
              <button type="button" onClick={handleDoneSelectPurchaseOrderTerms} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isAddTermsModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Add Terms and condition</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                  <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Purchase Order</div>
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

      // ----- Make Purchase Order sub-screen -----
      if (quotationSubView === 'makePurchaseOrder') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button
                type="button"
                onClick={() => {
                  if (editingPurchaseOrderId) { setEditingPurchaseOrderId(null); setQuotationSubView('purchaseOrderDetail'); }
                  else { setQuotationSubView(null); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingPurchaseOrderId ? 'Update Purchase Order' : 'Make Purchase Order'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={makeQuotationStyles.infoRow}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Purchase Order Date</span>
                    <div style={makeQuotationStyles.infoValue}>{purchaseOrderForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Purchase Order No</span>
                    <div style={makeQuotationStyles.infoValue}>{purchaseOrderForm.purchaseOrderNo || '-'}</div>
                  </div>
                </div>
                <div style={makeQuotationStyles.otherInfoRow}>
                  <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                  <input
                    type="text"
                    value={purchaseOrderForm.otherInfo}
                    onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                    style={makeQuotationStyles.otherInfoInput}
                  />
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForPurchaseOrder} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedPurchaseOrderCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedPurchaseOrderCustomer.name}</p>
                    {selectedPurchaseOrderCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedPurchaseOrderCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <div style={makeQuotationStyles.sectionCard}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPickProductForPurchaseOrderLine}
                  style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
                >
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {purchaseOrderForm.products.length > 0 && (
                  <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                    {purchaseOrderForm.products.map((p) => {
                      const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                      const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                      const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      return (
                        <div
                          key={p.productId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditPurchaseOrderProductLine(p)}
                          style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removePurchaseOrderProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                            <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button type="button" onClick={openPurchaseOrderOtherChargeModal} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {purchaseOrderForm.otherCharges.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {purchaseOrderForm.otherCharges.map((c) => (
                      <div key={c.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{c.label}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removePurchaseOrderOtherCharge(c.id); }}
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label={`Remove ${c.label}`}
                          >
                            <FiTrash2 size={16} color="#DC2626" />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openSelectTermsForPurchaseOrder} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedPurchaseOrderTerms.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {selectedPurchaseOrderTerms.map((term) => (
                      <div key={term.id} style={makeQuotationStyles.lineRow}>
                        <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removePurchaseOrderSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div style={makeQuotationStyles.bottomBar}>
              <div>
                <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
                <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{purchaseOrderAmountDue}</div>
              </div>
              <button type="button" onClick={handleGeneratePurchaseOrder} style={makeQuotationStyles.generateBtn}>{editingPurchaseOrderId ? 'Update' : 'Generate'}</button>
            </div>

            {isPurchaseOrderOtherChargeModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsPurchaseOrderOtherChargeModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Other Charge Info</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>Other Charge Label</span>
                  <input
                    type="text"
                    value={purchaseOrderOtherChargeForm.label}
                    onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                    style={customerModuleStyles.fieldInput}
                  />
                  <input
                    type="number"
                    value={purchaseOrderOtherChargeForm.amount}
                    onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Other Charge Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <div style={customerModuleStyles.taxableRow}>
                    <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                    <input
                      type="checkbox"
                      checked={purchaseOrderOtherChargeForm.taxable}
                      onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                      style={customerModuleStyles.checkbox}
                    />
                  </div>
                  <button type="button" onClick={handleSavePurchaseOrderOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
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

      // ----- Purchase Order List sub-screen -----
      if (quotationSubView === 'purchaseOrderList') {
        const searchPurchaseOrder = (q) => {
          const qs = purchaseOrderSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return q.customerName.toLowerCase().includes(qs) || 
                 (q.purchaseOrderNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Purchase Order</h1>
              {renderSortMenu()}
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={purchaseOrderSearchQuery}
                  onChange={(e) => setPurchaseOrderSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Purchase Order#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {purchaseOrders.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>No purchase orders generated yet.</p>
              ) : (
                sortDocumentsByCreated(purchaseOrders.filter(searchPurchaseOrder)).map((q) => (
                  <DocumentListCard
                    key={q.id}
                    onClick={() => { setSelectedPurchaseOrderId(q.id); setQuotationSubView('purchaseOrderDetail'); }}
                    name={q.customerName}
                    docNumber={q.purchaseOrderNo || 'PO-' + q.id.slice(0, 4)}
                    date={q.date}
                    amount={q.grandTotal}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={() => { setEditingPurchaseOrderId(null); setPurchaseOrderForm({ ...emptyPurchaseOrderForm(), purchaseOrderNo: getNextPurchaseOrderNumber() }); setQuotationSubView('makePurchaseOrder'); }} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Purchase<br />Order</span>
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

      // ----- Purchase Order Detail sub-screen -----
      if (quotationSubView === 'purchaseOrderDetail') {
        const currentPurchaseOrder = purchaseOrders.find(q => q.id === selectedPurchaseOrderId);
        if (!currentPurchaseOrder) {
          setQuotationSubView('purchaseOrderList');
          return null;
        }

        return (
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('purchaseOrderList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Purchase Order Detail</h1>
              <button type="button" onClick={() => handleSharePurchaseOrder(currentPurchaseOrder)} aria-label="Share purchase order" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
                <div style={docStyles.page}>
                  <GeneratedDocumentPreview model={buildPurchaseOrderDocModel(currentPurchaseOrder)} />
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicatePurchaseOrder(currentPurchaseOrder)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditPurchaseOrder(currentPurchaseOrder)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button
                onClick={() => {
                  showConfirm('Delete this purchase order?', async () => {
                    const previous = purchaseOrders;
                    const deletedId = selectedPurchaseOrderId;
                    persistPurchaseOrders(purchaseOrders.filter(o => o.id !== deletedId));
                    setQuotationSubView('purchaseOrderList');
                    try {
                      await purchaseOrdersService.deletePurchaseOrder(deletedId);
                    } catch (error) {
                      console.error('Error deleting purchase order:', error);
                      persistPurchaseOrders(previous);
                      showAlert('Could not delete the purchase order. Please try again.');
                    }
                  });
                }}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
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

      if (quotationSubView === 'selectCustomerForProformaInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForProformaInvoice(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForProformaInvoice')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
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

            <button type="button" onClick={() => openAddCustomer('selectCustomerForProformaInvoice')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Add Proforma Invoice Product sub-screen (Product / Quantity / Price / Description) -----
      if (quotationSubView === 'addProformaInvoiceProductLine') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingProformaInvoiceProductLineId ? 'Edit Proforma Invoice Product' : 'Add Proforma Invoice Product'}</h1>
              <button type="button" onClick={openPickProductForProformaInvoiceLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
                <FiSearch size={19} color="#ffffff" />
              </button>
            </div>

            <div style={customerModuleStyles.formBody}>
              <LabeledField
                label="Product"
                as="button"
                onClick={openPickProductForProformaInvoiceLine}
                rightElement={<FiChevronRight size={18} color="#94A3B8" />}
              >
                {proformaInvoiceProductLineForm.name || 'Select Product'}
              </LabeledField>

              <LabeledField
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="1"
                value={proformaInvoiceProductLineForm.qty}
                onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
              />

              <LabeledField
                label="Price"
                type="number"
                inputMode="decimal"
                value={proformaInvoiceProductLineForm.price}
                onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
              />

              <div>
                <LabeledField
                  label="Description"
                  as="textarea"
                  value={proformaInvoiceProductLineForm.description}
                  onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                  maxLength={2000}
                />
                <div style={customerModuleStyles.charCount}>{proformaInvoiceProductLineForm.description.length}/2000</div>
              </div>

              <button type="button" onClick={handleAddProformaInvoiceProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
                Add To Proforma Invoice
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

      // ----- Pick Product sub-screen (choosing which product to add to a Proforma Invoice line) -----
      if (quotationSubView === 'pickProductForProformaInvoiceLine') {
        return (
          <div style={{ ...customerModuleStyles.screen}}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProductForProformaInvoiceLine(product)}
                    style={customerModuleStyles.productCard}
                  >
                    <div style={customerModuleStyles.productCardTopRow}>
                      <span style={customerModuleStyles.customerName}>{product.name}</span>
                      <FiChevronRight size={18} color="#94A3B8" />
                    </div>
                    {product.price !== undefined && product.price !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>Price</span>
                        <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                      </div>
                    )}
                    {product.gst !== undefined && product.gst !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>GST</span>
                        <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddProduct('pickProductForProformaInvoiceLine')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Select Terms and Conditions sub-screen (used from Make Proforma Invoice) -----
      if (quotationSubView === 'selectTermsForProformaInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
              <button type="button" onClick={() => openAddTermsModal('proformaInvoice')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Proforma Invoice</span>
            </div>

            <div style={customerModuleStyles.body}>
              {proformaInvoiceTerms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                proformaInvoiceTerms.map((term) => {
                  const selected = proformaInvoiceTermsDraftSelectedIds.includes(term.id);
                  return (
                    <div
                      key={term.id}
                      style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleProformaInvoiceTermsDraftSelection(term.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                      >
                        {term.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term, 'proformaInvoice')}
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
              <button type="button" onClick={handleDoneSelectProformaInvoiceTerms} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isAddTermsModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Add Terms and condition</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                  <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Proforma Invoice</div>
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

      // ----- Make Proforma Invoice sub-screen -----
      if (quotationSubView === 'makeProformaInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button
                type="button"
                onClick={() => {
                  if (editingProformaInvoiceId) { setEditingProformaInvoiceId(null); setQuotationSubView('proformaInvoiceDetail'); }
                  else { setQuotationSubView(null); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingProformaInvoiceId ? 'Update Proforma Invoice' : 'Make Proforma Invoice'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={makeQuotationStyles.infoRow}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Proforma Invoice Date</span>
                    <div style={makeQuotationStyles.infoValue}>{proformaInvoiceForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Proforma Invoice No</span>
                    <div style={makeQuotationStyles.infoValue}>{proformaInvoiceForm.proformaInvoiceNo || '-'}</div>
                  </div>
                </div>
                <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Due Date</span>
                    <input
                      type="text"
                      value={proformaInvoiceForm.dueDate}
                      onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      placeholder="-"
                      style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>PO No</span>
                    <input
                      type="text"
                      value={proformaInvoiceForm.poNo}
                      onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, poNo: e.target.value }))}
                      placeholder="-"
                      style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, textAlign: 'right', width: '140px', marginLeft: 'auto' }}
                    />
                  </div>
                </div>
                <div style={makeQuotationStyles.otherInfoRow}>
                  <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                  <input
                    type="text"
                    value={proformaInvoiceForm.otherInfo}
                    onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                    style={makeQuotationStyles.otherInfoInput}
                  />
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForProformaInvoice} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>BILL TO (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedProformaInvoiceCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedProformaInvoiceCustomer.name}</p>
                    {selectedProformaInvoiceCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedProformaInvoiceCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <div style={makeQuotationStyles.sectionCard}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPickProductForProformaInvoiceLine}
                  style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
                >
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {proformaInvoiceForm.products.length > 0 && (
                  <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                    {proformaInvoiceForm.products.map((p) => {
                      const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                      const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                      const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      return (
                        <div
                          key={p.productId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditProformaInvoiceProductLine(p)}
                          style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeProformaInvoiceProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                            <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button type="button" onClick={openProformaInvoiceOtherChargeModal} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {proformaInvoiceForm.otherCharges.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {proformaInvoiceForm.otherCharges.map((c) => (
                      <div key={c.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{c.label}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeProformaInvoiceOtherCharge(c.id); }}
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label={`Remove ${c.label}`}
                          >
                            <FiTrash2 size={16} color="#DC2626" />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openSelectTermsForProformaInvoice} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedProformaInvoiceTerms.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {selectedProformaInvoiceTerms.map((term) => (
                      <div key={term.id} style={makeQuotationStyles.lineRow}>
                        <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeProformaInvoiceSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openProformaPaidInfoList} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>PAID INFO</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {proformaInvoiceForm.paidInfo.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {proformaInvoiceForm.paidInfo.map((p) => (
                      <div key={p.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{p.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeProformaPaidInfoLine(p.id); }}
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label="Remove paid info"
                          >
                            <FiTrash2 size={16} color="#DC2626" />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div style={makeQuotationStyles.bottomBar}>
              <div>
                <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
                <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{proformaInvoiceAmountDue}</div>
              </div>
              <button type="button" onClick={handleGenerateProformaInvoice} style={makeQuotationStyles.generateBtn}>{editingProformaInvoiceId ? 'Update' : 'Generate'}</button>
            </div>

            {isProformaInvoiceOtherChargeModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsProformaInvoiceOtherChargeModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Other Charge Info</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>Other Charge Label</span>
                  <input
                    type="text"
                    value={proformaInvoiceOtherChargeForm.label}
                    onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                    style={customerModuleStyles.fieldInput}
                  />
                  <input
                    type="number"
                    value={proformaInvoiceOtherChargeForm.amount}
                    onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Other Charge Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <div style={customerModuleStyles.taxableRow}>
                    <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                    <input
                      type="checkbox"
                      checked={proformaInvoiceOtherChargeForm.taxable}
                      onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                      style={customerModuleStyles.checkbox}
                    />
                  </div>
                  <button type="button" onClick={handleSaveProformaInvoiceOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
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

      // ----- Proforma Paid Info List sub-screen -----
      if (quotationSubView === 'proformaPaidInfoList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Paid Info List</h1>
              <button type="button" onClick={openAddProformaPaidInfoModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '90px' }}>
              {proformaInvoiceForm.paidInfo.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any paid info</p>
              ) : (
                proformaInvoiceForm.paidInfo.map((p) => {
                  const isSelected = selectedProformaPaidInfoIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProformaPaidInfoSelection(p.id)}
                      style={{ ...customerModuleStyles.customerCard, ...(isSelected ? customerModuleStyles.termCardSelected : {}) }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={customerModuleStyles.customerName}>{'\u20B9'}{p.amount}</span>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{p.date}</span>
                        </div>
                        {p.note && <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{p.note}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeProformaPaidInfoLine(p.id); }}
                        style={{ ...customerModuleStyles.editBadgeBtn, background: '#DC2626', marginLeft: '10px' }}
                        aria-label="Delete paid info"
                      >
                        <FiTrash2 size={14} color="#ffffff" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={customerModuleStyles.doneBtnWrap}>
              <button type="button" onClick={handleDoneProformaPaidInfoList} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isProformaPaidInfoModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsProformaPaidInfoModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Paid Info</h3>
                  <button
                    type="button"
                    onClick={() => { setProformaPaidInfoCalendarMonth(parseQuotationDate(proformaPaidInfoForm.date) || new Date()); setIsProformaPaidInfoDatePickerOpen(true); }}
                    style={{ ...customerModuleStyles.fieldInput, textAlign: 'left', cursor: 'pointer', color: proformaPaidInfoForm.date ? '#0F172A' : '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{proformaPaidInfoForm.date || t('selectDatePlaceholder')}</span>
                    <span style={{ fontSize: '15px' }}>&#128197;</span>
                  </button>
                  <input
                    type="number"
                    value={proformaPaidInfoForm.amount}
                    onChange={(e) => setProformaPaidInfoForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <textarea
                    value={proformaPaidInfoForm.note}
                    onChange={(e) => setProformaPaidInfoForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Note"
                    style={customerModuleStyles.descriptionTextarea}
                  />
                  <button type="button" onClick={handleSaveProformaPaidInfo} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
                </div>
              </div>
            )}

            {/* ============ PROFORMA PAID INFO DATE CALENDAR POPUP ============ */}
            {isProformaPaidInfoDatePickerOpen && (() => {
              const maxDateStr = toLocalISODate(new Date());
              const year = proformaPaidInfoCalendarMonth.getFullYear();
              const month = proformaPaidInfoCalendarMonth.getMonth();
              const firstWeekday = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstWeekday; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              const rows = [];
              for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

              return (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ backgroundColor: '#0B3C9B', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                      <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                      <div style={{ fontSize: '21px', fontWeight: '700' }}>{proformaPaidInfoForm.date ? proformaPaidInfoForm.date : t('selectDatePlaceholder')}</div>
                    </div>
                    <div style={{ padding: '16px 18px 4px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <button onClick={() => setProformaPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{proformaPaidInfoCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setProformaPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
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
                            const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const displayStr = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                            const isDisabled = isoStr > maxDateStr;
                            const isSelected = proformaPaidInfoForm.date === displayStr;
                            return (
                              <div
                                key={ci}
                                onClick={() => { if (isDisabled) return; setProformaPaidInfoForm((prev) => ({ ...prev, date: displayStr })); setIsProformaPaidInfoDatePickerOpen(false); }}
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
                      <button onClick={() => setIsProformaPaidInfoDatePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('cancel')}</button>
                    </div>
                  </div>
                </div>
              );
            })()}

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

      // ----- Proforma Invoice List sub-screen -----
      if (quotationSubView === 'proformaInvoiceList') {
        const searchProformaInvoice = (q) => {
          const qs = proformaInvoiceSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return q.customerName.toLowerCase().includes(qs) || 
                 (q.proformaInvoiceNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Proforma Invoice</h1>
              {renderSortMenu()}
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={proformaInvoiceSearchQuery}
                  onChange={(e) => setProformaInvoiceSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Proforma#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {proformaInvoices.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>No proforma invoices generated yet.</p>
              ) : (
                sortDocumentsByCreated(proformaInvoices.filter(searchProformaInvoice)).map((q) => (
                  <DocumentListCard
                    key={q.id}
                    onClick={() => { setSelectedProformaInvoiceId(q.id); setQuotationSubView('proformaInvoiceDetail'); }}
                    name={q.customerName}
                    docNumber={q.proformaInvoiceNo || 'PI-' + q.id.slice(0, 4)}
                    date={q.date}
                    amount={q.grandTotal}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={() => { setEditingProformaInvoiceId(null); setProformaInvoiceForm({ ...emptyProformaInvoiceForm(), proformaInvoiceNo: getNextProformaInvoiceNumber() }); setQuotationSubView('makeProformaInvoice'); }} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Proforma<br />Invoice</span>
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

      // ----- Proforma Invoice Detail sub-screen -----
      if (quotationSubView === 'proformaInvoiceDetail') {
        const currentProformaInvoice = proformaInvoices.find(q => q.id === selectedProformaInvoiceId);
        if (!currentProformaInvoice) {
          setQuotationSubView('proformaInvoiceList');
          return null;
        }

        return (
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('proformaInvoiceList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Proforma Invoice Detail</h1>
              <button type="button" onClick={() => handleShareProformaInvoice(currentProformaInvoice)} aria-label="Share proforma invoice" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
                <div style={docStyles.page}>
                  <GeneratedDocumentPreview model={buildProformaInvoiceDocModel(currentProformaInvoice)} />
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicateProformaInvoice(currentProformaInvoice)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditProformaInvoice(currentProformaInvoice)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button onClick={() => setShowProformaInvoiceConvertSheet(true)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
                <span style={docActionBarStyles.label}>Convert</span>
              </button>
              <button
                onClick={() => {
  showConfirm('Delete this proforma invoice?', async () => {
    const previous = proformaInvoices;
    const deletedId = selectedProformaInvoiceId;
    persistProformaInvoices(proformaInvoices.filter(inv => inv.id !== deletedId));
    setQuotationSubView('proformaInvoiceList');
    try {
      await proformaInvoicesService.deleteProformaInvoice(deletedId);
    } catch (error) {
      console.error('Error deleting proforma invoice:', error);
      persistProformaInvoices(previous);
      showAlert('Could not delete the proforma invoice. Please try again.');
    }
  });
}}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
              </button>
            </div>

            {/* CONVERSION BOTTOM SHEET (Convert click) */}
            {showProformaInvoiceConvertSheet && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowProformaInvoiceConvertSheet(false)}>
                <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Proforma Invoice to...</h3>

                  <button
                    onClick={() => {
                      setShowProformaInvoiceConvertSheet(false);
                      const newId = genId();
                      const newInvoice = {
                        id: newId,
                        invoiceNo: getNextInvoiceNumber(),
                        date: formatQuotationDate(new Date()),
                        dueDate: currentProformaInvoice.dueDate || '', poNo: currentProformaInvoice.poNo || '', otherInfo: currentProformaInvoice.otherInfo || '',
                        customerId: currentProformaInvoice.customerId,
                        products: currentProformaInvoice.products || [],
                        otherCharges: currentProformaInvoice.otherCharges || [],
                        termsIds: currentProformaInvoice.termsIds || [],
                        paidInfo: [],
                        grandTotal: currentProformaInvoice.grandTotal,
                        paidTotal: 0,
                        balanceDue: currentProformaInvoice.grandTotal,
                        status: 'Unpaid',
                        createdAt: new Date().toISOString(),
                        customerName: currentProformaInvoice.customerName,
                        customerCompany: currentProformaInvoice.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(invoiceSettings),
                      };
                      persistInvoices([...invoices, newInvoice]);
                      showSuccess('Converted to Invoice successfully.');
                      setSelectedInvoiceId(newId);
                      setQuotationSubView('invoiceDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowProformaInvoiceConvertSheet(false);
                      const newId = genId();
                      const newDeliveryNote = {
                        id: newId,
                        deliveryNoteNo: getNextDeliveryNoteNumber(),
                        date: formatQuotationDate(new Date()),
                        refNo: currentProformaInvoice.proformaInvoiceNo || '',
                        otherInfo: currentProformaInvoice.otherInfo || '',
                        customerId: currentProformaInvoice.customerId,
                        products: currentProformaInvoice.products || [],
                        termsIds: [],
                        createdAt: new Date().toISOString(),
                        customerName: currentProformaInvoice.customerName,
                        customerCompany: currentProformaInvoice.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(deliveryNoteSettings),
                      };
                      persistDeliveryNotes([...deliveryNotes, newDeliveryNote]);
                      showSuccess('Converted to Delivery Note successfully.');
                      setSelectedDeliveryNoteId(newId);
                      setQuotationSubView('deliveryNoteDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Delivery Note
                  </button>
                  <button
                    onClick={() => {
                      setShowProformaInvoiceConvertSheet(false);
                      const newId = genId();
                      const newReceipt = {
                        id: newId,
                        receiptNo: getNextReceiptNumber(),
                        date: formatQuotationDate(new Date()),
                        customerId: currentProformaInvoice.customerId,
                        paymentMode: '',
                        referenceNo: currentProformaInvoice.proformaInvoiceNo || '',
                        paidAmount: currentProformaInvoice.grandTotal,
                        paymentFor: `Proforma Invoice ${currentProformaInvoice.proformaInvoiceNo || ''}`.trim(),
                        createdAt: new Date().toISOString(),
                        customerName: currentProformaInvoice.customerName,
                        customerCompany: currentProformaInvoice.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(receiptSettings),
                      };
                      persistReceipts([...receipts, newReceipt]);
                      showSuccess('Converted to Receipt successfully.');
                      setSelectedReceiptId(newId);
                      setQuotationSubView('receiptDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Receipt
                  </button>
                  <button onClick={() => setShowProformaInvoiceConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
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

      // ----- Select Customer sub-screen (used from Make Delivery Note) -----
      if (quotationSubView === 'selectCustomerForDeliveryNote') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForDeliveryNote(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForDeliveryNote')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
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

            <button type="button" onClick={() => openAddCustomer('selectCustomerForDeliveryNote')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Add Delivery Note Product sub-screen (Product / Quantity / Price / Description) -----
      if (quotationSubView === 'addDeliveryNoteProductLine') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingDeliveryNoteProductLineId ? 'Edit Delivery Note Product' : 'Add Delivery Note Product'}</h1>
              <button type="button" onClick={openPickProductForDeliveryNoteLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
                <FiSearch size={19} color="#ffffff" />
              </button>
            </div>

            <div style={customerModuleStyles.formBody}>
              <LabeledField
                label="Product"
                as="button"
                onClick={openPickProductForDeliveryNoteLine}
                rightElement={<FiChevronRight size={18} color="#94A3B8" />}
              >
                {deliveryNoteProductLineForm.name || 'Select Product'}
              </LabeledField>

              <LabeledField
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="1"
                value={deliveryNoteProductLineForm.qty}
                onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
              />

              <LabeledField
                label="Price"
                type="number"
                inputMode="decimal"
                value={deliveryNoteProductLineForm.price}
                onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
              />

              <div>
                <LabeledField
                  label="Description"
                  as="textarea"
                  value={deliveryNoteProductLineForm.description}
                  onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                  maxLength={2000}
                />
                <div style={customerModuleStyles.charCount}>{deliveryNoteProductLineForm.description.length}/2000</div>
              </div>

              <button type="button" onClick={handleAddDeliveryNoteProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
                Add To Delivery Note
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

      // ----- Pick Product sub-screen (choosing which product to add to a Delivery Note line) -----
      if (quotationSubView === 'pickProductForDeliveryNoteLine') {
        return (
          <div style={{ ...customerModuleStyles.screen}}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProductForDeliveryNoteLine(product)}
                    style={customerModuleStyles.productCard}
                  >
                    <div style={customerModuleStyles.productCardTopRow}>
                      <span style={customerModuleStyles.customerName}>{product.name}</span>
                      <FiChevronRight size={18} color="#94A3B8" />
                    </div>
                    {product.price !== undefined && product.price !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>Price</span>
                        <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                      </div>
                    )}
                    {product.gst !== undefined && product.gst !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>GST</span>
                        <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddProduct('pickProductForDeliveryNoteLine')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Select Terms and Conditions sub-screen (used from Make Delivery Note) -----
      if (quotationSubView === 'selectTermsForDeliveryNote') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
              <button type="button" onClick={() => openAddTermsModal('deliveryNote')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Delivery Note</span>
            </div>

            <div style={customerModuleStyles.body}>
              {deliveryNoteTerms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                deliveryNoteTerms.map((term) => {
                  const selected = deliveryNoteTermsDraftSelectedIds.includes(term.id);
                  return (
                    <div
                      key={term.id}
                      style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDeliveryNoteTermsDraftSelection(term.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                      >
                        {term.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term, 'deliveryNote')}
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
              <button type="button" onClick={handleDoneSelectDeliveryNoteTerms} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isAddTermsModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Add Terms and condition</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                  <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Delivery Note</div>
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

      // ----- Make Delivery Note sub-screen -----
      if (quotationSubView === 'makeDeliveryNote') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button
                type="button"
                onClick={() => {
                  if (editingDeliveryNoteId) { setEditingDeliveryNoteId(null); setQuotationSubView('deliveryNoteDetail'); }
                  else { setQuotationSubView(null); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingDeliveryNoteId ? 'Update Delivery Note' : 'Make Delivery Note'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={makeQuotationStyles.infoRow}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Delivery Note Date</span>
                    <div style={makeQuotationStyles.infoValue}>{deliveryNoteForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Delivery Note No</span>
                    <div style={makeQuotationStyles.infoValue}>{deliveryNoteForm.deliveryNoteNo || '-'}</div>
                  </div>
                </div>
                <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Ref No</span>
                    <input
                      type="text"
                      value={deliveryNoteForm.refNo}
                      onChange={(e) => setDeliveryNoteForm((prev) => ({ ...prev, refNo: e.target.value }))}
                      placeholder="-"
                      style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                    />
                  </div>
                </div>
                <div style={makeQuotationStyles.otherInfoRow}>
                  <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                  <input
                    type="text"
                    value={deliveryNoteForm.otherInfo}
                    onChange={(e) => setDeliveryNoteForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                    style={makeQuotationStyles.otherInfoInput}
                  />
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForDeliveryNote} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedDeliveryNoteCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedDeliveryNoteCustomer.name}</p>
                    {selectedDeliveryNoteCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedDeliveryNoteCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <div style={makeQuotationStyles.sectionCard}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPickProductForDeliveryNoteLine}
                  style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
                >
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {deliveryNoteForm.products.length > 0 && (
                  <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '8px' }}>
                    {deliveryNoteForm.products.map((p) => (
                      <div
                        key={p.productId}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditDeliveryNoteProductLine(p)}
                        style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{p.name} x{p.qty}{p.unit ? ` ${p.unit}` : ''}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeDeliveryNoteProductLine(p.productId); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${p.name}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={openSelectTermsForDeliveryNote} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedDeliveryNoteTerms.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {selectedDeliveryNoteTerms.map((term) => (
                      <div key={term.id} style={makeQuotationStyles.lineRow}>
                        <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeDeliveryNoteSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div style={{ ...makeQuotationStyles.bottomBar, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleGenerateDeliveryNote} style={makeQuotationStyles.generateBtn}>{editingDeliveryNoteId ? 'Update' : 'Generate'}</button>
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

      // ----- Delivery Note List sub-screen -----
      if (quotationSubView === 'deliveryNoteList') {
        const searchDeliveryNote = (q) => {
          const qs = deliveryNoteSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return q.customerName.toLowerCase().includes(qs) || 
                 (q.deliveryNoteNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Delivery Note</h1>
              {renderSortMenu()}
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={deliveryNoteSearchQuery}
                  onChange={(e) => setDeliveryNoteSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Delivery Note#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {deliveryNotes.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>No delivery notes generated yet.</p>
              ) : (
                sortDocumentsByCreated(deliveryNotes.filter(searchDeliveryNote)).map((q) => (
                  <DocumentListCard
                    key={q.id}
                    onClick={() => { setSelectedDeliveryNoteId(q.id); setQuotationSubView('deliveryNoteDetail'); }}
                    name={q.customerName}
                    docNumber={q.deliveryNoteNo || 'DN-' + q.id.slice(0, 4)}
                    date={q.date}
                    amountText={`${q.products.length} item${q.products.length === 1 ? '' : 's'}`}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={openMakeDeliveryNote} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Delivery<br />Note</span>
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

      // ----- Delivery Note Detail sub-screen -----
      if (quotationSubView === 'deliveryNoteDetail') {
        const currentDeliveryNote = deliveryNotes.find(q => q.id === selectedDeliveryNoteId);
        if (!currentDeliveryNote) {
          setQuotationSubView('deliveryNoteList');
          return null;
        }

        return (
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('deliveryNoteList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Delivery Note Detail</h1>
              <button type="button" onClick={() => handleShareDeliveryNote(currentDeliveryNote)} aria-label="Share delivery note" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
                <div style={docStyles.page}>
                  <GeneratedDocumentPreview model={buildDeliveryNoteDocModel(currentDeliveryNote)} />
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicateDeliveryNote(currentDeliveryNote)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditDeliveryNote(currentDeliveryNote)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button
                onClick={() => {
  showConfirm('Delete this delivery note?', async () => {
    const previous = deliveryNotes;
    const deletedId = selectedDeliveryNoteId;
    persistDeliveryNotes(deliveryNotes.filter(dn => dn.id !== deletedId));
    setQuotationSubView('deliveryNoteList');
    try {
      await deliveryNotesService.deleteDeliveryNote(deletedId);
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      persistDeliveryNotes(previous);
      showAlert('Could not delete the delivery note. Please try again.');
    }
  });
}}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
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

      // ----- Select Customer sub-screen (used from Make Invoice) -----
      if (quotationSubView === 'selectCustomerForInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForInvoice(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForInvoice')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
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

            <button type="button" onClick={() => openAddCustomer('selectCustomerForInvoice')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Add Invoice Product sub-screen (Product / Quantity / Price / Description) -----
      if (quotationSubView === 'addInvoiceProductLine') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingInvoiceProductLineId ? 'Edit Invoice Product' : 'Add Invoice Product'}</h1>
              <button type="button" onClick={openPickProductForInvoiceLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
                <FiSearch size={19} color="#ffffff" />
              </button>
            </div>

            <div style={customerModuleStyles.formBody}>
              <LabeledField
                label="Product"
                as="button"
                onClick={openPickProductForInvoiceLine}
                rightElement={<FiChevronRight size={18} color="#94A3B8" />}
              >
                {invoiceProductLineForm.name || 'Select Product'}
              </LabeledField>

              <LabeledField
                label="Quantity"
                type="number"
                inputMode="decimal"
                min="1"
                value={invoiceProductLineForm.qty}
                onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
              />

              <LabeledField
                label="Price"
                type="number"
                inputMode="decimal"
                value={invoiceProductLineForm.price}
                onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
              />

              <div>
                <LabeledField
                  label="Description"
                  as="textarea"
                  value={invoiceProductLineForm.description}
                  onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                  maxLength={2000}
                />
                <div style={customerModuleStyles.charCount}>{invoiceProductLineForm.description.length}/2000</div>
              </div>

              <button type="button" onClick={handleAddInvoiceProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
                Add To Invoice
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

      // ----- Pick Product sub-screen (choosing which product to add to a Invoice line) -----
      if (quotationSubView === 'pickProductForInvoiceLine') {
        return (
          <div style={{ ...customerModuleStyles.screen}}>
            <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
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
                sortByName(filteredProducts, (p) => p.name).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handlePickProductForInvoiceLine(product)}
                    style={customerModuleStyles.productCard}
                  >
                    <div style={customerModuleStyles.productCardTopRow}>
                      <span style={customerModuleStyles.customerName}>{product.name}</span>
                      <FiChevronRight size={18} color="#94A3B8" />
                    </div>
                    {product.price !== undefined && product.price !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>Price</span>
                        <span style={customerModuleStyles.productDetailValue}>{'\u20B9'}{product.price}</span>
                      </div>
                    )}
                    {product.gst !== undefined && product.gst !== '' && (
                      <div style={customerModuleStyles.productDetailRow}>
                        <span style={customerModuleStyles.productDetailLabel}>GST</span>
                        <span style={customerModuleStyles.productDetailValue}>{product.gst}%</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <button type="button" onClick={() => openAddProduct('pickProductForInvoiceLine')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Select Terms and Conditions sub-screen (used from Make Invoice) -----
      if (quotationSubView === 'selectTermsForInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
              <button type="button" onClick={() => openAddTermsModal('invoice')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={customerModuleStyles.termsTabRow}>
              <span style={customerModuleStyles.termsTabActive}>Invoice</span>
            </div>

            <div style={customerModuleStyles.body}>
              {invoiceTerms.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
              ) : (
                invoiceTerms.map((term) => {
                  const selected = invoiceTermsDraftSelectedIds.includes(term.id);
                  return (
                    <div
                      key={term.id}
                      style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleInvoiceTermsDraftSelection(term.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                      >
                        {term.text}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term, 'invoice')}
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
              <button type="button" onClick={handleDoneSelectTermsInvoice} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isAddTermsModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Add Terms and condition</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                  <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Invoice</div>
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

      // ----- Paid Info List sub-screen (Matches Screenshots 2 & 3) -----
      if (quotationSubView === 'paidInfoList') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Paid Info List</h1>
              <button type="button" onClick={openAddPaidInfoModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
                <FiPlus size={18} color="#0F766E" />
              </button>
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '90px' }}>
              {invoiceForm.paidInfo.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any paid info</p>
              ) : (
                invoiceForm.paidInfo.map((p) => {
                  const isSelected = selectedPaidInfoIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePaidInfoSelection(p.id)}
                      style={{ ...customerModuleStyles.customerCard, ...(isSelected ? customerModuleStyles.termCardSelected : {}) }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={customerModuleStyles.customerName}>{'\u20B9'}{p.amount}</span>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{p.date}</span>
                        </div>
                        {p.note && <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{p.note}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePaidInfoLine(p.id); }}
                        style={{ ...customerModuleStyles.editBadgeBtn, background: '#DC2626', marginLeft: '10px' }}
                        aria-label="Delete paid info"
                      >
                        <FiTrash2 size={14} color="#ffffff" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={customerModuleStyles.doneBtnWrap}>
              <button type="button" onClick={handleDonePaidInfoList} style={customerModuleStyles.doneBtn}>DONE</button>
            </div>

            {isPaidInfoModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsPaidInfoModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Paid Info</h3>
                  <button
                    type="button"
                    onClick={() => { setPaidInfoCalendarMonth(parseQuotationDate(paidInfoForm.date) || new Date()); setIsPaidInfoDatePickerOpen(true); }}
                    style={{ ...customerModuleStyles.fieldInput, textAlign: 'left', cursor: 'pointer', color: paidInfoForm.date ? '#0F172A' : '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{paidInfoForm.date || t('selectDatePlaceholder')}</span>
                    <span style={{ fontSize: '15px' }}>&#128197;</span>
                  </button>
                  <input
                    type="number"
                    value={paidInfoForm.amount}
                    onChange={(e) => setPaidInfoForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <textarea
                    value={paidInfoForm.note}
                    onChange={(e) => setPaidInfoForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Note"
                    style={customerModuleStyles.descriptionTextarea}
                  />
                  <button type="button" onClick={handleSavePaidInfo} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
                </div>
              </div>
            )}

            {/* ============ PAID INFO DATE CALENDAR POPUP ============ */}
            {isPaidInfoDatePickerOpen && (() => {
              const maxDateStr = toLocalISODate(new Date());
              const year = paidInfoCalendarMonth.getFullYear();
              const month = paidInfoCalendarMonth.getMonth();
              const firstWeekday = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstWeekday; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              const rows = [];
              for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

              return (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ backgroundColor: '#0B3C9B', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                      <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                      <div style={{ fontSize: '21px', fontWeight: '700' }}>{paidInfoForm.date ? paidInfoForm.date : t('selectDatePlaceholder')}</div>
                    </div>
                    <div style={{ padding: '16px 18px 4px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <button onClick={() => setPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{paidInfoCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
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
                            const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const displayStr = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                            const isDisabled = isoStr > maxDateStr;
                            const isSelected = paidInfoForm.date === displayStr;
                            return (
                              <div
                                key={ci}
                                onClick={() => { if (isDisabled) return; setPaidInfoForm((prev) => ({ ...prev, date: displayStr })); setIsPaidInfoDatePickerOpen(false); }}
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
                      <button onClick={() => setIsPaidInfoDatePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('cancel')}</button>
                    </div>
                  </div>
                </div>
              );
            })()}

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

      // ----- Make Invoice sub-screen (Matches Screenshot 1) -----
      if (quotationSubView === 'makeInvoice') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button
                type="button"
                onClick={() => {
                  if (editingInvoiceId) { setEditingInvoiceId(null); setQuotationSubView('invoiceDetail'); }
                  else { setQuotationSubView(null); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingInvoiceId ? 'Update Invoice' : 'Make Invoice'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={makeQuotationStyles.infoRow}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Invoice Date</span>
                    <div style={makeQuotationStyles.infoValue}>{invoiceForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Invoice No</span>
                    <div style={makeQuotationStyles.infoValue}>{invoiceForm.invoiceNo || '-'}</div>
                  </div>
                </div>
                <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Due Date</span>
                    <input
                      type="text"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      placeholder="-"
                      style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>PO No</span>
                    <input
                      type="text"
                      value={invoiceForm.poNo}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, poNo: e.target.value }))}
                      placeholder="-"
                      style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, textAlign: 'right', width: '140px', marginLeft: 'auto' }}
                    />
                  </div>
                </div>
                <div style={makeQuotationStyles.otherInfoRow}>
                  <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                  <input
                    type="text"
                    value={invoiceForm.otherInfo}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                    style={makeQuotationStyles.otherInfoInput}
                  />
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForInvoice} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>BILL TO (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedInvoiceCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedInvoiceCustomer.name}</p>
                    {selectedInvoiceCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedInvoiceCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <div style={makeQuotationStyles.sectionCard}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPickProductForInvoiceLine}
                  style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
                >
                  <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {invoiceForm.products.length > 0 && (
                  <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                    {invoiceForm.products.map((p) => {
                      const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                      const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                      const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      return (
                        <div
                          key={p.productId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditInvoiceProductLine(p)}
                          style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeInvoiceProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                            <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                            <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button type="button" onClick={openInvoiceOtherChargeModal} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {invoiceForm.otherCharges.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {invoiceForm.otherCharges.map((c) => (
                      <div key={c.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{c.label}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removeInvoiceOtherCharge(c.id); }}
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label={`Remove ${c.label}`}
                          >
                            <FiTrash2 size={16} color="#DC2626" />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openSelectTermsForInvoice} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedInvoiceTerms.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {selectedInvoiceTerms.map((term) => (
                      <div key={term.id} style={makeQuotationStyles.lineRow}>
                        <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeInvoiceSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              <button type="button" onClick={openPaidInfoList} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>PAID INFO</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {invoiceForm.paidInfo.length > 0 && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    {invoiceForm.paidInfo.map((p) => (
                      <div key={p.id} style={makeQuotationStyles.lineRow}>
                        <span style={makeQuotationStyles.sectionCardLine}>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                        <span style={makeQuotationStyles.lineRowRight}>
                          <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{p.amount}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); removePaidInfoLine(p.id); }}
                            style={makeQuotationStyles.removeIconBtn}
                            aria-label="Remove paid info"
                          >
                            <FiTrash2 size={16} color="#DC2626" />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>

            <div style={makeQuotationStyles.bottomBar}>
              <div>
                <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
                <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{invoiceAmountDue}</div>
              </div>
              <button type="button" onClick={handleGenerateInvoice} style={makeQuotationStyles.generateBtn}>{editingInvoiceId ? 'Update' : 'Generate'}</button>
            </div>

            {isInvoiceOtherChargeModalOpen && (
              <div style={customerModuleStyles.modalOverlay} onClick={() => setIsInvoiceOtherChargeModalOpen(false)}>
                <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                  <div style={customerModuleStyles.sheetHandle} />
                  <h3 style={customerModuleStyles.sheetTitle}>Other Charge Info</h3>
                  <span style={customerModuleStyles.sheetSmallLabel}>Other Charge Label</span>
                  <input
                    type="text"
                    value={invoiceOtherChargeForm.label}
                    onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                    style={customerModuleStyles.fieldInput}
                  />
                  <input
                    type="number"
                    value={invoiceOtherChargeForm.amount}
                    onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Other Charge Amount"
                    style={customerModuleStyles.fieldInput}
                  />
                  <div style={customerModuleStyles.taxableRow}>
                    <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                    <input
                      type="checkbox"
                      checked={invoiceOtherChargeForm.taxable}
                      onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                      style={customerModuleStyles.checkbox}
                    />
                  </div>
                  <button type="button" onClick={handleSaveInvoiceOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>Save</button>
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

      // ----- Invoice List sub-screen (Matches Screenshot 4) -----
      if (quotationSubView === 'invoiceList') {
        const searchInvoice = (inv) => {
          const qs = invoiceSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return inv.customerName.toLowerCase().includes(qs) ||
                 (inv.customerCompany || '').toLowerCase().includes(qs) ||
                 (inv.invoiceNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Invoice</h1>
              {renderSortMenu()}
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Invoice#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {invoices.length === 0 ? (
                <p style={customerModuleStyles.emptyText}>No invoices generated yet.</p>
              ) : (
                sortDocumentsByCreated(invoices.filter(searchInvoice)).map((inv) => (
                  <DocumentListCard
                    key={inv.id}
                    onClick={() => { setSelectedInvoiceId(inv.id); setQuotationSubView('invoiceDetail'); }}
                    name={inv.customerName}
                    docNumber={inv.invoiceNo || 'INV-' + inv.id.slice(0, 4)}
                    date={inv.date}
                    amount={inv.grandTotal}
                    status={normalizeInvoiceStatus(inv.status)}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={openMakeInvoice} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Invoice</span>
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

      // ----- Invoice Detail sub-screen -----
      if (quotationSubView === 'invoiceDetail') {
        const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
        if (!currentInvoice) {
          setQuotationSubView('invoiceList');
          return null;
        }

        return (
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('invoiceList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Invoice Detail</h1>
              <button type="button" onClick={() => handleShareInvoice(currentInvoice)} aria-label="Share invoice" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <DocumentStatusBadge status={normalizeInvoiceStatus(currentInvoice.status)} />
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
                <div style={docStyles.page}>
                  <GeneratedDocumentPreview model={buildInvoiceDocModel(currentInvoice)} />
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicateInvoice(currentInvoice)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditInvoice(currentInvoice)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button onClick={() => setShowInvoiceConvertSheet(true)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
                <span style={docActionBarStyles.label}>Convert</span>
              </button>
              <button onClick={() => setShowInvoiceStatusSheet(true)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>💬</span></span>
                <span style={docActionBarStyles.label}>Status</span>
              </button>
              <button
                onClick={() => {
                  showConfirm('Delete this invoice?', async () => {
                    const previous = invoices;
                    const deletedId = selectedInvoiceId;
                    persistInvoices(invoices.filter(inv => inv.id !== deletedId));
                    setQuotationSubView('invoiceList');
                    try {
                      await invoicesService.deleteInvoice(deletedId);
                    } catch (error) {
                      console.error('Error deleting invoice:', error);
                      persistInvoices(previous);
                      showAlert('Could not delete the invoice. Please try again.');
                    }
                  });
                }}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
              </button>
            </div>

            <DocumentStatusSheet
              open={showInvoiceStatusSheet}
              title="Invoice Status"
              options={INVOICE_STATUS_OPTIONS}
              onSelect={handleSetInvoiceStatus}
              onClose={() => setShowInvoiceStatusSheet(false)}
            />

            {/* CONVERSION BOTTOM SHEET (Convert click) */}
            {showInvoiceConvertSheet && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowInvoiceConvertSheet(false)}>
                <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Invoice to...</h3>

                  <button
                    onClick={() => {
                      setShowInvoiceConvertSheet(false);
                      const newId = genId();
                      const newDeliveryNote = {
                        id: newId,
                        deliveryNoteNo: getNextDeliveryNoteNumber(),
                        date: formatQuotationDate(new Date()),
                        refNo: currentInvoice.invoiceNo || '',
                        otherInfo: currentInvoice.otherInfo || '',
                        customerId: currentInvoice.customerId,
                        products: currentInvoice.products || [],
                        termsIds: [],
                        createdAt: new Date().toISOString(),
                        customerName: currentInvoice.customerName,
                        customerCompany: currentInvoice.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(deliveryNoteSettings),
                      };
                      persistDeliveryNotes([...deliveryNotes, newDeliveryNote]);
                      showSuccess('Converted to Delivery Note successfully.');
                      setSelectedDeliveryNoteId(newId);
                      setQuotationSubView('deliveryNoteDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Delivery Note
                  </button>
                  <button
                    onClick={() => {
                      setShowInvoiceConvertSheet(false);
                      const newId = genId();
                      const newReceipt = {
                        id: newId,
                        receiptNo: getNextReceiptNumber(),
                        date: formatQuotationDate(new Date()),
                        customerId: currentInvoice.customerId,
                        paymentMode: '',
                        referenceNo: currentInvoice.invoiceNo || '',
                        paidAmount: currentInvoice.grandTotal,
                        paymentFor: `Invoice ${currentInvoice.invoiceNo || ''}`.trim(),
                        createdAt: new Date().toISOString(),
                        customerName: currentInvoice.customerName,
                        customerCompany: currentInvoice.customerCompany,
                        docSnapshot: buildDocSettingsSnapshot(receiptSettings),
                      };
                      persistReceipts([...receipts, newReceipt]);
                      showSuccess('Converted to Receipt successfully.');
                      setSelectedReceiptId(newId);
                      setQuotationSubView('receiptDetail');
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                  >
                    Convert To Receipt
                  </button>
                  <button onClick={() => setShowInvoiceConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
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

      // ----- Select Customer sub-screen (used from Make Receipt) -----
      if (quotationSubView === 'selectCustomerForReceipt') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeReceipt')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
              {renderNameSortMenu()}
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
                sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                  <div key={customer.id} style={customerModuleStyles.customerCard}>
                    <button type="button" onClick={() => handleSelectCustomerForReceipt(customer)} style={customerModuleStyles.selectRowBtn}>
                      <span style={customerModuleStyles.customerName}>{customer.name}</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForReceipt')} style={customerModuleStyles.editBadgeBtn} aria-label="Edit customer">
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

            <button type="button" onClick={() => openAddCustomer('selectCustomerForReceipt')} style={customerModuleStyles.fab}>
              <FiPlus size={14} color="#ffffff" />
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

      // ----- Receipt Payment Info sub-screen (Matches Screenshot 3) -----
      if (quotationSubView === 'receiptPaymentInfo') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView('makeReceipt')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Receipt Payment Info</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={customerModuleStyles.formBody}>
              <p style={customerModuleStyles.sheetSmallLabel}>PAYMENT MODE</p>
              <div style={{ position: 'relative' }}>
                <select
                  value={receiptPaymentDraft.paymentMode}
                  onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paymentMode: e.target.value }))}
                  style={{ ...customerModuleStyles.fieldInput, appearance: 'none', WebkitAppearance: 'none', color: receiptPaymentDraft.paymentMode ? '#0F172A' : '#64748B', paddingRight: '40px' }}
                >
                  <option value="">Select Payment Mode</option>
                  {RECEIPT_PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
                <FiChevronDown size={18} color="#64748B" style={{ position: 'absolute', right: '16px', top: '18px', pointerEvents: 'none' }} />
              </div>

              <input
                type="text"
                value={receiptPaymentDraft.referenceNo}
                onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, referenceNo: e.target.value }))}
                placeholder="Payment Reference Number"
                style={customerModuleStyles.fieldInput}
              />

              <input
                type="number"
                value={receiptPaymentDraft.paidAmount}
                onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paidAmount: e.target.value }))}
                placeholder="Total Amount Paid"
                style={customerModuleStyles.fieldInput}
              />

              <textarea
                value={receiptPaymentDraft.paymentFor}
                onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paymentFor: e.target.value }))}
                placeholder="Payment For"
                style={{ ...customerModuleStyles.descriptionTextarea, marginBottom: '20px' }}
              />

              <button type="button" onClick={handleSaveReceiptPaymentInfo} style={customerModuleStyles.addBtn}>Save</button>
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

      // ----- Make Receipt sub-screen (Matches Screenshot 2) -----
      if (quotationSubView === 'makeReceipt') {
        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button
                type="button"
                onClick={() => {
                  if (editingReceiptId) { setEditingReceiptId(null); setQuotationSubView('receiptDetail'); }
                  else { setQuotationSubView('receiptList'); }
                }}
                aria-label="Back"
                style={customerModuleStyles.headerIconBtn}
              >
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>{editingReceiptId ? 'Update Receipt' : 'Make Receipt'}</h1>
              <span style={customerModuleStyles.headerIconBtn} />
            </div>

            <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
              <div style={makeQuotationStyles.infoPanel}>
                <div style={{ ...makeQuotationStyles.infoRow, marginBottom: 0 }}>
                  <div>
                    <span style={makeQuotationStyles.infoLabel}>Receipt Date</span>
                    <div style={makeQuotationStyles.infoValue}>{receiptForm.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={makeQuotationStyles.infoLabel}>Receipt No</span>
                    <div style={makeQuotationStyles.infoValue}>{receiptForm.receiptNo || '-'}</div>
                  </div>
                </div>
              </div>

              <button type="button" onClick={openSelectCustomerForReceipt} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>RECEIVED FROM (CUSTOMER)</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {selectedReceiptCustomer && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{selectedReceiptCustomer.name}</p>
                    {selectedReceiptCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedReceiptCustomer.companyName}</p>}
                  </div>
                )}
              </button>

              <button type="button" onClick={openReceiptPaymentInfo} style={makeQuotationStyles.sectionCard}>
                <div style={makeQuotationStyles.sectionCardTopRow}>
                  <span style={makeQuotationStyles.sectionCardLabel}>PAYMENT INFO</span>
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                </div>
                {receiptForm.paidAmount && (
                  <div style={makeQuotationStyles.sectionCardBody}>
                    <p style={makeQuotationStyles.sectionCardLine}>{receiptForm.paymentMode || 'Payment'}{receiptForm.referenceNo ? ` \u2014 ${receiptForm.referenceNo}` : ''}</p>
                    <p style={makeQuotationStyles.sectionCardSubLine}>{'\u20B9'}{receiptForm.paidAmount}</p>
                  </div>
                )}
              </button>

              <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px 18px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)' }}>
                <div style={{ marginBottom: '18px' }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Payment Mode</p>
                  <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.paymentMode || '\u2014'}</p>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Reference No</p>
                  <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.referenceNo || '\u2014'}</p>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Total Paid</p>
                  <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.paidAmount ? `\u20B9${receiptForm.paidAmount}` : '\u2014'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Payment For</p>
                  <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>{receiptForm.paymentFor || '\u2014'}</p>
                </div>
              </div>
            </div>

            <div style={makeQuotationStyles.bottomBar}>
              <div>
                <span style={makeQuotationStyles.bottomBarLabel}>Paid Amount</span>
                <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{receiptPaidAmount}</div>
              </div>
              <button type="button" onClick={handleGenerateReceipt} style={makeQuotationStyles.generateBtn}>{editingReceiptId ? 'Update' : 'Generate'}</button>
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

      // ----- Receipt List sub-screen (Matches Screenshot 1) -----
      if (quotationSubView === 'receiptList') {
        const searchReceipt = (r) => {
          const qs = receiptSearchQuery.trim().toLowerCase();
          if (!qs) return true;
          return (r.customerName || '').toLowerCase().includes(qs) ||
                 (r.customerCompany || '').toLowerCase().includes(qs) ||
                 (r.receiptNo || '').toLowerCase().includes(qs);
        };

        return (
          <div style={customerModuleStyles.screen}>
            <div style={customerModuleStyles.header}>
              <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={19} color="#ffffff" />
              </button>
              <h1 style={customerModuleStyles.headerTitle}>Receipt</h1>
              {renderSortMenu()}
            </div>

            <div style={customerModuleStyles.body}>
              {/* Search Bar */}
              <div style={customerModuleStyles.searchBox}>
                <FiSearch size={17} color="#94A3B8" />
                <input
                  type="text"
                  value={receiptSearchQuery}
                  onChange={(e) => setReceiptSearchQuery(e.target.value)}
                  placeholder="Search by Name, Company OR Receipt#"
                  style={customerModuleStyles.searchInput}
                />
              </div>

              {/* List */}
              {receipts.length === 0 ? (
                <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any receipt</p>
              ) : (
                sortDocumentsByCreated(receipts.filter(searchReceipt)).map((r) => (
                  <DocumentListCard
                    key={r.id}
                    onClick={() => { setSelectedReceiptId(r.id); setQuotationSubView('receiptDetail'); }}
                    name={r.customerName}
                    docNumber={r.receiptNo || 'RECEIPT-' + r.id.slice(0, 4)}
                    date={r.date}
                    amount={r.paidAmount}
                  />
                ))
              )}
            </div>

            <button type="button" onClick={openMakeReceipt} style={customerModuleStyles.fabCompact}>
              <FiPlus size={14} color="#ffffff" />
              <span>New<br />Receipt</span>
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

      // ----- Receipt Detail sub-screen -----
      if (quotationSubView === 'receiptDetail') {
        const currentReceipt = receipts.find(r => r.id === selectedReceiptId);
        if (!currentReceipt) {
          setQuotationSubView('receiptList');
          return null;
        }
        // Frozen Business Info / Receipt Settings from when this receipt was created or
        // last edited-and-updated; falls back to live values only for receipts saved
        // before this snapshot existed.
        const receiptSnap = currentReceipt.docSnapshot || buildDocSettingsSnapshot(receiptSettings);

        return (
          <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button type="button" onClick={() => setQuotationSubView('receiptList')} style={customerModuleStyles.headerIconBtn}>
                <FiArrowLeft size={24} color="#ffffff" />
              </button>
              <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Receipt Detail</h1>
              <button type="button" onClick={() => handleShareReceipt(currentReceipt)} aria-label="Share receipt" style={customerModuleStyles.headerIconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...docStyles.page, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header: Receipt # (top, centered), then Business info + logo below - matches Quotation Detail */}
                <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
                  <p style={{ ...docStyles.docTypeLabel, textTransform: 'none', textAlign: 'center', margin: '0 0 12px' }}>
                    Receipt
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={docStyles.businessName}>{receiptSnap.businessName || 'Manufacturer'}</h2>
                      {receiptSnap.businessPhone && <p style={docStyles.contactLine}>{receiptSnap.businessPhone}</p>}
                      {receiptSnap.businessEmail && <p style={docStyles.contactLine}>{receiptSnap.businessEmail}</p>}
                    </div>
                    {receiptSnap.logoImg && (
                      <img src={receiptSnap.logoImg} alt="Business Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }} />
                    )}
                  </div>
                </div>

                {/* To, (left) | Date (right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>To,</p>
                    <p style={docStyles.toName}>
                      {(currentReceipt.customerCompany && currentReceipt.customerName)
                        ? `${currentReceipt.customerCompany} -> ${currentReceipt.customerName}`
                        : (currentReceipt.customerCompany || currentReceipt.customerName)}
                    </p>
                    {(currentReceipt.customerBillingAddress || [currentReceipt.customerAddressLine1, currentReceipt.customerAddressLine2, currentReceipt.customerAddressLine3].filter(Boolean).join(', ')) && (
                      <p style={docStyles.contactLine}>
                        {currentReceipt.customerBillingAddress || [currentReceipt.customerAddressLine1, currentReceipt.customerAddressLine2, currentReceipt.customerAddressLine3].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {currentReceipt.customerMobile && (
                      <p style={docStyles.contactLine}>Mobile: {currentReceipt.customerMobile}</p>
                    )}
                    {currentReceipt.customerEmail && (
                      <p style={docStyles.contactLine}>Email: {currentReceipt.customerEmail}</p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={docStyles.docMetaLine}>Date: {currentReceipt.date}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <p style={docStyles.sectionLabel}>Payment Details</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                    <span>Payment Mode</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.paymentMode || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                    <span>Reference No</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.referenceNo || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                    <span>Payment For</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.paymentFor || '-'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '14px', borderTop: '1.5px solid #0F172A', paddingTop: '10px' }}>
                  <span style={docStyles.grandTotalLabel}>Total Paid </span>
                  <span style={docStyles.grandTotalValue}>₹{Number(currentReceipt.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>

                {receiptSnap.showSignature !== 'No' && (
                  <div style={{ textAlign: 'right', marginTop: '30px' }}>
                    <p style={docStyles.signatureLabel}>For, {receiptSnap.businessName || 'Manufacturer'}</p>
                    {receiptSnap.signatureImg ? (
                      <img src={receiptSnap.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
                    ) : (
                      <div style={{ height: '34px' }}></div>
                    )}
                    <p style={docStyles.signatureCaption}>Authorized Signature</p>
                  </div>
                )}

                {/* Generated with SmartManage - brand footer */}
                <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={smartpayLogo} alt="SmartManage" style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'cover', display: 'block' }} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.2px' }}>Generated with SmartManage</span>
                </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (Duplicate, Edit, Delete) */}
            <div style={docActionBarStyles.bar}>
              <button onClick={() => handleDuplicateReceipt(currentReceipt)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
                <span style={docActionBarStyles.label}>Duplicate</span>
              </button>
              <button onClick={() => openEditReceipt(currentReceipt)} style={docActionBarStyles.btn}>
                <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
                <span style={docActionBarStyles.label}>Edit</span>
              </button>
              <button
                onClick={() => {
  showConfirm('Delete this receipt?', async () => {
    const previous = receipts;
    const deletedId = selectedReceiptId;
    persistReceipts(receipts.filter(r => r.id !== deletedId));
    setQuotationSubView('receiptList');
    try {
      await receiptsService.deleteReceipt(deletedId);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      persistReceipts(previous);
      showAlert('Could not delete the receipt. Please try again.');
    }
  });
}}
                style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
              >
                <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
                <span style={docActionBarStyles.label}>Delete</span>
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

      const manageItems = [
        { key: 'business', label: 'BUSINESS', icon: HiOutlineBuildingOffice2 },
        { key: 'customer', label: 'CUSTOMER', icon: FiUser },
        { key: 'product', label: 'PRODUCT', icon: FiBox },
      ];
      const discoverTiles = [
        { key: 'quotationList', title: 'Quotation' },
        { key: 'purchaseOrder', title: 'Purchase Order' },
        { key: 'invoiceList', title: 'Invoice' },
        { key: 'proformaInvoice', title: 'Proforma Invoice' },
        { key: 'receipt', title: 'Receipt' },
        { key: 'deliveryNote', title: 'Delivery Note' },
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
        if (key === 'makeInvoice') { openMakeInvoice(); return; }
        if (key === 'invoiceList') { setInvoiceSearchQuery(''); setQuotationSubView('invoiceList'); return; }
        if (key === 'purchaseOrder') { setPurchaseOrderSearchQuery(''); setQuotationSubView('purchaseOrderList'); return; }
        if (key === 'proformaInvoice') { setProformaInvoiceSearchQuery(''); setQuotationSubView('proformaInvoiceList'); return; }
        if (key === 'deliveryNote') { setDeliveryNoteSearchQuery(''); setQuotationSubView('deliveryNoteList'); return; }
        if (key === 'receipt') { setReceiptSearchQuery(''); setQuotationSubView('receiptList'); return; }
      };

      return (
        <div style={quotationModuleStyles.screen}>
          <div style={{ ...themeStyles.authHeader, backgroundColor: '#0F766E', padding: '14px 14px', height: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                aria-label="Back to main page"
                style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: '10px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
              >
                <FiArrowLeft size={16} color="#ffffff" />
              </button>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', flexShrink: 0 }}>
                {profileImg ? (
                  <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(loggedInUser?.fullName) || 'GS'
                )}
              </div>
              <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {loggedInUser?.fullName ? loggedInUser.fullName.replace(/[^a-zA-Z0-9 ]/g, '') : 'Guest'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuotationSubView('settingsMenu')}
              aria-label="Open settings"
              style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
            >
              <HiOutlineCog6Tooth size={18} color="#ffffff" />
            </button>
          </div>

          <div style={quotationModuleStyles.bodyRow}>
            <div style={quotationModuleStyles.bodyInner}>
              <div style={quotationModuleStyles.manageSection}>
                <h2 style={quotationModuleStyles.sectionLabel}>Manage</h2>
                <div style={quotationModuleStyles.manageRow}>
                  {manageItems.map((item) => (
                    <button type="button" key={item.key} onClick={() => handleManageTap(item.key)} style={quotationModuleStyles.manageItemHorizontal}>
                      <span style={quotationModuleStyles.manageIconCircle}>
                        <item.icon size={20} color="#0F766E" />
                      </span>
                      <span style={quotationModuleStyles.manageLabelHorizontal}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={quotationModuleStyles.discoverSection}>
                <h2 style={quotationModuleStyles.sectionLabel}>Discover</h2>
                <div style={quotationModuleStyles.discoverGrid}>
                  {discoverTiles.map((tile) => (
                    <button type="button" key={tile.key} onClick={() => handleDiscoverTap(tile.key)} style={quotationModuleStyles.discoverTile}>
                      <span style={quotationModuleStyles.discoverBadge}>
                        <FiFileText size={19} color="#ffffff" />
                      </span>
                      <span style={quotationModuleStyles.discoverTitle}>{tile.title}</span>
                    </button>
                  ))}
                </div>
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
          {renderProfileModal()}
          {renderImageCropperModal()}
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
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1650, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
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
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1800, padding: '16px', boxSizing: 'border-box' }}>
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
                          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
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
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1900, padding: '16px', boxSizing: 'border-box' }}>
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
                    <button onClick={handleCloseWorkerFormSheet} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>&lsaquo;</button>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{editingWorkerId ? t('editEmployee') : t('addNewEmployee')}</h2>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>{t('registerEmployeeTo')} {currentProject.name}</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', width: '104px', flexShrink: 0 }}>{t('fullName')}<span style={{ color: '#DC2626' }}>*</span></label>
                      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                        <input type="text" value={tempWorkerName} onChange={(e) => setTempWorkerName(e.target.value)} style={{ width: '100%', minWidth: 0, padding: '10px', paddingRight: '44px', borderRadius: '8px', border: isNameDuplicateUI ? '1px solid #DC2626' : '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }} />
                        <ContactPickButton
                          ariaLabel="Pick employee from contacts"
                          style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', borderRadius: '7px', background: 'linear-gradient(145deg, #2952B0, #0B3C9B)' }}
                          onPick={({ name, phone }) => {
                            if (name) setTempWorkerName(name);
                            if (phone) setTempWorkerPhone(phone);
                          }}
                        />
                      </div>
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
              position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)',
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
                          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
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
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#ffffff', zIndex: 1660, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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
                    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                      <input type="text" value={tempWorkerName} onChange={(e) => setTempWorkerName(e.target.value)} style={{ width: '100%', minWidth: 0, padding: '10px', paddingRight: '44px', borderRadius: '8px', border: isNameDuplicateUI ? '1px solid #DC2626' : '1px solid #CBD5E1', boxSizing: 'border-box', backgroundColor: '#ffffff', outline: 'none', fontSize: '13px' }} />
                      <ContactPickButton
                        ariaLabel="Pick employee from contacts"
                        style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', borderRadius: '7px', background: 'linear-gradient(145deg, #2952B0, #0B3C9B)' }}
                        onPick={({ name, phone }) => {
                          if (name) setTempWorkerName(name);
                          if (phone) setTempWorkerPhone(phone);
                        }}
                      />
                    </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              aria-label="Back to main page"
              style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: '10px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
            >
              <FiArrowLeft size={16} color="#ffffff" />
            </button>
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
          // Home stays highlighted for anything that belongs to the Home section
          // (including viewing an individual project via "My Projects"), and only
          // yields to another tab when that tab is genuinely active.
          const isHomeTabActive = !isAttendanceTabActive && !isPaymentsTabActive;

          const goHome = () => {
            setActiveSiteViewId(null);
            setIsPaymentsPageOpen(false);
            setSelectedPaymentWorkerId(null);
            setIsAttendanceModalOpen(false);
            setIsAddProjectOpen(false);
            setIsWorkerSubFormOpen(false);
            setIsEditWageModalOpen(false);
            setIsProjectPickerOpen(false);
          };
          const openPicker = (purpose) => {
            setActiveSiteViewId(null);
            setIsPaymentsPageOpen(false);
            setIsAttendanceModalOpen(false);
            setIsAddProjectOpen(false);
            setProjectPickerPurpose(purpose);
            setProjectPickerSearch('');
            setProjectPickerDropdown('');
            setIsProjectPickerOpen(true);
          };

          if (isKeyboardOpen) return null;

          return (
            <div style={themeStyles.bottomDockNavBar}>
              <button style={isHomeTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={goHome}>
                <span style={themeStyles.navTabIcon}>&#128193;</span>
                <span style={themeStyles.navTabLabel}>{t('navProjectsTab')}</span>
              </button>
              <button style={isAttendanceTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => openPicker('attendance')}>
                <span style={themeStyles.navTabIcon}>&#128197;</span>
                <span style={themeStyles.navTabLabel}>{t('navAttendance')}</span>
              </button>
              <button style={isPaymentsTabActive ? themeStyles.navItemTabActive : themeStyles.navItemTab} onClick={() => openPicker('payments')}>
                <span style={themeStyles.navTabIcon}>&#128176;</span>
                <span style={themeStyles.navTabLabel}>{t('navPayments')}</span>
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
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 1500, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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

        {renderProfileModal()}
          {renderImageCropperModal()}

        {/* ============ EXIT CONFIRMATION ============ */}
        {renderExitConfirmPopup()}

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

  const otpButtonDisabled = sendingOtp || !isValidMobileNumber(mobileNumber) || (!isLoginView && !isRegistrationFormValid());
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
          <p style={authStyles.brandTagline}>Quote.Track Wages. Pay on Time.</p>
        </div>

        {/* ---- Card ---- */}
        <div style={authStyles.card}>
          <div style={authStyles.welcomeBlock}>
            <h2 style={authStyles.welcomeTitle}>Welcome</h2>
            <p style={authStyles.welcomeSubtitle}>Login to continue</p>
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
              <p style={authStyles.otpInfoText}>Enter the OTP sent to your mobile</p>
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
              {isLoginView ? "Don't have an account yet?" : 'Already registered on SmartManage?'}
              <style>{'@keyframes registerHereBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }'}</style>
              <button type="button" onClick={toggleView} style={{ ...authStyles.toggleLink, color: isLoginView ? '#DC2626' : '#0B3C9B', textDecoration: 'underline', animation: isLoginView ? 'registerHereBlink 1.2s ease-in-out infinite' : 'none' }}>{isLoginView ? 'Register here' : 'Login here'}</button>
            </p>
          </form>
        </div>

        {/* ---- Bottom feature highlights (informational only) - hidden once the form ---- */}
        {/* grows taller (register view or OTP entry) so the page always fits one screen ---- */}
        {isLoginView && !otpSent && (
        <div style={authStyles.featureRow}>
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineUserGroup size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Employees</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineCalendar size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Attendance</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineWallet size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Payments</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><FiFileText size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Quotation</span>
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
    width: '100%', minHeight: '100vh', boxSizing: 'border-box',
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

  authDashboardContainer: { width: '100%', height: '100vh', backgroundColor: '#f4f6f9', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: 0, overflow: 'hidden' },
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
    width: '100%', minHeight: '100vh',
    background: 'linear-gradient(180deg, #F6F9FF 0%, #F0F4FC 45%, #EAF0FB 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
  },
  scrollArea: { width: '100%', maxWidth: '460px', padding: '20px 18px 28px', boxSizing: 'border-box' },

  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
  brandRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  logoImg: { width: '30px', height: '30px', objectFit: 'contain', borderRadius: '8px' },
  brandName: { fontSize: '11px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.01em' },
  avatarButton: {
    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #0B3C9B, #2554EB)', color: '#ffffff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0,
  },

  greetBlock: { marginBottom: '10px' },
  greetTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  greetSubtitle: { fontSize: '13.5px', color: '#64748B', margin: 0, fontWeight: '500' },

  panel: { background: '#F1F2F6', borderRadius: '26px', padding: '18px 16px 20px', boxSizing: 'border-box' },
  panelLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 4px' },

  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: {
    position: 'relative',
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '20px',
    padding: '18px 14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '128px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  tileBadge: { width: '40px', height: '40px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileTitle: { fontSize: '14.5px', fontWeight: '700', color: '#0F172A', lineHeight: '1.25' },
  // Font auto-shrinks to fit the tile width as the label text grows (e.g. longer module names).
  // Shared by both home-page tiles so their typography (size/weight/line-height) stays identical.
  tileTitleAdjustable: {
    fontSize: 'clamp(11px, 3.4vw, 14.5px)', fontWeight: '700', color: '#0F172A',
    lineHeight: '1.25', overflowWrap: 'break-word', wordBreak: 'break-word', width: '100%',
  },
  tileSubtitle: { fontSize: '11.5px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },
  tilePlayBadge: {
    position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', borderRadius: '50%',
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#F59E0B',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', padding: 0, zIndex: 2,
  },

  quickActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#ffffff', border: '1px solid #F0F2F6', borderRadius: '16px',
    padding: '13px 12px', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '13.5px', fontWeight: '700', color: '#0F172A', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
  },
  quickActionIcon: { fontSize: '15px' },

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
    width: '100%', height: '100vh', background: 'linear-gradient(180deg, #F5FBFA 0%, #F0F8F6 45%, #EAF5F2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden',
  },

  bodyRow: { flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', overflowY: 'auto' },
  bodyInner: { width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '22px', padding: '16px 18px 32px', boxSizing: 'border-box' },

  sectionLabel: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px 2px', flexShrink: 0 },

  // ===== Manage section: horizontal row of equal-width tiles (was a vertical column) =====
  manageSection: { width: '100%', boxSizing: 'border-box' },
  manageRow: { display: 'flex', flexDirection: 'row', gap: '12px', width: '100%' },
  manageItemHorizontal: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    background: '#ffffff', border: '1px solid #DCEEEA', borderRadius: '18px', cursor: 'pointer',
    padding: '16px 8px', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(15, 118, 110, 0.05)',
  },
  manageIconCircle: {
    width: '46px', height: '46px', borderRadius: '14px', background: '#E7F5F1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  manageLabelHorizontal: { fontSize: '12px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.2px', textAlign: 'center' },

  // ===== Discover section: full-width grid below Manage (was a side column) =====
  discoverSection: { width: '100%', boxSizing: 'border-box' },
  discoverGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  discoverTile: {
    background: '#ffffff', border: '1px solid #DCEEEA', borderRadius: '16px',
    padding: '14px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', minHeight: '80px', boxShadow: '0 1px 2px rgba(15, 118, 110, 0.05)',
  },
  discoverBadge: {
    width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(145deg, #12786B, #0A3D38)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  // Single-line, auto-shrinking label so short titles (Quotation, Invoice, Receipt) and
  // longer ones (Purchase Order, Proforma Invoice, Delivery Note) render consistently
  // on one line without wrapping. Floor matches the Manage tile label size (12px).
  discoverTitle: {
    fontSize: 'clamp(12px, 3.4vw, 14px)', fontWeight: '700', color: '#0F172A', lineHeight: '1.25',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'block',
  },
  discoverSubtitle: { fontSize: '10px', fontWeight: '500', color: '#94A3B8', lineHeight: '1.35' },
};

function FieldInput({ label, value, onChange, type = 'text', error }) {
  return (
    <div>
      <div style={{ ...businessInfoStyles.fieldBox, ...(error ? { border: '1.5px solid #DC2626' } : null) }}>
        <span style={businessInfoStyles.fieldLabel}>{label}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={businessInfoStyles.fieldInputEl}
        />
      </div>
      {error && typeof error === 'string' && <p style={customerModuleStyles.fieldErrorText}>{error}</p>}
    </div>
  );
}

const quotationSettingsStyles = {
  row: {
    width: '100%', textAlign: 'left', background: '#F1F3F6', border: 'none', borderRadius: '18px',
    padding: '15px 16px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '14px',
    cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  rowIcon: { width: '22px', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  rowLabel: { fontSize: '13.5px', color: '#64748B', fontWeight: '500' },
  rowValue: { fontSize: '17px', color: '#0F172A', fontWeight: '500', lineHeight: '1.3' },
  // Chevron shown on every tappable settings row (e.g. GST Display, Quotation Top/Bottom
  // Message) so users can see at a glance that the row opens a menu of other options,
  // instead of looking like a plain read-only label that gives no hint it's interactive.
  rowChevron: { flexShrink: 0, marginTop: '4px' },
  inputEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '17px', color: '#0F172A',
    fontWeight: '500', padding: 0, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  },
  textareaEl: {
    border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#0F172A',
    fontWeight: '500', padding: 0, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    resize: 'vertical', lineHeight: '1.45',
  },

  // ----- Inline Yes/No toggle-switch row (replaces the old tap-to-open-sheet row for
  // binary Display fields like GST / HSN / Shipping Address / Bank / QR / Signature). -----
  toggleRow: {
    width: '100%', background: '#F1F3F6', border: 'none', borderRadius: '18px',
    padding: '13px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px',
    boxSizing: 'border-box',
  },
  toggleRowIcon: { width: '22px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  toggleRowLabel: { flex: 1, minWidth: 0, fontSize: '14px', color: '#0F172A', fontWeight: '600', lineHeight: '1.3' },
  toggleRowRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  toggleRowValueText: { fontSize: '13px', fontWeight: '700', minWidth: '24px', textAlign: 'left' },
  // Switch itself is intentionally compact (42x24) so it never grows past the row it sits in.
  switchTrack: {
    width: '42px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
    position: 'relative', padding: 0, flexShrink: 0, transition: 'background-color 0.15s ease',
  },
  switchTrackOn: { background: '#16A34A' },
  switchTrackOff: { background: '#CBD5E1' },
  switchThumb: {
    position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%',
    background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s ease',
  },

  // ----- Inline 3-option segmented control (Default / Custom / Hide) -----
  segmentedWrap: {
    width: '100%', background: '#F1F3F6', borderRadius: '18px', padding: '13px 14px 14px',
    marginBottom: '14px', boxSizing: 'border-box',
  },
  segmentedHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '11px' },
  segmentedControl: {
    display: 'flex', alignItems: 'center', gap: '6px', background: '#E7EAEF', borderRadius: '12px', padding: '4px',
  },
  segmentedBtn: {
    flex: 1, textAlign: 'center', background: 'transparent', border: 'none', borderRadius: '9px',
    padding: '8px 6px', fontSize: '12.5px', fontWeight: '700', color: '#475569', cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.1px', whiteSpace: 'nowrap',
  },
  segmentedBtnActive: { background: '#16A34A', color: '#ffffff', boxShadow: '0 1px 4px rgba(15,23,42,0.15)' },
};

// Compact inline toggle switch used for every Yes/No "Display" setting row (GST, HSN,
// Shipping Address, Bank info, QR Code, Signature). Tapping the switch flips the value
// directly - no bottom sheet needed. Sized to sit comfortably inside the existing row
// so it never looks oversized on small screens.
function ToggleSwitchRow({ icon, label, value, onChange }) {
  const isYes = value === 'Yes';
  return (
    <div style={quotationSettingsStyles.toggleRow}>
      <span style={quotationSettingsStyles.toggleRowIcon}>{icon}</span>
      <span style={quotationSettingsStyles.toggleRowLabel}>{label}</span>
      <span style={quotationSettingsStyles.toggleRowRight}>
        <button
          type="button"
          role="switch"
          aria-checked={isYes}
          aria-label={label}
          onClick={() => onChange(isYes ? 'No' : 'Yes')}
          style={{
            ...quotationSettingsStyles.switchTrack,
            ...(isYes ? quotationSettingsStyles.switchTrackOn : quotationSettingsStyles.switchTrackOff),
          }}
        >
          <span
            style={{
              ...quotationSettingsStyles.switchThumb,
              transform: isYes ? 'translateX(18px)' : 'translateX(0)',
            }}
          />
        </button>
        <span style={{ ...quotationSettingsStyles.toggleRowValueText, color: isYes ? '#16A34A' : '#64748B' }}>{isYes ? 'Yes' : 'No'}</span>
      </span>
    </div>
  );
}

// Inline 3-option segmented control used for Top/Bottom Message mode rows
// (Default / Custom / Hide). `options` is an array of { value, label } - value is what
// gets passed to onChange / stored (e.g. "Customize"), label is what's shown on the
// button (e.g. "Custom"), so existing business logic keyed on "Customize" keeps working.
function SegmentedModeRow({ icon, label, value, options, onChange }) {
  return (
    <div style={quotationSettingsStyles.segmentedWrap}>
      <div style={quotationSettingsStyles.segmentedHeader}>
        <span style={quotationSettingsStyles.toggleRowIcon}>{icon}</span>
        <span style={quotationSettingsStyles.toggleRowLabel}>{label}</span>
      </div>
      <div style={quotationSettingsStyles.segmentedControl}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                ...quotationSettingsStyles.segmentedBtn,
                ...(active ? quotationSettingsStyles.segmentedBtnActive : {}),
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const businessInfoStyles = {
  screen: { width: '100%', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: {
    background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: 0, textAlign: 'center' },

  body: { padding: '22px 18px 32px', maxWidth: '460px', margin: '0 auto', boxSizing: 'border-box' },

  brandRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '26px' },
  brandTile: {
    position: 'relative', width: '128px', height: '128px', borderRadius: '20px',
    background: 'linear-gradient(160deg, #12786B, #0A3D38)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
  },
  brandTileText: { color: '#ffffff', fontWeight: '800', fontSize: '15px', textAlign: 'center', lineHeight: '1.3', letterSpacing: '0.3px' },
  brandTileImg: { width: '100%', height: '100%', objectFit: 'cover' },
  brandEditBadge: {
    position: 'absolute', top: '-8px', right: '-8px', width: '30px', height: '30px', borderRadius: '50%',
    background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)', border: '2px solid #0A3D38', padding: 0, margin: 0, cursor: 'pointer',
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
    padding: '12px 16px 14px', marginBottom: '12px', display: 'flex', flexDirection: 'column',
    gap: '3px', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  bankCardHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  bankCardLabelBtn: {
    background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', flex: 1,
  },
  bankShareIconBtn: {
    background: '#E7F2F0', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
  },
  bankCardBodyBtn: {
    width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, margin: 0,
    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'inherit',
  },
  bankLine: { fontSize: '14.5px', color: '#1E293B', fontWeight: '600' },

  helperText: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', margin: '-4px 2px 20px' },

  updateBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
    color: '#ffffff', fontSize: '15.5px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer',
  },

  // Reset + Update side-by-side row used on every document Settings screen. Reset is a
  // secondary/outlined button (left, less visual weight) and Update stays the filled
  // primary action (right) - same row, split roughly 40/60 so Update stays the clear
  // primary tap target on mobile.
  settingsFooterRow: { display: 'flex', gap: '12px', marginTop: '4px' },
  resetBtn: {
    flex: '0.8', height: '52px', borderRadius: '16px', border: '1.5px solid #CBD5E1', background: '#ffffff',
    color: '#334155', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', fontFamily: 'inherit',
  },
  updateBtnHalf: {
    flex: '1', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
    color: '#ffffff', fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', boxSizing: 'border-box',
  },
  modalCard: { background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' },
  modalHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '22px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: 0 },
  modalSaveBtn: { width: '100%', height: '46px', borderRadius: '14px', border: 'none', background: '#0F766E', color: '#ffffff', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },

  sheetActionRow: {
    display: 'flex', alignItems: 'center', gap: '14px', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', padding: '15px 4px',
    fontSize: '15px', fontWeight: '600', color: '#0F172A', cursor: 'pointer', fontFamily: 'inherit',
  },
};

const customerModuleStyles = {
  screen: { width: '100%', minHeight: '100vh', background: '#F3F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  header: {
    background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    position: 'sticky', top: 0, zIndex: 20,
  },
  headerIconBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', width: '27px' },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: '19px', fontWeight: '700', margin: 0, textAlign: 'center' },

  // Filter / Sort dropdown menu (Newest to Oldest / Oldest to Newest)
  sortMenu: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#ffffff', borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)', padding: '8px', minWidth: '200px', zIndex: 100,
  },
  sortMenuItem: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    background: 'none', border: 'none', borderRadius: '10px', padding: '11px 12px', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left',
  },
  sortMenuItemLabel: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  sortMenuItemLabelActive: { fontSize: '14px', fontWeight: '700', color: '#0F766E' },

  // Document list card (Quotation, Invoice, Purchase Order, Proforma Invoice,
  // Delivery Note, Receipt) — name on the left, number/date/amount/status on the right.
  docCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px',
    padding: '16px 18px', marginBottom: '12px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '14px', boxSizing: 'border-box',
  },
  docCardName: {
    flex: 1, minWidth: 0, fontSize: '16.5px', fontWeight: '700', color: '#0F172A',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  docCardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
  docCardNumber: { fontSize: '13px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap' },
  docCardDate: { fontSize: '12.5px', color: '#94A3B8', whiteSpace: 'nowrap' },
  docCardBottomRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  docCardAmount: { fontSize: '16.5px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap' },
  docCardStatusPill: {
    fontSize: '10.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
  },

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
  editBadge: { width: '34px', height: '34px', borderRadius: '50%', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBadgeBtn: { width: '34px', height: '34px', borderRadius: '50%', background: '#0F766E', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  selectRowBtn: { flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: '13.5px', lineHeight: '1.5', marginTop: '40px', padding: '0 20px' },

  // Product List (extends the customer card layout with price/GST rows)
  productCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '18px',
    padding: '18px 18px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit',
  },
  productCardSelected: { boxShadow: '0 0 0 2px #0F766E, 0 2px 10px rgba(15, 23, 42, 0.05)' },
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
    display: 'inline-block', fontSize: '17px', fontWeight: '700', color: '#0F766E',
    borderBottom: '2px solid #0F766E', paddingBottom: '10px',
  },
  termCard: {
    width: '100%', textAlign: 'left', background: '#ffffff', border: 'none', borderRadius: '16px',
    padding: '16px 16px', marginBottom: '10px', fontSize: '14.5px', color: '#0F172A', fontWeight: '500',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', cursor: 'pointer', fontFamily: 'inherit', lineHeight: '1.5',
  },
  termCardSelected: { boxShadow: '0 0 0 2px #0F766E, 0 2px 10px rgba(15, 23, 42, 0.05)' },
  doneBtnWrap: { position: 'fixed', left: 0, right: 0, bottom: '18px', padding: '0 18px', boxSizing: 'border-box' },
  doneBtn: {
    width: '100%', maxWidth: '460px', margin: '0 auto', display: 'block', height: '52px', borderRadius: '30px',
    border: 'none', background: '#0F766E', color: '#ffffff', fontSize: '15px', fontWeight: '700',
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
  checkbox: { width: '20px', height: '20px', accentColor: '#0F766E', cursor: 'pointer' },

  fab: {
    position: 'fixed', right: '20px', bottom: '26px', width: '68px', height: '68px', borderRadius: '50%',
    background: '#0F766E', color: '#ffffff', border: 'none', cursor: 'pointer', zIndex: 30,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
    fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.2px', lineHeight: '1.15', padding: '4px',
    boxShadow: '0 10px 22px rgba(15, 118, 110, 0.4)',
  },
  fabCompact: {
    position: 'fixed', right: '20px', bottom: '26px', width: '68px', height: '68px', borderRadius: '50%',
    background: '#0F766E', color: '#ffffff', border: 'none', cursor: 'pointer', zIndex: 30,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
    fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.2px', lineHeight: '1.15', padding: '4px',
    boxShadow: '0 10px 22px rgba(15, 118, 110, 0.4)',
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
    background: 'linear-gradient(145deg, #12786B, #0A3D38)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
  // Persistent-label fields (label always visible, never relies on placeholder alone)
  labeledFieldBox: {
    width: '100%', boxSizing: 'border-box', background: '#F1F3F6', border: '1.5px solid transparent',
    borderRadius: '16px', padding: '9px 16px 11px', marginBottom: '12px', fontFamily: 'inherit',
  },
  labeledFieldBoxError: { border: '1.5px solid #DC2626' },
  labeledFieldLabel: { display: 'block', fontSize: '11.5px', color: '#64748B', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.1px' },
  labeledFieldInput: {
    width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0,
    fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit',
  },
  labeledFieldButton: {
    width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0, textAlign: 'left',
    fontSize: '15px', color: '#0F172A', fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer',
  },
  fieldErrorText: { color: '#DC2626', fontSize: '12px', fontWeight: '500', margin: '-8px 0 12px 4px' },

  addBtn: {
    width: '100%', height: '52px', borderRadius: '16px', border: 'none', background: '#0F766E',
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
    width: '32px', height: '32px', borderRadius: '50%', background: '#0F766E',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionCardBody: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  sectionCardLine: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
  sectionCardSubLine: { fontSize: '12.5px', fontWeight: '500', color: '#64748B', margin: 0 },
  lineRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lineRowRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  removeX: { fontSize: '17px', color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: '0 2px' },
  // Standardized Remove icon button for the Quotation Module - matches the Remove icon
  // and styling used in the Attendance Module for the Project Name field (plain FiTrash2
  // icon, no background badge, consistent red color and size). Use this everywhere a
  // Remove action appears within the Quotation Module so it never renders as a black
  // icon or an "X" cross.
  removeIconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', padding: 0, background: 'transparent',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  },

  bottomBar: {
    position: 'fixed', left: '18px', right: '18px', bottom: '18px', maxWidth: '424px', margin: '0 auto',
    background: '#0F766E', borderRadius: '30px', padding: '12px 12px 12px 22px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(15,23,42,0.3)',
  },
  bottomBarLabel: { fontSize: '12px', color: '#CBD5E1', fontWeight: '500' },
  bottomBarAmount: { fontSize: '19px', color: '#ffffff', fontWeight: '700', marginTop: '2px' },
  generateBtn: {
    background: '#ffffff', border: 'none', borderRadius: '24px', padding: '14px 30px',
    fontSize: '15px', fontWeight: '700', color: '#0F172A', cursor: 'pointer',
  },
};
