<script setup lang="ts">
// No complex logic needed for this simple page
</script>

<template>
  <div class="mx-auto max-w-2xl text-center space-y-8 py-12">
    <!-- Page Header -->
    <CommonPageHeader
      title="Table Collections"
      description="Manage your database table structures and schemas. Select a table from the sidebar to get started."
      title-size="xl"
      show-background
      background-gradient="from-primary-500/8 via-primary-400/4 to-transparent"
      padding-y="py-8"
    />
    
    <!-- Icon decoration -->
    <div class="flex justify-center">
      <div class="p-6 bg-primary/10 rounded-full">
        <UIcon name="lucide:database" class="w-16 h-16 text-primary" />
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
