"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 语音解答详情页面，展示单个题目的详细信息、语音消息、图片消息和AI分析
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../../hooks/useAuth.js";
import { getQuizQuestionDetailAction } from "./actions.js";
import AnalysisAndComments from "./components/AnalysisAndComments.js";
import AudioMessages from "./components/AudioMessages.js";
import ImageMessages from "./components/ImageMessages.js";
import QuestionInfo from "./components/QuestionInfo.js";
export default function QuizQuestionDetailPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 本地状态管理的音频和图片消息
  const [localAudioMessages, setLocalAudioMessages] = useState([]);
  const [localImageMessages, setLocalImageMessages] = useState([]);
  const takeId = params.takeId;
  const quizQuestionId = params.quizQuestionId;

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取数据
  const fetchData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const result = await getQuizQuestionDetailAction(quizQuestionId);
      setData(result);
      // 更新本地状态
      setLocalAudioMessages(result.audioMessages);
      setLocalImageMessages(result.imageMessages);
    } catch (error) {
      console.error("获取题目详情失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取题目详情时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [quizQuestionId, toast]);

  // 初始加载数据
  useEffect(() => {
    if (quizQuestionId) {
      fetchData(false);
    }
  }, [quizQuestionId, fetchData]);

  // 手动刷新数据
  const handleRefresh = () => {
    fetchData(true);
  };

  // 返回上一页
  const handleGoBack = () => {
    router.push(`/work/quiz/takeList/${takeId}/questions`);
  };

  // 处理消息删除
  const handleMessageDelete = useCallback(messageId => {
    setLocalAudioMessages(prev => prev.filter(msg => msg._id !== messageId));
    setLocalImageMessages(prev => prev.filter(msg => msg._id !== messageId));
  }, []);

  // 处理音频消息内容更新
  const handleAudioMessageUpdate = useCallback((messageId, content) => {
    setLocalAudioMessages(prev => prev.map(msg => msg._id === messageId ? {
      ...msg,
      content
    } : msg));
  }, []);
  if (isLoading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="语音解答详情" showBackButton={true} backHref={`/work/quiz/takeList/${takeId}/questions`} backText="返回题目列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        </main>
      </div>;
  }
  if (!data) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="语音解答详情" showBackButton={true} backHref={`/work/quiz/takeList/${takeId}/questions`} backText="返回题目列表" />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">未找到相关数据</p>
              <Button onClick={handleGoBack} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回题目列表
              </Button>
            </div>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="语音解答详情" showBackButton={true} backHref={`/work/quiz/takeList/${takeId}/questions`} backText="返回题目列表" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 题目基本信息 */}
          <QuestionInfo quizQuestion={data.quizQuestion} examQuestion={data.examQuestion} />

          {/* 语音消息 */}
          <AudioMessages audioMessages={localAudioMessages} onMessageUpdate={handleAudioMessageUpdate} onMessageDelete={handleMessageDelete} />

          {/* 图片消息 */}
          <ImageMessages imageMessages={localImageMessages} onMessageDelete={handleMessageDelete} />

          {/* AI分析和老师评语 */}
          <AnalysisAndComments quizQuestion={data.quizQuestion} onRefresh={() => fetchData(false)} />

          {/* 时间信息 */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    创建时间：
                    {formatDistanceToNow(new Date(data.quizQuestion.created), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    更新时间：
                    {formatDistanceToNow(new Date(data.quizQuestion.updated), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
