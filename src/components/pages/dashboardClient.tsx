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
} from "recharts";
import { Droplets, Thermometer, Cloudy } from "lucide-react";
import { getAQIBadgeColor, getPM25GradientClassHex } from "@/lib/bgColor";
import {
  pm25Data1Day,
  pm25Data7Days,
  pm25Data1Month,
  tempData1Day,
  tempData7Days,
  tempData1Month,
  humidityData1Day,
  humidityData7Days,
  humidityData1Month,
} from "@/lib/mockData";
import { fetchSensor, AirQuality } from "@/lib/sensor";
// import { extractTimeSeries } from "@/lib/extractData";
// import { inputData } from "@/lib/extractData";

export default function MyLineChart() {
  const [range, setRange] = useState<"1d" | "7d" | "1m">("1d");

  //อันนี้ของ card นะจ๊ะ
  const getCardData = () => {
    return pm25Data1Day.map((item, idx) => ({
      time: item.time,
      pm25: item.value,
      temp: tempData1Day[idx]?.value,
      humidity: humidityData1Day[idx]?.value,
    }));
  };

  //อันนี้ของกราฟกับตารางนะจ๊ะ
  const getData = () => {
    let pm25Data, tempData, humidityData;

    if (range === "1d") {
      pm25Data = pm25Data1Day;
      tempData = tempData1Day;
      humidityData = humidityData1Day;
    } else if (range === "7d") {
      pm25Data = pm25Data7Days;
      tempData = tempData7Days;
      humidityData = humidityData7Days;
    } else {
      pm25Data = pm25Data1Month;
      tempData = tempData1Month;
      humidityData = humidityData1Month;
    }

    return pm25Data.map((item, idx) => ({
      time: item.time,
      pm25: item.value,
      temp: tempData[idx]?.value,
      humidity: humidityData[idx]?.value,
    }));
  };

  //เรียก func นะจ๊ะ
  const cardData = getCardData();
  const latestData = cardData[cardData.length - 1];
  //ของกราฟกับตารางนะจ๊ะ เวลากดเลือก วัน สัปดา ปี
  const combinedData = getData();

  // useEffect(() => {
  //   extractTimeSeries(inputData,"temp");
  //   const tempResult = extractTimeSeries(inputData, "TempC");
  //   console.log("temp data")
  //   console.log(JSON.stringify(tempResult, null, 2));
  // }, []);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const sensor = new fetchSensor();
    const fetchData = async () => {
      try {
        await sensor.fetchAirQuality(controller.signal);
        const data = sensor.getAirQuality();
        if (data) {
          setAirQuality(data);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  //card data นะจ๊ะ
  const cards = [
    {
      label: "Temperature",
      value: latestData.temp,
      unit: "°C",
      icon: <Thermometer className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-100",
    },
    {
      label: "PM2.5",
      value: latestData.pm25,
      unit: "µg/m³",
      icon: <Cloudy className="w-6 h-6" />,
      bg: getAQIBadgeColor(latestData.pm25),
    },
    {
      label: "Humidity",
      value: latestData.humidity,
      unit: "%",
      icon: <Droplets className="w-6 h-6 text-cyan-500" />,
      bg: "bg-cyan-100",
    },
  ];

  return (
    <div className={`min-h-screen p-4 md:p-8 ${getPM25GradientClassHex(airQuality?.aqi)}`}>
      <div className="max-w-7xl mx-auto space-y-8 pb-15">
        <div className="pt-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>

      {/* Chart */}
      <div className=" bg-white rounded-2xl shadow-2xl">
      <div className="w-full space-y-12 p-10">
        {/* ปุ่มเลือกช่วงเวลา */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRange("1d")}
            className={`px-4 py-2 rounded-xl ${range === "1d"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            1 วัน
          </button>
          <button
            onClick={() => setRange("7d")}
            className={`px-4 py-2 rounded-xl ${range === "7d"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            7 วัน
          </button>
          <button
            onClick={() => setRange("1m")}
            className={`px-4 py-2 rounded-xl ${range === "1m"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
              }`}
          >
            1 เดือน
          </button>
        </div>

            <div className="w-full h-80">
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
              )}
            </div>
          </div>

          {/* Temperature Chart */}
          <div className="bg-white backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-4">
            <div className="mb-6 px-5 pt-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Temperature</h2>
              <p className="text-gray-600">อุณหภูมิอากาศ (°C)</p>
            </div>

            <div className="w-full h-80">
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
                      <Bar dataKey="temp" fill="url(#tempGradient)" name="Temperature" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  ) : (
                    <LineChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
              )}
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
