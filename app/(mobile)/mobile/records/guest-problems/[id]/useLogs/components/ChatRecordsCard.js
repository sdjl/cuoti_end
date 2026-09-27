"use client";

import { Bot, MessageCircle, User } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Card } from "../../../../../../../../components/ui/card.js";
export default function ChatRecordsCard({
  chatMessages,
  onImageClick
}) {
  const hasAnyMessages = chatMessages.length > 0;
  if (!hasAnyMessages) {
    return <Card className="glass-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-800">学习对话</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>暂无学习对话记录</p>
        </div>
      </Card>;
  }
  const allMessages = chatMessages.map(msg => ({
    id: msg._id,
    created: msg.created,
    role: msg.role,
    content: msg.content,
    image: msg.image
  })).sort((a, b) => a.created - b.created);
  const totalMessages = allMessages.length;
  return <Card className="glass-card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-gray-800">学习对话</span>
        {totalMessages > 0 && <span className="text-xs text-gray-500">
            (AI对话{chatMessages.length}条)
          </span>}
      </div>

      {totalMessages > 0 && <div className="space-y-3 max-h-96 overflow-y-auto chat-messages-container">
          {allMessages.map(message => <div key={message.id} className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className="flex-shrink-0 mt-1">
                {message.role === "user" ? <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div> : message.role === "assistant" ? <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div> : null}
              </div>

              <div className={`max-w-[75%] rounded-lg p-3 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {message.image && <div className="mt-2 rounded max-w-full relative">
                    <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onImageClick?.(message.image.fileUrl)}>
                      <BaseImage src={message.image.fileUrl} alt="学生发送的图片" width={200} height={150} className="rounded" style={{
                objectFit: "contain"
              }} />
                    </div>
                  </div>}
                <div className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                  {new Date(message.created).toLocaleString()}
                </div>
              </div>
            </div>)}
        </div>}
    </Card>;
}
