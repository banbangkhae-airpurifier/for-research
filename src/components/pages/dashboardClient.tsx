"use client";

import { useState } from "react";
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
import { getAQIBadgeColor } from "@/lib/bgColor";
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
    <div className="w-full p-4 px-20 space-y-6 pb-20">
      {/* Cards ข้างบน */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-4 p-4 rounded-xl shadow-md ${card.bg}`}
          >
            <div className="p-3 rounded-full bg-white/50">{card.icon}</div>
            <div>
              <p className="text-gray-700 font-semibold text-sm">{card.label}</p>
              <p className="text-2xl font-bold">
                {card.value}{" "}
                <span className="text-base font-normal">{card.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full space-y-12 pt-5">
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

        {/* กราฟ PM2.5 */}
        <div className="w-full h-80">
          <h2 className="text-lg font-bold mb-2">pm 2.5</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time"/>
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="pm25"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="PM2.5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟ Temperature */}
        <div className="w-full h-80">
          <h2 className="text-lg font-bold mb-2">Temperature</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Temperature"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pt-10">
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-black px-4 py-2 text-left">Time</th>
              <th className="border border-black px-4 py-2 text-left">
                PM2.5 (µg/m³)
              </th>
              <th className="border border-black px-4 py-2 text-left">
                Temperature (°C)
              </th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{row.time}</td>
                <td className="border border-gray-300 px-4 py-2">{row.pm25}</td>
                <td className="border border-gray-300 px-4 py-2">{row.temp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
