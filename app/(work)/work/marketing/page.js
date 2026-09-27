"use client";

import { Award, BarChart3, BookOpen, Code, Coins, Edit, FileText, Gift, History, Share2, Trophy, UserPlus, Users } from "lucide-react";
// 营销管理首页，提供邀请码管理、积分兑换、学情记录等功能入口
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useAuth } from "../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../lib/config/constants.js";
import { getPendingTasksStats } from "./actions.js";
// 颜色配置映射
const colorConfig = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-100",
    text: "text-blue-600",
    bgHover: "bg-blue-50"
  },
  green: {
    gradient: "from-green-500 to-green-600",
    bg: "bg-green-100",
    text: "text-green-600",
    bgHover: "bg-green-50"
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-purple-100",
    text: "text-purple-600",
    bgHover: "bg-purple-50"
  },
  orange: {
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-100",
    text: "text-orange-600",
    bgHover: "bg-orange-50"
  },
  red: {
    gradient: "from-red-500 to-red-600",
    bg: "bg-red-100",
    text: "text-red-600",
    bgHover: "bg-red-50"
  },
  indigo: {
    gradient: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    bgHover: "bg-indigo-50"
  },
  yellow: {
    gradient: "from-yellow-500 to-yellow-600",
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    bgHover: "bg-yellow-50"
  }
};
export default function MarketingPage() {
  const {
    user
  } = useAuth();
  const [pendingPointsExchangeCount, setPendingPointsExchangeCount] = useState(0);
  const [pendingLotteryWinCount, setPendingLotteryWinCount] = useState(0);
  const [pendingHonorApplicationCount, setPendingHonorApplicationCount] = useState(0);
  const [guestStudentsNeedContactCount, setGuestStudentsNeedContactCount] = useState(0);
  useEffect(() => {
    const fetchPendingTasksStats = async () => {
      try {
        const stats = await getPendingTasksStats();
        setPendingPointsExchangeCount(stats.pendingPointsExchangeCount);
        setPendingLotteryWinCount(stats.pendingLotteryWinCount);
        setPendingHonorApplicationCount(stats.pendingHonorApplicationCount);
        setGuestStudentsNeedContactCount(stats.guestStudentsNeedContactCount);
      } catch (error) {
        console.error("获取待处理任务数量失败:", error);
      }
    };
    fetchPendingTasksStats();
  }, []);

  // 计算总待办数量
  const totalTodos = pendingPointsExchangeCount + pendingLotteryWinCount + pendingHonorApplicationCount + guestStudentsNeedContactCount;

  // 页面配置（二维数组）
  const sectionsConfig = [{
    sectionTitle: "校园公告",
    badgeText: "分享展示",
    pages: [{
      title: `${DISPLAY_TEXT.COURSE_MISTAKE}再练排行榜`,
      description: `查看各年级的${DISPLAY_TEXT.COURSE_MISTAKE}排行榜`,
      href: "/work/records/mistake-practice/gradeRanking",
      icon: Trophy,
      color: "purple"
    }, {
      title: "积分排行榜",
      description: "查看各年级的积分排行榜",
      href: "/work/records/scoreGradeRanking",
      icon: Gift,
      color: "orange"
    }, {
      title: "全校荣誉",
      description: "查看全校学生获得的荣誉",
      href: "/mobile/schoolNotice/schoolHonor",
      icon: Award,
      color: "yellow",
      openInNewWindow: true,
      requiresSchoolId: true
    }, {
      title: "全校中奖记录",
      description: "查看全校学生的中奖记录",
      href: "/mobile/schoolNotice/schoolLottery",
      icon: Gift,
      color: "orange",
      openInNewWindow: true,
      requiresSchoolId: true
    }]
  }, {
    sectionTitle: "邀请码管理",
    badgeCount: guestStudentsNeedContactCount,
    pages: [{
      title: "学生邀请码",
      description: "查看学生申请的邀请码",
      href: "/work/marketing/invitation/studentCodes",
      icon: Code,
      color: "blue"
    }, {
      title: "合作伙伴邀请码",
      description: "商业合作推广邀请码管理",
      href: "/work/marketing/invitation/partnerCodes",
      icon: Users,
      color: "green"
    }, {
      title: "一次性邀请码",
      description: "用于销售的长期有效邀请码",
      href: "/work/marketing/invitation/onetimeCodes",
      icon: Gift,
      color: "purple"
    }, {
      title: "新生列表",
      description: "使用邀请码后提交姓名、电话的新生",
      href: "/work/marketing/invitation/newStudents",
      icon: UserPlus,
      color: "orange",
      count: guestStudentsNeedContactCount
    }, {
      title: "邀请码使用记录",
      description: "输入邀请码成为体验者的记录",
      href: "/work/marketing/invitation/usageRecords",
      icon: History,
      color: "red"
    }, {
      title: "邀请码使用统计",
      description: "学生邀请码的使用统计",
      href: "/work/marketing/invitation/usageStats",
      icon: BarChart3,
      color: "indigo"
    }]
  }, {
    sectionTitle: "积分与兑换",
    badgeCount: pendingPointsExchangeCount + pendingLotteryWinCount,
    pages: [{
      title: "积分变动记录",
      description: "学生的积分变动日志",
      href: "/work/marketing/score/pointsHistory",
      icon: Coins,
      color: "blue"
    }, {
      title: "积分兑换记录",
      description: "学生使用积分兑换商品与服务",
      href: "/work/marketing/score/exchangeRecords",
      icon: Gift,
      color: "green",
      count: pendingPointsExchangeCount
    }, {
      title: "积分抽奖记录",
      description: "学生使用积分抽奖的日志",
      href: "/work/marketing/score/lotteryRecords",
      icon: Award,
      color: "purple",
      count: pendingLotteryWinCount
    }, {
      title: "分享访问统计",
      description: "统计学生分享页面的效果",
      href: "/work/marketing/score/shareStats",
      icon: Share2,
      color: "orange"
    }, {
      title: "手动修改积分记录",
      description: "查看老师手动修改学生积分日志",
      href: "/work/marketing/score/manualRecords",
      icon: Edit,
      color: "red"
    }]
  }, {
    sectionTitle: "学情与荣誉",
    badgeCount: pendingHonorApplicationCount,
    pages: [{
      title: "学情记录",
      description: "查看老师在小程序端录入的学情记录",
      href: "/work/marketing/study-record/studyRecords",
      icon: FileText,
      color: "blue"
    }, {
      title: "荣誉申请处理",
      description: "处理学生申请荣誉获得积分",
      href: "/work/marketing/study-record/honorApplications",
      icon: Award,
      color: "green",
      count: pendingHonorApplicationCount
    }, {
      title: "学习资料管理",
      description: "管理学习资料文件",
      href: "/work/marketing/study-record/studyMaterials",
      icon: BookOpen,
      color: "purple"
    }]
  }];
  return <>
      <WorkHeader title={`积分与营销（${totalTodos} 个待办）`} />

      <div className="container mx-auto p-6 space-y-8">
        {sectionsConfig.map((section, sectionIndex) => <section key={sectionIndex} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {section.sectionTitle}
              </h2>
              {section.badgeText && <Badge variant="secondary" className="text-xs">
                  {section.badgeText}
                </Badge>}
              {section.badgeCount !== undefined && section.badgeCount > 0 && <Badge variant="destructive" className="text-xs text-white">
                  {section.badgeCount}{" "}
                  {section.sectionTitle === "邀请码管理" ? "个新生需要联系" : "个待处理"}
                </Badge>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.pages.map((page, pageIndex) => {
            const colors = colorConfig[page.color];

            // 处理 URL
            let finalHref = page.href;
            if (page.requiresSchoolId && user?.workSetting?.currentSchool) {
              const separator = page.href.includes("?") ? "&" : "?";
              finalHref = `${page.href}${separator}schoolId=${user.workSetting.currentSchool._id}`;
            }

            // 处理新窗口打开
            const linkProps = page.openInNewWindow ? {
              target: "_blank",
              rel: "noopener noreferrer"
            } : {};
            return <Link key={pageIndex} href={finalHref} className="group h-full" {...linkProps}>
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 h-full flex flex-col">
                      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient}`}></div>
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <page.icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {page.title}
                            </h3>
                            {page.count !== undefined && page.count > 0 && <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {page.count}{" "}
                                  {page.title === "新生列表" ? "个需要联系" : "个待处理"}
                                </span>
                              </div>}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{page.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className={`text-sm font-medium ${colors.text}`}>
                            立即查看
                          </span>
                          <div className={`w-8 h-8 rounded-full ${colors.bgHover} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>;
          })}
            </div>
          </section>)}
      </div>
    </>;
}
