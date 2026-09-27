"use client";

// 知识点错题详情页，汇总题目信息与对应错题记录分析
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getQuestionInfoAction, getQuestionMistakeRecordsAction } from "./actions.js";
import KnowledgeMistakeList from "./components/KnowledgeMistakeList.js";
import QuestionInfoCard from "./components/QuestionInfoCard.js";
export default function QuestionDetailPage() {
  const params = useParams();
  const questionId = params.questionId;
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideStudentInfo, setHideStudentInfo] = useState(true);
  const [questionInfo, setQuestionInfo] = useState(null);
  const [subject, setSubject] = useState("");
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] = useState("all");

  // 用于滚动到加载区域的引用
  const loadingAreaRef = useRef(null);
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 准备过滤参数
      const correctionStatus = selectedCorrectionStatus !== "all" ? selectedCorrectionStatus : undefined;

      // 并行获取题目信息和错题记录
      const [questionData, recordsData] = await Promise.all([getQuestionInfoAction(questionId), getQuestionMistakeRecordsAction(questionId, correctionStatus)]);
      setQuestionInfo(questionData);
      setRecords(recordsData);

      // 从第一条记录的 courseId 获取科目信息
      if (recordsData.length > 0 && recordsData[0].courseId) {
        // 调用 Server Action 获取科目信息
        const {
          getCourseSubjectAction
        } = await import("./actions");
        const courseSubject = await getCourseSubjectAction(recordsData[0].courseId);
        if (courseSubject) {
          setSubject(courseSubject);
        }
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error ? error.message : "加载数据失败"
      });
    } finally {
      setIsLoading(false);
    }
  }, [questionId, selectedCorrectionStatus, toast]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 当过关状态改变且正在加载时，滚动到加载区域
  useEffect(() => {
    if (isLoading && loadingAreaRef.current) {
      // 使用 smooth 滚动效果
      loadingAreaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [isLoading, selectedCorrectionStatus]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="题目错题记录" />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 题目信息 - 始终显示，不受 isLoading 影响 */}
          {questionInfo && <QuestionInfoCard questionInfo={questionInfo} />}

          {/* 控制栏 */}
          <Card className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="hide-student-info" checked={hideStudentInfo} onCheckedChange={setHideStudentInfo} />
                  <Label htmlFor="hide-student-info" className="cursor-pointer">
                    隐藏学生信息
                  </Label>
                </div>

                {/* 过关状态过滤 */}
                <Select value={selectedCorrectionStatus} onValueChange={setSelectedCorrectionStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="过关状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="corrected">已过关</SelectItem>
                    <SelectItem value="pending">待过关</SelectItem>
                    <SelectItem value="stubborn">顽固错题</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">
                  {records.length}
                </span>{" "}
                条错题记录
              </div>
            </div>
          </Card>

          {/* 错题记录列表或加载状态 */}
          <div ref={loadingAreaRef}>
            {isLoading ? <div className="flex justify-center items-center py-12 min-h-[300px]">
                <div className="text-gray-500">加载中...</div>
              </div> : <KnowledgeMistakeList records={records} isLoading={isLoading} hideStudentInfo={hideStudentInfo} subject={subject} />}
          </div>
        </div>
      </main>
    </div>;
}
