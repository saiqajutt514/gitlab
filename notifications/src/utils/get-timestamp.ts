export function getTimestamp(seconds = 0): string {

  const date = new Date();

  if (seconds) {
    date.setSeconds(date.getSeconds() + seconds);
  }

  return date
    .toISOString()
    .replace("T", " ")
    .slice(0, 19)
}
