"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 题目列表页面，展示一次口述核心知识点参与记录的所有题目和整体评语
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { getQuizTakeQuestionsAction } from "./actions.js";
import OverallComment from "./components/OverallComment.js";
import QuestionCard from "./components/QuestionCard.js";
export default function QuestionsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const takeId = params.takeId;

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取数据
  const fetchData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const result = await getQuizTakeQuestionsAction(takeId);
      setData(result);
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}题目详情失败:`, error);
      toast({
        title: "获取数据失败",
        description: `获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}题目详情时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [takeId, toast]);

  // 初始加载数据
  useEffect(() => {
    if (takeId) {
      fetchData(false);
    }
  }, [takeId, fetchData]);

  // 手动刷新数据
  const handleRefresh = () => {
    fetchData(true);
  };

  // 返回上一页
  const handleGoBack = () => {
    router.push("/work/quiz/takeList");
  };
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}题目列表`} showBackButton={true} backHref="/work/quiz/takeList" backText="返回列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        </main>
      </div>;
  }
  if (!data) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}题目列表`} showBackButton={true} backHref="/work/quiz/takeList" backText="返回列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">未找到相关数据</p>
              <Button onClick={handleGoBack} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </div>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}题目列表`} showBackButton={true} backHref="/work/quiz/takeList" backText="返回列表" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 口述核心知识点信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {data.quiz.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    {data.quizTake.status === "submitted" ? <Badge className="bg-green-100 text-green-800">
                        已提交
                      </Badge> : <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        未提交
                      </Badge>}
                  </div>
                </div>
                {data.quiz.description && <p className="text-gray-600 mb-3">{data.quiz.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {data.quiz.subject && <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {data.quiz.subject}
                    </Badge>}
                  {data.quiz.grade && <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      {data.quiz.grade}
                    </Badge>}
                </div>
              </div>

              {/* 统计信息 */}
              <div className="flex items-center gap-6 text-sm text-gray-600 pt-2 border-t">
                <div>
                  总题目数：
                  <span className="font-medium">
                    {data.quiz.questionIds.length}
                  </span>
                </div>
                <div>
                  已答题目：
                  <span className="font-medium">{data.questions.length}</span>
                </div>
                {data.quizTake.passedCount !== undefined && <div>
                    通过题目：
                    <span className="font-medium text-green-600">
                      {data.quizTake.passedCount}
                    </span>
                  </div>}
              </div>
            </div>
          </div>

          {/* 口述核心知识点整体评语 */}
          <OverallComment quizTake={data.quizTake} onRefresh={() => fetchData(false)} />

          {/* 题目列表 */}
          {data.questions.length === 0 ? <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">
                该{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}暂无答题记录
              </p>
            </div> : <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                题目详情 ({data.questions.length} 题)
              </h3>
              <div className="grid gap-4">
                {data.questions.map((question, index) => <QuestionCard key={question._id} question={question} index={index} takeId={takeId} onDelete={() => fetchData(false)} />)}
              </div>
            </div>}
        </div>
      </main>
    </div>;
}
