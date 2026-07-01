import { useCookieConsent } from './CookieConsentContext';

export const useConsent = () => {
  const { preferences } = useCookieConsent();

  return {
    isAnalyticalAllowed: preferences?.analytical ?? false,
    isMarketingAllowed: preferences?.marketing ?? false,
    isFunctionalAllowed: preferences?.functional ?? false,
    isEssentialAllowed: true, // Always true
    hasConsented: preferences !== null,
  };
};
