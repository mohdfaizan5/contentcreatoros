"use client"


import { CheckIcon } from "lucide-react";
import { useId } from "react";
import { useTheme } from "next-themes"
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const items = [
  { image: "/ui-light.png", label: "Light", value: "light" },
  { image: "/ui-dark.png", label: "Dark", value: "dark" },
  { image: "/ui-system.png", label: "System", value: "system" },
];

export default function DarkModeSelector() {
  const id = useId();
  const { theme, setTheme } = useTheme()
  return (
    <fieldset className="space-y-1 max-w-44 pl-2 -mt-5">
      {/* <legend className="font-medium text-foreground text-sm leading-none">
        Choose a theme
      </legend> */}
      <RadioGroup
        aria-label="Choose theme"
        className="flex gap-2 flex-row justify-between"
        value={theme ?? "system"}
        onValueChange={(value) => setTheme(value)}
      >
        {items.map((item) => (
          <label key={`${id}-${item.value}`}>
            <RadioGroupItem
              className="peer sr-only after:absolute after:inset-0"
              id={`${id}-${item.value}`}
              value={item.value}
            />
            <Image
              alt={item.label}
              className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none transition-[color,box-shadow] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent peer-data-disabled:opacity-50"
              height={30}
              src={item.image}
              width={48}
            />
            <span className="group mt-2 flex items-center gap-1 peer-data-[state=unchecked]:text-muted-foreground/70">
              <CheckIcon
                aria-hidden="true"
                className="group-peer-data-[state=unchecked]:hidden"
                size={12}
              />
              {/* <MinusIcon
                aria-hidden="true"
                className="group-peer-data-[state=checked]:hidden"
                size={16}
              /> */}
              <span className="font-medium text-[10px]">{item.label}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
