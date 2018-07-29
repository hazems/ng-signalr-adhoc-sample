import { Component, NgZone } from '@angular/core';
import { HubConnection } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  hubConnection: HubConnection | undefined;
  channels: any;
  shows: Array<any>;
  channelID: Number;
  showsNotification: string;

  constructor(private zone: NgZone) {
    this.shows = [];
  }

  ngOnInit(): void {

    this.hubConnection = new signalR.HubConnectionBuilder()
                        .withUrl('http://channel-demo-app.centralus.cloudapp.azure.com/channelHub')
                        .configureLogging(signalR.LogLevel.Information)
                        .build();

    this.hubConnection.start().catch(err => console.error(err.toString()));

    this.hubConnection.on('getChannels', (channels: any) => {
        this.zone.run(() => {
          console.log("Length of received channels = " + channels.length);
          this.channels = channels;        
        });
    });

  }

  public getChannels(): void {
    if (this.hubConnection) {
        console.log("Getting channels ...");
        this.hubConnection.invoke('GetChannels');
    }
  }

  public getShows(_channelID): void {
    if (this.hubConnection) {
       console.log("Getting shows for channel: " + _channelID);
       this.shows = [];
       this.showsNotification = "";

       this.hubConnection.stream("GetShows", _channelID)
            .subscribe({
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
            });
    }
  }  
}
