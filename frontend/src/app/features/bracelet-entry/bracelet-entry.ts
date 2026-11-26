import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BRACELET_PATH, braceletCode } from '../../shared/utils/bracelet-link';
import { IdentifyDialog, IdentifyDialogData, IdentifyResult } from '../personnel/identify-dialog/identify-dialog';

@Component({
  selector: 'app-bracelet-entry',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BraceletEntry {
  constructor() {
    const auth = inject(AuthService);
    const code = braceletCode(inject(ActivatedRoute).snapshot.fragment);
    const router = inject(Router);
    const role = auth.currentUser()?.role;
    const location = inject(Location);
    const dialog = inject(MatDialog);
    const destroyRef = inject(DestroyRef);

    if (!auth.isSessionValid() || !role) {
      void router.navigate(['/login'], { fragment: code ?? undefined, replaceUrl: true });
      return;
    }

    location.replaceState(BRACELET_PATH);
    const mode = role === 'ADMIN' ? 'admin' : role === 'MEDECIN' ? 'medecin' : 'personnel';
    dialog.open<IdentifyDialog, IdentifyDialogData, IdentifyResult>(IdentifyDialog, {
      data: { mode, initialCode: code },
      width: '560px',
      maxWidth: '96vw',
    }).afterClosed().pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      if (!result || !auth.isSessionValid()) {
        void router.navigateByUrl(auth.homeRoute(), { replaceUrl: true });
      } else if (role === 'PERSONNEL') {
        void router.navigate(['/personnel'], { replaceUrl: true, state: { identifiedResidentId: result.residentId } });
      } else {
        void router.navigate(['/' + mode, 'residents', result.residentId], { replaceUrl: true });
      }
    });
  }
}
