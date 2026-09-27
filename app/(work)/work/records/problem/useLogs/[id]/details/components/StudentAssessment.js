"use client";

// 自主上传错题学生学习评价组件，展示学生对学习过程的评价，包括评分和反馈内容
import { Star } from "lucide-react";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
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
    problemSession
  } = details;

  // 检查是否有学习评估
  const hasAssessment = problemSession.learningAssessment;
  if (!hasAssessment) {
    return <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          学生学习评价
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-500">
            学生暂未对{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}进行评价
          </p>
        </div>
      </div>;
  }
  const assessment = problemSession.learningAssessment;
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">学生学习评价</h2>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          {/* 评价头部 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-800">
                对{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}质量的评价
              </h3>
            </div>
            {assessment?.assessmentTime && <span className="text-xs text-gray-500">
                评价时间: {new Date(assessment.assessmentTime).toLocaleString()}
              </span>}
          </div>

          {/* 评分 */}
          {assessment?.studentRating && <div className="mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  学生评分:
                </span>
                <StarRating rating={assessment.studentRating} />
              </div>
            </div>}

          {/* 学生反馈 */}
          {assessment?.studentFeedback && <div>
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
          {assessment?.studentRating && !assessment?.studentFeedback && <p className="text-xs text-gray-500 italic">
              学生仅给出了评分，未填写文字反馈
            </p>}
        </div>
      </div>
    </div>;
}
