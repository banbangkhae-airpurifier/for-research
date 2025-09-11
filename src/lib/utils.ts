import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAQI(pm25: number): number {
  if (pm25 < 0) {
    throw new Error("PM2.5 concentration cannot be negative");
  }

  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, aqiLow: 301, aqiHigh: 500 },
  ];

  const pm25Capped = Math.min(pm25, 500.4);

  for (const bp of breakpoints) {
    if (pm25Capped >= bp.cLow && pm25Capped <= bp.cHigh) {
      const aqi =
        ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) *
        (pm25Capped - bp.cLow) +
        bp.aqiLow;
      return Math.round(aqi);
    }
  }

  return 500;
}
