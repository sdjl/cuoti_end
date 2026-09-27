"use client";

// 高频错题集创建页，承载筛选错题与生成题集的完整流程
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { toast } from "../../../../../hooks/use-toast.js";
import { createFrequentMistakePack, getFrequentMistakeQuestions, getFrequentMistakeQuestionsByMistakePoint } from "./actions.js";
import CreatePackDialog from "./components/CreatePackDialog.js";
import KnowledgePointFilter from "./components/KnowledgePointFilter.js";
import MistakeList from "./components/MistakeList.js";
import MistakeReasonFilter from "./components/MistakeReasonFilter.js";
import SubjectAndModeFilter from "./components/SubjectAndModeFilter.js";
import TimeRangeFilter from "./components/TimeRangeFilter.js";
export default function CreateFrequentMistakePage() {
  const router = useRouter();

  // 科目和模式
  const [selectedSubject, setSelectedSubject] = useState("");
  const [filterMode, setFilterMode] = useState("knowledge");
  const [excludeExisting, setExcludeExisting] = useState(true);

  // 时间区间
  const [timeRangeType, setTimeRangeType] = useState("all");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  // 查询条件（用于生成错题集）
  const [currentKnowledgePoint, setCurrentKnowledgePoint] = useState(null);
  const [currentMistakePoint, setCurrentMistakePoint] = useState(null);

  // 查询结果
  const [frequentMistakes, setFrequentMistakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 处理知识点查询
  const handleKnowledgePointQuery = async knowledgePoint => {
    if (!selectedSubject) {
      toast({
        title: "请先选择科目",
        description: "科目是必选项",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    setCurrentKnowledgePoint(knowledgePoint);
    setCurrentMistakePoint(null);
    try {
      let startTime;
      let endTime;
      if (timeRangeType === "custom" && startDate && endDate) {
        startTime = startDate.getTime();
        endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
      }
      const data = await getFrequentMistakeQuestions(selectedSubject, startTime, endTime, excludeExisting, knowledgePoint);
      setFrequentMistakes(data);
      setSelectedQuestionIds([]);
      if (data.length === 0) {
        toast({
          title: "没有找到高频错题",
          description: "请尝试调整时间范围或筛选条件。",
          variant: "default"
        });
      } else {
        toast({
          title: "查询成功",
          description: `找到 ${data.length} 道高频错题`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("获取高频错题失败:", error);
      toast({
        title: "获取高频错题失败",
        description: error.message || "请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理错误归因查询
  const handleMistakeReasonQuery = async (mistakePointId, mistakePointName) => {
    if (!selectedSubject) {
      toast({
        title: "请先选择科目",
        description: "科目是必选项",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    setCurrentMistakePoint({
      id: mistakePointId,
      name: mistakePointName
    });
    setCurrentKnowledgePoint(null);
    try {
      let startTime;
      let endTime;
      if (timeRangeType === "custom" && startDate && endDate) {
        startTime = startDate.getTime();
        endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
      }
      const data = await getFrequentMistakeQuestionsByMistakePoint(selectedSubject, mistakePointId, mistakePointName, startTime, endTime, excludeExisting);
      setFrequentMistakes(data);
      setSelectedQuestionIds([]);
      if (data.length === 0) {
        toast({
          title: "没有找到高频错题",
          description: "请尝试调整时间范围或筛选条件。",
          variant: "default"
        });
      } else {
        toast({
          title: "查询成功",
          description: `找到 ${data.length} 道高频错题`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("获取高频错题失败:", error);
      toast({
        title: "获取高频错题失败",
        description: error.message || "请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSelectionChange = selectedIds => {
    setSelectedQuestionIds(selectedIds);
  };

  // 生成时间区间文本
  const getTimeRangeText = () => {
    if (timeRangeType === "all") {
      const today = new Date();
      return `${format(today, "yyyy-MM-dd", {
        locale: zhCN
      })}之前`;
    } else if (startDate && endDate) {
      return `${format(startDate, "yyyy-MM-dd", {
        locale: zhCN
      })}至${format(endDate, "yyyy-MM-dd", {
        locale: zhCN
      })}`;
    }
    return "";
  };

  // 点击生成按钮，打开对话框
  const handleGenerateClick = () => {
    if (selectedQuestionIds.length === 0) {
      toast({
        title: "请选择题目",
        description: "请至少选择一道题目后再生成错题集。",
        variant: "destructive"
      });
      return;
    }
    setDialogOpen(true);
  };

  // 确认创建高频错题集
  const handleConfirmCreate = async (name, description) => {
    setGenerating(true);
    try {
      const result = await createFrequentMistakePack({
        subject: selectedSubject,
        name,
        description,
        questionIds: selectedQuestionIds,
        timeRangeText: getTimeRangeText(),
        knowledgePoint: currentKnowledgePoint || undefined,
        mistakePointName: currentMistakePoint?.name || undefined
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: `已成功创建高频错题集，包含 ${selectedQuestionIds.length} 道题目`,
          variant: "default"
        });

        // 关闭对话框
        setDialogOpen(false);

        // 跳转到列表页面
        router.push("/work/create-pack/frequent-mistake/list");
      } else {
        toast({
          title: "创建失败",
          description: result.error || "请稍后再试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("创建高频错题集失败:", error);
      toast({
        title: "创建失败",
        description: error.message || "请稍后再试",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  return <>
      <WorkHeader title="创建高频错题集" showBackButton={true} backHref="/work/create-pack" backText="返回上一页" />

      <div className="container mx-auto p-6 space-y-6">
        {/* 科目、模式和排除开关 */}
        <SubjectAndModeFilter selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} filterMode={filterMode} onFilterModeChange={setFilterMode} excludeExisting={excludeExisting} onExcludeExistingChange={setExcludeExisting} />

        {/* 时间区间 */}
        <TimeRangeFilter timeRangeType={timeRangeType} onTimeRangeTypeChange={setTimeRangeType} startDate={startDate} onStartDateChange={setStartDate} endDate={endDate} onEndDateChange={setEndDate} />

        {/* 根据知识点筛选 */}
        {filterMode === "knowledge" && <KnowledgePointFilter subject={selectedSubject} onQuery={handleKnowledgePointQuery} loading={loading} />}

        {/* 根据错误归因筛选 */}
        {filterMode === "mistake" && <MistakeReasonFilter subject={selectedSubject} onQuery={handleMistakeReasonQuery} loading={loading} />}

        {/* 题目列表 */}
        {loading ? <div className="bg-white rounded-lg p-12 shadow-sm border">
            <div className="flex flex-col justify-center items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <span className="text-lg text-gray-600">正在查询高频错题...</span>
            </div>
          </div> : frequentMistakes.length > 0 ? <div className="bg-white rounded-lg p-6 shadow-sm border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">高频错题列表</h2>
              <Button onClick={handleGenerateClick} disabled={selectedQuestionIds.length === 0} size="lg">
                生成高频错题集 ({selectedQuestionIds.length})
              </Button>
            </div>
            <MistakeList frequentMistakes={frequentMistakes} onSelectionChange={handleSelectionChange} />
          </div> : null}
      </div>

      {/* 创建对话框 */}
      <CreatePackDialog open={dialogOpen} onOpenChange={setDialogOpen} onConfirm={handleConfirmCreate} loading={generating} />
    </>;
}
