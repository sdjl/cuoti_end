"use client";

import { ChevronDown, ChevronUp, Download, HelpCircle, Info, Plus, Upload } from "lucide-react";
// 知识树管理页面，用于管理各学科的知识点树结构，支持导入导出
import { useEffect, useRef, useState } from "react";
import KnowledgeTree from "./components/KnowledgeTree.js";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../components/ui/dialog.js";
import { Input } from "../../../../../components/ui/input.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../hooks/useAdminConfig.js";
import { getAllKnowledgeTreeConfigs, parseImportedText, updateKnowledgeTreeConfig } from "./actions.js";

// 将组件树节点转换为系统格式
const convertComponentTreeToSystem = treeNodes => {
  return treeNodes.map(node => ({
    name: node.name,
    children: node.children ? convertComponentTreeToSystem(node.children) : undefined
  }));
};

// 将系统格式转换为组件树节点
const convertSystemToComponentTree = (systemNodes, subject, level = 1) => {
  if (!systemNodes) return [];
  return systemNodes.map(node => ({
    name: node.name,
    subject,
    level,
    children: node.children ? convertSystemToComponentTree(node.children, subject, level + 1) : undefined
  }));
};
export default function KnowledgePage() {
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [activeTab, setActiveTab] = useState("");
  const [knowledgeTrees, setKnowledgeTrees] = useState({});
  const [docIds, setDocIds] = useState({});
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const treeRefs = useRef({});
  const [expandAll, setExpandAll] = useState(true);
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // 加载知识树数据
  useEffect(() => {
    async function loadKnowledgeTrees() {
      if (!subjects.length) return;
      try {
        setLoading(true);
        // 获取所有学科的知识树配置
        const subjectNames = subjects.map(s => s.name);
        const {
          configs,
          docIds
        } = await getAllKnowledgeTreeConfigs(subjectNames);

        // 处理配置数据
        const trees = {};
        subjectNames.forEach(subject => {
          const config = configs[subject];
          if (config) {
            // 转换为组件可用的格式
            trees[subject] = convertSystemToComponentTree(config.nodes, subject);
          } else {
            // 没有数据则使用空数组
            trees[subject] = [];
          }
        });
        setKnowledgeTrees(trees);
        setDocIds(docIds);

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

  // 保存知识树数据
  const saveKnowledgeTree = async (subject, treeData) => {
    try {
      // 转换为系统格式
      const nodes = convertComponentTreeToSystem(treeData);
      const config = {
        nodes,
        updatedAt: Date.now()
      };

      // 更新配置
      const result = await updateKnowledgeTreeConfig(subject, config, docIds[subject]);
      if (result.success) {
        toast({
          title: "保存成功",
          description: `${subject}知识树已更新`
        });

        // 更新本地数据
        setKnowledgeTrees(prev => ({
          ...prev,
          [subject]: treeData
        }));
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`保存${subject}知识树失败:`, error);
      toast({
        title: "保存失败",
        description: `无法保存${subject}知识树: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  const handleAddTopLevel = subjectName => {
    if (treeRefs.current[subjectName]) {
      treeRefs.current[subjectName]?.openAddRootDialog();
    }
  };
  const setTreeRef = (name, ref) => {
    treeRefs.current[name] = ref;
  };
  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
  };

  // 处理知识树数据变更
  const handleTreeDataChange = (subject, updatedData) => {
    // 保存到数据库
    saveKnowledgeTree(subject, updatedData);
  };

  // 导出知识树数据为文本文件
  const exportKnowledgeTree = subject => {
    const treeData = knowledgeTrees[subject] || [];
    let content = "";

    // 递归生成带缩进的文本
    const generateTextContent = (nodes, indent = 0) => {
      nodes.forEach(node => {
        content += `${" ".repeat(indent)}${node.name}\n`;
        if (node.children && node.children.length > 0) {
          generateTextContent(node.children, indent + 2);
        }
      });
    };
    generateTextContent(treeData);

    // 创建并下载文件
    const date = new Date().toISOString().split("T")[0];
    const fileName = `${subject}知识树${date}.txt`;
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理文件导入
  const handleFileImport = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const subject = activeTab;

      // 解析文本内容为树结构
      const parseResult = await parseImportedText(text, subject);
      if (!parseResult.success) {
        setImportError({
          message: parseResult.message,
          errorLine: parseResult.errorLine
        });
        toast({
          title: "格式错误",
          description: parseResult.message,
          variant: "destructive"
        });
        return;
      }

      // 保存到数据库
      if (parseResult.data) {
        await saveKnowledgeTree(subject, parseResult.data);

        // 更新本地状态以触发重新渲染
        setKnowledgeTrees(prev => ({
          ...prev,
          [subject]: parseResult.data || []
        }));
      }
      toast({
        title: "导入成功",
        description: `${subject}知识树已更新`
      });
    } catch (error) {
      console.error("导入失败:", error);
      toast({
        title: "导入失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  if (subjectsLoading || loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }
  return <div className="container mx-auto">
      {/* 知识树说明 */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">知识树结构说明</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="space-y-2 mt-2">
            <p>
              • <strong>叶子节点</strong>
              ：位于树形结构末端的节点，这些是AI智能分析时会识别匹配的知识点
            </p>
            <p>
              • <strong>非叶子节点</strong>
              ：用于组织和分类的枝干节点，仅作为结构层级，不参与AI知识点识别
            </p>
            <p>
              • <strong>重要提醒</strong>
              ：请确保叶子节点能够全面覆盖该学科的所有题目知识点，因为只有叶子节点才会与试题进行匹配分析
            </p>
            <p>
              • <strong>知识点位置</strong>
              ：一共有4个层级，知识点只能放在第3和第4层级，不能放在第1、第2层级。即第1、第2层级必须拥有叶子节点
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-9">
          {subjects.map(subject => <TabsTrigger key={subject.name} value={subject.name} className="data-[state=active]:bg-opacity-20" style={{
          "--tab-active-color": subject.color,
          color: activeTab === subject.name ? subject.color : undefined,
          borderColor: activeTab === subject.name ? subject.color : undefined
        }}>
              {subject.name}
            </TabsTrigger>)}
        </TabsList>

        <div className="mt-6">
          {subjects.map(subject => <TabsContent key={subject.name} value={subject.name}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle style={{
                color: subject.color
              }} className="text-2xl">
                    {subject.name}知识树
                  </CardTitle>
                  <div className="flex space-x-3 items-center">
                    <Button onClick={() => exportKnowledgeTree(subject.name)} variant="outline" className="flex items-center gap-1">
                      <Download size={16} /> 导出
                    </Button>
                    <Button onClick={triggerFileInput} variant="outline" className="flex items-center gap-1">
                      <Upload size={16} /> 导入
                    </Button>
                    <Input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileImport} className="hidden" />
                    <Button onClick={toggleExpandAll} variant="outline" className="flex items-center gap-1">
                      {expandAll ? <>
                          <ChevronUp size={16} /> 全部收起
                        </> : <>
                          <ChevronDown size={16} /> 全部展开
                        </>}
                    </Button>
                    <Button className="px-4 py-2 rounded-md text-white text-sm flex items-center gap-1" style={{
                  backgroundColor: subject.color
                }} onClick={() => handleAddTopLevel(subject.name)}>
                      <Plus size={16} /> 添加顶级节点
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {importError && <Alert variant="destructive" className="mb-4">
                      <AlertTitle>导入错误</AlertTitle>
                      <AlertDescription>
                        {importError.message}
                        {importError.errorLine && <div className="mt-2 p-2 bg-gray-100 rounded-md font-mono whitespace-pre-wrap">
                            {importError.errorLine}
                          </div>}
                      </AlertDescription>
                    </Alert>}
                  <KnowledgeTree color={subject.color} expandAll={expandAll} ref={ref => setTreeRef(subject.name, ref)} knowledgeData={knowledgeTrees[subject.name] || []} onDataChange={updatedData => handleTreeDataChange(subject.name, updatedData)} />
                </CardContent>
              </Card>
            </TabsContent>)}
        </div>
      </Tabs>

      {/* 导入导出说明对话框 */}
      <div className="mt-6 flex justify-center">
        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <HelpCircle size={16} /> 查看导入导出说明
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>知识树导入导出说明</DialogTitle>
              <DialogDescription>
                了解如何正确导入和导出知识树数据
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold">导出格式</h3>
                <p className="mb-2">
                  知识树导出为纯文本文件(.txt)，使用缩进表示层级关系：
                </p>
                <pre className="bg-gray-100 p-3 rounded-md whitespace-pre overflow-x-auto">
                  {`节点1
  子节点1
    子子节点1
    子子节点2
  子节点2
节点2
  子节点3`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold">导入要求</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>每个层级使用2个空格作为缩进</li>
                  <li>最多支持4个层级</li>
                  <li>每行一个节点名称</li>
                  <li>导入时会完全替换当前学科的知识树</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold">常见问题</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Q: 为什么导入失败？</strong>
                  </p>
                  <p>
                    A:
                    请检查文件格式是否符合要求，特别是缩进是否都是2个空格的倍数，以及是否超过了4层级限制。
                  </p>

                  <p>
                    <strong>Q: 如何快速创建符合格式的文件？</strong>
                  </p>
                  <p>
                    A:
                    可以先导出现有知识树，然后按照相同格式进行修改。或者使用纯文本编辑器，确保使用英文空格（不是制表符）进行缩进。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <DialogClose asChild>
                <Button variant="secondary">关闭</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
}
