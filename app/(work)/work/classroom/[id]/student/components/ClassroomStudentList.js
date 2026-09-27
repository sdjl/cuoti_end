"use client";

// 班级学生列表组件，展示学生信息表格并提供编辑、删除、查看答卷、生成二维码等操作
import { AlertCircle, Calendar, Edit, ExternalLink, FileCheck, FileText, GraduationCap, LineChart, MoreHorizontal, QrCode, Trash2, TrendingUp, UserCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../../../components/ui/dropdown-menu.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../../components/ui/radio-group.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../../lib/common/qrcode.js";
import { DOMAIN } from "../../../../../../../lib/config/constants.js";
export default function ClassroomStudentList({
  students,
  isLoading,
  classRoomId,
  onEditStudent,
  onDeleteStudent,
  onViewAnswers,
  selectedStudents = [],
  onSelectStudent,
  onSelectAll,
  showEditButtons = false,
  subjects = [],
  bindCounts = {},
  bindingsInfo = {},
  onUpdateStudentNotes,
  onUpdateClassNotes
}) {
  const {
    toast
  } = useToast();
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 备注编辑对话框状态
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingNotesType, setEditingNotesType] = useState("student");
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // 生成综合报告二维码URL
  const generateReportWebViewUrl = useCallback((student, subject) => {
    // 生成学期综合报告的完整URL
    const reportUrl = `${window.location.origin}/mobile/student/${student._id}/classroom/${classRoomId}/report?subject=${encodeURIComponent(subject)}`;

    // 生成webViewTitle: "${学生姓名}-${学科}-综合报告"
    const webViewTitle = `${student.name}-${subject}-综合报告`;
    return generateWebViewURL(reportUrl, webViewTitle);
  }, [classRoomId]);

  // 生成成长记录二维码URL
  const generateGrowthWebViewUrl = useCallback((student, customStartDate, customEndDate, customComment) => {
    // 生成成长记录的完整URL
    let growthUrl = `${window.location.origin}/mobile/studentGrowth/${classRoomId}/${student._id}`;

    // 添加时间参数和评语参数
    const params = new URLSearchParams();
    if (customStartDate) {
      params.append("startDate", customStartDate);
    }
    if (customEndDate) {
      params.append("endDate", customEndDate);
    }
    if (customComment) {
      params.append("teacherComment", customComment);
    }
    if (params.toString()) {
      growthUrl += `?${params.toString()}`;
    }

    // 生成webViewTitle: "${学生姓名}成长路径"
    const webViewTitle = `${student.name}成长路径`;
    return generateWebViewURL(growthUrl, webViewTitle);
  }, [classRoomId]);

  // 当students或subjects变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const student of students) {
        // 为每个科目生成综合报告二维码
        for (const subject of subjects) {
          const reportUrl = generateReportWebViewUrl(student, subject);
          const reportQrCode = await generateQRCodeDataURL(reportUrl);
          if (reportQrCode) {
            newQrCodeData.set(`${student._id}-report-${subject}`, reportQrCode);
          }
        }

        // 生成成长记录二维码（默认全学期）
        const growthUrl = generateGrowthWebViewUrl(student);
        const growthQrCode = await generateQRCodeDataURL(growthUrl);
        if (growthQrCode) {
          newQrCodeData.set(`${student._id}-growth`, growthQrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (students.length > 0) {
      generateAllQRCodes();
    }
  }, [students, subjects, classRoomId, generateReportWebViewUrl, generateGrowthWebViewUrl]);

  // 科目选择对话框状态
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [selectedStudentIdForReport, setSelectedStudentIdForReport] = useState(null);

  // 成长记录对话框状态
  const [growthDialogOpen, setGrowthDialogOpen] = useState(false);
  const [selectedStudentForGrowth, setSelectedStudentForGrowth] = useState(null);
  const [timeRangeType, setTimeRangeType] = useState("semester");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [growthQrCode, setGrowthQrCode] = useState("");

  // 全选状态
  const isAllSelected = students.length > 0 && selectedStudents.length === students.length;
  const isPartialSelected = selectedStudents.length > 0 && selectedStudents.length < students.length;

  // 处理全选/取消全选
  const handleSelectAll = checked => {
    onSelectAll?.(checked);
  };

  // 处理单个选择
  const handleSelectStudent = (studentId, checked) => {
    onSelectStudent?.(studentId, checked);
  };

  // 格式化日期
  const formatDate = dateString => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // 检查日期是否有效
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("zh-CN");
    } catch {
      return "";
    }
  };

  // 复制文本到剪贴板
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板"
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "复制到剪贴板时发生错误",
        variant: "destructive"
      });
    }
  };

  // 处理查看学期综合报告
  const handleViewReport = studentId => {
    if (subjects.length === 0) {
      toast({
        title: "无可用科目",
        description: "该班级还没有添加任何课程",
        variant: "destructive"
      });
      return;
    }
    if (subjects.length === 1) {
      // 只有一个科目，直接跳转
      window.open(`/mobile/student/${studentId}/classroom/${classRoomId}/report?subject=${encodeURIComponent(subjects[0])}`);
    } else {
      // 多个科目，显示选择对话框
      setSelectedStudentIdForReport(studentId);
      setSubjectDialogOpen(true);
    }
  };

  // 处理科目选择
  const handleSubjectSelect = subject => {
    if (selectedStudentIdForReport) {
      window.open(`/mobile/student/${selectedStudentIdForReport}/classroom/${classRoomId}/report?subject=${encodeURIComponent(subject)}`);
    }
    setSubjectDialogOpen(false);
    setSelectedStudentIdForReport(null);
  };

  // 处理查看成长记录
  const handleViewGrowth = async student => {
    setSelectedStudentForGrowth(student);
    setTimeRangeType("semester");
    setStartDate("");
    setEndDate("");
    setTeacherComment("");
    setGrowthDialogOpen(true);

    // 默认生成全学期的二维码
    const defaultUrl = generateGrowthWebViewUrl(student);
    const defaultQrCode = await generateQRCodeDataURL(defaultUrl);
    setGrowthQrCode(defaultQrCode);
  };

  // 处理时间范围变化
  const handleTimeRangeChange = useCallback(async () => {
    if (!selectedStudentForGrowth) return;
    let customStartDate;
    let customEndDate;
    let customComment;
    if (timeRangeType === "custom") {
      if (!startDate || !endDate || !teacherComment.trim()) {
        setGrowthQrCode("");
        return;
      }
      customStartDate = startDate;
      customEndDate = endDate;
      customComment = teacherComment.trim();
    }
    const url = generateGrowthWebViewUrl(selectedStudentForGrowth, customStartDate, customEndDate, customComment);
    const qrCode = await generateQRCodeDataURL(url);
    setGrowthQrCode(qrCode);
  }, [selectedStudentForGrowth, timeRangeType, startDate, endDate, teacherComment, generateGrowthWebViewUrl]);

  // 处理直接查看
  const handleDirectView = () => {
    if (!selectedStudentForGrowth) return;
    let customStartDate;
    let customEndDate;
    let customComment;
    if (timeRangeType === "custom") {
      if (!startDate || !endDate || !teacherComment.trim()) {
        toast({
          title: "参数不完整",
          description: "自定义时间范围需要填写起始日期、结束日期和评语",
          variant: "destructive"
        });
        return;
      }
      customStartDate = startDate;
      customEndDate = endDate;
      customComment = teacherComment.trim();
    }
    const url = generateGrowthWebViewUrl(selectedStudentForGrowth, customStartDate, customEndDate, customComment);
    const directUrl = url.replace(`${DOMAIN.PROD}/webview/`, "").split("/");
    const decodedUrl = decodeURIComponent(directUrl[0]);
    window.open(decodedUrl);
  };

  // 监听时间范围变化
  useEffect(() => {
    handleTimeRangeChange();
  }, [handleTimeRangeChange]);

  // 打开学生备注编辑对话框
  const handleOpenStudentNotesDialog = student => {
    setEditingNotesType("student");
    setEditingStudentId(student._id);
    setEditingNotes(student.notes || "");
    setNotesDialogOpen(true);
  };

  // 打开班级备注编辑对话框
  const handleOpenClassNotesDialog = student => {
    setEditingNotesType("class");
    setEditingStudentId(student._id);
    setEditingNotes(student.studentClass.notes || "");
    setNotesDialogOpen(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    if (!editingStudentId) return;
    setIsSavingNotes(true);
    try {
      if (editingNotesType === "student") {
        if (onUpdateStudentNotes) {
          await onUpdateStudentNotes(editingStudentId, editingNotes);
        }
      } else {
        if (onUpdateClassNotes) {
          await onUpdateClassNotes(editingStudentId, editingNotes);
        }
      }
      toast({
        title: "保存成功",
        description: "备注已更新"
      });
      setNotesDialogOpen(false);
    } catch (error) {
      console.error("保存备注失败:", error);
      toast({
        title: "保存失败",
        description: "保存备注时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSavingNotes(false);
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (students.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">该班级暂无学生</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectStudent && <TableHead className="w-12">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} className={isPartialSelected ? "data-[state=checked]:bg-blue-600" : ""} />
              </TableHead>}
            <TableHead>学生编号</TableHead>
            <TableHead>学生姓名</TableHead>
            <TableHead>积分余额</TableHead>
            <TableHead>就读校园</TableHead>
            <TableHead>联系方式</TableHead>
            <TableHead>出生日期</TableHead>
            <TableHead>家庭地址</TableHead>
            <TableHead>绑定人数</TableHead>
            <TableHead>学生备注</TableHead>
            <TableHead>班级备注</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => <TableRow key={student._id}>
              {onSelectStudent && <TableCell>
                  <Checkbox checked={selectedStudents.includes(student._id)} onCheckedChange={checked => handleSelectStudent(student._id, checked)} />
                </TableCell>}
              <TableCell>
                <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.studentCode)}>
                  {student.studentCode}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.name)}>
                  {student.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(String(student.growthData?.score ?? 0))}>
                  {student.growthData?.score ?? 0}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.publicSchoolName || "未填写")}>
                  {student.publicSchoolName || "未填写"}
                </div>
              </TableCell>
              <TableCell>
                {student.contactPhones && student.contactPhones.length > 0 ? student.contactPhones.length === 1 ?
            // 只有一个电话，直接显示
            <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.contactPhones?.[0] || "")}>
                      {student.contactPhones[0]}
                    </div> :
            // 多个电话，使用 Tooltip
            <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.contactPhones?.join(", ") || "")}>
                            {student.contactPhones[0]}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium text-xs mb-1">
                              所有联系电话：
                            </p>
                            {student.contactPhones.map((phone, index) => <p key={index} className="text-sm">
                                {phone}
                              </p>)}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : <div className="text-sm text-gray-400 cursor-pointer" onClick={() => copyToClipboard("未填写")}>
                    未填写
                  </div>}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => copyToClipboard(student.birthDate || "未填写")}>
                  {formatDate(student.birthDate)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate cursor-pointer hover:text-blue-600" title={student.homeAddress || ""} onClick={() => copyToClipboard(student.homeAddress || "未填写")}>
                  {student.homeAddress || "未填写"}
                </div>
              </TableCell>
              <TableCell>
                {bindCounts[student._id] ? bindingsInfo[student._id] && bindingsInfo[student._id].length > 0 ? <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-gray-600 cursor-pointer hover:text-blue-600">
                            {bindCounts[student._id]} 人
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium text-xs mb-1">
                              绑定人信息：
                            </p>
                            {bindingsInfo[student._id].map((binding, index) => <p key={index} className="text-sm">
                                {binding.relationType || "未知关系"} -{" "}
                                {binding.bindPhone || "未填写电话"}
                              </p>)}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : <div className="text-sm text-gray-600">
                      {bindCounts[student._id]} 人
                    </div> : <div className="text-sm text-gray-600">0 人</div>}
              </TableCell>
              <TableCell>
                {student.notes?.trim() ? <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-sm text-blue-600 cursor-pointer" onClick={() => handleOpenStudentNotesDialog(student)}>
                          <FileText className="h-3 w-3 mr-1" />
                          有备注
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{student.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider> : <div className="text-sm text-gray-400 cursor-pointer" onClick={() => handleOpenStudentNotesDialog(student)}>
                    无备注
                  </div>}
              </TableCell>
              <TableCell>
                {student.studentClass.notes?.trim() ? <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-sm text-blue-600 cursor-pointer" onClick={() => handleOpenClassNotesDialog(student)}>
                          <FileText className="h-3 w-3 mr-1" />
                          有备注
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{student.studentClass.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider> : <div className="text-sm text-gray-400 cursor-pointer" onClick={() => handleOpenClassNotesDialog(student)}>
                    无备注
                  </div>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {onViewAnswers && <Button variant="outline" size="sm" onClick={() => window.open(
              // 注意下面这里是answers，不是answer
              `/work/classroom/${classRoomId}/student/${student._id}/answers/`, "_blank")} title="查看答卷" className="hover:border-blue-300">
                      <FileCheck className="h-3 w-3" />
                    </Button>}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" title="综合报告二维码" className="text-green-600 hover:text-green-700" disabled={subjects.length === 0}>
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" className="w-auto p-4">
                      <div className="text-center space-y-2">
                        <div className="text-sm font-medium text-gray-900">
                          扫码查看综合报告
                        </div>
                        {subjects.length === 1 ?
                    // 只有一个科目，直接显示二维码
                    <>
                            <div className="text-xs text-gray-500">
                              {student.name}-{subjects[0]}-综合报告
                            </div>
                            {qrCodeData.get(`${student._id}-report-${subjects[0]}`) ? <BaseImage src={qrCodeData.get(`${student._id}-report-${subjects[0]}`) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                <span className="text-sm text-gray-500">
                                  生成中...
                                </span>
                              </div>}
                          </> :
                    // 多个科目，显示科目选择
                    <>
                            <div className="text-xs text-gray-500 mb-2">
                              请选择科目
                            </div>
                            <div className="space-y-2">
                              {subjects.map(subject => <div key={subject} className="space-y-2">
                                  <div className="text-xs font-medium text-gray-700">
                                    {subject}
                                  </div>
                                  {qrCodeData.get(`${student._id}-report-${subject}`) ? <BaseImage src={qrCodeData.get(`${student._id}-report-${subject}`) || ""} alt={`${subject}二维码`} width={128} height={128} className="w-32 h-32 mx-auto" /> : <div className="w-32 h-32 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                      <span className="text-xs text-gray-500">
                                        生成中...
                                      </span>
                                    </div>}
                                </div>)}
                            </div>
                          </>}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" title="更多操作">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewReport(student._id)} disabled={subjects.length === 0}>
                        <LineChart className="h-4 w-4 mr-2" />
                        本学期综合报告
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewGrowth(student)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        查看成长记录
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/work/classroom/${classRoomId}/student/${student._id}/stubborn`, "_blank")}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        查看顽固错题
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {showEditButtons && <Button variant="outline" size="sm" onClick={() => onEditStudent(student._id)} title="编辑学生信息">
                      <Edit className="h-3 w-3" />
                    </Button>}
                  {showEditButtons && <Button variant="outline" size="sm" onClick={() => window.open(`/work/classroom/${classRoomId}/student/${student._id}/bind`)} title="绑定学生" className="hover:border-green-300">
                      <UserCheck className="h-3 w-3" />
                    </Button>}
                  {showEditButtons && onDeleteStudent && <Button variant="outline" size="sm" onClick={() => onDeleteStudent(student._id)} title="删除学生" className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>选择科目</DialogTitle>
            <DialogDescription>请选择要查看的综合报告科目</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {subjects.map(subject => <Button key={subject} variant="outline" size="sm" onClick={() => handleSubjectSelect(subject)}>
                {subject}
              </Button>)}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setSubjectDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={growthDialogOpen} onOpenChange={setGrowthDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedStudentForGrowth?.name}成长路径
            </DialogTitle>
            <DialogDescription>
              选择查看时间范围并添加老师评语，生成专属的成长路径链接
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 时间范围选择 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">统计时间范围</Label>
              <RadioGroup value={timeRangeType} onValueChange={value => setTimeRangeType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="semester" id="semester" />
                  <Label htmlFor="semester" className="text-sm">
                    本学期所有时间
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="text-sm">
                    自定义时间区间
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 自定义时间选择 */}
            {timeRangeType === "custom" && <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm">
                    起始日期
                  </Label>
                  <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm">
                    结束日期
                  </Label>
                  <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full" />
                </div>
              </div>}

            {/* 老师评语 */}
            {timeRangeType === "custom" && <div className="space-y-2">
                <Label htmlFor="teacherComment" className="text-sm">
                  老师评语 *
                </Label>
                <Textarea id="teacherComment" placeholder="请输入对该学生在此时间段的成长评语..." value={teacherComment} onChange={e => setTeacherComment(e.target.value)} className="min-h-[80px]" />
              </div>}

            {/* 二维码和操作按钮 */}
            {growthQrCode && <div className="flex gap-6">
                {/* 二维码 */}
                <div className="flex-shrink-0">
                  <div className="text-center space-y-2">
                    <div className="text-sm font-medium text-gray-900">
                      扫码查看成长路径
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedStudentForGrowth?.name}成长路径
                    </div>
                    <BaseImage src={growthQrCode} alt="成长路径二维码" width={160} height={160} className="w-40 h-40 mx-auto border rounded" />
                  </div>
                </div>

                {/* 直接查看按钮 */}
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <Button onClick={handleDirectView} className="w-full" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    直接查看成长路径
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    点击按钮将在新窗口中打开成长路径页面
                  </div>
                </div>
              </div>}

            {/* 参数不完整提示 */}
            {timeRangeType === "custom" && (!startDate || !endDate || !teacherComment.trim()) && <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>请填写完整的时间区间和评语</p>
                </div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrowthDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 备注编辑对话框 */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              编辑{editingNotesType === "student" ? "学生" : "班级"}备注
            </DialogTitle>
            <DialogDescription>
              修改{editingNotesType === "student" ? "学生" : "班级"}的备注信息
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editingNotes} onChange={e => setEditingNotes(e.target.value)} placeholder="请输入备注信息..." className="min-h-[120px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)} disabled={isSavingNotes}>
              取消
            </Button>
            <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
              {isSavingNotes ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>;
}
