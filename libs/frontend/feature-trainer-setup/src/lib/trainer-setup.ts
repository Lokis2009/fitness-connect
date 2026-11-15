import { Component } from '@angular/core';
import { FcPage, FcText } from '@fitness-connect/ui';

/**
 * Read-only trainer setup page (`/setup`): shows the approval status. Skeleton: a placeholder until
 * slice 8 of `docs/designs/trainer-home.md`.
 */
@Component({
  selector: 'fc-trainer-setup',
  imports: [FcPage, FcText],
  template: `
    <fc-page>
      <fc-text>Trainer setup</fc-text>
    </fc-page>
  `,
})
export class TrainerSetup {}
