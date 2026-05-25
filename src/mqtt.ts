import mqtt from 'mqtt';
import { Config } from './config.js';
import { Logging } from 'homebridge';
import { MqttConfig, Payload } from './mqttConfig.js';

export class Mqtt {
  private client: mqtt.MqttClient;
  private log: Logging;

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

  private subscribeTopics() {
    this.client.subscribe(MqttConfig.topic.sub.state, { qos: 1 });
    this.client.subscribe(MqttConfig.topic.sub.obstruction, { qos: 1 });
    this.client.subscribe(MqttConfig.topic.sub.availability, { qos: 1 });
  }

  private handleMessage(topic: string, payload: Buffer) {
    const value: number = payload[0];

    switch (topic) {
    case MqttConfig.topic.sub.state:
      this.log.info('Received state:', value);
      break;
    case MqttConfig.topic.sub.obstruction:
      this.log.info('Received obstruction:', value);
      break;
    case MqttConfig.topic.sub.availability:
      this.log.info('Received availability:', payload.toString());
      break;
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
