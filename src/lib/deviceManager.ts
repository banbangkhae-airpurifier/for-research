import { interval, Subscription } from 'rxjs';
import { Device } from './device';

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

interface AirQuality {
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

export class DeviceManager {
  private habaseURL: string = 'https://adxc0rmwdqhadwgtuuut0qvbi9luftvn.ui.nabu.casa'; // Replace with actual URL
  private hatoken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwNDEzNmRkYTA3ODE0ODY4YmIwMWU4NmJlZWY0MDA2MiIsImlhdCI6MTc0OTcwNDQ0NCwiZXhwIjoyMDY1MDY0NDQ0fQ.XshdadBtHNeAv0_L-X69q_lwTPm6fYKSh-zTsvgymvE'; // Replace with actual token
  airQuality: AirQuality | null = null;
  private devices: Device[] = [];
  private refreshTimer: Subscription | null = null;

  // Auto Refresh Timer
  private startAutoRefresh(): void {
    this.refreshTimer = interval(30000) // 30 seconds
      .subscribe(() => {
        console.log('🔁 Auto-refresh triggered');
        this.fetchAirQuality();
        this.refreshAllDevices();
      });
  }

  // Fetch AQI / PM2.5 from OpenWeather
  async fetchAirQuality(): Promise<void> {
    const url = 'https://api.openweathermap.org/data/2.5/air_pollution?lat=13.7563&lon=100.5018&appid=9a65a66ea74d1d1afea8c8325a52f734';
    // const url = ' http://localhost:6969/api/purple';
   
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
  async refreshDeviceState(device: Device): Promise<void> {
    // Get device state
    const [deviceState, autoModeState] = await Promise.all([
      this.getState(device.entityId),
      this.getState('input_boolean.auto_air_purifier')
    ]);

    if (deviceState.state) {
      device.status = deviceState.state;
      device.percentage = deviceState.attributes.percentage || 0;

      if (device.percentage === 0) {
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
    }

    if (autoModeState.state) {
      device.mode = autoModeState.state === 'on' ? 'auto' : 'manual';
    }
  }

  // Refresh all devices
  async refreshAllDevices(): Promise<void> {
    for (const device of this.devices) {
      await Promise.all([
        this.refreshDeviceState(device),
        this.getFilterLife(device),
        this.getAQI(device),
        this.getPM25(device)
      ]);
    }
  }

  // Get state
  private async getState(entity: string): Promise<{ state: string; attributes: DeviceAttributes }> {
    const url = `${this.habaseURL}/api/states/${entity}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.hatoken}` }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      console.log(`✅ Fetched state for ${entity}:`, json);
      return {
        state: json.state || '',
        attributes: json.attributes || {}
      };
    } catch (error) {
      console.error('❌ getState error:', error);
      return { state: '', attributes: {} };
    }
  }

  // Get filter life
  async getFilterLife(device: Device): Promise<void> {
    const { state } = await this.getState(device.filterEntityId);
    const filterValue = parseInt(state);
    if (!isNaN(filterValue)) {
      device.filterLife = filterValue;
      // console.log(`🔧 Filter life updated: ${filterValue}% for ${device.model}`);
    } else {
      // console.error(`❌ Cannot parse filter life from sensor ${device.filterEntityId}`);
    }
  }

  // Get AQI
  async getAQI(device: Device): Promise<void> {
    const { state } = await this.getState(device.aqiEntityId);
    const aqiValue = parseInt(state);
    if (!isNaN(aqiValue)) {
      device.aqiValue = aqiValue;
      console.log(`${device.aqiEntityId}: ${aqiValue}`);
    } else {
      // console.error(`❌ Cannot parse aqi from sensor ${device.aqiEntityId}`);
    }
  }

  // Get PM2.5
  async getPM25(device: Device): Promise<void> {
    const { state } = await this.getState(device.pm25EntityId);
    const pmValue = parseFloat(state);
    if (!isNaN(pmValue)) {
      device.pm25Value = pmValue;
      console.log(`${device.pm25EntityId}: ${pmValue}`);
    } else {
      // console.error(`❌ Cannot parse pm2.5 from sensor ${device.pm25EntityId}`);
    }
  }

  // Set auto mode
  async setAutoMode(enabled: boolean): Promise<void> {
    const service = enabled ? 'turn_on' : 'turn_off';
    const url = `${this.habaseURL}/api/services/input_boolean/${service}`;
    const payload = { entity_id: 'input_boolean.auto_air_purifier' };

    await this.sendRequest(url, payload, async () => {
      console.log(`✅ Auto mode set to ${enabled ? 'ON' : 'OFF'}`);
      const automationID = enabled ? 'auto_on_all_devices' : 'auto_off_all_devices';
      await this.triggerAutomation(automationID);

      // Refresh devices after 5 seconds
      setTimeout(() => this.refreshAllDevices(), 5000);
    });
  }

  // Set fan level
  async setFanLevel(device: Device, level: 'off' | 'low' | 'mid' | 'high' | 'turbo'): Promise<void> {
    const url = `${this.habaseURL}/api/services/input_select/select_option`;
    const option = level.toUpperCase();
    const payload = {
      entity_id: 'input_select.air_purifier_manual_control',
      option
    };

    await this.sendRequest(url, payload, () => {
      device.fanLevel = level;
      device.percentage = this.getPercentageForLevel(level);
      console.log(`Set fan level to ${option}`);
    });
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
  private async sendRequest(url: string, payload: any, completion: () => void): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Request succeeded');
        completion();
      } else {
        console.error(`Request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  }

  // Trigger automation
  async triggerAutomation(automationID: string): Promise<void> {
    const url = `${this.habaseURL}/api/services/automation/trigger`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hatoken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_id: `automation.${automationID}` })
      });

      if (response.ok) {
        console.log(`✅ Triggered automation: ${automationID}`);
      } else {
        console.error(`❌ Automation trigger failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Automation trigger failed:', error);
    }
  }


  public getAirQuality(): AirQuality | null {
  return this.airQuality;
}

  getDeviceById(id: string | number): Device | undefined {
    return this.devices.find((device) => device.id === id);
  }

  // Initialize devices
  setDevices(devices: Device[]): void {
    this.devices = devices;
  }

  getDevices(): Device[] {
    return this.devices;
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }
}

export default DeviceManager;