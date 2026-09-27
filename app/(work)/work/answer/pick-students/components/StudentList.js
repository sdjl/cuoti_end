"use client";

import { BarChart3, Brain, CheckCircle, CheckCircle2, Clock, Eye, GraduationCap, QrCode, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../components/ui/dialog.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader,
/**
 * 学生列表组件
 * 显示学生列表，支持选择学生、查看提交状态和答卷详情
 */
TableRow } from "../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../lib/common/qrcode.js";
import { deleteStudentAnswerAction } from "../actions.js";
function DeleteConfirmDialog({
  student,
  classId,
  courseId,
  questionPackId,
  onSuccess
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    toast
  } = useToast();
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteStudentAnswerAction(student._id, classId, courseId, questionPackId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: result.message
        });
        onSuccess(student._id);
        setIsOpen(false);
      } else {
        toast({
          title: "删除失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除答卷失败:", error);
      toast({
        title: "删除失败",
        description: "删除答卷时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
          <Trash2 className="h-4 w-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除答卷</DialogTitle>
          <DialogDescription>
            您确定要删除 <strong>{student.name}</strong> ({student.studentCode})
            的答卷数据吗？
            <br />
            此操作将删除该学生的所有答卷和答案条目，不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="text-white">
            {isDeleting ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
export default function StudentList({
  students,
  selectedStudents,
  onStudentSelect,
  onSelectAll,
  classId,
  courseId,
  questionPackId,
  onStudentDeleted,
  questionPackName
}) {
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 生成二维码URL
  const generateStudentWebViewUrl = useCallback(student => {
    if (!student.answerId) return "";

    // 生成学生端聊天记录的完整URL
    const chatUrl = `${window.location.origin}/mobile/answer/${student.answerId}/report`;

    // 生成webViewTitle: "${学生姓名}-${题集名称}报告"，但如果题集名称已经以学生姓名开头则不重复
    let webViewTitle;
    const studentName = student.name;
    const questionPackNameStr = questionPackName || "未知题集";
    if (questionPackNameStr.startsWith(studentName)) {
      webViewTitle = `${questionPackNameStr}报告`;
    } else {
      webViewTitle = `${studentName}-${questionPackNameStr}报告`;
    }
    return generateWebViewURL(chatUrl, webViewTitle);
  }, [questionPackName]);

  // 当students变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const student of students) {
        if (student.hasSubmitted && student.answerId) {
          const url = generateStudentWebViewUrl(student);
          if (url) {
            const qrCode = await generateQRCodeDataURL(url);
            if (qrCode) {
              newQrCodeData.set(student._id, qrCode);
            }
          }
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (students.length > 0 && questionPackName) {
      generateAllQRCodes();
    }
  }, [students, questionPackName, generateStudentWebViewUrl]);
  const isAllSelected = useMemo(() => {
    if (students.length === 0) return false;
    return students.every(student => selectedStudents.has(student._id));
  }, [students, selectedStudents]);
  const isIndeterminate = useMemo(() => {
    if (students.length === 0) return false;
    const selectedCount = students.filter(student => selectedStudents.has(student._id)).length;
    return selectedCount > 0 && selectedCount < students.length;
  }, [students, selectedStudents]);
  const selectAllCheckboxState = useMemo(() => {
    if (isAllSelected) return true;
    if (isIndeterminate) return "indeterminate";
    return false;
  }, [isAllSelected, isIndeterminate]);
  const handleSelectAll = useCallback(checked => {
    onSelectAll(checked);
  }, [onSelectAll]);
  const handleStudentSelect = useCallback((studentId, checked) => {
    onStudentSelect(studentId, checked);
  }, [onStudentSelect]);
  const handleStudentClick = useCallback((student, target) => {
    // 只有点击编号或姓名时才触发选择
    if (target === "code" || target === "name") {
      const isSelected = selectedStudents.has(student._id);
      handleStudentSelect(student._id, !isSelected);
    }
  }, [selectedStudents, handleStudentSelect]);

  // 获取提交状态标记
  const getSubmitStatusBadge = (hasSubmitted, submittedAt) => {
    if (hasSubmitted) {
      const formatTime = date => {
        return date.toLocaleDateString("zh-CN") + " " + date.toLocaleTimeString("zh-CN", {
          hour12: false
        });
      };
      return <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" />
                已提交
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>提交时间：{submittedAt ? formatTime(submittedAt) : "未知"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>;
    }
    return <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
        <Clock className="h-3 w-3" />
        未提交
      </div>;
  };
  if (students.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无学生数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={selectAllCheckboxState} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>学生编号</TableHead>
            <TableHead>学生姓名</TableHead>

            <TableHead>提交状态</TableHead>
            <TableHead>错题数</TableHead>
            <TableHead>正确率</TableHead>
            <TableHead>积分余额</TableHead>
            <TableHead>缺失图片</TableHead>
            <TableHead>已查看</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
          const isSelected = selectedStudents.has(student._id);
          return <TableRow key={student._id} className={isSelected ? "bg-blue-50" : ""}>
                <TableCell>
                  <Checkbox checked={isSelected} onCheckedChange={checked => handleStudentSelect(student._id, checked)} />
                </TableCell>
                <TableCell>
                  <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => handleStudentClick(student, "code")}>
                    {student.studentCode}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => handleStudentClick(student, "name")}>
                    {student.name}
                  </div>
                </TableCell>
                <TableCell>
                  {getSubmitStatusBadge(student.hasSubmitted, student.submittedAt)}
                </TableCell>
                <TableCell>
                  {student.hasSubmitted ? <span className="text-sm font-medium text-orange-600">
                      {student.wrongCount ?? 0}
                    </span> : <span className="text-sm text-gray-300">-</span>}
                </TableCell>
                <TableCell>
                  {student.hasSubmitted ? <span className="text-sm font-medium text-green-600">
                      {student.correctRate ?? 0}%
                    </span> : <span className="text-sm text-gray-300">-</span>}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {student.growthData?.score ?? 0}
                  </div>
                </TableCell>
                <TableCell>
                  {student.hasSubmitted ? student.missingImageCount && student.missingImageCount > 0 ? <span className="text-sm font-medium text-red-600">
                        {student.missingImageCount}
                      </span> : <span className="text-sm text-gray-500">0</span> : <span className="text-sm text-gray-300">-</span>}
                </TableCell>
                <TableCell>
                  {student.hasSubmitted ? <TooltipProvider>
                      {student.hasViewedReport ? <Tooltip>
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
                              {student.reportViewedAt ? new Date(student.reportViewedAt).toLocaleString("zh-CN") : "未知时间"}
                            </span>
                          </TooltipContent>
                        </Tooltip> : <span className="text-sm text-gray-400">未查看</span>}
                    </TooltipProvider> : <span className="text-sm text-gray-300">-</span>}
                </TableCell>
                <TableCell className="text-right">
                  {student.hasSubmitted && <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={e => {
                  e.stopPropagation();
                  if (student.answerId) {
                    window.open(`/work/answer/view/${student.answerId}`, "_blank");
                  }
                }} title="查看答卷" disabled={!student.answerId}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={e => {
                  e.stopPropagation();
                  if (student.answerId) {
                    window.open(`/mobile/answer/${student.answerId}/report`, "_blank");
                  }
                }} title="查看单次答卷分析报告" disabled={!student.answerId}>
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" title="二维码分享" disabled={!student.answerId} onClick={e => e.stopPropagation()}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left" className="w-auto p-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm font-medium text-gray-900">
                              扫码查看分析报告
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                          const studentName = student.name;
                          const questionPackNameStr = questionPackName || "未知题集";
                          return questionPackNameStr.startsWith(studentName) ? `${questionPackNameStr}报告` : `${studentName}-${questionPackNameStr}报告`;
                        })()}
                            </div>
                            {qrCodeData.get(student._id) ? <BaseImage src={qrCodeData.get(student._id) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                <span className="text-sm text-gray-500">
                                  生成中...
                                </span>
                              </div>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="outline" size="sm" className={`h-8 w-8 p-0 ${student.isAnalysisCompleted ? "border-gray-300 text-gray-600" // 已完成分析，默认颜色
                : "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100" // 未完成分析，蓝色提示
                }`} onClick={e => {
                  e.stopPropagation();
                  if (student.answerId) {
                    window.open(`/work/answer/parse/${student.answerId}`, "_blank");
                  }
                }} title={student.isAnalysisCompleted ? "查看已完成的分析" : "需要进行AI分析"} disabled={!student.answerId}>
                        <Brain className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmDialog student={student} classId={classId} courseId={courseId} questionPackId={questionPackId} onSuccess={onStudentDeleted} />
                    </div>}
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
