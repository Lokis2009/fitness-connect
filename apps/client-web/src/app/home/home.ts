import { Component } from '@angular/core';
import { FcButton, FcStack } from '@fitness-connect/ui';

@Component({
  selector: 'fc-home',
  imports: [FcStack, FcButton],
  template: `
    <fc-stack gap="lg">
      <fc-stack direction="horizontal" gap="sm">
        <fc-button>Find a trainer</fc-button>
        <fc-button variant="secondary">Book a session</fc-button>
        <fc-button variant="text">Learn more</fc-button>
      </fc-stack>
    </fc-stack>
  `,
})
export class Home {}
