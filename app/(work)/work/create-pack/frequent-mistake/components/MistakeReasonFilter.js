"use client";

// 高频错题集错误归因筛选组件，根据科目加载并查询归因
import { AlertCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { ScrollArea } from "../../../../../../components/ui/scroll-area.js";
import { getMistakePoints } from "../actions.js";
export default function MistakeReasonFilter({
  subject,
  onQuery,
  loading = false
}) {
  const [mistakePoints, setMistakePoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 当科目变化时，重新加载错误归因列表
  useEffect(() => {
    const loadMistakePoints = async () => {
      if (!subject) return;
      setIsLoading(true);
      setSelectedPoint(null);
      setSearchText("");
      try {
        const points = await getMistakePoints(subject);
        setMistakePoints(points);
        setFilteredPoints(points);
      } catch (error) {
        console.error("加载错误归因失败:", error);
        setMistakePoints([]);
        setFilteredPoints([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMistakePoints();
  }, [subject]);

  // 处理搜索过滤
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredPoints(mistakePoints);
    } else {
      const filtered = mistakePoints.filter(point => point.name.toLowerCase().includes(searchText.toLowerCase()) || point.description.toLowerCase().includes(searchText.toLowerCase()));
      setFilteredPoints(filtered);
    }
  }, [searchText, mistakePoints]);

  // 处理查询
  const handleQuery = () => {
    if (selectedPoint) {
      onQuery(selectedPoint._id, selectedPoint.name);
    }
  };
  if (isLoading) {
    return <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <h2 className="text-base font-bold">根据错误归因筛选</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-8 text-gray-500 text-sm">
            加载错误归因列表中...
          </div>
        </div>
      </div>;
  }
  if (mistakePoints.length === 0) {
    return <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <h2 className="text-base font-bold">根据错误归因筛选</h2>
        </div>
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="text-center py-8 text-gray-500 text-sm">
            该科目暂无错误归因配置
          </div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <h2 className="text-base font-bold">根据错误归因筛选</h2>
          {selectedPoint && <span className="text-xs text-gray-500 ml-2">
              当前：{selectedPoint.name}
            </span>}
        </div>
        <Button onClick={handleQuery} disabled={!selectedPoint || loading} size="sm">
          {loading ? "查询中..." : "查询高频错题"}
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input type="text" placeholder="搜索错误归因..." value={searchText} onChange={e => setSearchText(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* 错误归因列表 */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-2">
            {filteredPoints.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">
                没有找到匹配的错误归因
              </div> : filteredPoints.map(point => {
            const isSelected = selectedPoint?._id === point._id;
            return <button key={point._id} onClick={() => setSelectedPoint(point)} className={`w-full p-3 rounded-md text-left transition-all ${isSelected ? "bg-orange-50 border border-orange-400 shadow-sm" : "bg-gray-50 hover:bg-gray-100 border border-transparent"}`}>
                    <h4 className={`font-medium text-sm ${isSelected ? "text-orange-700" : "text-gray-900"}`}>
                      {point.name}
                    </h4>
                    {point.description && <p className="text-xs text-gray-500 mt-1">
                        {point.description}
                      </p>}
                  </button>;
          })}
          </div>
        </ScrollArea>
      </div>

      {!selectedPoint && <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <p className="text-xs text-orange-800">
            请选择一个错误归因后点击查询按钮
          </p>
        </div>}
    </div>;
}
