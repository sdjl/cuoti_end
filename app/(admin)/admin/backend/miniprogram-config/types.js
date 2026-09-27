











export const DEFAULT_MINIPROGRAM_CONFIG = {
  contacts: {
    qrcodeUrl: "",
    qrcodeVersion: 0,
    qrcodeFileId: ""
  },
  systemLogo: {
    logoUrl: "",
    logoVersion: 0,
    logoFileId: ""
  },
  copywriting: {
    appName: "",
    slogan: ""
  },
  aiMistakePractice: {
    botId: "",
    masteryJudgmentBotId: "",
    sendQuestionImage: true,
    allowStudentUploadImage: true,
    sendQuestionText: true,
    sendQuestionAnswer: true,
    sendQuestionExplanation: true,
    sendRelatedKnowledge: true,
    sendCommonMistakes: true,
    sendReferenceQuestions: true,
    showThinkingChain: false,
    additionalPrompt: "",
    allowStudentMarkMastered: true,
    minimumMessageCount: 0,
    minimumWaitTime: 0,
    rewardPoints: 0,
    quickReplies: []
  },
  aiProblem: {
    botId: "",
    masteryJudgmentBotId: "",
    knowledgeAnalysisBotId: "",
    difficultyAnalysisBotId: "",
    sendQuestionImage: true,
    allowStudentUploadImage: true,
    sendRelatedKnowledge: true,
    showThinkingChain: false,
    showThinkingChainOnCreate: false,
    allowStudentDeleteKnowledge: false,
    allowStudentAddKnowledge: false,
    maxKnowledgePointsPerQuestion: 5,
    defaultMessage: "",
    minimumMessageCount: 0,
    minimumWaitTime: 0,
    rewardPoints: 0,
    quickReplies: []
  },
  unloggedIntroduction: {
    videoAccountId: "",
    carouselVideos: [],
    listVideos: []
  },
  loggedIntroduction: {
    carouselVideos: []
  },
  newbieQuiz: {
    solutionComparisonPromptTemplate: ""
  }
};
