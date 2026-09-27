"use client";

import { Loader2, Plus, Search, X } from "lucide-react";
// 知识点管理组件，用于为题目添加和管理关联的知识点
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../../../../components/ui/popover.js";
import { useToast } from "../../../../../../../../../../hooks/use-toast.js";
import { getSubjectKnowledgePoints } from "../../../../../../../../../../lib/config/knowledgeTree.js";

// 创建简单的ScrollArea组件作为备用
const ScrollArea = ({
  className,
  children
}) => <div className={`overflow-auto ${className || ""}`}>{children}</div>;
export function KnowledgePointsManager({
  knowledgePoints,
  subject,
  onKnowledgePointsChange
}) {
  const {
    toast
  } = useToast();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingKnowledgePoints, setIsLoadingKnowledgePoints] = useState(false);
  const [allKnowledgePoints, setAllKnowledgePoints] = useState([]);

  // 获取题目所属学科的所有知识点
  useEffect(() => {
    async function fetchKnowledgePoints() {
      setIsLoadingKnowledgePoints(true);
      try {
        const points = await getSubjectKnowledgePoints(subject, false);
        setAllKnowledgePoints(points);
      } catch (error) {
        console.error("加载知识点失败:", error);
        toast({
          title: "错误",
          description: "加载知识点列表失败",
          variant: "destructive"
        });
      } finally {
        setIsLoadingKnowledgePoints(false);
      }
    }
    fetchKnowledgePoints();
  }, [subject, toast]);

  // 搜索知识点
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const results = allKnowledgePoints.filter(point => point.includes(searchText) && !knowledgePoints.includes(point));
    setSearchResults(results.slice(0, 10)); // 限制结果数量
  }, [searchText, allKnowledgePoints, knowledgePoints]);

  // 添加知识点
  const addKnowledgePoint = point => {
    if (!knowledgePoints.includes(point)) {
      onKnowledgePointsChange([...knowledgePoints, point]);
      setSearchText("");
    }
  };

  // 删除知识点
  const removeKnowledgePoint = point => {
    onKnowledgePointsChange(knowledgePoints.filter(p => p !== point));
  };
  return <div className="space-y-2">
      <Label>知识点</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {knowledgePoints.map((point, index) => <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
            {point}
            <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground" onClick={() => removeKnowledgePoint(point)}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>)}
        {knowledgePoints.length === 0 && <p className="text-sm text-muted-foreground">暂无关联知识点</p>}
      </div>

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="flex items-center gap-1 mt-3" disabled={isLoadingKnowledgePoints}>
              {isLoadingKnowledgePoints ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              添加知识点
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索知识点..." className="border-0 focus-visible:ring-0 h-8 px-2" />
              </div>
            </div>
            <ScrollArea className="h-72">
              {searchResults.length > 0 ? <div className="p-2">
                  {searchResults.map((point, index) => <Button key={index} type="button" variant="ghost" className="w-full justify-start h-auto py-2 px-4 rounded-sm text-sm" onClick={() => addKnowledgePoint(point)}>
                      <span className="truncate">{point}</span>
                    </Button>)}
                </div> : <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchText ? "未找到匹配的知识点" : "请输入关键词搜索知识点"}
                </div>}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>;
}
