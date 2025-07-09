"use client";

import { useState, useEffect } from "react";
import { Fan, Power, Settings, Droplets, Wind, ChevronDown } from "lucide-react";
import DeviceDetail from "@/components/sub-component/DeviceDetail";
import { Device, devicesData } from "@/lib/device";
import DeviceManager, { AirQuality } from "@/lib/deviceManager";
import type { FanLevel } from "@/lib/deviceManager";
import { getPM25GradientClassHex, getAQIStatus } from "@/lib/bgColor";

export default function DevicesClient() {
  // ========== STATE MANAGEMENT ==========
  
  // Device Manager Instance
  const manager = useState(() => new DeviceManager())[0];
  
  // Air Quality State
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Device State
  const [devices, setDevices] = useState<Device[]>(devicesData);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Control Panel State
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [globalMode, setGlobalMode] = useState<Device["mode"]>("manual");
  const [globalFanLevel, setGlobalFanLevel] = useState<FanLevel>("off");
  const [, setGlobalPower] = useState(false);

  // ========== COMPUTED VALUES ==========
  
  const isOn = selectedDevice
    ? selectedDevice.status === "on"
    : false;


  // ========== EFFECTS ==========

  // Update device manager when devices change
  useEffect(() => {
    manager.setDevices(devices);
  }, [devices, manager]);
  
  // Air quality data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await manager.fetchAirQuality();
        const data = manager.getAirQuality();
        setAirQuality(data);
      } catch (err) {
        setError("Failed to fetch air quality");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      manager.destroy();
    };
  }, [manager]);


  // Initialize device states ** TAKA **
  useEffect(() => {
    const fetchData = async () => {
      try {
        // setLoading(true);
        // Fetch and update all devices
        await manager.refreshAllDevices();
        const updatedDevices = manager.getDevices();
        setDevices(updatedDevices); // Sync React state with DeviceManager
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error:", err);
      } finally {
        // setLoading(false);
      }
    };

    fetchData();

    return () => {
      manager.destroy();
    };
  }, [manager]);

  // ========== EVENT HANDLERS ========== ** TAKA **
  
  const handleTogglePower = async () => {
    if (!selectedDevice) return;

    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === selectedDevice.id
          ? { ...device, status: isOn ? "off" : "on" }
          : device
      )
    );
    selectedDevice.status = isOn ? "off" : "on";
    
    try {
      // Toggle device power through the manager
      await manager.toggleDevicePower(selectedDevice);
      
      // Refresh device state and fetch updated data
      await manager.refreshDeviceState(selectedDevice);
      await manager.getAQI(selectedDevice);
      await manager.getPM25(selectedDevice);
      await manager.getFilterLife(selectedDevice);

      // Get the updated device data
      const updatedDevice = manager.getDeviceById(selectedDevice.id);

      // Update the selected device with new data
      setSelectedDevice(updatedDevice || selectedDevice);

      // Update the devices array with the new status



    } catch (err) {
      console.error("Error toggling device power:", err);
    }
  };

  const handleGlobalModeChange = (mode: Device["mode"]) => {
    setGlobalMode(mode);

    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        return {
          ...device,
          mode,
          status: mode === "auto" ? "on" : device.status,
        };
      })
    );

    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? { ...prev, mode, status: mode === "auto" ? "on" : prev.status }
          : null
      );
    }
  };

  const handleGlobalFanLevel = (level: FanLevel) => {
    setGlobalFanLevel(level);
    const shouldBeOn = level !== "off";
    setGlobalPower(shouldBeOn);

    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        return {
          ...device,
          fanSpeed: level,
          status: shouldBeOn ? "on" : "off",
        };
      })
    );
    

    if (selectedDevice) {
      setSelectedDevice((prev) =>
        prev
          ? { ...prev, fanSpeed: level, status: shouldBeOn ? "on" : "off" }
          : null
      );
    }
  };

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null);
  };

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleControlPanelToggle = () => {
    setControlPanelOpen(!controlPanelOpen);
  };

  // ========== CONDITIONAL RENDERING ==========
  
  if (error) {
    return (
      <div className="min-h-screen pt-10 px-5 text-red-500">
        {error}
      </div>
    );
  }

  if (loading || !airQuality) {
    return (
      <div className="min-h-screen pt-10 px-5 text-white">
        Loading air quality...
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  
  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(airQuality.aqi)}`}>
      <div className="px-4 pb-20">
        
        {/* Header Section */}
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

        {/* Control Panel Section */}
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

            {/* Animated Panel Body */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                controlPanelOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div
                className={`p-6 space-y-6 transform transition-transform duration-300 ease-in-out ${
                  controlPanelOpen ? "translate-y-0" : "-translate-y-4"
                }`}
              >
                {/* Global Mode Control */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    MODE (ALL DEVICES)
                  </h3>
                  <div className="flex gap-2">
                    {(["auto", "manual"] as Device["mode"][]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleGlobalModeChange(mode)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
                          ${
                            globalMode === mode
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Global Fan Level Control */}
                {globalMode === "manual" && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      FAN LEVEL (ALL DEVICES)
                    </h3>
                    <div className="flex gap-2">
                      {(["off", "low", "mid", "high", "turbo"] as FanLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => handleGlobalFanLevel(level)}
                          className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 transform
                            ${
                              globalFanLevel === level
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

        {/* Devices Grid Section */}
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      device.status === "on" ? "bg-green-200" : "bg-gray-200"
                    }`}
                  >
                    <Wind 
                      className={`w-6 h-6 ${
                        device.status === "on" ? "text-green-600" : "text-gray-600"
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
                      className={`w-4 h-4 ${
                        device.status === "on" ? "text-green-600" : "text-gray-400"
                      }`} 
                    />
                    <span>Status: {device.status === "off" ? "Off" : "On"}</span>
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

                {/* AQI indicator for each device */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Room AQI:</span>
                    <span
                      className={`font-semibold ${
                        device.aqiValue < 51 
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

      {/* Device Detail Modal */}
      <DeviceDetail
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={handleCloseDeviceDetail}
        onTogglePower={handleTogglePower}
      />
    </div>
  );
}