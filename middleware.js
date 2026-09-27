import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { ADMIN_EDITOR_ALLOWED_PATHS } from "./lib/config/adminRoutes.js";
import { JWT_CONFIG } from "./lib/config/constants.js";
import { WORK_ASSISTANT_ALLOWED_PATHS } from "./lib/config/workRoutes.js";

/**
 * 此文件运行在Edge Runtime环境
 * 我们在middleware中并没有使用refreshJWT函数，并没有在中间件中更新token，也不应该在这里更新。
 * 如果需要在后端增加token刷新功能，可使用 lib/common/jwt.ts 中的 refreshJWT 函数。
 */

/**
 * 是否启用特殊用户访问限制
 *
 * 当设置为 true 时：
 * - 后台编辑用户（isAdminEditor）只能访问 ADMIN_EDITOR_ALLOWED_PATHS 中定义的页面
 * - 工作台助教（isWorkAssistant）只能访问 WORK_ASSISTANT_ALLOWED_PATHS 中定义的页面
 *
 * 当设置为 false 时：
 * - 不对这两种特殊用户进行访问限制
 * - 他们可以访问所有有权限的页面
 *
 * @default true
 */
const ENABLE_SPECIAL_USER_ACCESS_CONTROL = true;

/**
 * Edge Runtime 兼容的JWT验证函数
 */
async function verifyJWTEdge(token, config) {
  try {
    const secret = new TextEncoder().encode(config.secret);
    const {
      payload
    } = await jwtVerify(token, secret, {
      issuer: config.issuer,
      audience: config.audience
    });
    const jwtPayload = payload;

    // 检查账户状态
    if (jwtPayload.status === "banned") {
      return {
        valid: false,
        error: "账户已被禁用"
      };
    }

    // 检查是否需要刷新token（基于最后活跃时间）
    const activeThreshold = config.activeThreshold || 60 * 60;
    // 如果用户最后活跃时间距离现在超过了设定的阈值，则需要刷新token
    const needRefresh = Date.now() - jwtPayload.lastActiveAt > activeThreshold * 1000;
    return {
      valid: true,
      payload: jwtPayload,
      needRefresh // 此字段在中间件中暂时不使用，为了使得返回类型为MyColl.JWT.VerifyResult，先保留
    };
  } catch (error) {
    console.error("JWT验证失败:", error);
    return {
      valid: false,
      error: "JWT验证失败"
    };
  }
}

/**
 * 计算JWT剩余有效时间
 */
function getJWTRemainingTime(exp) {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(exp - now, 0);
}

/**
 * 检查JWT是否已过期
 */
function isJWTExpired(payload) {
  const remainingTime = getJWTRemainingTime(payload.exp);
  return remainingTime <= 0;
}

/**
 * 验证JWT令牌并返回载荷（Edge Runtime 版本）
 */
async function verifyJWTToken(token) {
  if (!JWT_CONFIG.secret) {
    console.error("JWT_SECRET环境变量未配置");
    return null;
  }
  const result = await verifyJWTEdge(token, JWT_CONFIG);
  if (!result.valid) {
    console.error("JWT验证失败:", result.error);
    return null;
  }
  return result.payload || null;
}

/**
 * 检查用户是否具有管理员权限
 */
function hasAdminPermission(payload) {
  const roles = payload.roles || [];
  return roles.includes("super_admin") || roles.includes("admin");
}

/**
 * 检查用户是否具有超级管理员权限
 */
function hasSuperAdminPermission(payload) {
  const roles = payload.roles || [];
  return roles.includes("super_admin");
}

/**
 * 检查路径是否在允许的路径列表中（支持前缀匹配）
 */
function isPathAllowed(pathname, allowedPaths) {
  return allowedPaths.some(allowedPath => pathname.startsWith(allowedPath));
}

/**
 * 检查是否是后台编辑用户
 */
function isAdminEditorUser(payload) {
  return payload.isAdminEditor === true;
}

/**
 * 检查是否是工作台助教用户
 */
function isWorkAssistantUser(payload) {
  return payload.isWorkAssistant === true;
}

/**
 * 验证用户状态是否正常
 */
function isUserActive(payload) {
  return payload.status === "active";
}

/**
 * 验证JWT令牌的通用逻辑
 * 返回验证结果和载荷
 */
async function validateJWTForRequest(token) {
  // 检查是否有JWT token
  if (!token) {
    return {
      isValid: false
    };
  }

  // 验证JWT token（使用Edge Runtime兼容版本）
  const payload = await verifyJWTToken(token);
  if (!payload) {
    return {
      isValid: false
    };
  }

  // 检查用户状态是否正常
  if (!isUserActive(payload)) {
    return {
      isValid: false
    };
  }

  // 检查JWT是否已过期
  if (isJWTExpired(payload)) {
    return {
      isValid: false
    };
  }
  return {
    isValid: true,
    payload
  };
}

/**
 * Next.js中间件函数
 * 用于控制页面访问权限
 * 运行在Edge Runtime环境
 */
export async function middleware(request) {
  const {
    pathname
  } = request.nextUrl;

  // 获取cookie中的JWT token
  const token = request.cookies.get("wx_auth_token")?.value;

  // 如果是管理员页面 (/admin 开头)
  if (pathname.startsWith("/admin")) {
    const validation = await validateJWTForRequest(token);
    if (!validation.isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = validation.payload;

    // 检查是否是后台编辑用户
    if (isAdminEditorUser(payload)) {
      // 如果启用了特殊用户访问控制，则限制后台编辑用户只能访问特定页面
      if (ENABLE_SPECIAL_USER_ACCESS_CONTROL && !isPathAllowed(pathname, ADMIN_EDITOR_ALLOWED_PATHS)) {
        // 重定向到试卷列表页面
        return NextResponse.redirect(new URL("/admin/exam-papers", request.url));
      }
    } else {
      // 检查管理员权限
      if (!hasAdminPermission(payload)) {
        // 重定向到工作台页面，因为用户已登录但权限不足
        return NextResponse.redirect(new URL("/work", request.url));
      }
    }
  }

  // 如果是工具页面 (/tool 开头) - 只允许超级管理员访问
  else if (pathname.startsWith("/tool")) {
    const validation = await validateJWTForRequest(token);
    if (!validation.isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 检查超级管理员权限
    if (!hasSuperAdminPermission(validation.payload)) {
      // 重定向到工作台页面，因为用户已登录但权限不足
      return NextResponse.redirect(new URL("/work", request.url));
    }
  }

  // 如果是工作台页面 (/work 开头)
  else if (pathname.startsWith("/work")) {
    const validation = await validateJWTForRequest(token);
    if (!validation.isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = validation.payload;

    // 检查是否是工作台助教用户
    if (isWorkAssistantUser(payload)) {
      // 如果启用了特殊用户访问控制，则限制工作台助教只能访问特定页面
      if (ENABLE_SPECIAL_USER_ACCESS_CONTROL && !isPathAllowed(pathname, WORK_ASSISTANT_ALLOWED_PATHS)) {
        // 重定向到上传答卷页面
        return NextResponse.redirect(new URL("/work/answer", request.url));
      }
    }
  }

  // 其他页面不需要权限验证，直接允许访问
  return NextResponse.next();
}

/**
 * 配置中间件匹配规则
 * 运行在Edge Runtime环境
 */
export const config = {
  matcher: [
  /*
   * 匹配所有请求路径，除了：
   * - api (API路由)
   * - _next/static (静态文件)
   * - _next/image (图片优化)
   * - favicon.ico (网站图标)
   * - 静态资源文件
   * - logged (登录回调页面，避免循环重定向)
   * - logout (登出页面，避免拦截登出操作)
   */
  "/((?!api|_next/static|_next/image|favicon.ico|logged|logout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
