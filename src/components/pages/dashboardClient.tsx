"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Droplets, Thermometer, Cloudy } from "lucide-react";
import { getAQIBadgeColor } from "@/lib/bgColor";

const data = [
  { time: "08:00", pm25: 42, temp: 26, humidity: 60 },
  { time: "09:00", pm25: 58, temp: 27, humidity: 62 },
  { time: "10:00", pm25: 63, temp: 28, humidity: 65 },
  { time: "11:00", pm25: 40, temp: 29, humidity: 63 },
  { time: "12:00", pm25: 48, temp: 30, humidity: 61 },
];

export default function MyLineChart() {
  const [selected, setSelected] = useState<"pm25" | "temp" | "both">("pm25");
  const latestPM25 = data[data.length - 1].pm25;
  // Card ข้างบน
  const cards = [
    {
      label: "Temperature",
      value: data[data.length - 1].temp,
      unit: "°C",
      icon: <Thermometer className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-100",
    },
    {
      label: "PM2.5",
      value: data[data.length - 1].pm25,
      unit: "µg/m³",
      icon: <Cloudy className="w-6 h-6" />,
      bg: getAQIBadgeColor(latestPM25), // ✅ dynamic
    },
    {
      label: "Humidity",
      value: data[data.length - 1].humidity,
      unit: "%",
      icon: <Droplets className="w-6 h-6 text-cyan-500" />,
      bg: "bg-cyan-100",
    },
  ];

  return (
    <div className="w-full p-4 space-y-6 pb-20">
      {/* Cards ข้างบน */}
      <div className="flex gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex-1 flex items-center gap-4 p-4 rounded-xl shadow-md ${card.bg}`}
          >
            <div className="p-3 rounded-full bg-white/50">{card.icon}</div>
            <div>
              <p className="text-gray-700 font-semibold text-sm">{card.label}</p>
              <p className="text-2xl font-bold">
                {card.value} <span className="text-base font-normal">{card.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Segment ปุ่มเลือก */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelected("pm25")}
          className={`px-4 py-2 rounded-xl ${selected === "pm25"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
        >
          PM2.5
        </button>
        <button
          onClick={() => setSelected("temp")}
          className={`px-4 py-2 rounded-xl ${selected === "temp"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
        >
          Temperature
        </button>
        <button
          onClick={() => setSelected("both")}
          className={`px-4 py-2 rounded-xl ${selected === "both"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
        >
          Both
        </button>
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            {selected === "both" && <Legend />}
            {selected === "pm25" && (
              <Line
                type="monotone"
                dataKey="pm25"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="PM2.5"
              />
            )}
            {selected === "temp" && (
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Temperature"
              />
            )}
            {selected === "both" && (
              <>
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="PM2.5"
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="Temperature"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
              {selected === "pm25" && (
                <th className="border border-gray-300 px-4 py-2 text-left">
                  PM2.5 (µg/m³)
                </th>
              )}
              {selected === "temp" && (
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Temperature (°C)
                </th>
              )}
              {selected === "both" && (
                <>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    PM2.5 (µg/m³)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Temperature (°C)
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{row.time}</td>
                {selected === "pm25" && (
                  <td className="border border-gray-300 px-4 py-2">{row.pm25}</td>
                )}
                {selected === "temp" && (
                  <td className="border border-gray-300 px-4 py-2">{row.temp}</td>
                )}
                {selected === "both" && (
                  <>
                    <td className="border border-gray-300 px-4 py-2">{row.pm25}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.temp}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
