import React from "react";
import NumbersThatSpeak from "./numbers-that-speak";
import EffortlessIntegration from "./effortless-integration-updated";
import YourWorkInSync from "./your-work-in-sync";
import SmartSimpleBrilliant from "./smart-simple-brilliant";
import { Badge } from "../ui/badge";

const BentoGrid = () => {
  return (
    <section className="relative border-y border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(31,146,249,0.08),transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] py-20 md:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6">
        <div className="mb-10 max-w-3xl">
          <Badge className="border border-[#1F92F9]/20 bg-[#1F92F9]/10 text-[#0f4c8a]">Inside ContentOSX</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            A focused workflow from idea to published thread.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
            Every module is tuned for one outcome: help you publish consistently with less friction and better signal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] md:p-8">
            <h3 className="text-2xl font-semibold text-slate-950">Capture without context switching</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
              Dump raw ideas instantly, then let the system organize hooks, angles, and follow-ups in one timeline.
            </p>
            <div className="mt-6 h-64 overflow-hidden rounded-2xl bg-slate-50 md:h-72">
              <SmartSimpleBrilliant
                width="100%"
                height="100%"
                theme="light"
                className="scale-75 md:scale-90"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-[0_28px_55px_-35px_rgba(2,6,23,0.9)] md:p-8">
            <h3 className="text-2xl font-semibold text-white">Collaborate in real time</h3>
            <p className="mt-2 text-sm leading-6 text-white/70 md:text-base">
              Keep copy, edits, and approvals in sync so your publishing rhythm does not break when more people join.
            </p>
            <div className="mt-6 h-64 overflow-hidden rounded-2xl bg-slate-900/70 md:h-72">
              <YourWorkInSync
                width="400"
                height="250"
                theme="dark"
                className="scale-75 md:scale-90"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#1F92F9]/25 bg-[#eef7ff] p-6 shadow-[0_18px_45px_-30px_rgba(31,146,249,0.5)] md:p-8">
            <h3 className="text-2xl font-semibold text-slate-950">Plug into your stack</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 md:text-base">
              Connect your core tools once and run an end-to-end publishing pipeline from a single operating layer.
            </p>
            <div className="relative mt-6 h-64 overflow-hidden rounded-2xl bg-white/80 md:h-72">
              <div className="absolute inset-0 flex items-center justify-center">
                <EffortlessIntegration width={400} height={250} className="max-h-full max-w-full" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-black p-6 shadow-[0_28px_55px_-35px_rgba(2,6,23,0.95)] md:p-8">
            <h3 className="text-2xl font-semibold text-white">Measure what compounds</h3>
            <p className="mt-2 text-sm leading-6 text-white/70 md:text-base">
              Track output, engagement, and velocity in one view so you can double down on formats that actually grow reach.
            </p>
            <div className="relative mt-6 h-64 overflow-hidden rounded-2xl bg-white md:h-72">
              <div className="absolute inset-0 flex items-center justify-center">
                <NumbersThatSpeak
                  width="100%"
                  height="100%"
                  theme="light"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;
