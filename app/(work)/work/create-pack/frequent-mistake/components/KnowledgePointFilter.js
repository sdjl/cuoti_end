"use client";

// 高频错题集知识点筛选面板，加载知识树供教师逐级选择
import { BookOpen, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getKnowledgeTreeAction } from "../../../dashboard/knowledge/componentsServerActions/knowledgeTreeSelectorActions.js";
import { Button } from "../../../../../../components/ui/button.js";
import { ScrollArea } from "../../../../../../components/ui/scroll-area.js";
export default function KnowledgePointFilter({
  subject,
  onQuery,
  loading = false
}) {
  const [treeData, setTreeData] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState(null);
  const [isLeafSelected, setIsLeafSelected] = useState(false);

  // 当科目变化时，重新加载知识树
  useEffect(() => {
    const loadKnowledgeTree = async () => {
      if (!subject) return;
      setIsTreeLoading(true);
      setSelectedPath([]);
      setSelectedKnowledgePoint(null);
      setIsLeafSelected(false);
      try {
        const tree = await getKnowledgeTreeAction(subject);
        setTreeData(tree);
      } catch (error) {
        console.error("加载知识树失败:", error);
        setTreeData([]);
      } finally {
        setIsTreeLoading(false);
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
    setSelectedKnowledgePoint(node.name);
    setIsLeafSelected(isLeaf);
  };

  // 处理查询
  const handleQuery = () => {
    if (selectedKnowledgePoint && isLeafSelected) {
      onQuery(selectedKnowledgePoint);
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
        <div className="px-3 py-2 bg-white border-b border-gray-200">
          <h3 className="font-semibold text-xs text-gray-700">
            {levelTitles[level]}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            共 {nodes.length} 个知识点
          </p>
        </div>

        <ScrollArea className="h-[350px]">
          <div className="space-y-1.5 p-2">
            {nodes.map((node, index) => {
            const isSelected = selectedPath[level] === node.name;
            const hasChildren = node.children && node.children.length > 0;
            const isLeaf = !hasChildren;
            return <button key={`${node.name}-${index}`} onClick={() => handleNodeSelect(level, node, isLeaf)} className={`w-full p-2 rounded-md text-left transition-all ${isSelected ? "bg-blue-50 border border-blue-400 shadow-sm" : "bg-white hover:bg-gray-50 border border-transparent"}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-xs ${isSelected ? "text-blue-700" : "text-gray-900"} ${isLeaf ? "italic" : ""}`}>
                      {node.name}
                    </h4>
                    {hasChildren && <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />}
                  </div>
                </button>;
          })}
          </div>
        </ScrollArea>
      </div>;
  };
  if (isTreeLoading) {
    return <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold">根据知识点筛选</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-8 text-gray-500 text-sm">
            加载知识树中...
          </div>
        </div>
      </div>;
  }
  if (treeData.length === 0) {
    return <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold">根据知识点筛选</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-8 text-gray-500 text-sm">
            该科目暂无知识树配置
          </div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold">根据知识点筛选</h2>
          {selectedPath.length > 0 && <span className="text-xs text-gray-500 ml-2">
              当前：{selectedPath.join(" > ")}
            </span>}
        </div>
        <Button onClick={handleQuery} disabled={!isLeafSelected || loading} size="sm">
          {loading ? "查询中..." : "查询高频错题"}
        </Button>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex h-[400px]">
            {[0, 1, 2, 3].map(level => renderLevel(level))}
          </div>
        </div>
      </div>

      {selectedPath.length === 0 && <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-xs text-blue-800">
            请选择一个叶子节点（斜体显示）后点击查询按钮
          </p>
        </div>}

      {selectedPath.length > 0 && !isLeafSelected && <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <p className="text-xs text-amber-800">
            当前选中的不是叶子节点，请继续选择下级知识点
          </p>
        </div>}
    </div>;
}
