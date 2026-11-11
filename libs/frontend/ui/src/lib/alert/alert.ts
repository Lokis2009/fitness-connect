import { Component, input } from '@angular/core';

export type FcAlertVariant = 'error' | 'info';

/** Message box for errors and information that projects its content. */
@Component({
  selector: 'fc-alert',
  template: '',
})
export class FcAlert {
  readonly variant = input<FcAlertVariant>('info');
}
