"use client";

// 自主上传错题老师帮助列表组件，展示需要老师帮助的学生问题列表，包括学生信息、题目图片、掌握情况和帮助状态
import { useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../components/ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import TeacherReplyDialog from "./TeacherReplyDialog.js";
export default function TeacherReplyList({
  items,
  isLoading
}) {
  const [activeProblemQuestionId, setActiveProblemQuestionId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  if (isLoading) {
    return <Card className="bg-white">
        <div className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Card>;
  }
  if (!items || items.length === 0) {
    return <Card className="bg-white">
        <div className="text-center py-8">
          <p className="text-gray-500">暂无数据</p>
        </div>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生信息</TableHead>
            <TableHead>班级年级</TableHead>
            <TableHead>题目图片</TableHead>
            <TableHead>掌握情况</TableHead>
            <TableHead>需要帮助</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(it => {
          const imageUrl = it.problemQuestion?.imageUrl;
          const isMaster = !!it.problemQuestion?.isStudentMaster;
          const needHelp = !!it.problemQuestion?.isNeedTeacherReply;
          return <TableRow key={it.problemQuestion._id}>
                {/* 学生信息 */}
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{it.student.name}</div>
                    <div className="text-gray-500">
                      编号: {it.student.studentCode || "未设置"}
                    </div>
                  </div>
                </TableCell>

                {/* 班级年级 */}
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {it.classroom?.name || "-"}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {it.classroom?.grade || "未设置年级"}
                    </div>
                  </div>
                </TableCell>

                {/* 题目图片（可放大） */}
                <TableCell>
                  {imageUrl ? <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative w-16 h-16 border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                          <BaseImage src={imageUrl} alt="题目图片" fill className="object-cover" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto flex flex-col items-center justify-center">
                        <DialogHeader className="w-full">
                          <DialogTitle>题目图片</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center items-center flex-1 w-full">
                          <BaseImage src={imageUrl} alt="题目大图" width={800} height={600} className="max-w-full h-auto object-contain" />
                        </div>
                      </DialogContent>
                    </Dialog> : <div className="w-16 h-16 border rounded-md bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">无图片</span>
                    </div>}
                </TableCell>

                {/* 掌握情况 */}
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isMaster ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                    {isMaster ? "已掌握" : "未掌握"}
                  </span>
                </TableCell>

                {/* 是否需要帮助（3种状态：需要帮助、已回复、无需帮助） */}
                <TableCell>
                  {(() => {
                const messages = it.problemQuestion.teacherStudentMessages || [];
                const hasTeacherReply = messages.some(m => m.role === "teacher");
                if (needHelp) {
                  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          需要帮助
                        </span>;
                }
                if (hasTeacherReply) {
                  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          已回复
                        </span>;
                }
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        无需帮助
                      </span>;
              })()}
                </TableCell>

                {/* 操作 */}
                <TableCell className="text-right">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => {
                    setActiveProblemQuestionId(it.problemQuestion._id);
                    setDialogOpen(true);
                  }}>
                        回复
                      </Button>
                    </DialogTrigger>
                    {activeProblemQuestionId === it.problemQuestion._id && <TeacherReplyDialog open={dialogOpen} onOpenChange={setDialogOpen} problemQuestion={it.problemQuestion} questionImageUrl={imageUrl} onSubmitted={msg => {
                  it.problemQuestion.isNeedTeacherReply = false;
                  it.problemQuestion.teacherStudentMessages = [...(it.problemQuestion.teacherStudentMessages || []), msg];
                }} />}
                  </Dialog>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
