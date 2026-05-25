import { PlatformAccessory, Service } from 'homebridge';
import { GateHomebridgePlatform } from '../platform.js';

export class ButtonAccessory {
  private service: Service;

  constructor(
    private readonly platform: GateHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const { Service, Characteristic } = platform;

    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'mineTomek')
      .setCharacteristic(Characteristic.Model, 'Gate Stop Button')
      .setCharacteristic(Characteristic.SerialNumber, 'gate-stop-button-0x539');

    this.service =
      this.accessory.getService(Service.Switch) ??
      this.accessory.addService(Service.Switch);

    this.service.setCharacteristic(Characteristic.Name, accessory.displayName);

    this.service
      .getCharacteristic(Characteristic.On)
      .onGet(() => false)
      .onSet((value) => this.handleSwitch(value as boolean));
  }

  private async handleSwitch(value: boolean) {
    const { Characteristic, log } = this.platform;

    if (!value) {
      return;
    }

    log.debug('HomeKit requested gate stop');
    this.platform.mqtt.publishStopTrigger();

    setTimeout(() => {
      this.service.updateCharacteristic(Characteristic.On, false);
    }, 10);
  }
}
