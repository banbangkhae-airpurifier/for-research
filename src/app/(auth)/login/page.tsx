/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import DeviceManager, { AirQuality } from "@/lib/deviceManager"
import { getPM25GradientClassHex } from "@/lib/bgColor"

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const manager = useState(() => new DeviceManager())[0]

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        await manager.fetchAirQuality()
        const data = manager.getAirQuality()
        if (data) setAirQuality(data)
      } catch (err) {
        console.error("Error fetching air quality:", err)
      }
    }

    fetchData()
    return () => manager.destroy()
  }, [manager])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        router.push("/")
      } else {
        alert("Invalid credentials")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getPM25GradientClassHex(
      airQuality?.aqi ?? null
    )}`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative max-w-sm w-full flex flex-col items-center border border-white/20 rounded-2xl p-8 shadow-2xl bg-white/95 backdrop-blur-md">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${getPM25GradientClassHex(
            airQuality?.aqi ?? null)}`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Login</h1>
          <p className="text-sm text-gray-600">Air Purifier Controller</p>
        </div>

        <Form {...form}>
          <form className="w-full space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="username"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      className="w-full"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{formState.errors.username?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="w-full"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{formState.errors.password?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform bg-blue-700 text-white shadow-md hover:bg-blue-900"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
