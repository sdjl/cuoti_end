"use client";

import { Info, Loader2 } from "lucide-react";
// 小程序配置页面，提供多个标签页用于配置小程序的各种设置，包括图片、文案、AI功能、介绍视频等
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getMiniprogramConfig } from "./actions.js";
import AiMistakePracticeConfig from "./components/AiMistakePracticeConfig.js";
import AiProblemConfig from "./components/AiProblemConfig.js";
import CopywritingConfig from "./components/CopywritingConfig.js";
import ImageUploadComponent from "./components/ImageUpload.js";
import LoggedIntroductionConfig from "./components/LoggedIntroductionConfig.js";
import NewbieQuizConfig from "./components/NewbieQuizConfig.js";
import UnloggedIntroductionConfig from "./components/UnloggedIntroductionConfig.js";
import { DEFAULT_MINIPROGRAM_CONFIG } from "./types.js";
export default function MiniprogramConfigPage() {
  const [miniprogramConfig, setMiniprogramConfig] = useState(DEFAULT_MINIPROGRAM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("images");
  const [error, setError] = useState(null);

  // 加载数据
  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMiniprogramConfig();
        if (response.success && response.data) {
          setMiniprogramConfig(response.data);
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
        <AlertTitle>小程序配置说明</AlertTitle>
        <AlertDescription>
          此页面用于配置小程序中的各种设置。上传的二维码图片会显示在小程序的首页以及联系方式页面中。
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertTitle>配置加载错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

      <Tabs defaultValue="images" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="images">图片配置</TabsTrigger>
          <TabsTrigger value="copywriting">文案配置</TabsTrigger>
          <TabsTrigger value="aibot">
            AI{DISPLAY_TEXT.COURSE_MISTAKE}
          </TabsTrigger>
          <TabsTrigger value="aiqa">
            {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
          </TabsTrigger>
          <TabsTrigger value="newbie">
            新生{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
          </TabsTrigger>
          <TabsTrigger value="unlogged">未登录介绍</TabsTrigger>
          <TabsTrigger value="logged">已登录介绍</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          {loading ? renderLoading() : <ImageUploadComponent config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="copywriting">
          {loading ? renderLoading() : <CopywritingConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="aibot">
          {loading ? renderLoading() : <AiMistakePracticeConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="aiqa">
          {loading ? renderLoading() : <AiProblemConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="newbie">
          {loading ? renderLoading() : <NewbieQuizConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="unlogged">
          {loading ? renderLoading() : <UnloggedIntroductionConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>

        <TabsContent value="logged">
          {loading ? renderLoading() : <LoggedIntroductionConfig config={miniprogramConfig} onConfigChange={setMiniprogramConfig} />}
        </TabsContent>
      </Tabs>
    </div>;
}
