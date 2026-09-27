"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";
// 系统配置管理页面，用于管理科目、题型和区域等系统基础配置
import { useEffect, useState } from "react";
import QuestionTypesConfig from "./components/QuestionTypesConfig.js";
import RegionsConfig from "./components/RegionsConfig.js";
import SubjectsConfig from "./components/SubjectsConfig.js";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs.js";
import { getAllSystemConfigs } from "./actions.js";
export default function ConfigPage() {
  // 状态定义
  const [configData, setConfigData] = useState({
    subjects: [],
    questionTypes: [],
    regions: [],
    configIds: {
      subjects_config: "",
      question_types_config: "",
      regions_config: ""
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subjects");
  const [error, setError] = useState(null);

  // 加载数据
  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAllSystemConfigs();
        if (response.success && response.data) {
          setConfigData(response.data);
        } else {
          setError({
            message: response.errorMessage || "获取配置数据失败",
            details: response.errorDetails
          });
          // 设置空数据，确保UI不会出错
          setConfigData({
            subjects: [],
            questionTypes: [],
            regions: [],
            configIds: {}
          });
        }
      } catch (error) {
        console.error("客户端错误:", error);
        setError({
          message: `客户端错误: ${error instanceof Error ? error.message : String(error)}`,
          details: undefined
        });
      } finally {
        setLoading(false);
      }
    };
    fetchConfigData();
  }, []);

  // 解构数据
  const {
    subjects,
    questionTypes,
    regions,
    configIds
  } = configData;

  // 处理标签切换
  const handleTabChange = value => {
    setActiveTab(value);
  };

  // 加载状态的渲染函数
  const renderLoading = () => <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">加载中...</span>
    </div>;

  // 将对象转换为JSON字符串并格式化
  const formatObjectToJson = obj => {
    return JSON.stringify(obj, null, 2);
  };
  return <div className="space-y-6">
      <Alert variant="default" className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>配置说明</AlertTitle>
        <AlertDescription>
          系统配置使用名称作为唯一标识，请确保名称不重复。编辑时可以随意修改锁定状态，但保存后锁定状态将不可逆。已锁定的配置项不能被删除或修改。
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>配置加载错误</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error.message}</p>
            {error.details && <div className="mt-2">
                <p className="font-semibold">错误详情:</p>
                <div className="bg-destructive/10 p-3 rounded-md mt-2 overflow-auto max-h-[300px]">
                  {error.details.missingConfigs && <div className="mb-2">
                      <p className="font-semibold">缺失的配置项:</p>
                      <ul className="list-disc list-inside">
                        {error.details.missingConfigs.map(config => <li key={config}>{config}</li>)}
                      </ul>
                    </div>}
                  {error.details.availableConfigIds && <div className="mb-2">
                      <p className="font-semibold">可用的配置ID:</p>
                      <pre className="text-xs whitespace-pre-wrap">
                        {formatObjectToJson(error.details.availableConfigIds)}
                      </pre>
                    </div>}
                  {error.details.retrievedDocsCount !== undefined && <p>获取到的文档数量: {error.details.retrievedDocsCount}</p>}
                  {error.details.expectedDocsCount !== undefined && <p>预期的文档数量: {error.details.expectedDocsCount}</p>}
                </div>
              </div>}
          </AlertDescription>
        </Alert>}

      <Tabs defaultValue="subjects" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="subjects">科目配置</TabsTrigger>
          <TabsTrigger value="questionTypes">题型配置</TabsTrigger>
          <TabsTrigger value="regions">区域配置</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          {loading ? renderLoading() : <SubjectsConfig subjects={subjects} docId={configIds.subjects_config} />}
        </TabsContent>

        <TabsContent value="questionTypes">
          {loading ? renderLoading() : <QuestionTypesConfig questionTypes={questionTypes} docId={configIds.question_types_config} />}
        </TabsContent>

        <TabsContent value="regions">
          {loading ? renderLoading() : <RegionsConfig regions={regions} docId={configIds.regions_config} />}
        </TabsContent>
      </Tabs>
    </div>;
}
