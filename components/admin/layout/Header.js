"use client";

/**
 * 面包屑支持多个from_参数，如果希望A链接返回页面1，可以写from_a_page=A
 * 如果希望此时B链接返回页面2，可以写from_b_page=B
 */
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { adminRouteConfig } from "../../../lib/config/adminRoutes.js";

// 解析路径，生成面包屑
function getBreadcrumbsFromPath(pathname, searchParams, routeConfig) {
  const segments = pathname.replace(/^\//, "").split("/");
  const breadcrumbs = [];
  if (segments[0] !== routeConfig.path) return breadcrumbs;

  // 处理 from_ 参数
  const fromParams = [...searchParams.entries()].filter(([key]) => key.startsWith("from_")).reduce((acc, [key, value]) => {
    acc[key.replace(/^from_/, "")] = value;
    return acc;
  }, {});
  const fromQuery = new URLSearchParams(fromParams).toString();
  const querySuffix = fromQuery ? `?${fromQuery}` : "";
  let currentNode = routeConfig;
  let currentPath = "";
  for (let i = 0; i < segments.length;) {
    const segment = segments[i];
    if (!currentNode.children) break;
    let matched = false;

    // 尝试匹配当前节点的直接子节点
    for (const childKey in currentNode.children) {
      const childNode = currentNode.children[childKey];
      const childPathSegments = childNode.path.split("/");
      if (i + childPathSegments.length - 1 >= segments.length) continue;
      const params = {};
      let validMatch = true;
      for (let j = 0; j < childPathSegments.length; j++) {
        const pathSeg = childPathSegments[j];
        const urlSeg = segments[i + j];
        if (pathSeg.startsWith("[") && pathSeg.endsWith("]")) {
          const paramName = pathSeg.slice(1, -1);
          params[paramName] = urlSeg;
        } else if (pathSeg !== urlSeg) {
          validMatch = false;
          break;
        }
      }
      if (validMatch) {
        currentPath += `/${segments.slice(i, i + childPathSegments.length).join("/")}`;
        breadcrumbs.push({
          path: currentPath + (i + childPathSegments.length < segments.length ? querySuffix : ""),
          name: childNode.name
        });
        currentNode = childNode;
        i += childPathSegments.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        path: currentPath,
        name: segment
      });
      i++;
    }
  }

  // 合并顶级路由：如果面包屑数组第一项的路径已经是顶级路径，则将其名称更新为 "后台"；否则插入新的顶级项
  if (breadcrumbs.length > 0 && breadcrumbs[0].path === `/${routeConfig.path}`) {
    breadcrumbs[0].name = "后台";
  } else {
    breadcrumbs.unshift({
      path: `/${routeConfig.path}`,
      name: "后台"
    });
  }
  return breadcrumbs;
}
export default function AdminHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const breadcrumbs = getBreadcrumbsFromPath(pathname, searchParams, adminRouteConfig);
  return <header className="sticky top-0 z-50 border-b bg-white py-5 px-6 shadow-sm">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center flex-wrap gap-1">
          {breadcrumbs.map((breadcrumb, index) => <div key={breadcrumb.path} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
              {index === breadcrumbs.length - 1 ? <span className="text-primary font-medium">
                  {breadcrumb.name}
                </span> : <Link href={breadcrumb.path} className="text-muted-foreground hover:text-primary transition-colors">
                  {breadcrumb.name}
                </Link>}
            </div>)}
        </div>
      </div>
    </header>;
}
