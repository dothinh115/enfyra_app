<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 px-4"
  >
    <UCard class="w-full max-w-md lg:p-6 p-2 sm:p-8 shadow-2xl rounded-2xl">
      <!-- Branding -->
      <template #header>
        <div class="text-center space-y-2">
          <div class="flex justify-center items-center gap-3">
            <Icon name="lucide:shield-check" class="text-primary" size="40" />
            <h1 class="lg:text-3xl md:text-xl text-lg font-bold text-primary">
              Dynamiq CMS
            </h1>
          </div>
          <p class="text-sm text-gray-400">Đăng nhập để tiếp tục</p>
        </div>
      </template>

      <!-- Form -->
      <UForm :state="form" @submit="handleLogin">
        <div class="flex flex-col gap-y-5">
          <!-- Email -->
          <div>
            <UFormField :error="error.email" label="Email" required>
              <UInput
                v-model="form.email"
                placeholder="you@example.com"
                icon="lucide:mail"
                size="lg"
                class="w-full"
                id="email"
                :color="error.email ? 'error' : 'primary'"
                :error="!!error.email"
                :required="true"
              />
            </UFormField>
          </div>

          <!-- Password -->
          <div>
            <UFormField :error="error.password" label="Password" required>
              <UInput
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                icon="lucide:lock"
                size="lg"
                class="w-full"
                id="password"
            /></UFormField>
          </div>

          <!-- Checkbox -->
          <div class="flex justify-end">
            <USwitch v-model="form.remember" label="Ghi nhớ đăng nhập" />
          </div>

          <!-- Submit -->
          <UButton
            type="submit"
            size="lg"
            class="w-full justify-center"
            loading-auto
          >
            Đăng nhập
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const { login } = useAuth();
const toast = useToast();
const form = reactive({
  email: "",
  password: "",
  remember: false,
});
const error = reactive({
  email: "",
  password: "",
});
async function handleLogin() {
  const ok = await login(form);
  if (ok) window.location.reload();
  else {
    toast.add({
      title: "Đăng nhập thất bại!",
      description: "Email hoặc mật khẩu không đúng",
      icon: "lucide:octagon-x",
      color: "error",
    });
  }
}
watch(
  () => form.email,
  (newVal) => {
    if (!newVal) {
      error.email = "Kông được để trống!";
    } else if (!emailPattern.test(newVal)) {
      error.email = "Phải đúng định dạng!";
    } else {
      error.email = "";
    }
  }
);

watch(
  () => form.password,
  (newVal) => {
    if (!newVal) {
      error.password = "Không được để trống!";
    } else {
      error.password = "";
    }
  }
);
</script>
