"use client";

// 自主上传错题详情页面，展示学生自主上传错题的详细信息，包括基本信息、题目内容、学生学习评价、AI对话历史和老师评语
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { getAIQuestionDetailsAction } from "./actions.js";
import AIChatHistory from "./components/AIChatHistory.js";
import BasicInfo from "./components/BasicInfo.js";
import QuestionDisplay from "./components/QuestionDisplay.js";
import StudentAssessment from "./components/StudentAssessment.js";
import TeacherComment from "./components/TeacherComment.js";
export default function AIQuestionDetailsPage() {
  const params = useParams();
  const sessionId = params.id;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const result = await getAIQuestionDetailsAction(sessionId);
        if (result.success && result.data) {
          setDetails(result.data);
        } else {
          setError(result.error || "获取详情失败");
        }
      } catch (err) {
        setError("获取详情时发生错误");
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      fetchDetails();
    }
  }, [sessionId]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情`} rightContent={null} />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载详情...</p>
            </div>
          </div>
        </main>
      </div>;
  }
  if (error || !details) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情`} rightContent={null} />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                获取详情失败
              </h3>
              <p className="text-gray-600 mb-4">{error || "未找到相关数据"}</p>
              <button onClick={() => window.history.back()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                返回上一页
              </button>
            </div>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`${details.student.name} 的${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情`} rightContent={null} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 基本信息 */}
          <BasicInfo details={details} />

          {/* 题目展示（含知识点） */}
          <QuestionDisplay details={details} />

          {/* 学生学习评价 */}
          <StudentAssessment details={details} />

          {/* AI对话历史 */}
          <AIChatHistory details={details} />

          {/* 老师评语 */}
          <TeacherComment details={details} onRefresh={() => window.location.reload()} />
        </div>
      </main>
    </div>;
}
