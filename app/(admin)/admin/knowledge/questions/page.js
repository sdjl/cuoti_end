"use client";

import { Info, RotateCcw, X } from "lucide-react";
// 知识点题目管理页面，用于通过知识树选择知识点并查看相关题目
import { useEffect, useState } from "react";
import KnowledgeTreeLevelSelector from "./components/KnowledgeTreeLevelSelector.js";
import QuestionList from "./components/QuestionList.js";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader } from "../../../../../components/ui/card.js";
import { Input } from "../../../../../components/ui/input.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../hooks/useAdminConfig.js";
import { getAllKnowledgeTreeConfigs } from "./actions.js";

// 将系统格式转换为组件使用的格式
const convertSystemToComponentTree = systemNodes => {
  if (!systemNodes) return [];
  return systemNodes.map(node => ({
    name: node.name,
    children: node.children ? convertSystemToComponentTree(node.children) : undefined
  }));
};
export default function KnowledgeQuestionsPage() {
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [activeTab, setActiveTab] = useState("");
  const [knowledgeTrees, setKnowledgeTrees] = useState({});
  const [selectedPaths, setSelectedPaths] = useState({});
  const [currentLeafNodes, setCurrentLeafNodes] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();

  // 加载知识树数据
  useEffect(() => {
    async function loadKnowledgeTrees() {
      if (!subjects.length) return;
      try {
        setLoading(true);
        // 获取所有学科的知识树配置
        const subjectNames = subjects.map(s => s.name);
        const {
          configs
        } = await getAllKnowledgeTreeConfigs(subjectNames);

        // 处理配置数据
        const trees = {};
        const initialPaths = {};
        const initialLeafNodes = {};
        subjectNames.forEach(subject => {
          const config = configs[subject];
          if (config?.nodes) {
            // 转换为组件可用的格式
            trees[subject] = convertSystemToComponentTree(config.nodes);
          } else {
            // 没有数据则使用空数组
            trees[subject] = [];
          }
          // 初始化选中路径为空
          initialPaths[subject] = [];
          // 初始化叶子节点为空
          initialLeafNodes[subject] = null;
        });
        setKnowledgeTrees(trees);
        setSelectedPaths(initialPaths);
        setCurrentLeafNodes(initialLeafNodes);

        // 设置默认活动标签
        if (!activeTab && subjectNames.length > 0) {
          setActiveTab(subjectNames[0]);
        }
      } catch (error) {
        console.error("加载知识树失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载知识树数据",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    loadKnowledgeTrees();
  }, [subjects, activeTab, toast]);

  // 检查指定路径的节点是否为叶子节点
  const isLeafNode = (subject, path) => {
    if (!knowledgeTrees[subject] || path.length === 0) {
      return false;
    }
    let currentNodes = knowledgeTrees[subject];
    for (let i = 0; i < path.length; i++) {
      const foundNode = currentNodes.find(node => node.name === path[i]);
      if (!foundNode) {
        return false;
      }

      // 如果是最后一个路径节点，检查是否有子节点
      if (i === path.length - 1) {
        return !foundNode.children || foundNode.children.length === 0;
      }

      // 继续向下查找
      if (!foundNode.children) {
        return false;
      }
      currentNodes = foundNode.children;
    }
    return false;
  };

  // 处理知识点选择
  const handleNodeSelect = (level, nodeName) => {
    if (!activeTab) return;
    setSelectedPaths(prev => {
      const currentPath = prev[activeTab] || [];
      // 截断当前层级之后的路径，然后设置当前层级的选择
      const newPath = [...currentPath.slice(0, level), nodeName];

      // 检查新路径是否为叶子节点
      if (isLeafNode(activeTab, newPath)) {
        // 如果是叶子节点，检查是否和当前叶子节点不同，避免重复查询
        if (currentLeafNodes[activeTab] !== nodeName) {
          setCurrentLeafNodes(prevLeaf => ({
            ...prevLeaf,
            [activeTab]: nodeName
          }));
        }
      }
      return {
        ...prev,
        [activeTab]: newPath
      };
    });
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchQuery("");
  };

  // 重置选择的知识点
  const handleResetSelection = () => {
    if (!activeTab) return;
    setSelectedPaths(prev => ({
      ...prev,
      [activeTab]: []
    }));

    // 同时重置当前叶子节点状态
    setCurrentLeafNodes(prev => ({
      ...prev,
      [activeTab]: null
    }));
  };
  if (subjectsLoading || loading) {
    return <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-600">加载中...</div>
            <div className="text-sm text-gray-500 mt-2">正在加载知识树数据</div>
          </div>
        </div>
      </div>;
  }
  return <div className="container mx-auto">
      <div className="space-y-6">
        {/* 题目搜索说明 */}
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">题目显示说明</AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="space-y-2 mt-2">
              <p>
                • <strong>重要提醒</strong>
                ：只有状态为&ldquo;已锁定&rdquo;的试卷中的题目才会在此处显示
              </p>
              <p>
                • <strong>关于查询</strong>
                ：只有选择叶子节点后，才会查询该知识点下的题目
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* 科目选择标签 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full mb-4 ${subjects.length === 1 ? "grid-cols-1" : subjects.length === 2 ? "grid-cols-2" : subjects.length >= 3 ? "grid-cols-3" : "grid-cols-1"}`}>
            {subjects.map(subject => <TabsTrigger key={subject.name} value={subject.name} className="data-[state=active]:bg-white data-[state=active]:shadow-sm" style={{
            color: activeTab === subject.name ? subject.color : undefined
          }}>
                {subject.name}
              </TabsTrigger>)}
          </TabsList>

          {/* 每个科目的内容 */}
          {subjects.map(subject => {
          const hasSelection = selectedPaths[subject.name] && selectedPaths[subject.name].length > 0;
          return <TabsContent key={subject.name} value={subject.name}>
                <div className="space-y-6">
                  {/* 知识树选择区域 */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        {/* 左侧：路径显示 */}
                        <div className="flex-1">
                          {hasSelection ? <div className="flex flex-wrap items-center space-x-2">
                              {selectedPaths[subject.name].map((nodeName, index) => <div key={index} className="flex items-center">
                                    <span className="px-3 py-1 rounded-md text-sm font-medium" style={{
                            backgroundColor: `${subject.color}20`,
                            color: subject.color
                          }}>
                                      {nodeName}
                                    </span>
                                    {index < selectedPaths[subject.name].length - 1 && <span className="mx-2 text-gray-400">
                                        ›
                                      </span>}
                                  </div>)}
                              {/* 重置选择按钮 */}
                              <Button variant="ghost" size="sm" onClick={handleResetSelection} className="ml-2 text-gray-500 hover:text-gray-700">
                                <RotateCcw className="h-4 w-4 mr-1" />
                                重置
                              </Button>
                            </div> : <div className="text-gray-500 text-sm">
                              请选择知识点（未选择时显示所有题目）
                            </div>}
                        </div>

                        {/* 右侧：搜索功能 */}
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="relative">
                            <Input placeholder="搜索知识点..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-48 pr-8" />
                            {searchQuery && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0" onClick={handleResetSearch}>
                                <X className="h-3 w-3" />
                              </Button>}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {knowledgeTrees[subject.name] && knowledgeTrees[subject.name].length > 0 ? <KnowledgeTreeLevelSelector treeData={knowledgeTrees[subject.name]} selectedPath={selectedPaths[subject.name] || []} onNodeSelect={handleNodeSelect} color={subject.color} searchQuery={searchQuery} /> : <div className="text-center py-12">
                          <div className="text-gray-500">
                            {subject.name} 暂无知识树数据
                          </div>
                          <div className="text-sm text-gray-400 mt-2">
                            请先在知识树管理页面添加{subject.name}的知识点
                          </div>
                        </div>}
                    </CardContent>
                  </Card>

                  {/* 题目列表区域 */}
                  <QuestionList knowledgePoint={currentLeafNodes[subject.name] || null} color={subject.color} />
                </div>
              </TabsContent>;
        })}
        </Tabs>
      </div>
    </div>;
}
