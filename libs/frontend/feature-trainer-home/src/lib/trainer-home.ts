import { Component } from '@angular/core';
import { FcPage, FcText } from '@fitness-connect/ui';
import { RequestsStore } from './requests-store';
import { SessionsStore } from './sessions-store';

/**
 * Trainer home: pending booking requests and today's and tomorrow's confirmed sessions.
 * Skeleton: a placeholder until slice 9 of `docs/designs/trainer-home.md`.
 */
@Component({
  selector: 'fc-trainer-home',
  imports: [FcPage, FcText],
  providers: [RequestsStore, SessionsStore],
  template: `
    <fc-page>
      <fc-text>Trainer home</fc-text>
    </fc-page>
  `,
})
export class TrainerHome {}
