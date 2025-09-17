"use client";

import { useState, useEffect } from "react";
import { Fan, Power, Settings, Droplets, Wind, ChevronDown } from "lucide-react";
import DeviceDetail from "@/components/sub-component/DeviceDetail";
import { Device, devicesData } from "@/lib/device";
import DeviceManager, { AirQuality, FanLevel } from "@/lib/deviceManager";
import { getPM25GradientClassHex, getAQIStatus } from "@/lib/bgColor";
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

export default function DevicesClient() {
  // ========== STATE MANAGEMENT ==========
  const STORAGE_KEY = 'device_manager_state';
  const manager = useState(() => new DeviceManager())[0];

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
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [globalMode, setGlobalMode] = useState<Device["mode"]>("auto");
  const [globalFanLevel, setGlobalFanLevel] = useState<FanLevel>("hi");
  const [, setGlobalPower] = useState(false);
  const [devicePower, setDevicePower] = useState<boolean>(
    selectedDevice ? selectedDevice.status === "on" : false
  );

  // Save devices to localStorage when they change
  useEffect(() => {
    try {
      storeTimestamp();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
      manager.setDevices(devices);
    } catch (error) {
      console.error('❌ Failed to save devices to localStorage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  // ========== COMPUTED VALUES ==========
  const isOn = selectedDevice ? selectedDevice.status === "on" : false;

  // ========== EFFECTS ==========

  // Air quality data fetching effect
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

    return () => {
      clearInterval(fetchInterval);
      controller.abort();
      manager.destroy();
    };
  }, [manager]);

  // Initialize device states
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

    setGlobalMode(devices[0]?.mode || "auto");
    setGlobalFanLevel((devices[0]?.fanLevel as FanLevel) || "off");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleGlobalModeChange = async (mode: Device["mode"]) => {
    setGlobalMode(mode);

    if (mode === "manual") {
      await Promise.all(
        devices.map(async (device) => {
          try {
            await manager.setFanLevel(device, "low");
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
              return;
            }
            console.error(`❌ Error setting fan level for device ${device.model}:`, err);
          }
        })
      );
    }

    const newDevices = devices.map((device) => ({
      ...device,
      mode,
      status: mode === "auto" ? "on" : device.status,
    }));
    setDevices(newDevices);
    manager.setDevices(newDevices);

    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? { ...prev, mode, status: mode === "auto" ? "on" : prev.status }
          : null
      );
    }

    const switchToAutoMode = mode === "auto";
    try {
      await manager.setAutoMode(switchToAutoMode);
      if (refreshing) {console.log("Refresh IN Queue"); return; }
      setRefreshing(true);
      // Additional 10-second delay to ensure state consistency
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await manager.refreshAllDevices();
      const updatedDevices = manager.getDevices();
      setRefreshing(false);
      setDevices([...updatedDevices]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error("Error setting auto mode or refreshing devices:", err);
    }
  };

  const handleGlobalFanLevel = async (level: FanLevel) => {
    setGlobalFanLevel(level);
    const shouldBeOn = level !== "off";
    setGlobalPower(shouldBeOn);

    const newDevices = devices.map((device) => ({
      ...device,
      fanLevel: level,
      status: shouldBeOn ? "on" : "off",
    }));

    setDevices(newDevices);
    manager.setDevices(newDevices);

    await Promise.all(
      newDevices.map(async (device) => {
        try {
          if (level === "off") {
            await manager.offDevicePower(device);
          } else {
            await manager.setFanLevel(device, level);
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          console.error(`❌ Error processing device ${device.model}:`, error);
        }
      }),
    );

    try {
      if (refreshing) {console.log("Refresh In Queue"); return};
      setRefreshing(true);
      // Additional 10-second delay to ensure state consistency
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await manager.refreshAllDevices();
      const updatedDevices = manager.getDevices();
      setRefreshing(false);
      setDevices([...updatedDevices]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error("Error refreshing devices:", err);
    }

    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? { ...prev, fanLevel: level, status: shouldBeOn ? "on" : "off" }
          : null
      );
    }
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null);
  };

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setDevicePower(device.status === "on");
    window.scrollTo({ top: 0, behavior: "smooth" });

  };

  const handleControlPanelToggle = () => {
    setControlPanelOpen(!controlPanelOpen);
  };

  // ========== SKELETON LOADING ==========
  const SkeletonLoader = () => (
    <div className="min-h-screen pt-10 px-5 bg-gray-200">
      <div className="px-4 pb-20">
        {/* Header Skeleton */}
        <header className="mb-8">
          <div className="h-8 w-1/4 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="flex items-center gap-4">
            <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-6 w-28 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </header>

        {/* Control Panel Skeleton */}
        <section className="mb-6">
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="h-16 w-full bg-gray-300 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Devices Grid Skeleton */}
        <section className="bg-white/20 rounded-t-3xl p-6 -mx-4">
          <div className="h-6 w-32 bg-gray-300 rounded animate-pulse mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 w-3/4 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  // ========== CONDITIONAL RENDERING ==========
  if (error) {
    return (
      <div className="min-h-screen pt-10 px-5 text-red-500">{error}</div>
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
          <h1 className="text-4xl font-bold mb-2">Devices</h1>
          <div className="flex items-center gap-4 text-white/90">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">Current AQI: </span>
              <span className="font-bold text-lg">{airQuality.aqi ?? "-"}</span>
              <span className="text-sm ml-2">({getAQIStatus(airQuality.aqi)})</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">PM2.5: </span>
              <span className="font-bold">{airQuality.pm25 ?? "-"} μg/m³</span>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <button
              className="w-full flex justify-between items-center px-6 py-8 text-left text-xl font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              onClick={handleControlPanelToggle}
            >
              <span>Control Panel</span>
              <div className={`transform transition-transform duration-200 ${controlPanelOpen ? "rotate-180" : ""}`}>
                <ChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${controlPanelOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              <div
                className={`p-6 space-y-6 transform transition-transform duration-300 ease-in-out ${controlPanelOpen ? "translate-y-0" : "-translate-y-4"
                  }`}
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    MODE (ALL DEVICES)
                  </h3>
                  <div className="flex gap-2">
                    {(["auto", "manual"] as Device["mode"][]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleGlobalModeChange(mode)}
                        className={`flex-1 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 transform
                          ${globalMode === mode
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {globalMode === "manual" && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      FAN LEVEL (ALL DEVICES)
                    </h3>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      {(["off", "low", "mid", "high", "turbo"] as FanLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => handleGlobalFanLevel(level)}
                          className={`flex-1 min-w-[70px] px-2 py-3 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 transform
                            ${globalFanLevel === level
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
        </section>

        <section className="bg-white/20 backdrop-blur-sm rounded-t-3xl p-6 -mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">
            Devices ({devices.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-xl p-4 shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDeviceClick(device)}
              >
                <div className="flex items-center gap-3 mb-3">
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
                    <h3 className="font-semibold text-lg">{device.model}</h3>
                    <p className="text-gray-600">{device.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Power
                      className={`w-4 h-4 ${device.status === "on" ? "text-green-600" : "text-gray-400"
                        }`}
                    />
                    <span>Status: {device.status === "on" ? "On" : "Off"}</span>
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
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Room AQI:</span>
                    <span
                      className={`font-semibold ${device.aqiValue < 51
                        ? "text-green-600"
                        : device.aqiValue < 101
                          ? "text-yellow-600"
                          : "text-red-600"
                        }`}
                    >
                      {device.aqiValue}
                    </span>
                  </div>
                </div>
              </div>
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