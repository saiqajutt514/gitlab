import { Injectable } from '@nestjs/common';
import { AppSocketClient } from 'src/appsocket.client';

import { SC_UPDATE_ADMIN_DASHBOARD_STATS } from 'src/constants/socket-list';

require('dotenv').config();

@Injectable()
export class AppService {

  private readonly appsocketClient = new AppSocketClient();

  notifyTripDetailToSocket(params: any) {
    const data = params.data;
    let actionType = params.actionType;
    let actionParams = {};
    switch(actionType) {
      case 'trip_detail':
        actionParams = {
          driver: {
            send: true,
            msg: "Trip details"
          },
          rider: {
            send: true,
            msg: "Trip details"
          }
        }
        break;

      case 'trip_request':
        actionParams = {
          driver: {
            send: true,
            msg: "New trip request received"
          }
        }
        break;
      case 'driver_accepted':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip accepted"
          }
        }
        break;
      case 'driver_reached':
        actionParams = {
          rider: {
            send: true,
            msg: "Driver reached at pickup location"
          }
        }
        break;
      case 'trip_started':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip Started"
          },
          driver: {
            send: true,
            msg: "Trip Started"
          }
        }
        break;
      case 'rider_updated_destination':
        actionParams = {
          rider: {
            send: true,
            msg: "Destination location updated"
          },
          driver: {
            send: true,
            msg: "Destination location updated"
          }
        }
        break;
      case 'trip_completed':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip completed"
          },
          driver: {
            send: true,
            msg: "Trip completed"
          }
        }
        break;

      case 'rider_cancelled':
        actionParams = {
          driver: {
            send: true,
            msg: "Trip cancelled by rider"
          }
        }
        break;
      case 'driver_cancelled_before_arrived':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip cancelled by driver"
          }
        }
        break;
      case 'driver_cancelled':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip cancelled by driver"
          }
        }
        break;
      case 'rider_scheduled_trip_confirmation':
        actionParams = {
          rider: {
            send: true,
            msg: "You have a scheduled trip in 30 mins, do you want to continue with it or cancel it ?"
          }
        }
        break;
      case 'scheduled_trip_cancelled_as_current_trip_is_in_progress':
        actionParams = {
          rider: {
            send: true,
            msg: "Your scheduled ride is cancelled as your current trip is in progress"
          }
        }
        break;
      case 'scheduled_trip_cancelled_as_driver_mode_is_on':
        actionParams = {
          rider: {
            send: true,
            msg: "Your scheduled ride has been cancelled as your driver mode is still on"
          }
        }
        break;
      case 'error_while_processing_scheduled_trip':
        actionParams = {
          rider: {
            send: true,
            msg: "Something went wrong while processing your scheduled trip"
          }
        }
        break;
      case 'rider_schedule_trip_declined':
        actionParams = {
          admin: {
            send: true,
            msg: "Scheduled trip declined by rider"
          }
        }
        break;
      case 'no_drivers':
        actionParams = {
          rider: {
            send: true,
            msg: "No driver available"
          }
        }
        break;
      case 'trip_expired':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip Expired"
          }
        }
        break;
      case 'admin_cancelled':
        actionParams = {
          rider: {
            send: true,
            msg: "Trip Cancelled by Admin"
          },
          driver: {
            send: true,
            msg: "Trip Cancelled by Admin"
          }
        }
        break;
    }
    const actions = {
      type: actionType,
      params: actionParams,
      extraParams: params.extraParams??{}
    }
    const socketMessage = {
      data: data,
      ...actions
    };
    this.appsocketClient.sendMessage('notify-trip-detail', socketMessage);
  }

  emitToAdminDashboard(data: any) {
    this.appsocketClient.sendMessage(SC_UPDATE_ADMIN_DASHBOARD_STATS, data);
  }
}
