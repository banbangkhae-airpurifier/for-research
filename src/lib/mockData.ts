/* eslint-disable @typescript-eslint/no-explicit-any */
const API_KEY = "$2a$10$COVfkQUkHHOSQocqbdFwTuO8/aXZe7lQYCUltOrovXvKtbhXX9h5m";

async function getDataFromBin(binId: string, valueKey: string, timeKey: string = "ReportDate") {
  const url = `https://api.jsonbin.io/v3/b/${binId}/latest`;
  try {
    const res = await fetch(url, { headers: { "X-Master-Key": API_KEY } });
    if (!res.ok) throw new Error(`Response status: ${res.status}`);
    const json = await res.json();

    // ตารางแปลชื่อวันเป็นไทย
    const dayMap: Record<string, string> = {
      Monday: "จันทร์",
      Tuesday: "อังคาร",
      Wednesday: "พุธ",
      Thursday: "พฤหัสบดี",
      Friday: "ศุกร์",
      Saturday: "เสาร์",
      Sunday: "อาทิตย์",
    };

    return json.record.map((item: any) => {
      const rawTime = item[timeKey];
      let formattedTime = rawTime;

      // ถ้าเป็นวันที่ในรูปแบบ YYYY-MM-DD → แปลงเป็น D MMM YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawTime)) {
        const date = new Date(rawTime);
        formattedTime = date.toLocaleDateString("th-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      // ถ้าเป็นชื่อวันในภาษาอังกฤษ → แปลงเป็นไทย
      else if (dayMap[rawTime]) {
        formattedTime = dayMap[rawTime];
      }

      return {
        time: formattedTime,
        value: item[valueKey] != null
          ? Number(item[valueKey].toFixed(2))
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching data from bin:", error);
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
