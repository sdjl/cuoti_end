"use client";

import { Copy, Edit, Trash2, UserPlus } from "lucide-react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
// 显示教师列表的组件，支持查看、编辑、删除教师信息
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function TeacherList({
  teachers,
  isLoading,
  isPrincipal,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher
}) {
  const {
    toast
  } = useToast();
  // 复制到剪贴板
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "OpenID已复制到剪贴板"
      });
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = staff => {
    return staff.name || staff.nickname || "未设置姓名";
  };

  // 获取用户头像
  const getUserAvatar = staff => {
    if (staff.headimgurl) {
      return <BaseImage src={staff.headimgurl} alt={getUserDisplayName(staff)} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />;
    }
    return <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
        {getUserDisplayName(staff).charAt(0)}
      </div>;
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      {teachers.length > 0 ? <Table>
          <TableHeader>
            <TableRow>
              <TableHead>教师信息</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>邮箱</TableHead>
              {isPrincipal && <TableHead>备注（仅校长可见）</TableHead>}
              <TableHead>账户状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map(teacher => <TableRow key={teacher._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {getUserAvatar(teacher)}
                    <div>
                      <div className="font-medium">
                        {getUserDisplayName(teacher)}
                      </div>
                      {teacher.nickname && teacher.name !== teacher.nickname && <div className="text-sm text-gray-500">
                            {teacher.nickname}
                          </div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {teacher.gender || "未设置"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {teacher.phone || "未设置"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {teacher.email || "未设置"}
                  </div>
                </TableCell>
                {isPrincipal && <TableCell>
                    <div className="text-sm text-gray-600 max-w-32 truncate" title={teacher.remark || ""}>
                      {teacher.remark || "无备注"}
                    </div>
                  </TableCell>}
                <TableCell>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${teacher.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {teacher.status === "active" ? "正常" : "禁用"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(teacher.openid)} title="复制OpenID">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!isPrincipal} onClick={() => onEditTeacher(teacher._id)} title={!isPrincipal ? "只有校长才能编辑教师" : ""}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!isPrincipal} title={!isPrincipal ? "只有校长才能删除教师" : ""} className="text-white">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除教师</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要将 {getUserDisplayName(teacher)}{" "}
                            从教师队伍中移除吗？此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onDeleteTeacher(teacher._id)}>
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table> : <CardContent className="text-center py-8">
          <p className="text-gray-500 mb-4">暂无教师数据</p>
          <Button disabled={!isPrincipal} onClick={onAddTeacher}>
            <UserPlus className="h-4 w-4 mr-2" />
            添加第一位教师
          </Button>
        </CardContent>}
    </Card>;
}
