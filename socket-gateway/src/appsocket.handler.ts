import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, HttpStatus } from '@nestjs/common';

import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import {
  tripKafkaMicroServiceConfig,
  tripTCPMicroServiceConfig,
  captainKafkaConfig,
  captainTCPConfig,
  adminTCPConfig,
} from 'src/microServicesConfigs';

import { Server, Socket } from 'socket.io';
import { RedisClient } from 'redis';
import { promisify } from 'util';

import appConfig from 'config/appConfig';

import { chatMicroServiceConfig } from 'src/microServicesConfigs';
import {
  REASON_TYPE,
  MESSAGE_STATUS,
  MESSAGE_KIND,
  TYPING_STATUS,
} from 'src/constants/constans';
import {
  CreateMessageDto,
  DeliveryStatusDto,
  ReadStatusDto,
  BlockUnblockDto,
} from './dto/chat.dto';

import { v4 as uuidv4 } from 'uuid';

import {
  adminKafkaPatterns,
  captainKafkaPatterns,
  tripKafkaPatterns,
  chatKafkaPatterns,
  UPDATE_CAPTAIN_LOCATION,
  UPDATE_RIDER_LOCATION,
  GET_DECLINE_REASONS,
  FIND_NEAREST_DRIVERS,
  TRIP_DETAIL,
  BLOCK_CHAT_USER,
  UNBLOCK_CHAT_USER,
  CREATE_CHAT_MESSAGE,
  DELETE_CHAT_MESSAGE,
  MARK_MESSAGES,
  UPDATE_MESSAGE_DELIVERY_STATUS,
  UPDATE_MESSAGE_READ_STATUS,
  GET_CHAT_CONVERSATION_DETAIL,
  CREATE_CHAT_CONVERSATION,
  UPDATE_CHAT_USER_LAST_SEEN,
  MUTE_UNMUTE_CONVERSATION,
  GET_TRIP_ESTIMATED_COST_SOCKET,
  UPSERT_APP_USAGE,
  DRIVER_ONLINE_STATUS,
} from 'src/constants/kafka-list';

import {
  SC_SUBSCRIBE_USER,
  SC_UNSUBSCRIBE_USER,
  SC_UPDATE_CAPTAIN_LOCATION,
  SC_UPDATE_CUSTOMER_LOCATION,
  SC_DRIVER_LOCATION_UPDATES,
  SC_RIDER_LOCATION_UPDATES,
  SC_NOTIFY_TRIP_DETAIL,
  SC_DECLINE_REASONS,
  SC_FIND_DRIVERS,
  SC_TRIP_DETAIL,
  SC_SEND_CHAT_MESSAGE,
  SC_RECEIVE_CHAT_MESSAGE,
  SC_CHAT_MESSAGE_DELIVERED,
  SC_CHAT_MESSAGE_READ,
  SC_BLOCK_CHAT_USER,
  SC_UNBLOCK_CHAT_USER,
  SC_CHAT_MESSAGE_READ_ALL,
  SC_CHAT_MESSAGE_DELETE,
  SC_TYPING_EVENT,
  SC_SEND_CHAT_MESSAGE_ACK,
  SC_CONVERSATION_GET,
  SC_UPDATE_CHAT_USER_LAST_SEEN,
  SC_GET_CHAT_USER_LAST_SEEN,
  SC_MUTE_UNMUTE_CONVERSATION,
  SC_UPDATE_ADMIN_DASHBOARD_STATS,
  SC_ADMIN_DASHBOARD_STATS,
  SOCKET_CONN_HEARTBEAT,
  SC_ESTIMATE_TRIP_DETAILS_UPDATES,
} from 'src/constants/socket-list';
import {
  FindDriversReqMessage,
  TripDetailReqMessage,
  UserReqMessage,
  UpdateCaptainLocationReqMessage,
  UpdateRiderLocationReqMessage,
  TripLocationParams,
  ChatSendMsg,
  ChatMsgDelivered,
  ChatMsgRead,
  ChatDeleteMsg,
  ChatGetConv,
  ChatBlockUser,
  ChatUnblockUser,
  ChatTyping,
} from './modules/messages/messages.interface';
import { getTimestamp } from './util/get-timestamp';

@WebSocketGateway(Number(appConfig().socketPort))
export class AppsocketHandler implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // @Client(adminKafkaConfig)
  // clientAdminKafka: ClientKafka;

  @Client(adminTCPConfig)
  clientAdminTCP: ClientProxy;

  @Client(tripKafkaMicroServiceConfig)
  tripKafkaClient: ClientKafka;

  @Client(tripTCPMicroServiceConfig)
  tripTcpClient: ClientProxy;

  @Client(captainKafkaConfig)
  clientCaptainKafka: ClientKafka;

  @Client(captainTCPConfig)
  clientCaptainService: ClientProxy;

  @Client(chatMicroServiceConfig)
  clientChatService: ClientKafka;

  redisClient: RedisClient;
  getRedisKey: Function;
  scanRedisKey: Function;

  async afterInit(server: Server) {
    Logger.log(
      'socket started with redis::' +
        appConfig().RedisHost +
        ':' +
        appConfig().RedisPort,
    );
    this.redisClient = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });

    this.getRedisKey = promisify(this.redisClient.get).bind(this.redisClient);
    this.scanRedisKey = promisify(this.redisClient.scan).bind(this.redisClient);
  }

  handleConnection(client: Socket) {
    Logger.log(`client connected::${client.id}`);

    chatKafkaPatterns.forEach((singlePattern) => {
      this.clientChatService.subscribeToResponseOf(singlePattern);
    });

    client.conn.on(SOCKET_CONN_HEARTBEAT, async () => {
      const socketClientId = client.id;
      const socketUserId = await this.getUserFromSocket(socketClientId);

      if (socketUserId) {
        this.updateOnlineStatus(Number(socketUserId), true);
      }
    });

    // adminKafkaPatterns.forEach((singlePattern) => {
    //   this.clientAdminKafka.subscribeToResponseOf(singlePattern);
    // });
    // tripKafkaPatterns.forEach((singlePattern) => {
    //   this.tripKafkaClient.subscribeToResponseOf(singlePattern);
    // });
    // captainKafkaPatterns.forEach((singlePattern) => {
    //   this.clientCaptainService.subscribeToResponseOf(singlePattern);
    // });
  }

  async handleDisconnect(client: any) {
    const socketClientId = client.id;
    const socketUserId = await this.getUserFromSocket(socketClientId);
    let delKeys = [`socket-client-${socketClientId}`];
    if (socketUserId) {
      this.updateOnlineStatus(Number(socketUserId), false);
      delKeys.push(`socket-user-${socketUserId}`);
      const createAppUsage = {
        userId: socketUserId,
        clientId: client.id,
        status: 0,
      };
      this.tripKafkaClient.emit(UPSERT_APP_USAGE, createAppUsage);
      this.clientCaptainKafka.emit(DRIVER_ONLINE_STATUS, createAppUsage);
    }
    this.redisClient.del(delKeys, function (err) {
      Logger.debug(
        'handleDisconnect::redis-del::' +
          JSON.stringify(delKeys) +
          '::' +
          JSON.stringify(err),
      );
    });
    Logger.error(`client disconnected::${socketClientId}(${socketUserId})`);
  }

  async getUserFromSocket(socketId: string) {
    let inputId = `socket-client-${socketId}`;
    return await this.getRedisKey(inputId);
  }

  async getSocketFromUser(userId: string) {
    let inputId = `socket-user-${userId}`;
    return await this.getRedisKey(inputId);
  }

  async getDriverUserID(driverId: string) {
    let driverClientKey, driverClientVal;
    if (driverId) {
      driverClientKey = `driverClient-${driverId}`;
      driverClientVal = await this.getRedisKey(driverClientKey);
    }
    Logger.debug(`driverExternalId::${driverClientVal}(${driverId})`);
    return driverClientVal;
  }

  async publishToClient(userId: string, channel: string, data: any) {
    if (userId) {
      const clientId = await this.getSocketFromUser(userId);

      Logger.log(`[publishToClient] userId: ${userId} | clientId: ${clientId}`);

      if (clientId && clientId != '') {
        this.server.sockets.to(clientId).emit(channel, data);
        Logger.log(
          `[publishToClient] sent message to ${userId}(${clientId}) on channel:${channel}`,
        );
        return true;
      } else {
        Logger.error(
          `[publishToClient] User not subscribed | socket not found ${userId}(${clientId})`,
        );
        return false;
      }
    } else {
      Logger.error(`[publishToClient] userId shouldn't be empty ${userId}`);
      return false;
    }
  }

  async getMatchedClients(pattern: string) {
    const scanList = [];
    let cursor = '0';
    do {
      const reply = await this.scanRedisKey(cursor, 'MATCH', pattern);
      cursor = reply[0];
      scanList.push(...reply[1]);
    } while (cursor !== '0');
    return scanList;
  }

  updateTripLocation(tripId: string, locInfo?: TripLocationParams) {
    const locKey = locInfo.riderId
      ? `tripLoc-${tripId}-rider`
      : `tripLoc-${tripId}-driver`;
    // const locKey = `tripLoc-${tripId}`
    this.redisClient.rpush(
      locKey,
      JSON.stringify({
        latitude: locInfo.latitude,
        longitude: locInfo.longitude,
      }),
      function (err) {
        Logger.debug(
          'updateTripLocation::' + locKey + ' error > ' + JSON.stringify(err),
        );
      },
    );
  }

  @SubscribeMessage(SC_SUBSCRIBE_USER)
  async handleSubscribeUser(client: Socket, message: UserReqMessage) {
    try {
      if (message.userID) {
        this.updateOnlineStatus(Number(message.userID), true);
        Logger.log(`subscribe::${message.userID}`);
        const existClientId = await this.getSocketFromUser(message.userID);
        if (existClientId && existClientId != client.id) {
          this.redisClient.del(
            [`socket-client-${existClientId}`],
            function (err) {
              Logger.debug(
                SC_SUBSCRIBE_USER +
                  '::redis-del::previous-client::' +
                  existClientId +
                  ' > ' +
                  JSON.stringify(err),
              );
            },
          );
        }
        if (!existClientId) {
          const createAppUsage = {
            userId: message.userID,
            clientId: client.id,
            status: 1,
          };
          this.tripKafkaClient.emit(UPSERT_APP_USAGE, createAppUsage);
          
          this.clientCaptainKafka.emit(DRIVER_ONLINE_STATUS, createAppUsage);
        }
        const setViceData = [
          `socket-user-${message.userID}`,
          client.id,
          `socket-client-${client.id}`,
          message.userID,
        ];
        this.redisClient.mset(setViceData, function () {});
        client.emit('user-general', {
          message: 'Connected',
          data: {
            userID: message.userID,
          },
        });
        Logger.log(`sent subscribe ack::${message.userID}`);
      }
    } catch (err) {
      Logger.error(SC_SUBSCRIBE_USER + '::' + JSON.stringify(err));
    }
  }

  @SubscribeMessage(SC_UNSUBSCRIBE_USER)
  async handleUnsubscribeUser(client: Socket) {
    try {
      const socketClientId = client.id;
      const socketUserId = await this.getUserFromSocket(socketClientId);
      Logger.log(`unsubscribe::${socketUserId}`);
      this.redisClient.del(
        [`socket-user-${socketUserId}`, `socket-client-${socketClientId}`],
        function (err) {
          Logger.debug(
            SC_UNSUBSCRIBE_USER +
              '::redis-del::' +
              socketUserId +
              '::' +
              JSON.stringify(err),
          );
          Logger.debug(
            SC_UNSUBSCRIBE_USER +
              '::redis-del::' +
              socketClientId +
              '::' +
              JSON.stringify(err),
          );
        },
      );
      client.emit('user-general', {
        message: 'Unsubscribed',
        data: {
          userID: socketUserId,
        },
      });
      Logger.log(`sent unsubscribe ack::${socketUserId}`);
    } catch (err) {
      Logger.error(SC_UNSUBSCRIBE_USER + '::' + JSON.stringify(err));
    }
  }

  // Trip
  @SubscribeMessage(SC_UPDATE_CAPTAIN_LOCATION)
  async handleCaptainUpdateState(
    client: Socket,
    message: UpdateCaptainLocationReqMessage,
  ) {
    try {
      Logger.log(
        SC_UPDATE_CAPTAIN_LOCATION + '::input::' + JSON.stringify(message.data),
      );
      if (message.data?.driverId) {
        // Save in Redis
        const locKey = `location-${message.data.driverId}-driver`;
        let existLoc = await this.getRedisKey(locKey);
        if (existLoc) {
          existLoc = JSON.parse(existLoc);
        }
        const locInfo = {
          driverId: message.data.driverId,
          lat: message.data.latitude,
          lon: message.data.longitude,
        };
        this.redisClient.set(locKey, JSON.stringify(locInfo), function (err) {
          Logger.debug(
            SC_UPDATE_CAPTAIN_LOCATION +
              '::redis-set::' +
              locKey +
              '::error > ' +
              JSON.stringify(err),
          );
        });

        // Emit to Riders
        const tripKey = `*-trip-${message.data.driverId}`;
        const scanList = await this.getMatchedClients(tripKey);
        if (scanList.length > 0) {
          let scanRecord, scanObject;

          const locDataUpdate = message.data;
            locDataUpdate['isExternalId'] = true;
            this.clientCaptainKafka.emit(
              UPDATE_CAPTAIN_LOCATION,
              JSON.stringify(locDataUpdate),
            );
          Logger.debug(
            SC_UPDATE_CAPTAIN_LOCATION +
              '::kafka::sent-to-db:::new:' +
              locDataUpdate.driverId,
          );
          scanList.forEach(async (dataKey) => {
            scanRecord = await this.getRedisKey(dataKey);
            scanObject = JSON.parse(scanRecord);
            if (scanObject.riderId) {
              Logger.log(
                SC_UPDATE_CAPTAIN_LOCATION +
                  '::scanObject::' +
                  JSON.stringify(scanObject),
              );

              // get estimates value for trip
              const tripResponse = await this.tripTcpClient
                .send(
                  GET_TRIP_ESTIMATED_COST_SOCKET,
                  JSON.stringify({ scanObject }),
                )
                .pipe()
                .toPromise();

              this.publishToClient(
                message.data.driverId,
                SC_ESTIMATE_TRIP_DETAILS_UPDATES,
                tripResponse,
              );
              this.publishToClient(
                scanObject.riderId,
                SC_ESTIMATE_TRIP_DETAILS_UPDATES,
                tripResponse,
              );

              Logger.debug(
                SC_UPDATE_CAPTAIN_LOCATION + '::estimate-trip-response::',
                JSON.stringify(tripResponse),
              );

              this.updateTripLocation(scanObject.tripId, message.data);
              this.publishToClient(
                scanObject.riderId,
                SC_DRIVER_LOCATION_UPDATES,
                locInfo,
              );

              Logger.debug(
                SC_UPDATE_CAPTAIN_LOCATION +
                  '::sent-to-rider::' +
                  scanObject.riderId,
              );
            }
          });
        } else {
          if (
            existLoc?.driverId &&
            existLoc?.lat == locInfo.lat &&
            existLoc?.lon == locInfo.lon
          ) {
            Logger.error(
              SC_UPDATE_CAPTAIN_LOCATION +
                '::Last location was also same as input',
            );
          } else {
            // save location in Database
            const locDataUpdate = message.data;
            locDataUpdate['isExternalId'] = true;
            this.clientCaptainKafka.emit(
              UPDATE_CAPTAIN_LOCATION,
              JSON.stringify(locDataUpdate),
            );
            Logger.debug(
              SC_UPDATE_CAPTAIN_LOCATION +
                '::kafka::sent-to-db::' +
                locDataUpdate.driverId,
            );
          }
        }
      } else {
        Logger.error(SC_UPDATE_CAPTAIN_LOCATION + '::Invalid input');
      }
    } catch (err) {
      Logger.error(SC_UPDATE_CAPTAIN_LOCATION + '::' + JSON.stringify(err));
    }
  }

  @SubscribeMessage(SC_UPDATE_CUSTOMER_LOCATION)
  async handleCustomerUpdateState(
    client: Socket,
    message: UpdateRiderLocationReqMessage,
  ) {
    try {
      Logger.log(
        SC_UPDATE_CUSTOMER_LOCATION +
          '::input::' +
          JSON.stringify(message.data),
      );
      if (message.data?.riderId) {
        // Save in Redis
        const locKey = `location-${message.data.riderId}-rider`;
        let existLoc = await this.getRedisKey(locKey);
        if (existLoc) {
          existLoc = JSON.parse(existLoc);
        }
        const locInfo = {
          riderId: message.data.riderId,
          lat: message.data.latitude,
          lon: message.data.longitude,
        };
        this.redisClient.set(locKey, JSON.stringify(locInfo), function (err) {
          Logger.debug(
            SC_UPDATE_CUSTOMER_LOCATION +
              '::redis-set::' +
              locKey +
              '::error > ' +
              JSON.stringify(err),
          );
        });

        // Emit to Drivers
        const tripKey = `${message.data.riderId}-trip-*`;
        const scanList = await this.getMatchedClients(tripKey);
        if (scanList.length > 0) {
          let scanRecord, scanObject;
          scanList.forEach(async (dataKey) => {
            scanRecord = await this.getRedisKey(dataKey);
            scanObject = JSON.parse(scanRecord);
            if (scanObject.driverId) {
              this.updateTripLocation(scanObject.tripId, message.data);
              this.publishToClient(
                scanObject.driverId,
                SC_RIDER_LOCATION_UPDATES,
                locInfo,
              );
              Logger.debug(
                SC_UPDATE_CUSTOMER_LOCATION +
                  '::sent-to-driver::' +
                  scanObject.driverId,
              );
            }
          });
        } else {
          if (
            existLoc?.riderId &&
            existLoc?.lat == locInfo.lat &&
            existLoc?.lon == locInfo.lon
          ) {
            Logger.error(
              SC_UPDATE_CUSTOMER_LOCATION +
                '::Last location was also same as input',
            );
          } else {
            // save location in Database
            this.tripKafkaClient.emit(UPDATE_RIDER_LOCATION, message.data);
            Logger.debug(
              SC_UPDATE_CUSTOMER_LOCATION +
                '::sent-to-db::' +
                message.data.riderId,
            );
          }
        }
      } else {
        Logger.error(SC_UPDATE_CUSTOMER_LOCATION + '::Invalid input');
      }
    } catch (err) {
      Logger.error(SC_UPDATE_CUSTOMER_LOCATION + '::' + JSON.stringify(err));
    }
  }

  @SubscribeMessage(SC_DECLINE_REASONS)
  async handleDelineReason(client: Socket, message: UserReqMessage) {
    Logger.log(SC_DECLINE_REASONS + '::input::' + JSON.stringify(message));
    try {
      const type = REASON_TYPE.DRIVER_REJECT;
      const reasons = await this.clientAdminTCP
        .send(GET_DECLINE_REASONS, JSON.stringify({ type }))
        .pipe()
        .toPromise();
      const result = {
        data: reasons[0] ?? [],
      };
      let sockUserId =
        message.userID || (await this.getUserFromSocket(client.id));
      if (sockUserId) {
        Logger.log(
          SC_DECLINE_REASONS + '::send-response::' + result?.data?.length,
        );
        this.publishToClient(sockUserId, SC_DECLINE_REASONS, result);
      } else {
        Logger.error(SC_DECLINE_REASONS + '::User not subscribed');
      }
    } catch (err) {
      Logger.error(SC_DECLINE_REASONS + '::' + JSON.stringify(err));
    }
  }

  @SubscribeMessage(SC_FIND_DRIVERS)
  async handleFindDrivers(client: Socket, message: FindDriversReqMessage) {
    Logger.log(SC_FIND_DRIVERS + '::input::' + JSON.stringify(message));
    if (message.data?.latitude && message.data?.longitude) {
      const drivers = await this.clientCaptainService
        .send(FIND_NEAREST_DRIVERS, JSON.stringify(message.data))
        .pipe()
        .toPromise();
      let receiverId =
        message.userID || (await this.getUserFromSocket(client.id));
      if (receiverId) {
        Logger.log(
          SC_FIND_DRIVERS + '::drivers found::' + drivers?.drivers?.length,
        );
        this.publishToClient(receiverId, SC_FIND_DRIVERS, drivers);
      } else {
        Logger.error(SC_FIND_DRIVERS + '::User not subscribed');
      }
    } else {
      Logger.error(SC_FIND_DRIVERS + '::Invalid input');
    }
  }

  @SubscribeMessage(SC_TRIP_DETAIL)
  async handleTripDetail(client: Socket, message: TripDetailReqMessage) {
    Logger.log(SC_TRIP_DETAIL + '::input::' + JSON.stringify(message));
    if (message.data?.tripId) {
      const tripResponse = await this.tripTcpClient
        .send(TRIP_DETAIL, JSON.stringify(message.data))
        .pipe()
        .toPromise();

      if (tripResponse.statusCode == HttpStatus.OK) {
        if (message.userID) {
          Logger.log(
            SC_TRIP_DETAIL +
              '::send-response::' +
              message.userID +
              '(' +
              client.id +
              ')',
          );
          this.publishToClient(message.userID, SC_TRIP_DETAIL, tripResponse);
        } else {
          // const driverId = await this.getDriverUserID(tripResponse.data.driverId);
          const driverId = tripResponse.data.driverId;
          const socketUserId = await this.getUserFromSocket(client.id);
          if (
            socketUserId == driverId ||
            socketUserId == tripResponse.data.riderId
          ) {
            Logger.log(
              SC_TRIP_DETAIL +
                '::send-response::' +
                socketUserId +
                '(' +
                client.id +
                ')',
            );
            this.publishToClient(socketUserId, SC_TRIP_DETAIL, tripResponse);
          } else {
            Logger.error(SC_TRIP_DETAIL + '::Unauthorized');
          }
        }
      } else {
        Logger.error(SC_TRIP_DETAIL + '::' + tripResponse.message);
      }
    } else {
      Logger.error(SC_TRIP_DETAIL + '::Invalid input');
    }
  }

  @SubscribeMessage(SC_NOTIFY_TRIP_DETAIL)
  async notifyTripDetail(client: Socket, message: any) {
    Logger.log(SC_NOTIFY_TRIP_DETAIL + '::input::' + JSON.stringify(message));
    const clientResponse = {
      action: message.type,
      data: message.data,
    };
    const extraParams = message.extraParams;
    const tripResponse = message.data;

    // Send trip details to driver
    // const driverId = await this.getDriverUserID(tripResponse.driverId);
    const driverId = tripResponse.driverId;
    if (
      message.params.driver &&
      message.params.driver.send == true &&
      driverId
    ) {
      Logger.debug(SC_NOTIFY_TRIP_DETAIL + '::to-driver::' + driverId);
      this.publishToClient(driverId, SC_TRIP_DETAIL, clientResponse);
    }

    // Send trip details to rider
    const riderId = tripResponse.riderId;
    if (message.params.rider && message.params.rider.send == true && riderId) {
      Logger.debug(SC_NOTIFY_TRIP_DETAIL + '::to-rider::' + riderId);
      this.publishToClient(riderId, SC_TRIP_DETAIL, clientResponse);
    }

    Logger.debug(
      SC_NOTIFY_TRIP_DETAIL +
        '::' +
        clientResponse.action +
        '::' +
        riderId +
        '(rider)::' +
        driverId +
        '(driver)::' +
        JSON.stringify(extraParams),
    );
    if (clientResponse.action == 'driver_accepted' && riderId && driverId) {
      // Send driver current location to rider
      const drLocKey = `location-${driverId}-driver`;
      const drLocData = await this.getRedisKey(drLocKey);
      if (drLocData) {
        Logger.debug(SC_NOTIFY_TRIP_DETAIL + '::send-driver-location-to-rider');
        this.publishToClient(
          riderId,
          SC_DRIVER_LOCATION_UPDATES,
          JSON.parse(drLocData),
        );
      }
    }

    // Save trip info in Redis
    let tripKey;
    if (riderId && driverId) {
      tripKey = `${riderId}-trip-${driverId}`;
    }
    if (message.type == 'trip_request') {
      // Send trip request to driver
      // const extraParamDriverId = await this.getDriverUserID(extraParams.driverId);
      const extraParamDriverId = extraParams.driverId;
      if (extraParams.driverId && extraParamDriverId) {
        if(Array.isArray(extraParams.driverId)){
        for (const data of extraParamDriverId){
             Logger.debug(
            SC_NOTIFY_TRIP_DETAIL + '::request-to-driver::' + data.externalId,
          );
          this.publishToClient(
            data.externalId,
            SC_TRIP_DETAIL,
            clientResponse,
          );
        }
      }else{
          Logger.debug(
            SC_NOTIFY_TRIP_DETAIL + '::request-to-driver::' + extraParamDriverId,
          );
          this.publishToClient(
            extraParamDriverId,
            SC_TRIP_DETAIL,
            clientResponse,
          );
        }
      }
    } else if (
      [
        'trip_completed',
        'rider_cancelled',
        'driver_cancelled',
        'no_drivers',
        'trip_expired',
      ].includes(message.type)
    ) {
      // save captain location in Database
      if (driverId) {
        const locKey = `location-${driverId}-driver`;
        let locDataDriver = await this.getRedisKey(locKey);
        if (locDataDriver) {
          locDataDriver = JSON.parse(locDataDriver);
          if (locDataDriver['driverId']) {
            const driverLocation = {
              driverId: locDataDriver['driverId'],
              latitude: locDataDriver['lat'],
              longitude: locDataDriver['lon'],
              isExternalId: true,
            };
            this.clientCaptainKafka.emit(
              UPDATE_CAPTAIN_LOCATION,
              JSON.stringify(driverLocation),
            );
            Logger.debug(
              SC_NOTIFY_TRIP_DETAIL +
                '::captain-location-to-db::' +
                JSON.stringify(driverLocation),
            );
          }
        }
      }

      // save rider location in Database
      if (riderId) {
        const locKeyRider = `location-${riderId}-rider`;
        let locDataRider = await this.getRedisKey(locKeyRider);
        if (locDataRider) {
          locDataRider = JSON.parse(locDataRider);
          if (locDataRider['riderId']) {
            const riderLocation = {
              riderId: locDataRider['riderId'],
              latitude: locDataRider['lat'],
              longitude: locDataRider['lon'],
            };
            this.tripKafkaClient.emit(UPDATE_RIDER_LOCATION, riderLocation);
            Logger.debug(
              SC_NOTIFY_TRIP_DETAIL +
                '::rider-location-to-db::' +
                JSON.stringify(riderLocation),
            );
          }
        }
      }

      // delete trip key from redis
      const delList = [];
      if (tripKey) {
        delList.push(tripKey);
      }
      if (tripResponse.id) {
        delList.push(`tripDriver-${tripResponse.id}`); // delete trip driver info key
        delList.push(`tripRider-${tripResponse.id}`); // delete trip rider info key
      }
      if (delList.length > 0) {
        this.redisClient.del(delList, function (err) {
          Logger.debug(
            SC_NOTIFY_TRIP_DETAIL +
              '::redis-del::' +
              JSON.stringify(delList) +
              '::error > ' +
              JSON.stringify(err),
          );
        });
      }
    } else if (tripKey) {
      const {
        tripStartedAt,
        cabId,
        tripDistance,
        baseFare,
        costPerKm,
        costPerMin,
        fareMultiplier,
        taxPercentage,
      } = tripResponse;

      // save trip key in redis
      const tripInfo = {
        driverId: driverId,
        riderId: riderId,
        tripId: tripResponse.id,
        tripStartedAt,
        cabId,
        tripDistance,
        baseFare,
        costPerKm,
        costPerMin,
        fareMultiplier,
        taxPercentage,
      };
      this.redisClient.set(tripKey, JSON.stringify(tripInfo), function (err) {
        Logger.debug(
          SC_NOTIFY_TRIP_DETAIL +
            '::redis-set::' +
            tripKey +
            '::error > ' +
            JSON.stringify(err),
        );
      });
    }
  }

  // Chat
  @SubscribeMessage(SC_SEND_CHAT_MESSAGE)
  async handleSendChatMessage(client: Socket, message: ChatSendMsg) {
    try {
      Logger.log(
        `${SC_SEND_CHAT_MESSAGE}::input::${JSON.stringify(message.data)}`,
      );

      let messsageStatus: number = MESSAGE_STATUS.SENT;

      //Handle blocked user case
      if (message?.data?.chatType === MESSAGE_KIND.PERSONAL) {
        const chatUserKey = `chat-user-${message?.data?.receiverId}`;
        let chatUserData = await this.getRedisKey(chatUserKey);
        if (chatUserData) {
          chatUserData = JSON.parse(chatUserData);
          if (chatUserData?.blockedUsers) {
            let blockedUsers = chatUserData?.blockedUsers;
            blockedUsers = chatUserData?.blockedUsers.toString().split(',');
            if (blockedUsers.includes(message.userID)) {
              messsageStatus = MESSAGE_STATUS.BLOCKED;
            }
          }
        }
      }

      let conversationId = message.data?.conversationId;
      if (
        !message.data?.conversationId &&
        message?.data?.chatType === MESSAGE_KIND.PERSONAL
      ) {
        const params = {
          senderId: Number(message.userID),
          receiverId: Number(message?.data?.receiverId),
        };
        let conversationData = await this.clientChatService
          .send(CREATE_CHAT_CONVERSATION, JSON.stringify(params))
          .pipe()
          .toPromise();
        if (conversationData.statusCode === HttpStatus.OK) {
          conversationId = conversationData?.data?._id;
        }
      }

      const localMessageId = uuidv4();
      const messageObject: CreateMessageDto = {
        messageId: localMessageId,
        timestamp: Date.now(),
        senderId: Number(message.userID),
        conversationId: conversationId,
        chatType: message?.data?.chatType,
        messageType: message?.data?.messageType,
        messageContent: message?.data?.messageContent,
        status: messsageStatus,
      };
      if (message?.data?.metadata) {
        messageObject.metadata = message?.data?.metadata;
      }

      if (messageObject?.chatType === MESSAGE_KIND.GROUP) {
        messageObject.groupId = message?.data?.groupId;
      } else {
        messageObject.receiverId = Number(message?.data?.receiverId);
      }

      this.clientChatService
        .send(CREATE_CHAT_MESSAGE, JSON.stringify(messageObject))
        .pipe()
        .toPromise();

      //Acknoledgement to sender
      if (message?.data?.mediaIdentifier) {
        messageObject['mediaIdentifier'] = message?.data?.mediaIdentifier;
      }

      let messageObjectAck: any = messageObject;
      messageObjectAck['receiver'] = { status: MESSAGE_STATUS.SENT };
      this.publishToClient(
        String(messageObject?.senderId),
        SC_SEND_CHAT_MESSAGE_ACK,
        messageObjectAck,
      );

      if (messageObject?.chatType == MESSAGE_KIND.GROUP) {
        const groupRedisKey = `group-members-${message?.data?.groupId}`;
        let groupData = await this.getRedisKey(groupRedisKey);
        if (groupData) {
          groupData = JSON.parse(groupData);
          if (groupData?.members) {
            groupData?.members.map(async (user) => {
              if (!user.isDeleted && user.userId != message.userID) {
                const sendStatus = await this.publishToClient(
                  String(user.userId),
                  SC_RECEIVE_CHAT_MESSAGE,
                  messageObject,
                );
              }
            });
          }
        }
        // TODO: Push Notification
      } else {
        if (messageObject?.status === MESSAGE_STATUS.SENT) {
          const sendStatus = await this.publishToClient(
            String(messageObject.receiverId),
            SC_RECEIVE_CHAT_MESSAGE,
            messageObject,
          );
          if (sendStatus) {
            const deliveryReport: DeliveryStatusDto = {
              receiverId: Number(messageObject.receiverId),
              status: MESSAGE_STATUS.DELIVERED,
              deliveredAt: new Date(),
            };
            this.clientChatService.emit(
              UPDATE_MESSAGE_DELIVERY_STATUS,
              JSON.stringify({
                messageId: messageObject?.messageId,
                data: deliveryReport,
              }),
            );
            this.publishToClient(
              String(messageObject?.senderId),
              SC_CHAT_MESSAGE_DELIVERED,
              {
                messageId: messageObject?.messageId,
                senderId: Number(messageObject?.senderId),
                receiverId: Number(messageObject.receiverId),
                ...deliveryReport,
              },
            );
          } else {
            // TODO: Push Notification
          }
        }
      }
    } catch (err) {
      Logger.error(`${SC_SEND_CHAT_MESSAGE}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_CHAT_MESSAGE_DELIVERED)
  async handleChatMessageDelivered(client: Socket, message: ChatMsgDelivered) {
    try {
      Logger.log(
        `${SC_CHAT_MESSAGE_DELIVERED}::input::${JSON.stringify(message.data)}`,
      );
      const deliveryReport: DeliveryStatusDto = {
        receiverId: message?.data?.receiverId,
        status: MESSAGE_STATUS.DELIVERED,
        deliveredAt: new Date(),
      };

      this.publishToClient(message?.data?.senderId, SC_CHAT_MESSAGE_DELIVERED, {
        messageId: message?.data.messageId,
        senderId: Number(message?.data?.senderId),
        receiverId: Number(message?.data?.receiverId),
        ...deliveryReport,
      });
      this.clientChatService.emit(
        UPDATE_MESSAGE_DELIVERY_STATUS,
        JSON.stringify({
          messageId: message?.data.messageId,
          data: deliveryReport,
        }),
      );
    } catch (err) {
      Logger.error(`${SC_CHAT_MESSAGE_READ}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_CHAT_MESSAGE_READ)
  async handleChatMessageRead(client: Socket, message: ChatMsgRead) {
    try {
      Logger.log(
        `${SC_CHAT_MESSAGE_READ}::input::${JSON.stringify(message.data)}`,
      );
      const readReport: ReadStatusDto = {
        receiverId: Number(message?.userID),
        status: MESSAGE_STATUS.READ,
        readAt: new Date(),
      };
      this.publishToClient(
        String(message?.data?.receiverId),
        SC_CHAT_MESSAGE_READ,
        {
          messageId: message?.data.messageId,
          receiverId: Number(message?.userID),
          ...readReport,
        },
      );
      this.clientChatService.emit(
        UPDATE_MESSAGE_READ_STATUS,
        JSON.stringify({
          messageId: message?.data.messageId,
          data: readReport,
        }),
      );
    } catch (err) {
      Logger.error(`${SC_CHAT_MESSAGE_READ}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_CHAT_MESSAGE_DELETE)
  async handleChatMessageDelete(client: Socket, message: ChatDeleteMsg) {
    try {
      Logger.log(
        `${SC_CHAT_MESSAGE_DELETE}::input::${JSON.stringify(message.data)}`,
      );
      this.clientChatService
        .send(
          DELETE_CHAT_MESSAGE,
          JSON.stringify({
            id: message?.data._id,
            senderId: message?.data.senderId,
          }),
        )
        .pipe()
        .toPromise();

      this.publishToClient(
        String(message?.data?.senderId),
        SC_CHAT_MESSAGE_DELETE,
        {
          _id: message?.data._id,
          senderId: Number(message?.data?.senderId),
        },
      );
    } catch (err) {
      Logger.error(`${SC_CHAT_MESSAGE_DELETE}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_CONVERSATION_GET)
  async handleGetConversation(client: Socket, message: ChatGetConv) {
    try {
      Logger.log(`${SC_CONVERSATION_GET}::input::${JSON.stringify(message)}`);
      let conversationData = await this.clientChatService
        .send(
          GET_CHAT_CONVERSATION_DETAIL,
          JSON.stringify({
            userId: message?.userID,
            conversationId: message?.data.conversationId,
          }),
        )
        .pipe()
        .toPromise();
      if (conversationData.statusCode === HttpStatus.OK) {
        this.publishToClient(message?.userID, SC_CONVERSATION_GET, {
          userId: Number(message?.userID),
          conversation: conversationData?.data,
        });
      }
    } catch (err) {
      Logger.error(`${SC_CONVERSATION_GET}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_BLOCK_CHAT_USER)
  async handleChatBlockUser(client: Socket, message: ChatBlockUser) {
    try {
      Logger.log(`${SC_BLOCK_CHAT_USER}::input::${JSON.stringify(message)}`);
      let data: BlockUnblockDto = {
        userId: Number(message.userID),
        blockedId: Number(message?.data?.receiverId),
      };
      this.publishToClient(message.userID, SC_BLOCK_CHAT_USER, {
        senderId: Number(message?.userID),
        receiverId: Number(message?.data?.receiverId),
        doneAt: new Date(),
      });
      this.clientChatService
        .send(BLOCK_CHAT_USER, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (err) {
      Logger.error(`${SC_BLOCK_CHAT_USER}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_UNBLOCK_CHAT_USER)
  async handleChatUnblockUser(client: Socket, message: ChatUnblockUser) {
    try {
      Logger.log(`${SC_UNBLOCK_CHAT_USER}::input::${JSON.stringify(message)}`);
      let data: BlockUnblockDto = {
        userId: Number(message.userID),
        blockedId: message?.data?.receiverId,
      };
      this.publishToClient(message.userID, SC_UNBLOCK_CHAT_USER, {
        senderId: Number(message?.userID),
        receiverId: Number(message?.data?.receiverId),
        doneAt: new Date(),
      });
      this.clientChatService
        .send(UNBLOCK_CHAT_USER, JSON.stringify(data))
        .pipe()
        .toPromise();
    } catch (err) {
      Logger.error(`${SC_UNBLOCK_CHAT_USER}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_TYPING_EVENT)
  async handleChatMessageTyping(client: Socket, message: ChatTyping) {
    try {
      Logger.log(`${SC_TYPING_EVENT}::input::${JSON.stringify(message.data)}`);
      if (message?.userID) {
        if (message?.data?.groupId) {
          // TODO: Emit to group members
        } else if (message?.data?.receiverId) {
          this.publishToClient(message?.data?.receiverId, SC_TYPING_EVENT, {
            senderId: Number(message?.userID),
            receiverId: Number(message?.data?.receiverId),
            conversationId: message?.data?.conversationId,
            action: message?.data?.action || TYPING_STATUS.STOP,
          });
          // TODO: need to send conversationId/groupId too
        }
      } else {
        Logger.error(`${SC_TYPING_EVENT}::message.userID not found`);
      }
    } catch (err) {
      Logger.error(`${SC_TYPING_EVENT}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_UPDATE_CHAT_USER_LAST_SEEN)
  async updateOnlineStaus(client: Socket, message: any) {
    try {
      Logger.log(
        `${SC_UPDATE_CHAT_USER_LAST_SEEN}::input::${JSON.stringify(
          message.data,
        )}`,
      );
      const data = {
        userId: Number(message.userID),
        onlineStatus: message?.data?.onlineStatus,
      };
      const updateStatusResponse = await this.clientChatService
        .send(UPDATE_CHAT_USER_LAST_SEEN, JSON.stringify(data))
        .pipe()
        .toPromise();
      if (updateStatusResponse?.statusCode === HttpStatus.OK) {
        if (updateStatusResponse?.data) {
          let receivers = [];
          updateStatusResponse?.data.map((conversation) => {
            if (conversation?.receivers) {
              conversation?.receivers.map((user) => {
                if (message.userID != user?.userId) {
                  receivers.push(user?.userId);
                }
              });
            }
          });

          for (let i = 0; i < receivers.length; i++) {
            this.publishToClient(
              receivers[i],
              SC_GET_CHAT_USER_LAST_SEEN,
              data,
            );
          }
        }
      }
    } catch (err) {
      Logger.error(`${SC_TYPING_EVENT}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_MUTE_UNMUTE_CONVERSATION)
  async updateConversationMuteStatus(client: Socket, message: any) {
    try {
      Logger.log(
        `${SC_MUTE_UNMUTE_CONVERSATION}::input::${JSON.stringify(
          message.data,
        )}`,
      );
      const data = {
        userId: Number(message.userID),
        conversationId: message?.data?.conversationId,
        status: message?.data?.status,
      };

      const userData = await this.clientChatService
        .send(MUTE_UNMUTE_CONVERSATION, JSON.stringify(data))
        .pipe()
        .toPromise();
      this.publishToClient(message.userID, SC_MUTE_UNMUTE_CONVERSATION, data);
    } catch (err) {
      Logger.error(`${SC_TYPING_EVENT}::${JSON.stringify(err)}`);
    }
  }

  @SubscribeMessage(SC_CHAT_MESSAGE_READ_ALL)
  async readAll(client: Socket, message: any) {
    Logger.log(
      `${SC_CHAT_MESSAGE_READ_ALL}::input::${JSON.stringify(message.data)}`,
    );
    let body: any = { conversationId: message?.data?.conversationId };
    let userId = message.userID;
    const userData = await this.clientChatService
      .send(MARK_MESSAGES, JSON.stringify({ userId, body }))
      .pipe()
      .toPromise();

    const data = {
      conversationId: message?.data?.conversationId,
      sender: Number(message.userID),
      status: 4,
    };
    message.data?.receivers.map((userId: number) => {
      this.publishToClient(String(userId), SC_CHAT_MESSAGE_READ_ALL, data);
    });
  }

  async updateOnlineStatus(userId: number, onlineStatus: boolean) {
    Logger.log(
      `${SC_UPDATE_CHAT_USER_LAST_SEEN}::input:: userId : ${userId} | onlineStatus : ${onlineStatus}`,
    );
    const data = {
      userId: Number(userId),
      onlineStatus: onlineStatus,
    };

    const updateStatusResponse = await this.clientChatService
      .send(UPDATE_CHAT_USER_LAST_SEEN, JSON.stringify(data))
      .pipe()
      .toPromise();
    if (updateStatusResponse?.statusCode === HttpStatus.OK) {
      if (updateStatusResponse?.data) {
        let receivers = [];
        updateStatusResponse?.data.map((conversation) => {
          if (conversation?.receivers) {
            conversation?.receivers.map((user) => {
              if (userId != user?.userId) {
                receivers.push(user?.userId);
              }
            });
          }
        });
        for (let i = 0; i < receivers.length; i++) {
          this.publishToClient(receivers[i], SC_GET_CHAT_USER_LAST_SEEN, data);
        }
      }
    }
  }

  @SubscribeMessage(SC_UPDATE_ADMIN_DASHBOARD_STATS)
  async updateAdminDashboardStatsHandler(client: Socket, message: any) {
    try {
      Logger.log(
        SC_UPDATE_ADMIN_DASHBOARD_STATS + '::input::' + JSON.stringify(message),
      );
      this.server.emit(SC_ADMIN_DASHBOARD_STATS, message);
    } catch (e) {
      Logger.error(`${SC_UPDATE_ADMIN_DASHBOARD_STATS}::${JSON.stringify(e)}`);
    }
  }
}
