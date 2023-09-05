import appConfig from "config/appConfig";
require("dotenv").config();

export const WASLHeaders = {
  "Content-Type": "application/json",
  "client-id": appConfig().waslClientId,
  "app-id": appConfig().waslAppId,
  "app-key": appConfig().waslAppKey,
};
