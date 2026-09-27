"use client";

import { Info, Loader2 } from "lucide-react";
// 统计配置页面，提供多个标签页用于配置系统中各种统计功能的参数
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs.js";
import { getKnowledgeStatsConfig } from "./actions.js";
import KnowledgeStatsConfigComponent from "./components/KnowledgeStatsConfig.js";
export default function StatisticsConfigPage() {
  const [knowledgeStatsConfig, setKnowledgeStatsConfig] = useState({
    masteryThreshold: 90,
    partialMasteryThreshold: 70
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("knowledge-stats");
  const [error, setError] = useState(null);

  // 加载数据
  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getKnowledgeStatsConfig();
        if (response.success && response.data) {
          setKnowledgeStatsConfig(response.data);
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
        <AlertTitle>统计配置说明</AlertTitle>
        <AlertDescription>
          此页面用于配置系统中各种统计功能的参数。知识点统计配置用于设定掌握程度的判定标准，这些参数将影响学生学习报告的生成。
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertTitle>配置加载错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

      <Tabs defaultValue="knowledge-stats" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-1 mb-4">
          <TabsTrigger value="knowledge-stats">知识点统计配置</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-stats">
          {loading ? renderLoading() : <KnowledgeStatsConfigComponent config={knowledgeStatsConfig} onConfigChange={setKnowledgeStatsConfig} />}
        </TabsContent>
      </Tabs>
    </div>;
}
