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
import { Config } from './config.js';
import { Mqtt } from './mqtt.js';

export class GateHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly mqtt: Mqtt;

  private readonly accessories: PlatformAccessory[] = [];
  private gateAccessory: GateAccessory | null = null;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.mqtt = new Mqtt(this.config as Config, this.log);

    this.api.on('didFinishLaunching', () => {
      this.registerFixedAccessories();
      this.setupMqttHandlers();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.accessories.push(accessory);
  }

  private registerFixedAccessories() {
    this.gateAccessory = this.createOrReuseAccessory('Gate', 'gate', GateAccessory) as GateAccessory;
    this.createOrReuseAccessory('Gate Button', 'gate-button', ButtonAccessory);
  }

  private setupMqttHandlers() {
    if (this.gateAccessory) {
      this.mqtt.setStateChangeHandler((state) => {
        this.gateAccessory!.updateState(state);
      });

      this.mqtt.setObstructionChangeHandler((obstruction) => {
        this.gateAccessory!.updateObstruction(obstruction);
      });

      this.mqtt.setAvailabilityChangeHandler((available) => {
        if (!available) {
          this.log.error('Gate ESP is offline');
        } else {
          this.log.info('Gate ESP is online');
        }
      });
    }
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

    return new AccessoryClass(this, accessory);
  }
}
