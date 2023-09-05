import * as moment from 'moment';

export function getTimestamp(seconds = 0): string {
  const date = new Date();
  if (seconds) {
    date.setSeconds(date.getSeconds() + seconds);
  }
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export function getIsoDateTime(newDate: Date) {
  return newDate.toISOString().replace('T', ' ').slice(0, 19);
}

export const getTimeDifference = (
  date1: Date,
  date2: Date,
  type?: string,
): number => {
  const paramDate1 = new Date(date1);
  const paramDate2 = new Date(date2);

  let diffSeconds = (paramDate1.getTime() - paramDate2.getTime()) / 1000;
  let diffTime;
  switch (type) {
    case 's': //seconds
      diffTime = diffSeconds;
      break;
    case 'h': //hours
      diffTime = diffSeconds / (60 * 60);
      break;
    case 'd': //days
      diffTime = diffSeconds / (60 * 60 * 24);
      break;
    default:
      //minutes
      diffTime = diffSeconds / (60 * 1);
  }
  diffTime = Math.floor(diffTime);

  return diffTime;
};

// String format should be HH:MM ( 24 hours format )
export const getTotalMinutes = function (hoursMinutes: string): number {
  const m = moment(hoursMinutes, 'HH:mm');
  return m.minutes() + m.hours() * 60;
};

export const getCalculatedTripTime = (from: Date, to: Date): number => {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  let diffTime = toTime - fromTime;
  diffTime = diffTime / (60 * 1000); // in minutes
  diffTime = Number(diffTime.toFixed(2)); // along with seconds (based on 100%)
  return diffTime;
};
export function addDays(newDate: Date, value: number) {
  const nextDay = new Date(newDate);
  nextDay.setDate(newDate.getDate() + value);
  return nextDay;
}
export function addMonths(newDate: Date, value: number) {
  const date = new Date(newDate);
  date.setMonth(date.getMonth() + value);
  return date;
}
