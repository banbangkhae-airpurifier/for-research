export const getPM25GradientClassHex = (aqi: number | null | undefined): string => {
  if (aqi === null || aqi === undefined) return "bg-gradient-to-br from-gray-200 to-gray-400"
  if (aqi < 51) return "bg-gradient-to-br from-[#4ADE80] to-[#22C55E]"
  if (aqi < 101) return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]"
  if (aqi < 151) return "bg-gradient-to-br from-[#FB923C] to-[#EA580C]"
  if (aqi < 201) return "bg-gradient-to-br from-[#F87171] to-[#EC4899]"
  return "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]"
}

export const getAQIBadgeColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-100 text-green-800";
    if (aqi <= 100) return "bg-yellow-100 text-yellow-800";
    if (aqi <= 150) return "bg-orange-100 text-orange-800";
    if (aqi <= 200) return "bg-red-100 text-red-800";
    return "bg-purple-100 text-purple-700";
};

export const getAQIStatus = (aqi: number | null): string => {
  if (aqi === null) return "-"
  if (aqi < 51) return "Good"
  if (aqi < 101) return "Moderate"
  if (aqi < 151) return "Unhealthy for Sensitive Groups"
  if (aqi < 201) return "Unhealthy"
  return "Very Unhealthy"
}