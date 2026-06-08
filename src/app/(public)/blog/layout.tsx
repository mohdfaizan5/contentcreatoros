import { LandingHeader } from "@/features/(public)/landing";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      // required styles
      className="flex flex-col min-h-screen"
    >
      <LandingHeader />

      <RootProvider>{children}</RootProvider>
    </div>
  );
}
