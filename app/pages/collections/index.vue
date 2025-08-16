<script setup lang="ts">
// No complex logic needed for this simple page
</script>

<template>
  <div class="mx-auto max-w-2xl text-center space-y-8 py-12">
    <!-- Header with icon -->
    <div class="space-y-4">
      <div class="flex justify-center">
        <div class="p-6 bg-primary/10 rounded-full">
          <UIcon name="lucide:database" class="w-16 h-16 text-primary" />
        </div>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-foreground">Table Collections</h1>
        <p class="text-lg text-muted-foreground mt-2 max-w-md mx-auto">
          Manage your database table structures and schemas. Select a table from
          the sidebar to get started.
        </p>
      </div>
    </div>

    <!-- Simple description -->
    <div class="p-8 bg-muted/50 rounded-lg">
      <UIcon
        name="lucide:database"
        class="w-12 h-12 text-muted-foreground mx-auto mb-4"
      />
      <h2 class="text-xl font-semibold text-foreground mb-2">Choose a Table</h2>
      <p class="text-muted-foreground">
        Use the sidebar menu to select a table you want to manage or create a
        new one.
      </p>
    </div>
  </div>
</template>
