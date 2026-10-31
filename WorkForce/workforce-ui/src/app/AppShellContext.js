import { createContext, useContext } from 'react';

// Shared app state (signed-in user, language, popups, profile, ...) provided by AppShell.
export const AppShellContext = createContext(null);

// Use inside any screen/module:  const { loggedInUser, t, showAlert } = useAppShell();
export const useAppShell = () => useContext(AppShellContext);
