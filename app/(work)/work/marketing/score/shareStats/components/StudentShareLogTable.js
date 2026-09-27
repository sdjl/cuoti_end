"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 学生分享日志表格组件，用于展示指定学生的分享访问记录列表
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function StudentShareLogTable({
  data,
  studentName,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>{studentName} 的分享访问日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载分享日志中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>{studentName} 的分享访问日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            该学生暂无分享访问记录
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>{studentName} 的分享访问日志</CardTitle>
        <p className="text-sm text-gray-600">
          按访问时间倒序排列，共 {data.length} 条记录
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">查看者OpenID</TableHead>
                <TableHead className="min-w-[200px]">分享链接</TableHead>
                <TableHead className="w-[120px] text-center">
                  查看者类型
                </TableHead>
                <TableHead className="w-[120px]">查看者学生ID</TableHead>
                <TableHead className="w-[100px] text-center">
                  获得积分
                </TableHead>
                <TableHead className="w-[140px]">分享时间</TableHead>
                <TableHead className="w-[140px]">访问时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((log, index) => <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    {log.viewerOpenid.substring(0, 12)}...
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] overflow-hidden">
                      <a href={log.shareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm break-all">
                        {log.shareUrl.length > 50 ? `${log.shareUrl.substring(0, 50)}...` : log.shareUrl}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={log.viewerIsStudent ? "default" : "secondary"}>
                      {log.viewerIsStudent ? "学生用户" : "非学生用户"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {log.viewerStudentId ? <span className="font-mono text-xs">
                        {log.viewerStudentId}
                      </span> : <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${log.scoreAmount > 0 ? "text-green-600" : "text-gray-400"}`}>
                      {log.scoreAmount}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(log.shareTime), "yyyy-MM-dd HH:mm", {
                  locale: zhCN
                })}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(log.created), "yyyy-MM-dd HH:mm", {
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
