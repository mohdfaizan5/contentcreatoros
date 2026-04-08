'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SpeechControlProps = {
  value: string;
  onValueChange: (value: string) => void;
  languageCode?: string;
};

type OnboardingSpeechInputProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
  type?: string;
};

type OnboardingSpeechTextareaProps = SpeechControlProps & {
  className?: string;
  placeholder?: string;
  rows?: number;
};

export function OnboardingSpeechInput({
  className,
  onValueChange,
  placeholder,
  type = 'text',
  value,
}: OnboardingSpeechInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type={type}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={className}
      />

      {/* Speech controls are temporarily disabled in the onboarding UI. */}
    </div>
  );
}

export function OnboardingSpeechTextarea({
  className,
  onValueChange,
  placeholder,
  rows = 4,
  value,
}: OnboardingSpeechTextareaProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {/* Speech controls are temporarily disabled in the onboarding UI. */}
    </div>
  );
}
