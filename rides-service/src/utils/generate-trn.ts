export function getTripNumber(tripNo: number) {
  const len = 7;
  return `TR-${String(tripNo).padStart(len, '0')}`;
}

export function getTripInvoiceNumber(tripNo: number) {
  const len = 7;
  return `RIDE-TR-${String(tripNo).padStart(len, '0')}`;
}

export function setTripNumber(tripNo: string) {
  if (tripNo.substr(0, 3) == 'TR-' || tripNo.substr(0, 3) == 'tr-') {
    tripNo = tripNo.substring(3);
    const origNo = +tripNo;
    return origNo;
  }
  return tripNo;
}
