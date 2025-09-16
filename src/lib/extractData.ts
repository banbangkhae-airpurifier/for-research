interface TimeSeriesInput {
  DateAndTime: string;
  [key: string]: string | number;
}

interface TimeSeriesPoint {
  time: string;
  value: number;
}

interface TimeSeriesOutput {
  data1Day: TimeSeriesPoint[];
  data7Days: TimeSeriesPoint[];
  data1Month: TimeSeriesPoint[];
}

export function extractTimeSeries<T extends string>(
  data: TimeSeriesInput[],
  valueKey: T
): TimeSeriesOutput {
  // Parse dates and sort by DateAndTime in ascending order
  const parsedData = data
    .map(item => ({
      date: new Date(item.DateAndTime),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: parseFloat(item[valueKey] as any)
    }))
    .filter(item => !isNaN(item.date.getTime()) && !isNaN(item.value))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (parsedData.length === 0) {
    return {
      data1Day: [],
      data7Days: [],
      data1Month: []
    };
  }

  const earliestDate = parsedData[0].date;
//   const latestDate = parsedData[parsedData.length - 1].date;

  // Helper function to calculate average
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal place
  };

  // 1-day data: 30-minute averages starting from 00:00 of earliest date's day
  const data1Day: TimeSeriesPoint[] = [];
  const dayStart = new Date(earliestDate);
  dayStart.setHours(0, 0, 0, 0); // Set to 00:00 of earliest date's day
  for (let interval = 0; interval < 48; interval++) { // 48 intervals of 30 minutes
    const start = new Date(dayStart);
    start.setMinutes(start.getMinutes() + interval * 30);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 30);
    
    const intervalData = parsedData.filter(
      item => item.date >= start && item.date < end
    );
    if (intervalData.length > 0) {
      const avgValue = calculateAverage(intervalData.map(item => item.value));
      const hours = start.getHours().toString().padStart(2, '0');
      const minutes = start.getMinutes().toString().padStart(2, '0');
      const timeLabel = `${hours}:${minutes}`; // e.g., "00:00"
      data1Day.push({ time: timeLabel, value: avgValue });
    }
  }

  // 7-day data: Daily averages from earliest to latest day
  const data7Days: TimeSeriesPoint[] = [];
  const earliestDayStart = new Date(earliestDate);
  earliestDayStart.setHours(0, 0, 0, 0);
  for (let day = 0; day < 7; day++) {
    const start = new Date(earliestDayStart);
    start.setDate(earliestDayStart.getDate() + day);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    
    const dailyData = parsedData.filter(
      item => item.date >= start && item.date < end
    );
    if (dailyData.length > 0) {
      const avgValue = calculateAverage(dailyData.map(item => item.value));
      data7Days.push({ time: `Day ${day + 1}`, value: avgValue });
    }
  }

  // 1-month data: Weekly averages from earliest to latest week
  const data1Month: TimeSeriesPoint[] = [];
  const earliestWeekStart = new Date(earliestDate);
  earliestWeekStart.setHours(0, 0, 0, 0);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - earliestWeekStart.getDay()); // Start of week
  for (let week = 0; week < 4; week++) {
    const start = new Date(earliestWeekStart);
    start.setDate(earliestWeekStart.getDate() + week * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    
    const weeklyData = parsedData.filter(
      item => item.date >= start && item.date < end
    );
    if (weeklyData.length > 0) {
      const avgValue = calculateAverage(weeklyData.map(item => item.value));
      data1Month.push({ time: `Week ${week + 1}`, value: avgValue });
    }
  }

  return {
    data1Day,
    data7Days,
    data1Month
  };
}

// Example usage
export const inputData = [{"TempC":39.239999999999995,"DateAndTime":"2025-09-09 12:25:26"},{"TempC":39.42,"DateAndTime":"2025-09-09 12:25:39"},{"TempC":39.599999999999994,"DateAndTime":"2025-09-09 12:25:58"},{"TempC":43.2,"DateAndTime":"2025-09-09 12:30:04"},{"TempC":43.019999999999996,"DateAndTime":"2025-09-09 12:30:07"},{"TempC":43.2,"DateAndTime":"2025-09-09 12:30:10"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 12:30:23"},{"TempC":43.56,"DateAndTime":"2025-09-09 12:30:51"},{"TempC":42.66,"DateAndTime":"2025-09-09 12:35:00"},{"TempC":42.84,"DateAndTime":"2025-09-09 12:35:19"},{"TempC":42.66,"DateAndTime":"2025-09-09 12:35:22"},{"TempC":42.84,"DateAndTime":"2025-09-09 12:35:35"},{"TempC":42.66,"DateAndTime":"2025-09-09 12:35:38"},{"TempC":43.2,"DateAndTime":"2025-09-09 12:40:00"},{"TempC":43.019999999999996,"DateAndTime":"2025-09-09 12:40:04"},{"TempC":43.2,"DateAndTime":"2025-09-09 12:40:06"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 12:40:22"},{"TempC":43.56,"DateAndTime":"2025-09-09 12:40:51"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 12:45:00"},{"TempC":45.36,"DateAndTime":"2025-09-09 12:45:03"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 12:45:06"},{"TempC":45.36,"DateAndTime":"2025-09-09 12:45:09"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 12:45:13"},{"TempC":45.36,"DateAndTime":"2025-09-09 12:45:25"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 12:45:28"},{"TempC":45.36,"DateAndTime":"2025-09-09 12:45:32"},{"TempC":43.92,"DateAndTime":"2025-09-09 12:50:00"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 12:50:44"},{"TempC":43.92,"DateAndTime":"2025-09-09 12:50:47"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 12:50:53"},{"TempC":43.92,"DateAndTime":"2025-09-09 12:55:06"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 12:55:09"},{"TempC":43.92,"DateAndTime":"2025-09-09 12:55:12"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 12:55:31"},{"TempC":43.92,"DateAndTime":"2025-09-09 12:55:34"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 12:55:38"},{"TempC":44.28,"DateAndTime":"2025-09-09 12:55:47"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 12:55:50"},{"TempC":44.28,"DateAndTime":"2025-09-09 12:55:53"},{"TempC":45.900000000000006,"DateAndTime":"2025-09-09 13:00:09"},{"TempC":45.72,"DateAndTime":"2025-09-09 13:00:12"},{"TempC":45.900000000000006,"DateAndTime":"2025-09-09 13:00:15"},{"TempC":45.72,"DateAndTime":"2025-09-09 13:00:25"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 13:00:59"},{"TempC":44.28,"DateAndTime":"2025-09-09 13:05:06"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:05:09"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:05:21"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 13:05:40"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:05:43"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 13:05:47"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:05:50"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 13:05:53"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:10:02"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:10:05"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:10:09"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:10:28"},{"TempC":44.28,"DateAndTime":"2025-09-09 13:10:50"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:10:53"},{"TempC":44.28,"DateAndTime":"2025-09-09 13:10:56"},{"TempC":45.72,"DateAndTime":"2025-09-09 13:15:05"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 13:15:31"},{"TempC":45.36,"DateAndTime":"2025-09-09 13:15:50"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 13:15:56"},{"TempC":45.36,"DateAndTime":"2025-09-09 13:15:59"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 13:20:24"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:20:30"},{"TempC":43.739999999999995,"DateAndTime":"2025-09-09 13:20:34"},{"TempC":43.56,"DateAndTime":"2025-09-09 13:20:49"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:25:24"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:25:49"},{"TempC":46.08,"DateAndTime":"2025-09-09 13:30:11"},{"TempC":45.900000000000006,"DateAndTime":"2025-09-09 13:30:18"},{"TempC":45.72,"DateAndTime":"2025-09-09 13:30:27"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 13:30:43"},{"TempC":45.36,"DateAndTime":"2025-09-09 13:30:55"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 13:35:08"},{"TempC":43.56,"DateAndTime":"2025-09-09 13:35:11"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 13:35:21"},{"TempC":43.56,"DateAndTime":"2025-09-09 13:35:33"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 13:35:46"},{"TempC":43.56,"DateAndTime":"2025-09-09 13:35:49"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 13:35:52"},{"TempC":43.019999999999996,"DateAndTime":"2025-09-09 13:40:02"},{"TempC":43.2,"DateAndTime":"2025-09-09 13:40:17"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 13:40:49"},{"TempC":45.36,"DateAndTime":"2025-09-09 13:45:23"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 13:45:55"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:50:17"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:50:23"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:50:27"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:50:29"},{"TempC":44.099999999999994,"DateAndTime":"2025-09-09 13:50:33"},{"TempC":43.92,"DateAndTime":"2025-09-09 13:50:39"},{"TempC":42.66,"DateAndTime":"2025-09-09 13:55:36"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:00:04"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 14:00:23"},{"TempC":45,"DateAndTime":"2025-09-09 14:00:48"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 14:05:01"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:05:04"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:05:13"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:05:16"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:05:20"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:05:26"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:05:29"},{"TempC":44.28,"DateAndTime":"2025-09-09 14:05:39"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:05:42"},{"TempC":44.28,"DateAndTime":"2025-09-09 14:05:45"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:05:51"},{"TempC":43.019999999999996,"DateAndTime":"2025-09-09 14:10:03"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:15:13"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:15:29"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 14:15:48"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:20:13"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 14:20:25"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:20:29"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:20:38"},{"TempC":43.2,"DateAndTime":"2025-09-09 14:25:09"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 14:25:13"},{"TempC":43.2,"DateAndTime":"2025-09-09 14:25:22"},{"TempC":43.019999999999996,"DateAndTime":"2025-09-09 14:25:48"},{"TempC":43.2,"DateAndTime":"2025-09-09 14:25:50"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:30:16"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 14:30:28"},{"TempC":45,"DateAndTime":"2025-09-09 14:30:41"},{"TempC":44.64,"DateAndTime":"2025-09-09 14:35:09"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:35:56"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 14:40:00"},{"TempC":43.56,"DateAndTime":"2025-09-09 14:40:44"},{"TempC":43.379999999999995,"DateAndTime":"2025-09-09 14:40:47"},{"TempC":45.36,"DateAndTime":"2025-09-09 14:45:25"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 14:45:44"},{"TempC":44.28,"DateAndTime":"2025-09-09 14:50:24"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:50:59"},{"TempC":44.28,"DateAndTime":"2025-09-09 14:55:12"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:55:43"},{"TempC":44.28,"DateAndTime":"2025-09-09 14:55:46"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 14:55:56"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:00:24"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:00:40"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:00:43"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:00:46"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 15:05:02"},{"TempC":44.64,"DateAndTime":"2025-09-09 15:05:05"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 15:05:08"},{"TempC":44.64,"DateAndTime":"2025-09-09 15:05:14"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 15:05:30"},{"TempC":44.64,"DateAndTime":"2025-09-09 15:05:36"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 15:05:40"},{"TempC":44.28,"DateAndTime":"2025-09-09 15:05:55"},{"TempC":44.459999999999994,"DateAndTime":"2025-09-09 15:05:59"},{"TempC":45,"DateAndTime":"2025-09-09 15:10:02"},{"TempC":45.18000000000001,"DateAndTime":"2025-09-09 15:10:05"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:10:30"},{"TempC":45.18000000000001,"DateAndTime":"2025-09-09 15:10:33"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:10:36"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:10:58"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:15:06"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:15:16"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:15:25"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:15:28"},{"TempC":45,"DateAndTime":"2025-09-09 15:20:09"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:20:15"},{"TempC":45,"DateAndTime":"2025-09-09 15:20:18"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:20:24"},{"TempC":45,"DateAndTime":"2025-09-09 15:20:34"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:20:37"},{"TempC":45,"DateAndTime":"2025-09-09 15:20:40"},{"TempC":46.260000000000005,"DateAndTime":"2025-09-09 15:25:18"},{"TempC":46.44,"DateAndTime":"2025-09-09 15:25:40"},{"TempC":46.260000000000005,"DateAndTime":"2025-09-09 15:25:43"},{"TempC":46.44,"DateAndTime":"2025-09-09 15:25:46"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:30:11"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:30:18"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:30:24"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:30:30"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:30:33"},{"TempC":45.18000000000001,"DateAndTime":"2025-09-09 15:30:40"},{"TempC":45.36,"DateAndTime":"2025-09-09 15:30:43"},{"TempC":45.18000000000001,"DateAndTime":"2025-09-09 15:30:46"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:35:21"},{"TempC":44.64,"DateAndTime":"2025-09-09 15:35:24"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:35:27"},{"TempC":45,"DateAndTime":"2025-09-09 15:35:52"},{"TempC":44.81999999999999,"DateAndTime":"2025-09-09 15:35:59"},{"TempC":46.8,"DateAndTime":"2025-09-09 15:40:17"},{"TempC":46.620000000000005,"DateAndTime":"2025-09-09 15:40:24"},{"TempC":46.8,"DateAndTime":"2025-09-09 15:40:27"},{"TempC":46.620000000000005,"DateAndTime":"2025-09-09 15:40:30"},{"TempC":45.540000000000006,"DateAndTime":"2025-09-09 15:45:01"}];

// Example usage
const tempResult = extractTimeSeries(inputData, "TempC");