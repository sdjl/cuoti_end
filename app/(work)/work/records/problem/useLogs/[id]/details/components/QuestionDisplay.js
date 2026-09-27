"use client";

// 自主上传错题题目展示组件，展示题目图片和相关知识点信息
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
export default function QuestionDisplay({
  details
}) {
  const {
    problemQuestion
  } = details;
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">题目内容</h2>

      {/* 题目图片 */}
      {problemQuestion.imageUrl ? <div className="mb-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <BaseImage src={problemQuestion.imageUrl} alt="题目图片" width={problemQuestion.imageWidth || 600} height={problemQuestion.imageHeight || 400} className="max-w-full h-auto rounded" />
          </div>
        </div> : <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <div className="text-gray-400 text-4xl mb-4">📄</div>
          <p className="text-gray-500">
            该题目暂无图片内容，学生可能通过文字描述或其他方式提交了问题
          </p>
        </div>}

      {/* 相关知识点 */}
      {problemQuestion.knowledgePoints && problemQuestion.knowledgePoints.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              相关知识点
            </h3>
            <div className="flex flex-wrap gap-2">
              {problemQuestion.knowledgePoints.map((point, index) => <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {point}
                </span>)}
            </div>
          </div>}
    </div>;
}
