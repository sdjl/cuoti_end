"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 学生邀请详情表格组件，展示单个学生的邀请成功记录详情
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function StudentInvitationDetailTable({
  data,
  studentName,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>{studentName} 的邀请详情记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载邀请详情中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>{studentName} 的邀请详情记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            该学生暂无成功邀请记录
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>{studentName} 的邀请详情记录</CardTitle>
        <p className="text-sm text-gray-600">
          按邀请时间倒序排列，共 {data.length} 条成功邀请记录
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">邀请码</TableHead>
                <TableHead className="w-[120px]">被邀请人姓名</TableHead>
                <TableHead className="w-[140px]">被邀请人电话</TableHead>
                <TableHead className="min-w-[200px]">备注信息</TableHead>
                <TableHead className="w-[140px]">邀请时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((detail, index) => <TableRow key={index}>
                  <TableCell className="font-mono text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {detail.invitationCode}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {detail.inviteeName || <span className="text-gray-400 italic">未填写</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {detail.inviteePhone || <span className="text-gray-400 italic">未填写</span>}
                  </TableCell>
                  <TableCell>
                    {detail.remark ? <div className="max-w-[300px] break-words text-sm">
                        {detail.remark}
                      </div> : <span className="text-gray-400 italic">无备注</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(detail.created), "yyyy-MM-dd HH:mm", {
                  locale: zhCN
                })}
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
