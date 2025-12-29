/* eslint-disable @typescript-eslint/no-explicit-any */
import { Subscription } from 'rxjs';
import { Device } from "./device";


export interface AirQuality {
  location: string;
  city: string;
  pm25: number;
  aqi: number;
  temp: number;
  lastUpdated: Date;
}

interface DeviceAttributes {
  percentage?: number;
  [key: string]: any;
}



export type FanLevel = "off" | "low" | "mid" | "high" | "turbo" | "hi";

export class DeviceManager {
  private habaseURL: string = process.env.HABASEURL!;
  private hatoken: string = process.env.HATOKEN!;
  airQuality: AirQuality | null = null;
  private devices: Device[] = [];
  private refreshTimer: Subscription | null = null;
  private STORAGE_KEY = 'device_manager_state';


  // Toggle device power
  async toggleDevicePower(device: Device): Promise<void> {
    const domain = 'fan';
    const service = device.status === 'on' ? 'turn_off' : 'turn_on';
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

        if (device.percentage === 0 || device.status === 'off') {
          device.fanLevel = 'off';
          device.percentage = 0
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
        return;
      }
      console.error(`❌ Device state refresh failed for ${device.model}:`, error);
    }
  }

  // Refresh all devices
  async refreshAllDevices(signal?: AbortSignal): Promise<void> {
    const promises = this.devices.map(device =>
      Promise.all([
        this.refreshDeviceState(device, signal),
        this.getFilterLife(device, signal),
        this.getAQI(device, signal),
        this.getPM25(device, signal)
      ]).then(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.devices));
      })
        .catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') {
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
      return {
        state: json.state || '',
        attributes: json.attributes || {}
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
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
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
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
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
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
      const automationID = enabled ? 'auto_on_all_devices' : 'auto_off_all_devices';
      await this.triggerAutomation(automationID, signal);

    }, signal);
  }

  async setFanLevel(device: Device, level: FanLevel): Promise<void> {
    if (level === 'off') {
      await this.offDevicePower(device);
      device.fanLevel = 'off';
      device.percentage = 0;
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
        completion();
      } else {
        console.error(`Request failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
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
      } else {
        console.error(`❌ Automation trigger failed with status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('❌ Automation trigger failed:', error);
    }
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