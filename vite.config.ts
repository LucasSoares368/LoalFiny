import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico"],
      manifest: {
        name: "LocalFiny - Controle Financeiro",
        short_name: "LocalFiny",
        description: "Controle financeiro inteligente para microempreendedores, afiliados e freelas.",
        theme_color: "#2E9B6D",
        background_color: "#F7FAF8",
        display: "standalone",
        orientation: "portrait",
        scope: "./",
        start_url: "./index.html#/dashboard",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react-router-dom"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@edusites/bancos-brasil/core": path.resolve(
        __dirname,
        "./node_modules/@edusites/bancos-brasil/src/core.js"
      ),
    },
    dedupe: ["react", "react-dom"],
  },
}));
