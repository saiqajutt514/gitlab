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

// added for inventory
export function iGetTimestamp(seconds = 0): string {
  const date = new Date();
  if (seconds) {
    date.setSeconds(date.getSeconds() + seconds);
  }
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export function iGetIsoDateTime(newDate: Date) {
  return newDate.toISOString().replace('T', ' ').slice(0, 19);
}

export function iGetIsoDate(newDate: Date) {
  return newDate.toISOString().slice(0, 10);
}

export function iAddMonths(newDate: Date, value: number) {
  const date = new Date(newDate);
  date.setMonth(date.getMonth() + value);
  return date;
}

export function iAddDays(newDate: Date, value: number) {
  var nextDay = new Date(newDate);
  nextDay.setDate(newDate.getDate() + value);
  return nextDay;
}

export function igGtDays(date1: Date, date2: Date) {
  var second = date1.getTime();
  var first = date2.getTime();
  const diff = Math.ceil((second - first) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
