export const getPM25GradientClassHex = (aqi: number | null | undefined): string => {
  if (aqi === null || aqi === undefined) return "bg-gradient-to-br from-gray-200 to-gray-400"
  if (aqi <= 9) return "bg-gradient-to-br from-[#4ADE80] to-[#22C55E]"
  if (aqi <= 55.4) return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]"
  return "bg-gradient-to-br from-[#F87171] to-[#EC4899]"
}


export const getAQIBadgeColor = (aqi: number) => {
  if (aqi < 50) return "bg-green-100 text-green-800";
  if (aqi < 150) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

export const getAQIStatus = (aqi: number | null): string => {
  if (aqi === null) return "-"
  if (aqi < 50) return "Good"
  if (aqi < 150) return "Moderate"
  return "Unhealthy"
}

export const getPM25Color = (value: number | null) => {
  if (value === null || value === undefined) return '#d1d5db'; // Gray for missing data
  if (value <= 9) return '#22c55e'; // Green (Good)
  if (value <= 35.4) return '#facc15'; // Yellow (Moderate)
  if (value <= 55.4) return '#f97316'; // Orange (Unhealthy for Sensitive)
  return '#ef4444'; // Red (Unhealthy)
}

export const getTempColor = (value: number | null) => {
  if (value === null || value === undefined) return '#d1d5db'; // Gray for missing data
  if (value <= 28) return '#26E2FF'; // Sky Blue (Good)
  if (value <= 34) return '#264AFF'; // Blue (Moderate)
  return '#A826FF'; // Purple (Unhealthy)
}

export const getFilterLifeColor = (filterLife: number) => {
  if (filterLife <= 20) {
    return "bg-red-500"; // Low filter life: Red
  } else if (filterLife <= 50) {
    return "bg-yellow-500"; // Medium filter life: Yellow
  } else {
    return "bg-green-500"; // High filter life: Green
  }
};