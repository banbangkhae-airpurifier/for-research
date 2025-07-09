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

export default function HomeClient() {
  // ========== STATE MANAGEMENT ==========
  
  // Air Quality State
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Device State
  const [devices, setDevices] = useState<Device[]>(devicesData);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);  
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
  
  // Update device manager when devices change
  useEffect(() => {
    manager.setDevices(devices);
  }, [devices, manager]);

  // Main initialization effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch air quality data from the device manager
        await manager.fetchAirQuality();
        const data = manager.getAirQuality();
        
        if (data) {
          setAirQuality(data);
        } else {
          // TODO: Handle case when no air quality data is available
        }
      } catch (err) {
        setError("Failed to fetch air quality");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial data fetch
    fetchData();

    // Set up interval to update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(moment().format("ddd D MMM HH:mm:ss"));
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(timeInterval);
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

  const handleCloseDeviceDetail = () => {
    setSelectedDevice(null);
  };

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
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

  // ========== MAIN RENDER ========== //
  
  return (
    <div className={`min-h-screen pt-10 px-5 ${getPM25GradientClassHex(airQuality.aqi)}`}>
      {/* Main Content Container */}
      <div className="px-4 pb-20">
        
        {/* Header Section - Location and Time Display */}
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

        {/* AQI Display Section - Main air quality information */}
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

        {/* Devices Section - Grid of available devices */}
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
                    {/* Device Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Wind className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                    </div>
                    
                    {/* Device Information */}
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {device.model}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {device.location}
                      </p>
                    </div>
                    
                    {/* Device Status Indicator */}
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