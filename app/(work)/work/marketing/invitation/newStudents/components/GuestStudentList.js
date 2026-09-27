"use client";

// 新生列表组件，用于展示和管理新生信息
import { Copy, Edit, UserCheck, Users } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function GuestStudentList({
  students,
  isLoading,
  onEditStudent,
  onConvertToStudent
}) {
  const {
    toast
  } = useToast();
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: `已复制${label}：${text}`
      });
    } catch {
      toast({
        title: "复制失败",
        description: "请手动复制",
        variant: "destructive"
      });
    }
  };
  const formatDateTime = timestamp => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
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
          <p className="text-gray-500">暂无新生数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>联系状态</TableHead>
            <TableHead>转换状态</TableHead>
            <TableHead>新生姓名</TableHead>
            <TableHead>新生电话</TableHead>
            <TableHead>新生校园</TableHead>
            <TableHead>新生年级</TableHead>
            <TableHead>邀请人姓名</TableHead>
            <TableHead>邀请码</TableHead>
            <TableHead>老师联系时间</TableHead>
            <TableHead>邀请成功时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
          return <TableRow key={student._id}>
                <TableCell>
                  <Badge variant={student.isContactedByTeacher ? "default" : "destructive"} className="text-xs text-white">
                    {student.isContactedByTeacher ? "已联系" : "未联系"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={student.studentInfoAfterBecomeStudent ? "default" : "secondary"} className="text-xs">
                    {student.studentInfoAfterBecomeStudent ? "已转为在校生" : "未转换"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {student.studentInfo.studentName || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {student.studentInfo.studentPhone ? <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1" onClick={() => copyToClipboard(student.studentInfo.studentPhone, "电话号码")}>
                            {student.studentInfo.studentPhone}
                            <Copy className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>点击复制电话号码</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {student.studentInfo.schoolName || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {student.studentInfo.grade || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {student.inviterInfo?.inviterStudentName || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {student.inviterInfo?.invitationCode ? <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="font-mono text-sm cursor-pointer hover:text-blue-600 flex items-center gap-1" onClick={() => copyToClipboard(student.inviterInfo.invitationCode, "邀请码")}>
                            {student.inviterInfo.invitationCode}
                            <Copy className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>点击复制邀请码</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDateTime(student.teacherContactTime)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDateTime(student.created)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onEditStudent(student)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>编辑新生信息</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!student.studentInfoAfterBecomeStudent && <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="default" size="sm" onClick={() => onConvertToStudent(student)} className="h-8 px-3 text-xs">
                              <UserCheck className="h-4 w-4 mr-1" />
                              转为在校生
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>将新生转为正式在校生</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>}
                  </div>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
