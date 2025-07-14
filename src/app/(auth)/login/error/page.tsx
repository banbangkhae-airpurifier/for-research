"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { getPM25GradientClassHex } from "@/lib/bgColor"
import type { AirQuality } from "@/lib/deviceManager"
import DeviceManager from "@/lib/deviceManager"

export default function ErrorPage() {
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const [isAQILoading, setIsAQILoading] = useState(true)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    const manager = new DeviceManager()
    const fetchAQI = async () => {
      try {
        await manager.fetchAirQuality()
        setAirQuality(manager.getAirQuality())
      } catch (error) {
        console.error("Failed to fetch air quality:", error)
      } finally {
        setIsAQILoading(false)
      }
    }

    fetchAQI()
    return () => manager.destroy()
  }, [])

  const getPM25GaugeColor = (aqi: number) => {
    if (aqi < 51) return "#4ADE80"
    if (aqi < 101) return "#FBBF24"
    if (aqi < 151) return "#FB923C"
    if (aqi < 201) return "#F87171"
    return "#8B5CF6"
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-1000 ${getPM25GradientClassHex(airQuality?.aqi)}`}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Error Card */}
        <Card className="backdrop-blur-md bg-white/90 border-white/20 shadow-2xl p-4 mx-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Error</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Error: {error}</p>
              </div>
            )}

            {/* Back to Login Button */}
            <Link href="/login">
              <Button className="w-full h-12 bg-black">
                <span>Back to Login</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
