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


// Function to convert AQI to PM2.5 concentration (µg/m³)
export function aqiToPm25(aqi: number): number {
  // Clamp AQI to valid range (0–500)
  const safeAqi = Math.max(0, Math.min(500, aqi));

  // EPA AQI breakpoints for PM2.5 (µg/m³) and corresponding AQI values
  const breakpoints = [
    { aqiLow: 0, aqiHigh: 50, pm25Low: 0.0, pm25High: 12.0 }, // Good
    { aqiLow: 51, aqiHigh: 100, pm25Low: 12.1, pm25High: 35.4 }, // Moderate
    { aqiLow: 101, aqiHigh: 150, pm25Low: 35.5, pm25High: 55.4 }, // Unhealthy for Sensitive Groups
    { aqiLow: 151, aqiHigh: 200, pm25Low: 55.5, pm25High: 150.4 }, // Unhealthy
    { aqiLow: 201, aqiHigh: 300, pm25Low: 150.5, pm25High: 250.4 }, // Very Unhealthy
    { aqiLow: 301, aqiHigh: 400, pm25Low: 250.5, pm25High: 350.4 }, // Hazardous
    { aqiLow: 401, aqiHigh: 500, pm25Low: 350.5, pm25High: 500.4 }, // Hazardous
  ];

  // Find the correct AQI range
  for (const bp of breakpoints) {
    if (safeAqi >= bp.aqiLow && safeAqi <= bp.aqiHigh) {
      // Linear interpolation formula:
      // PM2.5 = PM2.5_low + [(AQI - AQI_low) * (PM2.5_high - PM2.5_low)] / (AQI_high - AQI_low)
      const pm25 =
        bp.pm25Low +
        ((safeAqi - bp.aqiLow) * (bp.pm25High - bp.pm25Low)) /
          (bp.aqiHigh - bp.aqiLow);
      // Round to 1 decimal place for readability
      return Math.round(pm25 * 10) / 10;
    }
  }

  // Return null for invalid AQI values (shouldn't happen due to clamping)
  return 0;
}