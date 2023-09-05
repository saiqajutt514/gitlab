export enum TRIP_STATUS {
  ONGOING = 1,
  ASSIGNED = 2,
  STOP_AND_COMPLETED = 3
};

export enum ISSUE_STATUS {
  OPEN = 1,
  RESOLVED = 2
};

export enum EmergencyRequestListingSort {
  createdAt = "emergency.createdAt",
  fullName = "customer.firstName"
};
