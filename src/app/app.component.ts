import { Component, NgZone } from '@angular/core';
import { HubConnection } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readonly hubEndPoint : string = "http://channel-demo-app.centralus.cloudapp.azure.com/channelHub"
  hubConnection: HubConnection | undefined;

  connected: boolean;
  channels: any;
  shows: Array<any>;
  channelID: Number;
  showsNotification: string;

  constructor(private zone: NgZone) {
    this.shows = [];
  }

  ngOnInit(): void {
      this.createHubConnection(); 
      this.listenForChannelUpdates();
  }
  
  getChannels(): void {
    if (this.hubConnection) {
        console.log("Getting channels ...");
        this.hubConnection.invoke('GetChannels');
    }
  }

  getShows(_channelID): void {
    if (!this.connected) {
        return;
    }

    if (this.hubConnection) {
        console.log("Getting shows for channel: " + _channelID);
        this.shows = [];
        this.showsNotification = "";
        this.listenForShowUpdates(_channelID);
    }
  }

  createHubConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
                       .withUrl(this.hubEndPoint)
                       .configureLogging(signalR.LogLevel.Information)
                       .build();

    this.hubConnection.start()
                      .then(()=> {
                          this.connected = true;
                          console.log("connected ...");
                      })
                      .catch((err) => {
                          this.connected = false;
                          console.error(err.toString());
                          console.log("Reconnecting ...");
                          setInterval(() => {
                              this.hubConnection.start();
                          }, 3000);
                      });
  }

  listenForChannelUpdates(): void {
      this.hubConnection.on('getChannels', (channels: any) => {
          this.zone.run(() => {
              console.log("Length of received channels = " + channels.length);
              this.channels = channels;        
          });
      });
  }

  listenForShowUpdates(_channelID): void {
      if (!this.connected) {
          return;
      }

      _channelID = _channelID ? _channelID : 1;
      this.channelID = _channelID;

      let streamSubscriber = {
          next: (show) => {
              console.log("Receiving a show: " + show.name);
              this.zone.run(() => {
                  this.shows.push(show);
              });
          },
          complete: () => {
              this.zone.run(() => {
                  console.log("Get shows operation completes");
                  this.showsNotification = "Get shows operation completes";    
              });            
          },
          error: (err) => {
              this.zone.run(() => {
                  console.log("An error happens in getting shows ...");
                  this.showsNotification = "An error happens in getting shows ...";   
              });             
          }
      }

      this.hubConnection.stream("GetShows", _channelID).subscribe(streamSubscriber);
  }
}