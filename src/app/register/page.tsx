'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ReactHookFormField } from '@/components/form/ReactHookFormField'
import { ReactHookFormInput } from '@/components/form/ReactHookFormInput'
import { ReactHookFormWrapper } from '@/components/form/ReactHookFormWrapper'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/toast/ToastProvider'

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  roles: z.string().min(1, 'Role is required'), // Remove default, make it required
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { success, error } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const methods = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      roles: 'clinician', // Set default in form, not schema
    },
    mode: 'onBlur',
  })

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          roles: data.roles,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        error(errorData.detail || 'Registration failed')
        return
      }

      success('User created successfully! You can now log in.')
      router.push('/login')
    } catch (err) {
      error('Network error during registration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register for PA Copilot access
          </p>
        </div>
        
        <ReactHookFormWrapper
          methods={methods}
          onSubmit={onSubmit}
          className="mt-8 space-y-6"
        >
          <div className="space-y-4">
            <ReactHookFormField name="email" label="Email Address">
              <ReactHookFormInput 
                name="email" 
                type="email"
                placeholder="Enter your email" 
              />
            </ReactHookFormField>

            <ReactHookFormField name="password" label="Password">
              <ReactHookFormInput 
                name="password" 
                type="password"
                placeholder="Enter your password" 
              />
            </ReactHookFormField>

            <ReactHookFormField name="confirmPassword" label="Confirm Password">
              <ReactHookFormInput 
                name="confirmPassword" 
                type="password"
                placeholder="Confirm your password" 
              />
            </ReactHookFormField>

            <div>
              <label htmlFor="roles" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                {...methods.register('roles')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="clinician">Clinician</option>
                <option value="admin">Admin</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </p>
          </div>
        </ReactHookFormWrapper>
      </div>
    </main>
  )
}
