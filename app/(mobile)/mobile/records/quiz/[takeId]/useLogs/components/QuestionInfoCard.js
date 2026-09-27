"use client";

import { BookOpen, Clock, Image as ImageIcon, Pause, Play, Target, User, Volume2 } from "lucide-react";
// 题目信息卡片组件，用于展示口述核心知识点题目的详细信息，包括题目图片、学生答题状态、音频解答记录等
import { useRef, useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../../components/ui/card.js";
export default function QuestionInfoCard({
  examQuestion,
  quizQuestion,
  questionIndex,
  messages,
  onImageClick
}) {
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [currentProgress, setCurrentProgress] = useState({});
  const audioRefs = useRef({});

  // 过滤出有音频文件和图片文件的消息
  const audioMessages = messages.filter(message => message.audioFile && message.role === "user");
  const imageMessages = messages.filter(message => message.imageFile && message.role === "user");
  const handlePlayPause = messageId => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    if (currentPlayingId === messageId) {
      audio.pause();
      setCurrentPlayingId(null);
    } else {
      Object.keys(audioRefs.current).forEach(id => {
        if (id !== messageId) {
          audioRefs.current[id].pause();
        }
      });
      audio.play();
      setCurrentPlayingId(messageId);
    }
  };
  const handleTimeUpdate = messageId => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    const progress = audio.currentTime / audio.duration * 100;
    setCurrentProgress(prev => ({
      ...prev,
      [messageId]: progress
    }));
  };
  const handleEnded = messageId => {
    setCurrentPlayingId(null);
    setCurrentProgress(prev => ({
      ...prev,
      [messageId]: 0
    }));
  };
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  return <Card className="glass-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-gray-800">第{questionIndex}题</span>
      </div>

      {/* 题目图片 */}
      {examQuestion.imageUrl && <div className="mb-4">
          <div className="relative w-full cursor-pointer hover:opacity-90 transition-opacity border border-gray-200 rounded-lg overflow-hidden bg-white" onClick={() => onImageClick(examQuestion.imageUrl || "")}>
            <BaseImage src={examQuestion.imageUrl} alt={`第${questionIndex}题图片`} width={400} height={300} className="w-full h-auto object-contain bg-gray-50" />
            {/* 点击提示覆盖层 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                <ImageIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>}

      {/* 学生选择答案和答题状态 */}
      {quizQuestion?.selectedOptions && quizQuestion.selectedOptions.length > 0 && <div className="flex items-center gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">学生选择：</span>
              <span className={quizQuestion.isCorrect ? "text-green-600" : "text-red-600"}>
                {quizQuestion.selectedOptions.join("、")}
              </span>
              {quizQuestion.isCorrect !== undefined && <span className={`font-medium ${quizQuestion.isCorrect ? "text-green-600" : "text-red-600"}`}>
                  {quizQuestion.isCorrect ? "正确" : "错误"}
                </span>}
            </div>
          </div>}

      {/* 答题状态标签 */}
      <div className="flex gap-2 flex-wrap mb-4">
        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {examQuestion.questionType}
        </span>
        {examQuestion.difficulty && <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            <Target className="w-3 h-3 mr-1" />
            {examQuestion.difficulty}
          </span>}
        {quizQuestion?.aiJudgment && <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${quizQuestion.aiJudgment === "passed" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
            {quizQuestion.aiJudgment === "passed" ? "解答思路一致" : "解答思路未通过"}
          </span>}
      </div>

      {/* 知识点 */}
      {examQuestion.knowledgePoints && examQuestion.knowledgePoints.length > 0 && <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              关联知识点
            </h4>
            <div className="flex gap-1 flex-wrap">
              {examQuestion.knowledgePoints.map((point, index) => <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {point}
                </span>)}
            </div>
          </div>}

      {/* AI分析 */}
      {quizQuestion?.aiAnalysis && <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">AI分析</h4>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-700">
              {quizQuestion.aiAnalysis}
            </div>
          </div>
        </div>}

      {/* 老师评语 */}
      {quizQuestion?.teacherComment && <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">老师评语</h4>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-700">
              {quizQuestion.teacherComment}
            </div>
          </div>
        </div>}

      {/* 音频解答记录 */}
      {audioMessages.length > 0 && <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-800">学生音频解答记录</span>
            <span className="text-sm text-gray-500">
              ({audioMessages.length}条)
            </span>
          </div>

          <div className="space-y-3">
            {audioMessages.map((message, index) => {
          const audioFile = message.audioFile;
          const isPlaying = currentPlayingId === message._id;
          const progress = currentProgress[message._id] || 0;
          return <div key={message._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  {/* 音频信息头部 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        解答 {index + 1}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(audioFile.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 音频播放器 */}
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => handlePlayPause(message._id)} className="h-10 w-10 p-0 rounded-full">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </Button>

                    {/* 进度条 */}
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-200" style={{
                    width: `${progress}%`
                  }} />
                      </div>
                    </div>

                    {/* 时间显示 */}
                    <div className="text-xs text-gray-500 min-w-[40px]">
                      {formatTime(audioFile.duration)}
                    </div>
                  </div>

                  {/* 隐藏的音频元素 */}
                  <audio ref={el => {
              if (el) {
                audioRefs.current[message._id] = el;
              }
            }} src={audioFile.fileUrl} onTimeUpdate={() => handleTimeUpdate(message._id)} onEnded={() => handleEnded(message._id)} preload="none" />

                  {/* 文字内容（如果有语音转文字结果） */}
                  {message.content && <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-blue-700">
                            语音转文字
                          </span>
                        </div>
                        <div className="text-gray-700">{message.content}</div>
                      </div>
                    </div>}
                </div>;
        })}
          </div>
        </div>}

      {/* 上传的图片 */}
      {imageMessages.length > 0 && <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-800">学生上传的图片</span>
            <span className="text-sm text-gray-500">
              ({imageMessages.length}张)
            </span>
          </div>

          {/* 图片网格预览 */}
          <div className="grid grid-cols-3 gap-2">
            {imageMessages.map((message, index) => {
          const imageFile = message.imageFile;
          return <div key={`preview-${message._id}`} className="aspect-square cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 rounded-lg overflow-hidden bg-gray-50" onClick={() => onImageClick(imageFile.fileUrl)}>
                  <BaseImage src={imageFile.fileUrl} alt={`预览图${index + 1}`} width={100} height={100} className="w-full h-full object-cover" />
                </div>;
        })}
          </div>
        </div>}
    </Card>;
}
