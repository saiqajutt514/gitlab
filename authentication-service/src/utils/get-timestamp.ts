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

/**
 * This function return time in past in db format for example , time 5 min ago.
 * @param minutesAgo : minutes
 * @returns yyyy-mm-dd hh:mm:ss.mmmm
 */
export function getPastTime(minutesAgo: number) {
  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }

  function formatDate(date) {
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-') +
      ' ' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join(':') +
      '.' +
      [padTo2Digits(date.getMilliseconds())]
    );
  }

  let timestamp = new Date().getTime();
  timestamp = timestamp - minutesAgo * 60 * 1000;

  // 👇️ 01/20/2022 10:07:59 (mm/dd/yyyy hh:mm:ss)
  return formatDate(new Date(timestamp));
}
