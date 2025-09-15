/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Legend,
  BarChart,
} from "recharts"
import { fetchSensor, type AirQuality } from "@/lib/sensor"
import {
  get30Day1DayPole1,
  get30Day1DayPole2,
  get30DayTemp,
  get4Week1WeekPole1,
  get4Week1WeekPole2,
  getWeeklyTemp,
  getLast24hPole1,
  getLast24hPole2,
  getLast24hTemp,
} from "@/lib/mockData"
import { getPM25GradientClassHex } from "@/lib/bgColor"

export default function MyLineChart() {
  const [range, setRange] = useState<"1d" | "7d" | "1m">("1d")
  const [pmView, setPmView] = useState<"1" | "2" | "both">("1")
  const [isMobile, setIsMobile] = useState(false)
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const [combinedData, setCombinedData] = useState<any[]>([])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Fetch chart data
  useEffect(() => {
    const fetchData = async () => {
      let pm25Data: any[] = []
      let pm25Data2: any[] = []
      let tempData: any[] = []

      if (range === "1d") {
        pm25Data = await getLast24hPole1()
        pm25Data2 = await getLast24hPole2()
        tempData = await getLast24hTemp()
      } else if (range === "7d") {
        pm25Data = await get4Week1WeekPole1()
        pm25Data2 = await get4Week1WeekPole2()
        // Normalize weekly temp
        const rawTemp = await getWeeklyTemp()
        tempData = rawTemp.map((item: any) => ({
          time: item.WeekStartingDate,
          value: item.WeeklyAverageCelsius ?? null,
        }))
      } else {
        pm25Data = await get30Day1DayPole1()
        pm25Data2 = await get30Day1DayPole2()
        const rawTemp = await get30DayTemp()
        tempData = rawTemp.map((item: any) => ({
          time: item.WeekStartingDate ?? item.ReportDate ?? item.time,
          value: item.WeeklyAverageCelsius ?? null,
        }))
      }

      const combined = pm25Data.map((item, idx) => ({
        time: item.time,
        pm25_1: item.value ?? null,
        pm25_2: pm25Data2[idx]?.value ?? null,
        temp: tempData[idx]?.value ?? null,
        humidity: tempData[idx]?.humidity ?? null,
      }))

      setCombinedData(combined)
    }

    fetchData()
  }, [range])

  // Fetch live air quality
  useEffect(() => {
    const controller = new AbortController()
    const sensor = new fetchSensor()
    const fetchData = async () => {
      try {
        await sensor.fetchAirQuality(controller.signal)
        const data = sensor.getAirQuality()
        if (data) setAirQuality(data)
      } catch (err) {
        console.error("Error:", err)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{`เวลา: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.dataKey.includes("temp") ? "°C" : " µg/m³"}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 ${getPM25GradientClassHex(airQuality?.aqi)}`}>
      <div className="max-w-7xl mx-auto space-y-8 pb-15">
        <div className="pt-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>

        <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
            {/* Range Selection */}
            <div className="space-y-2">
              <div className="gap-2">
                <label className="text-sm font-medium text-gray-700">ช่วงเวลา</label>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: "1d", label: "1 วัน" },
                  { key: "7d", label: "7 วัน" },
                  { key: "1m", label: "1 เดือน" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setRange(item.key as "1d" | "7d" | "1m")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${range === item.key
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensor Selection */}
            <div className="space-y-2">
              <div className="gap-2">
                <label className="text-sm font-medium text-gray-700">เซ็นเซอร์</label>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: "1", label: "Sensor 1" },
                  { key: "2", label: "Sensor 2" },
                  { key: "both", label: "ทั้งหมด" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPmView(item.key as "1" | "2" | "both")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pmView === item.key
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          {/* PM2.5 Chart */}
          <div className="bg-white backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">pm 2.5</h2>
              <p className="text-gray-600">ระดับฝุ่นละออง PM2.5 (µg/m³)</p>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {range === "7d" ? (
                  <BarChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {(pmView === "1" || pmView === "both") && (
                      <Bar dataKey="pm25_1" fill="url(#gradient1)" name="PM2.5 Sensor 1" radius={[4, 4, 0, 0]} />
                    )}
                    {(pmView === "2" || pmView === "both") && (
                      <Bar dataKey="pm25_2" fill="url(#gradient2)" name="PM2.5 Sensor 2" radius={[4, 4, 0, 0]} />
                    )}
                    <defs>
                      <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                ) : (
                  <LineChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {(pmView === "1" || pmView === "both") && (
                      <Line
                        type="monotone"
                        dataKey="pm25_1"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: isMobile ? 3 : 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: "#ef4444" }}
                        name="PM2.5 Sensor 1"
                      />
                    )}
                    {(pmView === "2" || pmView === "both") && (
                      <Line
                        type="monotone"
                        dataKey="pm25_2"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: isMobile ? 3 : 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: "#10b981" }}
                        name="PM2.5 Sensor 2"
                      />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature Chart */}
          <div className="bg-white backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Temperature</h2>
              <p className="text-gray-600">อุณหภูมิอากาศ (°C)</p>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {range === "7d" ? (
                  <BarChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="temp" fill="url(#tempGradient)" name="Temperature" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                ) : (
                  <LineChart data={combinedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: isMobile ? 3 : 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#3b82f6" }}
                      name="Temperature"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">ข้อมูลรายละเอียด</h3>
            <p className="text-gray-600 mt-1">ตารางแสดงค่าข้อมูลทั้งหมด</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">เวลา</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">PM2.5 (µg/m³)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">อุณหภูมิ (°C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {combinedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pmView === "1" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {row.pm25_1}
                        </span>
                      )}
                      {pmView === "2" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row.pm25_2}
                        </span>
                      )}
                      {pmView === "both" && (
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {row.pm25_1}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {row.pm25_2}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row.temp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
