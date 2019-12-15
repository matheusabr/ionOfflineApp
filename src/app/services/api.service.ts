import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { NetworkService, ConnectionStatus } from './network.service';
import { OfflineManagerService } from './offline-manager.service';
import { Observable, from } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

const API_STORAGE_KEY = 'apistoragekey';
const API_URL = 'https://reqres.in/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private storage: Storage,
    private http: HttpClient,
    private networkService: NetworkService,
    private offlineManagerService: OfflineManagerService
  ) {}

  public getUsers(forceRefresh: boolean = false): Observable<any> {
    // Check if it is currently offline
    if (
      this.networkService.getCurrentNetworkStatus() ===
        ConnectionStatus.Offline ||
      !forceRefresh
    ) {
      return from(this.getLocalData('users'));
    }

    // Otherwise, get api data and save to local storage data
    const page = Math.floor(Math.random() * Math.floor(6));
    return this.http.get(`${API_URL}/users?per_page=2&page=${page}`).pipe(
      map(res => res['data']),
      tap(res => {
        console.log('Return a real API data');
        this.setLocalData('users', res);
      })
    );
  }

  public updateUser(user: string, data: any): Observable<any> {
    const url = `${API_URL}/users/${user}`;

    if (
      this.networkService.getCurrentNetworkStatus() === ConnectionStatus.Offline
    ) {
      // Store request if it is offline
      return from(this.offlineManagerService.storeRequest(url, 'PUT', data));
    }

    return this.http.put(url, data).pipe(
      catchError(err => {
        // Store if request failed
        this.offlineManagerService.storeRequest(url, 'PUT', data);
        throw new Error(err);
      })
    );
  }

  // Store api data locally
  private setLocalData(key: string, data: any) {
    this.storage.set(`${API_STORAGE_KEY}-${key}`, data);
  }

  // Get data stored
  private getLocalData(key: string): any {
    return this.storage.get(`${API_STORAGE_KEY}-${key}`);
  }
}
