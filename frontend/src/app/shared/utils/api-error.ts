import { HttpErrorResponse } from '@angular/common/http';

/** Transforme une erreur HTTP en message lisible pour l'utilisateur. */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'Impossible de joindre le serveur';
  }
  if (error.status === 403) {
    return "Vous n'avez pas le droit d'effectuer cette action";
  }
  const body = error.error as { message?: string; errors?: Record<string, string> } | null;
  const firstFieldError = body?.errors ? Object.values(body.errors)[0] : undefined;
  return firstFieldError ?? body?.message ?? fallback;
}
