// ===== TEMPLATE for a new module (Module 3, 4, ...) =====
// 1. Copy this file to src/modules/<yourname>/<YourName>Module.jsx and rename the component.
// 2. Change MODULE_ID below (any unique string, e.g. 'inventory').
// 3. In src/home/ModuleHome.jsx copy a tile and call setActiveModule('<your id>').
// 4. In src/app/AppShell.jsx add <YourNameModule /> next to <EmployeeModule /> and <DocumentsModule />.
// Nothing else in the app needs to change, and the other modules are never touched.

import { useEffect, useState } from 'react';
import { useAppShell } from '../../app/AppShellContext';

const MODULE_ID = 'example';

export default function ExampleModule() {
  // Anything shared by the whole app comes from the shell (add more names as you need them).
  const { activeModule, setActiveModule, isUserAuthenticated, loggedInUser, moduleRegistryRef } = useAppShell();

  // ---- this module's own state, handlers and data loading live here ----
  const [subView, setSubView] = useState(null);

  useEffect(() => {
    if (isUserAuthenticated && loggedInUser?.userId) {
      // load this module's data here (runs once after sign-in, even while the module is closed)
    }
  }, [isUserAuthenticated, loggedInUser?.userId]);

  // ---- tell the shell how to handle the Android back button and pull-to-refresh ----
  moduleRegistryRef.current[MODULE_ID] = {
    // Close the top-most thing (popup / sub screen). Return true if you closed something,
    // false when you are on the module's first page (the shell then returns to the Main page).
    closeTopmostScreen: () => {
      if (subView !== null) { setSubView(null); return true; }
      return false;
    },
    // Called by pull-to-refresh and when the app resumes. Return a promise.
    refreshData: async (userId) => {},
  };

  // ---- draw only while this module is the open one (keep this AFTER all hooks) ----
  if (activeModule !== MODULE_ID) return null;

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <button type="button" onClick={() => setActiveModule(null)}>Back to main page</button>
      <h1>Example module</h1>
    </div>
  );
}
