"use client";

// 非登录用户题目展示组件，展示题目图片、相关知识点和师生对话记录
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
export default function GuestQuestionDisplay({
  details
}) {
  const {
    guestProblemQuestion
  } = details;
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">题目内容</h2>

      {/* 题目图片 */}
      {guestProblemQuestion.imageUrl ? <div className="mb-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <BaseImage src={guestProblemQuestion.imageUrl} alt="题目图片" width={guestProblemQuestion.imageWidth || 600} height={guestProblemQuestion.imageHeight || 400} className="max-w-full h-auto rounded" />
          </div>
        </div> : <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <div className="text-gray-400 text-4xl mb-4">📄</div>
          <p className="text-gray-500">
            该题目暂无图片内容，学生可能通过文字描述或其他方式提交了问题
          </p>
        </div>}

      {/* 相关知识点 */}
      {guestProblemQuestion.knowledgePoints && guestProblemQuestion.knowledgePoints.length > 0 && <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              相关知识点
            </h3>
            <div className="flex flex-wrap gap-2">
              {guestProblemQuestion.knowledgePoints.map((point, index) => <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {point}
                </span>)}
            </div>
          </div>}

      {/* 师生对话 */}
      {guestProblemQuestion.teacherStudentMessages && guestProblemQuestion.teacherStudentMessages.length > 0 && <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              师生对话记录
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {guestProblemQuestion.teacherStudentMessages.map((msg, index) => <div key={index} className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-3 rounded-lg ${msg.role === "student" ? "bg-blue-500 text-white" : "bg-green-100 text-green-800"}`}>
                    <div className="text-xs mb-1 opacity-70">
                      {msg.role === "student" ? "学生" : "老师"}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className="text-xs mt-1 opacity-60">
                      {new Date(msg.created).toLocaleString()}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>}
    </div>;
}
