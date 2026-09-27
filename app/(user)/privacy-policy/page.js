"use client";

import { APP_TITLE, FOOTER_CONFIG } from "../../../lib/config/constants.js";
export default function PrivacyPolicyPage() {
  return <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
            {APP_TITLE} 隐私政策
          </h1>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                1. 隐私政策概述
              </h2>
              <p>
                {FOOTER_CONFIG.legal.companyFullName}
                （以下简称&quot;我们&quot;）深知个人信息对您的重要性，
                我们将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
                本隐私政策将帮助您了解我们如何收集、使用、存储、传输、共享、转让、公开披露您的个人信息。
                {APP_TITLE}是一个错题管理工具软件，仅供个人学习管理使用。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                2. 信息收集
              </h2>
              <div className="space-y-2">
                <p className="font-medium">我们会收集以下类型的信息：</p>
                <p>
                  2.1 <strong>账户信息：</strong>
                  通过微信授权登录获取的基本信息，包括昵称、头像等。
                </p>
                <p>
                  2.2 <strong>使用数据：</strong>
                  您在使用软件过程中产生的错题记录、复习进度、操作记录等个人学习管理数据。
                </p>
                <p>
                  2.3 <strong>设备信息：</strong>
                  设备型号、操作系统版本、设备标识符等。
                </p>
                <p>
                  2.4 <strong>日志信息：</strong>
                  您使用软件时自动生成的服务日志信息。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                3. 信息使用
              </h2>
              <div className="space-y-2">
                <p className="font-medium">我们使用收集的信息用于：</p>
                <p>3.1 提供、维护和改进我们的软件功能。</p>
                <p>3.2 为您提供个性化的错题管理和复习提醒功能。</p>
                <p>3.3 与您沟通，包括发送软件功能通知。</p>
                <p>3.4 保障软件安全，防范安全风险。</p>
                <p>3.5 遵守适用的法律法规要求。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                4. 信息共享
              </h2>
              <div className="space-y-2">
                <p>我们承诺，除以下情况外，不会与第三方共享您的个人信息：</p>
                <p>4.1 获得您的明确同意。</p>
                <p>4.2 法律法规要求或政府部门要求。</p>
                <p>4.3 为保护您或他人的合法权益。</p>
                <p>
                  4.4
                  与可信的第三方服务提供商合作（如云存储服务），且仅限于提供软件功能必需的范围内。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                5. 信息存储
              </h2>
              <div className="space-y-2">
                <p>5.1 我们将在中华人民共和国境内存储您的个人信息。</p>
                <p>
                  5.2 我们仅在为提供软件功能所必需的期间内保留您的个人信息。
                </p>
                <p>
                  5.3
                  当您删除账户或停止使用软件时，我们将删除或匿名化处理您的个人信息。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                6. 信息安全
              </h2>
              <div className="space-y-2">
                <p>我们采取以下措施保护您的个人信息安全：</p>
                <p>6.1 使用加密技术对敏感信息进行加密存储和传输。</p>
                <p>6.2 建立严格的数据访问权限控制机制。</p>
                <p>6.3 定期进行安全检测和漏洞修复。</p>
                <p>6.4 建立数据泄露应急响应机制。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                7. 您的权利
              </h2>
              <div className="space-y-2">
                <p>根据相关法律法规，您享有以下权利：</p>
                <p>
                  7.1 <strong>知情权：</strong>了解我们如何处理您的个人信息。
                </p>
                <p>
                  7.2 <strong>访问权：</strong>获取我们持有的您的个人信息副本。
                </p>
                <p>
                  7.3 <strong>更正权：</strong>要求我们更正不准确的个人信息。
                </p>
                <p>
                  7.4 <strong>删除权：</strong>要求我们删除您的个人信息。
                </p>
                <p>
                  7.5 <strong>撤回同意权：</strong>撤回您此前给予的同意。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                8. 未成年人保护
              </h2>
              <p>
                我们非常重视未成年人的个人信息保护。如果您是未成年人，
                建议您在监护人指导下阅读本隐私政策，并在监护人同意后使用我们的软件。
                本软件仅作为个人学习管理工具使用。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                9. 政策更新
              </h2>
              <p>
                我们可能会不时更新本隐私政策。更新后的政策将在我们的软件中发布，
                如果更新涉及重大变更，我们会通过适当方式通知您。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                10. 联系我们
              </h2>
              <div className="space-y-2">
                <p>如您对本隐私政策有任何疑问、意见或建议，请联系我们：</p>
                <p>公司名称：{FOOTER_CONFIG.legal.companyFullName}</p>
                <p>地址：{FOOTER_CONFIG.contact.address}</p>
                <p>电话：{FOOTER_CONFIG.contact.phone}</p>
                <p>统一社会信用代码：{FOOTER_CONFIG.creditCode}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-muted text-center">
            <p className="text-sm text-muted-foreground">
              本隐私政策最后更新时间：{new Date().getFullYear()}年
              {new Date().getMonth() + 1}月
            </p>
          </div>
        </div>
      </div>
    </div>;
}
