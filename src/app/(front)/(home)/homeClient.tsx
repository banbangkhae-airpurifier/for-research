/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind } from "lucide-react";
import { Device, devicesData } from "@/lib/device";
import DeviceManager from "@/lib/deviceManager";
import DeviceDetail from "@/components/DeviceDetail";
import { StatusIndicator } from "@/components/StatusIndicator";
import moment from "moment";

interface AirQuality {
  location: string;
  city: string;
  pm25: number;
  aqi: number;
  lastUpdated: Date;
}

export default function HomeClient() {
  const [airQuality, setAirQuality] = useState<AirQuality>({
    location: "Main Room",
    city: "Tokyo",
    pm25: 0,
    aqi: 0,
    lastUpdated: new Date(),
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>(devicesData);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [devicePower, setDevicePower] = useState<{ [id: string]: boolean }>({});
  const isOn = selectedDevice ? (devicePower[selectedDevice.id] ?? selectedDevice.status === "on") : false;
  const [currentTime, setCurrentTime] = useState(moment().format("ddd D MMM HH:mm:ss"));
  const manager = useState(() => new DeviceManager())[0];

  useEffect(() => {
  manager.setDevices(devices);
}, [devices, manager]);

  useEffect(() => {
    // Fetch air quality on mount
    

    async function fetchData() {
      try {
        setLoading(true);
        await manager.fetchAirQuality();
        const data = manager.getAirQuality();
        if (data) {
          setAirQuality(data);
        } else {
          
        }
      } catch (err) {
        setError("Failed to fetch air quality");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(moment().format("ddd D MMM HH:mm:ss"));
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
      manager.destroy();
    };
  }, [manager]);

  const getPM25GradientClassHex = (aqi: number): string => {
    if (aqi < 51) {
      return "bg-gradient-to-br from-[#4ADE80] to-[#22C55E]";
    } else if (aqi < 101) {
      return "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]";
    } else if (aqi < 151) {
      return "bg-gradient-to-br from-[#FB923C] to-[#EA580C]";
    } else if (aqi < 201) {
      return "bg-gradient-to-br from-[#F87171] to-[#EC4899]";
    } else {
      return "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]";
    }
  };

  const getAQIBadgeColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-100 text-green-800";
    if (aqi <= 100) return "bg-yellow-100 text-yellow-800";
    if (aqi <= 150) return "bg-orange-100 text-orange-800";
    if (aqi <= 200) return "bg-red-100 text-red-800";
    return "bg-purple-100 text-purple-700";
  };

  const handleTogglePower = async () => {
    if (selectedDevice) {
      await manager.toggleDevicePower(selectedDevice);
      await manager.refreshDeviceState(selectedDevice);
      await manager.getAQI(selectedDevice);
      await manager.getPM25(selectedDevice);
      await manager.getFilterLife(selectedDevice);

      const updatedDevice = manager.getDeviceById(selectedDevice.id);



      setSelectedDevice(updatedDevice || selectedDevice);

      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d.id === selectedDevice.id
            ? { ...d, status: isOn ? "off" : "on" }
            : d
        )
      );

      setDevicePower((prev) => ({
        ...prev,
        [selectedDevice.id]: selectedDevice.status === "on",
      }));

    }
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null);
  };

  if (error) {
    return <div className="min-h-screen pt-10 px-5 text-red-500">{error}</div>;
  }

  if (loading || !airQuality) {
    return <div className="min-h-screen pt-10 px-5 text-white">Loading air quality...</div>;
  }

  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(airQuality.aqi)}`}>
      {/* Main Content */}
      <div className="px-4 pb-20">
        {/* Header */}
        <div className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">{airQuality.location}</h1>
          <p className="text-xl opacity-90 mb-4">{airQuality.city}</p>
          <p className="text-lg opacity-80">{currentTime}</p>
        </div>

        {/* AQI Display */}
        <div className="text-center text-white mb-8">
          <p className="text-lg mb-4">PM2.5</p>
          <div className="text-8xl font-bold mb-2">{airQuality.pm25}</div>
          <p className="text-lg mb-4">μg/m³</p>
          <Badge className={`${getAQIBadgeColor(airQuality.aqi)} text-lg px-4 py-2`}>
            AQI {airQuality.aqi}
          </Badge>
        </div>

        {/* Devices Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">Devices</h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedDevice(device)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col text-center items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Wind className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{device.model}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">{device.location}</p>
                    </div>
                    <div>
                      <StatusIndicator isOn={device.status === "on"} />
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
  );
}