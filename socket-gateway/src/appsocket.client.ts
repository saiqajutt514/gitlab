import { Injectable } from "@nestjs/common";
import { io } from 'socket.io-client';
import appConfig from 'config/appConfig';

@Injectable()
export class AppSocketClient {
	private socket: any;
	constructor() {
		let socketUrl = appConfig().socketUrl;
		if (!socketUrl) {
			socketUrl = "http://localhost:" + appConfig().socketPort;
		}
		this.socket = io(socketUrl, { reconnection: true, reconnectionDelay: 10000 });
		this.setCallbacks();
	}

	setCallbacks() {
		this.socket.on('connection', function () {
			console.log('connection done')
		})
		this.socket.on('connect_error', function (err) {
			console.log('connect_error')
			console.log(err)
		})
		this.socket.on('connect_timeout', function (err) {
			console.log('connect_timeout')
			console.log(err)
		})
	}

	sendMessage(channel: string, data?: any) {
		this.socket.emit(channel, data);
	}
}