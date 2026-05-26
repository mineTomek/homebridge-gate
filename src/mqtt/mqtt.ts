import mqtt from 'mqtt';
import { Config } from '../config.js';
import { Logging } from 'homebridge';
import { MqttConfig, Payload } from './mqttConfig.js';

export class Mqtt {
  private client: mqtt.MqttClient;
  private log: Logging;

  private onStateChange: ((state: number) => void) | null = null;
  private onObstructionChange: ((obstruction: number) => void) | null = null;
  private onAvailabilityChange: ((available: boolean) => void) | null = null;

  constructor(config: Config, log: Logging) {
    this.log = log;
    this.client = mqtt.connect({
      host: config.mqttHost,
      port: config.mqttPort,

      username: config.mqttUsername,
      password: config.mqttPassword,
    });

    this.client.on('connect', () => {
      this.log.info('MQTT connected');

      this.subscribeTopics();
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  public setStateChangeHandler(callback: (state: number) => void) {
    this.onStateChange = callback;
  }

  public setObstructionChangeHandler(callback: (obstruction: number) => void) {
    this.onObstructionChange = callback;
  }

  public setAvailabilityChangeHandler(callback: (available: boolean) => void) {
    this.onAvailabilityChange = callback;
  }

  private subscribeTopics() {
    this.client.subscribe(MqttConfig.topic.sub.state, { qos: 1 });
    this.client.subscribe(MqttConfig.topic.sub.obstruction, { qos: 1 });
    this.client.subscribe(MqttConfig.topic.sub.availability, { qos: 1 });
  }

  private handleMessage(topic: string, payload: Buffer) {
    const value: number = payload[0];

    switch (topic) {
    case MqttConfig.topic.sub.state:
      this.log.debug('Received state:', value);

      if (this.onStateChange) {
        this.onStateChange(value);
      }
      break;
    case MqttConfig.topic.sub.obstruction:
      this.log.debug('Received obstruction:', value);

      if (this.onObstructionChange) {
        this.onObstructionChange(value);
      }
      break;
    case MqttConfig.topic.sub.availability:
    {
      this.log.debug('Received availability:', payload.toString());

      const available = payload.toString() === Payload.availability.online;

      if (this.onAvailabilityChange) {
        this.onAvailabilityChange(available);
      }
      break;
    }
    default:
      this.log.warn('Received message on unknown topic:', topic);
    }
  }

  public publishTargetState(value: typeof Payload.target[keyof typeof Payload.target]) {
    this.client.publish(MqttConfig.topic.pub.target, Buffer.from([value]), { qos: 1 });
  }

  public publishStopTrigger() {
    this.client.publish(MqttConfig.topic.pub.stop, Buffer.from([]), { qos: 1 });
  }
}
