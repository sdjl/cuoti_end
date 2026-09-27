"use client";

import { BookOpen, FileText, FolderOpen, List, TrendingUp, Users } from "lucide-react";
// 错题包功能入口页，罗列各类错题与题集相关的子页面导航
import Link from "next/link";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
// 颜色配置映射
const colorConfig = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-100",
    text: "text-blue-600",
    bgHover: "bg-blue-50"
  },
  cyan: {
    gradient: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    bgHover: "bg-cyan-50"
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
  amber: {
    gradient: "from-amber-500 to-amber-600",
    bg: "bg-amber-100",
    text: "text-amber-600",
    bgHover: "bg-amber-50"
  }
};

// 页面配置（二维数组）
const sectionsConfig = [{
  sectionTitle: "错题集",
  pages: [{
    title: "批量生成错题集",
    description: "根据学生的错题数据，为学生生成错题集PDF文件，不会在系统中创建题集数据",
    href: "/work/create-pack/mistake-batch",
    icon: FileText,
    color: "green"
  }, {
    title: "已创建任务",
    description: "查看已创建的错题集生成任务，跟踪任务进度和下载文件",
    href: "/work/create-pack/mistake-batch/list",
    icon: List,
    color: "purple"
  }]
}, {
  sectionTitle: "定制题集",
  pages: [{
    title: "定制题集",
    description: "根据学生的薄弱知识点为学生定制题集，会在系统中创建题集数据",
    href: "/work/create-pack/knowledge",
    icon: BookOpen,
    color: "blue"
  }, {
    title: "最近创建定制题集的学生",
    description: "查看最近为哪些学生创建了定制题集，快速找到相关记录",
    href: "/work/create-pack/knowledge/list",
    icon: Users,
    color: "cyan"
  }]
}, {
  sectionTitle: "高频错题集",
  pages: [{
    title: "创建高频错题集",
    description: "根据知识点或错误归因筛选出高频错题，生成高频错题集PDF文件",
    href: "/work/create-pack/frequent-mistake",
    icon: TrendingUp,
    color: "orange"
  }, {
    title: "已创建高频错题集",
    description: "查看已创建的高频错题集，下载PDF文件或查看详细信息",
    href: "/work/create-pack/frequent-mistake/list",
    icon: FolderOpen,
    color: "amber"
  }]
}];
export default function CreatePackIndexPage() {
  return <>
      <WorkHeader title="创建题集" />

      <div className="container mx-auto p-6 space-y-8">
        {sectionsConfig.map((section, sectionIndex) => <section key={sectionIndex} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {section.sectionTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.pages.map((page, pageIndex) => {
            const colors = colorConfig[page.color];
            return <Link key={pageIndex} href={page.href} className="group h-full">
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
