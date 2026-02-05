'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import Logo from '@/components/logo'
import { Check } from '@phosphor-icons/react'

/**
 * Forgot Password Form Component
 * 
 * A beautifully designed password reset form matching the landing page's
 * visual language with floating decorative elements and gradient accents.
 */
export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      {/* Logo & Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Logo full height={28} />
          </Link>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          {success ? 'Check your inbox' : 'Reset password'}
        </h1>
        <p className="text-gray-500">
          {success ? 'We sent you a link to reset your password' : 'Enter your email to get a reset link'}
        </p>
      </div>

      {/* Form Card */}
      <div className="relative">
        {/* Subtle gradient glow behind card */}
        <div className="absolute -inset-1 bg-linear-to-r from-[#2F92C7]/20 via-transparent to-[#1F92F9]/20 rounded-3xl blur-xl opacity-60" />

        <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {success ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" weight="bold" />
              </div>
              <p className="text-center text-gray-600 text-sm leading-relaxed">
                We've sent an email to <span className="font-semibold text-gray-900">{email}</span>.
                Please follow the instructions in the email to reset your password.
              </p>
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#2F92C7] focus:ring-[#2F92C7]/20 transition-all"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#000100] text-white hover:bg-gray-800 rounded-xl font-medium text-base shadow-lg shadow-gray-300/30 transition-all hover:shadow-xl hover:shadow-gray-300/40"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send reset link
                    <span className="w-6 h-6 bg-[#1F92F9] rounded-md flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-[#2F92C7] hover:text-[#1F92F9] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
