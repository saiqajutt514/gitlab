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
  ACTION = 8,
  PAYMENT = 9
}

export enum MESSAGE_STATUS {
  SENT = 1,
  BLOCKED = 2,
  DELIVERED = 3,
  READ = 4
}

export enum MESSAGE_TEXT_ENGLISH {
  _2 = "\u{1F5BC}  Image",
  _3 = "\u{1F50A} Voice note",
  _4 = "\u{1F3A5} Video",
  _5 = "\u{1F4C4} Document",
  _6 = "\u{1F4DE} Contact",
  _7 = "\u{1F4CC} Location",
  _8 = "",
  _9 = "\u{1F4B0} Payment"
};

export enum MESSAGE_TEXT_ARABIC {
  _2 = "\u{1F5BC}  صورة",
  _3 = "\u{1F50A} رسالة صوتية",
  _4 = "\u{1F3A5} فيديو",
  _5 = "\u{1F4C4} ملف",
  _6 = "\u{1F4DE} اتصل",
  _7 = "\u{1F4CC} موقع",
  _8 = "",
  _9 = "\u{1F4B0} قسط"
};