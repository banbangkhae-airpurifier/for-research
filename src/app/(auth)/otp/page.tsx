"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, Wind, ArrowLeft } from "lucide-react"
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

  // Countdown timer for resend OTP
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

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:6969/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp: otp }),
      })

      const data = await response.json()

      if (data.success) {
        // OTP verified successfully - redirect to main page
        router.replace("/")
      } else {
        // Show error message from API
        setError(data.message || "OTP ไม่ถูกต้อง กรุณาลองใหม่")
      }
    } catch (error) {
      console.error("OTP verification failed:", error)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return

    setCanResend(false)
    setCountdown(60) // 60 seconds countdown
    setError("")
    setOtp("")

    try {
      // เรียก API สำหรับส่ง OTP ใหม่ - ปรับ URL ตาม API ของคุณ
      const response = await fetch("http://localhost:6969/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "ไม่สามารถส่ง OTP ใหม่ได้")
        setCanResend(true)
        setCountdown(0)
      }
    } catch (error) {
      console.error("Resend OTP failed:", error)
      setError("ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองใหม่")
      setCanResend(true)
      setCountdown(0)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-1000 ${getPM25GradientClassHex(airQuality?.aqi)}`}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main OTP Card */}
        <Card className="backdrop-blur-md bg-white/90 border-white/20 shadow-2xl p-4 mx-10">
          <CardHeader className="text-center space-y-4">
            {/* Back button */}
            <div className="flex justify-start">
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-2 hover:bg-black/10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <Wind className="w-8 h-8 text-white" />
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">ยืนยัน OTP</CardTitle>
              <p className="text-sm text-gray-600 mt-2">กรุณากรอกรหัส OTP ที่ส่งไปยัง</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
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
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {/* Error message */}
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 bg-black hover:bg-black/90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยัน OTP"}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">ไม่ได้รับรหัส OTP?</p>
              <Button
                variant="ghost"
                onClick={handleResendOTP}
                disabled={!canResend}
                className="text-sm font-medium hover:bg-black/10 disabled:opacity-50"
              >
                {canResend ? "ส่งรหัสใหม่" : `ส่งรหัสใหม่ใน ${countdown} วินาที`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
