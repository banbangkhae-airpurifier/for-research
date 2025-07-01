"use client"

import { useState, useEffect } from "react"
import { Fan, Power, Settings, Droplets, Wind, ChevronDown } from "lucide-react"
import deviceData from "@/data/devices.json"
import DeviceDetail from "@/components/DeviceDetail"
import aqiData from "@/data/aqi.json"

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

interface AQIData {
  pm_25: number
  aqi: number
}

type FanLevel = "off" | "low" | "mid" | "high" | "turbo"

export default function Dashboard() {
  const aqi: AQIData = aqiData
  const [devices, setDevices] = useState<Device[]>(deviceData as unknown as Device[])

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<Device["mode"]>("manual")
  const [selectedFanLevel, setSelectedFanLevel] = useState<FanLevel>("off")
  const [devicePower, setDevicePower] = useState<{ [id: string]: boolean }>({})

  const isOn = selectedDevice ? devicePower[selectedDevice.id] ?? selectedDevice.status === "on" : false

  useEffect(() => {
    if (selectedDevice) {
      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: selectedDevice.status === "on",
      }))
    }
  }, [selectedDevice])

  const handleTogglePower = () => {
    if (selectedDevice) {
      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: !isOn,
      }))
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === selectedDevice.id
            ? { ...d, status: isOn ? "off" : "on" }
            : d
        )
      )
      // อัปเดต selectedDevice ด้วย
      setSelectedDevice((prev) =>
        prev ? { ...prev, status: isOn ? "off" : "on" } : null
      )
    }
  }

  const handleSetFanLevel = (level: FanLevel) => {
    setSelectedFanLevel(level)
    if (selectedDevice) {
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === selectedDevice.id
            ? { ...d, fanSpeed: level }
            : d
        )
      )
      setSelectedDevice((prev) =>
        prev ? { ...prev, fanSpeed: level } : null
      )
    }
  }

  const getPM25GradientClassHex = (aqi: number): string => {
    if (aqi < 51) return "bg-gradient-to-br from-[#4ADE80] to-[#22C55E]"
    if (aqi < 101) return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]"
    if (aqi < 151) return "bg-gradient-to-br from-[#FB923C] to-[#EA580C]"
    if (aqi < 201) return "bg-gradient-to-br from-[#F87171] to-[#EC4899]"
    return "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]"
  }

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null)
  }
  

  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(aqi.aqi)}`}>
      <div className="px-4 pb-20">
        <div className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Devices</h1>
        </div>

        <div>
          <div className="w-full">
            <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg">
              <button
                className="w-full flex justify-between items-center px-6 py-8 text-left text-xl font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setControlPanelOpen(!controlPanelOpen)}
              >
                <span>Control Panel</span>
                <div className={`transform transition-transform duration-200 ${controlPanelOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown />
                </div>
              </button>

              {/* Animated Panel Body */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${controlPanelOpen
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0'
                  }`}
              >
                <div className={`p-6 space-y-6 transform transition-transform duration-300 ease-in-out ${controlPanelOpen
                  ? 'translate-y-0'
                  : '-translate-y-4'
                  }`}>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">MODE</h3>
                    <div className="flex gap-2">
                      {(["auto", "manual"] as Device["mode"][]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
                            ${selectedMode === mode
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">FAN LEVEL</h3>
                    <div className="flex gap-2 flex-wrap">
                      {(["off", "low", "mid", "high", "turbo"] as FanLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => handleSetFanLevel(level)}
                          disabled={selectedMode === "auto"}
                          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
      ${selectedFanLevel === level
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
      ${selectedMode === "auto" ? "opacity-50 cursor-not-allowed" : ""}
    `}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-t-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">Devices</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedDevice(device)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Wind className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{device.name}</h3>
                    <p className="text-gray-600">{device.room}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4" />
                    <span>Status: {device.status === "off" ? "Off" : "On"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    <span>Filter: {device.filterLife}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Mode: {device.mode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fan className="w-4 h-4" />
                    <span>Fan: {device.fanSpeed}</span>
                  </div>
                </div>
              </div>
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