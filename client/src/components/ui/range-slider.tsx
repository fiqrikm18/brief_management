"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function RangeSlider({
  min = 0,
  max = 100000,
  step = 1000,
  value,
  onChange,
  className,
}: RangeSliderProps) {
  const [low, setLow] = React.useState(value[0]);
  const [high, setHigh] = React.useState(value[1]);

  const [minValue, maxValue] = React.useMemo(
    () => [Math.min(low, high), Math.max(low, high)],
    [low, high],
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const clamp = (val: number) => Math.min(Math.max(val, min), max);
  const formatToStep = (val: number) => Math.round(val / step) * step;

  React.useEffect(() => {
    setLow(value[0]);
    setHigh(value[1]);
  }, [value]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline gap-2 text-xs text-muted-foreground mb-2">
        <span>{formatCurrency(minValue)}</span>
        <span className="mx-2">to</span>
        <span>{formatCurrency(maxValue)}</span>
      </div>
      <Slider
        value={[minValue, maxValue]}
        onValueChange={rawValue => {
          const [nextLow, nextHigh] = rawValue as [number, number];
          const clampedLow = formatToStep(clamp(nextLow));
          const clampedHigh = formatToStep(clamp(nextHigh));
          const sortedLow = Math.min(clampedLow, clampedHigh);
          const sortedHigh = Math.max(clampedLow, clampedHigh);
          setLow(sortedLow);
          setHigh(sortedHigh);
          onChange([sortedLow, sortedHigh]);
        }}
        min={min}
        max={max}
        step={step}
        className="h-2 w-full"
      />
    </div>
  );
}
