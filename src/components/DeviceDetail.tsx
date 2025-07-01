"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Power } from "lucide-react"

interface Device {
  id: string
  name: string
  room: string
  status?: "on" | "off"
  mode: "auto" | "manual"
  fanSpeed: string
  filterLife: number
  aqi: number
}

interface DeviceDetailProps {
  device: Device | null
  isOpen: boolean
  onClose: () => void
  devicePower: { [id: string]: boolean }
  onTogglePower: (deviceId: string) => void
}

export default function DeviceDetail({ device, isOpen, onClose, devicePower, onTogglePower }: DeviceDetailProps) {
  if (!device) return null

  const isOn = devicePower[device.id] ?? device.status === "on"

  const getPM25GaugeColor = (aqi: number) => {
    if (aqi < 51) return "#4ADE80"
    if (aqi < 101) return "#FBBF24"
    if (aqi < 151) return "#FB923C"
    if (aqi < 201) return "#F87171"
    return "#8B5CF6"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-500">
              ← Devices
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Device Header */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{device.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600">{device.room}</p>
                </div>
                <button
                  onClick={() => onTogglePower(device.id)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 rounded-full flex items-center justify-center transition-colors ${
                    isOn ? "border-green-500 bg-green-100" : "border-red-500 bg-white"
                  }`}
                >
                  <Power
                    className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-colors ${
                      isOn ? "text-green-500" : "text-red-500"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Air Quality */}
          <Card>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40">
                  {/* Gauge background */}
                  <svg width="100%" height="100%" viewBox="0 0 128 128" className="absolute top-0 left-0">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  </svg>

                  {/* Gauge value */}
                  <svg width="100%" height="100%" viewBox="0 0 128 128" className="absolute top-0 left-0">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={getPM25GaugeColor(device.aqi)}
                      strokeWidth="16"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={(1 - Math.max(0, Math.min(1, device.aqi / 300))) * 2 * Math.PI * 56}
                      style={{ transition: "stroke-dashoffset 0.5s" }}
                      strokeLinecap="round"
                      transform="rotate(-90 64 64)"
                    />
                  </svg>

                  {/* AQI Value */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700">{device.aqi}</span>
                    <span className="text-xs sm:text-sm text-gray-500">AQI</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-600">AQI: {device.aqi}</span>
              </div>
            </CardContent>
          </Card>

          {/* Filter Lifetime */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">FILTER LIFETIME</h3>
                <span className="text-sm sm:text-base text-gray-500 font-semibold">{device.filterLife}%</span>
              </div>
              <Progress value={device.filterLife} className="h-2 sm:h-3" />
            </CardContent>
          </Card>

          {/* Device Status */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-sm sm:text-base text-gray-600">MODE: </span>
                  <span className="text-sm sm:text-base font-semibold uppercase">{device.mode}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-sm sm:text-base text-gray-600">FAN SPEED: </span>
                  <span className="text-sm sm:text-base font-semibold uppercase">{device.fanSpeed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
