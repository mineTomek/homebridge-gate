import { PlatformConfig } from 'homebridge';

export type Config = PlatformConfig & {
    mqttHost: string;
    mqttPort: number;
    mqttUsername: string;
    mqttPassword: string;

    autoCloseEnabled: boolean;
    autoCloseDelaySeconds: number;
    autoCloseWhileOpening: boolean;
}
