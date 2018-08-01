import { Component, NgZone } from '@angular/core';
import { HubConnectionManager } from './HubConnectionManager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    readonly hubEndPointUrl : string = "http://channel-demo-app.centralus.cloudapp.azure.com/channelHub";
    channels: any;
    shows: Array<any>;
    channelID: Number;
    showsNotification: string;
    hubConnectionManager: HubConnectionManager;

    constructor(private zone: NgZone) {
        this.shows = [];
        this.hubConnectionManager = new HubConnectionManager();
    }

    ngOnInit(): void {
        this.hubConnectionManager.createHubConnection(this.hubEndPointUrl, true); 
        this.subscribeInChannelUpdates();
    }

    retrieveChannels(): void {
        this.hubConnectionManager.invoke('GetChannels'); 
    }

    retrieveShows(_channelID): void {
        this.channelID = _channelID ? _channelID : 1;;
        this.shows = [];
        this.showsNotification = "";
        
        console.log("Getting shows for channel: " + this.channelID);

        this.subscribeInShowUpdates(this.channelID);
    }

    subscribeInChannelUpdates(): void {
        this.hubConnectionManager.on('getChannels', (channels: any) => {
            this.zone.run(() => {
                console.log("Received channels = " + channels.length);
                this.channels = channels;        
            });
        });
    }

    subscribeInShowUpdates(_channelID): void {
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
        };

        this.hubConnectionManager.stream("GetShows", _channelID, streamSubscriber);
  }
}