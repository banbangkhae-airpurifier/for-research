import { Subscription } from "rxjs";
import { calculateAQI } from "./utils";

export interface AirQuality {
  location: string;
  city: string;
  pm25: number;
  aqi: number;
  temp: number;
  lastUpdated: Date;
}

interface SensorAttributes {
  [key: string]: unknown;
}

export class fetchSensor {
    private habaseURL: string = 'https://ewid931c2fcm2rfzccpasgrhblklbwod.ui.nabu.casa'; // Replace with actual URL
    private hatoken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwNDEzNmRkYTA3ODE0ODY4YmIwMWU4NmJlZWY0MDA2MiIsImlhdCI6MTc0OTcwNDQ0NCwiZXhwIjoyMDY1MDY0NDQ0fQ.XshdadBtHNeAv0_L-X69q_lwTPm6fYKSh-zTsvgymvE'; // Replace with actual token
    airQuality: AirQuality | null = null;
    private refreshTimer: Subscription | null = null;

    private async getState(entity: string, signal?: AbortSignal): Promise<{ state: string; attributes: SensorAttributes }> {
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

  // Fetch AQI / PM2.5 from OpenWeather
    async fetchAirQuality(signal?: AbortSignal): Promise<void> {
        const pm25 = await this.getSensor("sensor.dust_pole_pm2_5",signal) || 0;
        const temp = await this.getSensor("sensor.dust_pole_temperature",signal) || 0;
        this.airQuality = {
            location: 'บ้านผู้สูงอายุบางแค 2',
            city: 'Bangkok, Bangkae',
            pm25,
            aqi: calculateAQI(pm25),
            temp,
            lastUpdated: new Date()
        };
    }

    public getAirQuality(): AirQuality | null {
        return this.airQuality;
    }

    // Get Temperature in Fahrenheit from Home Assistant "
    async getSensor(sensorID: string, signal?: AbortSignal): Promise<number | undefined> {
        try {
        const { state } = await this.getState(sensorID,signal);
        const filterValue = parseInt(state);
        if (!isNaN(filterValue)) {
            return filterValue;
        }
        } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log(`❌ Sensor fetch aborted}`);
            return;
        }   
        console.error(`❌ Cant Fetch Sensor : `, error);
        }
    }

    async getEmails(signal?: AbortSignal): Promise<string[] | undefined> {
    try {
        const { state } = await this.getState("input_text.allowed_emails", signal);
        if (!state) {
        console.error("❌ No state found for input_text.allowed_emails");
        return undefined;
        }

        // Parse the JSON string into an array
        const emailArray = JSON.parse(state) as string[];
        // Trim each email to remove any extra whitespace
        return emailArray.map(email => email.trim());
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`❌ Sensor fetch aborted`);
        return undefined;
        }
        console.error(`❌ Can't fetch emails:`, error);
        return undefined;
    }
    }
}




