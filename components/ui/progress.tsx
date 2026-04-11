"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indicatorRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!indicatorRef.current) return;
    const clamped = Math.min(100, Math.max(0, value || 0));
    indicatorRef.current.style.transform = `translateX(-${100 - clamped}%)`;
  }, [value]);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        ref={indicatorRef}
        className="bg-primary h-full w-full flex-1 transition-transform duration-200 motion-reduce:transition-none"
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
