"use client";

import { useEffect, useState } from "react";
import moment from "moment";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind } from "lucide-react";
import { StatusIndicator } from "@/components/sub-component/StatusIndicator";
import DeviceDetail from "@/components/sub-component/DeviceDetail";
import { Device, devicesData } from "@/lib/device";
import DeviceManager, { AirQuality } from "@/lib/deviceManager";
import { getPM25GradientClassHex, getAQIBadgeColor } from "@/lib/bgColor";
import { fetchSensor } from "@/lib/sensor";

// Function to store current timestamp in localStorage
function storeTimestamp(key: string = 'lastAccessTime'): void {
  const currentTime = new Date().toISOString();
  localStorage.setItem(key, currentTime);
}

// Function to check time difference and remove other localStorage keys if > 10 minutes
function checkAndClearLocalStorage(timeKey: string = 'lastAccessTime'): void {
  const storedTime = localStorage.getItem(timeKey);
  
  if (storedTime) {
    const storedDate = new Date(storedTime);
    const currentDate = new Date();
    
    // Calculate time difference in minutes
    const timeDifference = (currentDate.getTime() - storedDate.getTime()) / (1000 * 60);
    
    // If difference exceeds 10 minutes, remove all localStorage keys except timeKey
    if (timeDifference > 10) {
      Object.keys(localStorage)
        .filter(key => key !== timeKey)
        .forEach(key => localStorage.removeItem(key));
    }
  }
}

export default function HomeClient() {
  // ========== STATE MANAGEMENT ==========
  const STORAGE_KEY = 'device_manager_state';

  // Air Quality State
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Device State
  const isBrowser = typeof window !== 'undefined';
  const [devices, setDevices] = useState<Device[]>(() => {
    if (!isBrowser) {
      return [];
    }
    try {
      checkAndClearLocalStorage();
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Device[];
      }
      return devicesData;
    } catch (error) {
      console.error('❌ Failed to load devices from localStorage:', error);
      return [];
    }
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [devicePower, setDevicePower] = useState<boolean>(selectedDevice ? (selectedDevice.status === "on") : false);

  // UI State
  const [currentTime, setCurrentTime] = useState(
    moment().format("ddd D MMM HH:mm:ss")
  );

  // Device Manager Instance
  const manager = useState(() => new DeviceManager())[0];

  // ========== COMPUTED VALUES ==========
  const isOn = selectedDevice
    ? (selectedDevice.status === "on")
    : false;

  // ========== EFFECTS ==========

  // Save devices to localStorage when they change
  useEffect(() => {
    const saveDevices = async () => {
      if (!isBrowser) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
        storeTimestamp();
        manager.setDevices(devices);
      } catch (error) {
        console.error('❌ Failed to save devices to localStorage:', error);
      }
    }

    saveDevices();

  }, [devices]);

  // Fetch Air Quality and update time
  useEffect(() => {
    const controller = new AbortController();
    const sensor = new fetchSensor();
    const fetchData = async (loading: boolean) => {
      try {
        setLoading(loading);
        await sensor.fetchAirQuality();
        const data = sensor.getAirQuality();
        if (data) {
          setAirQuality(data);
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData(true);
    const fetchInterval = setInterval(() => {
      fetchData(false);
    }, 15 * 1000);

    const timeInterval = setInterval(() => {
      setCurrentTime(moment().format("ddd D MMM HH:mm:ss"));
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(fetchInterval);
      controller.abort();
      manager.destroy();
    };
  }, [manager]);

  useEffect(() => {
    let controller = new AbortController();

    const fetchData = async (signal: AbortSignal) => {
      try {
        await manager.refreshAllDevices(signal);
        const updatedDevices = manager.getDevices();
        setDevices([...updatedDevices]);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError("Failed to fetch data");
        console.error("Error:", err);
      }
    };

    if (!localStorage.getItem(STORAGE_KEY)) {
      fetchData(controller.signal);
    } else {
      manager.setDevices(devices);
    }

    const fetchInterval = setInterval(() => {
      if (!refreshing) {
        console.log('🔄 Fetching devices every 15 seconds');
        controller = new AbortController();
        fetchData(controller.signal);
      }

    }, 15 * 1000);

    return () => {
      clearInterval(fetchInterval);
      controller.abort();
      manager.destroy();
    };
  }, []);

  // ========== EVENT HANDLERS ==========

  const handleTogglePower = async () => {
    if (!selectedDevice) return;

    setDevicePower(!isOn);
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === selectedDevice.id
          ? { ...device, status: isOn ? "off" : "on" }
          : device
      )
    );

    try {
      await manager.toggleDevicePower(selectedDevice);
      if (refreshing) { console.log("Refresh IN Queue"); return; }
      setRefreshing(true);
      // Additional 10-second delay to ensure state consistency
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await manager.refreshAllDevices();
      const updatedDevices = manager.getDevices();
      setRefreshing(false);
      setDevices([...updatedDevices]);
    } catch (err) {
      console.error("Error toggling device power:", err);
    }
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null);
  };

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setDevicePower(device.status === "on");
  };

  // ========== SKELETON LOADING ==========
  const SkeletonLoader = () => (
    <div className="min-h-screen pt-10 px-5 bg-gray-200">
      <div className="px-4 pb-20">
        {/* Header Skeleton */}
        <header className="mb-8">
          <div className="h-8 w-3/4 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="h-6 w-1/2 bg-gray-300 rounded animate-pulse mb-4"></div>
          <div className="h-5 w-1/3 bg-gray-300 rounded animate-pulse"></div>
        </header>

        {/* AQI Display Skeleton */}
        <section className="text-center mb-8">
          <div className="h-5 w-16 mx-auto bg-gray-300 rounded animate-pulse mb-4"></div>
          <div className="h-20 w-32 mx-auto bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-20 mx-auto bg-gray-300 rounded animate-pulse mb-4"></div>
          <div className="h-8 w-24 mx-auto bg-gray-300 rounded animate-pulse"></div>
        </section>

        {/* Devices Section Skeleton */}
        <section className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 -mx-4">
          <div className="h-6 w-32 bg-gray-300 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="w-full">
                      <div className="h-4 w-3/4 mx-auto bg-gray-300 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-1/2 mx-auto bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  // ========== CONDITIONAL RENDERING ==========

  if (error) {
    return (
      <div className="min-h-screen pt-10 px-5 text-red-500">
        {error}
      </div>
    );
  }

  if (loading || !airQuality) {
    return <SkeletonLoader />;
  }

  // ========== MAIN RENDER ==========

  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(airQuality.aqi)}`}>
      <div className="px-4 pb-20">
        <header className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {airQuality.location}
          </h1>
          <p className="text-xl opacity-90 mb-4">
            {airQuality.city}
          </p>
          <p className="text-lg opacity-80">
            {currentTime}
          </p>
        </header>

        <section className="text-center text-white mb-8">
          <p className="text-lg mb-4">PM2.5</p>
          <div className="text-8xl font-bold mb-2">
            {airQuality.pm25}
          </div>
          <p className="text-lg mb-4">μg/m³</p>
          <Badge className={`${getAQIBadgeColor(airQuality.aqi)} text-lg px-4 py-2`}>
            AQI {airQuality.aqi}
          </Badge>
        </section>

        <section className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">
            Devices
          </h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDeviceClick(device)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col text-center items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${device.status === "on" ? "bg-green-200" : "bg-gray-200"
                        }`}
                    >
                      <Wind
                        className={`w-6 h-6 ${device.status === "on" ? "text-green-600" : "text-gray-600"
                          }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {device.model}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {device.location}
                      </p>
                    </div>
                    <div>
                      <StatusIndicator isOn={device.status === "on"} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <DeviceDetail
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={handleCloseDeviceDetail}
        onTogglePower={handleTogglePower}
        devicePower={devicePower}
      />
    </div>
  );
}