"use client";

import { useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../components/ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
// 老师回复列表组件，展示需要老师帮助的学生错题记录，包括学生信息、错题图片、掌握情况等，并提供回复功能

import TeacherReplyDialog from "./TeacherReplyDialog.js";
export default function TeacherReplyList({
  items,
  isLoading
}) {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (!items || items.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">暂无数据</p>
        </CardContent>
      </Card>;
  }

  // 已不再显示最后一条消息

  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生信息</TableHead>
            <TableHead>班级年级</TableHead>
            <TableHead>错题图片</TableHead>
            <TableHead>题集名称</TableHead>
            <TableHead>掌握情况</TableHead>
            <TableHead>需要帮助</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(it => {
          const imageUrl = it.studentAnswerItem?.imageUrl || it.examQuestion?.imageUrl;
          return <TableRow key={it.session._id}>
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

                {/* 错题图片（可放大） */}
                <TableCell>
                  {imageUrl ? <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative w-16 h-16 border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                          <BaseImage src={imageUrl} alt="错题图片" fill className="object-cover" />
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

                {/* 题集名称 */}
                <TableCell className="w-1/4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2" title={it.questionPack?.name}>
                      {it.questionPack?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      类型: {it.questionPack?.type || "-"}
                    </div>
                  </div>
                </TableCell>

                {/* 状态 */}
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${it.session.isStudentMaster ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                    {it.session.isStudentMaster ? "已掌握" : "未掌握"}
                  </span>
                </TableCell>

                {/* 是否需要帮助（3种状态：需要帮助、已回复、无需帮助） */}
                <TableCell>
                  {(() => {
                const messages = it.session.teacherStudentMessages || [];
                const hasTeacherReply = messages.some(m => m.role === "teacher");
                if (it.session.isNeedTeacherReply) {
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
                    setActiveSessionId(it.session._id);
                    setDialogOpen(true);
                  }}>
                        回复
                      </Button>
                    </DialogTrigger>
                    {activeSessionId === it.session._id && <TeacherReplyDialog open={dialogOpen} onOpenChange={setDialogOpen} session={it.session} questionImageUrl={imageUrl} onSubmitted={msg => {
                  // 更新当前行状态与消息
                  it.session.isNeedTeacherReply = false;
                  it.session.teacherStudentMessages = [...(it.session.teacherStudentMessages || []), msg];
                }} />}
                  </Dialog>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
