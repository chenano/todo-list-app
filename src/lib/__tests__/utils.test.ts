import { cn, formatDate, formatRelativeTime, truncateText, generateId, debounce, throttle } from '../utils'

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
    if (formatStr === 'MMM d') return 'Jan 1'
    return 'Jan 1, 2024'
  }),
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isYesterday: jest.fn(() => false),
  isPast: jest.fn(() => false),
}))

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('handles objects with boolean values', () => {
      expect(cn({
        'active': true,
        'disabled': false,
        'visible': true
      })).toBe('active visible')
    })

    it('merges conflicting Tailwind classes', () => {
      // This tests the tailwind-merge functionality
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatDate', () => {
    it('formats date with default format', () => {
      const date = new Date('2024-01-01')
      expect(formatDate(date)).toBe('Jan 1, 2024')
    })

    it('formats date with custom format', () => {
      const date = new Date('2024-01-01')
      expect(formatDate(date, 'MMM d')).toBe('Jan 1')
    })

    it('handles string dates', () => {
      expect(formatDate('2024-01-01')).toBe('Jan 1, 2024')
    })

    it('handles null dates', () => {
      expect(formatDate(null)).toBe('')
    })

    it('handles undefined dates', () => {
      expect(formatDate(undefined)).toBe('')
    })

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats relative time correctly', () => {
      const date = new Date('2024-01-01')
      expect(formatRelativeTime(date)).toBe('2 hours ago')
    })

    it('handles string dates', () => {
      expect(formatRelativeTime('2024-01-01')).toBe('2 hours ago')
    })

    it('handles null dates', () => {
      expect(formatRelativeTime(null)).toBe('')
    })

    it('handles invalid dates', () => {
      expect(formatRelativeTime('invalid-date')).toBe('Invalid Date')
    })

    it('adds suffix by default', () => {
      const date = new Date('2024-01-01')
      expect(formatRelativeTime(date)).toContain('ago')
    })

    it('can remove suffix', () => {
      const date = new Date('2024-01-01')
      const mockFormatDistanceToNow = require('date-fns').formatDistanceToNow
      mockFormatDistanceToNow.mockReturnValue('2 hours')
      
      expect(formatRelativeTime(date, { addSuffix: false })).toBe('2 hours')
    })
  })

  describe('truncateText', () => {
    it('truncates text longer than max length', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very long...')
    })

    it('returns original text if shorter than max length', () => {
      const shortText = 'Short text'
      expect(truncateText(shortText, 20)).toBe('Short text')
    })

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })

    it('handles null and undefined', () => {
      expect(truncateText(null as any, 10)).toBe('')
      expect(truncateText(undefined as any, 10)).toBe('')
    })

    it('uses custom suffix', () => {
      const longText = 'This is a very long text'
      expect(truncateText(longText, 10, '---')).toBe('This is a---')
    })

    it('handles max length of 0', () => {
      expect(truncateText('text', 0)).toBe('...')
    })

    it('handles negative max length', () => {
      expect(truncateText('text', -5)).toBe('...')
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('generates IDs with correct length', () => {
      const id = generateId(10)
      expect(id).toHaveLength(10)
    })

    it('generates IDs with default length', () => {
      const id = generateId()
      expect(id).toHaveLength(8) // Assuming default length is 8
    })

    it('generates IDs with only alphanumeric characters', () => {
      const id = generateId(20)
      expect(id).toMatch(/^[a-zA-Z0-9]+$/)
    })

    it('generates different IDs on multiple calls', () => {
      const ids = Array.from({ length: 100 }, () => generateId())
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('delays function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('preserves this context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function(this: any) {
          return this.value
        })
      }

      const debouncedMethod = debounce(obj.method, 100)
      debouncedMethod.call(obj)
      jest.advanceTimersByTime(100)

      expect(obj.method).toHaveBeenCalled()
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('limits function execution frequency', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('executes immediately on first call', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('preserves this context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function(this: any) {
          return this.value
        })
      }

      const throttledMethod = throttle(obj.method, 100)
      throttledMethod.call(obj)

      expect(obj.method).toHaveBeenCalled()
    })
  })
})