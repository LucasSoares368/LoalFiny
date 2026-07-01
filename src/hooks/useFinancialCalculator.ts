import { useState, useCallback, useEffect } from 'react';

// Use a simple global-like state using a custom event or a shared observable
// Since we don't have a state manager, we'll use a custom event to toggle the calculator
// or just a simple singleton-like state if we want to keep it simple.

let isOpenGlobal = false;
const listeners = new Set<(isOpen: boolean) => void>();

export const useFinancialCalculator = () => {
  const [isOpen, setIsOpen] = useState(isOpenGlobal);

  useEffect(() => {
    const listener = (open: boolean) => setIsOpen(open);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setOpen = useCallback((open: boolean) => {
    isOpenGlobal = open;
    listeners.forEach(listener => listener(open));
  }, []);

  const toggle = useCallback(() => {
    setOpen(!isOpenGlobal);
  }, [setOpen]);

  return {
    isOpen,
    setOpen,
    toggle
  };
};
