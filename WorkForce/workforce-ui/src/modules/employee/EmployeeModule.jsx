// ===== Module 1: Employee, Attendance and Payments =====
// Everything for this module lives here: sites/projects, workers, attendance, wages, advances,
// payments, statements. It is always mounted while the user is signed in (so its data stays loaded
// when the user goes back to the Main page) and only draws its screens while activeModule === 'attendance'.

import { App } from '@capacitor/app';
import { AppPopup, ContactPickButton } from '../../shared/components';
import { EDIT_WAGE_PAST_DAYS_MAX, PROJECTS_CACHE_KEY_PREFIX, SUPPORTED_LANGUAGES } from './constants';
import { FaChevronRight } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { LANGUAGE_STORAGE_KEY } from '../../shared/constants';
import { Network } from '@capacitor/network';
import { attendanceService, paymentService, projectService, workerService } from './services';
import { calcPaidInRange, calcPaymentDueForRange, calcTotalDue, calculateNetDaily, computeProjectLastAttendanceDate, computeProjectTotalBonus, computeProjectTotalDue, computeProjectTotalWages, formatLargeDateHeader, formatSelectedDatesLabel, formatShortDayLabel, formatSiteName, getEarliestJoiningDate, getEffectiveWage, getEmployeeAvatarColors, getLastAttendanceDate, getPaymentStartDate, getSavedAttendanceDatesSet, isWageRangeAlreadyAtAmount, mapProjectFromApi } from './helpers';
import { connectivityStyles } from './styles';
import { deliverGeneratedPdf, drawAmountText, ensureJsPDF, jsPDF, registerRupeeFont } from '../../shared/pdf';
import { isValidMobileNumber } from '../../shared/validators';
import smartpayLogo from '../../assets/icon.png';
import { themeStyles } from '../../shared/styles';
import { toLocalISODate } from '../../shared/helpers';
import { useAppShell } from '../../app/AppShellContext';
import { useEffect, useRef, useState } from 'react';

export default function EmployeeModule() {
  const {
    activeModule,
    appPopup,
    closeAppPopup,
    closeProfileModalIfOpen,
    closeSubscribeOrHelpIfOpen,
    confirmDiscardThen,
    getAppLogoDataUrl,
    isIntentionalReloadRef,
    isKeyboardOpen,
    isReconnecting,
    isUserAuthenticated,
    language,
    loading,
    loggedInUser,
    moduleRegistryRef,
    persistedUser,
    profileImg,
    renderExitConfirmPopup,
    renderImageCropperModal,
    renderProfileModal,
    setActiveModule,
    setIsExitConfirmOpen,
    setIsReconnecting,
    setLanguage,
    setLoading,
    showAlert,
    showConfirm,
    showSuccess,
    t,
  } = useAppShell();


// Add this state near other state declarations
const [loadingProjects, setLoadingProjects] = useState(false);

// Add this function to load projects
const loadUserProjects = async (userId) => {
  try {
    setLoadingProjects(true);
    const response = await projectService.getProjects(userId);
    setProjects(response.map(mapProjectFromApi));
    // Cache the raw API response so the next app start can show projects instantly
    // instead of blocking on a "Loading..." screen until the network call returns.
    try { localStorage.setItem(PROJECTS_CACHE_KEY_PREFIX + userId, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading projects:', error);
    // Keep whatever is already on screen (cached or previously loaded) on failure,
    // instead of wiping the user's projects because of one failed/timed-out request.
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

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode); } catch {}
  };


  // Project list search / dropdown / sort
  const [siteSearchQuery, setSiteSearchQuery] = useState('');

  const [selectedProjectDropdown, setSelectedProjectDropdown] = useState('');

  const [projectSortMode, setProjectSortMode] = useState('az');

  // Active/Deactive switch on the "My Projects" home list. A "removed" project is never
  // deleted from local state - it's kept (with isActive: false) so it shows up here
  // instead of disappearing, same pattern as the employee Active/Deactive switch below.
  const [projectStatusFilter, setProjectStatusFilter] = useState('active');


  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  const [workerSortMode, setWorkerSortMode] = useState('az');

  // Active/Deactive switch on the Project Detail > Employees list. Deactivated employees
  // are never deleted from local state - they're kept (with isActive: false) so their
  // full history stays viewable when this filter is switched to 'inactive'.
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('active');

  // Which deactivated employee's read-only Details screen (Date of Joining / Last Day /
  // Download Statement) is currently open, opened via the ">" arrow on the Deactive list.
  const [selectedDeactiveWorkerId, setSelectedDeactiveWorkerId] = useState(null);

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

  // Holds in-progress typing for the inline per-day wage field on the attendance
  // row, keyed by dateStr -> workerId -> raw string. Only holds uncommitted edits;
  // once a value is saved as a wageOverride it's cleared here and the row simply
  // reads the fresh value back from getEffectiveWage.
  const [pendingWageByDate, setPendingWageByDate] = useState({});

  const [savingDayWageKey, setSavingDayWageKey] = useState(null);

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

  const [editWageSpecificStart, setEditWageSpecificStart] = useState('');

  const [editWageSpecificEnd, setEditWageSpecificEnd] = useState('');

  const [editWageSpecificCalendarMonth, setEditWageSpecificCalendarMonth] = useState(() => new Date());

  const [editWageTodayCalendarMonth, setEditWageTodayCalendarMonth] = useState(() => new Date());

  const [editWageFutureCalendarMonth, setEditWageFutureCalendarMonth] = useState(() => new Date());

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


  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);

  const [projectPickerPurpose, setProjectPickerPurpose] = useState(null);

  const [projectPickerSearch, setProjectPickerSearch] = useState('');

  const [projectPickerDropdown, setProjectPickerDropdown] = useState('');


  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const [editProjectNameInput, setEditProjectNameInput] = useState('');


  // Attendance counts as "in progress" only while dates are selected and something was marked/typed
  // for them (the selection is cleared once the attendance is saved).
  const hasUnsavedAttendance = () => {
    if (!selectedAttendanceDates || selectedAttendanceDates.length === 0) return false;
    return selectedAttendanceDates.some((d) => {
      const marked = Object.values(pendingAttendanceByDate[d] || {}).some((r) => r && r.status);
      const advance = Object.values(pendingAdvanceByDate[d] || {}).some((v) => parseFloat(v) > 0);
      return marked || advance;
    });
  };


  const closeAttendanceTopmostScreen = () => {
    if (isEditWageModalOpen) {
      if (String(editWageNewAmount || '').trim() !== '') return confirmDiscardThen(() => setIsEditWageModalOpen(false));
      setIsEditWageModalOpen(false); return true;
    }
    if (trackerWorkerId) { setTrackerWorkerId(null); return true; }
    if (isCustomWeekPickerOpen) { setIsCustomWeekPickerOpen(false); return true; }
    if (isEditProjectModalOpen) { handleCloseEditProjectModal(); return true; }
    if (closeProfileModalIfOpen()) return true;
    if (isWorkerSubFormOpen) {
      const isNewWorker = editingWorkerId === null || editingWorkerId === undefined;
      const hasTypedWorkerData = [tempWorkerName, tempWorkerPhone, tempWorkerJoiningDate, tempWorkerWageAmount]
        .some((v) => String(v || '').trim() !== '');
      if (isNewWorker && hasTypedWorkerData) return confirmDiscardThen(() => handleCloseWorkerFormSheet());
      handleCloseWorkerFormSheet(); return true;
    }
    if (isProjectPickerOpen) { setIsProjectPickerOpen(false); return true; }
    if (isAddProjectOpen) {
      const closeAddProject = () => {
        setIsAddProjectOpen(false);
        setNewSiteName('');
        setTempWorkersList([]);
        setIsNewProjectNameDuplicate(false);
      };
      if (String(newSiteName || '').trim() !== '' || tempWorkersList.length > 0) return confirmDiscardThen(closeAddProject);
      closeAddProject();
      return true;
    }
    if (selectedPaymentWorkerId) {
      setSelectedPaymentWorkerId(null);
      return true;
    }
    if (selectedDeactiveWorkerId) {
      setSelectedDeactiveWorkerId(null);
      return true;
    }
    if (isAttendanceModalOpen) {
      const closeAttendance = () => {
        setIsAttendanceModalOpen(false);
        setAttendanceWorkerSearchQuery('');
      };
      if (hasUnsavedAttendance()) return confirmDiscardThen(closeAttendance);
      closeAttendance();
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
    if (closeSubscribeOrHelpIfOpen()) return true;
    return false;
  };


  const closeTopmostScreen = () => {
    const activeModuleApi = moduleRegistryRef.current[activeModule];
    if (activeModuleApi && activeModuleApi.closeTopmostScreen && activeModuleApi.closeTopmostScreen()) return true;
    // Main page (no module open): close the shared overlays, if any.
    if (activeModule === null) {
      if (closeProfileModalIfOpen()) return true;
      if (closeSubscribeOrHelpIfOpen()) return true;
      return false;
    }
    // Any module's first/top-level page: hardware back returns to the Main page.
    setActiveModule(null);
    return true;
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
                          isWorkerSubFormOpen || 
                          isProjectPickerOpen || 
                          isAddProjectOpen || 
                          selectedPaymentWorkerId || 
                          selectedDeactiveWorkerId ||
                          isAttendanceModalOpen || 
                          isPaymentsPageOpen || 
                          activeSiteViewId;

    if (hasOpenScreens) {
      window.history.pushState({ appGuard: true, timestamp: Date.now() }, '');
    }
  }, [isUserAuthenticated, 
      isEditWageModalOpen, 
      trackerWorkerId, 
      isCustomWeekPickerOpen, 
      isEditProjectModalOpen, 
      isWorkerSubFormOpen, 
      isProjectPickerOpen, 
      isAddProjectOpen, 
      selectedPaymentWorkerId, 
      selectedDeactiveWorkerId,
      isAttendanceModalOpen, 
      isPaymentsPageOpen, 
      activeSiteViewId]);


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
    showConfirm("This Employee will be removed.", async () => {
      // Optimistic update so the UI feels instant. The worker is kept in local
      // state (never filtered out) and just flipped to inactive, so it now shows
      // up under the Deactive tab instead of disappearing - full history (wage
      // overrides, payments, advances, bonuses, attendance) stays intact.
      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id === projectId) {
            const updatedEmployees = (project.employees || []).map(emp => emp.id === workerId ? { ...emp, isActive: false } : emp);
            const activeCount = updatedEmployees.filter(emp => emp.isActive !== false).length;
            return { ...project, workersCount: activeCount, employees: updatedEmployees, lastModifiedAt: Date.now() };
          }
          return project;
        })
      );
      try {
        // Deliberately the dedicated deactivate endpoint (PUT /workers/{id}/deactivate),
        // not workerService.deleteWorker - that's a real soft-delete on the backend
        // (flips the record's IsActive off), which would make this worker vanish
        // entirely from GetWorkersByProject on the next refresh instead of showing up
        // in the Deactive tab. Deactivate only flips IsCurrentlyActive, which is what
        // this screen's "isActive" field actually reflects, and is permanent - there's
        // no reactivate endpoint to call afterwards.
        await workerService.deactivateWorker(workerId, { deactivationDate: new Date().toISOString() });
      } catch (error) {
        console.error('Error deactivating worker:', error);
        showAlert('Could not deactivate employee on the server. Reloading latest data.');
      } finally {
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
    // Only active projects block a duplicate name - a name that's in the Removed
    // list is free to reuse.
    const isDuplicateProjectName = projects.some(p => p.isActive !== false && p.id !== activeSiteViewId && p.name.trim().toLowerCase() === trimmedName.toLowerCase());
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
      // Optimistic update so the UI feels instant. The project is kept in local state
      // (never filtered out) and just flipped to inactive, so it now shows up under the
      // Deactive tab on the Projects home page instead of disappearing - same pattern as
      // deactivating an employee. Full history (employees, payments, attendance) stays intact.
      setProjects(prevProjects =>
        prevProjects.map(p => p.id === projectId ? { ...p, isActive: false, lastModifiedAt: Date.now() } : p)
      );
      setActiveSiteViewId(null);
      setIsAttendanceModalOpen(false);
      setIsPaymentsPageOpen(false);
      setIsWorkerSubFormOpen(false);
      setIsEditProjectModalOpen(false);
      try {
        await projectService.deleteProject(projectId);
      } catch (error) {
        console.error('Error deactivating project:', error);
        showAlert('Could not deactivate the project on the server. Reloading your projects.');
      } finally {
        // ...then reconcile with the server either way (soft-delete flips isActive).
        if (loggedInUser?.userId) await loadUserProjects(loggedInUser.userId);
      }
    }, { confirmLabel: t('remove'), tone: 'warning' });
  };


  const handleOpenAttendanceScreen = (project) => {
    setPendingAttendanceByDate({});
    setPendingAdvanceByDate({});
    setPendingWageByDate({});
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


  const handleBulkAttendanceChange = (statusValue) => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    if (!currentProject) return;
    if (selectedAttendanceDates.length === 0) {
      showAlert(t('selectDateFromCalendar'));
      return;
    }
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const activeEmployees = (currentProject.employees || []).filter(w => w.isActive !== false);
    const query = attendanceWorkerSearchQuery.trim().toLowerCase();
    const targets = query
      ? activeEmployees.filter(w => w.name.toLowerCase().includes(query))
      : activeEmployees;
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


  // Inline per-day wage field on the attendance row. Typing just updates the
  // uncommitted pendingWageByDate value; the actual wageOverride (scoped to this
  // one date only, from === to) is written on blur via saveDayWageOverride below.
  const handleDayWageInputChange = (workerId, rawValue) => {
    const digitsOnly = rawValue.replace(/[^0-9]/g, '');
    if (selectedAttendanceDates.length === 0) return;
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    setPendingWageByDate(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [workerId]: digitsOnly }
    }));
  };


  const handleDayWageInputBlur = (worker, status) => {
    if (selectedAttendanceDates.length === 0) return;
    const safeIndex = Math.min(currentAttendanceDateIndex, Math.max(0, selectedAttendanceDates.length - 1));
    const dateStr = selectedAttendanceDates[safeIndex];
    const rawValue = pendingWageByDate[dateStr]?.[worker.id];
    if (rawValue === undefined) return;
    const discardPending = () => {
      setPendingWageByDate(prev => {
        const next = { ...prev, [dateStr]: { ...(prev[dateStr] || {}) } };
        delete next[dateStr][worker.id];
        return next;
      });
    };
    // Absent always pays ₹0 for the day, and typing into the field while Absent
    // must not be treated as a wage edit at all - it should never be saved as a
    // base wage override (that would silently change the wage used on other,
    // non-absent days). Discard whatever was typed and leave the calculated
    // wage at ₹0.
    if (status === 'A') { discardPending(); return; }
    const typedAmount = parseFloat(rawValue);
    if (!typedAmount || typedAmount <= 0) { discardPending(); return; }
    const currentEffectiveBase = getEffectiveWage(worker, dateStr);
    const currentNet = calculateNetDaily(currentEffectiveBase, status);
    // The field shows/edits the NET amount for the day (full wage on Present, half
    // on Half day) - so what's typed has to be converted back to the underlying
    // per-day base wage before it's saved as an override, since that's what
    // wageOverrides/getEffectiveWage store everywhere else in the app.
    // - Half day: back-solve the full-day base that produces this half-day net
    //   (typing 400 -> base becomes 800).
    // - Present (or unmarked): net === base already (multiplier 1), no conversion.
    const newBaseWage = status === 'HD' ? typedAmount * 2 : typedAmount;
    const unchanged = typedAmount === currentNet;
    if (unchanged) { discardPending(); return; }
    saveDayWageOverride(worker.id, dateStr, newBaseWage);
  };


  const handleSaveAttendanceData = async () => {
    const currentProject = projects.find(p => p.id === activeSiteViewId);
    if (!currentProject) return;

    if (selectedAttendanceDates.length === 0) {
      showAlert(t('selectDateToSaveAttendance'));
      return;
    }

    const chronologicalSelectedDates = [...selectedAttendanceDates].sort();
    const activeEmployees = (currentProject.employees || []).filter(emp => emp.isActive !== false);
    const firstMissingDate = chronologicalSelectedDates.find(dateStr => {
      const dateRecord = pendingAttendanceByDate[dateStr] || {};
      return activeEmployees
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
    // projectId is included on every record now that a worker can be sent to
    // a different project (see the Employees tab / "Send to Project") - the
    // backend needs to know which project this attendance was actually
    // marked under, not infer it from wherever the worker currently is.
    const recordsToSave = [];
    chronologicalSelectedDates.forEach(dateStr => {
      const recordsForDate = pendingAttendanceByDate[dateStr] || {};
      activeEmployees.forEach(emp => {
        const rec = recordsForDate[emp.id];
        if (rec && rec.status) {
          recordsToSave.push({ workerId: emp.id, projectId: currentProject.id, attendanceDate: dateStr, status: rec.status });
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
      activeEmployees.forEach(emp => {
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
    // Onwards This Day is now the only option (Past days / Specific duration / Today
    // are handled from the main attendance page's date picker and inline wage field),
    // so pre-select it instead of showing a tab picker with one live option.
    setEditWageApplyTo('future');
    setEditWageTodayDate(toLocalISODate(new Date()));
    setEditWagePastDates([]);
    setEditWagePastCalendarMonth(new Date());
    setEditWageSpecificStart('');
    setEditWageSpecificEnd('');
    setEditWageSpecificCalendarMonth(new Date());
    setEditWageTodayCalendarMonth(new Date());
    setEditWageFutureCalendarMonth(new Date());
    setEditWageFutureStart('');
    setEditWageNewAmount('');
    setEditWageNote('');
    setIsEditWageModalOpen(true);
  };


  const handleCloseEditWage = () => {
    setIsEditWageModalOpen(false);
    setEditWageTargetWorkerId(null);
  };


  // Saves a wage override scoped to exactly one date (from === to) - used by the
  // inline wage field on the attendance row, so changing "700" to "1000" for a
  // single day affects only that day's calculation, same as the old "Today" option
  // used to, just without opening a modal.
  const saveDayWageOverride = async (workerId, dateStr, amount) => {
    const dayWageKey = `${workerId}|${dateStr}`;
    setSavingDayWageKey(dayWageKey);
    try {
      await workerService.updateWage(workerId, {
        effectiveFrom: dateStr,
        effectiveTo: dateStr,
        dailyWageAmount: amount,
        note: '',
      });
    } catch (err) {
      console.error('Failed to save day wage override', err);
      setSavingDayWageKey(null);
      showAlert(err.message || 'Failed to save wage change. Please try again.');
      return;
    }
    setSavingDayWageKey(null);
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== activeSiteViewId) return project;
        return {
          ...project,
          lastModifiedAt: Date.now(),
          employees: project.employees.map(emp => {
            if (emp.id !== workerId) return emp;
            const newOverride = { from: dateStr, to: dateStr, amount, note: '' };
            return { ...emp, wageOverrides: [...(emp.wageOverrides || []), newOverride], lastUpdatedAt: Date.now() };
          })
        };
      })
    );
    setPendingWageByDate(prev => {
      const next = { ...prev, [dateStr]: { ...(prev[dateStr] || {}) } };
      delete next[dateStr][workerId];
      return next;
    });
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

    const inr = (n) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

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
      advanceRows = [{ date: '-', mode: 'No advances recorded', amount: '₹0', color: '#94A3B8' }];
    }

    const paymentRows = (paymentsInRange || []).length
      ? paymentsInRange.map(p => ({ 
          date: (p.date && typeof p.date === 'string') ? formatShortDayLabel(p.date) || p.date : (p.date || '-'), 
          mode: cleanForPDF((p.method || '') + (p.note ? ` (${p.note})` : '')), 
          amount: inr(p.amount || 0), 
          color: '#1E293B' 
        }))
      : [{ date: '-', mode: 'No wage payments recorded', amount: '₹0', color: '#94A3B8' }];

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
      bonusRows = [{ date: '-', mode: 'No bonus recorded', amount: '₹0', color: '#94A3B8' }];
    }

    const attendanceRows = (attendanceEntriesInRange || []).length
      ? attendanceEntriesInRange.map(([dateStr, record]) => {
      if (!dateStr || !record) {
        return { date: '-', mode: 'N/A', amount: '₹0', color: '#94A3B8' };
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
        amount: isAbsent ? '₹0' : `+${inr(wage)}`, 
        color: '#1E293B' 
      };
    })
    : [{ date: '-', mode: 'No attendance marked', amount: '₹0', color: '#94A3B8' }];

    const sanitizedFileName = `${(worker.name || 'Employee').trim().replace(/\s+/g, '_')}.pdf`;

    try {
      await ensureJsPDF();

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      registerRupeeFont(doc);

      const marginX = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 54;
      const logoDataUrl = await getAppLogoDataUrl();

      // "Generated with SmartManage" brand footer - same treatment as the
      // Quotation/Invoice PDFs, stamped on every page (including mid-document
      // page breaks triggered by ensureSpace below).
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
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 54; }
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
      drawAmountText(doc, inr(Math.max(0, paymentDueForRange || 0)), marginX, y);
      doc.setTextColor('#10B981');
      drawAmountText(doc, inr(totalPaidWithAdvances || 0), marginX + colWidth, y);
      const balanceVal = (balanceValue !== undefined && balanceValue !== null) ? balanceValue : ((paymentDueForRange || 0) - totalPaidWithAdvances);
      const balanceColor = balanceVal > 0 ? '#DC2626' : balanceVal < 0 ? '#10B981' : '#1E293B';
      const balanceSuffix = balanceVal > 0 ? ' (due)' : balanceVal < 0 ? ' (credit)' : ' (settled)';
      doc.setTextColor(balanceColor);
      drawAmountText(doc, inr(balanceVal) + balanceSuffix, marginX + colWidth * 2, y);
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
            drawAmountText(doc, cleanForPDF(String(row.amount || '₹0')), marginX + contentWidth, y, { align: 'right' });
            y += 16;
          });
        }
        y += 16;
      };

      addSection('Advance History', 'Deducted from wages owed.', advanceRows, 'No advance recorded.');
      addSection('Wage Payments', null, paymentRows, 'No wage payments recorded.');
      addSection('Bonus History', 'Extra payments - not part of the wage calculation above.', bonusRows, 'No bonus recorded.');
      addSection('Attendance Records', null, attendanceRows, 'No attendance marked.');

      drawBrandFooter();

      // Delegate to the same shared "deliver this PDF" step every other document type
      // (Quotation, Invoice, etc.) uses, instead of this function's own separate copy of
      // that logic - keeps the fix for the native write/share path in one place.
      await deliverGeneratedPdf(doc, sanitizedFileName);

      setPaymentFormValidationMsg('');

    } catch (err) {
      console.error('PDF generation failed:', err);

      let errorMsg = 'Could not generate the PDF statement. ';
      if (err.message === 'jsPDF library not loaded') {
        errorMsg += 'The PDF library is not available. Please try refreshing the app.';
      } else if (err.message && err.message.includes('undefined')) {
        errorMsg += 'Some data is missing. Please check that the worker has attendance and payment records.';
      } else {
        // Surface the real error text instead of a generic message - this is what's
        // failing silently on native builds (Filesystem/Share bridge) while working
        // fine in the browser, so we need to actually see it to diagnose it.
        errorMsg += `Please try again or contact support if the issue persists.${err?.message ? ` (${err.message})` : ''}`;
      }

      showAlert(errorMsg);
      setPaymentFormValidationMsg('');
    }
  };

  
  const [projects, setProjects] = useState(() => {
    try {
      const raw = persistedUser?.userId ? localStorage.getItem(PROJECTS_CACHE_KEY_PREFIX + persistedUser.userId) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.map(mapProjectFromApi) : [];
    } catch { return []; }
  });

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(toLocalISODate(new Date()));


// Each module loads its own data once the user is signed in.
useEffect(() => {
  if (isUserAuthenticated && loggedInUser?.userId) {
    const userId = loggedInUser.userId;
    loadUserProjects(userId);
  }
}, [isUserAuthenticated, loggedInUser?.userId]);


  // ===== Global Pull-to-Refresh (Facebook-style) =====
  // The app renders dozens of independent screens (module home, quotation list, settings,
  // etc.) as separate early `return (...)` statements further down this same component, so
  // a normal React element placed in JSX would only ever appear on whichever single screen
  // happens to be showing at the time. Rather than touching every one of those return
  // blocks, this drives a small overlay indicator that's attached directly to
  // document.body (outside React's render tree) and listens for the pull gesture on the
  // whole document - so "pull down from the top of any screen" works everywhere,
  // uniformly, the same way it does in the Facebook app.
  const pullToRefreshUserRef = useRef(loggedInUser);

  useEffect(() => { pullToRefreshUserRef.current = loggedInUser; }, [loggedInUser]);


  // Asks every registered module to re-fetch its own data (each module provides `refreshData`).
  const refreshAllUserData = async (userId) => {
    await Promise.all(
      Object.values(moduleRegistryRef.current).map((m) => (m && m.refreshData ? m.refreshData(userId) : null))
    );
  };


  useEffect(() => {
    const PULL_THRESHOLD = 72; // px of finger travel needed before a release triggers a refresh
    const MAX_PULL = 120; // visual cap so the indicator can't be dragged off screen

    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = [
      'position: fixed', 'top: 0', 'left: 50%', 'transform: translate(-50%, -60px)',
      'z-index: 9999', 'display: flex', 'align-items: center', 'justify-content: center',
      'width: 42px', 'height: 42px', 'border-radius: 50%', 'background: #0F766E',
      'box-shadow: 0 6px 16px rgba(15,23,42,0.25)', 'transition: transform 0.2s ease',
      'pointer-events: none',
    ].join(';');
    const spinner = document.createElement('div');
    spinner.style.cssText = [
      'width: 20px', 'height: 20px', 'border-radius: 50%',
      'border: 2.5px solid rgba(255,255,255,0.35)', 'border-top-color: #ffffff',
    ].join(';');
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    // Full-screen blocker: while a refresh is actually in flight, this sits above the
    // whole app (but below the spinner) and swallows every touch/click so the background
    // screen can't be scrolled, tapped, or navigated until refreshAllUserData resolves -
    // matching the "screen goes inactive during refresh" behavior of the Facebook app.
    // It's inert (pointer-events: none, fully transparent) the rest of the time so it
    // never interferes with normal use, including the pull gesture itself.
    const blocker = document.createElement('div');
    blocker.setAttribute('aria-hidden', 'true');
    blocker.setAttribute('data-ptr-blocker', '1');
    blocker.style.cssText = [
      'position: fixed', 'inset: 0', 'z-index: 9998',
      'background: rgba(15,23,42,0.08)', 'opacity: 0',
      'transition: opacity 0.2s ease', 'pointer-events: none',
    ].join(';');
    document.body.appendChild(blocker);
    const setBlocking = (isBlocking) => {
      blocker.style.pointerEvents = isBlocking ? 'auto' : 'none';
      blocker.style.opacity = isBlocking ? '1' : '0';
    };

    const styleTag = document.createElement('style');
    styleTag.textContent = '@keyframes ptr-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(styleTag);

    let startY = 0;
    let lastDistance = 0;
    let pulling = false;
    let dragging = false;
    let refreshing = false;
    let scrollableEl = null;

    // Walks up from the touched element to find whichever internal `overflowY: auto`
    // container (each screen has its own) actually owns the scroll, since this app is a
    // fixed-position single-page shell rather than a document that scrolls as a whole.
    const findScrollableAncestor = (node) => {
      let el = node;
      while (el && el !== document.body) {
        if (el.scrollHeight > el.clientHeight) {
          const overflowY = window.getComputedStyle(el).overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    const atTop = () => {
      if (scrollableEl) return scrollableEl.scrollTop <= 0;
      return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    };

    const setOverlay = (distance, spinning) => {
      const clamped = Math.min(distance, MAX_PULL);
      overlay.style.transition = dragging ? 'none' : 'transform 0.2s ease';
      overlay.style.transform = `translate(-50%, ${spinning ? 14 : clamped - 60}px)`;
      spinner.style.animation = spinning ? 'ptr-spin 0.7s linear infinite' : 'none';
      spinner.style.transform = spinning ? 'none' : `rotate(${Math.min((clamped / PULL_THRESHOLD) * 180, 180)}deg)`;
    };

    const onTouchStart = (e) => {
      if (refreshing || e.touches.length !== 1) return;
      scrollableEl = findScrollableAncestor(e.target);
      if (!atTop()) { pulling = false; return; }
      startY = e.touches[0].clientY;
      lastDistance = 0;
      pulling = true;
      dragging = false;
    };

    const onTouchMove = (e) => {
      if (!pulling || refreshing) return;
      const rawDelta = e.touches[0].clientY - startY;
      if (rawDelta <= 0 || !atTop()) {
        pulling = rawDelta <= 0 ? pulling : false;
        dragging = false;
        lastDistance = 0;
        setOverlay(0, false);
        return;
      }
      dragging = true;
      // Stop the native overscroll-bounce from fighting our own indicator mid-gesture.
      e.preventDefault();
      lastDistance = rawDelta * 0.5; // damping, so the indicator feels "heavier" than raw finger travel
      setOverlay(lastDistance, false);
    };

    const onTouchEnd = async () => {
      if (!pulling) return;
      pulling = false;
      const user = pullToRefreshUserRef.current;
      const shouldRefresh = dragging && lastDistance >= PULL_THRESHOLD && user?.userId;
      dragging = false;
      if (shouldRefresh) {
        refreshing = true;
        setOverlay(0, true);
        setBlocking(true);
        try {
          // Safety net: never keep the screen locked for more than 30s, even if a request stalls.
          await Promise.race([
            refreshAllUserData(user.userId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh timed out')), 30000)),
          ]);
        } catch (err) {
          console.error('Pull-to-refresh failed:', err);
        } finally {
          refreshing = false;
          setOverlay(0, false);
          setBlocking(false);
        }
      } else {
        setOverlay(0, false);
      }
      lastDistance = 0;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      overlay.remove();
      blocker.remove();
      styleTag.remove();
    };
  }, []);


  // ===== Internet connectivity: full-screen "No Internet" / "Loading..." handling =====
  // hasConnectedOnceRef distinguishes "never had internet since launch" (No Internet Connection)
  // from "had internet, then lost it" (Internet connection lost) per the two required message variants.
  const hasConnectedOnceRef = useRef(false);

  const [isOnline, setIsOnline] = useState(true);


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


  // Once back online after a drop, re-fetch the core session data in the BACKGROUND (in
  // parallel) while the user keeps using the screen they were on. This used to show a
  // full-screen "Loading..." gate until three sequential requests finished, which left the
  // app stuck whenever one of them hung.
  useEffect(() => {
    if (!isReconnecting) return;
    setIsReconnecting(false);
  }, [isReconnecting]);


  useEffect(() => {
    if (!isReconnecting) return;
    if (isUserAuthenticated && loggedInUser?.userId) {
      const userId = loggedInUser.userId;
      Promise.allSettled([
        loadUserProjects(userId),
      ]);
    }
  }, [isReconnecting]);


  // ===== App resume handling (Android background -> foreground) =====
  // While the app is in the background Android freezes the WebView and kills idle network
  // connections. On resume we (1) clear any full-screen gate/blocker that was left up by a
  // request that never finished, and (2) if the app was away for over a minute, quietly
  // refresh the data in the background without blocking the screen.
  const refreshAllUserDataRef = useRef(refreshAllUserData);

  refreshAllUserDataRef.current = refreshAllUserData;

  useEffect(() => {
    if (!isUserAuthenticated || !loggedInUser?.userId) return;
    const userId = loggedInUser.userId;
    const REFRESH_AFTER_AWAY_MS = 60 * 1000;
    let backgroundedAt = 0;
    let resumeRefreshing = false;
    let removed = false;
    let handle = null;

    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundedAt = Date.now();
        return;
      }
      setIsReconnecting(false);
      document.querySelectorAll('[data-ptr-blocker]').forEach((el) => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
      });
      if (!backgroundedAt || Date.now() - backgroundedAt < REFRESH_AFTER_AWAY_MS || resumeRefreshing) return;
      resumeRefreshing = true;
      refreshAllUserDataRef.current(userId)
        .catch((err) => console.error('Refresh on resume failed:', err))
        .finally(() => { resumeRefreshing = false; });
    }).then((h) => { if (removed) h.remove(); else handle = h; });

    return () => { removed = true; if (handle) handle.remove(); };
  }, [isUserAuthenticated, loggedInUser?.userId]);


  // ===== Module registration (read by the app shell) =====
  moduleRegistryRef.current.attendance = {
    closeTopmostScreen: closeAttendanceTopmostScreen,
    refreshData: (userId) => loadUserProjects(userId),
  };


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
      // Only active employees block a duplicate name - a name that's in the Removed
      // list is free to reuse.
      const isDuplicate = currentProject?.employees?.some(
        emp => emp.isActive !== false && emp.name.trim().toLowerCase() === tempWorkerName.trim().toLowerCase()
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
    // Only active projects block a duplicate name - a name that's in the Removed
    // list is free to reuse.
    const isDuplicate = projects.some(p => p.isActive !== false && p.name.trim().toLowerCase() === trimmedName.toLowerCase());
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
  // Only active projects block a duplicate name - a name that's in the Removed
  // list is free to reuse.
  const isDuplicateProjectName = projects.some(p => p.isActive !== false && p.name.trim().toLowerCase() === trimmedNewProjectName.toLowerCase());
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


  const projectsMatchingQuery = projects
    .filter(p => (projectStatusFilter === 'inactive' ? p.isActive === false : p.isActive !== false))
    .filter(p => p.name.toLowerCase().includes(siteSearchQuery.toLowerCase()));


  const sortedProjects = [...projectsMatchingQuery].sort((a, b) => {
    if (projectSortMode === 'az') return a.name.localeCompare(b.name);
    if (projectSortMode === 'za') return b.name.localeCompare(a.name);
    if (projectSortMode === 'lastModified') return (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0);
    return 0;
  });

    const activeProjectForWorkersList = projects.find(p => p.id === activeSiteViewId);


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


  if (isUserAuthenticated && loadingProjects && projects.length === 0) {
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

  // Draw only while this module is the open one. (Hooks above keep running either way.)
  if (activeModule !== 'attendance') return null;

  return (
    <div style={themeStyles.authDashboardContainer}>
      {activeSiteViewId && (() => {
        const currentProject = projects.find(p => p.id === activeSiteViewId);
        if (!currentProject) return null;

        // Deactivated projects have no Active/Deactive toggle - every employee under a
        // deactivated project is treated as deactivated along with it, regardless of
        // their individual isActive flag, so the status filter is skipped entirely here.
        const isCurrentProjectDeactivated = currentProject.isActive === false;
        const workersMatchingQuery = (currentProject.employees || [])
          .filter(w => (isCurrentProjectDeactivated ? true : (employeeStatusFilter === 'inactive' ? w.isActive === false : w.isActive !== false)))
          .filter(w => w.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()));
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
                    {currentProject.isActive === false && (
                      <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600' }}>{t('deactivated')}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#64748B' }}>
                  {currentProject.isActive !== false && (
                    <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => handleOpenEditProjectModal(currentProject)}>&#9999;&#65039;</span>
                  )}
                  {currentProject.isActive !== false && (
                    <span style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => handleDeleteProject(currentProject.id)}>&#128465;&#65039;</span>
                  )}
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
                const sortedByName = [...(currentProject2.employees || [])].filter(w => w.isActive !== false).sort((a, b) => a.name.localeCompare(b.name));
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', flexShrink: 0, whiteSpace: 'nowrap' }}>{t('bulkMark')}</span>
                        {[
                          { key: 'P', short: 'P', label: t('presentLabel'), color: '#16A34A' },
                          { key: 'HD', short: '1/2', label: t('totalHalfDay'), color: '#64748B' },
                          { key: 'A', short: 'A', label: t('totalAbsent'), color: '#DC2626' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => handleBulkAttendanceChange(opt.key)}
                            disabled={!currentDisplayedDate}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap',
                              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '999px',
                              padding: '4px 7px',
                              cursor: currentDisplayedDate ? 'pointer' : 'not-allowed',
                              opacity: currentDisplayedDate ? 1 : 0.5,
                            }}
                          >
                            <span style={{ fontSize: '10.5px', fontWeight: '700', color: opt.color }}>{opt.short}</span>
                            <span style={{ fontSize: '10.5px', fontWeight: '500', color: opt.color }}>{opt.label}</span>
                          </button>
                        ))}
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
                            const wageFieldValue = pendingWageByDate[currentDisplayedDate]?.[worker.id] ?? String(calculateNetDaily(effectiveWage, record.status));
                            const isSavingThisDayWage = savingDayWageKey === `${worker.id}|${currentDisplayedDate}`;

                            return (
                              <div key={worker.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px', border: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: avatarColors.bg, color: avatarColors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0, boxShadow: 'none', cursor: 'default' }}>{initials}</div>
                                    <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{worker.name}</h5>
                                  </div>
                                  <button
                                    onClick={() => handleOpenEditWage(worker)}
                                    style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: 'none', padding: '5px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    New Wages
                                    <FaChevronRight size={9} style={{ flexShrink: 0 }} />
                                  </button>
                                  <button
                                    onClick={() => { setTrackerWorkerId(worker.id); setTrackerCalendarMonth(new Date()); }}
                                    style={{ backgroundColor: '#FACC15', color: '#713F12', border: 'none', padding: '5px 8px', borderRadius: '16px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    Muster Card
                                    <FaChevronRight size={9} style={{ flexShrink: 0 }} />
                                  </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                    {[{ key: 'P', label: 'P', title: 'Present', color: '#16A34A' }, { key: 'HD', label: '1/2', title: 'Half Day', color: '#64748B' }, { key: 'A', label: 'A', title: 'Absent', color: '#DC2626' }].map((opt) => {
                                      const isActive = record.status === opt.key;
                                      return (
                                        <button
                                          key={opt.key}
                                          title={opt.title}
                                          aria-label={opt.title}
                                          onClick={() => handleIndividualAttendanceChange(worker.id, opt.key)}
                                          style={{
                                            border: isActive ? `1.5px solid ${opt.color}` : '1px solid #E2E8F0', padding: '5px 7px', borderRadius: '7px', fontSize: '11px', fontWeight: '700',
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
                                    display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0,
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
                                      readOnly={!currentDisplayedDate || isSavingThisDayWage}
                                      value={wageFieldValue}
                                      onFocus={handleAdvanceInputFocus}
                                      onClick={handleAdvanceInputFocus}
                                      onChange={(e) => handleDayWageInputChange(worker.id, e.target.value)}
                                      onBlur={() => handleDayWageInputBlur(worker, record.status)}
                                      style={{ width: '100%', minWidth: 0, padding: '6px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '11px', fontWeight: '700', color: currentDisplayedDate ? '#92400E' : '#94A3B8', boxSizing: 'border-box', cursor: currentDisplayedDate ? 'text' : 'pointer' }}
                                    />
                                  </div>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: 0,
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
                      // Muster-style status colors for the attendance-aware calendars below
                      // (Past days / Specific duration / Today), so the user can see who was
                      // Present/Half Day/Absent - and what they were paid - while picking dates
                      // to correct. Deliberately not used for "Onwards This Day" since those are
                      // future dates with no attendance recorded yet.
                      const editWageStatusColors = {
                        P: { bg: '#DCFCE7', text: '#15803D' },
                        A: { bg: '#FEE2E2', text: '#DC2626' },
                        HD: { bg: '#F1F5F9', text: '#475569' },
                      };
                      const getEditWageDayInfo = (dateStr, isDisabledDay) => {
                        if (isDisabledDay) return { colors: null, dayWage: null, dayAdvance: 0 };
                        const record = targetWorker.attendance?.[dateStr];
                        const status = record?.status;
                        const colors = status ? editWageStatusColors[status] : null;
                        const dayWage = status ? calculateNetDaily(getEffectiveWage(targetWorker, dateStr), status) : null;
                        const dayAdvance = status
                          ? (targetWorker.advancePayments || []).filter(p => p.date === dateStr).reduce((sum, p) => sum + (p.amount || 0), 0)
                          : 0;
                        return { colors, dayWage, dayAdvance };
                      };
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
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{targetWorker.name}</h3>
                              </div>
                              <button onClick={handleCloseEditWage} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1 }}>&times;</button>
                            </div>

                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 20px 20px' }}>
                              {editWageApplyTo === 'only' && false && (() => {
                                const todayMinDateStr = laterOfDates(toLocalISODate(new Date()), editWageJoinDateStr);
                                const todayMaxDateStr = selectedDate;
                                const todayYear = editWageTodayCalendarMonth.getFullYear();
                                const todayMonth = editWageTodayCalendarMonth.getMonth();
                                const todayFirstWeekday = new Date(todayYear, todayMonth, 1).getDay();
                                const todayDaysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
                                const todayCells = [];
                                for (let i = 0; i < todayFirstWeekday; i++) todayCells.push(null);
                                for (let d = 1; d <= todayDaysInMonth; d++) todayCells.push(d);
                                const todayRows = [];
                                for (let i = 0; i < todayCells.length; i += 7) todayRows.push(todayCells.slice(i, i + 7));

                                const minYear = parseInt(todayMinDateStr.slice(0, 4), 10);
                                const minMonth = parseInt(todayMinDateStr.slice(5, 7), 10) - 1;
                                const isAtEarliestMonth = todayYear === minYear && todayMonth === minMonth;
                                const maxYear = parseInt(todayMaxDateStr.slice(0, 4), 10);
                                const maxMonth = parseInt(todayMaxDateStr.slice(5, 7), 10) - 1;
                                const isAtLatestMonth = todayYear === maxYear && todayMonth === maxMonth;

                                return (
                                  <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('appliesUpTo')}</label>
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', backgroundColor: '#F8FAFC' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageTodayCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                          disabled={isAtEarliestMonth}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                        >&lsaquo;</button>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{editWageTodayCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageTodayCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                          disabled={isAtLatestMonth}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtLatestMonth ? 'default' : 'pointer', color: isAtLatestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                        >&rsaquo;</button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#94A3B8', fontWeight: '600', padding: '3px 0' }}>{d}</div>
                                        ))}
                                      </div>
                                      {todayRows.map((row, ri) => (
                                        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                          {row.map((dayNum, ci) => {
                                            if (!dayNum) return <div key={ci} />;
                                            const dateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                            const isDisabled = dateStr < todayMinDateStr || dateStr > todayMaxDateStr;
                                            const isSelected = dateStr === editWageTodayDate;
                                            const { colors, dayWage, dayAdvance } = getEditWageDayInfo(dateStr, isDisabled);
                                            return (
                                              <button
                                                type="button"
                                                key={ci}
                                                disabled={isDisabled}
                                                onClick={() => setEditWageTodayDate(dateStr)}
                                                style={{
                                                  textAlign: 'center', padding: '5px 0', margin: '2px 0', borderRadius: '8px',
                                                  fontSize: '12px', fontWeight: colors ? '700' : '500',
                                                  cursor: isDisabled ? 'default' : 'pointer',
                                                  color: isDisabled ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                                                  backgroundColor: colors ? colors.bg : 'transparent',
                                                  border: isSelected ? '2px solid #0B3C9B' : '2px solid transparent',
                                                  boxSizing: 'border-box',
                                                }}
                                              >
                                                <div>{dayNum}</div>
                                                {dayWage !== null && (
                                                  <div style={{ fontSize: '7.5px', fontWeight: '700', lineHeight: '1.3', marginTop: '1px', color: colors ? colors.text : '#64748B' }}>
                                                    <div>{`W-${dayWage}`}</div>
                                                    {dayAdvance > 0 && <div>{`A-${dayAdvance}`}</div>}
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ))}
                                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('presentLabel')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalHalfDay')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalAbsent')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                              {editWageApplyTo === 'past' && false && (() => {
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
                                            const { colors, dayWage, dayAdvance } = getEditWageDayInfo(dateStr, isDisabled);
                                            return (
                                              <button
                                                type="button"
                                                key={ci}
                                                disabled={isDisabled}
                                                onClick={() => toggleDate(dateStr)}
                                                style={{
                                                  textAlign: 'center', padding: '5px 0', margin: '2px 0', borderRadius: '8px',
                                                  fontSize: '12px', fontWeight: colors ? '700' : '500',
                                                  cursor: isDisabled ? 'default' : 'pointer',
                                                  color: isDisabled ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                                                  backgroundColor: colors ? colors.bg : 'transparent',
                                                  border: isSelected ? '2px solid #0B3C9B' : '2px solid transparent',
                                                  boxSizing: 'border-box',
                                                }}
                                              >
                                                <div>{dayNum}</div>
                                                {dayWage !== null && (
                                                  <div style={{ fontSize: '7.5px', fontWeight: '700', lineHeight: '1.3', marginTop: '1px', color: colors ? colors.text : '#64748B' }}>
                                                    <div>{`W-${dayWage}`}</div>
                                                    {dayAdvance > 0 && <div>{`A-${dayAdvance}`}</div>}
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ))}
                                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('presentLabel')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalHalfDay')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalAbsent')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                              {editWageApplyTo === 'specific' && false && (() => {
                                const specTodayStr = toLocalISODate(new Date());
                                const specYear = editWageSpecificCalendarMonth.getFullYear();
                                const specMonth = editWageSpecificCalendarMonth.getMonth();
                                const specFirstWeekday = new Date(specYear, specMonth, 1).getDay();
                                const specDaysInMonth = new Date(specYear, specMonth + 1, 0).getDate();
                                const specCells = [];
                                for (let i = 0; i < specFirstWeekday; i++) specCells.push(null);
                                for (let d = 1; d <= specDaysInMonth; d++) specCells.push(d);
                                const specRows = [];
                                for (let i = 0; i < specCells.length; i += 7) specRows.push(specCells.slice(i, i + 7));

                                const joinYear = parseInt(editWageJoinDateStr.slice(0, 4), 10);
                                const joinMonth = parseInt(editWageJoinDateStr.slice(5, 7), 10) - 1;
                                const isAtEarliestMonth = specYear === joinYear && specMonth === joinMonth;
                                const todayYear = parseInt(specTodayStr.slice(0, 4), 10);
                                const todayMonthIdx = parseInt(specTodayStr.slice(5, 7), 10) - 1;
                                const isAtLatestMonth = specYear === todayYear && specMonth === todayMonthIdx;

                                const handleSpecificDayClick = (dateStr) => {
                                  if (!editWageSpecificStart || (editWageSpecificStart && editWageSpecificEnd)) {
                                    setEditWageSpecificStart(dateStr);
                                    setEditWageSpecificEnd('');
                                  } else if (dateStr < editWageSpecificStart) {
                                    setEditWageSpecificStart(dateStr);
                                  } else {
                                    setEditWageSpecificEnd(dateStr);
                                  }
                                };

                                return (
                                  <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>{t('selectDates')}</label>
                                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>
                                        {editWageSpecificStart
                                          ? `${new Date(editWageSpecificStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${editWageSpecificEnd ? ` - ${new Date(editWageSpecificEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}`
                                          : ''}
                                      </span>
                                    </div>
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', backgroundColor: '#F8FAFC' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageSpecificCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                          disabled={isAtEarliestMonth}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                        >&lsaquo;</button>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{editWageSpecificCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageSpecificCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                          disabled={isAtLatestMonth}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtLatestMonth ? 'default' : 'pointer', color: isAtLatestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                        >&rsaquo;</button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#94A3B8', fontWeight: '600', padding: '3px 0' }}>{d}</div>
                                        ))}
                                      </div>
                                      {specRows.map((row, ri) => (
                                        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                          {row.map((dayNum, ci) => {
                                            if (!dayNum) return <div key={ci} />;
                                            const dateStr = `${specYear}-${String(specMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                            const isDisabled = dateStr < editWageJoinDateStr || dateStr > specTodayStr;
                                            const isRangeEnd = dateStr === editWageSpecificStart || dateStr === editWageSpecificEnd;
                                            const isInRange = editWageSpecificStart && editWageSpecificEnd &&
                                              dateStr >= editWageSpecificStart && dateStr <= editWageSpecificEnd;
                                            const isSelected = isRangeEnd || isInRange;
                                            const { colors, dayWage, dayAdvance } = getEditWageDayInfo(dateStr, isDisabled);
                                            return (
                                              <button
                                                type="button"
                                                key={ci}
                                                disabled={isDisabled}
                                                onClick={() => handleSpecificDayClick(dateStr)}
                                                style={{
                                                  textAlign: 'center', padding: '5px 0', margin: '2px 0', borderRadius: '8px',
                                                  fontSize: '12px', fontWeight: colors ? '700' : '500',
                                                  cursor: isDisabled ? 'default' : 'pointer',
                                                  color: isDisabled ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                                                  backgroundColor: colors ? colors.bg : 'transparent',
                                                  border: isRangeEnd ? '2px solid #0B3C9B' : (isInRange ? '2px dashed #93C5FD' : '2px solid transparent'),
                                                  boxSizing: 'border-box',
                                                }}
                                              >
                                                <div>{dayNum}</div>
                                                {dayWage !== null && (
                                                  <div style={{ fontSize: '7.5px', fontWeight: '700', lineHeight: '1.3', marginTop: '1px', color: colors ? colors.text : '#64748B' }}>
                                                    <div>{`W-${dayWage}`}</div>
                                                    {dayAdvance > 0 && <div>{`A-${dayAdvance}`}</div>}
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ))}
                                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('presentLabel')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalHalfDay')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalAbsent')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                              {editWageApplyTo === 'future' && (() => {
                                const futureYear = editWageFutureCalendarMonth.getFullYear();
                                const futureMonth = editWageFutureCalendarMonth.getMonth();
                                const futureFirstWeekday = new Date(futureYear, futureMonth, 1).getDay();
                                const futureDaysInMonth = new Date(futureYear, futureMonth + 1, 0).getDate();
                                const futureCells = [];
                                for (let i = 0; i < futureFirstWeekday; i++) futureCells.push(null);
                                for (let d = 1; d <= futureDaysInMonth; d++) futureCells.push(d);
                                const futureRows = [];
                                for (let i = 0; i < futureCells.length; i += 7) futureRows.push(futureCells.slice(i, i + 7));

                                const joinYear = parseInt(editWageJoinDateStr.slice(0, 4), 10);
                                const joinMonth = parseInt(editWageJoinDateStr.slice(5, 7), 10) - 1;
                                const isAtEarliestMonth = futureYear === joinYear && futureMonth === joinMonth;

                                return (
                                  <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '2px' }}>{t('newWageStartsFrom')}</label>
                                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', backgroundColor: '#F8FAFC' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageFutureCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                                          disabled={isAtEarliestMonth}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: isAtEarliestMonth ? 'default' : 'pointer', color: isAtEarliestMonth ? '#CBD5E1' : '#334155', padding: '2px 8px' }}
                                        >&lsaquo;</button>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{editWageFutureCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                                        <button
                                          type="button"
                                          onClick={() => setEditWageFutureCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#334155', padding: '2px 8px' }}
                                        >&rsaquo;</button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#94A3B8', fontWeight: '600', padding: '3px 0' }}>{d}</div>
                                        ))}
                                      </div>
                                      {futureRows.map((row, ri) => (
                                        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                          {row.map((dayNum, ci) => {
                                            if (!dayNum) return <div key={ci} />;
                                            const dateStr = `${futureYear}-${String(futureMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                            const isDisabled = dateStr < editWageJoinDateStr;
                                            const isSelected = dateStr === editWageFutureStart;
                                            const { colors, dayWage, dayAdvance } = getEditWageDayInfo(dateStr, isDisabled);
                                            return (
                                              <button
                                                type="button"
                                                key={ci}
                                                disabled={isDisabled}
                                                onClick={() => setEditWageFutureStart(dateStr)}
                                                style={{
                                                  textAlign: 'center', padding: '5px 0', margin: '2px 0', borderRadius: '8px',
                                                  fontSize: '12px', fontWeight: colors ? '700' : '500',
                                                  cursor: isDisabled ? 'default' : 'pointer',
                                                  color: isDisabled ? '#CBD5E1' : (colors ? colors.text : '#1E293B'),
                                                  backgroundColor: colors ? colors.bg : 'transparent',
                                                  border: isSelected ? '2px solid #0B3C9B' : '2px solid transparent',
                                                  boxSizing: 'border-box',
                                                }}
                                              >
                                                <div>{dayNum}</div>
                                                {dayWage !== null && (
                                                  <div style={{ fontSize: '7.5px', fontWeight: '700', lineHeight: '1.3', marginTop: '1px', color: colors ? colors.text : '#64748B' }}>
                                                    <div>{`W-${dayWage}`}</div>
                                                    {dayAdvance > 0 && <div>{`A-${dayAdvance}`}</div>}
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ))}
                                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#DCFCE7', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('presentLabel')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#F1F5F9', display: 'inline-block', border: '1px solid #E2E8F0' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalHalfDay')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <span style={{ width: '9px', height: '9px', borderRadius: '3px', backgroundColor: '#FEE2E2', display: 'inline-block' }}></span>
                                          <span style={{ fontSize: '10px', color: '#64748B' }}>{t('totalAbsent')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>{t('newDailyWageFromDate')}</label>
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
              {currentProject.isActive !== false && (
                <button
                  type="button"
                  onClick={() => {
                    setTempWorkerName(''); setTempWorkerPhone(''); setTempWorkerJoiningDate('');
                    setTempWorkerWageAmount(''); setEditingWorkerId(null);
                    setSelectedProjectId(activeSiteViewId); setIsWorkerSubFormOpen(true);
                  }}
                  style={{ ...themeStyles.actionAddBtn, width: '100%', marginBottom: '12px', flexShrink: 0 }}
                >
                  {t('addEmployee')}
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}>&#128269;</span>
                  <input
                    type="text"
                    placeholder={t('enterEmployeeName')}
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 34px', backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }}
                  />
                </div>
                {currentProject.isActive !== false && (
                  <button
                    onClick={() => handleOpenAttendanceScreen(currentProject)}
                    style={{
                      backgroundColor: '#0B3C9B',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {t('markAttendance')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: currentProject.isActive === false ? 'flex-end' : 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
                {currentProject.isActive !== false && (
                  <div style={{ display: 'inline-flex', background: '#EEF0F4', borderRadius: '10px', padding: '3px' }}>
                    <button
                      type="button"
                      onClick={() => setEmployeeStatusFilter('active')}
                      style={{
                        border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12.5px', fontWeight: '700',
                        fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.1px',
                        backgroundColor: employeeStatusFilter === 'active' ? '#0B3C9B' : 'transparent',
                        color: employeeStatusFilter === 'active' ? '#ffffff' : '#64748B',
                        boxShadow: employeeStatusFilter === 'active' ? '0 1px 4px rgba(15,23,42,0.15)' : 'none',
                      }}
                    >
                      {t('activeEmployees')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmployeeStatusFilter('inactive')}
                      style={{
                        border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12.5px', fontWeight: '700',
                        fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.1px',
                        backgroundColor: employeeStatusFilter === 'inactive' ? '#0B3C9B' : 'transparent',
                        color: employeeStatusFilter === 'inactive' ? '#ffffff' : '#64748B',
                        boxShadow: employeeStatusFilter === 'inactive' ? '0 1px 4px rgba(15,23,42,0.15)' : 'none',
                      }}
                    >
                      {t('deactiveEmployees')}
                    </button>
                  </div>
                )}
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
                    const isDeactivated = isCurrentProjectDeactivated || worker.isActive === false;
                    const lastAttendanceDateStr = isDeactivated ? getLastAttendanceDate(worker) : null;
                    return (
                      <div
                        key={worker.id}
                        onClick={isDeactivated ? () => setSelectedDeactiveWorkerId(worker.id) : undefined}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '14px', padding: '12px 14px', border: '1px solid #F1F5F9', flexShrink: 0, opacity: isDeactivated ? 0.75 : 1, cursor: isDeactivated ? 'pointer' : 'default' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatarColors.bg, color: avatarColors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', boxShadow: 'none', cursor: 'default' }}>{initials}</div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{worker.name}</h5>
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                              {worker.role || t('labor')} &bull; <span style={{ color: '#94A3B8' }}>
                                {isDeactivated
                                  ? `${t('lastDate')} ${lastAttendanceDateStr ? new Date(lastAttendanceDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}`
                                  : `${t('joined')} ${worker.joiningDate ? new Date(worker.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '01 Jul'}`}
                              </span>
                              {isDeactivated && (<><span> &bull; </span><span style={{ color: '#DC2626', fontWeight: '600' }}>{t('deactivated')}</span></>)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!isDeactivated && (
                            <span
                              onClick={() => handleEditWorkerInline(currentProject, worker)}
                              style={{ cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                              title={t('edit')}
                            >&#9999;&#65039;</span>
                          )}
                          {!isDeactivated && (
                            <span
                              onClick={() => handleDeleteWorkerInline(currentProject.id, worker.id)}
                              style={{ cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#F87171' }}
                              title={t('delete')}
                            >&#128465;&#65039;</span>
                          )}
                          {isDeactivated && (
                            <span
                              style={{ cursor: 'pointer', fontSize: '17px', width: '20px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}
                              title={t('employeeDetails')}
                            >&#8250;</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>{t('noEmployeesMatch')}</p>
                )}
              </div>
            </div>

            {/* ============ DEACTIVE EMPLOYEE DETAILS SCREEN ============ */}
            {/* Read-only screen opened via the ">" arrow on the Deactive list. Full
                payment/attendance history stays intact on the worker object even after
                isActive is set to false, so nothing here needs to look anywhere else. */}
            {selectedDeactiveWorkerId !== null && selectedDeactiveWorkerId !== undefined && (() => {
              const deactiveWorker = (currentProject.employees || []).find(w => w.id === selectedDeactiveWorkerId);
              if (!deactiveWorker) return null;

              const lastAttendanceDateStr = getLastAttendanceDate(deactiveWorker);

              const statusMetaDeactive = {
                P: { label: t('presentLabel'), sub: 'Full day' },
                HD: { label: t('totalHalfDay'), sub: '50%' },
                A: { label: t('totalAbsent'), sub: '0%' }
              };

              // Full history, unbounded by any date range - the deactivated employee's
              // complete record, exactly what "Download Statement" should reflect.
              const attendanceEntriesAll = Object.entries(deactiveWorker.attendance || {})
                .sort((a, b) => b[0].localeCompare(a[0]));
              const paymentsAll = (deactiveWorker.payments || []).slice().sort((a, b) => b.date.localeCompare(a.date));
              const advancePaymentsAll = (deactiveWorker.advancePayments || []).slice().sort((a, b) => b.date.localeCompare(a.date));
              const bonusPaymentsAll = (deactiveWorker.bonusPayments || []).slice().sort((a, b) => b.date.localeCompare(a.date));

              const dueAll = calcPaymentDueForRange(deactiveWorker, null, null);
              const paidAll = calcPaidInRange(deactiveWorker, null, null);
              const advanceAll = deactiveWorker.advance || 0;
              const balanceAll = dueAll - advanceAll - paidAll;

              return (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isKeyboardOpen ? '100vh' : 'calc(100vh - 64px)', backgroundColor: '#f4f6f9', zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <button onClick={() => setSelectedDeactiveWorkerId(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0, flexShrink: 0 }}>&lsaquo;</button>
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t('employeeDetails')}</h2>
                  </div>

                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px 64px 16px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0F172A', margin: '0 0 18px 0', textAlign: 'center' }}>
                      {deactiveWorker.name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '10.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('dateOfJoining')}</p>
                        <p style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#0F172A' }}>
                          {deactiveWorker.joiningDate ? new Date(deactiveWorker.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '10.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('lastDay')}</p>
                        <p style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#0F172A' }}>
                          {lastAttendanceDateStr ? new Date(lastAttendanceDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : t('noAttendanceMarkedYet')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadStatement({
                        worker: deactiveWorker, project: currentProject,
                        fromDate: null, toDate: null,
                        paymentDueForRange: dueAll, paidInRange: paidAll, balanceValue: balanceAll,
                        paymentsInRange: paymentsAll, advancePaymentsInRange: advancePaymentsAll, bonusPaymentsInRange: bonusPaymentsAll,
                        attendanceEntriesInRange: attendanceEntriesAll, statusMeta: statusMetaDeactive, selectedDate
                      })}
                      style={{
                        width: '100%', fontSize: '13.5px', color: '#0B3C9B', fontWeight: '700', cursor: 'pointer',
                        background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px',
                        padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <span aria-hidden="true">&#8681;</span>
                      {t('downloadStatement')}
                    </button>
                  </div>
                </div>
              );
            })()}

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
            <button onClick={() => closeTopmostScreen()} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>&lsaquo;</button>
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

        <div style={{ ...themeStyles.sectionMetaRow, justifyContent: 'space-between', flexWrap: 'wrap', rowGap: '8px' }}>
          <div style={{ display: 'inline-flex', background: '#EEF0F4', borderRadius: '10px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setProjectStatusFilter('active')}
              style={{
                border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '700',
                fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.1px',
                backgroundColor: projectStatusFilter === 'active' ? '#0B3C9B' : 'transparent',
                color: projectStatusFilter === 'active' ? '#ffffff' : '#64748B',
                boxShadow: projectStatusFilter === 'active' ? '0 1px 4px rgba(15,23,42,0.15)' : 'none',
              }}
            >
              {t('activeEmployees')}
            </button>
            <button
              type="button"
              onClick={() => setProjectStatusFilter('inactive')}
              style={{
                border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '700',
                fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.1px',
                backgroundColor: projectStatusFilter === 'inactive' ? '#0B3C9B' : 'transparent',
                color: projectStatusFilter === 'inactive' ? '#ffffff' : '#64748B',
                boxShadow: projectStatusFilter === 'inactive' ? '0 1px 4px rgba(15,23,42,0.15)' : 'none',
              }}
            >
              {t('deactiveEmployees')}
            </button>
          </div>
          <select value={projectSortMode} onChange={(e) => setProjectSortMode(e.target.value)} style={themeStyles.sortSelect}>
            <option value="az">{t('sortAZ')}</option>
            <option value="za">{t('sortZA')}</option>
            <option value="lastModified">{t('sortLastModified')}</option>
          </select>
        </div>

        <div style={themeStyles.projectsScrollArea}>
          {sortedProjects.length > 0 ? sortedProjects.map((project) => {
            const isDeactiveProject = project.isActive === false;
            const activeWorkersCount = (project.employees || []).length;
            const activeOnlyEmployeesCount = (project.employees || []).filter(w => w.isActive !== false).length;
            const totalDueAmount = computeProjectTotalDue(project);
            const totalWagesAmount = computeProjectTotalWages(project);
            const totalBonusAmount = computeProjectTotalBonus(project);
            const lastAttendanceDate = computeProjectLastAttendanceDate(project);
            const todayStr = toLocalISODate(new Date());
            const isAttendanceStale = !lastAttendanceDate || lastAttendanceDate !== todayStr;
            return (
              <div
                key={project.id}
                onClick={() => {
                  setActiveSiteViewId(project.id);
                  // Opening a Deactive project should land straight on that project's
                  // Deactive Employees list, not the Active tab.
                  setEmployeeStatusFilter(isDeactiveProject ? 'inactive' : 'active');
                }}
                style={{ ...themeStyles.worksiteCard, cursor: 'pointer', opacity: isDeactiveProject ? 0.75 : 1 }}
              >
                <div style={themeStyles.cardHeadingRow}>
                  <div style={themeStyles.siteIconWrapper}>&#127959;&#65039;</div>
                  <h4 style={themeStyles.siteTitle}>{project.name}</h4>
                  <span style={themeStyles.arrowNavIndicator}>&rsaquo;</span>
                </div>
                {isDeactiveProject ? (
                  <div style={themeStyles.metricsRowLine}>
                    <div style={themeStyles.metricCellFlat}>
                      <p style={themeStyles.metricValueFlat}>{activeWorkersCount}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('employeesLabel')}</span>
                    </div>
                    <div style={themeStyles.metricDividerLine} />
                    <div style={themeStyles.metricCellFlat}>
                      <p style={{ ...themeStyles.metricValueFlat, color: '#0B3C9B' }}>{"\u20B9"}{totalWagesAmount.toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('wagesLabel')}</span>
                    </div>
                    <div style={themeStyles.metricDividerLine} />
                    <div style={themeStyles.metricCellFlat}>
                      <p style={{ ...themeStyles.metricValueFlat, color: '#10B981' }}>{"\u20B9"}{totalBonusAmount.toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('bonus')}</span>
                    </div>
                  </div>
                ) : (
                  <div style={themeStyles.metricsRowLine}>
                    <div style={themeStyles.metricCellFlat}>
                      <p style={themeStyles.metricValueFlat}>{activeOnlyEmployeesCount}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('employeesLabel')}</span>
                    </div>
                    <div style={themeStyles.metricDividerLine} />
                    <div style={themeStyles.metricCellFlat}>
                      <p style={{ ...themeStyles.metricValueFlat, color: '#0B3C9B' }}>{"\u20B9"}{totalWagesAmount.toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('paidLabel')}</span>
                    </div>
                    <div style={themeStyles.metricDividerLine} />
                    <div style={themeStyles.metricCellFlat}>
                      <p style={{ ...themeStyles.metricValueDueFlat, color: totalDueAmount <= 0 ? '#10B981' : '#DC2626' }}>{"\u20B9"}{Math.abs(totalDueAmount).toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{totalDueAmount <= 0 ? t('extraPaidLabel') : t('dueLabel')}</span>
                    </div>
                    <div style={themeStyles.metricDividerLine} />
                    <div style={themeStyles.metricCellFlat}>
                      <p style={{ ...themeStyles.metricValueFlat, color: '#10B981' }}>{"\u20B9"}{totalBonusAmount.toLocaleString('en-IN')}</p>
                      <span style={themeStyles.metricLabelTextFlat}>{t('bonus')}</span>
                    </div>
                  </div>
                )}
                {!isDeactiveProject && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '12px' }}>{isAttendanceStale ? '\u26A0\uFE0F' : '\u2705'}</span>
                    <span style={{ fontSize: '11px', color: isAttendanceStale ? '#DC2626' : '#94A3B8', fontWeight: isAttendanceStale ? '600' : '500' }}>
                      {lastAttendanceDate
                        ? (lastAttendanceDate === todayStr ? t('attendanceMarkedToday') : `${t('attendanceMarkedOnPrefix')} ${formatShortDayLabel(lastAttendanceDate)}`)
                        : t('attendanceNotMarked')}
                    </span>
                  </div>
                )}
              </div>
            );
          }) : (
            <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>
              {projectStatusFilter === 'inactive' ? t('noDeactiveWorksitesMatch') : t('noWorksitesMatch')}
            </p>
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
        // Deactivated projects are excluded here - they're not valid targets for new
        // attendance or payment entries, only viewable/recoverable from the Deactive tab.
        const pickerMatches = projects
          .filter(p => p.isActive !== false)
          .filter(p => p.name.toLowerCase().includes(projectPickerSearch.toLowerCase()));

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
                {[...projects].filter(p => p.isActive !== false).sort((a, b) => a.name.localeCompare(b.name)).map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
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
