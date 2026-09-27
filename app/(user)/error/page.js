"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button.js";
import { APP_TITLE } from "../../../lib/config/constants.js";

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
      router.push("/");
    }
  };
  const handleGoHome = () => {
    router.push("/");
  };
  return <div className="min-h-screen bg-background">
      {/* 错误主体区域 */}
      <section className="py-8 px-6 md:px-12 lg:px-20">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            {/* 页面标题 */}
            <div className="text-center mb-12">
              <h1 className="mt-6 mb-4 text-4xl md:text-5xl font-bold">
                <span className="gradient-text">{APP_TITLE}</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                糟糕，似乎出现了一些问题
              </p>
            </div>

            {/* 错误卡片 */}
            <div className="bg-card rounded-2xl shadow-lg border border-muted/20 overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-red-600">
                    出错了
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    我们正在努力解决这个问题
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 text-center">
                    错误详情
                  </h3>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                    <p className="text-red-800 text-sm leading-relaxed text-center">
                      {error}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="space-y-3 max-w-xs mx-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={handleGoBack}>
                        返回上页
                      </Button>
                      <Button variant="outline" onClick={handleGoHome}>
                        回到首页
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部说明 */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                如果问题持续存在，请联系客服
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
export default function ErrorPage() {
  return <Suspense fallback={<div>加载中...</div>}>
      <ErrorContent />
    </Suspense>;
}
