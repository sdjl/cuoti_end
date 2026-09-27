"use client";

import { APP_TITLE, FOOTER_CONFIG } from "../../../lib/config/constants.js";
export default function UserAgreementPage() {
  return <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
            {APP_TITLE} 用户协议
          </h1>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                1. 协议的接受
              </h2>
              <p>
                欢迎使用{APP_TITLE}！本协议是您（用户）与
                {FOOTER_CONFIG.legal.companyFullName}
                （以下简称&quot;我们&quot;或&quot;公司&quot;）之间关于使用
                {APP_TITLE}
                服务的法律协议。
                通过注册、访问或使用我们的服务，您表示同意受本协议条款的约束。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                2. 服务描述
              </h2>
              <p>
                {APP_TITLE}
                是一个错题管理工具软件，专注于为用户提供错题收集、整理、复习提醒等功能。
                我们致力于通过技术手段帮助用户更好地管理自己的学习资料，
                提供便捷的错题记录和复习工具。本软件仅作为个人学习管理工具使用。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                3. 用户注册与账户
              </h2>
              <div className="space-y-2">
                <p>3.1 用户需要通过微信授权登录的方式注册和使用我们的服务。</p>
                <p>3.2 用户应当提供真实、准确、完整的注册信息。</p>
                <p>3.3 用户有责任维护账户安全，不得将账户信息泄露给他人。</p>
                <p>3.4 如发现账户被盗用或存在安全问题，请立即联系我们。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                4. 用户行为规范
              </h2>
              <div className="space-y-2">
                <p>4.1 用户在使用软件时应遵守相关法律法规。</p>
                <p>4.2 禁止发布违法、有害、虚假、恶意的信息。</p>
                <p>4.3 禁止进行任何可能干扰、破坏软件正常运行的行为。</p>
                <p>4.4 尊重他人权益，不得侵犯他人隐私或知识产权。</p>
                <p>4.5 本软件仅供个人学习管理使用，不得用于商业或其他用途。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                5. 知识产权
              </h2>
              <p>
                本软件的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、
                版面设计等均归{FOOTER_CONFIG.legal.companyFullName}所有，
                受著作权法和其他知识产权法律法规保护。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                6. 隐私保护
              </h2>
              <p>
                我们重视用户隐私保护，将按照相关法律法规和我们的隐私政策处理用户信息。
                具体请参阅我们的隐私政策。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                7. 服务变更与终止
              </h2>
              <div className="space-y-2">
                <p>7.1 我们有权根据业务需要修改或终止部分或全部功能。</p>
                <p>7.2 如需终止服务，我们将提前通知用户。</p>
                <p>7.3 用户可随时停止使用软件，并可要求删除相关数据。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                8. 免责声明
              </h2>
              <p>
                在法律允许的最大范围内，我们对因使用本软件而产生的任何直接、间接、
                偶然、特殊或后果性损害不承担责任。本软件仅为个人学习管理工具，
                用户的学习效果取决于个人努力和实际情况。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                9. 协议变更
              </h2>
              <p>
                我们保留随时修改本协议的权利。修改后的协议将在软件中公布，
                继续使用软件即表示您同意修改后的协议。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                10. 联系我们
              </h2>
              <div className="space-y-2">
                <p>如有任何问题或建议，请联系我们：</p>
                <p>公司名称：{FOOTER_CONFIG.legal.companyFullName}</p>
                <p>地址：{FOOTER_CONFIG.contact.address}</p>
                <p>电话：{FOOTER_CONFIG.contact.phone}</p>
                <p>统一社会信用代码：{FOOTER_CONFIG.creditCode}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-muted text-center">
            <p className="text-sm text-muted-foreground">
              本协议最后更新时间：{new Date().getFullYear()}年
              {new Date().getMonth() + 1}月
            </p>
          </div>
        </div>
      </div>
    </div>;
}
