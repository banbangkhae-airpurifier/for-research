"use client"

import { useState, useEffect } from "react"

import { Fan, Power, Settings, Droplets, Wind, ChevronDown } from "lucide-react"

import { Device, devicesData } from "@/lib/device"

import aqiData from "@/data/aqi.json"
import DeviceDetail from "@/components/DeviceDetail"

interface AQIData {
  pm25: number
  aqi: number
}

type FanLevel = "off" | "low" | "mid" | "high" | "turbo"

export default function Dashboard() {
  const aqi = aqiData

  const [devices, setDevices] = useState<Device[]>(devicesData as unknown as Device[])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [controlPanelOpen, setControlPanelOpen] = useState(false)
  // Global control states
  const [globalMode, setGlobalMode] = useState<Device["mode"]>("manual")
  const [globalFanLevel, setGlobalFanLevel] = useState<FanLevel>("off")
  const [, setGlobalPower] = useState(false)
  const [devicePower, setDevicePower] = useState<{ [id: string]: boolean }>({})
  const isOn = selectedDevice ? (devicePower[selectedDevice.id] ?? selectedDevice.status === "on") : false


  useEffect(() => {
    if (selectedDevice) {
      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: selectedDevice.status === "on",
      }))
    }
  }, [selectedDevice])

  // Initialize global states based on first device or most common settings
  useEffect(() => {
    if (devices.length > 0) {
      const firstDevice = devices[0]
      setGlobalMode(firstDevice.mode)
      setGlobalFanLevel(firstDevice.fanLevel as FanLevel)
      setGlobalPower(firstDevice.status === "on")

      // Initialize device power states
      const initialPowerStates: { [id: string]: boolean } = {}
      devices.forEach((device) => {
        initialPowerStates[device.id] = device.status === "on"
      })
      setDevicePower(initialPowerStates)
    }
  }, [])

  const handleTogglePower = () => {
    if (selectedDevice) {
      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: !isOn,
      }))
      setDevices((prevDevices) =>
        prevDevices.map((d) => (d.id === selectedDevice.id ? { ...d, status: isOn ? "off" : "on" } : d)),
      )
      setSelectedDevice((prev) => (prev ? { ...prev, status: isOn ? "off" : "on" } : null))
    }
  }

  // Global mode control for all devices
  const handleGlobalModeChange = (mode: Device["mode"]) => {
    setGlobalMode(mode)

    const newDevicePowerState: { [id: string]: boolean } = {}

    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        if (mode === "auto") {
          newDevicePowerState[device.id] = true
        }
        return {
          ...device,
          mode: mode,
          status: mode === "auto" ? "on" : device.status,
        }
      }),
    )

    // Update device power states when switching to auto
    if (mode === "auto") {
      setDevicePower(newDevicePowerState)
    }

    // Update selected device if exists
    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? {
              ...prev,
              mode: mode,
              status: mode === "auto" ? "on" : prev.status,
            }
          : null,
      )
    }
  }

  const handleGlobalFanLevel = (level: FanLevel) => {
    setGlobalFanLevel(level)

    // Automatically turn devices on/off based on fan level
    const shouldBeOn = level !== "off"
    setGlobalPower(shouldBeOn)

    const newDevicePowerState: { [id: string]: boolean } = {}

    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        newDevicePowerState[device.id] = shouldBeOn
        return {
          ...device,
          fanSpeed: level,
          status: shouldBeOn ? "on" : "off",
        }
      }),
    )

    setDevicePower(newDevicePowerState)

    // Update selected device if exists
    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? {
              ...prev,
              fanSpeed: level,
              status: shouldBeOn ? "on" : "off",
            }
          : null,
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

  const getAQIStatus = (aqi: number): string => {
    if (aqi < 51) return "Good"
    if (aqi < 101) return "Moderate"
    if (aqi < 151) return "Unhealthy for Sensitive Groups"
    if (aqi < 201) return "Unhealthy"
    return "Very Unhealthy"
  }

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null)
  }

  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(aqi.aqi)}`}>
      <div className="px-4 pb-20">
        <div className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Devices</h1>
          <div className="flex items-center gap-4 text-white/90">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">Current AQI: </span>
              <span className="font-bold text-lg">{aqi.aqi}</span>
              <span className="text-sm ml-2">({getAQIStatus(aqi.aqi)})</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">PM2.5: </span>
              <span className="font-bold">{aqi.pm25} μg/m³</span>
            </div>
          </div>
        </div>

        <div>
          <div className="w-full">
            <div className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg">
              <button
                className="w-full flex justify-between items-center px-6 py-8 text-left text-xl font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setControlPanelOpen(!controlPanelOpen)}
              >
                <span>Control Panel</span>
                <div className={`transform transition-transform duration-200 ${controlPanelOpen ? "rotate-180" : ""}`}>
                  <ChevronDown />
                </div>
              </button>

              {/* Animated Panel Body */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  controlPanelOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div
                  className={`p-6 space-y-6 transform transition-transform duration-300 ease-in-out ${
                    controlPanelOpen ? "translate-y-0" : "-translate-y-4"
                  }`}
                >
                  {/* Global Mode Control */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">MODE (ALL DEVICES)</h3>
                    <div className="flex gap-2">
                      {(["auto", "manual"] as Device["mode"][]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleGlobalModeChange(mode)}
                          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
                            ${
                              globalMode === mode
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Global Fan Level Control */}
                  {globalMode === "manual" && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">FAN LEVEL (ALL DEVICES)</h3>
                      <div className="flex gap-2">
                        {(["off", "low", "mid", "high", "turbo"] as FanLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => handleGlobalFanLevel(level)}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
                              ${
                                globalFanLevel === level
                                  ? "bg-green-500 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-t-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">Devices ({devices.length})</h2>
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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      device.status === "on" ? "bg-green-200" : "bg-gray-200"
                    }`}
                  >
                    <Wind className={`w-6 h-6 ${device.status === "on" ? "text-green-600" : "text-gray-600"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{device.model}</h3>
                    <p className="text-gray-600">{device.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${device.status === "on" ? "text-green-600" : "text-gray-400"}`} />
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
                    <span>Fan: {device.fanLevel}</span>
                  </div>
                </div>

                {/* AQI indicator for each device */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Room AQI:</span>
                    <span
                      className={`font-semibold ${device.aqiValue < 51 ? "text-green-600" : device.aqiValue < 101 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {device.aqiValue}
                    </span>
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
