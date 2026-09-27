"use client";

// 题目查看页面，用于查看指定题集中的所有题目
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { getQuestionPackData } from "./actions.js";
import QuestionsViewer from "./components/QuestionsViewer.js";
export default function QuestionsViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classRoomId = params.classRoomId;
  const studentsId = params.studentsId;
  const packId = searchParams.get("packId") || "";
  const [loading, setLoading] = useState(true);
  const [questionPack, setQuestionPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!packId) {
        setError("缺少题集ID参数");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await getQuestionPackData(packId);
        if (result.success && result.data) {
          setQuestionPack(result.data.questionPack);
          setQuestions(result.data.questions);
          setError(null);
        } else {
          setError(result.error || "获取题集数据失败");
        }
      } catch (error) {
        console.error("获取题集数据失败:", error);
        setError("获取题集数据失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [packId]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={questionPack ? `${questionPack.name} - 题目查看` : "题目查看"} showBackButton={true} backHref={`/work/create-pack/knowledge/${classRoomId}/${studentsId}/list`} backText="返回题集列表" />

      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {error ? <div className="text-center py-8">
              <div className="text-red-500">{error}</div>
            </div> : <QuestionsViewer questionPack={questionPack} questions={questions} loading={loading} />}
        </div>
      </main>
    </div>;
}
