export const columnTypes = [
  { label: "UUID", value: "uuid", icon: "ph:key" },
  { label: "Integer", value: "int", icon: "tabler:123" },
  { label: "Varchar", value: "varchar", icon: "mdi:format-text" },
  { label: "Boolean", value: "boolean", icon: "mdi:toggle-switch" },
  { label: "Date", value: "date", icon: "mdi:calendar" },
  { label: "Text", value: "text", icon: "mdi:file-document-outline" },
  { label: "Simple JSON", value: "simple-json", icon: "mdi:code-json" },
];

export const relationTypes = [
  {
    label: "One to One",
    value: "one-to-one",
    icon: "ph:link-simple-horizontal",
  },
  { label: "One to Many", value: "one-to-many", icon: "mdi:source-branch" },
  { label: "Many to One", value: "many-to-one", icon: "mdi:source-merge" },
  { label: "Many to Many", value: "many-to-many", icon: "mdi:share-variant" },
];
