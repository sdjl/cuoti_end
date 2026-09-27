"use client";

import { Info, Loader2 } from "lucide-react";
// 积分配置页面，用于配置积分系统的各种设置，包括邀请、分享、个人错题、抽奖、兑换和荣誉积分
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getMarketingConfig } from "./actions.js";
import ExchangePointsConfig from "./components/ExchangePointsConfig.js";
import HonorPointsConfig from "./components/HonorPointsConfig.js";
import InvitationPointsConfig from "./components/InvitationPointsConfig.js";
import LotteryPointsConfig from "./components/LotteryPointsConfig.js";
import PersonalMistakePointsConfig from "./components/PersonalMistakePointsConfig.js";
import SharingPointsConfig from "./components/SharingPointsConfig.js";
import { DEFAULT_MARKETING_CONFIG } from "./types.js";
export default function PointsConfigPage() {
  const [marketingConfig, setMarketingConfig] = useState(DEFAULT_MARKETING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invitation");
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
        <AlertTitle>积分配置说明</AlertTitle>
        <AlertDescription>
          此页面用于配置积分系统的各种设置。包括邀请积分、分享积分、
          {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
          积分、积分抽奖、积分兑换和荣誉积分的相关参数配置。
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertTitle>配置加载错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

      <Tabs defaultValue="invitation" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="invitation">邀请积分</TabsTrigger>
          <TabsTrigger value="sharing">分享积分</TabsTrigger>
          <TabsTrigger value="personalMistake">
            {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分
          </TabsTrigger>
          <TabsTrigger value="lottery">积分抽奖</TabsTrigger>
          <TabsTrigger value="exchange">积分兑换</TabsTrigger>
          <TabsTrigger value="honor">荣誉积分</TabsTrigger>
        </TabsList>

        <TabsContent value="invitation">
          {loading ? renderLoading() : <InvitationPointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="sharing">
          {loading ? renderLoading() : <SharingPointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="personalMistake">
          {loading ? renderLoading() : <PersonalMistakePointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="lottery">
          {loading ? renderLoading() : <LotteryPointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="exchange">
          {loading ? renderLoading() : <ExchangePointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>

        <TabsContent value="honor">
          {loading ? renderLoading() : <HonorPointsConfig config={marketingConfig} onConfigChange={setMarketingConfig} />}
        </TabsContent>
      </Tabs>
    </div>;
}
