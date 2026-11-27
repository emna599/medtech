import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Photos des résidents envoyées par l'administrateur : elles sont protégées par la connexion, donc on les
 * télécharge avec le jeton puis on les affiche par une adresse locale. Chaque photo n'est chargée qu'une fois.
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<string>>();

  objectUrl(path: string): Observable<string> {
    let source = this.cache.get(path);
    if (!source) {
      source = this.http.get(`${environment.apiUrl}${path}`, { responseType: 'blob' }).pipe(
        map((blob) => URL.createObjectURL(blob)),
        shareReplay(1),
      );
      this.cache.set(path, source);
    }
    return source;
  }
}
