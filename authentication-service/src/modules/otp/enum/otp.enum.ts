export enum OtpListSortEnum {
  mobileNo = 'otp.mobileNo',
  otp = 'otp.otp',
  carPlateNo = 'otp.createdAt',
}

/**
 * undelivered = 1,
 * delivered = 2,
 * unused = 3,
 * used = 4,
 * expired = 5
 */
export enum OtpStatusEnum {
  undelivered = 1, // when message is not sent by sms sender due to some issue.
  delivered = 2, // when message is delivered to user.
  unused = 3, // user tired to verified but fail due to some reason including otp not matched, prior condition is if otpStatus is not expired.
  used = 4, // update otpStatus to used if otp matched whle verifying.
  expired = 5, // if user is not verifying in require time. then update otpStatus as expired || if user verifyLimit exceed then update otpStatus as expired
}

/**
 * driverLogin = 1
 * driverSignup = 2,
 * riderLogin = 3,
 * riderSignup = 4
 */
export enum OtpReasonEnum {
  driverLogin = 1,
  driverSignup = 2,
  riderLogin = 3,
  riderSignup = 4,
}

/**
 * rider = 1,
 * captain = 2
 */
export enum UserExternalType {
  rider = 1,
  captain = 2,
}
