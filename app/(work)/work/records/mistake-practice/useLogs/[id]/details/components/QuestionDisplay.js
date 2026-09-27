"use client";

// 题目内容展示组件，展示题目图片、题目文本、学生答案、正确答案和题目解析
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
export default function QuestionDisplay({
  details
}) {
  const {
    studentAnswerItem,
    examQuestion
  } = details;
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">题目内容</h2>

      {/* 题目图片 */}
      {examQuestion?.imageUrl && <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">题目图片</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <BaseImage src={examQuestion.imageUrl} alt="题目图片" width={examQuestion.imageWidth || 600} height={examQuestion.imageHeight || 400} className="max-w-full h-auto rounded" />
          </div>
        </div>}

      {/* 题目文本 */}
      {examQuestion?.questionText && <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">题目内容</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {examQuestion.questionText}
            </p>
          </div>
        </div>}

      {/* 学生答案 */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">学生答案</h3>
        <div className="border rounded-lg p-4 bg-red-50">
          {studentAnswerItem.answerValue && studentAnswerItem.answerValue.length > 0 ? <div className="space-y-1">
              {studentAnswerItem.answerValue.map((answer, index) => <p key={index} className="text-sm text-red-700">
                  {studentAnswerItem.answerValue.length > 1 ? `${index + 1}. ` : ""}
                  {answer}
                </p>)}
            </div> : <p className="text-sm text-gray-500">未记录答案内容</p>}
        </div>
      </div>

      {/* 正确答案 */}
      {examQuestion?.answer && examQuestion.answer.length > 0 && <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">正确答案</h3>
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="space-y-1">
              {examQuestion.answer.map((answer, index) => <p key={index} className="text-sm text-green-700">
                  {(examQuestion.answer?.length ?? 0) > 1 ? `${index + 1}. ` : ""}
                  {answer}
                </p>)}
            </div>
          </div>
        </div>}

      {/* 题目解析 */}
      {examQuestion?.parse && examQuestion.parse.length > 0 && <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">题目解析</h3>
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="space-y-2">
              {examQuestion.parse.map((parseText, index) => <p key={index} className="text-sm text-blue-700">
                  {parseText}
                </p>)}
            </div>
          </div>
        </div>}
    </div>;
}
