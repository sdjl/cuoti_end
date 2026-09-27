"use client";

// 老师回复对话框组件，展示学生与AI的对话记录、学生与老师的对话记录，并提供老师回复输入功能
import { Bot, UserCheck, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { getProblemAiMessagesAction, replyTeacherMessageAction } from "../actions.js";
export default function TeacherReplyDialog({
  open,
  onOpenChange,
  problemQuestion,
  onSubmitted,
  questionImageUrl
}) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const messages = problemQuestion.teacherStudentMessages || [];
  const listEndRef = useRef(null);
  const aiListEndRef = useRef(null);
  const [aiMessages, setAiMessages] = useState([]);

  // 打开时或消息变化时，滚动到底部
  useEffect(() => {
    if (!open) return;
    const scrollToBottom = () => {
      listEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end"
      });
    };
    requestAnimationFrame(scrollToBottom);
    setTimeout(scrollToBottom, 0);
  }, [open, messages.length]);

  // 滚动到底部（两列）
  useEffect(() => {
    if (!open) return;
    const scrollToBottom = () => {
      listEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end"
      });
      aiListEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end"
      });
    };
    requestAnimationFrame(scrollToBottom);
    setTimeout(scrollToBottom, 0);
  }, [open, messages.length, aiMessages.length]);

  // 加载AI消息
  useEffect(() => {
    if (!open) return;
    (async () => {
      const list = await getProblemAiMessagesAction(problemQuestion._id);
      setAiMessages(list);
      requestAnimationFrame(() => {
        aiListEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end"
        });
      });
    })();
  }, [open, problemQuestion._id]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>学习对话与老师回复</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 grid-rows-[1fr_auto] gap-6 flex-1 overflow-hidden">
          {/* 左列上：AI与学生 */}
          <div className="flex flex-col h-full overflow-hidden col-start-1 row-start-1">
            <div className="mb-2 text-sm text-gray-600">学生 - AI</div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {aiMessages.length === 0 ? <div className="text-center text-gray-400 py-8">暂无AI对话</div> : aiMessages.map(m => <div key={m._id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row" : "flex-row-reverse"}`}>
                    {/* 头像 */}
                    <div className="flex-shrink-0 mt-1">
                      {m.role === "user" ? <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div> : <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>}
                    </div>

                    {/* 内容气泡 */}
                    <div className={`max-w-[75%] rounded-lg p-3 ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                      {m.image && <div className="mt-2">
                          <div className="cursor-pointer hover:opacity-80 transition-opacity inline-block" onClick={() => {
                    const url = m.image.fileUrl;
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}>
                            <BaseImage src={m.image.fileUrl} alt="学生发送的图片" width={200} height={150} className="rounded" style={{
                      objectFit: "contain"
                    }} />
                          </div>
                        </div>}
                      <div className={`text-xs mt-2 ${m.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {new Date(m.created).toLocaleString()}
                      </div>
                    </div>
                  </div>)}
              <div ref={aiListEndRef} />
            </div>
          </div>

          {/* 右列上：老师与学生 */}
          <div className="flex flex-col h-full overflow-hidden col-start-2 row-start-1">
            <div className="mb-2 text-sm text-gray-600">学生 - 老师</div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {messages.length === 0 ? <div className="text-center text-gray-400 py-8">
                  暂无师生对话
                </div> : messages.map((msg, idx) => <div key={idx} className={`flex items-start gap-2 ${msg.role === "teacher" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* 头像 */}
                    <div className="flex-shrink-0 mt-1">
                      {msg.role === "student" ? <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div> : <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>}
                    </div>

                    {/* 内容气泡 */}
                    <div className={`max-w-[75%] rounded-lg p-3 ${msg.role === "teacher" ? "bg-green-100 text-green-800" : "bg-blue-500 text-white"}`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      <div className={`text-xs mt-2 ${msg.role === "teacher" ? "text-green-600" : "text-blue-100"}`}>
                        {new Date(msg.created).toLocaleString()}
                      </div>
                    </div>
                  </div>)}
              <div ref={listEndRef} />
            </div>
          </div>

          {/* 左列下：题目图片展示区 */}
          <div className="col-start-1 row-start-2">
            {questionImageUrl ? <div className="relative w-full h-full overflow-hidden rounded border bg-gray-50 cursor-pointer" onClick={() => {
            if (questionImageUrl) window.open(questionImageUrl, "_blank", "noopener,noreferrer");
          }} title="点击查看大图">
                <BaseImage src={questionImageUrl} alt="题目图片" fill className="object-contain" />
              </div> : <div className="w-full h-full rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                无题目图片
              </div>}
          </div>

          {/* 右列下：回复输入 */}
          <div className="space-y-3 flex-shrink-0 col-start-2 row-start-2">
            <Textarea placeholder="请输入回复内容..." value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={4} className="focus-visible:ring-0 focus-visible:border-primary" />
            <div className="flex justify-end">
              <Button onClick={async () => {
              const content = replyContent.trim();
              if (!content) return;
              try {
                setSending(true);
                const res = await replyTeacherMessageAction(problemQuestion._id, content);
                if (res.success) {
                  const msg = {
                    created: Date.now(),
                    role: "teacher",
                    content
                  };
                  onSubmitted?.(msg);
                  setReplyContent("");
                  onOpenChange(false);
                }
              } finally {
                setSending(false);
              }
            }} disabled={sending || !replyContent.trim()}>
                提交回复
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
