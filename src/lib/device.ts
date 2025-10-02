export class Device {
  readonly id: number;
  model: string;
  location: string;
  entityId: string;
  filterEntityId: string;
  aqiEntityId: string;
  pm25EntityId: string;
  status: string;
  mode: string;
  percentage: number;
  filterLife: number;
  pm25Value: number;
  aqiValue: number;
  fanLevel: string;
  private static idCounter: number = 0;


  constructor(
    model: string,
    location: string,
    entityId: string,
    filterEntityId: string,
    aqiEntityId: string,
    pm25EntityId: string,
    status: "on" | "off" = "off",
    mode: "auto" | "manual" = "auto",
    percentage: number = 0,
    filterLife: number = 0,
    pm25Value: number = 0.0,
    aqiValue: number = 0,
    fanLevel: "off" | "low" | "mid" | "high" | "turbo" = "off"
  ) {
    this.id = Device.idCounter++;
    this.model = model;
    this.location = location;
    this.entityId = entityId;
    this.filterEntityId = filterEntityId;
    this.status = status;
    this.mode = mode;
    this.percentage = percentage;
    this.filterLife = filterLife;
    this.pm25Value = pm25Value;
    this.aqiValue = aqiValue;
    this.aqiEntityId = aqiEntityId;
    this.pm25EntityId = pm25EntityId;
    this.fanLevel = fanLevel;

    if (percentage === 0) {
      this.fanLevel = "off";
    } else if (percentage > 0 && percentage < 34) {
      this.fanLevel = "low";
    } else if (percentage >= 34 && percentage < 67) {
      this.fanLevel = "mid";
    } else if (percentage >= 67 && percentage < 100) {
      this.fanLevel = "high";
    } else {
      this.fanLevel = "turbo";
    }
  }
  //refresh device data

  //
}

export const devicesData: Device[] = [
  new Device("Core600s (1)", "Main Room", "fan.core_600s", "sensor.core_600s_filter_lifetime", "sensor.core_600s_air_quality", "sensor.core_600s_pm2_5"),
  new Device("Core600s (2)", "Main Room", "fan.core_600s_2", "sensor.core_600s_2_filter_lifetime", "sensor.core_600s_2_air_quality", "sensor.core_600s_2_pm2_5"),
  new Device("Core600s (3)", "Main Room", "fan.core_600s_3", "sensor.core_600s_3_filter_lifetime", "sensor.core_600s_3_air_quality", "sensor.core_600s_3_pm2_5"),
  new Device("Core400s", "Main Room", "fan.core_400s", "sensor.core_400s_filter_lifetime", "sensor.core_400s_air_quality", "sensor.core_400s_pm2_5"),
];