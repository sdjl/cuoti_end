"use client";

// 口述核心知识点记录页面，展示学生的口述核心知识点答题记录和详细信息
import { use, useCallback, useEffect, useState } from "react";
import { Card } from "../../../../../../../components/ui/card.js";
import ImageModal from "./components/ImageModal.js";
import QuestionInfoCard from "./components/QuestionInfoCard.js";
import { getQuizTakeData } from "./datas.js";
import "./style.css";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function UseLogs({
  params
}) {
  const {
    takeId
  } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const quizData = await getQuizTakeData(takeId);
      setData(quizData);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [takeId]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleImageClick = imageUrl => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };
  if (loading) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <div className="demo-header-title">加载中...</div>
        </div>
        <div className="demo-content flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>;
  }
  if (!data || !data.quizTake) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <div className="demo-header-title">数据加载失败</div>
        </div>
        <div className="demo-content">
          <Card className="p-4 text-center mt-5">
            <p className="text-gray-500">未找到相关记录</p>
          </Card>
        </div>
      </div>;
  }

  // 按题目分组消息
  const messagesByQuestion = data.messages.reduce((acc, message) => {
    const session = data.sessions.find(s => s._id === message.sessionId);
    if (session) {
      const questionId = session.questionId;
      if (!acc[questionId]) {
        acc[questionId] = [];
      }
      acc[questionId].push(message);
    }
    return acc;
  }, {});
  return <div className="demo-mobile-container">
      {/* 头部 */}
      <div className="demo-header">
        <div className="demo-header-title">
          {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}记录
        </div>
      </div>

      <div className="demo-content py-6">
        {/* 口述核心知识点基本信息 */}
        {data.quiz && <Card className="glass-card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">口</span>
              </div>
              <span className="font-medium text-gray-800">
                {data.quiz.title}
              </span>
            </div>
            {data.quiz.description && <p className="text-sm text-gray-600 mb-3">
                {data.quiz.description}
              </p>}
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {data.quiz.subject}
              </span>
              {data.quiz.grade && <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {data.quiz.grade}
                </span>}
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                {data.quizTake.status === "submitted" ? "已提交" : "未提交"}
              </span>
            </div>

            {/* 口述核心知识点统计信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {data.quizTake.submitTime && <div>
                  <span className="text-gray-600">提交时间：</span>
                  <span className="text-gray-800">
                    {new Date(data.quizTake.submitTime).toLocaleString()}
                  </span>
                </div>}
              {data.quizTake.passedCount !== undefined && <div>
                  <span className="text-gray-600">通过题数：</span>
                  <span className="text-green-600 font-medium">
                    {data.quizTake.passedCount}
                  </span>
                </div>}
              {data.quizTake.totalCount !== undefined && <div>
                  <span className="text-gray-600">总题数：</span>
                  <span className="text-gray-800 font-medium">
                    {data.quizTake.totalCount}
                  </span>
                </div>}
            </div>
          </Card>}

        {/* 老师评语 */}
        {data.quizTake?.teacherOverallComment && <Card className="glass-card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">师</span>
              </div>
              <span className="font-medium text-gray-800">老师评语</span>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-sm text-orange-700">
                {data.quizTake.teacherOverallComment}
              </div>
            </div>
          </Card>}

        {/* 按题目展示内容 */}
        {data.quiz?.questionIds && data.quiz.questionIds.length > 0 ? data.quiz.questionIds.map((questionId, index) => {
        const question = data.examQuestions.find(q => q._id === questionId);
        if (!question) return null;
        const quizQuestion = data.quizQuestions.find(q => q.questionId === question._id);
        const questionMessages = messagesByQuestion[question._id] || [];
        return <QuestionInfoCard key={question._id} examQuestion={question} quizQuestion={quizQuestion} questionIndex={index + 1} messages={questionMessages} onImageClick={handleImageClick} />;
      }) : data.examQuestions.map((question, index) => {
        const quizQuestion = data.quizQuestions.find(q => q.questionId === question._id);
        const questionMessages = messagesByQuestion[question._id] || [];
        return <QuestionInfoCard key={question._id} examQuestion={question} quizQuestion={quizQuestion} questionIndex={index + 1} messages={questionMessages} onImageClick={handleImageClick} />;
      })}

        {/* 如果没有任何题目 */}
        {data.examQuestions.length === 0 && <Card className="glass-card text-center py-8">
            <p className="text-gray-500">暂无题目记录</p>
          </Card>}
      </div>

      {/* 图片查看模态框 */}
      {showImageModal && <ImageModal imageUrl={modalImageUrl} onClose={() => setShowImageModal(false)} />}
    </div>;
}
