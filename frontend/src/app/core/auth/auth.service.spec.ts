import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../shared/models/auth.model';
import { AuthService } from './auth.service';

const LOGIN_URL = `${environment.apiUrl}/api/auth/login`;

const response: LoginResponse = {
  token: 'jeton-de-test',
  tokenType: 'Bearer',
  expiresInSeconds: 3600,
  user: { id: 1, username: 'admin', fullName: 'Alex Admin', role: 'ADMIN' },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('has no session at the start', () => {
    expect(service.isSessionValid()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.homeRoute()).toBe('/login');
  });

  it('stores the session after a successful login', () => {
    service.login({ username: 'admin', password: 'Demo1234!' }).subscribe();

    const request = http.expectOne(LOGIN_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'admin', password: 'Demo1234!' });
    request.flush(response);

    expect(service.isSessionValid()).toBe(true);
    expect(service.getToken()).toBe('jeton-de-test');
    expect(service.currentUser()?.role).toBe('ADMIN');
    expect(service.homeRoute()).toBe('/admin');
  });

  it('does not keep a session after a failed login', () => {
    service.login({ username: 'admin', password: 'faux' }).subscribe({ error: () => undefined });

    http.expectOne(LOGIN_URL).flush({ message: 'Identifiants invalides' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isSessionValid()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('ignores a stale unauthorized response after a new login', () => {
    service.login({ username: 'admin', password: 'Demo1234!' }).subscribe();
    http.expectOne(LOGIN_URL).flush({ ...response, token: 'nouveau-jeton' });

    service.expireIfCurrent(response.token);

    expect(service.getToken()).toBe('nouveau-jeton');
    expect(service.logoutNotice()).toBeNull();
  });

  it('clears the session on logout', () => {
    service.login({ username: 'admin', password: 'Demo1234!' }).subscribe();
    http.expectOne(LOGIN_URL).flush(response);

    service.logout();
    const logout = http.expectOne(`${environment.apiUrl}/api/auth/logout`);
    expect(logout.request.headers.get('Authorization')).toBe('Bearer jeton-de-test');
    logout.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isSessionValid()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});
