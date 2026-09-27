"use client";

// 工作台演示页面，展示工作台的主要功能和入口
import Link from "next/link";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useAuth } from "../../../../hooks/useAuth.js";
export default function WorkPage() {
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
      <WorkHeader title="园丁工作台" rightContent={<div className="relative">
            <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-red-500"></span>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>} />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {/* 欢迎区域 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  欢迎回来，{user.userWxInfo.nickname || "用户"}！
                </h2>
                <p className="opacity-90 mb-4">
                  继续您的学习旅程，今天有新的课程更新。
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
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex-1 min-w-[200px]">
                <p className="text-sm font-medium opacity-80">总学习时间</p>
                <p className="text-2xl font-bold mt-1">42.5 小时</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex-1 min-w-[200px]">
                <p className="text-sm font-medium opacity-80">已完成课程</p>
                <p className="text-2xl font-bold mt-1">8 / 12</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex-1 min-w-[200px]">
                <p className="text-sm font-medium opacity-80">知识点掌握</p>
                <p className="text-2xl font-bold mt-1">78%</p>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧主内容 */}
            <div className="lg:col-span-2">
              {/* 推荐课程 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">推荐课程</h3>
                  <Link href="/work/courses" className="text-primary text-sm font-medium flex items-center">
                    查看全部
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => <div key={i} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          课程封面图片 {i}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            投资基础
                          </span>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-400">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 ml-1">
                              4.8
                            </span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-base mb-1">
                          投资组合策略与风险管理
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          学习如何建立多元化投资组合，降低风险并提高回报率。
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium text-primary">
                            18 课时
                          </span>
                          <Link href="#" className="text-sm font-medium text-primary hover:underline">
                            继续学习
                          </Link>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* 学习进度和统计 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">学习进度</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      知识点掌握度
                    </h4>
                    <div className="flex flex-col gap-3">
                      {["基础概念", "市场分析", "投资策略", "风险控制"].map((item, index) => <div key={index}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">
                                {item}
                              </span>
                              <span className="text-sm font-medium">
                                {75 + index * 5}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-primary rounded-full h-2" style={{
                          width: `${75 + index * 5}%`
                        }}></div>
                            </div>
                          </div>)}
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      最近完成的测验
                    </h4>
                    <div className="space-y-3">
                      {[{
                      name: "投资基础概念测验",
                      score: "90/100",
                      date: "2023-10-15"
                    }, {
                      name: "市场分析方法应用",
                      score: "85/100",
                      date: "2023-10-10"
                    }, {
                      name: "风险评估模型",
                      score: "75/100",
                      date: "2023-10-05"
                    }].map((quiz, index) => <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{quiz.name}</p>
                            <p className="text-xs text-gray-500">{quiz.date}</p>
                          </div>
                          <span className="font-medium text-sm">
                            {quiz.score}
                          </span>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div>
              {/* 待办事项 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">待办事项</h3>
                <div className="space-y-3">
                  {[{
                  title: "完成投资策略作业",
                  due: "今天截止",
                  priority: "high"
                }, {
                  title: "观看市场分析视频",
                  due: "明天截止",
                  priority: "medium"
                }, {
                  title: "参加线上讨论",
                  due: "10月20日",
                  priority: "low"
                }].map((task, index) => <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className={`w-3 h-3 mt-1 rounded-full ${task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.due}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>)}
                </div>
                <button className="w-full mt-4 text-sm font-medium text-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加新任务
                </button>
              </div>

              {/* 学习日历 */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">近期活动</h3>
                <div className="space-y-3">
                  {[{
                  title: "投资策略研讨会",
                  date: "10月25日 14:00-16:00",
                  type: "webinar"
                }, {
                  title: "市场分析直播课",
                  date: "10月28日 19:30-21:00",
                  type: "live"
                }, {
                  title: "期末测验",
                  date: "11月05日 10:00-12:00",
                  type: "exam"
                }].map((event, index) => <div key={index} className="flex gap-4 p-2 hover:bg-gray-50 rounded">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* 学习资源 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">学习资源</h3>
                <div className="space-y-3">
                  {[{
                  title: "投资入门指南",
                  type: "PDF",
                  size: "2.4MB"
                }, {
                  title: "市场分析工具使用手册",
                  type: "PDF",
                  size: "3.8MB"
                }, {
                  title: "投资组合案例分析",
                  type: "Video",
                  size: "15分钟"
                }].map((resource, index) => <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {resource.type}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {resource.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {resource.size}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
