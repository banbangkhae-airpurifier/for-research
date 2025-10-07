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
  Cell,
  LabelList,
} from "recharts"
import { fetchSensor, type AirQuality } from "@/lib/sensor"
import {
  get30Day1DayPM25,
  get7Day1DayPM25,
  get24h30minPM25,
  get30DayTemp,
  get7DayTemp,
  get24h30minTemp,
} from "@/lib/mockData"
import { getPM25Color, getPM25GradientClassHex, getTempColor } from "@/lib/bgColor"
import Information from "../sub-component/Information";

export default function MyLineChart() {
  const [range, setRange] = useState<"1d" | "7d" | "1m">("7d")
  const [pmView,] = useState<"1">("1")
  const [isMobile, setIsMobile] = useState(false)
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null)
  const [combinedData, setCombinedData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
      console.log("Fetching data for range:", range)
      try {
        let pm25Data: any[] = []
        let tempData: any[] = []

        if (range === "1d") {
          pm25Data = await get24h30minPM25();
          tempData = await get24h30minTemp();
        } else if (range === "7d") {
          pm25Data = await get7Day1DayPM25();
          tempData = await get7DayTemp();
        } else {
          pm25Data = await get30Day1DayPM25()
          tempData = await get30DayTemp()
        }

        const combined = pm25Data.map((item, idx) => ({
          time: item.time === null ? 0 : item.time,
          pm25_1: item.value === null ? 0 : item.value,
          temp: tempData[idx]?.value === null ? 0 : tempData[idx]?.value,
          humidity: tempData[idx]?.humidity ?? null,
          fillPM25: getPM25Color(item.value === null ? 0 : item.value),
          fillTemp: getTempColor(tempData[idx]?.value === null ? 0 : tempData[idx]?.value),
        }))
        setCombinedData(combined)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [range])

  // Fetch live air quality
  useEffect(() => {
    const controller = new AbortController()
    const sensor = new fetchSensor()
    const fetchData = async () => {
      try {
        setLoading(true)
        await sensor.fetchAirQuality(controller.signal)
        const data = sensor.getAirQuality()
        await new Promise(res => setTimeout(res, 3000))
        if (data) setAirQuality(data)
      } catch (err) {
        console.error("Error:", err)
      }
      finally { setLoading(false) }
    }
    fetchData()
    return () => controller.abort()
  }, [range])

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



  // Custom dot renderer for dynamic PM2.5-based colors
  const CustomDot = (props: any) => {
    const { cx, cy, value } = props
    if (!value) return null
    const color = getPM25Color(value) // Use PM2.5 value for color
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isMobile ? 3 : 5}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

  // Custom dot renderer for dynamic PM2.5-based colors
  const CustomDotTemp = (props: any) => {
    const { cx, cy, value } = props
    if (!value) return null
    const color = getTempColor(value) // Use PM2.5 value for color
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isMobile ? 3 : 5}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

const CustomBarLabel = ({ x, y, width, value }: any) => (
  <text
    x={x + width / 2}
    y={y - 6}
    textAnchor="middle"
    fontSize={isMobile ? 11 : 11.5}
    fill="#374151"
    fontWeight="bold"
  >
    {value}
  </text>
);

return (
    <div
      className={`min-h-screen p-4 md:p-8 ${loading ? "bg-gray-200" : getPM25GradientClassHex(airQuality?.pm25)}`}
    >
      <Information />
      <div className="max-w-7xl mx-auto space-y-8 pb-15">
        <div className="pt-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-10">
          {/* Range Buttons */}
          <div className="flex gap-2 mb-4">
            {["7d", "1m", "1d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as "1d" | "7d" | "1m")}
                className={`px-4 py-2 rounded-xl ${range === r ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {r === "1d" ? "เวลา" : r === "7d" ? "วัน" : "วันที่"}
              </button>
            ))}
          </div>

          {/* PM2.5 Chart */}
          <div className="w-full h-80 mb-24">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PM 2.5 (μg/m³)</h2>
              {/* <p className="text-gray-600">ค่าฝุ่น μg/m³</p> */}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {range === "7d" ? (
                  <BarChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    {pmView === "1" && (
                      <Bar
                        dataKey="pm25_1"
                        name="PM2.5 Sensor"
                        radius={[4, 4, 0, 0]}
                        fill="#10b981"
                      >
                        {combinedData.map((entry, index) => (
                          <Cell key={`cell-pm25-${index}`} fill={entry.fillPM25} />
                        ))}
                          <LabelList dataKey="pm25_1" position="top" content={CustomBarLabel} />
                      </Bar>
                    )}
                  </BarChart>
                ) : (
                  <LineChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    {pmView === "1" && (
                      <Line
                        type="monotone"
                        dataKey="pm25_1"
                        stroke="url(#gradientPM25)"
                        strokeWidth={3}
                        dot={<CustomDot />}
                        activeDot={<CustomDot />}
                        name="PM2.5 Sensor"
                        connectNulls={true}
                      />
                    )}
                    <defs>
                      <linearGradient id="gradientPM25" x1="0" y1="0" x2="1" y2="0">
                        {combinedData
                          .map((item, index) => ({
                            value: item.pm25_1,
                            index,
                          }))
                          .filter(item => item.value !== null && item.value !== undefined)
                          .map((item, i, filtered) => (
                            <stop
                              key={i}
                              offset={`${(i / (filtered.length - 1)) * 100}%`}
                              stopColor={getPM25Color(item.value)}
                              stopOpacity={0.8}
                            />
                          ))}
                      </linearGradient>
                    </defs>
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Temperature Chart */}
          <div className="w-full h-80 mb-24">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Temperature (°C)</h2>
              {/* <p className="text-gray-600">อุณหภูมิอากาศ </p> */}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {range === "7d" ? (
                  <BarChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    <Bar
                      dataKey="temp"
                      name="Temperature"
                      radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                    >
                      {combinedData.map((entry, index) => (
                        <Cell key={`cell-temp-${index}`} fill={entry.fillTemp} />
                      ))}
                          <LabelList dataKey="temp" position="top" content={CustomBarLabel} />
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="url(#gradientTemp)"
                      strokeWidth={3}
                      dot={<CustomDotTemp />}
                      activeDot={<CustomDotTemp />}
                      name="Temperature"
                    />
                    <defs>
                      <linearGradient id="gradientTemp" x1="0" y1="0" x2="1" y2="0">
                        {combinedData
                          .map((item, index) => ({
                            value: item.temp,
                            index,
                          }))
                          .filter(item => item.value !== null && item.value !== undefined)
                          .map((item, i, filtered) => (
                            <stop
                              key={i}
                              offset={`${(i / (filtered.length - 1)) * 100}%`}
                              stopColor={getTempColor(item.value)}
                              stopOpacity={0.8}
                            />
                          ))}
                      </linearGradient>
                    </defs>
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-10">
          <div className="mb-6">
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
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  combinedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.time}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {pmView === "1" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {row.pm25_1}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {row.temp}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}