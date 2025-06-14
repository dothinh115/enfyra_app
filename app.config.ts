export default defineAppConfig({
  toaster: {
    position: "top-right" as const,
    expand: true,
    duration: 5000,
  },
  ui: {
    button: {
      compoundVariants: [{ color: "primary", class: "hover:cursor-pointer" }],
    },
    switch: {
      slots: {
        root: "flex-row-reverse",
        label: "me-2",
      },
    },
  },
});
