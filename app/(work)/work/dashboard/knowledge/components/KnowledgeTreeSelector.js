"use client";

/**
 * 知识树选择器组件
 *
 * 依赖的 Server Action: app/(work)/work/dashboard/knowledge/componentsServerActions/knowledgeTreeActions.ts
 */
import { BookOpen, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollArea } from "../../../../../../components/ui/scroll-area.js";
import { getKnowledgeTreeAction } from "../componentsServerActions/knowledgeTreeSelectorActions.js";
export default function KnowledgeTreeSelector({
  subject,
  onKnowledgePointSelect
}) {
  const [treeData, setTreeData] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 当科目变化时，重新加载知识树
  useEffect(() => {
    const loadKnowledgeTree = async () => {
      if (!subject) return;
      setIsLoading(true);
      setSelectedPath([]); // 重置选中路径
      try {
        const tree = await getKnowledgeTreeAction(subject);
        setTreeData(tree);
      } catch (error) {
        console.error("加载知识树失败:", error);
        setTreeData([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadKnowledgeTree();
  }, [subject]);

  // 获取指定层级的节点列表
  const getLevelNodes = level => {
    if (level === 0) return treeData;
    let currentNodes = treeData;
    for (let i = 0; i < level; i++) {
      const selectedName = selectedPath[i];
      if (!selectedName) return [];
      const foundNode = currentNodes.find(node => node.name === selectedName);
      if (!foundNode || !foundNode.children) return [];
      currentNodes = foundNode.children;
    }
    return currentNodes;
  };

  // 处理节点选择
  const handleNodeSelect = (level, node, isLeaf) => {
    const newPath = [...selectedPath.slice(0, level), node.name];
    setSelectedPath(newPath);

    // 通知父组件
    if (onKnowledgePointSelect) {
      onKnowledgePointSelect(node, newPath, isLeaf);
    }
  };

  // 渲染单个层级
  const renderLevel = level => {
    const nodes = getLevelNodes(level);
    if (nodes.length === 0) return null;
    const levelTitles = ["一级知识点", "二级知识点", "三级知识点", "四级知识点"];
    return <div key={level} className="w-1/4 flex-shrink-0 h-full bg-gray-50" style={{
      borderRight: level < 3 ? "1px solid #e5e7eb" : "none"
    }}>
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-700">
            {levelTitles[level]}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            共 {nodes.length} 个知识点
          </p>
        </div>

        <ScrollArea className="h-[450px]">
          <div className="space-y-2 p-3">
            {nodes.map((node, index) => {
            const isSelected = selectedPath[level] === node.name;
            const hasChildren = node.children && node.children.length > 0;
            const isLeaf = !hasChildren; // 叶子节点

            return <button key={`${node.name}-${index}`} onClick={() => handleNodeSelect(level, node, isLeaf)} className={`w-full p-3 rounded-lg text-left transition-all ${isSelected ? "bg-blue-50 border-2 border-blue-500 shadow-md" : "bg-white hover:bg-gray-50 border-2 border-transparent"}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-sm ${isSelected ? "text-blue-700" : "text-gray-900"} ${isLeaf ? "italic" : ""}`}>
                      {node.name}
                    </h4>
                    {hasChildren && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />}
                  </div>
                </button>;
          })}
          </div>
        </ScrollArea>
      </div>;
  };
  if (isLoading) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">知识点树</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-12 text-gray-500">加载知识树中...</div>
        </div>
      </div>;
  }
  if (treeData.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">知识点树</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-12 text-gray-500">
            该科目暂无知识树配置
          </div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">知识点树</h2>
        {selectedPath.length > 0 && <span className="text-sm text-gray-500 ml-auto">
            当前：{selectedPath.join(" > ")}
          </span>}
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden max-w-full">
        <div className="overflow-x-auto">
          <div className="flex h-[520px] min-w-[800px]">
            {[0, 1, 2, 3].map(level => renderLevel(level))}
          </div>
        </div>
      </div>

      {selectedPath.length === 0 && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            请选择一个知识点以查看详细统计和题目列表
          </p>
        </div>}
    </div>;
}
