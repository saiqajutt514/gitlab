import { AddressType, Client as GoogleClient, Language, TravelMode } from "@googlemaps/google-maps-services-js";
import { HttpStatus } from "@nestjs/common";

import appConfig from "config/appConfig";
import { errorMessage } from "src/constants/errorMessage";
import { DistanceResponseInterface, GoogleCalculatedResponse, LocationInterface } from "src/modules/trips/interface/trips.interface";
import { LoggerHandler } from "./logger.handler";

import { formatTimeSpan } from '../utils/format-timestamp';

const logger = new LoggerHandler('googleDistanceCalculation').getInstance();

export const 
calculateFareDistance = async (origin: LocationInterface, destination: LocationInterface) => {
  try {
    const client = new GoogleClient({});
    logger.log(`[calculateFareDistance] origin: ${JSON.stringify(origin)} | destination: ${JSON.stringify(destination)}`)
    logger.debug(`[calculateFareDistance] googleKey: ${appConfig().googleKey}`)
    
    const response = await client.distancematrix({
      params: {
        origins: [{ lat: origin.latitude, lng: origin.longitude }],
        destinations: [{ lat: destination.latitude, lng: destination.longitude }],
        key: appConfig().googleKey, // need this to get it work
      },
    })
    
    if (response && response.status === HttpStatus.OK) {
      logger.log(`[calculateFareDistance] Response Success: res: ${JSON.stringify(response.data)}`)
      const calculatedRes = calculateDistanceTimeFromGoogleResponse(response.data)
      return calculatedRes
    } else {
      logger.error(`[calculateFareDistance] Response Error`)
      throw new Error(errorMessage.SOMETHING_WENT_WRONG)
    }
  } catch (error) {
    logger.error(`[calculateFareDistance] Error in catch -> ${error.message}`);
    throw new Error(error?.message || errorMessage.SOMETHING_WENT_WRONG)
  }
}

const calculateDistanceTimeFromGoogleResponse = (payload: DistanceResponseInterface): GoogleCalculatedResponse => {
  try {
    logger.log(`[calculateDistanceTimeFromGoogleResponse] payload: ${JSON.stringify(payload)}`)
    
    const [row] = payload.rows
    
    if (row.elements[0]?.status === "NOT_FOUND") {
      logger.error(`[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.NOT_FOUND}`)
      throw new Error(errorMessage.DISTANCE_MATRIX.NOT_FOUND)
    }
    else if (row.elements[0]?.status === "ZERO_RESULTS") {
      logger.error(`[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.ZERO_RESULTS}`)
      throw new Error(errorMessage.DISTANCE_MATRIX.ZERO_RESULTS)
    }
    else if (row.elements[0]?.status === "MAX_ROUTE_LENGTH_EXCEEDED") {
      logger.error(`[calculateFareDistance] Response Error: ${errorMessage.DISTANCE_MATRIX.MAX_ROUTE_LENGTH_EXCEEDED}`)
      throw new Error(errorMessage.DISTANCE_MATRIX.MAX_ROUTE_LENGTH_EXCEEDED)
    }
    else if (row.elements[0]?.status !== "OK") {
      logger.error(`[calculateFareDistance] Response Error: ${errorMessage.SOMETHING_WENT_WRONG}`)
      throw new Error(errorMessage.SOMETHING_WENT_WRONG)
    }
    
    const distanceTravelled = row.elements[0].distance.value / 1000
    const estimatedTime = formatTimeSpan(row.elements[0].duration.value)
    
    logger.log(`[calculateDistanceTimeFromGoogleResponse] distance: ${distanceTravelled} | time: ${estimatedTime}`)
    
    return {
      distance: +distanceTravelled.toFixed(2),
      time: estimatedTime,
      formattedDistance: row.elements[0].distance.text,
      formattedTime: row.elements[0].duration.text,
    }
    
  } catch (error) {
    throw new Error(error?.message || errorMessage.SOMETHING_WENT_WRONG)
  }
}

export const fetchLocationDetail = async (address: LocationInterface) => {
  let result = {
    country: '',
    city: ''
  };
  try {
    const client = new GoogleClient({});
    logger.log(`[fetchLocationDetail] input address: ${JSON.stringify(address)}`)
    logger.debug(`[fetchLocationDetail] googleKey: ${appConfig().googleKey}`)
    
    if (address?.latitude && address?.longitude) {
      const response = await client.reverseGeocode({
        params: {
          latlng: address,
          language: Language.en,
          result_type: [AddressType.country, AddressType.locality],
          key: appConfig().googleKey,
        }
      })
      
      if (response && response.status === HttpStatus.OK) {
        logger.log(`[fetchLocationDetail] Response Success: res: ${JSON.stringify(response.data)}`)
        if (response.data.results[0]?.address_components) {
          const address_components = response.data.results[0]?.address_components
          const countryComponent = address_components.find(row => row.types.includes(AddressType.country))
          const cityComponent = address_components.find(row => row.types.includes(AddressType.locality))
          result.country = countryComponent?.long_name
          result.city = cityComponent?.long_name
          logger.log(`[fetchLocationDetail] data : ${JSON.stringify(result)}`)
        }
        return result
      } else {
        logger.error(`[fetchLocationDetail] Response Error`)
        throw new Error('Response Error');
      }
    } else {
      logger.error(`[fetchLocationDetail] Input data Error`)
      throw new Error('Input data Error');
    }
  } catch (error) {
    logger.error(`[fetchLocationDetail] Error in catch -> ${error.message}`);
    return result
  }
}

export const getDirectionBasedDistance = async (origin: LocationInterface, destination: LocationInterface, waypoints?: LocationInterface[]) => {
  let result = { 
    distance: 0, 
    time: 0 
  }
  try {
    const client = new GoogleClient({});
    logger.log(`[getDirectionBasedDistance] origin: ${JSON.stringify(origin)} | destination: ${JSON.stringify(destination)}`)
    logger.debug(`[getDirectionBasedDistance] googleKey: ${appConfig().googleKey}`)
    
    const response = await client.directions({
      params: {
        origin,
        destination,
        mode: TravelMode.driving,
        waypoints: waypoints || [],
        key: appConfig().googleKey, // need this to get it work
      },
    })
    
    if (response && response.status === HttpStatus.OK) {
      logger.log(`[getDirectionBasedDistance] Response Success`)
      if (response.data?.routes && response.data?.routes[0]?.legs) {
        logger.log(JSON.stringify(response.data?.routes[0]?.legs))
        response.data?.routes[0]?.legs.forEach(leg => {
          result.distance += leg.distance?.value
          result.time += leg.duration?.value
        })
      }
      result.distance = result.distance / 1000
      result.time = formatTimeSpan(result.time)
      logger.log(`[getDirectionBasedDistance] distance: ${result.distance} | time: ${result.time}`)
      return result
    } else {
      logger.error(`[getDirectionBasedDistance] Response Error`)
      throw new Error(errorMessage.SOMETHING_WENT_WRONG)
    }
  } catch (error) {
    logger.error(`[getDirectionBasedDistance] Error in catch -> ${error.message}`);
    return result
  }
}