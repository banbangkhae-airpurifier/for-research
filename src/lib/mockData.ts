/* eslint-disable @typescript-eslint/no-explicit-any */
const API_KEY = "$2a$10$VrorE5pMqe8yol4eLLO2M.L43ra2apMD1UHsMYm5.uNUuQwOiI4Xy";

async function getDataFromBin(binId: string, valueKey: string, timeKey: string = "ReportDate") {
  const url = `https://api.jsonbin.io/v3/b/${binId}/latest`;
  try {
    const res = await fetch(url, { headers: { "X-Master-Key": API_KEY } });
    if (!res.ok) throw new Error(`Response status: ${res.status}`);
    const json = await res.json();
    return json.record.map((item: any) => ({
      time: item[timeKey],
      value: item[valueKey] ?? null
        ? Number(item[valueKey].toFixed(2))
        : null
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==================== PM2.5 Sensor 1 ====================
async function get7Day30minPole1() {
  const url = `https://api.jsonbin.io/v3/b/68c7bf15ae596e708fef1f6a/latest`;
  try {
    const res = await fetch(url, { headers: { "X-Master-Key": API_KEY } });
    const json = await res.json();
    return json.record.map((item: any) => ({
      time: item.ReportTime, // รวมวันที่กับเวลา
      value: item.AveragePM25 != null
        ? Number(item.AveragePM25?.toFixed(2))
        : null
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function get7Day30minPole2() {
  const url = `https://api.jsonbin.io/v3/b/68c7bf49d0ea881f407e509e/latest`;
  try {
    const res = await fetch(url, { headers: { "X-Master-Key": API_KEY } });
    const json = await res.json();
    return json.record.map((item: any) => ({
      time: item.ReportTime,
      value: item.AveragePM25 ?? null
        ? Number(item.AveragePM25?.toFixed(2))
        : null
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export const get7Day30minBoth = () =>
  getDataFromBin("68c7bf98ae596e708fef1ff5", "AveragePM25", "ReportTime");


// ==================== PM2.5 Sensor 1 Month ====================
export const get30Day1DayPole1 = () => getDataFromBin("68c7cc9843b1c97be943705a", "AveragePM25", "ReportDate");
export const get30Day1DayPole2 = () => getDataFromBin("68c7cce4d0ea881f407e5e6b", "AveragePM25", "ReportDate");
export const get30Day1DayBoth = () => getDataFromBin("68c7cd4343b1c97be94370d6", "AveragePM25", "ReportDate");

// ==================== PM2.5 Weekly ====================
export const get4Week1WeekPole1 = () => getDataFromBin("68c7cf3ed0ea881f407e6022", "AveragePM25", "WeekStartDate");
export const get4Week1WeekPole2 = () => getDataFromBin("68c7cf5ed0ea881f407e6049", "AveragePM25", "WeekStartDate");

// ==================== Temperature ====================
export const get7DayTemp = () => getDataFromBin("68c7cfcdd0ea881f407e60b2", "AverageCelsius", "ReportDate");
export const get30DayTemp = () => getDataFromBin("68c7cfeeae596e708fef2f7a", "AverageCelsius", "ReportDate");
export const getWeeklyTemp = () => getDataFromBin("68c7d010ae596e708fef2fa7", "WeeklyAverageCelsius", "WeekStartingDate");

// ==================== Last 24h ====================
export const getLast24hPole1 = async () => {
  const allData = await get7Day30minPole1();
  return allData.slice(-49);
};

export const getLast24hPole2 = async () => {
  const allData = await get7Day30minPole2();
  return allData.slice(-49);
};

export const getLast24hTemp = async () => {
  const allData = await get7DayTemp();
  return allData.slice(-49);
};
