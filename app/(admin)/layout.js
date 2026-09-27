import "../../styles/admin/globals.css";
import { StrictMode, Suspense } from "react";
import AdminHeader from "../../components/admin/layout/Header.js";
import AdminSidebar from "../../components/admin/layout/Sidebar.js";
import { Toaster } from "../../components/ui/toaster.js";
import { appName } from "../../lib/common/env.js";
export const metadata = {
  title: `${appName()} - 管理员`,
  description: `${appName()} 管理系统`
};
export default function AdminLayout({
  children
}) {
  return <html lang="zh-CN">
      <StrictMode>
        <body className="antialiased">
          <div className="flex h-screen overflow-hidden">
            {/* 左侧边栏 */}
            <AdminSidebar />

            <div className="flex flex-col flex-1 overflow-hidden">
              {/* 顶部导航 */}
              <Suspense fallback={<div>加载中...</div>}>
                <AdminHeader />
              </Suspense>

              {/* 主内容区域 */}
              <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <Suspense fallback={<div>加载中...</div>}>{children}</Suspense>
              </main>
            </div>
          </div>
          <Toaster />
        </body>
      </StrictMode>
    </html>;
}
