import { Client as GoogleClient } from "@googlemaps/google-maps-services-js";
import { HttpStatus } from "@nestjs/common";
import appConfig from "config/appConfig";
import { errorMessage } from "src/constants/error-message-constant";
import {
  DistanceResponseInterface,
  GoogleCalculatedResponse,
} from "src/modules/cab-type/cab-type.interface";

import { LocationInterface } from "src/modules/captain/interface/captain.interface";
import { LoggerHandler } from "./logger-handler";

const logger = new LoggerHandler("googleDistanceCalculation").getInstance();

export const calculateFareDistance = async (
  origin: LocationInterface,
  destination: LocationInterface
) => {
  try {
    const client = new GoogleClient({});
    logger.log(
      `[calculateFareDistance] origin: ${JSON.stringify(
        origin
      )} | destination: ${JSON.stringify(destination)}`
    );
    logger.debug(`[calculateFareDistance] googleKey: ${appConfig().googleKey}`);

    const response = await client.distancematrix({
      params: {
        origins: [{ lat: origin.lat, lng: origin.lng }],
        destinations: [{ lat: destination.lat, lng: destination.lng }],
        key: appConfig().googleKey, // need this to get it work
      },
    });

    if (response && response.status === HttpStatus.OK) {
      logger.log(`[calculateFareDistance] Response Success`);
      return calculateDistanceTimeFromGoogleResponse(response.data);
    } else {
      logger.error(`[calculateFareDistance] Response Error`);
      throw new Error(errorMessage.SOMETHING_WENT_WRONG);
    }
  } catch (error) {
    logger.error(`[calculateFareDistance] Error in catch -> ${error.message}`);

    throw new Error(error?.message || errorMessage.SOMETHING_WENT_WRONG);
  }
};

const calculateDistanceTimeFromGoogleResponse = (
  payload: DistanceResponseInterface
): GoogleCalculatedResponse => {
  try {
    logger.log(
      `[calculateDistanceTimeFromGoogleResponse] payload: ${JSON.stringify(
        payload
      )}`
    );

    const [row] = payload.rows;

    if (row.elements[0]?.status === "NOT_FOUND") {
      logger.error(
        `[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.NOT_FOUND}`
      );
      throw new Error(errorMessage.DISTANCE_MATRIX.NOT_FOUND);
    } else if (row.elements[0]?.status === "ZERO_RESULTS") {
      logger.error(
        `[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.ZERO_RESULTS}`
      );
      throw new Error(errorMessage.DISTANCE_MATRIX.ZERO_RESULTS);
    } else if (row.elements[0]?.status === "MAX_ROUTE_LENGTH_EXCEEDED") {
      logger.error(
        `[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.MAX_ROUTE_LENGTH_EXCEEDED}`
      );
      throw new Error(errorMessage.DISTANCE_MATRIX.MAX_ROUTE_LENGTH_EXCEEDED);
    } else if (row.elements[0]?.status !== "OK") {
      logger.error(
        `[calculateFareDistance] Response Error: ${errorMessage.SOMETHING_WENT_WRONG}`
      );
      throw new Error(errorMessage.SOMETHING_WENT_WRONG);
    }

    const distanceTravelled = row.elements[0].distance.value / 1000;
    const estimatedTime = row.elements[0].duration.value / 60;

    logger.log(
      `[calculateDistanceTimeFromGoogleResponse] distance: ${distanceTravelled} | time: ${estimatedTime}`
    );

    return {
      distance: +distanceTravelled.toFixed(2),
      time: +estimatedTime.toFixed(2),
      formattedDistance: row.elements[0].distance.text,
      formattedTime: row.elements[0].duration.text,
    };
  } catch (error) {
    throw new Error(error?.message || errorMessage.SOMETHING_WENT_WRONG);
  }
};
