export function useDataTableActions(
  tableName: string,
  fetchData: () => Promise<void>,
  data: Ref<any[]>
) {
  const selectedRows = ref<any[]>([]);
  const isSelectionMode = ref(false);
  const deleteId = ref<string>("");

  const toast = useToast();
  const { confirm } = useConfirm();
  const { createLoader } = useLoader();

  // Delete single record composable
  const { execute: executeDelete, error: deleteError } = useApiLazy(
    () => `/${tableName}`,
    {
      method: "delete",
      errorContext: "Delete Record",
    }
  );

  async function handleDelete(id: string) {
    const result = await confirm({
      title: "Delete Record",
      content: "Are you sure you want to delete this record?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!result) return;

    const deleteLoader = createLoader();

    await deleteLoader.withLoading(async () => {
      // Set the id and execute pre-defined composable
      deleteId.value = id;
      await executeDelete({ id });

      // Check if there was an error
      if (deleteError.value) {
        return;
      }

      toast.add({
        title: "Success",
        description: "Record deleted successfully",
        color: "success",
      });
      await fetchData();
    });
  }

  function handleSelectionChange(rows: any[]) {
    selectedRows.value = rows;

    // Auto-exit selection mode if no data available
    if (isSelectionMode.value && data.value.length === 0) {
      isSelectionMode.value = false;
    }
  }

  async function handleBulkDelete(rows: any[]) {
    const result = await confirm({
      title: "Delete Records",
      content: `Are you sure you want to delete ${rows.length} record(s)?`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (!result) return;

    const deleteLoader = createLoader();

    await deleteLoader.withLoading(async () => {
      // Extract IDs from selected rows
      const ids = rows.map((row) => row.id);

      // Use batch delete with ids parameter
      await executeDelete({ ids });

      // Check if there was an error
      if (deleteError.value) {
        return;
      }

      toast.add({
        title: "Success",
        description: `${rows.length} record(s) deleted successfully`,
        color: "success",
      });

      // Clear selection after successful delete
      selectedRows.value = [];
      await fetchData();
    });
  }

  return {
    selectedRows,
    isSelectionMode,
    handleDelete,
    handleBulkDelete,
    handleSelectionChange,
  };
}
