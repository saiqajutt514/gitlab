import { TcpClientOptions, Transport } from "@nestjs/microservices";
import appConfig from "config/appConfig";
require("dotenv").config();

export const reviewsTCPConfig: TcpClientOptions = {
  transport: Transport.TCP,
  options: {
    host: appConfig().ReviewTCPHost,
    port: Number(appConfig().ReviewTCPPort)
  }
}