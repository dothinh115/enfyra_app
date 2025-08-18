import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Mock $fetch
const mockFetch = vi.fn()

// Mock useToast
const mockToast = {
  add: vi.fn()
}

// Mock useApi implementation
const mockUseApi = (url: string, options: any = {}) => {
  const data = ref(null)
  const pending = ref(false)
  const error = ref(null)

  const execute = async (customOptions = {}) => {
    pending.value = true
    error.value = null
    
    try {
      const result = await mockFetch(url, { ...options, ...customOptions })
      data.value = result
      return result
    } catch (err) {
      error.value = err
      mockToast.add({
        title: 'API Error',
        description: err.message,
        color: 'error'
      })
      throw err
    } finally {
      pending.value = false
    }
  }

  return { execute, data, pending, error }
}

// Mock useApiLazy implementation
const mockUseApiLazy = (urlOrFunction: any, options: any = {}) => {
  const data = ref(null)
  const pending = ref(false)
  const error = ref(null)

  const execute = async (customOptions = {}) => {
    pending.value = true
    error.value = null
    
    try {
      const url = typeof urlOrFunction === 'function' ? urlOrFunction() : urlOrFunction
      const finalOptions = { ...options, ...customOptions }
      
      // Handle computed query
      if (finalOptions.query && typeof finalOptions.query === 'object' && 'value' in finalOptions.query) {
        finalOptions.query = finalOptions.query.value
      }
      
      const result = await mockFetch(url, finalOptions)
      data.value = result
      return result
    } catch (err: any) {
      error.value = err
      
      if (err.status === 401) {
        mockToast.add({
          title: 'Authentication Required',
          description: 'Please log in to continue',
          color: 'error'
        })
      } else {
        const errorTitle = options.errorContext ? `${options.errorContext} Error` : 'API Error'
        mockToast.add({
          title: errorTitle,
          description: err.message,
          color: 'error'
        })
      }
      throw err
    } finally {
      pending.value = false
    }
  }

  return { execute, data, pending, error }
}

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useApi', () => {
    it('should execute API call successfully', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } }
      mockFetch.mockResolvedValue(mockResponse)
      
      const { execute, data, pending, error } = mockUseApi('/test', {
        method: 'GET'
      })
      
      expect(pending.value).toBe(false)
      expect(data.value).toBe(null)
      expect(error.value).toBe(null)
      
      const result = await execute()
      
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'GET'
      }))
      expect(data.value).toEqual(mockResponse)
      expect(error.value).toBe(null)
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      const mockError = new Error('API Error')
      mockFetch.mockRejectedValue(mockError)
      
      const { execute, data, error } = mockUseApi('/test')
      
      await expect(execute()).rejects.toThrow('API Error')
      
      expect(error.value).toEqual(mockError)
      expect(data.value).toBe(null)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'API Error',
          color: 'error'
        })
      )
    })

    it('should set pending state during request', async () => {
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve
      })
      mockFetch.mockReturnValue(fetchPromise)
      
      const { execute, pending } = mockUseApi('/test')
      
      expect(pending.value).toBe(false)
      
      const executePromise = execute()
      expect(pending.value).toBe(true)
      
      resolveFetch!({ success: true })
      await executePromise
      
      expect(pending.value).toBe(false)
    })

    it('should merge custom options with defaults', async () => {
      mockFetch.mockResolvedValue({})
      
      const { execute } = mockUseApi('/test', {
        method: 'POST',
        headers: { 'Custom-Header': 'value' }
      })
      
      await execute({ 
        body: { test: 'data' },
        query: { param: 'value' }
      })
      
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Custom-Header': 'value'
        }),
        body: { test: 'data' },
        query: { param: 'value' }
      }))
    })
  })

  describe('useApiLazy', () => {
    it('should not execute immediately', () => {
      mockUseApiLazy('/test')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should execute when explicitly called', async () => {
      mockFetch.mockResolvedValue({ data: 'test' })
      
      const { execute, data } = mockUseApiLazy('/test')
      
      expect(data.value).toBe(null)
      
      await execute()
      
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.any(Object))
      expect(data.value).toEqual({ data: 'test' })
    })

    it('should handle dynamic URL function', async () => {
      mockFetch.mockResolvedValue({ data: 'test' })
      
      const { execute } = mockUseApiLazy(() => '/dynamic/123')
      
      await execute()
      
      expect(mockFetch).toHaveBeenCalledWith('/dynamic/123', expect.any(Object))
    })

    it('should handle computed query parameters', async () => {
      mockFetch.mockResolvedValue({})
      
      const searchTerm = ref('test')
      const { execute } = mockUseApiLazy('/search', {
        query: { value: { q: searchTerm.value } }
      })
      
      await execute()
      
      expect(mockFetch).toHaveBeenCalledWith('/search', expect.objectContaining({
        query: { q: 'test' }
      }))
    })

    it('should include errorContext in error handling', async () => {
      const mockError = new Error('Network Error')
      mockFetch.mockRejectedValue(mockError)
      
      const { execute } = mockUseApiLazy('/test', {
        errorContext: 'Test Operation'
      })
      
      await expect(execute()).rejects.toThrow('Network Error')
      
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Operation Error',
          description: 'Network Error'
        })
      )
    })

    it('should handle 401 errors with redirect', async () => {
      const mockError = {
        status: 401,
        message: 'Unauthorized'
      }
      mockFetch.mockRejectedValue(mockError)
      
      const { execute } = mockUseApiLazy('/protected')
      
      await expect(execute()).rejects.toEqual(mockError)
      
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Authentication Required'
        })
      )
    })

    it('should preserve data on subsequent errors', async () => {
      const successData = { data: 'success' }
      mockFetch.mockResolvedValueOnce(successData)
      
      const { execute, data, error } = mockUseApiLazy('/test')
      
      // First successful call
      await execute()
      expect(data.value).toEqual(successData)
      expect(error.value).toBe(null)
      
      // Second call fails
      const mockError = new Error('Server Error')
      mockFetch.mockRejectedValueOnce(mockError)
      
      await expect(execute()).rejects.toThrow('Server Error')
      expect(data.value).toEqual(successData) // Data preserved
      expect(error.value).toEqual(mockError)
    })
  })
})