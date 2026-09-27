"use client";

// AI学习对话记录组件，展示学生与AI的完整对话历史，包括消息内容、图片和会话统计信息
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
export default function AIChatHistory({
  details
}) {
  const {
    aiChatSessions,
    aiChatMessages
  } = details;
  if (!aiChatSessions || aiChatSessions.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            AI学习对话记录
          </h2>
          {details.studentAnswerItem.hasWatchedVideo && <Badge variant="secondary" className="bg-green-100 text-green-800">
              已观看视频
            </Badge>}
        </div>
        <p className="text-gray-500 text-center py-8">
          该学生尚未进行AI{DISPLAY_TEXT.COURSE_MISTAKE}对话
        </p>
      </div>;
  }
  return <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">AI学习对话记录</h2>
        {details.studentAnswerItem.hasWatchedVideo && <Badge variant="secondary" className="bg-green-100 text-green-800">
            已观看视频
          </Badge>}
      </div>

      <div className="space-y-6">
        {aiChatSessions.map(session => {
        const sessionMessages = aiChatMessages.filter(message => message.sessionId === session._id);
        return <div key={session._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs ${session.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {session.status === "active" ? "进行中" : "已结束"}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${session.isStudentMaster ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {session.isStudentMaster ? "AI认为已掌握" : "AI认为未掌握"}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(session.created).toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {sessionMessages.length > 0 ? sessionMessages.map(message => <div key={message._id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                    </div>) : <p className="text-gray-500 text-center py-4">
                    该会话暂无对话记录
                  </p>}
              </div>
            </div>;
      })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">会话统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">总消息数:</span>
            <span className="ml-1 font-medium">{aiChatMessages.length}</span>
          </div>
          <div>
            <span className="text-gray-600">AI消息数:</span>
            <span className="ml-1 font-medium">
              {aiChatMessages.filter(m => m.role === "assistant").length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">学生消息数:</span>
            <span className="ml-1 font-medium">
              {aiChatMessages.filter(m => m.role === "user").length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">学生图片数:</span>
            <span className="ml-1 font-medium">
              {aiChatMessages.filter(m => m.role === "user" && m.image).length}
            </span>
          </div>
        </div>
      </div>
    </div>;
}
