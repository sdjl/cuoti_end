"use client";

import { Edit, GraduationCap, Trash2 } from "lucide-react";
// 学生列表组件，展示学生信息并提供编辑、删除、备注管理等功能
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function StudentList({
  students,
  isLoading,
  isPrincipal,
  onEditStudent,
  onDeleteStudent,
  onUpdateNotes,
  bindCounts = {},
  bindingsInfo = {}
}) {
  const {
    toast
  } = useToast();

  // 备注编辑对话框状态
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  // 打开备注编辑对话框
  const handleOpenNotesDialog = student => {
    setEditingStudentId(student._id);
    setEditingNotes(student.notes || "");
    setNotesDialogOpen(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    if (!editingStudentId) return;
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(editingStudentId, editingNotes);
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
          <p className="text-gray-500">暂无学生数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生编号</TableHead>
            <TableHead>学生姓名</TableHead>
            <TableHead>就读校园</TableHead>
            <TableHead>联系方式</TableHead>
            <TableHead>出生日期</TableHead>
            <TableHead>家庭地址</TableHead>
            <TableHead>绑定人数</TableHead>
            <TableHead>备注</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => <TableRow key={student._id}>
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
                <div className="text-sm text-gray-600 max-w-32 truncate cursor-pointer hover:text-blue-600" title={student.notes || ""} onClick={() => handleOpenNotesDialog(student)}>
                  {student.notes || "无备注"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" disabled={!isPrincipal} onClick={() => onEditStudent(student._id)} title={!isPrincipal ? "只有校长才能编辑学生" : "编辑学生"}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={!isPrincipal} title={!isPrincipal ? "只有校长才能删除学生" : ""} className="text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除学生</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除学生 &quot;{student.name}&quot; (学号：
                          {student.studentCode}) 吗？
                          此操作将同时删除该学生的所有班级关系，且无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteStudent(student._id)} className="bg-red-600 hover:bg-red-700">
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>

      {/* 备注编辑对话框 */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑学生备注</DialogTitle>
            <DialogDescription>修改学生的备注信息</DialogDescription>
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
