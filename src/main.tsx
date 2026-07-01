import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Exemplo de como reagir ao consentimento de cookies para carregar scripts externos
window.addEventListener('cookieConsentUpdated', (event: any) => {
  const preferences = event.detail;
  if (preferences.analytical) {
    console.log('LGPD: Carregando scripts analíticos (GA, etc.)...');
    // window.loadGoogleAnalytics();
  }
  if (preferences.marketing) {
    console.log('LGPD: Carregando scripts de marketing (Pixel, etc.)...');
    // window.loadFacebookPixel();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
