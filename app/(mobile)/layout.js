import "../../styles/mobile/globals.css";
import { StrictMode } from "react";
import { Toaster } from "../../components/ui/toaster.js";
import { appTitle } from "../../lib/common/env.js";
export const metadata = {
  title: `${appTitle()}`,
  description: `${appTitle()}`
};
export default function MobileLayout({
  children
}) {
  return <html lang="zh-CN">
      <StrictMode>
        <body className="antialiased">
          <div className="min-h-screen bg-gray-50">{children}</div>
          <Toaster />
        </body>
      </StrictMode>
    </html>;
}
