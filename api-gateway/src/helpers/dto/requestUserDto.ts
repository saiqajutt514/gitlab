import { IsNumber, IsOptional, Min } from "class-validator";

export class RequestUserDto {
    id: string
    firstName: string
    lastName: string
    mobileNo: string
    emailId: string
    dateOfBirth: string
    DobHijri: string
    profileImage?: string
    _timestamp: number
    driverId?: string
}