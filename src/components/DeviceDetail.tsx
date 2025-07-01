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
    status: "on" | "off"
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-500">
                            ← Devices
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Device Header */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">{device.name}</h2>
                                    <p className="text-gray-600">{device.room}</p>
                                </div>
                                <button
                                    onClick={() => onTogglePower(device.id)}
                                    className={`w-12 h-12 border-2 rounded-full flex items-center justify-center transition-colors ${isOn ? "border-green-500 bg-green-100" : "border-red-500 bg-white"
                                        }`}
                                >
                                    <Power className={`w-6 h-6 transition-colors ${isOn ? "text-green-500" : "text-red-500"}`} />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Air Quality */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative w-32 h-32">
                                    {/* Gauge background */}
                                    <svg width="128" height="128" viewBox="0 0 128 128" className="absolute top-0 left-0">
                                        <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                                    </svg>
                                    {/* Gauge value */}
                                    <svg width="128" height="128" viewBox="0 0 128 128" className="absolute top-0 left-0">
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
                                        <span className="text-2xl font-bold text-gray-700">{device.aqi}</span>
                                        <span className="text-xs text-gray-500">AQI</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="text-3xl font-bold text-gray-600">AQI: {device.aqi}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filter Lifetime */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-500">FILTER LIFETIME</h3>
                                <span className="text-gray-500 font-semibold">{device.filterLife}%</span>
                            </div>
                            <Progress value={device.filterLife} className="h-2" />
                        </CardContent>
                    </Card>

                    {/* Device Status */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <span className="text-gray-600">MODE: </span>
                                <span className="font-semibold">{device.mode}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">FAN SPEED: </span>
                                <span className="font-semibold">{device.fanSpeed}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
