import { HubConnection } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';

export class HubConnectionManager {
    hubConnection: HubConnection | undefined;
    hubEndPointUrl: string;
    connected: boolean;
    autoReconnect: boolean;

    createHubConnection(hubEndPointUrl: string, autoReconnect: boolean): void {
        this.autoReconnect = autoReconnect;
        this.hubEndPointUrl = hubEndPointUrl;
        this.hubConnection = new signalR.HubConnectionBuilder()
                                        .withUrl(this.hubEndPointUrl, 
                                                {transport: signalR.HttpTransportType.LongPolling}
                                        )
                                        .configureLogging(signalR.LogLevel.Information)
                                        .build();

        this.startConnecting();

        if (this.autoReconnect) {
            this.hubConnection.onclose((err) => {
                console.log("connection is closed, reconnecting ...");
                this.startConnecting();
            });
        }
    }  

    isConnected(): boolean {
        return this.connected;
    }

    invoke(method: string, data: any = undefined) {
        if (! this.connected) {
            return;
        }
        
        if (data !== undefined) {
            this.hubConnection.invoke(method, data);
            return;
        }

        this.hubConnection.invoke(method);
    }    

    stream(method: string, data: any = undefined, streamSubscriber: any) {
        if (! this.connected) {
            return;
        }
        
        if (data !== undefined) {
            this.hubConnection.stream(method, data).subscribe(streamSubscriber);
            return;
        }

        this.hubConnection.stream(method).subscribe(streamSubscriber);
    }      

    on(method: string, callback: any) {
        this.hubConnection.on(method, callback);
    }    

    private startConnecting(): void {
        this.hubConnection.start()
                          .then(()=> {
                              this.connected = true;
                              console.log("connected ...");
                          })
                          .catch((err) => {
                              this.connected = false;
                              console.error(err);
                              console.log("Reconnecting ...");
                              setInterval(() => {
                                  this.hubConnection.start();
                              }, 1000);
                          });
    }
}