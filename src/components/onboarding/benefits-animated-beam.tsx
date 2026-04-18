"use client"

import React, { forwardRef, useRef } from "react"
import {
  BriefcaseIcon,
  CalendarDotsIcon,
  FilesIcon,
  SparkleIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import Logo from "../logo"
import { AnimatedBeam } from "../ui/animated-beam"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-border/40 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = "Circle"

const FeaturePill = forwardRef<
  HTMLDivElement,
  {
    className?: string
    icon: React.ComponentType<{ className?: string }>
    label: string
  }
>(({ className, icon: Icon, label }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-10 w-44 items-center justify-start gap-2 rounded-full border-2 border-border/40 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-slate-500" />
      <span className="truncate">{label}</span>
    </div>
  )
})

FeaturePill.displayName = "FeaturePill"

export function BenfitsAnimatedBeam({
  className,
}: {
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)
  const div6Ref = useRef<HTMLDivElement>(null)
  const div7Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        "relative flex h-92.5 w-full items-center justify-center overflow-hidden",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center">
          <Circle ref={div7Ref}>
            <XLogoIcon size={30} />
          </Circle>
        </div>

        <div className="flex flex-col justify-center">
          <Circle ref={div6Ref} className="size-16">
            <Logo height={32} width={32} />
          </Circle>
        </div>

        <div className="flex flex-col justify-center gap-2">
          <FeaturePill
            icon={SparkleIcon}
            label="Strategy Engine"
            ref={div1Ref}
          />
          <FeaturePill
            icon={FilesIcon}
            label="Template Library"
            ref={div2Ref}
          />
          <FeaturePill
            icon={CalendarDotsIcon}
            label="Calendar Queue"
            ref={div3Ref}
          />
          <FeaturePill
            icon={BriefcaseIcon}
            label="Brand Voice Kit"
            ref={div4Ref}
          />
          <FeaturePill
            icon={XLogoIcon}
            label="X Post Sync"
            ref={div5Ref}
          />
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div6Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        duration={3}
      />
    </div>
  )
}
