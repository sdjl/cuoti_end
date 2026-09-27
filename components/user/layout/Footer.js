"use client";

import Link from "next/link";
import BaseImage from "../../common/BaseImage.js";
import { useSystemSettings } from "../../../hooks/useSystemSettings.js";
import { APP_TITLE, FOOTER_CONFIG } from "../../../lib/config/constants.js";
const Footer = () => {
  const {
    settings
  } = useSystemSettings();
  return <footer className="bg-card text-card-foreground py-12 px-6 md:px-12 lg:px-20">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-md overflow-hidden">
              {settings.logoUrl ? <BaseImage src={settings.logoUrl} alt="系统Logo" width={40} height={40} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
                  题
                </div>}
            </div>
            <span className="text-xl font-bold">{APP_TITLE}</span>
          </div>
          <p className="text-muted-foreground mb-4">{FOOTER_CONFIG.slogan}</p>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">联系方式</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>{FOOTER_CONFIG.contact.address}</li>
            <li>{FOOTER_CONFIG.contact.email}</li>
            <li>{FOOTER_CONFIG.contact.phone}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">服务时间</h3>
          <ul className="space-y-2 text-muted-foreground">
            {FOOTER_CONFIG.serviceHours.map((item, index) => <li key={index}>
                {item.day}: {item.hours}
              </li>)}
          </ul>
        </div>
      </div>

      <div className="container mx-auto pt-8 mt-8 border-t border-muted">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="text-center md:text-left">
            <p className="text-muted-foreground text-sm">
              {FOOTER_CONFIG.copyright}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              主办单位：{FOOTER_CONFIG.legal.companyFullName}
            </p>
            <div className="flex flex-col md:flex-row md:space-x-4 mt-2 text-xs text-muted-foreground">
              <a href="http://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                {FOOTER_CONFIG.contact.beian}
              </a>
              <span className="hidden md:inline">|</span>
              <span>{FOOTER_CONFIG.contact.netSecurityRecord}</span>
            </div>
          </div>

          <div className="flex space-x-6 text-sm mt-4 md:mt-0 md:self-end">
            <Link href={FOOTER_CONFIG.legal.userAgreement.url} className="text-muted-foreground hover:text-primary transition-colors" target="_blank">
              {FOOTER_CONFIG.legal.userAgreement.title}
            </Link>
            <Link href={FOOTER_CONFIG.legal.privacyPolicy.url} className="text-muted-foreground hover:text-primary transition-colors" target="_blank">
              {FOOTER_CONFIG.legal.privacyPolicy.title}
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;
