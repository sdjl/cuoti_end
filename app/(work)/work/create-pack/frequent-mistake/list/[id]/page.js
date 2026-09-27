"use client";

// 高频错题集详情页，加载题集信息及题目列表并提供返回入口
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { getFrequentMistakePackDetail } from "./actions.js";
import FrequentMistakePackInfo from "./components/FrequentMistakePackInfo.js";
import QuestionDetailList from "./components/QuestionDetailList.js";
export default function FrequentMistakeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const frequentMistakeId = params.id;
  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [typicalErrorCounts, setTypicalErrorCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getFrequentMistakePackDetail(frequentMistakeId);
        if (!result) {
          toast({
            title: "加载失败",
            description: "未找到该高频错题集",
            variant: "destructive"
          });
          router.push("/work/create-pack/frequent-mistake/list");
          return;
        }
        setPack(result.pack);
        setQuestions(result.questions);
        setTypicalErrorCounts(result.typicalErrorCounts);
      } catch (error) {
        console.error("加载高频错题集详情失败:", error);
        toast({
          title: "加载失败",
          description: error instanceof Error ? error.message : "加载数据时发生错误",
          variant: "destructive"
        });
        router.push("/work/create-pack/frequent-mistake/list");
      } finally {
        setIsLoading(false);
      }
    };
    if (frequentMistakeId) {
      fetchData();
    }
  }, [frequentMistakeId, router, toast]);
  if (isLoading) {
    return <>
        <WorkHeader title="高频错题集详情" showBackButton={true} backHref="/work/create-pack/frequent-mistake/list" backText="返回列表" />
        <div className="container mx-auto p-6">
          <div className="text-center py-12 text-gray-500">加载中...</div>
        </div>
      </>;
  }
  if (!pack) {
    return null;
  }
  return <>
      <WorkHeader title="高频错题集详情" showBackButton={true} backHref="/work/create-pack/frequent-mistake/list" backText="返回列表" />

      <div className="container mx-auto p-6 space-y-6">
        {/* 错题集信息卡片 */}
        <FrequentMistakePackInfo pack={pack} />

        {/* 题目列表标题 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            题目列表（共 {questions.length} 题）
          </h3>
        </div>

        {/* 题目列表 */}
        <QuestionDetailList questions={questions} frequentMistakeId={frequentMistakeId} typicalErrorCounts={typicalErrorCounts} />
      </div>
    </>;
}
