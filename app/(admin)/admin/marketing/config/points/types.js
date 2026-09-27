export const DEFAULT_POINTS_SYSTEM = {
  invitation: {
    pointsPerUse: 10
  },
  sharing: {
    pointsPerShare: 5,
    dailyLimit: 50,
    cooldownDays: 1,
    sameWechatLimit: 100,
    shareDays: 7
  },
  personalMistake: {
    pointsPerUpload: 2,
    dailyLimit: 20
  },
  lottery: {
    enabled: false,
    pointsPerDraw: 10,
    prizes: []
  },
  exchange: {
    enabled: false,
    items: []
  },
  honor: {
    enabled: false,
    honors: []
  }
};
export const DEFAULT_MARKETING_CONFIG = {
  pointsSystem: DEFAULT_POINTS_SYSTEM
};
