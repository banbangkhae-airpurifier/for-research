"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Function to determine the progress bar color based on value
  const getIndicatorColor = (value: number | null) => {
    const safeValue = Math.max(0, Math.min(100, value || 0)); // Clamp value between 0 and 100
    if (safeValue <= 20) {
      return "bg-red-500"; // Low: Red
    } else if (safeValue <= 50) {
      return "bg-yellow-500"; // Medium: Yellow
    } else if (safeValue <=75) {
      return "bg-orange-500"; // Mid-High : Orange
    } else {
      return "bg-green-500";
    }
  };

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          getIndicatorColor(value || 0)
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };