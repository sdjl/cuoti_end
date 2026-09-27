export const DEFAULT_MARKETING_CONFIG = {
  invitationCode: {
    student: {
      enabled: false,
      codeLength: 6,
      defaultValidDays: 30,
      inviterBenefit: "分享获得积分奖励",
      inviteeBenefit: "使用邀请码可获得额外体验时长",
      promotionText: "我正在使用错题本，效果很好！快来试试吧，使用我的邀请码：{code}",
      experienceDays: 7
    },
    partner: {
      codeLength: 8,
      defaultValidDays: 365,
      experienceDescription: "体验全部功能",
      defaultExperienceDays: 30
    },
    onetime: {
      codeLength: 10,
      defaultValidDays: 90,
      defaultExperienceDays: 15,
      experienceDescription: "一次性体验码"
    }
  }
};
