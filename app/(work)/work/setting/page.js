"use client";

// 工作台设置页面，提供个人设置和校园管理相关的功能入口
import Link from "next/link";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useAuth } from "../../../../hooks/useAuth.js";
export default function SettingPage() {
  const {
    user,
    loading,
    error,
    getOpenid
  } = useAuth();
  const {
    toast
  } = useToast();

  // 复制openid到剪贴板
  const copyOpenidToClipboard = async () => {
    const openid = getOpenid();
    if (!openid) {
      toast({
        title: "复制失败",
        description: "无法获取用户openid",
        variant: "destructive"
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(openid);
      toast({
        title: "复制成功",
        description: "openid已复制到剪贴板"
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };
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

  // 获取当前管理的校园信息
  const currentSchool = user.workSetting?.currentSchool;
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="工作台设置" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* 设置中心区域 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">设置中心</h2>
                <p className="opacity-90 mb-4">
                  管理您的工作台偏好设置，自定义您的工作环境。
                </p>
              </div>
              {/* 复制openid按钮 */}
              <button onClick={copyOpenidToClipboard} className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制我的openid
              </button>
            </div>
          </div>

          {/* 个人设置 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">个人设置</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 个人信息卡片 */}
              <Link href="/work/setting/my-info" className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base mb-2">我的信息</h4>
                <p className="text-sm text-gray-600 mb-3">
                  查看和编辑您的个人信息
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {user.userInfo?.name || "未设置姓名"}
                  </span>
                </div>
              </Link>

              {/* 使用说明卡片 */}
              <Link href="/work/setting/instructions" className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base mb-2">使用说明</h4>
                <p className="text-sm text-gray-600 mb-3">
                  查看系统使用说明和操作指南
                </p>
              </Link>
            </div>
          </div>

          {/* 校园管理设置 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">校园管理</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 当前校园卡片 */}
              {currentSchool ? <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full font-medium">
                      当前管理
                    </span>
                  </div>
                  <h4 className="font-semibold text-base mb-2">当前校园</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    您当前正在管理的校园
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        校园名称
                      </span>
                      <span className="text-sm text-gray-900">
                        {currentSchool.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        所在区域
                      </span>
                      <span className="text-sm text-gray-900">
                        {currentSchool.region}
                      </span>
                    </div>
                    {currentSchool.address && <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          地址
                        </span>
                        <span className="text-sm text-gray-900 text-right max-w-[200px]">
                          {currentSchool.address}
                        </span>
                      </div>}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        状态
                      </span>
                      <span className={`text-sm px-2 py-1 rounded-full ${currentSchool.status === "正常" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {currentSchool.status}
                      </span>
                    </div>
                  </div>
                </div> : <div className="border border-gray-100 rounded-lg p-4 opacity-60">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                      未设置
                    </span>
                  </div>
                  <h4 className="font-semibold text-base mb-2 text-gray-500">
                    当前校园
                  </h4>
                  <p className="text-sm text-gray-400 mb-3">
                    您还没有设置当前管理的校园
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      请先选择要管理的校园
                    </span>
                  </div>
                </div>}

              {/* 校园切换卡片 */}
              <Link href="/work/setting/curr-school" className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base mb-2">校园切换</h4>
                <p className="text-sm text-gray-600 mb-3">
                  切换您当前管理的校园，设置默认操作范围
                </p>
              </Link>

              {/* 年级管理卡片 */}
              <Link href="/work/setting/grade-list" className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base mb-2">年级管理</h4>
                <p className="text-sm text-gray-600 mb-3">
                  设置和管理校园的年级列表，支持拖拽排序
                </p>
              </Link>

              {/* 导入学生配置卡片 */}
              <Link href="/work/setting/import-student" className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-base mb-2">导入学生配置</h4>
                <p className="text-sm text-gray-600 mb-3">
                  配置Excel表格导入学生时的字段映射关系
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
