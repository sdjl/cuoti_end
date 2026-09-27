"use client";

// AI学习记录首页，展示各类学习记录功能的入口，包括课程错题、自主上传错题、新生自主上传错题和口头知识问答等模块
import { BarChart3, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useAuth } from "../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../lib/config/constants.js";
import { getTeacherHelpStats } from "./actions.js";
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
  red: {
    gradient: "from-red-500 to-red-600",
    bg: "bg-red-100",
    text: "text-red-600",
    bgHover: "bg-red-50"
  },
  orange: {
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-100",
    text: "text-orange-600",
    bgHover: "bg-orange-50"
  },
  yellow: {
    gradient: "from-yellow-500 to-yellow-600",
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    bgHover: "bg-yellow-50"
  }
};
export default function RecordsPage() {
  const {
    user
  } = useAuth();
  const [mistakePracticeTeacherHelpCount, setMistakePracticeTeacherHelpCount] = useState(0);
  const [problemQuestionTeacherHelpCount, setProblemQuestionTeacherHelpCount] = useState(0);
  const [guestProblemQuestionTeacherHelpCount, setGuestProblemQuestionTeacherHelpCount] = useState(0);
  useEffect(() => {
    const fetchTeacherHelpCounts = async () => {
      try {
        const stats = await getTeacherHelpStats();
        setMistakePracticeTeacherHelpCount(stats.mistakePracticeTeacherHelpCount);
        setProblemQuestionTeacherHelpCount(stats.problemQuestionTeacherHelpCount);
        setGuestProblemQuestionTeacherHelpCount(stats.guestProblemQuestionTeacherHelpCount);
      } catch (error) {
        console.error("获取老师帮助数量失败:", error);
      }
    };
    fetchTeacherHelpCounts();
  }, []);

  // 计算总待办数量
  const totalTodos = mistakePracticeTeacherHelpCount + problemQuestionTeacherHelpCount + guestProblemQuestionTeacherHelpCount;

  // 页面配置（二维数组）
  const sectionsConfig = [{
    sectionTitle: DISPLAY_TEXT.COURSE_MISTAKE,
    badgeCount: mistakePracticeTeacherHelpCount,
    pages: [{
      title: `${DISPLAY_TEXT.COURSE_MISTAKE}使用日志`,
      description: `查看学生${DISPLAY_TEXT.COURSE_MISTAKE}的题目详情`,
      href: "/work/records/mistake-practice/useLogs",
      icon: FileText,
      color: "blue"
    }, {
      title: `${DISPLAY_TEXT.COURSE_MISTAKE}使用统计`,
      description: `${DISPLAY_TEXT.COURSE_MISTAKE}功能的整体使用情况统计和分析报告`,
      href: "/work/records/mistake-practice/useStat",
      icon: BarChart3,
      color: "green"
    }, {
      title: "老师帮助",
      description: "查看需要老师帮助的学生问题",
      href: "/work/records/mistake-practice/teacherReply",
      icon: MessageCircle,
      color: "red",
      count: mistakePracticeTeacherHelpCount
    }]
  }, {
    sectionTitle: DISPLAY_TEXT.SELF_UPLOAD_MISTAKE,
    badgeCount: problemQuestionTeacherHelpCount,
    pages: [{
      title: `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用日志`,
      description: `查看学生使用${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}功能的详细记录和对话数据`,
      href: "/work/records/problem/useLogs",
      icon: FileText,
      color: "blue"
    }, {
      title: `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用统计`,
      description: `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}功能的整体使用情况统计和分析报告`,
      href: "/work/records/problem/useStat",
      icon: BarChart3,
      color: "green"
    }, {
      title: "老师帮助",
      description: "查看需要老师帮助的学生问题",
      href: "/work/records/problem/teacherReply",
      icon: MessageCircle,
      color: "red",
      count: problemQuestionTeacherHelpCount
    }]
  }, {
    sectionTitle: `新生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}`,
    badgeCount: guestProblemQuestionTeacherHelpCount,
    pages: [{
      title: `新生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用日志`,
      description: `查看新生用户使用${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}功能的详细记录和对话数据`,
      href: "/work/records/guestProblem/useLogs",
      icon: FileText,
      color: "blue"
    }, {
      title: `新生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用统计`,
      description: `新生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}功能的整体使用情况统计和分析报告`,
      href: "/work/records/guestProblem/useStat",
      icon: BarChart3,
      color: "green"
    }, {
      title: "新生老师帮助",
      description: "查看需要老师帮助的新生用户问题",
      href: "/work/records/guestProblem/teacherReply",
      icon: MessageCircle,
      color: "red",
      count: guestProblemQuestionTeacherHelpCount
    }]
  }, {
    sectionTitle: DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ,
    badgeText: "口头解答",
    pages: [{
      title: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}列表`,
      description: `管理校园的${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}，创建、编辑和查看${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态`,
      href: "/work/quiz/list",
      icon: FileText,
      color: "blue"
    }, {
      title: "学生提交答案",
      description: `查看学生提交的${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}答案和解答过程记录`,
      href: "/work/quiz/takeList",
      icon: BarChart3,
      color: "green"
    }, {
      title: "队伍管理",
      description: `管理学生创建的${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}队伍，查看队伍信息和成员列表`,
      href: "/work/quiz/team",
      icon: MessageCircle,
      color: "purple"
    }]
  }];
  return <>
      <WorkHeader title={`学生的AI学习记录（${totalTodos} 个待办）`} />

      <div className="container mx-auto p-6 space-y-8">
        {sectionsConfig.map((section, sectionIndex) => <section key={sectionIndex} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {section.sectionTitle}
              </h2>
              {section.badgeCount !== undefined && section.badgeCount > 0 ? <Badge variant="destructive" className="text-xs text-white">
                  {section.badgeCount}
                </Badge> : section.badgeCount !== undefined ? <Badge variant="secondary" className="text-xs text-green-600 bg-green-100">
                  暂无需要帮助的学生
                </Badge> : section.badgeText ? <Badge variant="secondary" className="text-xs text-blue-600 bg-blue-100">
                  {section.badgeText}
                </Badge> : null}
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${section.pages.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6`}>
              {section.pages.map((page, pageIndex) => {
            const colors = colorConfig[page.color];

            // 处理链接点击
            const handleClick = e => {
              if (page.openInNewWindow) {
                e.preventDefault();
                let url = page.href;
                if (page.requiresSchoolId) {
                  const schoolId = user?.workSetting?.currentSchool?._id;
                  if (schoolId) {
                    url = `${page.href}?schoolId=${encodeURIComponent(schoolId)}`;
                  }
                }
                window.open(url, "_blank");
              }
            };
            return <Link key={pageIndex} href={page.href} className="group h-full" onClick={handleClick}>
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
                                  {page.title.includes("新生") ? "个新生需要帮助" : "个学生需要帮助"}
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
