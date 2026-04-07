import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';


type PushSubscriptionJSONSafe = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private apiUrl = `${environment.apiUrl}/push`;

  constructor(private http: HttpClient) {}

  private getEmpresaActual(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (localStorage.getItem('empresa_activa') || 'ARGASA')
      .toUpperCase()
      .trim();

    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  async solicitarPermisoYRegistrar(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Este navegador no soporta notificaciones push');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permiso de notificaciones denegado');
        return;
      }

      // Registramos manualmente tu service worker propio
      const registration =
        await navigator.serviceWorker.register('/custom-sw.js');

      const keyResp = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${this.apiUrl}/public-key`),
      );

      if (!keyResp?.publicKey) {
        console.error('No se recibió la public key del backend');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            keyResp.publicKey,
          ) as unknown as BufferSource,
        });
      }

      const subJson = subscription.toJSON() as PushSubscriptionJSONSafe;

      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        console.error('La suscripción push no contiene endpoint/keys válidas');
        return;
      }

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/subscribe`, {
          empresa: this.getEmpresaActual(),
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        }),
      );

      console.log('Suscripción push registrada correctamente');
    } catch (error) {
      console.error('Error registrando notificaciones push', error);
    }
  }

  async desregistrar(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration =
        await navigator.serviceWorker.getRegistration('/custom-sw.js');
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/unsubscribe`, {
          endpoint: subscription.endpoint,
        }),
      );

      await subscription.unsubscribe();
      console.log('Suscripción push eliminada');
    } catch (error) {
      console.error('Error al desregistrar notificaciones push', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}
