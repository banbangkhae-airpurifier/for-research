"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, Wind } from "lucide-react"
import { getPM25GradientClassHex } from "@/lib/bgColor"
import type { AirQuality } from "@/lib/deviceManager"
import DeviceManager from "@/lib/deviceManager"

export default function OTPPage() {
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAQILoading, setIsAQILoading] = useState(true)
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { data: session } = useSession()

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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("กรุณากรอก OTP ให้ครบ 6 หลัก")
      return
    }

    if (!session?.email) {
      setError("ไม่พบอีเมลผู้ใช้")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/verified-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otp,
          email: session.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.replace("/")
      } else {
        setError(data.message || "OTP ไม่ถูกต้อง กรุณาลองใหม่")
      }
    } catch (error) {
      console.error("OTP verification failed:", error)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-1000 ${getPM25GradientClassHex(airQuality?.aqi)}`}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/90 border-white/20 shadow-2xl p-4 mx-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <Wind className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">ยืนยัน OTP</CardTitle>
              <p className="text-sm text-gray-600 mt-2">กรุณากรอกรหัส OTP ที่ส่งไปยัง</p>
              <p className="text-sm font-semibold">{session?.email || "-"}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  setError("")
                }}
              >
                <InputOTPGroup>
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 bg-black hover:bg-black/90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยัน OTP"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
