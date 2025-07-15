"use client"

import { useEffect, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Wind } from "lucide-react"
import { getPM25GradientClassHex } from "@/lib/bgColor"
import type { AirQuality } from "@/lib/deviceManager"
import DeviceManager from "@/lib/deviceManager"

export default function LoginPage() {
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAQILoading, setIsAQILoading] = useState(true) 

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

  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.myJwt) {
      setIsLoading(true)
      fetch("/api/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.myJwt }),
      }).then(() => {
        router.replace("/")
      })
    }
  }, [session, router])

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google")
    } catch (error) {
      console.error("Sign in failed:", error)
      setIsLoading(false)
    }
  }
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-1000 ${getPM25GradientClassHex(airQuality?.aqi)}`}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"/>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Login Card */}
        <Card className="backdrop-blur-md bg-white/90 border-white/20 shadow-2xl p-4 mx-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <Wind className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">


            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-black"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
