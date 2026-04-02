import { LoginForm } from '@/components/login-form'

/**
 * Login Page
 * 
 * Full-page login experience with floating decorative elements
 * matching the landing page's visual design language.
 */
export default function Page() {
  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden">
      {/* Decorative floating elements - matching landing page style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left decoratives */}
        <div className="absolute top-20 left-8 w-8 h-8 border-2 border-gray-200 rounded-lg rotate-12 animate-float-slow" />
        <div className="absolute top-32 left-24 w-6 h-6 bg-gray-100 rounded-full animate-float animation-delay-200" />
        <div className="absolute top-48 left-12">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" className="animate-pulse-glow">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        {/* Top right decoratives */}
        <div className="absolute top-24 right-16 w-10 h-10 border-2 border-[#2F92C7]/30 rounded-lg -rotate-12 animate-float-reverse" />
        <div className="absolute top-40 right-8">
          <div className="w-12 h-12 bg-linear-to-br from-[#2F92C7]/20 to-[#1F92F9]/20 rounded-xl animate-float animation-delay-400" />
        </div>
        <div className="absolute top-64 right-24 w-6 h-6 bg-[#2F92C7]/10 rounded-full animate-float-slow" />

        {/* Bottom decoratives */}
        <div className="absolute bottom-32 left-20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" className="animate-float animation-delay-600">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="absolute bottom-24 right-32 w-8 h-8 border-2 border-gray-200 rounded-full animate-float animation-delay-800" />

        {/* Gradient sphere effects */}
        <div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-linear-to-br from-[#2F92C7]/10 to-transparent blur-2xl animate-float-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 rounded-full bg-linear-to-br from-green-400/10 to-transparent blur-2xl animate-float animation-delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
