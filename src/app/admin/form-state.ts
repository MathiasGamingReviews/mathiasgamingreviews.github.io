/**
 * @file Busy/error state shared by the edit forms.
 */

import { signal } from '@angular/core';

/** Tracks one running request at a time and its error message. */
export class FormState {
  /** True while a request is running; buttons are disabled. */
  readonly busy = signal(false);
  /** Message of the last failed request; '' when there is none. */
  readonly error = signal('');

  /**
   * Runs `work` with `busy` set, storing the error message if it throws.
   * @returns True if `work` completed without error.
   */
  async run(work: () => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    this.error.set('');
    try {
      await work();
      return true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
