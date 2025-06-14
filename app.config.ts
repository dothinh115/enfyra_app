export default defineAppConfig({
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
