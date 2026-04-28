"use client"
import {
  Tooltip,
  TooltipContent,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { InfoIcon } from "@phosphor-icons/react/dist/ssr";


export function LabelTooltip({ label, description }: { label: string; description: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span className="">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700"
            aria-label={description}
          >
            <InfoIcon className="size-3.5" weight="bold" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{description}</TooltipContent>
      </Tooltip>
    </span>
  );
}