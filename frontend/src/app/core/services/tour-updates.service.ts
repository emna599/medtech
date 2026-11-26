import { Injectable, inject } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TourUpdatesService {
  private readonly auth = inject(AuthService);

  changes(): Observable<void> {
    return new Observable<void>(subscriber => {
      const token = this.auth.getToken();
      if (!token) {
        subscriber.complete();
        return;
      }

      const connection = new AbortController();
      let heartbeat: ReturnType<typeof setTimeout>;
      const resetHeartbeat = () => {
        clearTimeout(heartbeat);
        heartbeat = setTimeout(() => connection.abort(), 30_000);
      };
      resetHeartbeat();

      const read = async () => {
        const response = await fetch(`${environment.apiUrl}/api/personnel/service/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          cache: 'no-store',
          signal: connection.signal,
        });
        if (response.status === 401 || response.status === 403) {
          subscriber.complete();
          return;
        }
        if (!response.ok || !response.body) throw new Error('Flux de tournée indisponible');

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        try {
          while (!subscriber.closed) {
            const { value, done } = await reader.read();
            if (done) throw new Error('Flux de tournée interrompu');
            resetHeartbeat();
            buffer += value;
            for (let separator = /\r?\n\r?\n/.exec(buffer); separator; separator = /\r?\n\r?\n/.exec(buffer)) {
              const frame = buffer.slice(0, separator.index);
              buffer = buffer.slice(separator.index + separator[0].length);
              if (frame.split(/\r?\n/).some(line => /^data: ?invalidate$/.test(line))) subscriber.next();
            }
          }
        } finally {
          reader.releaseLock();
        }
      };
      void read().catch(error => subscriber.error(error));
      return () => {
        clearTimeout(heartbeat);
        connection.abort();
      };
    }).pipe(retry({ delay: () => timer(3_000) }));
  }
}
