'use client'

import { cn } from '@/shared/lib/utils'
import { createClient } from '@/shared/lib/supabase/client'
import { getOAuthRedirectTo } from '@/shared/lib/supabase/auth-redirect'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Logo from '@/shared/components/logo'
import { ArrowRightIcon, XLogoIcon } from '@phosphor-icons/react/dist/ssr'
import { X_OAUTH_SCOPE_STRING } from '@/features/x/lib/x-oauth'

/**
 * Login Form Component
 * 
 * A beautifully designed login form matching the landing page's
 * visual language with floating decorative elements and gradient accents.
 */
export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isXAuthLoading, setIsXAuthLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/app')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleXSignIn = async () => {
    const supabase = createClient()
    setError(null)
    setIsXAuthLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'x',
        options: {
          redirectTo: getOAuthRedirectTo('/app'),
          scopes: X_OAUTH_SCOPE_STRING,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unable to sign in with X')
      setIsXAuthLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      {/* Logo & Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Logo full height={26} width={26} className='gap-1' />
          </Link>
        </div>
        <h1 className="text-3xl font-semibold  mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Sign in to continue to your dashboard
        </p>
      </div>

      {/* Form Card */}
      <div className="relative">
        {/* Subtle gradient glow behind card */}
        <div className="absolute -inset-1 rounded-3xl blur-xl opacity-60" />

        <div className="relative  rounded-2xl  p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className=" font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=" border-border/40 bg-background focus:border-[#2F92C7] focus:ring-[#2F92C7]/20 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className=" font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#2F92C7] hover:text-[#1F92F9] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border/40 bg-background focus:border-[#2F92C7] focus:ring-[#2F92C7]/20 transition-all"
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
              disabled={isLoading || isXAuthLoading}
              className={`w-full transition-all `}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  Sign in
                  <span className="w-6 h-6  rounded-md flex items-center justify-center">
<ArrowRightIcon/>
                  </span>
                </span>
              )}
            </Button>
            <p className='my-4 text-center'>(or)</p>

            <Button
              type="button"
              variant="outline"
              onClick={handleXSignIn}
              disabled={isLoading || isXAuthLoading}
              className="w-full "
            >
              {isXAuthLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Redirecting to X...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {/* <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black text-[11px] font-semibold text-white">
                    X
                  </span> */}
                  Continue with 
                  <XLogoIcon />
                </span>
              )}
            </Button>

            <p className="text-xs  text-muted-foreground text-center">
              X will show its official consent screen with the permissions this app requests.
            </p>
          </form>

          

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="font-medium text-[#2F92C7] hover:text-[#1F92F9] transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Trust indicator */}
      {/* <p className="text-center text-sm text-gray-400">
        Secure login powered by Supabase
      </p> */}
    </div>
  )
}

