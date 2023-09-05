export const getDecimalResult = (amount = 0, precision = 2): number => {
  const finalAmount = Number(Number(amount).toFixed(precision) || 0)
  return finalAmount;
}

export const getAmountFormatted = (amount = 0): number => {
  const resValue = getDecimalResult(amount, 2) || 0
  return resValue
}

export const getPercentageFormatted = (amount = 0): number => {
  const resValue = getDecimalResult(amount, 2) || 0
  return resValue
}