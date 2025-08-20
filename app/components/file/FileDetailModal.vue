<script setup lang="ts">
// Use useState to get global state
const showFileDetailModal = useState("file-detail-modal", () => false);
const selectedFile = useState<any>("file-selected", () => null);

// Close modal function
function closeModal() {
  showFileDetailModal.value = false;
  selectedFile.value = null;
}

// Format date
function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Get file type color
function getFileTypeColor(type: string): string {
  switch (type) {
    case "image":
      return "text-green-500 bg-green-100 dark:bg-green-900/30";
    case "video":
      return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
    case "audio":
      return "text-orange-500 bg-orange-100 dark:bg-orange-900/30";
    case "document":
      return "text-red-500 bg-red-100 dark:bg-red-900/30";
    case "archive":
      return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
    default:
      return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
  }
}
</script>

<template>
  <Teleport to="body">
    <UModal
      v-model:open="showFileDetailModal"
      :close="{
        icon: 'lucide:x',
        color: 'error',
        variant: 'soft',
        label: 'Close',
      }"
      title="File Details"
    >
      <template #body>
        <div v-if="selectedFile" class="space-y-4">
          <!-- File Icon and Name -->
          <div class="flex items-center gap-3">
            <!-- Image preview for image files -->
            <div
              v-if="selectedFile.type === 'image'"
              class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img
                :src="selectedFile.assetUrl"
                :alt="selectedFile.displayName"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <!-- Icon for other files -->
            <div
              v-else
              class="p-3 rounded-lg"
              :class="getFileTypeColor(selectedFile.type || 'other')"
            >
              <UIcon :name="selectedFile.icon" class="w-6 h-6" />
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ selectedFile.displayName }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedFile.mimetype }}
              </p>
            </div>
          </div>

          <!-- Description/Title -->
          <div v-if="selectedFile.title || selectedFile.description">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {{ selectedFile.title ? "Title" : "Description" }}
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedFile.title || selectedFile.description }}
            </p>
          </div>

          <!-- File Properties -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Size
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatFileSize(parseInt(selectedFile.filesize || "0")) }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Type
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {{ selectedFile.type || "Unknown" }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Created
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(selectedFile.createdAt) }}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Modified
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(selectedFile.updatedAt) }}
              </p>
            </div>
          </div>

          <!-- Additional Properties -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Status</span
              >
              <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {{ selectedFile.status }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Visibility</span
              >
              <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {{ selectedFile.visibility }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Storage</span
              >
              <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {{ selectedFile.storage }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >ID</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {{ selectedFile.id }}
              </span>
            </div>
          </div>

          <!-- Asset URL -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Asset URL
            </label>
            <div class="flex items-center gap-2">
              <input
                :value="'/api' + selectedFile.assetUrl"
                readonly
                class="flex-1 text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono"
              />
              <UButton icon="lucide:copy" size="xs" variant="outline" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            v-if="selectedFile?.assetUrl"
            icon="lucide:external-link"
            variant="outline"
          >
            Open File
          </UButton>
          <UButton @click="closeModal"> Close </UButton>
        </div>
      </template>
    </UModal>
  </Teleport>
</template>
