"use client";

import { useSearchParams } from "next/navigation";
// 错题练习学习记录页面，展示学生的错题练习记录、AI对话记录和师生互动信息
import { use, useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../components/ui/card.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { isMiniProgramEnvironment, navigateToMiniProgramPage, waitForWeixinJSBridge } from "../../../../../../../lib/utils/minaJSSDK.js";
import ChatRecordsCard from "./components/ChatRecordsCard.js";
import ContactTeacherCard from "./components/ContactTeacherCard.js";
import ImageModal from "./components/ImageModal.js";
import QuestionInfoCard from "./components/QuestionInfoCard.js";
import RedoImageCard from "./components/RedoImageCard.js";
import TeacherHelpCard from "./components/TeacherHelpCard.js";
import { getUseLogsData, validateOperationPassword } from "./datas.js";
import "./style.css";

// 开发调试用全局变量，设置为 true 时绕过密码验证
const DEV_BYPASS_PASSWORD = false;
export default function UseLogs({
  params
}) {
  const {
    id
  } = use(params);
  const searchParams = useSearchParams();
  const operationPassword = searchParams.get("password") || "";
  const [studentAnswerItem, setStudentAnswerItem] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [teacherStudentMessages, setTeacherStudentMessages] = useState([]);
  const [aiChatSession, setAiChatSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(false);
  const [isQuestionInfoExpanded, setIsQuestionInfoExpanded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [isMiniProgram, setIsMiniProgram] = useState(false);
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUseLogsData(id);
      setStudentAnswerItem(data.studentAnswerItem);
      setChatMessages(data.chatMessages);
      setTeacherStudentMessages(data.teacherStudentMessages || []);
      setAiChatSession(data.aiChatSession);

      // 验证操作密码
      if (DEV_BYPASS_PASSWORD) {
        setIsValidPassword(true);
      } else if (operationPassword && data.studentAnswerItem) {
        const passwordValid = await validateOperationPassword(data.studentAnswerItem.studentAnswerId, operationPassword);
        setIsValidPassword(passwordValid);
      } else {
        setIsValidPassword(false);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [id, operationPassword]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 检测小程序环境
  useEffect(() => {
    const checkEnvironment = async () => {
      // 开发模式：直接视为小程序环境
      if (DEV_BYPASS_PASSWORD) {
        setIsMiniProgram(true);
        return;
      }

      // 正常模式：检测小程序环境
      await waitForWeixinJSBridge();
      const isInMiniProgram = await isMiniProgramEnvironment();
      setIsMiniProgram(isInMiniProgram);
    };
    checkEnvironment();
  }, []);
  const handleMessageSent = newMessage => {
    setTeacherStudentMessages(prev => [...prev, newMessage]);
  };
  const handleJumpToAIChat = () => {
    if (isMiniProgram) {
      navigateToMiniProgramPage({
        url: `/pages/cuoti/redo/aiChat/aiChat?answerItemId=${id}`
      });
    }
  };
  const showTeacherHelp = isValidPassword || teacherStudentMessages.length > 0;
  if (loading) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <div className="demo-header-title">加载中...</div>
        </div>
        <div className="demo-content flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>;
  }
  if (!studentAnswerItem) {
    return <div className="demo-mobile-container">
        <div className="demo-header">
          <div className="demo-header-title">数据加载失败</div>
        </div>
        <div className="demo-content">
          <Card className="p-4 text-center mt-5">
            <p className="text-gray-500">未找到相关记录</p>
          </Card>
        </div>
      </div>;
  }
  return <div className="demo-mobile-container">
      {/* 头部 */}
      <div className="demo-header">
        <div className="demo-header-title">
          {DISPLAY_TEXT.COURSE_MISTAKE}学习记录
        </div>
      </div>

      <div className="demo-content py-6">
        {/* 题目信息组件 */}
        <QuestionInfoCard studentAnswerItem={studentAnswerItem} isExpanded={isQuestionInfoExpanded} onToggleExpand={() => setIsQuestionInfoExpanded(!isQuestionInfoExpanded)} onImageClick={() => {
        setModalImageUrl(studentAnswerItem.imageUrl || studentAnswerItem.questionData?.imageUrl || "");
        setShowImageModal(true);
      }} />

        {/* 学生重做图片组件 */}
        {aiChatSession && <RedoImageCard aiChatSession={aiChatSession} onImageClick={() => {
        setModalImageUrl(aiChatSession.redoImageUrl || "");
        setShowImageModal(true);
      }} />}

        {/* 聊天记录组件 */}
        <ChatRecordsCard chatMessages={chatMessages} onImageClick={imageUrl => {
        setModalImageUrl(imageUrl);
        setShowImageModal(true);
      }} />

        {/* 老师评语 */}
        {aiChatSession?.teacherComment && <Card className="glass-card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">师</span>
              </div>
              <span className="font-medium text-gray-800">老师评语</span>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-sm text-orange-700">
                {aiChatSession.teacherComment}
              </div>
            </div>
          </Card>}

        {/* 请老师帮忙组件：密码无效且无师生对话时隐藏 */}
        {showTeacherHelp && <TeacherHelpCard studentAnswerItemId={id} teacherStudentMessages={teacherStudentMessages} onMessageSent={handleMessageSent} canSend={isValidPassword} password={operationPassword} />}

        {/* 联系老师（二维码） */}
        <ContactTeacherCard />

        {/* 跳转到AI对话按钮 - 仅在密码正确且在小程序环境时显示 */}
        {isValidPassword && isMiniProgram && <div className="mt-4 mb-4">
            <Button onClick={handleJumpToAIChat} className="w-full bg-blue-500 text-white" size="lg">
              跳转到AI对话
            </Button>
          </div>}
      </div>

      {/* 图片查看模态框 */}
      {showImageModal && <ImageModal imageUrl={modalImageUrl} onClose={() => setShowImageModal(false)} />}
    </div>;
}
