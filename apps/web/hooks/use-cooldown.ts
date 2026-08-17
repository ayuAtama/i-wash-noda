import { useEffect, useRef, useState } from "react";

export function useCooldown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown(duration: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(duration);

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return { seconds, isActive: seconds > 0, startCooldown };
}
