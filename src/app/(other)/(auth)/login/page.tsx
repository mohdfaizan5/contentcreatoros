"use client"
import { LoginForm } from '@/shared/components/login-form'
import Synthesis from '@/shared/components/synthesis'

/**
 * Login Page
 * 
 * Full-page login experience with floating decorative elements
 * matching the landing page's visual design language.
 */
export default function Page() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden md:h-screen md:max-h-screen">
      <div className="relative h-full md:grid md:grid-cols-3">
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:col-span-2 md:min-h-0 md:p-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

        <div className="relative hidden h-full overflow-hidden md:block">
          <Synthesis
            speed={0.4}
            color1="#0f172a"
            color2="#3b0764"
            color3="#0ea5e9"
            scale={1}
            complexity={6}
            distortion={0.6}
            glowIntensity={0.4}
            flowFrequency={3}
            contrast={1.2}
          />
        </div>

        <div className="absolute inset-0 md:hidden">
          <Synthesis
            speed={0.4}
            color1="#0f172a"
            color2="#3b0764"
            color3="#0ea5e9"
            scale={1}
            complexity={6}
            distortion={0.6}
            glowIntensity={0.4}
            flowFrequency={3}
            contrast={1.2}
          />
        </div>
      </div>
    </div>
  )
}
