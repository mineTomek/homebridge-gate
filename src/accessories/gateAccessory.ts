import { PlatformAccessory } from 'homebridge';
import { GateHomebridgePlatform } from '../platform.js';

export class GateAccessory {
  private service;

  private currentState;
  private targetState;

  constructor(
    private readonly platform: GateHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const { Service, Characteristic } = platform;

    this.currentState = Characteristic.CurrentDoorState.CLOSED;
    this.targetState = Characteristic.TargetDoorState.CLOSED;

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
  }

  private async setTargetState(value: number) {
    const { Characteristic, log } = this.platform;

    this.targetState = value;

    if (value === Characteristic.TargetDoorState.OPEN) {
      log.info('HomeKit requested gate open');
      // TODO: publish MQTT command: gate/open or gate/toggle
    } else {
      log.info('HomeKit requested gate close');
      // TODO: publish MQTT command: gate/close or gate/toggle
    }

    this.service.updateCharacteristic(
      Characteristic.TargetDoorState,
      this.targetState,
    );

    // ! Temporary fake movement until MQTT state exists.
    this.currentState =
      value === Characteristic.TargetDoorState.OPEN
        ? Characteristic.CurrentDoorState.OPENING
        : Characteristic.CurrentDoorState.CLOSING;

    this.service.updateCharacteristic(
      Characteristic.CurrentDoorState,
      this.currentState,
    );
  }

  // TODO: Just redo this
  public updateFromMqtt(isOpen: boolean) {
    const { Characteristic } = this.platform;

    this.currentState = isOpen
      ? Characteristic.CurrentDoorState.OPEN
      : Characteristic.CurrentDoorState.CLOSED;

    this.targetState = isOpen
      ? Characteristic.TargetDoorState.OPEN
      : Characteristic.TargetDoorState.CLOSED;

    this.service.updateCharacteristic(
      Characteristic.CurrentDoorState,
      this.currentState,
    );
    this.service.updateCharacteristic(
      Characteristic.TargetDoorState,
      this.targetState,
    );
  }
}
