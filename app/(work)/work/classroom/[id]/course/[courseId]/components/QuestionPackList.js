"use client";

// 列出班级课程下的题包并提供扫码、发布与状态控制
import { BookOpen, CheckCircle, Eye, MoreHorizontal, Package, QrCode, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../../../../components/ui/dropdown-menu.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { generateNormalURL, generateQRCodeDataURL } from "../../../../../../../../lib/common/qrcode.js";
import { updateQuestionPackCompletionAction } from "../actions.js";
export default function QuestionPackList({
  course,
  classCourse,
  studentAnswerStats,
  studentCount,
  isLoading,
  classId,
  courseId,
  updateClassCourse
}) {
  const {
    toast
  } = useToast();
  const [actionLoading, setActionLoading] = useState({});
  const [localClassCourse, setLocalClassCourse] = useState(classCourse);
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 更新本地状态当外部状态变化时
  useEffect(() => {
    setLocalClassCourse(classCourse);
  }, [classCourse]);

  // 生成题集二维码URL（普通页面，非 WebView）
  const generateQuestionPackURL = (courseId, questionPackId) => {
    return generateNormalURL("/paperOne", [courseId, questionPackId]);
  };

  // 当题集数据变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      if (!course?.questionPacks) return;
      const newQrCodeData = new Map();
      for (const questionPack of course.questionPacks) {
        const url = generateQuestionPackURL(courseId, questionPack._id);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(questionPack._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (course?.questionPacks && course.questionPacks.length > 0) {
      generateAllQRCodes();
    }
  }, [course, courseId]);

  // 获取当前日期（精确到天）
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  // 处理查看答题情况 - 新窗口打开
  const handleViewAnswers = questionPackId => {
    const params = new URLSearchParams({
      classId,
      courseId,
      packId: questionPackId // 注意这里是 packId 不是 questionPackId
    });
    const url = `/work/answer/pick-students?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 获取题集完成状态
  const isQuestionPackCompleted = questionPackId => {
    return localClassCourse?.completedQuestionPackIds?.includes(questionPackId) || false;
  };

  // 获取题集类型标识
  const getTypesBadge = type => {
    const typeConfig = {
      试卷: {
        color: "bg-blue-100 text-blue-800",
        text: "试卷"
      },
      错题集: {
        color: "bg-red-100 text-red-800",
        text: "错题集"
      },
      知识点: {
        color: "bg-green-100 text-green-800",
        text: "知识点"
      },
      自建: {
        color: "bg-purple-100 text-purple-800",
        text: "自建"
      }
    };
    const config = typeConfig[type] || typeConfig.自建;
    return <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.text}
      </Badge>;
  };

  // 处理题集完成状态切换
  const handleQuestionPackCompletion = async (questionPackId, isCompleted) => {
    const loadingKey = `pack-${questionPackId}`;
    setActionLoading(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    try {
      const {
        success,
        error
      } = await updateQuestionPackCompletionAction(classId, courseId, questionPackId, isCompleted);
      if (success) {
        // 直接更新本地状态而不刷新页面
        let updatedClassCourse = null;
        setLocalClassCourse(prev => {
          if (!prev) return null;
          const currentIds = prev.completedQuestionPackIds || [];
          let newCompletedIds;
          if (isCompleted) {
            // 添加到已完成列表
            if (!currentIds.includes(questionPackId)) {
              newCompletedIds = [...currentIds, questionPackId];
            } else {
              newCompletedIds = currentIds;
            }
          } else {
            // 从已完成列表中移除
            newCompletedIds = currentIds.filter(id => id !== questionPackId);
          }
          updatedClassCourse = {
            ...prev,
            completedQuestionPackIds: newCompletedIds
          };
          return updatedClassCourse;
        });

        // 在状态更新完成后，通知父组件状态变化，这样CourseInfoCard能够更新统计数据
        if (updatedClassCourse) {
          updateClassCourse(() => updatedClassCourse);
        }
        toast({
          title: "更新成功",
          description: `题集已${isCompleted ? "标记为完成" : "标记为未完成"}`
        });
      } else {
        toast({
          title: "更新失败",
          description: error || "更新题集状态时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新题集状态失败:", error);
      toast({
        title: "更新失败",
        description: "更新题集状态时发生错误",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({
        ...prev,
        [loadingKey]: false
      }));
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (!course) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">课程不存在</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* 题集列表卡片 */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            题集列表
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!course.questionPacks || course.questionPacks.length === 0 ? <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">该课程暂无题集</p>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>题集名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>题目数量</TableHead>
                  <TableHead>已提交人数</TableHead>
                  <TableHead>未提交人数</TableHead>
                  <TableHead>完成状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {course.questionPacks.map(questionPack => {
              const submitCount = studentAnswerStats[questionPack._id] || 0;
              const unsubmittedCount = Math.max(0, studentCount - submitCount);
              const isCompleted = isQuestionPackCompleted(questionPack._id);
              const packLoadingKey = `pack-${questionPack._id}`;
              return <TableRow key={questionPack._id}>
                      <TableCell>
                        <div className="font-medium">{questionPack.name}</div>
                        {questionPack.description && <div className="text-sm text-gray-600 max-w-48 truncate" title={questionPack.description}>
                            {questionPack.description}
                          </div>}
                      </TableCell>
                      <TableCell>{getTypesBadge(questionPack.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {questionPack.questionIds?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-600">
                            {submitCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-medium text-orange-600">
                            {unsubmittedCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isCompleted ? <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">
                                已完成
                              </span>
                            </> : <>
                              <XCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-600 font-medium">
                                未完成
                              </span>
                            </>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewAnswers(questionPack._id)} className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                          </Button>

                          {/* 二维码按钮 */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" title="题集二维码" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                <QrCode className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent side="left" className="w-auto p-4">
                              <div className="text-center space-y-2">
                                <div className="text-sm font-medium text-gray-900">
                                  扫码提交课程练习答案
                                </div>
                                <div className="text-xs text-gray-600">
                                  {questionPack.name}
                                </div>
                                {qrCodeData.get(questionPack._id) ? <BaseImage src={qrCodeData.get(questionPack._id) || ""} alt="题集二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                    <span className="text-sm text-gray-500">
                                      生成中...
                                    </span>
                                  </div>}
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>通知时间：{getCurrentDate()}</div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={actionLoading[packLoadingKey]}>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleQuestionPackCompletion(questionPack._id, true)} disabled={isCompleted}>
                                设为已完成
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuestionPackCompletion(questionPack._id, false)} disabled={!isCompleted}>
                                设为未完成
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
}
