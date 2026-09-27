"use client";

import { GraduationCap, HelpCircle, Send, User } from "lucide-react";
// 请老师帮忙卡片组件，用于学生与老师进行问题解答的对话交互
import { useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../../components/ui/card.js";
import { Textarea } from "../../../../../../../../components/ui/textarea.js";
import { sendStudentMessage } from "../actions.js";
export default function TeacherHelpCard({
  studentAnswerItemId,
  teacherStudentMessages,
  onMessageSent,
  canSend = false,
  password = ""
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const handleSendStudentMessage = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);

      // 先添加到本地状态，实现即时显示
      const newMessage = {
        created: Date.now(),
        role: "student",
        content: message.trim()
      };
      onMessageSent(newMessage);
      const currentMessage = message.trim();
      setMessage("");
      const result = await sendStudentMessage({
        studentAnswerItemId,
        message: currentMessage,
        password
      });
      if (!result.success) {
        console.error("发送学生消息失败:", result.message);
        // 如果发送失败，通知父组件移除消息
        // 这里可以通过回调或者重新加载数据来处理
        // 暂时简单处理：恢复输入框内容
        setMessage(currentMessage);
      }
    } catch (error) {
      console.error("发送学生消息失败:", error);
      // 恢复输入框内容
      setMessage(message.trim());
    } finally {
      setSending(false);
    }
  };
  return <Card className="bg-white border border-gray-200 shadow-none p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-5 h-5 text-orange-500" />
        <span className="font-medium text-gray-800">请老师帮忙</span>
      </div>

      <div className="space-y-3">
        {/* 对话记录显示区域 */}
        {teacherStudentMessages.length > 0 && <div className="space-y-3 max-h-64 overflow-y-auto chat-messages-container">
            {teacherStudentMessages.map((msg, index) => <div key={index} className={`flex items-start gap-2 ${msg.role === "student" ? "flex-row-reverse" : "flex-row"}`}>
                {/* 头像 */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === "student" ? <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div> : <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>}
                </div>

                {/* 消息内容 */}
                <div className={`max-w-[75%] rounded-lg p-3 ${msg.role === "student" ? "bg-blue-500 text-white" : "bg-green-100 text-green-800"}`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  <div className={`text-xs mt-2 ${msg.role === "student" ? "text-blue-100" : "text-green-600"}`}>
                    {new Date(msg.created).toLocaleString()}
                    <span className="ml-1">
                      • {msg.role === "student" ? "学生" : "老师"}
                    </span>
                  </div>
                </div>
              </div>)}
          </div>}

        {canSend && <>
            <Textarea placeholder="请描述您遇到的问题，老师会为您解答..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg appearance-none shadow-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-gray-400" disabled={sending} />

            <Button onClick={handleSendStudentMessage} disabled={!message.trim() || sending} className="w-full">
              {sending ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  发送中...
                </> : <>
                  <Send className="w-4 h-4 mr-2" />
                  请老师帮忙解答
                </>}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              老师会在工作时间内回复您的问题
            </p>
          </>}
      </div>
    </Card>;
}
