"use client";

// 相关知识点组件，展示题目关联的知识点标签
export default function KnowledgePoints({
  details
}) {
  const {
    examQuestion
  } = details;
  if (!examQuestion?.knowledgePoints || examQuestion.knowledgePoints.length === 0) {
    return null;
  }
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">相关知识点</h2>
      <div className="flex flex-wrap gap-2">
        {examQuestion.knowledgePoints.map((point, index) => <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            {point}
          </span>)}
      </div>
    </div>;
}
