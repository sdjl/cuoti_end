export const APP_TITLE = "错题管家";
export const APP_NAME = "cuoti";

// 图片配置
export const IMAGE_CONFIG = {
  // 生产环境图片域名
  PROD_IMAGE_DOMAIN: "https://cloud1-5gta52p99cb389c8-1358652060.tcloudbaseapp.com",
  // 开发环境图片路径前缀
  DEV_IMAGE_PREFIX: "/images",
  // 生产环境图片路径前缀
  PROD_IMAGE_PREFIX: "/cuoti/next"
};

// Footer 配置
export const FOOTER_CONFIG = {
  // 公司信息
  companyName: "长沙谦益澎湃教育科技服务有限公司",
  creditCode: "91430104MA7EPY650E",
  slogan: "错题管家，点亮你的技能树！",
  copyright: `© ${new Date().getFullYear()} ${APP_TITLE}. 保留所有权利。`,
  // 社交媒体链接
  socialLinks: [{
    name: "facebook",
    url: "#"
  }, {
    name: "twitter",
    url: "#"
  }, {
    name: "instagram",
    url: "#"
  }],
  // 联系方式
  contact: {
    address: "湖南省长沙市湘江新区长房时代国际写字楼910",
    email: "",
    phone: "0731-84899748",
    beian: "湘ICP备2025122716号",
    netSecurityRecord: "网安备案：（备案中）"
  },
  // 服务时间
  serviceHours: [{
    day: "周二、三",
    hours: "休息"
  }, {
    day: "其他时间",
    hours: "9:00 - 18:00"
  }],
  // 法律信息
  legal: {
    companyFullName: "长沙谦益澎湃教育科技服务有限公司",
    userAgreement: {
      title: "用户协议",
      url: "/user-agreement"
    },
    privacyPolicy: {
      title: "隐私政策",
      url: "/privacy-policy"
    }
  }
};
/**
 * 系统配置键名常量
 */
export const CONFIG_KEYS = {
  SUBJECTS: "subjects_config",
  QUESTION_TYPES: "question_types_config",
  REGIONS: "regions_config",
  KNOWLEDGE_STATS: "knowledge_stats_config",
  MINIPROGRAM: "default_miniprogram",
  MARKETING_CONFIG: "marketing_config"
};

// 图片文件大小限制（单位：MB）
export const MAX_IMAGE_SIZE_MB = 10;

// 图片文件大小限制（单位：字节）
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// 图片格式对应的文件扩展名
export const IMAGE_TYPE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

/**
 * JWT认证配置
 * 用于用户身份验证和会话管理
 */
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "",
  issuer: "cuoti-app",
  // 签发者
  audience: "cuoti-users",
  // 受众
  defaultExpiresIn: 7 * 24 * 60 * 60,
  // 默认过期时间（7天）
  activeThreshold: 60 * 60 // 活跃时间阈值（1小时）
};

/** 通用Agent Bot ID
 * 对应CloudBase中ibot-cuoti这个函数型云托管服务
 */
export const COMMON_AGENT_BOT_ID = "ibot-cuoti-common";

/**
 * 前端显示文案配置
 * 用于统一管理前端显示的业务术语
 */
export const DISPLAY_TEXT = {
  /** 课程错题 - 对应 StudentAnswerDoc, StudentAnswerItemDoc 数据类型 */
  COURSE_MISTAKE: "课程错题",
  /** 自主上传错题 - 对应 ProblemQuestionDoc, GuestProblemQuestionDoc 数据类型 */
  SELF_UPLOAD_MISTAKE: "自主上传错题",
  /** 口述核心知识点 - 对应 QuizDoc, QuizTakeDoc 数据类型 */
  ORAL_KNOWLEDGE_QUIZ: "口述核心知识点",
  /** 错误归因 - 对应 MistakePointDoc 数据类型 */
  ERROR_ATTRIBUTION: "错误归因"
};

/**
 * 域名配置
 * 统一管理系统使用的域名
 */
export const DOMAIN = {
  /** 生产环境域名（HTTPS） */
  PROD: "https://pengpaiup.cn",
  /** 开发环境域名（HTTP localhost） */
  DEV: "http://localhost:3000",
  /** 纯域名（不带协议） */
  BASE: "pengpaiup.cn",
  /** 本地开发主机名（不带协议和端口） */
  LOCALHOST: "localhost"
};
