import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon", "@nuxt/ui", "@nuxtjs/tailwindcss", "nuxt-codemirror"],
  colorMode: {
    preference: "dark",
    fallback: "dark",
    storageKey: "nuxt-color-mode",
  },
  ssr: false,
  nitro: {
    publicAssets: [
      {
        dir: "public/extensions",
        maxAge: 0, // No cache for extensions
      },
    ],
  },
  css: ["./app/assets/css/main.css"],
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        },
        { name: "theme-color", content: "#3b82f6" },
        { name: "color-scheme", content: "dark" },
      ],
      title: "Enfyra App - Content Management System",
      style: [
        {
          innerHTML: `
            html, body {
              overflow: hidden !important;
              position: fixed !important;
              width: 100% !important;
              height: 100% !important;
            }
          `,
        },
      ],
    },
  },
  imports: {
    dirs: ["utils/**/**/**", "composables/**/**"],
    imports: [
      {
        name: 'useEnfyraApi',
        from: '@enfyra/vue-sdk'
      },
      {
        name: 'useEnfyraConfig',
        from: '@enfyra/vue-sdk'
      }
    ]
  },
  alias: {
    "~/app": "./app",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // CodeMirror core - essential packages
            "codemirror-core": [
              "@codemirror/view",
              "@codemirror/state",
              "@codemirror/language",
            ],
            // CodeMirror languages - separate chunk
            "codemirror-langs": [
              "@codemirror/lang-javascript",
              "@codemirror/lang-vue",
              "@codemirror/lang-html",
            ],
            // CodeMirror features - separate chunk
            "codemirror-features": [
              "@codemirror/lint",
              "@codemirror/commands",
              "@codemirror/autocomplete",
              "@codemirror/search",
            ],
            // Vue table - separate chunk để lazy load
            "vue-table": ["@tanstack/vue-table"],
            // Core vendor
            vendor: ["vue", "vue-router"],
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
