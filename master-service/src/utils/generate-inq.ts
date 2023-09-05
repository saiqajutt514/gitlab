export function getINQFormat(inqNo: number) {
  const len = 7;
  return `INQ-${String(inqNo).padStart(len, '0')}`;
}

export function setINQFormat(inqNo: string) {
  if(inqNo.substr(0, 4) == "INQ-" || inqNo.substr(0, 4) == "inq-") {
    inqNo = inqNo.substring(4);
    const origNo = +inqNo;
    return origNo;
  }
  return inqNo;
}

