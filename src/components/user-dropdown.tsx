'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { User, SignOut, Gear } from '@phosphor-icons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface UserDropdownProps {
    email?: string;
    avatarUrl?: string;
}
import { CheckIcon, MinusIcon } from "lucide-react";
import { useId } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DarkModeSelector from './dark-mode-selector';

const items = [
    { image: "/origin/ui-light.png", label: "Light", value: "1" },
    { image: "/origin/ui-dark.png", label: "Dark", value: "2" },
    { image: "/origin/ui-system.png", label: "System", value: "3" },
];

export function UserDropdown({ email, avatarUrl }: UserDropdownProps) {
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    // Get initials from email for avatar fallback
    const getInitials = (email?: string) => {
        if (!email) return 'U';
        return email.charAt(0).toUpperCase();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="Avatar"
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {getInitials(email)}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DarkModeSelector />
                <DropdownMenuSeparator />
                {/* <fieldset className="space-y-4">
                    <legend className="font-medium text-foreground text-sm leading-none">
                        Choose a theme
                    </legend>
                    <RadioGroup className="flex gap-3" defaultValue="1">
                        {items.map((item, id) => (
                            <label key={`${id}-${item.value}`}>
                                <RadioGroupItem
                                    className="peer sr-only after:absolute after:inset-0"
                                    id={`${id}-${item.value}`}
                                    value={item.value}
                                />
                                <img
                                    alt={item.label}
                                    className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none transition-[color,box-shadow] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent peer-data-disabled:opacity-50"
                                    height={70}
                                    src={item.image}
                                    width={88}
                                />
                                <span className="group mt-2 flex items-center gap-1 peer-data-[state=unchecked]:text-muted-foreground/70">
                                    <CheckIcon
                                        aria-hidden="true"
                                        className="group-peer-data-[state=unchecked]:hidden"
                                        size={16}
                                    />
                                    <MinusIcon
                                        aria-hidden="true"
                                        className="group-peer-data-[state=checked]:hidden"
                                        size={16}
                                    />
                                    <span className="font-medium text-xs">{item.label}</span>
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                </fieldset> */}
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <SignOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
