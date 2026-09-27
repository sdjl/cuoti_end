"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 班级分享统计表格组件，用于展示班级内所有学生的分享统计数据
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function ClassroomShareTable({
  data,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>班级分享统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">
              加载班级分享统计数据中...
            </span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.studentStats.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>班级分享统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            暂无班级分享统计数据
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>班级分享统计详情</CardTitle>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            班级总分享次数：
            <span className="font-semibold text-blue-600 ml-1">
              {data.totalShareCount}
            </span>
            次，获得积分：
            <span className="font-semibold text-green-600 ml-1">
              {data.totalScoreAmount}
            </span>
            分
          </p>
          <p>
            分享给非学生用户：
            <span className="font-semibold text-orange-600 ml-1">
              {data.shareToNonStudentCount}
            </span>
            次，分享给学生用户：
            <span className="font-semibold text-purple-600 ml-1">
              {data.shareToStudentCount}
            </span>
            次，独立查看者：
            <span className="font-semibold text-indigo-600 ml-1">
              {data.uniqueViewersCount}
            </span>
            人
          </p>
          <p className="text-xs">
            按点击次数从高到低排序，共 {data.studentStats.length} 名学生
          </p>
          <p className="text-xs text-gray-500">
            注意：如果分享后没有任何人点击，则此分享数据统计不到
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
                  分享次数
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  点击次数
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  获得积分
                </TableHead>
                <TableHead className="w-[120px] text-center">
                  分享给非学生
                </TableHead>
                <TableHead className="w-[120px] text-center">
                  分享给学生
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  独立查看者
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
                      {student.shareCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-amber-600">
                      {student.clickCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {student.scoreAmount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <span className="font-semibold text-orange-600">
                        {student.shareToNonStudentCount}
                      </span>
                      {student.shareCount > 0 && <div className="text-xs text-gray-500">
                          {(student.shareToNonStudentCount / student.shareCount * 100).toFixed(1)}
                          %
                        </div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <span className="font-semibold text-purple-600">
                        {student.shareToStudentCount}
                      </span>
                      {student.clickCount > 0 && <div className="text-xs text-gray-500">
                          {(student.shareToStudentCount / student.clickCount * 100).toFixed(1)}
                          %
                        </div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-indigo-600">
                      {student.uniqueViewersCount}
                    </span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
