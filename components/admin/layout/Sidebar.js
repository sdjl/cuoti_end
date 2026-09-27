"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion.js";
import { Button } from "../../ui/button.js";
import { Separator } from "../../ui/separator.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { adminMenuItems } from "../../../lib/config/adminRoutes.js";
import { cn } from "../../../lib/shadcn/utils.js";
export default function AdminSidebar() {
  const pathname = usePathname();
  const {
    user,
    loading,
    isSuperAdmin,
    isAdmin,
    isAdminEditor
  } = useAuth();

  // 检查当前路径是否以某个链接路径开头
  const isPathActive = href => {
    // 精确匹配
    if (pathname === href) return true;
    // 前缀匹配（例如：/admin/exam-papers/create 应该匹配 /admin/exam-papers）
    if (href !== "/admin" && pathname.startsWith(`${href}/`)) return true;
    return false;
  };

  // 初始展开的手风琴项
  const getDefaultOpenItems = () => {
    // 返回所有有子菜单的项目的标题，使所有菜单默认展开
    return adminMenuItems.filter(item => item.children).map(section => section.title);
  };

  // 获取用户角色显示文本
  const getUserRoleText = () => {
    if (loading || !user) return "加载中...";
    if (isSuperAdmin()) return "超级管理员";
    if (isAdmin()) return "管理员";
    if (isAdminEditor()) return "后台编辑";
    return "用户";
  };

  // 过滤菜单项，根据用户类型显示不同的菜单
  const getFilteredMenuItems = () => {
    // 如果是后台编辑用户，只显示允许访问的菜单
    if (isAdminEditor()) {
      return adminMenuItems.filter(item => item.allowAdminEditor === true);
    }
    // 其他用户显示所有菜单
    return adminMenuItems;
  };
  return <aside className="w-64 border-r bg-white shadow-sm h-full flex flex-col">
      {/* 用户信息 */}
      <div className="px-4 py-5">
        <Link href="/admin">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center">
              {loading ? <div className="animate-pulse bg-gray-300 w-full h-full rounded-full"></div> : user?.userWxInfo.headimgurl ? <Image src={user.userWxInfo.headimgurl} alt={user.userWxInfo.nickname || "管理员"} width={40} height={40} className="w-full h-full object-cover" /> : <span className="text-primary-foreground font-semibold">
                  {user?.userWxInfo.nickname?.charAt(0) || "管"}
                </span>}
            </div>
            <div>
              <div className="text-lg font-medium">
                {loading ? "加载中..." : user?.userWxInfo.nickname || "管理员"}
              </div>
              <div className="text-sm text-muted-foreground">
                {getUserRoleText()}
              </div>
            </div>
          </div>
        </Link>
      </div>

      <Separator className="my-2" />

      {/* 分类导航 */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <nav>
          {/* 按照 adminMenuItems 数组的顺序渲染所有菜单项 */}
          <Accordion type="multiple" defaultValue={getDefaultOpenItems()}>
            {getFilteredMenuItems().map(item => {
            // 如果是单链接菜单项（有 href 但没有 children）
            if (item.href && !item.children) {
              return <Link key={item.title} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 rounded-md mb-1", isPathActive(item.href) && "bg-primary/10 text-primary font-medium")}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>;
            }

            // 如果是有子菜单的项目
            if (item.children) {
              return <AccordionItem key={item.title} value={item.title} className="border-none">
                    <AccordionTrigger className={cn("px-3 py-2 text-sm hover:bg-muted/50 rounded-md hover:no-underline", item.children?.some(child => isPathActive(child.href)) && "text-primary font-medium")}>
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-1">
                      <div className="pl-9 space-y-1">
                        {item.children?.map(child => <Link key={child.href} href={child.href} className={cn("block py-2 px-3 text-sm rounded-md hover:bg-muted transition-colors", isPathActive(child.href) && "bg-primary/10 text-primary font-medium")}>
                            <div>{child.name}</div>
                          </Link>)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>;
            }
            return null;
          })}
          </Accordion>
        </nav>
      </div>

      {/* 底部操作按钮 */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        {/* 跳转到工作台按钮 */}
        <Link href="/work" className="block">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            工作台
          </Button>
        </Link>

        {/* 登出按钮 */}
        <Link href="/logout" className="block">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            登出
          </Button>
        </Link>
      </div>
    </aside>;
}
