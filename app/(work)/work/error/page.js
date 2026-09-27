"use client";

// 错误提示页面，用于显示操作失败的错误信息
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";

// 提取使用 useSearchParams 的组件
function ErrorContent() {
  const [error, setError] = useState("发生了未知错误");
  const router = useRouter();
  const searchParams = useSearchParams();

  // 检查URL参数中的错误信息
  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam) {
      setError(decodeURIComponent(messageParam));
    }
  }, [searchParams]);
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/work");
    }
  };
  const handleGoHome = () => {
    router.push("/work");
  };
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <WorkHeader title="错误提示" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            {/* 错误卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-4 text-red-600">
                    操作失败
                  </h2>
                  <p className="text-gray-600 mb-6">抱歉，您的操作无法完成</p>
                </div>

                {/* 错误详情 */}
                <div className="mb-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 text-sm leading-relaxed text-center">
                      {error}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={handleGoBack}>
                      返回上页
                    </Button>
                    <Button onClick={handleGoHome}>回到工作台</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部说明 */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                如果问题持续存在，请联系管理员
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>;
}
export default function WorkErrorPage() {
  return <Suspense fallback={<div>加载中...</div>}>
      <ErrorContent />
    </Suspense>;
}
