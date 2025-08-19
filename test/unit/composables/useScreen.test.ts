import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUseScreen = () => {
  const isMobile = { value: false }
  const isTablet = { value: false }
  const isDesktop = { value: true }
  const screenSize = { value: 'desktop' }

  const updateScreenSize = vi.fn((width: number) => {
    if (width < 640) {
      isMobile.value = true
      isTablet.value = false
      isDesktop.value = false
      screenSize.value = 'mobile'
    } else if (width < 1024) {
      isMobile.value = false
      isTablet.value = true
      isDesktop.value = false
      screenSize.value = 'tablet'
    } else {
      isMobile.value = false
      isTablet.value = false
      isDesktop.value = true
      screenSize.value = 'desktop'
    }
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    updateScreenSize
  }
}

describe('useScreen', () => {
  let screen: ReturnType<typeof mockUseScreen>

  beforeEach(() => {
    screen = mockUseScreen()
  })

  describe('initialization', () => {
    it('should initialize with desktop as default', () => {
      expect(screen.isDesktop.value).toBe(true)
      expect(screen.isMobile.value).toBe(false)
      expect(screen.isTablet.value).toBe(false)
      expect(screen.screenSize.value).toBe('desktop')
    })
  })

  describe('screen size detection', () => {
    it('should detect mobile screen size', () => {
      screen.updateScreenSize(400)

      expect(screen.isMobile.value).toBe(true)
      expect(screen.isTablet.value).toBe(false)
      expect(screen.isDesktop.value).toBe(false)
      expect(screen.screenSize.value).toBe('mobile')
    })

    it('should detect tablet screen size', () => {
      screen.updateScreenSize(768)

      expect(screen.isMobile.value).toBe(false)
      expect(screen.isTablet.value).toBe(true)
      expect(screen.isDesktop.value).toBe(false)
      expect(screen.screenSize.value).toBe('tablet')
    })

    it('should detect desktop screen size', () => {
      screen.updateScreenSize(1200)

      expect(screen.isMobile.value).toBe(false)
      expect(screen.isTablet.value).toBe(false)
      expect(screen.isDesktop.value).toBe(true)
      expect(screen.screenSize.value).toBe('desktop')
    })

    it('should handle edge cases for breakpoints', () => {
      // Exactly at mobile breakpoint
      screen.updateScreenSize(640)
      expect(screen.isTablet.value).toBe(true)

      // Exactly at tablet breakpoint
      screen.updateScreenSize(1024)
      expect(screen.isDesktop.value).toBe(true)

      // Just below mobile breakpoint
      screen.updateScreenSize(639)
      expect(screen.isMobile.value).toBe(true)

      // Just below tablet breakpoint
      screen.updateScreenSize(1023)
      expect(screen.isTablet.value).toBe(true)
    })
  })
})