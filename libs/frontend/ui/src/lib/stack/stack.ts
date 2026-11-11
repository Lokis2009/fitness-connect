import { Component, computed, input } from '@angular/core';

export type FcStackDirection = 'vertical' | 'horizontal';
export type FcStackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const GAP_CLASSES: Record<FcStackGap, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

@Component({
  selector: 'fc-stack',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class FcStack {
  readonly direction = input<FcStackDirection>('vertical');
  readonly gap = input<FcStackGap>('md');

  protected readonly classes = computed(
    () => `flex ${this.direction() === 'vertical' ? 'flex-col' : 'flex-row'} ${GAP_CLASSES[this.gap()]}`,
  );
}
