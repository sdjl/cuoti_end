"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 班级邀请码统计表格组件，展示班级内学生邀请码的统计详情
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function ClassroomInvitationTable({
  data,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>班级邀请码统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">
              加载班级邀请码统计数据中...
            </span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.studentStats.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>班级邀请码统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            暂无班级邀请码统计数据
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>班级邀请码统计详情</CardTitle>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            班级共创建邀请码：
            <span className="font-semibold text-blue-600 ml-1">
              {data.totalCreatedCodes}
            </span>
            个，被使用邀请码：
            <span className="font-semibold text-green-600 ml-1">
              {data.totalUsedCodes}
            </span>
            个，被使用次数：
            <span className="font-semibold text-amber-600 ml-1">
              {data.totalUsedCount}
            </span>
            次
          </p>
          <p className="text-xs">
            按被使用次数从高到低排序，共 {data.studentStats.length} 名学生
          </p>
          <p className="text-xs text-gray-500">
            注意：只统计学生邀请码，不包括合作伙伴和一次性邀请码
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">学生姓名</TableHead>
                <TableHead className="w-[120px]">学生编号</TableHead>
                <TableHead className="w-[100px] text-center">
                  创建邀请码
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  被使用邀请码
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  被使用次数
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  未使用邀请码
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.studentStats.map((student, index) => <TableRow key={student.studentId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      {student.studentName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {student.studentCode}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600">
                      {student.createdCodes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {student.usedCodes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-amber-600">
                      {student.usedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-600">
                      {student.unusedCodes}
                    </span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
