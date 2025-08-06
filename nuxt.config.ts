import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon", "@nuxt/ui", "@nuxtjs/tailwindcss", "nuxt-codemirror"],
  ssr: false,
  css: ["./assets/css/main.css"],
  imports: {
    dirs: [
      // Auto-import from utils
      'utils/**'
    ]
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('@tanstack/vue-table')) {
              return 'vendor-table'
            }
            if (id.includes('@codemirror/')) {
              return 'vendor-codemirror'
            }
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      }
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL,
      apiPrefix: "/api",
    },
  },
});
