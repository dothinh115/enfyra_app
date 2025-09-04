import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/icon",
    "@nuxt/ui",
    "@nuxtjs/tailwindcss",
    "nuxt-codemirror",
    "@enfyra/sdk-nuxt",
    // "../enfyra-sdk-nuxt/dist/module.mjs",
  ],
  colorMode: {
    preference: "dark",
    fallback: "dark",
    storageKey: "nuxt-color-mode",
  },
  ssr: false,
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
    dirs: ["composables/**/**", "utils/**/**/**"],
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
            vendor: ["vue", "vue-router"],
          },
        },
      },
    },
  },
  enfyraSDK: {
    apiUrl: process.env.API_URL,
  },
});
