<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 px-4"
  >
    <UCard class="w-full max-w-md p-6 sm:p-8 shadow-2xl rounded-2xl">
      <!-- Branding -->
      <template #header>
        <div class="text-center space-y-2">
          <div class="flex justify-center items-center gap-3">
            <Icon name="lucide:shield-check" class="text-primary" size="40" />
            <h1 class="text-3xl font-bold text-primary">Dynamiq CMS</h1>
          </div>
          <p class="text-sm text-gray-400">Đăng nhập để tiếp tục</p>
        </div>
      </template>

      <!-- Form -->
      <UForm :state="form" @submit="handleLogin">
        <div class="flex flex-col gap-y-5">
          <!-- Email -->
          <div>
            <label
              class="block text-sm font-medium text-gray-300 mb-1"
              for="email"
              >Email
              <UInput
                v-model="form.email"
                placeholder="you@example.com"
                icon="lucide:mail"
                size="lg"
                class="w-full"
                id="email"
              />
            </label>
          </div>

          <!-- Password -->
          <div>
            <label
              class="block text-sm font-medium text-gray-300 mb-1"
              for="password"
              >Mật khẩu
              <UInput
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                icon="lucide:lock"
                size="lg"
                class="w-full"
                id="password"
            /></label>
          </div>

          <!-- Checkbox -->
          <div class="flex justify-end">
            <USwitch v-model="form.remember" label="Ghi nhớ đăng nhập" />
          </div>

          <!-- Submit -->
          <UButton type="submit" size="lg" class="w-full justify-center">
            Đăng nhập
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const form = reactive({
  email: "",
  password: "",
  remember: false,
});

const handleLogin = () => {
  console.log("Đăng nhập:", form);
};
</script>
