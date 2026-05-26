export const MqttConfig = {
  topic: {
    log: 'gate/log',
    newDevice: 'gate/device/new',

    sub: {
      state: 'gate/current',
      obstruction: 'gate/obstruction',
      availability: 'gate/availability',
    },

    pub: {
      target: 'gate/target/set',
      stop: 'gate/stop/trigger',
    },
  } as const,
  payload: {
    target: {
      open: 0x00,
      closed: 0x01,
    },

    state: {
      open: 0x00,
      closed: 0x01,
      opening: 0x02,
      closing: 0x03,
      stopped: 0x04,
    },

    obstruction: {
      unobstructed: 0x00,
      obstructed: 0x01,
    },

    availability: {
      offline: 'offline',
      online: 'online',
    },
  } as const,
};

export const Topic = MqttConfig.topic;
export const Payload = MqttConfig.payload;
