import { Logging } from 'homebridge';
import { Config } from '../config.js';
import { Payload } from '../mqtt/mqttConfig.js';

export class AutoCloseController {
  private autoCloseTimer: NodeJS.Timeout | null = null;

  private obstructionState: boolean = false;
  private currentState: number = Payload.state.closed;

  constructor(
        private config: Config,
        private log: Logging,
        private closeGate: () => void,
  ) { }

  public onCurrentStateChanged(state: number) {
    this.currentState = state;

    if (!this.canAutoCloseFromState(this.currentState)) {
      this.cancelAutoClose();
    }
  }

  public onObstructionChanged(previous: boolean, current: boolean) {
    this.obstructionState = current;

    if (!this.canAutoCloseFromObstruction(this.obstructionState)) {
      this.cancelAutoClose();
      return;
    }

    // Obstruction cleared
    if (previous && !current) {
      this.scheduleAutoClose();
    }
  }

  public onTargetStateChanged() {
    this.cancelAutoClose();
  }

  private scheduleAutoClose() {
    if (!this.config.autoCloseEnabled) {
      return;
    }

    this.cancelAutoClose();

    const delayMs = this.config.autoCloseDelaySeconds * 1000;

    this.autoCloseTimer = setTimeout(() => this.triggerAutoClose(), delayMs);
  }

  private triggerAutoClose() {
    this.autoCloseTimer = null;

    if (!this.canAutoCloseFromObstruction(this.obstructionState)) {
      return;
    }

    if (!this.canAutoCloseFromState(this.currentState)) {
      return;
    }

    // ? Maybe add some retries?

    this.closeGate();
  }

  private cancelAutoClose() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  private canAutoCloseFromState(state: number) {
    // ? Idk if this is final

    if (state === Payload.state.open || state === Payload.state.stopped) {
      return true;
    }

    if (this.config.autoCloseWhileOpening && state === Payload.state.opening) {
      return true;
    }

    return false;
  }

  private canAutoCloseFromObstruction(obstruction: boolean) {
    return !obstruction;
  }
}