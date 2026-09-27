import "../../styles/user/globals.css";
import "../../styles/user/layout.css";
import { StrictMode } from "react";
import Footer from "../../components/user/layout/Footer.js";
import Header from "../../components/user/layout/Header.js";
import { appName } from "../../lib/common/env.js";
export const metadata = {
  title: `${appName()} - 用户`,
  description: `${appName()} 用户系统`
};
export default function RootLayout({
  children
}) {
  return <html lang="zh-CN">
      <StrictMode>
        <body className={`antialiased`}>
          <Header />
          <main>{children}</main>
          <Footer />
        </body>
      </StrictMode>
    </html>;
}
