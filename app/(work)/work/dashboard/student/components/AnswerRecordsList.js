"use client";

/**
 * 答卷记录列表组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/answerRecordsActions.ts
 *
 * 功能：
 * - 显示学生的最近答卷记录
 * - 按类型分类显示：课程试卷、错题集、知识点定制题集
 * - 使用 Tabs 组件切换不同类型
 * - 点击"查看更多"可跳转到班级下的完整答卷列表
 *
 * 配置：
 * - RECORDS_LIMIT_PER_TYPE: 每种类型显示的答卷数量（修改此处可控制所有类型的显示数量）
 * - SHOW_MISTAKE_TAB: 是否显示"错题集"tab（默认false，不显示）
 */
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart3, Brain, Calendar, CheckCircle2, ClipboardList, Eye, FileText, QrCode, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../lib/common/qrcode.js";
import { getStudentRecentAnswersByTypeAction } from "../componentsServerActions/answerRecordsActions.js";
// 每种类型显示的答卷数量（修改此处可控制所有类型的显示数量）
const RECORDS_LIMIT_PER_TYPE = 5;

// 是否显示"错题集"tab（修改此处可控制是否显示错题集tab）
const SHOW_MISTAKE_TAB = false;
export default function AnswerRecordsList({
  studentId,
  studentName,
  classrooms
}) {
  const [examAnswers, setExamAnswers] = useState([]);
  const [mistakeAnswers, setMistakeAnswers] = useState([]);
  const [knowledgeAnswers, setKnowledgeAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState(new Map());
  const [showClassroomDialog, setShowClassroomDialog] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 并行获取三种类型的数据
        const [examResult, mistakeResult, knowledgeResult] = await Promise.all([getStudentRecentAnswersByTypeAction(studentId, "试卷", RECORDS_LIMIT_PER_TYPE), getStudentRecentAnswersByTypeAction(studentId, "错题集", RECORDS_LIMIT_PER_TYPE), getStudentRecentAnswersByTypeAction(studentId, "知识点", RECORDS_LIMIT_PER_TYPE)]);
        if (examResult.success) setExamAnswers(examResult.data);
        if (mistakeResult.success) setMistakeAnswers(mistakeResult.data);
        if (knowledgeResult.success) setKnowledgeAnswers(knowledgeResult.data);
      } catch (error) {
        console.error("获取答卷记录失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  // 生成二维码URL
  const generateAnswerWebViewUrl = useCallback(answer => {
    // 生成学生端聊天记录的完整URL
    const chatUrl = `${window.location.origin}/mobile/answer/${answer._id}/report`;

    // 生成webViewTitle: "${学生姓名}-${题集名称}报告"，但如果题集名称已经以学生姓名开头则不重复
    let webViewTitle;
    const questionPackName = answer.questionPackName || "未知题集";
    if (studentName && questionPackName.startsWith(studentName)) {
      webViewTitle = `${questionPackName}报告`;
    } else {
      webViewTitle = `${studentName || "学生"}-${questionPackName}报告`;
    }
    return generateWebViewURL(chatUrl, webViewTitle);
  }, [studentName]);

  // 当answers变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const allAnswers = [...examAnswers, ...mistakeAnswers, ...knowledgeAnswers];
      const newQrCodeData = new Map();
      for (const answer of allAnswers) {
        const url = generateAnswerWebViewUrl(answer);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(answer._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (examAnswers.length > 0 || mistakeAnswers.length > 0 || knowledgeAnswers.length > 0) {
      generateAllQRCodes();
    }
  }, [examAnswers, mistakeAnswers, knowledgeAnswers, generateAnswerWebViewUrl]);

  // 处理"查看更多"点击
  const handleViewMore = () => {
    if (classrooms.length === 0) {
      alert("该学生暂未加入任何班级");
      return;
    }
    if (classrooms.length === 1) {
      // 只有一个班级，直接跳转
      window.open(`/work/classroom/${classrooms[0]._id}/student/${studentId}/answers`, "_blank");
    } else {
      // 多个班级，显示选择对话框
      setShowClassroomDialog(true);
    }
  };

  // 选择班级后跳转
  const handleSelectClassroom = classroomId => {
    window.open(`/work/classroom/${classroomId}/student/${studentId}/answers`, "_blank");
    setShowClassroomDialog(false);
  };

  // 获取题集类型标记
  const getTypeBadge = type => {
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
    const config = typeConfig[type] || {
      color: "bg-gray-100 text-gray-800",
      text: type || "未知"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };

  // 格式化时间
  const formatDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return "未知时间";
    }
  };

  // 格式化完整时间
  const formatFullDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "未知时间";
    }
  };

  // 渲染答卷列表
  const renderAnswerList = answers => {
    if (isLoading) {
      return <Card className="bg-white">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">加载中...</p>
          </CardContent>
        </Card>;
    }
    if (answers.length === 0) {
      return <Card className="bg-white">
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">暂无答卷记录</p>
          </CardContent>
        </Card>;
    }
    return <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>题集名称</TableHead>
              <TableHead>班级</TableHead>
              <TableHead>课程</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>错题数量</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>已查看</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {answers.map(answer => <TableRow key={answer._id}>
                <TableCell>{answer.questionPackName}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {answer.className ? <span className="text-green-600">{answer.className}</span> : <span className="text-gray-500">未知班级</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {answer.courseName ? <span className="text-blue-600">{answer.courseName}</span> : <span className="text-gray-500">无课程关联</span>}
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(answer.type || "")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-600">
                      {answer.questionCount}
                    </span>
                    <span className="text-gray-500 text-sm">题</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 cursor-help" title={formatFullDate(answer.created)}>
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(answer.created)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    {answer.hasViewedReport ? <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              已查看
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>
                            {answer.reportViewedAt ? formatFullDate(answer.reportViewedAt) : "未知时间"}
                          </span>
                        </TooltipContent>
                      </Tooltip> : <span className="text-sm text-gray-400">未查看</span>}
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/work/answer/view/${answer._id}`, "_blank")} title="查看答卷">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/mobile/answer/${answer._id}/report`, "_blank")} title="查看单次答卷分析报告">
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" title="二维码分享" className="text-green-600 hover:text-green-700">
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-auto p-4">
                        <div className="text-center space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            扫码查看分析报告
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                          const questionPackName = answer.questionPackName || "未知题集";
                          if (studentName && questionPackName.startsWith(studentName)) {
                            return `${questionPackName}报告`;
                          }
                          return `${studentName || "学生"}-${questionPackName}报告`;
                        })()}
                          </div>
                          {qrCodeData.get(answer._id) ? <BaseImage src={qrCodeData.get(answer._id) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-sm text-gray-500">
                                生成中...
                              </span>
                            </div>}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className={answer.isAnalysisCompleted ? "border-gray-300 text-gray-600" : "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100"} onClick={() => window.open(`/work/answer/parse/${answer._id}`, "_blank")} title={answer.isAnalysisCompleted ? "查看已完成的分析" : "需要进行AI分析"}>
                      <Brain className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>;
  };
  return <>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">近期提交答卷</h2>
          </div>
          <button onClick={handleViewMore} className="text-sm text-blue-600 hover:text-blue-700">
            查看更多
          </button>
        </div>

        <Tabs defaultValue="exam" className="w-full">
          <TabsList className={`grid w-full ${SHOW_MISTAKE_TAB ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="exam">课程试卷</TabsTrigger>
            {SHOW_MISTAKE_TAB && <TabsTrigger value="mistake">错题集</TabsTrigger>}
            <TabsTrigger value="knowledge">知识点定制题集</TabsTrigger>
          </TabsList>

          <TabsContent value="exam" className="mt-4">
            {renderAnswerList(examAnswers)}
          </TabsContent>

          {SHOW_MISTAKE_TAB && <TabsContent value="mistake" className="mt-4">
              {renderAnswerList(mistakeAnswers)}
            </TabsContent>}

          <TabsContent value="knowledge" className="mt-4">
            {renderAnswerList(knowledgeAnswers)}
          </TabsContent>
        </Tabs>
      </div>

      {/* 班级选择对话框 */}
      <Dialog open={showClassroomDialog} onOpenChange={setShowClassroomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择班级</DialogTitle>
            <DialogDescription>
              该学生属于多个班级，请选择要查看的班级
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {classrooms.map(classroom => <Button key={classroom._id} variant="outline" className="justify-start" onClick={() => handleSelectClassroom(classroom._id)}>
                {classroom.name}
              </Button>)}
          </div>
        </DialogContent>
      </Dialog>
    </>;
}
