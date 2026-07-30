import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';

export const useBackButton = (isEnabled, onBackPressed) => {
  const onBackPressedRef = useRef(onBackPressed);
  onBackPressedRef.current = onBackPressed;

  useEffect(() => {
    if (!isEnabled) return;

    const handler = () => {
      onBackPressedRef.current();
    };

    const listener = App.addListener('backButton', handler);

    return () => {
      listener.remove();
    };
  }, [isEnabled]);
};