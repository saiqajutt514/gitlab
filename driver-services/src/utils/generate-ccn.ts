export function getEntryNumber(entryNo: number) {
  const len = 5;
  return `CITY-${String(entryNo).padStart(len, "0")}`;
}

export function setEntryNumber(entryNo: string) {
  if (entryNo.substr(0, 5) == "CITY-" || entryNo.substr(0, 5) == "city-") {
    entryNo = entryNo.substring(5);
    const origNo = +entryNo;
    return origNo;
  }
  return entryNo;
}
