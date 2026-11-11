import { Component } from '@angular/core';
import { FcButton, FcStack } from '@fitness-connect/ui';

@Component({
  selector: 'fc-home',
  imports: [FcStack, FcButton],
  template: `
    <fc-stack gap="lg">
      <fc-stack direction="horizontal" gap="sm">
        <fc-button>Review trainers</fc-button>
        <fc-button variant="secondary">Moderate content</fc-button>
        <fc-button variant="text">View reports</fc-button>
      </fc-stack>
    </fc-stack>
  `,
})
export class Home {}
