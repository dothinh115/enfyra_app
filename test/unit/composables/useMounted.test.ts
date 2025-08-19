import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUseMounted = () => {
  const isMounted = { value: false }

  const mount = vi.fn(() => {
    isMounted.value = true
  })

  const unmount = vi.fn(() => {
    isMounted.value = false
  })

  return {
    isMounted,
    mount,
    unmount
  }
}

describe('useMounted', () => {
  let mounted: ReturnType<typeof mockUseMounted>

  beforeEach(() => {
    mounted = mockUseMounted()
  })

  describe('initialization', () => {
    it('should initialize as not mounted', () => {
      expect(mounted.isMounted.value).toBe(false)
    })
  })

  describe('mount/unmount', () => {
    it('should set isMounted to true when mounted', () => {
      mounted.mount()

      expect(mounted.isMounted.value).toBe(true)
      expect(mounted.mount).toHaveBeenCalled()
    })

    it('should set isMounted to false when unmounted', () => {
      // First mount
      mounted.mount()
      expect(mounted.isMounted.value).toBe(true)

      // Then unmount
      mounted.unmount()
      expect(mounted.isMounted.value).toBe(false)
      expect(mounted.unmount).toHaveBeenCalled()
    })

    it('should handle multiple mount/unmount cycles', () => {
      // Initial state
      expect(mounted.isMounted.value).toBe(false)

      // First cycle
      mounted.mount()
      expect(mounted.isMounted.value).toBe(true)
      
      mounted.unmount()
      expect(mounted.isMounted.value).toBe(false)

      // Second cycle
      mounted.mount()
      expect(mounted.isMounted.value).toBe(true)
      
      mounted.unmount()
      expect(mounted.isMounted.value).toBe(false)
    })
  })
})