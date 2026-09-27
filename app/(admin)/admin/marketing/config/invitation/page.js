"use client";

import { Info, Loader2 } from "lucide-react";
// 邀请配置页面，用于配置学生邀请码、合作伙伴邀请码和一次性邀请码的相关参数
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { getMarketingConfig } from "./actions.js";
import OnetimeInvitationConfig from "./components/OnetimeInvitationConfig.js";
import PartnerInvitationConfig from "./components/PartnerInvitationConfig.js";
import StudentInvitationConfig from "./components/StudentInvitationConfig.js";
import { DEFAULT_MARKETING_CONFIG } from "./types.js";
export default function InvitationConfigPage() {
  const [marketingConfig, setMarketingConfig] = useState(DEFAULT_MARKETING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("student");
  const [error, setError] = useState(null);

  // 加载数据
  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMarketingConfig();
        if (response.success && response.data) {
          setMarketingConfig(response.data);
        } else {
          setError(response.message || "获取配置数据失败");
        }
      } catch (error) {
        console.error("客户端错误:", error);
        setError(`客户端错误: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigData();
  }, []);

  // 处理标签切换
  const handleTabChange = value => {
    setActiveTab(value);
  };

  // 加载状态的渲染函数
  const renderLoading = () => <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">加载中...</span>
    </div>;
  return <div className="space-y-6">
      <Alert variant="default" className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>邀请配置说明</AlertTitle>
        <AlertDescription>
          此页面用于配置营销邀请功能的各种设置。包括学生邀请码、合作伙伴邀请码和一次性邀请码的相关参数配置。
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertTitle>配置加载错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

      <Tabs defaultValue="student" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="student">学生邀请码</TabsTrigger>
          <TabsTrigger value="partner">合作伙伴</TabsTrigger>
          <TabsTrigger value="onetime">一次性邀请码</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          {loading ? renderLoading() : <StudentInvitationConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="partner">
          {loading ? renderLoading() : <PartnerInvitationConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="onetime">
          {loading ? renderLoading() : <OnetimeInvitationConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>
      </Tabs>
    </div>;
}
