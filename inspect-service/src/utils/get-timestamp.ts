export function getTimestamp(seconds = 0): string {
  const date = new Date();
  if (seconds) {
    date.setSeconds(date.getSeconds() + seconds);
  }
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export function getIsoDateTime(newDate: Date) {
  return newDate.toISOString().replace("T", " ").slice(0, 19);
}

export function getIsoDate(newDate: Date) {
  return newDate.toISOString().slice(0, 10);
}

export function addMonths(newDate: Date, value: number) {
  const date = new Date(newDate);
  date.setMonth(date.getMonth() + value);
  return date;
}

export function addDays(newDate: Date, value: number) {
  var nextDay = new Date(newDate);
  nextDay.setDate(newDate.getDate() + value);
  return nextDay;
}

export function getDays(date1: Date, date2: Date) {
  var second = date1.getTime();
  var first = date2.getTime();
  const diff = Math.ceil((second-first)/(1000*60*60*24));
  return (diff > 0) ? diff : 0;
}

