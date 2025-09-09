export class PM25Sensor {
    entity_id: string;
    pm2_5: number | null;
    attributes: Record<string, any>;

    constructor(entity_id: string, state: string, attributes: Record<string, any>) {
        this.entity_id = entity_id;
        const num = Number(state);
        this.pm2_5 = num;
        this.attributes = attributes;
    }

    getAirQualityLevel(): string {
        if (this.pm2_5 === null) return "-"
        if (this.pm2_5 < 51) return "Good"
        if (this.pm2_5 < 101) return "Moderate"
        if (this.pm2_5 < 151) return "Unhealthy for Sensitive Groups"
        if (this.pm2_5 < 201) return "Unhealthy"
        return "Very Unhealthy"
    }
}

export class TemperatureSensor {
    entity_id: string;
    temperature: number | null;
    attributes: Record<string, any>;

    constructor(entity_id: string, state: string, attributes: Record<string, any>) {
        this.entity_id = entity_id;
        const num = Number(state);
        this.temperature = num;
        this.attributes = attributes;
    }
}


// {
//   "entity_id": "sensor.dust_pole_pm25",
//   "state": "15",
//   "attributes": {
//     "unit_of_measurement": "µg/m³",
//     "friendly_name": "PM2.5 Dust Sensor"
//   },
//   "last_changed": "2025-09-08T03:12:45",
//   "last_updated": "2025-09-08T03:12:45",
//   "context": {
//     "id": "abcd1234efgh5678",
//     "parent_id": null,
//     "user_id": null
//   }
// }

