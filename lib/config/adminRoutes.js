import { BookOpen, Cog, FileText, LayoutDashboard, Megaphone, Users } from "lucide-react";
import React from "react";

/**
 * 单个路由的类型定义
 */

/**
 * 菜单项类型定义（用于侧边导航菜单）
 */

/**
 * 后台管理路由配置（无限层嵌套结构）
 * 注意：path字段支持动态路由参数，如 "[id]", "[pageNumber]" 等
 */
export const adminRouteConfig = {
  path: "admin",
  name: "首页",
  children: {
    "exam-papers": {
      path: "exam-papers",
      name: "试卷列表",
      children: {
        detail: {
          path: "detail",
          name: "试卷详情"
        },
        edit: {
          path: "[id]/edit",
          name: "编辑试卷"
        },
        create: {
          path: "create",
          name: "创建试卷"
        },
        view: {
          path: "[id]/view",
          name: "查看试卷"
        },
        questions: {
          path: "[id]/questions",
          name: "查看题目",
          children: {
            "edit-content": {
              path: "[pageNumber]/[questionNumber]/edit-content",
              name: "修改题目内容"
            },
            "edit-image": {
              path: "[pageNumber]/[questionNumber]/edit-image",
              name: "修改题目坐标"
            }
          }
        }
      }
    },
    "exam-cutting": {
      path: "exam-cutting",
      name: "试卷切题",
      children: {
        detail: {
          path: "[id]",
          name: "切题详情"
        }
      }
    },
    "exam-analysis": {
      path: "exam-analysis",
      name: "试卷解析",
      children: {
        "upload-pdf": {
          path: "[id]/upload-pdf",
          name: "上传解析PDF"
        },
        analysis: {
          path: "[id]/analysis",
          name: "分析"
        }
      }
    },
    "exam-answers": {
      path: "exam-answers",
      name: "答卷列表"
    },
    schools: {
      path: "schools",
      name: "校园列表",
      children: {
        create: {
          path: "create",
          name: "新增校园"
        }
      }
    },
    "school-admins": {
      path: "school-admins",
      name: "校长设置",
      children: {
        edit: {
          path: "[id]/edit",
          name: "编辑校长"
        }
      }
    },
    user: {
      path: "user",
      name: "用户列表",
      children: {
        edit: {
          path: "[id]/edit",
          name: "编辑用户"
        }
      }
    },
    marketing: {
      path: "marketing",
      name: "营销与宣传",
      children: {
        videos: {
          path: "videos",
          name: "视频列表"
        },
        "config/invitation": {
          path: "config/invitation",
          name: "邀请配置"
        },
        "config/points": {
          path: "config/points",
          name: "积分配置"
        }
      }
    },
    knowledge: {
      path: "knowledge",
      name: "知识点管理",
      children: {
        tree: {
          path: "tree",
          name: "知识树管理"
        },
        questions: {
          path: "questions",
          name: "知识点题目"
        }
      }
    },
    mistake: {
      path: "mistake",
      name: "错误归因"
    },
    "report-templates": {
      path: "report-templates",
      name: "单次报告模板"
    },
    "comprehensive-templates": {
      path: "comprehensive-templates",
      name: "综合报告模板"
    },
    backend: {
      path: "backend",
      name: "后台运行逻辑",
      children: {
        config: {
          path: "config",
          name: "系统配置"
        },
        "ai-config": {
          path: "ai-config",
          name: "AI配置"
        },
        "statistics-config": {
          path: "statistics-config",
          name: "统计配置"
        },
        "run-config": {
          path: "run-config",
          name: "功能配置"
        },
        "miniprogram-config": {
          path: "miniprogram-config",
          name: "小程序配置"
        }
      }
    },
    "questions-interaction": {
      path: "questions/interaction",
      name: "AI生成互动问题"
    }
  }
};

/**
 * 创建图标元素的函数，统一图标样式
 */
const createIcon = Icon => {
  return React.createElement(Icon, {
    className: "h-5 w-5"
  });
};

/**
 * 左侧导航菜单数据
 */
export const adminMenuItems = [{
  title: "首页",
  icon: createIcon(LayoutDashboard),
  href: "/admin",
  allowAdminEditor: true
}, {
  title: "试卷管理",
  icon: createIcon(FileText),
  allowAdminEditor: true,
  children: [{
    name: "试卷列表",
    href: "/admin/exam-papers"
  }, {
    name: "试卷切题",
    href: "/admin/exam-cutting"
  }, {
    name: "试卷解析",
    href: "/admin/exam-analysis"
  }]
}, {
  title: "校园管理",
  icon: createIcon(Users),
  allowAdminEditor: false,
  children: [{
    name: "校园列表",
    href: "/admin/schools"
  }, {
    name: "校长设置",
    href: "/admin/school-admins"
  }]
}, {
  title: "知识点管理",
  icon: createIcon(BookOpen),
  allowAdminEditor: false,
  children: [{
    name: "知识树管理",
    href: "/admin/knowledge/tree"
  }, {
    name: "知识点题目",
    href: "/admin/knowledge/questions"
  }, {
    name: "错误归因",
    href: "/admin/mistake"
  }]
}, {
  title: "用户管理",
  icon: createIcon(Users),
  href: "/admin/user",
  allowAdminEditor: false
}, {
  title: "营销与宣传",
  icon: createIcon(Megaphone),
  allowAdminEditor: false,
  children: [{
    name: "视频列表",
    href: "/admin/marketing/videos"
  }, {
    name: "邀请配置",
    href: "/admin/marketing/config/invitation"
  }, {
    name: "积分配置",
    href: "/admin/marketing/config/points"
  }]
}, {
  title: "后台运行逻辑",
  icon: createIcon(Cog),
  allowAdminEditor: false,
  children: [{
    name: "系统配置",
    href: "/admin/backend/config"
  }, {
    name: "AI配置",
    href: "/admin/backend/ai-config"
  }, {
    name: "统计配置",
    href: "/admin/backend/statistics-config"
  }, {
    name: "功能配置",
    href: "/admin/backend/run-config"
  }, {
    name: "小程序配置",
    href: "/admin/backend/miniprogram-config"
  }]
}];

/**
 * 后台编辑用户可访问的路径前缀列表
 * 用于 middleware 和组件中判断是否允许访问
 */
export const ADMIN_EDITOR_ALLOWED_PATHS = ["/admin/exam-papers", "/admin/exam-cutting", "/admin/exam-analysis"];
