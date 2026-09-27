"use client";

import { Button } from "../../../../../../../../components/ui/button.js";
import { ScrollArea } from "../../../../../../../../components/ui/scroll-area.js";

// 知识点节点类型

export default function KnowledgeTreeSelector({
  treeData,
  selectedPath,
  onNodeSelect,
  searchQuery = ""
}) {
  // 裁剪知识树：保留包含搜索关键词的分支路径
  const pruneKnowledgeTree = nodes => {
    if (!searchQuery.trim()) {
      return nodes;
    }
    const query = searchQuery.toLowerCase();

    // 递归检查分支是否包含匹配的节点
    const branchContainsMatch = node => {
      // 检查当前节点是否匹配
      if (node.name.toLowerCase().includes(query)) {
        return true;
      }

      // 递归检查子节点
      if (node.children) {
        return node.children.some(branchContainsMatch);
      }
      return false;
    };

    // 裁剪节点：只保留匹配的分支路径
    const pruneNode = node => {
      // 如果当前节点匹配，保留整个子树
      if (node.name.toLowerCase().includes(query)) {
        return node;
      }

      // 如果当前节点不匹配，但子树中有匹配的节点，则裁剪子树
      if (node.children) {
        const prunedChildren = node.children.map(pruneNode).filter(Boolean);
        if (prunedChildren.length > 0) {
          return {
            ...node,
            children: prunedChildren
          };
        }
      }
      return null;
    };
    return nodes.filter(branchContainsMatch) // 首先过滤掉完全不匹配的分支
    .map(pruneNode) // 然后裁剪保留的分支
    .filter(Boolean);
  };

  // 获取裁剪后的知识树
  const prunedTreeData = pruneKnowledgeTree(treeData);

  // 根据当前选中路径获取各个层级的节点数据
  const getLevelNodes = level => {
    if (level === 0) {
      // 第一层级直接返回裁剪后的根节点
      return prunedTreeData;
    }

    // 从裁剪后的根节点开始，根据选中路径逐层找到对应的子节点
    let currentNodes = prunedTreeData;
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

  // 检查某个节点是否有子节点
  const hasChildren = node => {
    return !!(node.children && node.children.length > 0);
  };

  // 渲染单个层级
  const renderLevel = level => {
    const nodes = getLevelNodes(level);

    // 第一层级总是显示，其他层级需要上一层有选择且下一层有数据才显示
    let isVisible = level === 0;
    if (level > 0) {
      // 检查上一级是否有选择
      const hasParentSelection = selectedPath[level - 1];
      if (hasParentSelection) {
        // 如果上一级有选择，且当前级有数据，则显示
        isVisible = nodes.length > 0;
      }
    }
    if (!isVisible) {
      return <div key={level} className="min-w-[250px] h-full">
          {/* 占位区域，保持布局 */}
        </div>;
    }
    return <div key={level} className="min-w-[250px] h-full bg-white">
        {/* 内容区域 */}
        <div className="h-full">
          <ScrollArea className="h-[330px]">
            <div className="space-y-1 p-3">
              {nodes.length === 0 ? <div className="text-gray-500 text-sm text-center py-4">
                  暂无数据
                </div> : nodes.map((node, index) => {
              const isSelected = selectedPath[level] === node.name;
              const isLeaf = !hasChildren(node);
              return <Button key={`${level}-${index}-${node.name}`} variant={isSelected ? "default" : "ghost"} size="sm" className={`w-full justify-start text-left h-auto p-2 ${isSelected ? "" : "hover:bg-gray-50"}`} onClick={() => onNodeSelect(level, node.name)}>
                      <span className={`text-sm break-words ${isLeaf ? "italic" : ""}`}>
                        {node.name}
                      </span>
                    </Button>;
            })}
            </div>
          </ScrollArea>
        </div>
      </div>;
  };
  return <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <ScrollArea className="w-full">
        <div className="flex h-[330px]">
          {[0, 1, 2, 3].map((level, index) => <div key={level} className="flex">
              {renderLevel(level)}
              {/* 在非最后一个层级之间添加分隔线 */}
              {index < 3 && <div className="w-px bg-gray-200 h-full flex-shrink-0"></div>}
            </div>)}
        </div>
      </ScrollArea>
    </div>;
}
