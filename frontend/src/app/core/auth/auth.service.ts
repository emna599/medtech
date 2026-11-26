import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, timeout } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  ROLE_HOME_ROUTE,
  UserInfo,
} from '../../shared/models/auth.model';

interface Session {
  token: string;
  /** Date d'expiration du jeton, en millisecondes (Date.now()). */
  expiresAt: number;
  user: UserInfo;
}

// sessionStorage : la session disparaît à la fermeture de l'onglet (postes partagés en EHPAD).
const STORAGE_KEY = 'medtech.session';

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as Session;
    return session.token && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Stockage indisponible : la session reste simplement en mémoire.
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly dialogs = inject(MatDialog);
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly session = signal<Session | null>(readStoredSession());

  private readonly notice = signal<string | null>(null);
  readonly logoutNotice = this.notice.asReadonly();

  constructor() {
    this.scheduleExpiry();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.expiryTimer));
  }

  /** Utilisateur connecté (null si personne). */
  readonly currentUser = computed(() => this.session()?.user ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.notice.set(null);
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, credentials)
      .pipe(tap((response) => this.startSession(response)));
  }

  logout(): void {
    const token = this.getToken();
    this.endSession();
    if (token) {
      this.http.post<void>(`${environment.apiUrl}/api/auth/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      }).pipe(timeout(5000)).subscribe({
        error: (error: unknown) => {
          if (!this.session() && !(error instanceof HttpErrorResponse && error.status === 401)) {
            this.notice.set('Déconnexion locale effectuée. Le serveur n’a pas confirmé la révocation.');
          }
        },
      });
    }
  }

  expireIfCurrent(token: string): void {
    if (this.session()?.token === token) {
      this.endSession();
      this.notice.set('Votre session a expiré ou a été révoquée. Reconnectez-vous.');
    }
  }

  private endSession(): void {
    this.clearSession();
    this.dialogs.closeAll();
    void this.router.navigateByUrl('/login');
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const session = this.session();
    if (session) {
      this.expiryTimer = setTimeout(() => this.expireIfCurrent(session.token),
        Math.max(0, session.expiresAt - Date.now()));
    }
  }

  /** Vrai si une session existe et que le jeton n'est pas expiré. */
  isSessionValid(): boolean {
    const session = this.session();
    if (!session) {
      return false;
    }
    if (session.expiresAt <= Date.now()) {
      this.expireIfCurrent(session.token);
      return false;
    }
    return true;
  }

  getToken(): string | null {
    return this.isSessionValid() ? (this.session()?.token ?? null) : null;
  }

  /** Page d'accueil du rôle connecté, ou la page de connexion si personne n'est connecté. */
  homeRoute(): string {
    const role = this.currentUser()?.role;
    return role ? ROLE_HOME_ROUTE[role] : '/login';
  }

  private startSession(response: LoginResponse): void {
    const session: Session = {
      token: response.token,
      expiresAt: Date.now() + response.expiresInSeconds * 1000,
      user: response.user,
    };
    this.session.set(session);
    writeStoredSession(session);
    this.scheduleExpiry();
  }

  private clearSession(): void {
    clearTimeout(this.expiryTimer);
    this.session.set(null);
    writeStoredSession(null);
  }
}
