import { describe, it, expect } from 'vitest'

describe('Basic Tests', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr[0]).toBe(1)
  })

  it('should handle objects', () => {
    const obj = { name: 'test', value: 123 }
    expect(obj.name).toBe('test')
    expect(obj.value).toBe(123)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    const result = await promise
    expect(result).toBe('success')
  })
})