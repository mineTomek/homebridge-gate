export const MqttConfig = {
  topic: {
    log: 'gate/log',
    newDevice: 'gate/device/new',

    sub: {
      state: 'gate/current',
      obstruction: 'gate/obstruction',
      availability: 'gate/availability',
      updateStatus: 'gate/update/status',
    },

    pub: {
      target: 'gate/target/set',
      stop: 'gate/stop/trigger',
      updateAvailable: 'gate/update/available',
    },
  } as const,
  payload: {
    // PUB

    target: {
      open: 0x00,
      closed: 0x01,
    },

    // SUB

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

    updateStatus: {
      idle: 0x00,
      scheduled: 0x01,
      downloading: 0x02,
      installing: 0x03,
      success: 0x04,
      failed: 0x05,
    },
  } as const,
};

export const Topic = MqttConfig.topic;
export const Payload = MqttConfig.payload;
