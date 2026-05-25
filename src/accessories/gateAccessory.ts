import { PlatformAccessory, Service } from 'homebridge';
import { GateHomebridgePlatform } from '../platform.js';
import { Payload } from '../mqttConfig.js';

export class GateAccessory {
  private service: Service;

  private currentState: number;
  private targetState: number;
  private obstruction: boolean;

  constructor(
    private readonly platform: GateHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const { Service, Characteristic } = platform;

    this.currentState = Characteristic.CurrentDoorState.CLOSED;
    this.targetState = Characteristic.TargetDoorState.CLOSED;
    this.obstruction = false;

    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Tomek Industries')
      .setCharacteristic(Characteristic.Model, 'Gate Controller')
      .setCharacteristic(Characteristic.SerialNumber, 'gate-0x539');

    this.service =
      this.accessory.getService(Service.GarageDoorOpener) ??
      this.accessory.addService(Service.GarageDoorOpener);

    this.service.setCharacteristic(Characteristic.Name, accessory.displayName);

    this.service
      .getCharacteristic(Characteristic.CurrentDoorState)
      .onGet(() => this.currentState);

    this.service
      .getCharacteristic(Characteristic.TargetDoorState)
      .onGet(() => this.targetState)
      .onSet((value) => this.setTargetState(value as number));

    this.service
      .getCharacteristic(Characteristic.ObstructionDetected)
      .onGet(() => this.obstruction);
  }

  private async setTargetState(value: number) {
    const { Characteristic, log } = this.platform;

    this.targetState = value;

    if (value === Characteristic.TargetDoorState.OPEN) {
      log.debug('HomeKit requested gate open');
      this.platform.mqtt.publishTargetState(Payload.target.open);
    } else {
      log.debug('HomeKit requested gate close');
      this.platform.mqtt.publishTargetState(Payload.target.closed);
    }

    this.service.updateCharacteristic(
      Characteristic.TargetDoorState,
      this.targetState,
    );
  }

  public updateState(state: number) {
    const { Characteristic, log } = this.platform;

    log.debug('Gate state updated from MQTT:', state);

    switch (state) {
    case Payload.state.open:
      this.currentState = Characteristic.CurrentDoorState.OPEN;
      this.targetState = Characteristic.TargetDoorState.OPEN;
      break;
    case Payload.state.closed:
      this.currentState = Characteristic.CurrentDoorState.CLOSED;
      this.targetState = Characteristic.TargetDoorState.CLOSED;
      break;
    case Payload.state.opening:
      this.currentState = Characteristic.CurrentDoorState.OPENING;
      this.targetState = Characteristic.TargetDoorState.OPEN;
      break;
    case Payload.state.closing:
      this.currentState = Characteristic.CurrentDoorState.CLOSING;
      this.targetState = Characteristic.TargetDoorState.CLOSED;
      break;
    case Payload.state.stopped:
      this.currentState = Characteristic.CurrentDoorState.STOPPED;
      break;
    default:
      log.warn('Unknown gate state from MQTT:', state);
      return;
    }

    this.service.updateCharacteristic(
      Characteristic.CurrentDoorState,
      this.currentState,
    );
    this.service.updateCharacteristic(
      Characteristic.TargetDoorState,
      this.targetState,
    );
  }

  public updateObstruction(obstruction: number) {
    const { Characteristic, log } = this.platform;

    log.debug('Gate obstruction updated from MQTT:', obstruction);

    this.obstruction = obstruction === Payload.obstruction.obstructed;

    this.service.updateCharacteristic(
      Characteristic.ObstructionDetected,
      this.obstruction,
    );
  }
}
