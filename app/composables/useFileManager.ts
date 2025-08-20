interface FileDefinition {
  id: string;
  filename: string;
  filename_disk: string;
  mimetype: string;
  type: "image" | "video" | "document" | "audio" | "archive" | "other" | null;
  filesize: string;
  storage: string;
  location: string;
  title?: string;
  description?: string;
  visibility: "public" | "private";
  status: "active" | "archived" | "quarantine";
  folder?: any;
  uploaded_by?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface FileItem extends FileDefinition {
  itemType: "file";
  icon: string;
  displayName: string;
  size: string;
  modifiedAt: string;
  assetUrl: string;
  previewUrl: string;
}

interface FolderItem {
  id: string;
  name: string;
  itemType: "folder";
  icon: string;
  displayName: string;
  size: null;
  modifiedAt: string;
  children?: any[];
}

export function useFileManager(parentId?: string) {
  // Fetch folders
  const { getIncludeFields: getFolderFields } = useSchema("folder_definition");
  const {
    data: foldersData,
    pending: foldersPending,
    execute: fetchFolders,
  } = useApiLazy(() => "folder_definition", {
    query: computed(() => ({
      fields: getFolderFields(),
      limit: 0,
      sort: "-order,-createdAt",
      filter: parentId
        ? {
            parent: { id: { _eq: parentId } },
          }
        : {
            parent: { id: { _is_null: true } },
          },
    })),
    errorContext: "Load Folders",
  });

  // Fetch files
  const { getIncludeFields: getFileFields } = useSchema("file_definition");
  const {
    data: filesData,
    pending: filesPending,
    execute: fetchFiles,
  } = useApiLazy(() => "file_definition", {
    query: computed(() => ({
      fields: getFileFields(),
      limit: 0,
      sort: "-createdAt",
      filter: parentId
        ? {
            folder: {
              id: {
                _eq: parentId,
              },
            },
          }
        : {
            folder: { _is_null: true },
          },
    })),
    errorContext: "Load Files",
  });

  // Combined data
  const folders = computed(() => foldersData.value?.data || []);
  const files = computed(
    () => filesData.value?.data || ([] as FileDefinition[])
  );

  // Combined items for display (folders first, then files)
  const items = computed((): (FolderItem | FileItem)[] => {
    const folderItems: FolderItem[] = folders.value.map((folder: any) => ({
      ...folder,
      itemType: "folder" as const,
      icon: "lucide:folder",
      displayName: folder.name,
      size: null,
      modifiedAt: folder.updatedAt,
    }));

    const fileItems: FileItem[] = files.value.map((file: FileDefinition) => ({
      ...file,
      itemType: "file" as const,
      icon: getFileIcon(file.mimetype, file.type),
      displayName: file.filename || file.title || "Untitled",
      size: formatFileSize(parseInt(file.filesize || "0")),
      modifiedAt: file.updatedAt || "",
      assetUrl: `/assets/${file.id}`, // Asset URL for files
      previewUrl: `/assets/${file.id}`, // Same URL for preview
    }));

    return [...folderItems, ...fileItems];
  });

  const pending = computed(() => foldersPending.value || filesPending.value);

  // Fetch both folders and files
  const fetchAll = async () => {
    await Promise.all([fetchFolders(), fetchFiles()]);
  };

  // File utilities
  function getFileIcon(mimetype: string, type: FileDefinition["type"]): string {
    if (mimetype?.startsWith("image/")) return "lucide:image";
    if (mimetype?.startsWith("video/")) return "lucide:video";
    if (mimetype?.startsWith("audio/")) return "lucide:music";
    if (mimetype?.includes("pdf")) return "lucide:file-text";
    if (mimetype?.includes("zip") || mimetype?.includes("archive"))
      return "lucide:archive";
    if (mimetype?.startsWith("text/")) return "lucide:file-text";
    if (type === "document") return "lucide:file-text";
    return "lucide:file";
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  return {
    // Data
    folders,
    files,
    items,
    pending,

    // Actions
    fetchAll,
    fetchFolders,
    fetchFiles,

    // Utilities
    getFileIcon,
    formatFileSize,
  };
}
