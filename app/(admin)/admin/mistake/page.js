"use client";

import { Info } from "lucide-react";
// 错误归因管理页面，用于管理各学科的错误归因，包括创建、编辑和删除
import { useCallback, useEffect, useState } from "react";
import MistakeFilters from "./components/MistakeFilters.js";
import MistakeList from "./components/MistakeList.js";
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../hooks/useAdminConfig.js";
import { DISPLAY_TEXT } from "../../../../lib/config/constants.js";
import { createMistakePoint, deleteMistakePoint, getMistakePoints, getMistakePointsCount, updateMistakePoint } from "./actions.js";

// 每页显示的错误归因数量
const PAGE_SIZE = 50;
export default function MistakePage() {
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actualSearchTerm, setActualSearchTerm] = useState(""); // 实际用于查询的搜索词
  const [mistakePoints, setMistakePoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterChanged, setIsFilterChanged] = useState(false);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 设置默认活动标签
  useEffect(() => {
    if (!activeTab && subjects.length > 0) {
      setActiveTab(subjects[0].name);
    }
  }, [subjects, activeTab]);

  // 获取错误归因数据
  const fetchMistakePoints = useCallback(async () => {
    if (!activeTab) return;
    setIsLoading(true);
    try {
      const keyword = actualSearchTerm.trim();
      const pageNum = currentPage - 1;
      const [pointsResult, countResult] = await Promise.all([getMistakePoints({
        subject: activeTab,
        pageNum,
        pageSize: PAGE_SIZE,
        keyword
      }), getMistakePointsCount({
        subject: activeTab,
        keyword
      })]);
      if (pointsResult.success && pointsResult.data) {
        setMistakePoints(pointsResult.data);
      } else {
        setMistakePoints([]);
        if (pointsResult.error) {
          toast({
            title: "错误",
            description: pointsResult.error,
            variant: "destructive"
          });
        }
      }
      if (countResult.success && countResult.data !== undefined) {
        setTotalCount(countResult.data);
      } else {
        setTotalCount(0);
        if (countResult.error) {
          toast({
            title: "错误",
            description: countResult.error,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败:`, error);
      toast({
        title: "错误",
        description: `获取${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, actualSearchTerm, currentPage, toast]);

  // 当页码或筛选条件变更时获取数据
  useEffect(() => {
    fetchMistakePoints();
  }, [fetchMistakePoints]);

  // 当筛选条件发生变化时，标记需要重置页码
  useEffect(() => {
    setIsFilterChanged(true);
  }, [actualSearchTerm, activeTab]);

  // 处理筛选条件变化后的页码重置
  useEffect(() => {
    if (isFilterChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterChanged(false);
  }, [isFilterChanged, currentPage]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setActualSearchTerm(searchTerm);
  }, [searchTerm]);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setActualSearchTerm("");
    setCurrentPage(1);
  }, []);

  // 处理创建错误归因
  const handleCreateMistakePoint = useCallback(async (name, description) => {
    if (!activeTab) return false;
    try {
      const result = await createMistakePoint({
        subject: activeTab,
        name,
        description
      });
      if (result.success) {
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}创建成功`
        });
        await fetchMistakePoints();
        return true;
      } else {
        if (result.error) {
          toast({
            title: "失败",
            description: result.error,
            variant: "destructive"
          });
        }
        return false;
      }
    } catch (error) {
      console.error(`创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      toast({
        title: "错误",
        description: `创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
        variant: "destructive"
      });
      return false;
    }
  }, [activeTab, fetchMistakePoints, toast]);

  // 处理编辑错误归因
  const handleEditMistakePoint = useCallback(async (id, name, description) => {
    try {
      const result = await updateMistakePoint(id, {
        name,
        description
      });
      if (result.success) {
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}编辑成功`
        });
        await fetchMistakePoints();
        return true;
      } else {
        if (result.error) {
          toast({
            title: "失败",
            description: result.error,
            variant: "destructive"
          });
        }
        return false;
      }
    } catch (error) {
      console.error(`编辑${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      toast({
        title: "错误",
        description: `编辑${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
        variant: "destructive"
      });
      return false;
    }
  }, [fetchMistakePoints, toast]);

  // 处理删除错误归因
  const handleDeleteMistakePoint = useCallback(async pointId => {
    try {
      const result = await deleteMistakePoint(pointId);
      if (result.success) {
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}删除成功`
        });
        await fetchMistakePoints();
        return true;
      } else {
        if (result.error) {
          toast({
            title: "失败",
            description: result.error,
            variant: "destructive"
          });
        }
        return false;
      }
    } catch (error) {
      console.error(`删除${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      toast({
        title: "错误",
        description: `删除${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
        variant: "destructive"
      });
      return false;
    }
  }, [fetchMistakePoints, toast]);
  if (subjectsLoading) {
    return <div>加载中...</div>;
  }
  return <div className="space-y-6">
      {/* 错误归因管理说明 */}
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          {DISPLAY_TEXT.ERROR_ATTRIBUTION}管理说明
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          <div className="space-y-2 mt-2">
            <p>
              • <strong>数据关联</strong>：{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              会与学生答卷中的题目数据建立关联，用于统计错误次数和生成分析报告
            </p>
            <p>
              • <strong>编辑注意</strong>
              ：修改{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              名称时，已有的关联数据和统计结果不会改变，仍保持原有的关联关系
            </p>
            <p>
              • <strong>重要提醒</strong>
              ：如需改变{DISPLAY_TEXT.ERROR_ATTRIBUTION}的含义或分类，建议新建
              {DISPLAY_TEXT.ERROR_ATTRIBUTION}
              而非修改现有名称，以确保数据统计的准确性
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full mb-4" style={{
        gridTemplateColumns: `repeat(${subjects.length}, 1fr)`
      }}>
          {subjects.map(subject => <TabsTrigger key={subject.name} value={subject.name} className="data-[state=active]:bg-white data-[state=active]:shadow-sm" style={{
          color: activeTab === subject.name ? subject.color : undefined
        }}>
              {subject.name}
            </TabsTrigger>)}
        </TabsList>

        {subjects.map(subject => <TabsContent key={subject.name} value={subject.name} className="space-y-6">
            <MistakeFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={handleSearch} onReset={resetFilters} onCreateMistakePoint={handleCreateMistakePoint} subjectColor={subject.color} />

            <MistakeList mistakePoints={mistakePoints} isLoading={isLoading} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onEditMistakePoint={handleEditMistakePoint} onDeleteMistakePoint={handleDeleteMistakePoint} />
          </TabsContent>)}
      </Tabs>
    </div>;
}
