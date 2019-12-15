import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Network } from '@ionic-native/network/ngx';
import { ToastController, Platform } from '@ionic/angular';

export enum ConnectionStatus {
  Online,
  Offline
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private status: BehaviorSubject<ConnectionStatus> = new BehaviorSubject(
    ConnectionStatus.Offline
  );

  constructor(
    private network: Network,
    private toastController: ToastController,
    private plt: Platform
  ) {
    // Wait till platform is ready to start checking internet status
    this.plt.ready().then(() => {
      this.initializeNetworkEvents();
      const status =
        this.network.type !== 'none'
          ? ConnectionStatus.Online
          : ConnectionStatus.Offline;
      this.status.next(status);
    });
  }

  public initializeNetworkEvents() {
    // Observes if user becomes offline
    this.network.onDisconnect().subscribe(() => {
      if (this.status.getValue() === ConnectionStatus.Online) {
        console.log('YOU ARE OFFLINE');
        this.updateNetworkStatus(ConnectionStatus.Offline);
      }
    });

    // Observes if user becomes online
    this.network.onConnect().subscribe(() => {
      if (this.status.getValue() === ConnectionStatus.Offline) {
        console.log('YOU ARE ONLINE');
        this.updateNetworkStatus(ConnectionStatus.Online);
      }
    });
  }

  // Updates BehaviorSubject value
  private async updateNetworkStatus(status: ConnectionStatus) {
    this.status.next(status);

    const connection =
      status === ConnectionStatus.Offline ? 'Offline' : 'Online';

    const toaster = this.toastController.create({
      message: `You are now ${connection}`,
      duration: 3000,
      position: 'bottom'
    });
    toaster.then(toast => toast.present());
  }

  public onNetworkChange(): Observable<ConnectionStatus> {
    return this.status.asObservable();
  }

  public getCurrentNetworkStatus(): ConnectionStatus {
    return this.status.getValue();
  }
}
