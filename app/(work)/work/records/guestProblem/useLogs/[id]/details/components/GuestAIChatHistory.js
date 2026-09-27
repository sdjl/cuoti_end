"use client";

// 非登录用户AI对话历史组件，展示学生与AI的对话记录和统计信息
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
export default function GuestAIChatHistory({
  details
}) {
  const {
    guestProblemSession,
    sessionMessages
  } = details;
  if (!guestProblemSession) {
    return <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}对话记录
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">💬</div>
          <p className="text-gray-500">尚无AI学习会话记录</p>
        </div>
      </div>;
  }
  if (!sessionMessages || sessionMessages.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}对话记录
        </h2>
        <p className="text-gray-500 text-center py-8">该会话尚未有对话记录</p>
      </div>;
  }
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}对话记录
      </h2>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded text-xs ${guestProblemSession.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {guestProblemSession.status === "active" ? "进行中" : "已结束"}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${guestProblemSession.isStudentMaster ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                {guestProblemSession.isStudentMaster ? "AI认为已掌握" : "AI认为未掌握"}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(guestProblemSession.created).toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            {sessionMessages.map(message => <div key={message._id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${message.role === "user" ? "bg-blue-500 text-white" : message.role === "assistant" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}`}>
                  <div className="text-xs mb-1 opacity-70">
                    {message.role === "user" ? "学生" : message.role === "assistant" ? "AI助手" : "系统"}
                  </div>

                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>

                  {message.image && <div className="mt-2">
                      <BaseImage src={message.image.fileUrl} alt="学生上传的图片" width={300} height={200} className="rounded max-w-full h-auto" />
                    </div>}

                  <div className="text-xs mt-1 opacity-60">
                    {new Date(message.created).toLocaleString()}
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">对话统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">总消息数:</span>
            <span className="ml-1 font-medium">{sessionMessages.length}</span>
          </div>
          <div>
            <span className="text-gray-600">AI消息数:</span>
            <span className="ml-1 font-medium">
              {sessionMessages.filter(m => m.role === "assistant").length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">学生消息数:</span>
            <span className="ml-1 font-medium">
              {sessionMessages.filter(m => m.role === "user").length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">学生图片数:</span>
            <span className="ml-1 font-medium">
              {sessionMessages.filter(m => m.role === "user" && m.image).length}
            </span>
          </div>
        </div>
      </div>
    </div>;
}
