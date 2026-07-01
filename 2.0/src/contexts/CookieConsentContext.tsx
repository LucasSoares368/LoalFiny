import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CookiePreferences = {
  essential: boolean;
  analytical: boolean;
  marketing: boolean;
  functional: boolean;
};

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  savePreferences: (prefs: CookiePreferences) => Promise<void>;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  isLoading: boolean;
}

const COOKIE_CONSENT_KEY = 'financeiro_pro_cookie_consent';

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytical: false,
  marketing: false,
  functional: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        
        // 1. Try to load from localStorage first (for speed and non-logged users)
        const localPrefs = localStorage.getItem(COOKIE_CONSENT_KEY);
        
        // 2. Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Try to load from DB for logged in users
          const { data, error } = await supabase
            .from('cookie_consents')
            .select('preferences')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (data?.preferences) {
            const dbPrefs = data.preferences as CookiePreferences;
            setPreferences(dbPrefs);
            setShowBanner(false);
            // Sync local storage
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(dbPrefs));
          } else if (localPrefs) {
            setPreferences(JSON.parse(localPrefs));
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
        } else {
          // Not logged in, use local storage
          if (localPrefs) {
            setPreferences(JSON.parse(localPrefs));
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
        }
      } catch (err) {
        console.error('Error loading cookie preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const savePreferences = async (prefs: CookiePreferences) => {
    try {
      // Ensure essential is always true
      const finalPrefs = { ...prefs, essential: true };
      
      // 1. Save to local storage
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalPrefs));
      setPreferences(finalPrefs);
      setShowBanner(false);
      
      // 2. If logged in, save to DB
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('cookie_consents')
          .upsert({
            user_id: session.user.id,
            preferences: finalPrefs,
            consent_date: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
      
      // Trigger event for analytics scripts to catch
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: finalPrefs }));
      
    } catch (err) {
      console.error('Error saving cookie preferences:', err);
    }
  };

  return (
    <CookieConsentContext.Provider value={{ preferences, savePreferences, showBanner, setShowBanner, isLoading }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
