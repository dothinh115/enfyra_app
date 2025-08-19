import { vi } from 'vitest'

// Mock global Vue functions
global.ref = vi.fn()
global.computed = vi.fn()
global.reactive = vi.fn()
global.watch = vi.fn()
global.onMounted = vi.fn()
global.nextTick = vi.fn()

// Mock Nuxt composables
global.useState = vi.fn()
global.useRoute = vi.fn()
global.useRouter = vi.fn()
global.navigateTo = vi.fn()
global.$fetch = vi.fn()

// Mock permission and auth composables
global.usePermissions = vi.fn(() => ({
  hasAnyPermission: vi.fn(() => false),
  hasAllPermissions: vi.fn(() => false),
  checkPermissionCondition: vi.fn(() => false)
}))

global.useAuth = vi.fn(() => ({
  me: { value: null }
}))

// Setup default mocks
beforeEach(() => {
  vi.clearAllMocks()
})