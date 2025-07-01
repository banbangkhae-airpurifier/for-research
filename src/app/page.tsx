/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wind } from "lucide-react"
import deviceData from "@/data/devices.json"
import aqiData from "@/data/aqi.json"
import DeviceDetail from "@/components/DeviceDetail"

interface Device {
  id: string
  name: string
  room: string
  status: "on" | "off"
  mode: "auto" | "manual"
  fanSpeed: string
  filterLife: number
  aqi: number
}

export default function Dashboard() {
  const aqi = aqiData
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devicePower, setDevicePower] = useState<{ [id: string]: boolean }>({});
  const isOn = selectedDevice ? devicePower[selectedDevice.id] ?? selectedDevice.status === "on" : false;
  const devices: Device[] = deviceData.map((device: any) => ({
    ...device,
    status: device.status as "on" | "off",
    mode: device.mode as "auto" | "manual",
  }))


  const currentTime = new Date().toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const getPM25GradientClassHex = (aqi: number): string => {
    if (aqi < 51) {
      // สีเขียว
      return "bg-gradient-to-br from-[#4ADE80] to-[#22C55E]";
    } else if (aqi < 101) {
      // สีเหลือง
      return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]";
    } else if (aqi < 151) {
      // สีส้ม
      return "bg-gradient-to-br from-[#FB923C] to-[#EA580C]";
    } else if (aqi < 201) {
      // สีแดง/ชมพู
      return "bg-gradient-to-br from-[#F87171] to-[#EC4899]";
    } else {
      // สีม่วง
      return "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]";
    }
  };

  const getAQIBadgeColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-100 text-green-800"
    if (aqi <= 100) return "bg-yellow-100 text-yellow-800"
    if (aqi <= 150) return "bg-orange-100 text-orange-800"
    if (aqi <= 200) return "bg-red-100 text-red-800"
    return "bg-purple-100 text-purple-700"
  }

  const handleTogglePower = () => {
    if (selectedDevice) {
      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: !isOn,
      }));
    }
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null)
  }

  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(aqi.aqi)}`}>
      {/* Main Content */}
      <div className="px-4 pb-20">
        {/* Header */}
        <div className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">COSCI Space</h1>
          <p className="text-xl opacity-90 mb-4">Bangkok, Petchburi</p>
          <p className="text-lg opacity-80">{currentTime}</p>
        </div>

        {/* AQI Display */}
        <div className="text-center text-white mb-8">
          <p className="text-lg mb-4">PM2.5</p>
          <div className="text-8xl font-bold mb-2">{aqi.pm_25}</div>
          <p className="text-lg mb-4">μg/m³</p>
          <Badge className={`${getAQIBadgeColor(aqi.aqi)} text-lg px-4 py-2`}>AQI {aqi.aqi}</Badge>
        </div>

        {/* Devices Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">Devices</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedDevice(device)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Wind className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-gray-600">{device.room}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <DeviceDetail
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={handleCloseDeviceDetail}
        devicePower={devicePower}
        onTogglePower={handleTogglePower}
      />
    </div>
  )
}
