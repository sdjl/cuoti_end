import { StrictMode, Suspense } from "react";
export default function LoggedLayout({
  children
}) {
  return <html lang="zh-CN" style={{
    height: "100%"
  }}>
      <StrictMode>
        <head>
          <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
          `
        }} />
        </head>
        <body style={{
        width: "100%",
        height: "100%"
      }}>
          <div style={{
          width: "100%",
          height: "100%"
        }}>
            <Suspense fallback={<div>加载中...</div>}>{children}</Suspense>
          </div>
        </body>
      </StrictMode>
    </html>;
}
