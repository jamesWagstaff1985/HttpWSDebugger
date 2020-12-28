import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private stompClient: Stomp.Client = null;

  private pendingSubscriptions = [];
  private pathSocket: string = null;
  private subscriptions = [];
  private sessionId = null;

  constructor() { }

  token: string;

  public connect(pathSocket: string, token?: string): void {
    this.pathSocket = pathSocket;
    this.token = token;
    if (this.isConnected()) {
      console.log('already connected, doing nothing')
      return;
    }
    const pathSuffix = token ? '?token=' + this.getToken() : '';
    console.log('attempting to connect . . . .');

    console.log(pathSocket + pathSuffix);
    const ws = new SockJS(pathSocket + pathSuffix, null, {timeout: 15000});
    this.stompClient = Stomp.over(ws);
    this.stompClient.debug = null;

    const self = this;
    this.stompClient.connect({},
      frame => { self.executePendingSubscriptions() },
      () => setTimeout(self.reconnect.bind(self), 5 * 1000)
    );
  }

  public disconnect() {
    if(!this.isConnected) {
      return;
    }
    this.stompClient.disconnect(_ => {});
  }

  private reconnect() {
    console.log('WS has been closed, reconnecting...');
    this.stompClient.disconnect(() => { });
    this.stompClient = null;
    this.connect(this.pathSocket);

    for (const path in this.subscriptions.keys()) {
      if (this.subscriptions[path]) {
        const callback = this.subscriptions[path];
        this.subscribe(path, callback);
      }
    }
  }

  public subscribe(path: string, callback: Function): any {
    if (!this.subscriptions[path]) {
      this.subscriptions[path] = callback;
    }
    if (!this.isConnected()) {
      this.pendingSubscriptions[path] = callback;
      // throw new Error('SocketService no se ha conectado');
    } else {
      return this.stompClient.subscribe(path, message => {
        if (message.body) {
          callback(JSON.parse(message.body));
        }
      });
    }
    return this;
  }

  public unSubscribe(path: string): SocketService {
    if(this.subscriptions[path]) {
      this.stompClient.unsubscribe(path);
      console.log('un subscribing from: ' + path);
      console.log(this.subscriptions[path]);
      delete this.subscriptions[path];
      console.log(this.subscriptions[path]);
    }
    return this;
  }

  public send(destination: string, body?: any): SocketService {
    if (this.isConnected()) {
      this.stompClient.send(destination, this.creatSocketHeaders(), JSON.stringify(body));
    }
    return this;
  }

  public isConnected() {
    return this.stompClient !== null && this.stompClient.connected === true;
  }

  private executePendingSubscriptions() {
    // The frame was succesful
    for (const path in this.pendingSubscriptions) {
      if (this.pendingSubscriptions.hasOwnProperty(path)) {
        const callback = this.pendingSubscriptions[path];
        this.stompClient.subscribe(path, message => {
          if (message.body) {
            callback(JSON.parse(message.body));
          }
        });
      }
    }
  }

  creatSocketHeaders() {
    return {
      'Authorization': 'Bearer ' + this.getToken(),
    };
  }

  getToken(): string {
    return this.token;
  }
}
