"use client";

// 使用说明页面，展示系统使用指南和权限申请流程
import Link from "next/link";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
export default function InstructionsPage() {
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
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="使用说明" showBackButton={true} backHref="/work/setting" backText="返回设置" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* 欢迎区域 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  欢迎使用错题管家，{user.userWxInfo.nickname || "用户"}！
                </h2>
                <p className="opacity-90 mb-4">
                  请先了解系统使用说明，然后联系相关人员为您添加对应权限。
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
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
              <p className="text-sm font-medium mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                重要提示
              </p>
              <p className="text-sm opacity-90">
                添加权限时需要提供您的openid，请点击右上角的&ldquo;复制我的openid&rdquo;按钮，将openid发送给相关管理员。
              </p>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧主内容 */}
            <div className="lg:col-span-2">
              {/* 权限申请指南 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">权限申请指南</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 校园管理员申请 */}
                  <div className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-base">校园管理员</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      如果您是学校的管理员，需要管理整个校园的事务
                    </p>
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-purple-800 mb-2">
                        申请步骤：
                      </p>
                      <ol className="text-sm text-purple-700 space-y-1">
                        <li>1. 复制您的openid</li>
                        <li>2. 联系错题管家后台工作人员</li>
                        <li>3. 提供openid申请校园管理权限</li>
                      </ol>
                    </div>
                    <div className="flex items-center text-sm text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      需要联系系统管理员
                    </div>
                  </div>

                  {/* 班级老师申请 */}
                  <div className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-base">班级老师</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      如果您是学校的老师，只需要管理自己的班级
                    </p>
                    <div className="bg-green-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        申请步骤：
                      </p>
                      <ol className="text-sm text-green-700 space-y-1">
                        <li>1. 复制您的openid</li>
                        <li>2. 联系您学校的校园管理员</li>
                        <li>3. 提供openid申请班级管理权限</li>
                      </ol>
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      需要联系校园管理员
                    </div>
                  </div>
                </div>
              </div>

              {/* 权限角色说明 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">权限角色说明</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mr-2">
                        校
                      </span>
                      &ldquo;校长&rdquo;权限
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          管理整个校园的所有事务
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          创建和管理所有班级
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          管理所有老师和学生
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          拥有校园的所有权限
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center mr-2">
                        师
                      </span>
                      老师权限
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          管理自己负责的班级
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          管理班级内的学生
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          上传班级学习数据
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        <span className="text-sm text-gray-500">
                          无法管理其他班级
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 校长操作步骤 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">
                    &ldquo;校长&rdquo;操作步骤
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* 步骤1：添加教师 */}
                  <div className="border border-purple-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          添加教师
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          让其他人把openid复制给校长，然后校长进入&ldquo;我的校园&rdquo;页面
                        </p>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-purple-700 mb-2">
                            操作路径：
                          </p>
                          <p className="text-sm text-purple-600">
                            我的校园 → 教师页面 → 使用openid添加教师
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 步骤2：创建班级 */}
                  <div className="border border-purple-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          创建班级并指定老师
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          创建班级后需要为这个班级指定管理老师
                        </p>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-purple-700 mb-2">
                            操作要点：
                          </p>
                          <ul className="text-sm text-purple-600 space-y-1">
                            <li>• 创建班级时选择负责的老师</li>
                            <li>• 一个老师可以管理多个班级</li>
                            <li>• 班级创建后可以修改负责老师</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 步骤3：设置课程 */}
                  <div className="border border-purple-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          设置校园课程
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          创建课程并添加试卷，为班级分配课程
                        </p>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-purple-700 mb-2">
                            课程管理：
                          </p>
                          <ul className="text-sm text-purple-600 space-y-1">
                            <li>• 一个校园可以有多个课程</li>
                            <li>• 一个课程可以包含多个试卷</li>
                            <li>• 课程可以给多个班级重复使用</li>
                            <li>• 在班级中设置使用哪些课程</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 特别说明 */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-purple-800 mb-1">
                          特别说明
                        </p>
                        <p className="text-sm text-purple-700">
                          校长不需要添加学生，这项工作由老师完成。但校长拥有老师的所有权限，老师能做的事情，校长也能做。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 老师操作步骤 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">老师操作步骤</h3>
                </div>

                <div className="space-y-4">
                  {/* 前提条件 */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">
                          前提条件
                        </p>
                        <p className="text-sm text-green-700">
                          老师被校长添加为某个班级的管理老师后，可以在&ldquo;我的班级&rdquo;页面看见自己管理的班级。老师可以同时管理多个班级。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 步骤1：添加学生 */}
                  <div className="border border-green-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          添加班级学生
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          为班级添加学生信息，支持单个添加和批量导入
                        </p>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-700 mb-2">
                            添加方式：
                          </p>
                          <ul className="text-sm text-green-600 space-y-1">
                            <li>• 单个学生添加：逐个输入学生信息</li>
                            <li>• Excel批量导入：使用表格批量添加</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 重要提醒 */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          重要提醒
                        </p>
                        <p className="text-sm text-amber-700">
                          学生编号在每个学校内必须唯一！系统以学生编号识别学生身份，相同编号会被认为是同一个学生。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 步骤2：上传答卷 */}
                  <div className="border border-green-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          上传学生答卷
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          上传学生的答卷文件，为AI分析做准备
                        </p>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-700 mb-2">
                            支持格式：
                          </p>
                          <ul className="text-sm text-green-600 space-y-1">
                            <li>• 需要一份一份的上传</li>
                            <li>
                              • 上传的时候勾选学生做错的题目，做对的题目无需勾选
                            </li>
                            <li>• 需要上传学生每一道错题裁剪后的照片</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 步骤3：AI分析与沟通 */}
                  <div className="border border-green-100 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">
                          AI分析与沟通
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          使用AI分析学生答卷，生成学习报告并与学生和家长沟通
                        </p>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-700 mb-2">
                            功能包括：
                          </p>
                          <ul className="text-sm text-green-600 space-y-1">
                            <li>• AI自动识别和分析答卷内容</li>
                            <li>• 生成个性化学习报告</li>
                            <li>• 错题统计和知识点分析</li>
                            <li>• 与学生和家长分享分析结果</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div>
              {/* 多校园管理提醒 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">多校园管理</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      重要说明
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 您可以同时拥有多个学校的权限</li>
                      <li>• 可以在A学校当&ldquo;校长&rdquo;，在B学校当老师</li>
                      <li>• 同一时间只能管理一个学校</li>
                      <li>• 需要切换学校时，请到设置页面操作</li>
                    </ul>
                  </div>
                  <Link href="/work/setting/curr-school" className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    前往设置页面
                  </Link>
                </div>
              </div>

              {/* 快速操作 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">快速操作</h3>
                <div className="space-y-3">
                  <button onClick={copyOpenidToClipboard} className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">复制我的openid</span>
                  </button>

                  <Link href="/work/setting" className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">系统设置</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
