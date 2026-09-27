"use client";

// 学生学习评价组件，展示学生对AI学习的评分和反馈信息
import { Star } from "lucide-react";
// 星星评分组件
function StarRating({
  rating
}) {
  return <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />)}
      <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
    </div>;
}
export default function StudentAssessment({
  details
}) {
  const {
    aiChatSessions
  } = details;

  // 获取所有有评价的会话
  const assessedSessions = aiChatSessions.filter(session => session.learningAssessment);
  if (assessedSessions.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          学生学习评价
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-500">学生暂未对AI学习进行评价</p>
        </div>
      </div>;
  }
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">学生学习评价</h2>

      <div className="space-y-4">
        {assessedSessions.map(session => {
        const assessment = session.learningAssessment;
        return <div key={session._id} className="border border-gray-200 rounded-lg p-4">
              {/* 评价头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-gray-800">
                    {session.title || `对AI回答质量的评价`}
                  </h3>
                </div>
                {assessment.assessmentTime && <span className="text-xs text-gray-500">
                    评价时间:{" "}
                    {new Date(assessment.assessmentTime).toLocaleString()}
                  </span>}
              </div>

              {/* 评分 */}
              {assessment.studentRating && <div className="mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      学生评分:
                    </span>
                    <StarRating rating={assessment.studentRating} />
                  </div>
                </div>}

              {/* 学生反馈 */}
              {assessment.studentFeedback && <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">
                    学生反馈:
                  </span>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {assessment.studentFeedback}
                    </p>
                  </div>
                </div>}

              {/* 如果只有评分没有反馈 */}
              {assessment.studentRating && !assessment.studentFeedback && <p className="text-xs text-gray-500 italic">
                  学生仅给出了评分，未填写文字反馈
                </p>}
            </div>;
      })}

        {/* 评价统计 */}
        {assessedSessions.length > 1 && <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-gray-800 mb-3">评价统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">总评价数:</span>
                <span className="ml-1 font-medium">
                  {assessedSessions.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">平均评分:</span>
                <span className="ml-1 font-medium">
                  {(assessedSessions.filter(s => s.learningAssessment?.studentRating).reduce((sum, s) => sum + (s.learningAssessment.studentRating || 0), 0) / assessedSessions.filter(s => s.learningAssessment?.studentRating).length).toFixed(1)}{" "}
                  分
                </span>
              </div>
              <div>
                <span className="text-gray-600">有文字反馈:</span>
                <span className="ml-1 font-medium">
                  {assessedSessions.filter(s => s.learningAssessment?.studentFeedback).length}{" "}
                  条
                </span>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}
