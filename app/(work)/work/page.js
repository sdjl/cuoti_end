"use client";

import { BarChart3, Users } from "lucide-react";
// 工作台首页，提供学情看板入口
import Link from "next/link";
import WorkHeader from "../../../components/work/layout/WorkHeader.js";
import { useAuth } from "../../../hooks/useAuth.js";
export default function DashboardPage() {
  const {
    user,
    loading,
    error
  } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">发生错误: {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            重新加载
          </button>
        </div>
      </div>;
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未登录</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            去登录
          </Link>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="学情看板" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* 欢迎区域 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-2">学情看板</h2>
            <p className="opacity-90">
              查看学生学习情况和知识点掌握统计数据，帮助您更好地了解学生的学习状况。
            </p>
          </div>

          {/* 看板入口卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 学生学情看板 */}
            <Link href="/work/dashboard/student" className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                学生学情看板
              </h3>
              <p className="text-gray-600 mb-6">
                查看某个学生在所有班级中的综合学习数据，包括错题统计、知识点掌握情况、答卷记录等
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  按知识树结构显示错题统计
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  查看学生近期提交的答卷
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  学生学情统计分析
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  成长记录观察
                </div>
              </div>
            </Link>

            {/* 知识点学情看板 */}
            <Link href="/work/dashboard/knowledge" className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                知识点学情看板
              </h3>
              <p className="text-gray-600 mb-6">
                按知识树结构查看各班级的知识点掌握情况，统计知识点的做题次数和正确率等数据
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  班级知识点掌握统计
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  查看知识点相关题目
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  题目做题情况统计
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  学生答卷详细数据
                </div>
              </div>
            </Link>
          </div>

          {/* 使用提示 */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  使用提示
                </p>
                <p className="text-sm text-amber-700">
                  学生学情看板仅支持查看已添加到班级中的学生数据，不支持查看新生（未添加到班级的用户）。知识点学情看板会统计班级中所有学生的答卷数据。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
