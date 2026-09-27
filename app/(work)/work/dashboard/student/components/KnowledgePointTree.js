"use client";

/**
 * 知识点树组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/knowledgeTreeActions.ts
 *
 * 功能：
 * - 显示学生某个科目的知识点掌握情况（树形结构）
 * - 点击叶子节点（知识点）在新窗口打开错题页面
 * - 显示已过关、未过关、顽固错题三个统计数据
 */
import { BarChart3, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "../../../../../../components/ui/scroll-area.js";
export default function KnowledgePointTree({
  data,
  studentId = ""
}) {
  // 选中的路径，每一项对应一个层级的节点名称
  const [selectedPath, setSelectedPath] = useState([]);

  // 根据当前选中路径获取各个层级的节点数据
  const getLevelNodes = level => {
    if (level === 0) {
      return data;
    }
    let currentNodes = data;
    for (let i = 0; i < level; i++) {
      const selectedName = selectedPath[i];
      if (!selectedName) {
        return [];
      }
      const foundNode = currentNodes.find(node => node.name === selectedName);
      if (!foundNode || !foundNode.children) {
        return [];
      }
      currentNodes = foundNode.children;
    }
    return currentNodes;
  };

  // 处理节点选择
  const handleNodeSelect = (level, nodeName, isLeaf) => {
    // 如果是叶子节点（知识点），在新窗口打开错题页面
    if (isLeaf && studentId) {
      const url = `/work/dashboard/student/${studentId}/mistake/${encodeURIComponent(nodeName)}`;
      window.open(url, "_blank");
      return;
    }

    // 非叶子节点，更新选中路径
    const newPath = [...selectedPath.slice(0, level), nodeName];
    setSelectedPath(newPath);
  };

  // 检查某个节点是否有子节点
  const hasChildren = node => {
    return !!(node.children && node.children.length > 0);
  };

  // 渲染单个知识点节点
  const renderNode = (node, level, isSelected) => {
    // 计算掌握率，避免除以0
    const masteredRate = node.totalCount > 0 ? Math.round(node.masteredCount / node.totalCount * 100) : 0;
    const isLeaf = !hasChildren(node);

    // 根据掌握率确定颜色
    const getProgressColor = () => {
      if (masteredRate >= 80) return "bg-green-500";
      if (masteredRate >= 60) return "bg-blue-500";
      if (masteredRate >= 40) return "bg-yellow-500";
      return "bg-red-500";
    };
    return <button onClick={() => handleNodeSelect(level, node.name, isLeaf)} className={`w-full p-3 rounded-lg text-left transition-all ${isSelected ? "bg-blue-50 border-2 border-blue-500 shadow-md" : "bg-white hover:bg-gray-50 border-2 border-transparent"} ${isLeaf ? "cursor-pointer" : ""}`}>
        {/* 知识点名称和箭头 */}
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-medium text-sm ${isSelected ? "text-blue-700" : "text-gray-900"} ${isLeaf ? "italic" : ""}`}>
            {node.name}
          </h4>
          {!isLeaf && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />}
        </div>

        {/* 统计数据 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>错题 {node.totalCount} 道</span>
            <span className="font-semibold text-blue-600">{masteredRate}%</span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${getProgressColor()}`} style={{
            width: `${masteredRate}%`
          }} />
          </div>

          {/* 已过关/未过关/顽固 */}
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-green-600">已过关 {node.masteredCount}</span>
            <span className="text-orange-600">
              未过关 {node.notMasteredCount}
            </span>
            <span className="text-red-600">顽固 {node.stubbornCount}</span>
          </div>
        </div>
      </button>;
  };

  // 渲染单个层级
  const renderLevel = level => {
    const nodes = getLevelNodes(level);

    // 第一层级总是显示，其他层级需要上一层有选择且下一层有数据才显示
    let isVisible = level === 0;
    if (level > 0) {
      const hasParentSelection = selectedPath[level - 1];
      if (hasParentSelection) {
        isVisible = nodes.length > 0;
      }
    }
    if (!isVisible) {
      return null;
    }
    const levelTitles = ["一级知识点", "二级知识点", "三级知识点", "四级知识点"];
    return <div key={level} className="w-1/4 flex-shrink-0 h-full bg-gray-50" style={{
      borderRight: level < 3 ? "1px solid #e5e7eb" : "none"
    }}>
        {/* 层级标题 */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h3 className="font-semibold text-sm text-gray-700">
            {levelTitles[level]}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            共 {nodes.length} 个知识点
          </p>
        </div>

        {/* 内容区域 */}
        <ScrollArea className="h-[450px]">
          <div className="space-y-2 p-3">
            {nodes.length === 0 ? <div className="text-gray-500 text-sm text-center py-8">
                暂无数据
              </div> : nodes.map((node, index) => {
            const isSelected = selectedPath[level] === node.name;
            return <div key={`${level}-${index}-${node.name}`}>
                    {renderNode(node, level, isSelected)}
                  </div>;
          })}
          </div>
        </ScrollArea>
      </div>;
  };
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">知识点课程错题统计</h2>
        </div>
        <p className="text-sm text-gray-600">
          点击知识点查看下级内容，选中的知识点可查看错题详情
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex h-[520px]">
            {[0, 1, 2, 3].map(level => renderLevel(level))}
          </div>
        </div>
      </div>

      {/* 面包屑导航 */}
      {selectedPath.length > 0 && <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-600">当前位置：</span>
            {selectedPath.map((name, index) => <div key={index} className="flex items-center gap-2">
                <button onClick={() => setSelectedPath(selectedPath.slice(0, index + 1))} className="text-blue-600 hover:text-blue-700 font-medium">
                  {name}
                </button>
                {index < selectedPath.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>)}
          </div>
        </div>}
    </div>;
}
