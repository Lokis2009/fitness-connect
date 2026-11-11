import { Component } from '@angular/core';
import {
  FcAlert,
  FcButton,
  FcCard,
  FcHeading,
  FcPage,
  FcStack,
  FcText,
} from '@fitness-connect/ui';

/**
 * Signed-in landing page shared by the client, trainer and admin apps. Placeholder for real
 * features: it greets the user, confirms the session against the API and offers sign out.
 */
@Component({
  selector: 'fc-signed-in-home',
  imports: [FcPage, FcCard, FcStack, FcHeading, FcText, FcAlert, FcButton],
  template: `
    <fc-page>
      <fc-card>
        <fc-stack>
          <fc-heading>Welcome</fc-heading>
          <fc-alert variant="error">We could not confirm your session.</fc-alert>
          <fc-text variant="muted"></fc-text>
          <fc-button variant="secondary">Sign out</fc-button>
        </fc-stack>
      </fc-card>
    </fc-page>
  `,
})
export class SignedInHome {
  constructor() {
    throw new Error('not implemented');
  }
}
