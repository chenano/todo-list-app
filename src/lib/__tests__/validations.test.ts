import {
  listFormSchema,
  listUpdateSchema,
  taskFormSchema,
  taskUpdateSchema,
  userProfileSchema,
  passwordSchema,
  emailSchema,
  ListFormData,
  ListUpdateData,
  TaskFormData,
  TaskUpdateData,
} from '../validations'

describe('validations', () => {
  describe('emailSchema', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ]

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        '',
      ]

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure123',
        'Test1234567',
        'ComplexP@ss1',
      ]

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(true)
      })
    })

    it('rejects weak passwords', () => {
      const invalidPasswords = [
        'short',
        '1234567',
        'password',
        'PASSWORD',
        'Password',
        '12345678',
      ]

      invalidPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 8 characters')
        }
      })
    })
  })

  describe('listFormSchema', () => {
    it('validates correct list form data', () => {
      const validData: ListFormData = {
        name: 'My Todo List',
        description: 'A list for my daily tasks',
      }

      const result = listFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates list with empty description', () => {
      const validData: ListFormData = {
        name: 'My Todo List',
        description: '',
      }

      const result = listFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects list without name', () => {
      const invalidData = {
        description: 'A list without a name',
      }

      const result = listFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects list with empty name', () => {
      const invalidData: ListFormData = {
        name: '',
        description: 'A list with empty name',
      }

      const result = listFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Name is required')
      }
    })

    it('rejects list with name too long', () => {
      const invalidData: ListFormData = {
        name: 'a'.repeat(101), // Assuming max length is 100
        description: 'Valid description',
      }

      const result = listFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100 characters')
      }
    })

    it('rejects list with description too long', () => {
      const invalidData: ListFormData = {
        name: 'Valid name',
        description: 'a'.repeat(501), // Assuming max length is 500
      }

      const result = listFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500 characters')
      }
    })
  })

  describe('listUpdateSchema', () => {
    it('validates partial list updates', () => {
      const validUpdates: ListUpdateData[] = [
        { name: 'Updated name' },
        { description: 'Updated description' },
        { name: 'New name', description: 'New description' },
        { description: '' }, // Empty description should be valid
      ]

      validUpdates.forEach(update => {
        const result = listUpdateSchema.safeParse(update)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid updates', () => {
      const invalidUpdates = [
        { name: '' }, // Empty name
        { name: 'a'.repeat(101) }, // Name too long
        { description: 'a'.repeat(501) }, // Description too long
      ]

      invalidUpdates.forEach(update => {
        const result = listUpdateSchema.safeParse(update)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('taskFormSchema', () => {
    it('validates correct task form data', () => {
      const validData: TaskFormData = {
        title: 'Complete project',
        description: 'Finish the todo app project',
        priority: 'high',
        due_date: '2024-12-31',
      }

      const result = taskFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates task with minimal data', () => {
      const validData: TaskFormData = {
        title: 'Simple task',
        description: '',
        priority: 'medium',
        due_date: '',
      }

      const result = taskFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects task without title', () => {
      const invalidData = {
        description: 'Task without title',
        priority: 'medium',
        due_date: '2024-12-31',
      }

      const result = taskFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects task with empty title', () => {
      const invalidData: TaskFormData = {
        title: '',
        description: 'Task with empty title',
        priority: 'medium',
        due_date: '2024-12-31',
      }

      const result = taskFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required')
      }
    })

    it('rejects task with invalid priority', () => {
      const invalidData = {
        title: 'Valid title',
        description: 'Valid description',
        priority: 'invalid',
        due_date: '2024-12-31',
      }

      const result = taskFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects task with invalid date format', () => {
      const invalidData: TaskFormData = {
        title: 'Valid title',
        description: 'Valid description',
        priority: 'medium',
        due_date: 'invalid-date',
      }

      const result = taskFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('validates task with null/undefined optional fields', () => {
      const validData = {
        title: 'Valid title',
        priority: 'medium',
      }

      const result = taskFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('taskUpdateSchema', () => {
    it('validates partial task updates', () => {
      const validUpdates: TaskUpdateData[] = [
        { title: 'Updated title' },
        { description: 'Updated description' },
        { completed: true },
        { priority: 'low' },
        { due_date: '2024-12-31' },
        { title: 'New title', completed: false },
      ]

      validUpdates.forEach(update => {
        const result = taskUpdateSchema.safeParse(update)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid updates', () => {
      const invalidUpdates = [
        { title: '' }, // Empty title
        { priority: 'invalid' }, // Invalid priority
        { due_date: 'invalid-date' }, // Invalid date
        { completed: 'not-boolean' }, // Invalid boolean
      ]

      invalidUpdates.forEach(update => {
        const result = taskUpdateSchema.safeParse(update)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('userProfileSchema', () => {
    it('validates correct user profile data', () => {
      const validData = {
        email: 'user@example.com',
        full_name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
      }

      const result = userProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('validates profile with minimal data', () => {
      const validData = {
        email: 'user@example.com',
      }

      const result = userProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects profile with invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        full_name: 'John Doe',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects profile with invalid URL', () => {
      const invalidData = {
        email: 'user@example.com',
        avatar_url: 'not-a-url',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})