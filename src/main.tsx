import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from "@tanstack/react-query"
import App from './App.tsx'
import './index.css'
import { queryClient } from "./lib/queryClient"

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
