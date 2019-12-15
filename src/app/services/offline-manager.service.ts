import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Observable, from, of, forkJoin } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import * as _ from 'lodash';

const STORAGE_REQ_KEY = 'storedreqkey';

interface StoredRequest {
  url: string;
  type: string;
  data: any;
  time: number;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {
  constructor(
    private storage: Storage,
    private toastController: ToastController,
    private http: HttpClient
  ) {}

  public checkForEvents(): Observable<any> {
    return from(this.storage.get(STORAGE_REQ_KEY)).pipe(
      switchMap(storedOperations => {
        const storedObj = JSON.parse(storedOperations);
        if (storedObj && storedObj.length > 0) {
          // Send local stored data to server
          return this.sendRequests(storedObj).pipe(
            finalize(() => {
              // Notify user
              const toaster = this.toastController.create({
                message: 'Local data successfully synced to API',
                duration: 3000,
                position: 'bottom'
              });
              toaster.then(toast => toast.present());
              // Remove stored data of local storage
              this.storage.remove(STORAGE_REQ_KEY);
            })
          );
        } else {
          console.log('No local events');
          return of(false);
        }
      })
    );
  }

  public storeRequest(url: string, type: string, data: any) {
    // Notify user
    const toaster = this.toastController.create({
      message:
        'Your data is being stored locally because you seem to be offline',
      duration: 3000,
      position: 'bottom'
    });
    toaster.then(toast => toast.present());

    // Prepare data to store
    const action: StoredRequest = {
      url,
      type,
      data,
      time: new Date().getTime(),
      id: _.uniqueId()
    };

    return this.storage.get(STORAGE_REQ_KEY).then(storedOperations => {
      let storedObj = JSON.parse(storedOperations);

      if (storedObj) {
        storedObj.push(action);
      } else {
        storedObj = [action];
      }

      console.log('Local request stored: ', action);

      return this.storage.set(STORAGE_REQ_KEY, JSON.stringify(storedObj));
    });
  }

  private sendRequests(operations: StoredRequest[]) {
    const history = [];

    operations.forEach(item => {
      console.log('Make a request of: ', item);

      // Call a generic request service passing type (GET, POST, PUT, DELETE) as a parameter
      const response = this.http.request(item.type, item.url, item.data);

      // Store request history
      history.push(response);
    });

    return forkJoin(history);
  }
}
