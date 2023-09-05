export const toTimestamp = (inputDate: string) => {
  const datum = Date.parse(inputDate);
  return datum/1000;
}