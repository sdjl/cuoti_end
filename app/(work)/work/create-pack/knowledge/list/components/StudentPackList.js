"use client";

import { Eye, Users } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
// 学生题集列表组件，用于显示最近创建定制题集的学生列表
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function StudentPackList({
  students,
  isLoading,
  onViewStudent
}) {
  // 格式化时间
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) {
      return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
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
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无数据</p>
          <p className="text-gray-400 text-sm mt-2">
            还没有为学生创建过定制题集
          </p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生姓名</TableHead>
            <TableHead>班级</TableHead>
            <TableHead>年级</TableHead>
            <TableHead>最后创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => <TableRow key={student.studentId}>
              <TableCell>
                <div className="font-medium">{student.studentName}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{student.className}</div>
              </TableCell>
              <TableCell>
                {student.grade ? <Badge variant="outline">{student.grade}</Badge> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatTime(student.lastCreatedTime)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onViewStudent(student.classId, student.studentId)} title="查看该学生的定制题集">
                  <Eye className="h-3 w-3 mr-1" />
                  查看
                </Button>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
