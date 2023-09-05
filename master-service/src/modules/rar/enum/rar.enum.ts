export enum InventoryListSort {
  modelYear = 'rideInventory.modelYear',
  bodyColor = 'rideInventory.bodyColor',
  sequenceNo = 'rideInventory.sequenceNo',
  displacement = 'rideInventory.displacement',
  fuelType = 'rideInventory.fuelType',
  noOfCylinder = 'rideInventory.noOfCylinder',
  seatingCapacity = 'rideInventory.seatingCapacity',
  transmission = 'rideInventory.transmission',
  category = 'rideInventory.category',
  createdAt = 'rideInventory.createdAt',
  isAvaliable = 'rideInventory.isAvaliable',
  updatedAt = 'rideInventory.updatedAt',
  modelEnglish = 'model.modelEnglish',
  makerId = 'model.makerId',
  makerEnglish = 'maker.makerEnglish',
  total = 'total',
}

export enum InventoryStatusEnum {
  Active = 1,
  Inactive = 2,
  Draft = 3,
}

export enum InventoryTransmissionEnum {
  Manual = 1,
  Automatic = 2,
}
