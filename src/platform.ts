import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { GateAccessory } from './accessories/gateAccessory.js';
import { ButtonAccessory } from './accessories/buttonAccessory.js';

export class GateHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.registerFixedAccessories();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.accessories.push(accessory);
  }

  private registerFixedAccessories() {
    this.createOrReuseAccessory('Gate', 'gate', GateAccessory);
    this.createOrReuseAccessory('Gate Button', 'gate-button', ButtonAccessory);
  }

  private createOrReuseAccessory(
    name: string,
    id: string,
    AccessoryClass: new (
      platform: GateHomebridgePlatform,
      accessory: PlatformAccessory,
    ) => unknown,
  ) {
    const uuid = this.api.hap.uuid.generate(id);
    let accessory = this.accessories.find((a) => a.UUID === uuid);

    if (!accessory) {
      accessory = new this.api.platformAccessory(name, uuid);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }

    new AccessoryClass(this, accessory);
  }
}
