export enum TripStatus {
  PENDING = 1,
  ACCEPTED_BY_DRIVER = 2,
  REJECTED_BY_DRIVER = 3,
  CANCELLED_BY_DRIVER = 4,
  DRIVER_ARRIVED = 5,
  CANCELLED_BY_RIDER = 6,
  STARTED = 7,
  COMPLETED = 8,
  NO_DRIVER = 9,
  EXPIRED = 10,
}

export enum UserExternalType {
  Rider = 1,
  Captain = 2
}

export enum AddressType {
  PICK_UP = 1,
  DESTINATION = 2
}

export enum TripCreatedBy {
  CUSTOMER = 1,
  ADMIN = 2,
  SUB_ADMIN = 3,
  EMERGENCY_ADMIN = 4,
  DISPATCHER_ADMIN = 5,
}

export enum RoleCodes {
  ADMIN = 'admin',
  SUB_ADMIN = 'sub-admin',
  EMERGENCY_ADMIN = 'emergency-admin',
  DISPATCHER_ADMIN = 'dispatcher-admin'
}

export function getLoggedInRoleType(role: string) {
  if (role === RoleCodes.DISPATCHER_ADMIN) {
    return TripCreatedBy.DISPATCHER_ADMIN;
  } else if (role === RoleCodes.EMERGENCY_ADMIN) {
    return TripCreatedBy.EMERGENCY_ADMIN;
  } else if (role === RoleCodes.SUB_ADMIN) {
    return TripCreatedBy.SUB_ADMIN;
  } else {
    return TripCreatedBy.ADMIN;
  }
}
