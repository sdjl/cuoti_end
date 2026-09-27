"use client";

import { Search, X } from "lucide-react";
// 题目搜索组件，提供按题目内容、知识点、难度等条件搜索题目的功能
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
import KnowledgeTreeSelector from "./KnowledgeTreeSelector.js";
export default function QuestionSearch({
  subject,
  onSearch,
  onReset,
  isSearching
}) {
  // 搜索参数
  const [questionText, setQuestionText] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState([]);

  // 知识点相关状态
  const [knowledgePointInput, setKnowledgePointInput] = useState("");
  const [allKnowledgePoints, setAllKnowledgePoints] = useState([]);
  const [filteredKnowledgePoints, setFilteredKnowledgePoints] = useState([]);
  const [showKnowledgeDropdown, setShowKnowledgeDropdown] = useState(false);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);

  // 知识树相关状态
  const [knowledgeTree, setKnowledgeTree] = useState([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState([]);
  const knowledgeInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // 难度选项
  const difficultyOptions = [{
    value: "all",
    label: "不限难度"
  }, {
    value: "容易",
    label: "容易"
  }, {
    value: "中等",
    label: "中等"
  }, {
    value: "困难",
    label: "困难"
  }, {
    value: "超难",
    label: "超难"
  }, {
    value: "未知",
    label: "未知"
  }];

  // 获取知识点列表
  useEffect(() => {
    const fetchKnowledgePoints = async () => {
      try {
        setIsLoadingKnowledge(true);
        // 动态导入获取知识点的函数
        const {
          getKnowledgePointsAction
        } = await import("../actions");
        const points = await getKnowledgePointsAction(subject);
        setAllKnowledgePoints(points);
      } catch (error) {
        console.error("获取知识点失败:", error);
        setAllKnowledgePoints([]);
      } finally {
        setIsLoadingKnowledge(false);
      }
    };
    if (subject) {
      fetchKnowledgePoints();
    }
  }, [subject]);

  // 获取知识树配置
  useEffect(() => {
    const fetchKnowledgeTree = async () => {
      try {
        setIsLoadingTree(true);
        // 动态导入获取知识树配置的函数
        const {
          getKnowledgeTreeConfigAction
        } = await import("../actions");
        const config = await getKnowledgeTreeConfigAction(subject);
        if (config?.nodes) {
          // 转换为组件可用的格式
          const convertToTreeNodes = systemNodes => {
            return systemNodes.map(node => ({
              name: node.name,
              children: node.children ? convertToTreeNodes(node.children) : undefined
            }));
          };
          setKnowledgeTree(convertToTreeNodes(config.nodes));
        } else {
          setKnowledgeTree([]);
        }
      } catch (error) {
        console.error("获取知识树配置失败:", error);
        setKnowledgeTree([]);
      } finally {
        setIsLoadingTree(false);
      }
    };
    if (subject) {
      fetchKnowledgeTree();
    }
  }, [subject]);

  // 过滤知识点
  useEffect(() => {
    if (!knowledgePointInput.trim()) {
      setFilteredKnowledgePoints([]);
      setShowKnowledgeDropdown(false);
      return;
    }
    const filtered = allKnowledgePoints.filter(point => point.toLowerCase().includes(knowledgePointInput.toLowerCase()) && !selectedKnowledgePoints.includes(point));
    setFilteredKnowledgePoints(filtered);
    setShowKnowledgeDropdown(filtered.length > 0);
  }, [knowledgePointInput, allKnowledgePoints, selectedKnowledgePoints]);

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && knowledgeInputRef.current && !knowledgeInputRef.current.contains(event.target)) {
        setShowKnowledgeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 添加知识点
  const handleAddKnowledgePoint = point => {
    if (!selectedKnowledgePoints.includes(point)) {
      setSelectedKnowledgePoints(prev => [...prev, point]);
    }
    setKnowledgePointInput("");
    setShowKnowledgeDropdown(false);
  };

  // 检查指定路径的节点是否为叶子节点
  const isLeafNode = path => {
    if (!knowledgeTree || path.length === 0) {
      return false;
    }
    let currentNodes = knowledgeTree;
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

  // 从知识树选择知识点
  const handleTreeNodeSelect = (level, nodeName) => {
    // 截断当前层级之后的路径，然后设置当前层级的选择
    const newPath = [...selectedPath.slice(0, level), nodeName];
    setSelectedPath(newPath);

    // 检查新路径是否为叶子节点
    if (isLeafNode(newPath)) {
      // 如果是叶子节点，添加到搜索条件
      handleAddKnowledgePoint(nodeName);
      // 可选：重置路径选择
      // setSelectedPath([]);
    }
  };

  // 移除知识点
  const handleRemoveKnowledgePoint = point => {
    setSelectedKnowledgePoints(prev => prev.filter(p => p !== point));
  };

  // 处理知识点输入键盘事件
  const handleKnowledgeInputKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredKnowledgePoints.length > 0) {
        // 如果有匹配的知识点，选择第一个
        handleAddKnowledgePoint(filteredKnowledgePoints[0]);
      } else if (knowledgePointInput.trim()) {
        // 如果没有匹配但输入框有内容，直接添加输入的内容作为知识点
        handleAddKnowledgePoint(knowledgePointInput.trim());
      }
    }
    if (e.key === "Escape") {
      setShowKnowledgeDropdown(false);
    }
  };

  // 执行搜索
  const handleSearch = () => {
    onSearch({
      questionText: questionText.trim(),
      knowledgePoints: selectedKnowledgePoints,
      difficulty: difficulty === "all" ? "" : difficulty
    });
  };

  // 重置搜索条件
  const handleReset = () => {
    setQuestionText("");
    setDifficulty("all");
    setSelectedKnowledgePoints([]);
    setKnowledgePointInput("");
    setShowKnowledgeDropdown(false);
    setTreeSearchQuery("");
    setSelectedPath([]);
    // 调用父组件的重置方法清空搜索结果
    if (onReset) {
      onReset();
    }
  };
  return <div className="space-y-3">
      {/* 第一行：主要搜索条件 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* 题目内容 */}
        <div className="md:col-span-5">
          <Label htmlFor="questionText" className="text-sm">
            题目内容
          </Label>
          <Input id="questionText" value={questionText} onChange={e => setQuestionText(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !isSearching) {
            handleSearch();
          }
        }} placeholder="输入题目关键词（与关系，空格分隔）..." disabled={isSearching} className="mt-1" />
        </div>

        {/* 知识点输入 */}
        <div className="md:col-span-3 relative">
          <Label className="text-sm">
            知识点{" "}
            {isLoadingKnowledge && <span className="text-xs text-gray-500">(加载中...)</span>}
          </Label>
          <Input ref={knowledgeInputRef} value={knowledgePointInput} onChange={e => setKnowledgePointInput(e.target.value)} onKeyDown={handleKnowledgeInputKeyDown} placeholder="知识点(或关系)..." disabled={isSearching || isLoadingKnowledge} className="mt-1" />

          {/* 知识点下拉列表 */}
          {showKnowledgeDropdown && <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredKnowledgePoints.map(point => <button key={point} type="button" className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm" onClick={() => handleAddKnowledgePoint(point)}>
                  {point}
                </button>)}
            </div>}
        </div>

        {/* 难度选择 */}
        <div className="md:col-span-2">
          <Label className="text-sm">难度</Label>
          <Select value={difficulty} onValueChange={setDifficulty} disabled={isSearching}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="选择难度" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map(option => <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="md:col-span-2 flex space-x-2">
          <Button onClick={handleSearch} disabled={isSearching} size="sm">
            {isSearching ? <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                搜索
              </> : <>
                <Search className="h-4 w-4 mr-1" />
                搜索
              </>}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSearching} size="sm">
            重置
          </Button>
        </div>
      </div>

      {/* 第二行：已选择的知识点 */}
      {selectedKnowledgePoints.length > 0 && <div>
          <div className="text-xs text-gray-600 mb-1">
            已选知识点（或关系搜索）:
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedKnowledgePoints.map(point => <Badge key={point} variant="secondary" className="pr-1 text-xs">
                {point}
                <button type="button" className="ml-1 hover:bg-gray-300 rounded-full" onClick={() => handleRemoveKnowledgePoint(point)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>)}
          </div>
        </div>}

      {/* 第三行：知识树选择器 */}
      {knowledgeTree.length > 0 && <div className="border-t pt-3">
          {/* 知识树搜索框 */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                知识树（点击叶子节点添加到搜索条件）
              </Label>
              <Input placeholder="搜索知识树..." value={treeSearchQuery} onChange={e => setTreeSearchQuery(e.target.value)} className="h-8 text-sm max-w-xs" />
            </div>
          </div>

          {/* 知识树内容 */}
          {isLoadingTree ? <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              加载知识树中...
            </div> : <KnowledgeTreeSelector treeData={knowledgeTree} selectedPath={selectedPath} onNodeSelect={handleTreeNodeSelect} searchQuery={treeSearchQuery} />}
        </div>}
    </div>;
}
