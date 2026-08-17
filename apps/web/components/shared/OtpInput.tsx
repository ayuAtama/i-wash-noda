import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      maxLength={length}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn("gap-2")}
    >
      <InputOTPGroup>
        {Array.from({ length }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
