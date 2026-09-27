import { Bot, FileText, Gift, LayoutDashboard, Package, School, Settings, Users } from "lucide-react";
import React from "react";
/**
 * 创建图标元素的函数，统一图标样式
 */
const createIcon = Icon => {
  return React.createElement(Icon, {
    className: "w-5 h-5"
  });
};
export const workMenuItems = [{
  icon: createIcon(LayoutDashboard),
  label: "学情看板",
  href: "/work",
  allowWorkAssistant: false
}, {
  icon: createIcon(School),
  label: "我的校园",
  href: "/work/school",
  allowWorkAssistant: false
}, {
  icon: createIcon(Users),
  label: "我的班级",
  href: "/work/classroom",
  allowWorkAssistant: false
}, {
  icon: createIcon(FileText),
  label: "上传答卷",
  href: "/work/answer",
  allowWorkAssistant: true
}, {
  icon: createIcon(Package),
  label: "创建题集",
  href: "/work/create-pack",
  allowWorkAssistant: false
}, {
  icon: createIcon(Bot),
  label: "AI学习记录",
  href: "/work/records",
  allowWorkAssistant: false
}, {
  icon: createIcon(Gift),
  label: "积分与营销",
  href: "/work/marketing",
  allowWorkAssistant: false
}, {
  icon: createIcon(Settings),
  label: "设置",
  href: "/work/setting",
  allowWorkAssistant: false
}];

/**
 * 工作台助教可访问的路径前缀列表
 * 用于 middleware 和组件中判断是否允许访问
 */
export const WORK_ASSISTANT_ALLOWED_PATHS = ["/work/answer", "/work/setting"];
