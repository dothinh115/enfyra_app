import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon", "@nuxt/ui", "@nuxtjs/tailwindcss", "nuxt-codemirror"],
  ssr: false,
  nitro: {
    publicAssets: [
      {
        dir: "public/plugins",
        maxAge: 0, // No cache for plugins
      },
    ],
  },
  css: ["./assets/css/main.css"],
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#3b82f6" },
        { name: "color-scheme", content: "dark light" },
      ],
      title: "Enfyra CMS - Content Management System",
    },
  },
  imports: {
    dirs: [
      // Auto-import from utils
      "utils/**",
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            codemirror: [
              "@codemirror/view",
              "@codemirror/state",
              "@codemirror/lang-javascript",
            ],
            "vue-table": ["@tanstack/vue-table"],
          },
        },
      },
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL,
      apiPrefix: "/api",
    },
  },
});
