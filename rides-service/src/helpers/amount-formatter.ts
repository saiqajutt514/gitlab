export const getDecimalResult = (amount, precision): number => {
  const finalAmount = Number(Number(amount).toFixed(precision) || 0)
  return finalAmount;
}

export const getAmountFormatted = (amount): number => {
  // VERIFY_TODO: 0-0.5 will be rounded to 0.5, 0.5-P will be rounded to P
  const resValue = getDecimalResult(amount, 2) || 0
  return resValue
}

export const getPercentageFormatted = (amount): number => {
  const resValue = getDecimalResult(amount, 2) || 0
  return resValue
}