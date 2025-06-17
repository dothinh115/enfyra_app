export default defineAppConfig({
  toaster: {
    position: "top-right" as const,
    expand: true,
    duration: 8000,
  },
  ui: {
    button: {
      compoundVariants: [{ color: "primary", class: "hover:cursor-pointer" }],
    },
    modal: {
      slots: {},
      variants: {},
    },
  },
});
