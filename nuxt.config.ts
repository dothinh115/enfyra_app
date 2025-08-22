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
    },
  },
  imports: {
    dirs: [
      // Auto-import from utils - top level
      "app/utils",
      "app/utils/**",

      // Auto-import from utils subdirectories
      "app/utils/types",
      "app/utils/types/**",
      "app/utils/common",
      "app/utils/common/**",
      "app/utils/common/filter",
      "app/utils/common/filter/**",
      "app/utils/components",
      "app/utils/components/**",
      "app/utils/extension",
      "app/utils/extension/**",
      "app/utils/server",
      "app/utils/server/**",
      "app/utils/server/auth",
      "app/utils/server/auth/**",

      // Auto-import from composables
      "app/composables",
      "app/composables/**",
    ],
    imports: [
      // Auto-import types from utils
      {
        from: "~/utils/common/filter/FilterTypes",
        name: "FilterGroup",
        type: true,
      },
      {
        from: "~/utils/common/filter/FilterTypes",
        name: "FilterCondition",
        type: true,
      },
      {
        from: "~/utils/common/filter/FilterTypes",
        name: "FilterProps",
        type: true,
      },
      {
        from: "~/utils/common/filter/FilterTypes",
        name: "FieldOption",
        type: true,
      },
    ],
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
