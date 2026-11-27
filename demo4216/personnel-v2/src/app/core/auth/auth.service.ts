import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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

  private readonly session = signal<Session | null>(readStoredSession());

  /** Utilisateur connecté (null si personne). */
  readonly currentUser = computed(() => this.session()?.user ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, credentials)
      .pipe(tap((response) => this.startSession(response)));
  }

  /** Supprime la session puis renvoie vers la page de connexion. */
  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  /** Vrai si une session existe et que le jeton n'est pas expiré. */
  isSessionValid(): boolean {
    const session = this.session();
    if (!session) {
      return false;
    }
    if (session.expiresAt <= Date.now()) {
      this.clearSession();
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
  }

  private clearSession(): void {
    this.session.set(null);
    writeStoredSession(null);
  }
}
