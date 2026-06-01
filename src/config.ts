import { PlatformConfig } from 'homebridge';

export interface Config extends PlatformConfig {
    mqttHost: string;
    mqttPort: number;
    mqttUsername: string;
    mqttPassword: string;

    autoCloseEnabled: boolean;
    autoCloseDelaySeconds: number;
    autoCloseWhileOpening: boolean;
}
