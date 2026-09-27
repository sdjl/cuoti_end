"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 非登录用户统计详情表格组件，展示每个用户的错题统计信息，包括题目总数、已掌握和未掌握数量
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function GuestStudentStatTable({
  data,
  loading
}) {
  const {
    toast
  } = useToast();
  const handleCopyOpenid = async openid => {
    try {
      await navigator.clipboard.writeText(openid);
      toast({
        title: "复制成功",
        description: "OpenID已复制到剪贴板"
      });
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>非登录用户统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载用户统计数据中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>非登录用户统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">暂无用户统计数据</div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>非登录用户统计详情</CardTitle>
        <p className="text-sm text-gray-600">
          按{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}题目总数从高到低排序，共{" "}
          {data.length} 名用户
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">用户姓名</TableHead>
                <TableHead className="w-[120px]">联系电话</TableHead>
                <TableHead className="w-[120px]">校园名称</TableHead>
                <TableHead className="w-[80px]">年级</TableHead>
                <TableHead className="w-[80px] text-center">题目总数</TableHead>
                <TableHead className="w-[80px] text-center">已掌握</TableHead>
                <TableHead className="w-[80px] text-center">未掌握</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user, index) => <TableRow key={user.openid}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      <button onClick={() => handleCopyOpenid(user.openid)} className="hover:text-blue-600 cursor-pointer transition-colors" title="点击复制OpenID">
                        {user.studentName}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.studentPhone || "未填写"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.schoolName || "未填写"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.grade || "未填写"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600">
                      {user.totalQuestions}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {user.masteredQuestions}
                    </span>
                    {user.totalQuestions > 0 && <div className="text-xs text-gray-500 mt-1">
                        {(user.masteredQuestions / user.totalQuestions * 100).toFixed(1)}
                        %
                      </div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-orange-600">
                      {user.unmasteredQuestions}
                    </span>
                    {user.totalQuestions > 0 && <div className="text-xs text-gray-500 mt-1">
                        {(user.unmasteredQuestions / user.totalQuestions * 100).toFixed(1)}
                        %
                      </div>}
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
