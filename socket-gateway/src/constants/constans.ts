export enum REASON_TYPE {
  DRIVER_REJECT = 1,
  DRIVER_CANCEL = 2,
  RIDER_CANCEL = 3,
}

export enum MESSAGE_KIND {
  PERSONAL = 1,
  GROUP = 2,
}

export enum MESSAGE_TYPE {
  TEXT = 1,
  IMAGE = 2,
  AUDIO = 3,
  VIDEO = 4,
  DOCUMENT = 5,
  CONTACT = 6,
  LOCATION = 7,
}

export enum MESSAGE_STATUS {
  SENT = 1,
  BLOCKED = 2,
  DELIVERED = 3,
  READ = 4,
}

export enum TYPING_STATUS {
  START = 'start',
  STOP = 'stop',
}
