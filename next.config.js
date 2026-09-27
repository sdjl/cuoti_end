import { IMAGE_CONFIG } from "./lib/config/constants.js";


const getHostnameFromUrl = url => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// 静态存储文件的访问域名
const staticStorageHostname = getHostnameFromUrl(IMAGE_CONFIG.PROD_IMAGE_DOMAIN);

// 动态存储文件的访问域名
const dynamicStorageHostname = "636c-cloud1-5gta52p99cb389c8-1358652060.tcb.qcloud.la";
const nextConfig = {
  /* Next.js配置选项 */
  images: {
    // 允许从这些域名加载图片（旧版配置方式，但仍然保留兼容性）
    domains: [staticStorageHostname, dynamicStorageHostname, "thirdwx.qlogo.cn", "images.unsplash.com"],
    // 远程图片模式配置（Next.js 13.4+推荐的配置方式）
    // 更精细地控制允许的图片来源，包括协议、端口和路径
    remotePatterns: [{
      protocol: "https",
      // 只允许HTTPS协议
      hostname: staticStorageHostname,
      // 允许的域名
      port: "",
      // 不指定端口
      pathname: "/**" // 允许域名下的所有路径
    }, {
      protocol: "https",
      // 只允许HTTPS协议
      hostname: dynamicStorageHostname,
      // 允许的域名
      port: "",
      // 不指定端口
      pathname: "/**" // 允许域名下的所有路径
    }, {
      protocol: "https",
      // 只允许HTTPS协议
      hostname: "thirdwx.qlogo.cn",
      // 允许的域名
      port: "",
      // 不指定端口
      pathname: "/**" // 允许域名下的所有路径
    }, {
      protocol: "https",
      // 只允许HTTPS协议
      hostname: "images.unsplash.com",
      // 允许的域名
      port: "",
      // 不指定端口
      pathname: "/**" // 允许域名下的所有路径
    }],
    // 禁用Next.js的图片优化功能（在生产环境）
    // 当设置为 true 时，Next.js不会优化图片，而是直接使用原始URL
    // 容器频繁重启, 会导致重复优化, 所以关闭
    unoptimized: process.env.NODE_ENV === "production"
  },
  experimental: {
    serverActions: {
      // 只能上传20M的文件，超过20M请使用对象存储中转
      bodySizeLimit: "20mb",
      allowedOrigins: [
      // 注意：这里不能从 constants 导入，因为 next.config.ts 在编译时执行
      "pengpaiup.cn", "www.pengpaiup.cn",
      // 匹配所有 *.wxcloudrun.com 域名，允许云托管平台
      "*.wxcloudrun.com"]
    }
  },
  async headers() {
    // 只在开发环境中禁用缓存
    if (process.env.NODE_ENV === "development") {
      return [{
        source: "/:path*",
        headers: [{
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0"
        }, {
          key: "Pragma",
          value: "no-cache"
        }, {
          key: "Expires",
          value: "0"
        }]
      }];
    } else {
      // 生产环境的缓存配置
      // 缓存时间配置（秒）
      const SHORT_CACHE_TIME = 3600; // 1小时
      const LONG_CACHE_TIME = 31536000; // 1年 (365 * 24 * 60 * 60)

      // 需要短期缓存的静态资源目录，当public目录下增加新的目录时，需要在这里添加
      const staticDirectories = ["font", "images", "js"];
      return [{
        // 所有页面路由(不以下面几个开头的) - 禁用CDN缓存
        // 匹配除了 _next、public/* 目录之外的所有路径
        source: `/((?!_next|${staticDirectories.join("|")}).*)`,
        headers: [{
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=0, must-revalidate"
        }]
      }, {
        // Next.js静态资源 - 长期缓存（每次部署文件名会改变）
        // 这些文件包含内容hash，可以安全地长期缓存
        source: "/_next/static/(.*)",
        headers: [{
          key: "Cache-Control",
          value: `public, max-age=${LONG_CACHE_TIME}, s-maxage=${LONG_CACHE_TIME}, immutable`
        }]
      },
      // 为每个静态资源目录生成缓存规则
      ...staticDirectories.map(dir => ({
        // 匹配指定目录下的所有文件 - 短期缓存
        source: `/${dir}/(.*)`,
        headers: [{
          key: "Cache-Control",
          value: `public, max-age=${SHORT_CACHE_TIME}, s-maxage=${SHORT_CACHE_TIME}`
        }]
      })), {
        // 根目录的特定文件 - 短期缓存
        // 包括网站图标、机器人协议文件、站点地图等
        source: "/(favicon.ico|robots.txt|sitemap.xml)",
        headers: [{
          key: "Cache-Control",
          value: `public, max-age=${SHORT_CACHE_TIME}, s-maxage=${SHORT_CACHE_TIME}`
        }]
      }];
    }
  }
};
export default nextConfig;
