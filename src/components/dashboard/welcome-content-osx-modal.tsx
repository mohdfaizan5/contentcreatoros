'use client';

import { Check, CircleUserRound } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';

const BENEFITS = [
  'Unlimited content calendars',
  'Unlimited content types',
  'Workflow automation',
  'Integrate with your favorite apps',
  'Publishing pipeline for X',
  'Embeds and distribution tools',
  'AI writing copilot',
  'Content review and analytics',
];

type WelcomeContentOsxModalProps = {
  initialOpen: boolean;
};

export default function WelcomeContentOsxModal({
  initialOpen,
}: WelcomeContentOsxModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  const nextUrlWithoutWelcomeParam = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('welcomeToContentOSX');

    const queryString = nextParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const dismiss = () => {
    setOpen(false);
    router.replace(nextUrlWithoutWelcomeParam, { scroll: false });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          dismiss();
          return;
        }

        setOpen(nextOpen);
      }}
      open={open}
    >
      <DialogPopup
        bottomStickOnMobile={false}
        className="max-w-xl overflow-hidden border border-border/80 bg-[#07090d] p-0 text-slate-100"
        showCloseButton={false}
      >
        <DialogHeader className="items-center gap-3 pb-2 pt-8 text-center">
          {/* <p className="font-semibold text-3xl tracking-tight">ContentOS X</p> */}

          <div className="relative mt-2 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-border/40" />
            <div className="absolute inset-2 rounded-full border border-border/40" />
            <div className="absolute inset-6 rounded-full border border-border/40" />
            <div className="absolute inset-10 rounded-full border border-border/40" />
            <div className="relative z-10 rounded-full border border-border/60 bg-slate-900 p-2">
              <CircleUserRound className="h-5 w-5 text-slate-200" />
            </div>
          </div>

          <DialogTitle className="text-3xl font-medium text-white">
            Welcome to ContentOS X
          </DialogTitle>
          <DialogDescription className="max-w-xl  -mt-1 text-muted-foreground">
            You are all set. Start scheduling content and managing your workspace.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="px-10 pb-8 pt-8">
          <ul className="space-y-2 pt-4">
            {BENEFITS.map((benefit) => (
              <li className="flex items-start gap-3  text-slate-100" key={benefit}>
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center">
                  <Check className="h-4 w-4 text-slate-300" />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </DialogPanel>

        <DialogFooter className="justify-end border-t border-border/80/90 bg-slate-950/70 px-8 py-6">
          <Button
            className="rounded-2xl bg-white px-6 text-black hover:bg-slate-100"
            onClick={dismiss}
            type="button"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

