/* eslint-disable @typescript-eslint/no-explicit-any */
const API_KEY = "$2a$10$COVfkQUkHHOSQocqbdFwTuO8/aXZe7lQYCUltOrovXvKtbhXX9h5m";

async function getDataFromBin(binId: string, valueKey: string, timeKey: string = "ReportDate") {
  const url = `https://api.jsonbin.io/v3/b/${binId}/latest`;
  try {
    const res = await fetch(url, { headers: { "X-Master-Key": API_KEY } });
    if (!res.ok) throw new Error(`Response status: ${res.status}`);
    const json = await res.json();
    return json.record.map((item: any) => ({
      time: item[timeKey],
      value: item[valueKey] != null
        ? Number(item[valueKey].toFixed(2))
        : null
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==================== PM2.5 Sensor ====================
// PM2.5 by date (30 days)
export const get30Day1DayPM25 = () => getDataFromBin("68cac8cfd0ea881f40811a8d", "AveragePM25", "ReportDate");

// PM2.5 by day (weekly)
export const get7Day1DayPM25 = () => getDataFromBin("68cac914d0ea881f40811aeb", "AveragePM25", "DayOfWeek");

// PM2.5 by time (30-min intervals in 1 day)
export const get24h30minPM25 = () => getDataFromBin("68cac94cae596e708ff1e64f", "AveragePM25", "TimeSlot");

// ==================== Temperature ====================
// Temp by date (30 days)
export const get30DayTemp = () => getDataFromBin("68cac8e7d0ea881f40811aa7", "AverageCelsius", "ReportDate");

// Temp by day (weekly)
export const get7DayTemp = () => getDataFromBin("68cac932ae596e708ff1e627", "AverageCelsius", "DayOfWeek");

// Temp by time (30-min intervals in 1 day)
export const get24h30minTemp = () => getDataFromBin("68cac97a43b1c97be9462a0d", "AverageCelsius", "TimeSlot");
