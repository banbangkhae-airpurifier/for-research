/* eslint-disable @typescript-eslint/no-explicit-any */
import { Subscription } from 'rxjs';
import { Device } from "./device";

// Interfaces for type safety
interface AirQualityComponents {
  pm2_5: number;
  [key: string]: number;
}

interface AirQualityMain {
  aqi: number;
}

interface AirQualityItem {
  main: AirQualityMain;
  components: AirQualityComponents;
}

interface OpenWeatherAirQualityResponse {
  list: AirQualityItem[];
}

export interface AirQuality {
  location: string;
  city: string;
  pm25: number;
  aqi: number;
  lastUpdated: Date;
}

interface DeviceAttributes {
  percentage?: number;
  [key: string]: any;
}

export type FanLevel = "off" | "low" | "mid" | "high" | "turbo" | "hi";

export class DeviceManager {
  private habaseURL: string = 'https://ewid931c2fcm2rfzccpasgrhblklbwod.ui.nabu.casa'; // Replace with actual URL
  private hatoken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwNDEzNmRkYTA3ODE0ODY4YmIwMWU4NmJlZWY0MDA2MiIsImlhdCI6MTc0OTcwNDQ0NCwiZXhwIjoyMDY1MDY0NDQ0fQ.XshdadBtHNeAv0_L-X69q_lwTPm6fYKSh-zTsvgymvE'; // Replace with actual token
  airQuality: AirQuality | null = null;
  private devices: Device[] = [];
  private refreshTimer: Subscription | null = null;
  private STORAGE_KEY = 'device_manager_state';

  // Fetch AQI / PM2.5 from OpenWeather
  async fetchAirQuality(): Promise<void> {
    const url = 'https://api.openweathermap.org/data/2.5/air_pollution?lat=13.7563&lon=100.5018&appid=9a65a66ea74d1d1afea8c8325a52f734';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const decoded: OpenWeatherAirQualityResponse = await response.json();

      const item = decoded.list[0];
      if (item) {
        this.airQuality = {
          location: 'COSCI Space',
          city: 'Bangkok, Petchburi',
          pm25: item.components.pm2_5,
          aqi: item.main.aqi,
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('❌ OpenWeather fetch error:', error);
    }
  }

  // Toggle device power
  async toggleDevicePower(device: Device): Promise<void> {
    const domain = 'fan';
    const service = device.status === 'on' ? 'turn_off' : 'turn_on';
    console.log(service);
    const url = `${this.habaseURL}/api/services/${domain}/${service}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_id: device.entityId })
      });

      if (response.ok) {
        device.status = device.status === 'on' ? 'off' : 'on';
        console.log(`✅ Power toggled: ${device.status.toUpperCase()}`);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Power toggle failed:', error);
    }
  }

  async offDevicePower(device: Device): Promise<void> {
    const domain = 'fan';
    const service = "turn_off";
    console.log(service);
    const url = `${this.habaseURL}/api/services/${domain}/${service}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_id: device.entityId })
      });

      if (response.ok) {
        device.status = device.status === 'on' ? 'off' : 'on';
        console.log(`✅ Power toggled: ${device.status.toUpperCase()}`);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Power toggle failed:', error);
    }
  }

  // Refresh device state
  async refreshDeviceState(device: Device, signal?: AbortSignal): Promise<void> {
    try {
      const [deviceState, autoModeState] = await Promise.all([
        this.getState(device.entityId, signal),
        this.getState('input_boolean.auto_air_purifier', signal)
      ]);

      if (deviceState.state) {
        device.status = deviceState.state;
        device.percentage = deviceState.attributes.percentage || 0;
        console.log(`🔄 Device state refreshed: ${device.percentage} is now ${device.status}`);

        if (device.percentage === 0 || device.status === 'off') {
          device.fanLevel = 'off';
        } else if (device.percentage < 34) {
          device.fanLevel = 'low';
        } else if (device.percentage < 67) {
          device.fanLevel = 'mid';
        } else if (device.percentage < 100) {
          device.fanLevel = 'high';
        } else {
          device.fanLevel = 'turbo';
        }
      } else {
        device.status = 'off';
      }

      if (autoModeState.state) {
        device.mode = autoModeState.state === 'on' ? 'auto' : 'manual';
      }
      // device.status = "off";
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ Device state refresh aborted for device: ${device.model}`);
        return;
      }
      console.error(`❌ Device state refresh failed for ${device.model}:`, error);
    }
  }

  // Refresh all devices
  async refreshAllDevices(signal?: AbortSignal): Promise<void> {
    console.log('🔄 Refreshing all devices');
    const promises = this.devices.map(device =>
      Promise.all([
        this.refreshDeviceState(device, signal),
        this.getFilterLife(device, signal),
        this.getAQI(device, signal),
        this.getPM25(device, signal)
      ]).then(() => {
        console.log(`✅ Refreshed device: ${device.model}`);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.devices));
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`❌ Refresh aborted for device: ${device.model}`);
          return;
        }
        console.error(`❌ Failed to refresh device ${device.model}:`, error);
      })
    );
    await Promise.all(promises);
  }

  // Get state
  private async getState(entity: string, signal?: AbortSignal): Promise<{ state: string; attributes: DeviceAttributes }> {
    const url = `${this.habaseURL}/api/states/${entity}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.hatoken}` },
        signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      console.log(`✅ Fetched state for ${entity}:`, json);
      return {
        state: json.state || '',
        attributes: json.attributes || {}
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ State fetch aborted for entity: ${entity}`);
        return { state: '', attributes: {} };
      }
      console.error('❌ getState error:', error);
      return { state: '', attributes: {} };
    }
  }

  // Get filter life
  async getFilterLife(device: Device, signal?: AbortSignal): Promise<void> {
    try {
      const { state } = await this.getState(device.filterEntityId, signal);
      const filterValue = parseInt(state);
      if (!isNaN(filterValue)) {
        device.filterLife = filterValue;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ Filter life fetch aborted for device: ${device.model}`);
        return;
      }
      console.error(`❌ Cannot parse filter life from sensor ${device.filterEntityId}:`, error);
    }
  }

  // Get AQI
  async getAQI(device: Device, signal?: AbortSignal): Promise<void> {
    try {
      const { state } = await this.getState(device.aqiEntityId, signal);
      const aqiValue = parseInt(state);
      if (!isNaN(aqiValue)) {
        device.aqiValue = aqiValue;
        console.log(`${device.aqiEntityId}: ${aqiValue}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ AQI fetch aborted for device: ${device.model}`);
        return;
      }
      console.error(`❌ Cannot parse aqi from sensor ${device.aqiEntityId}:`, error);
    }
  }

  // Get PM2.5
  async getPM25(device: Device, signal?: AbortSignal): Promise<void> {
    try {
      const { state } = await this.getState(device.pm25EntityId, signal);
      const pmValue = parseFloat(state);
      if (!isNaN(pmValue)) {
        device.pm25Value = pmValue;
        console.log(`${device.pm25EntityId}: ${pmValue}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ PM2.5 fetch aborted for device: ${device.model}`);
        return;
      }
      console.error(`❌ Cannot parse pm2.5 from sensor ${device.pm25EntityId}:`, error);
    }
  }

  // Set auto mode
  async setAutoMode(enabled: boolean, signal?: AbortSignal): Promise<void> {
    const service = enabled ? 'turn_on' : 'turn_off';
    const url = `${this.habaseURL}/api/services/input_boolean/${service}`;
    const payload = { entity_id: 'input_boolean.auto_air_purifier' };

    await this.sendRequest(url, payload, async () => {
      console.log(`✅ Auto mode set to ${enabled ? 'ON' : 'OFF'}`);
      const automationID = enabled ? 'auto_on_all_devices' : 'auto_off_all_devices';
      await this.triggerAutomation(automationID, signal);

      // Refresh devices after 5 seconds
      setTimeout(() => this.refreshAllDevices(), 5000);
    }, signal);
  }

  async setFanLevel(device: Device, level: FanLevel): Promise<void> {
    if (level === 'off') {
      await this.offDevicePower(device);
      device.fanLevel = 'off';
      device.percentage = 0;
      console.log(`✅ Device ${device.model} turned OFF`);
    } else {
      const url = `${this.habaseURL}/api/services/input_select/select_option`;
      const option = level.toUpperCase();
      const payload = {
        entity_id: 'input_select.air_purifier_manual_control',
        option
      };

      await this.sendRequest(url, payload, () => {
        device.fanLevel = level;
        device.percentage = this.getPercentageForLevel(level);
        console.log(`✅ Set fan level to ${option}`);
      });
    }
  }

  // Helper to map fan level to percentage
  private getPercentageForLevel(level: string): number {
    switch (level) {
      case 'off': return 0;
      case 'low': return 33;
      case 'mid': return 66;
      case 'high': return 99;
      case 'turbo': return 100;
      default: return 0;
    }
  }

  // Send request
  private async sendRequest(url: string, payload: any, completion: () => void, signal?: AbortSignal): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal
      });

      if (response.ok) {
        console.log('Request succeeded');
        completion();
      } else {
        console.error(`Request failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ Request aborted for URL: ${url}`);
        return;
      }
      console.error('Request failed:', error);
    }
  }

  // Trigger automation
  async triggerAutomation(automationID: string, signal?: AbortSignal): Promise<void> {
    const url = `${this.habaseURL}/api/services/automation/trigger`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_id: `automation.${automationID}` }),
        signal
      });

      if (response.ok) {
        console.log(`✅ Triggered automation: ${automationID}`);
      } else {
        console.error(`❌ Automation trigger failed with status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ Automation trigger aborted for: ${automationID}`);
        return;
      }
      console.error('❌ Automation trigger failed:', error);
    }
  }

  public getAirQuality(): AirQuality | null {
    return this.airQuality;
  }

  getDeviceById(id: string | number): Device | undefined {
    return this.devices.find((device) => device.id === id);
  }

  setDevices(devices: Device[]): void {
    this.devices = devices;
  }

  getDevices(): Device[] {
    return this.devices;
  }

  destroy(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }
}

export default DeviceManager;