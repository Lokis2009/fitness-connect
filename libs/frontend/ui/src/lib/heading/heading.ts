import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';

export type FcHeadingLevel = 1 | 2 | 3;

function toHeadingLevel(value: number | string): FcHeadingLevel {
  const level = Number(value);
  return level === 2 || level === 3 ? level : 1;
}

/** Heading that renders an h1, h2 or h3 depending on `level`. */
@Component({
  selector: 'fc-heading',
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #content><ng-content /></ng-template>
    @switch (level()) {
      @case (2) {
        <h2 class="text-2xl font-semibold text-on-surface"><ng-container [ngTemplateOutlet]="content" /></h2>
      }
      @case (3) {
        <h3 class="text-lg font-medium text-on-surface"><ng-container [ngTemplateOutlet]="content" /></h3>
      }
      @default {
        <h1 class="text-3xl font-bold text-on-surface"><ng-container [ngTemplateOutlet]="content" /></h1>
      }
    }
  `,
  host: { class: 'block' },
})
export class FcHeading {
  readonly level = input<FcHeadingLevel, number | string>(1, { transform: toHeadingLevel });
}
