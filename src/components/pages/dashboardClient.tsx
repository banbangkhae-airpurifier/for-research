"use client";

import { useEffect, useState } from "react";
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
} from "recharts";

import { Droplets, Thermometer, Cloudy } from "lucide-react";
import { getAQIBadgeColor, getPM25GradientClassHex } from "@/lib/bgColor";
import {
  pm25Data1Day,
  pm25Data7Days,
  pm25Data1Month,
  pm25Data2_1Day,
  pm25Data2_7Days,
  pm25Data2_1Month,
  tempData1Day,
  tempData7Days,
  tempData1Month,
  humidityData1Day,
  humidityData7Days,
  humidityData1Month,
} from "@/lib/mockData";

import { fetchSensor, AirQuality } from "@/lib/sensor";

export default function MyLineChart() {
  const [range, setRange] = useState<"1d" | "7d" | "1m">("1d");
  const [pmView, setPmView] = useState<"1" | "2" | "both">("1");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Card data
  const getCardData = () => {
    return pm25Data1Day.map((item, idx) => ({
      time: item.time,
      pm25: item.value,
      temp: tempData1Day[idx]?.value,
      humidity: humidityData1Day[idx]?.value,
    }));
  };

  // Data สำหรับกราฟและตาราง
  const getData = () => {
    let pm25Data, pm25Data2, tempData, humidityData;

    if (range === "1d") {
      pm25Data = pm25Data1Day;
      pm25Data2 = pm25Data2_1Day;
      tempData = tempData1Day;
      humidityData = humidityData1Day;
    } else if (range === "7d") {
      pm25Data = pm25Data7Days;
      pm25Data2 = pm25Data2_7Days;
      tempData = tempData7Days;
      humidityData = humidityData7Days;
    } else {
      pm25Data = pm25Data1Month;
      pm25Data2 = pm25Data2_1Month;
      tempData = tempData1Month;
      humidityData = humidityData1Month;
    }

    return pm25Data.map((item, idx) => ({
      time: item.time,
      pm25_1: pm25Data[idx]?.value,
      pm25_2: pm25Data2[idx]?.value,
      temp: tempData[idx]?.value,
      humidity: humidityData[idx]?.value,
    }));
  };

  const cardData = getCardData();
  const latestData = cardData[cardData.length - 1];
  const combinedData = getData();

  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const sensor = new fetchSensor();
    const fetchData = async () => {
      try {
        await sensor.fetchAirQuality(controller.signal);
        const data = sensor.getAirQuality();
        if (data) setAirQuality(data);
      } catch (err) {
        console.error("Error:", err);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

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
    <div className={`w-full p-4 px-10 space-y-6 pb-20 ${getPM25GradientClassHex(airQuality?.aqi)}`}>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-2xl">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-4 p-4 rounded-xl shadow-md ${card.bg}`}
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

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-2xl">
        <div className="w-full space-y-12 p-10">
          {/* Range Buttons */}
          <div className="flex gap-2 mb-4">
            {["1d", "7d", "1m"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as "1d" | "7d" | "1m")}
                className={`px-4 py-2 rounded-xl ${range === r ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {r === "1d" ? "1 วัน" : r === "7d" ? "7 วัน" : "1 เดือน"}
              </button>
            ))}
          </div>

          {/* Sensor Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPmView("1")}
              className={`px-4 py-2 rounded-xl ${pmView === "1" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Sensor 1
            </button>
            <button
              onClick={() => setPmView("2")}
              className={`px-4 py-2 rounded-xl ${pmView === "2" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Sensor 2
            </button>
            <button
              onClick={() => setPmView("both")}
              className={`px-4 py-2 rounded-xl ${pmView === "both" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Both
            </button>
          </div>
          {/* PM2.5 Chart */}
          {/* PM2.5 Chart */}
          <div className="w-full h-80">
            <h2 className="text-lg font-bold mb-2">PM 2.5</h2>
            <ResponsiveContainer width="100%" height="100%">
              {range === "7d" ? (
                <BarChart
                  data={combinedData}
                  margin={{ top: 20, right: 10, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />   {/* ✅ แก้ให้โชว์ตลอด */}
                  {(pmView === "1" || pmView === "both") && (
                    <Bar dataKey="pm25_1" fill="#ef4444" name="PM2.5 Sensor 1" />
                  )}
                  {(pmView === "2" || pmView === "both") && (
                    <Bar dataKey="pm25_2" fill="#10b981" name="PM2.5 Sensor 2" />
                  )}
                </BarChart>
              ) : (
                <LineChart
                  data={combinedData}
                  margin={{ top: 20, right: 10, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />   {/* ✅ แก้ให้โชว์ตลอด */}
                  {(pmView === "1" || pmView === "both") && (
                    <Line
                      type="monotone"
                      dataKey="pm25_1"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: isMobile ? 2 : 5 }}
                      name="PM2.5 Sensor 1"
                    />
                  )}
                  {(pmView === "2" || pmView === "both") && (
                    <Line
                      type="monotone"
                      dataKey="pm25_2"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: isMobile ? 2 : 5 }}
                      name="PM2.5 Sensor 2"
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>


          {/* Temperature Chart */}
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
                <Legend /> {/* ✅ เพิ่ม legend ให้โชว์ตลอด */}
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: isMobile ? 2 : 5 }} // ✅ Dot เล็กลงบนมือถือ
                  name="Temperature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto p-10">
          <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-black px-4 py-2 text-left">Time</th>
                <th className="border border-black px-4 py-2 text-left">PM2.5 (µg/m³)</th>
                <th className="border border-black px-4 py-2 text-left">Temperature (°C)</th>
                <th className="border border-black px-4 py-2 text-left">Humidity (%)</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{row.time}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {pmView === "1" && row.pm25_1}
                    {pmView === "2" && row.pm25_2}
                    {pmView === "both" && `${row.pm25_1} / ${row.pm25_2}`}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{row.temp}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.humidity}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
