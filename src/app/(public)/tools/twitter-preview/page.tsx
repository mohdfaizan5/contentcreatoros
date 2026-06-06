import type { Metadata } from "next";

import { TwitterPreviewWorkbench } from "@/features/tools/components/twitter-preview-workbench";

export const metadata: Metadata = {
  title: "Twitter Preview | ContentOSX",
  description:
    "Preview tweet copy with media attachments in both X light and dark themes before posting.",
};

export default function TwitterPreviewPage() {
  return <TwitterPreviewWorkbench />;
}
