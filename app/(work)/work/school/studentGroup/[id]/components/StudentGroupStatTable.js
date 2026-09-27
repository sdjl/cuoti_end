"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 学生分组统计表格组件，展示学生的错题重练通过统计信息
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function StudentGroupStatTable({
  data,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>学生统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载学生统计数据中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>学生统计详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            该分组暂无学生数据
          </div>
        </CardContent>
      </Card>;
  }

  // 按通过率从高到低排序，通过率相同则按通过数量排序
  const sortedData = [...data].sort((a, b) => {
    if (b.correctionRate !== a.correctionRate) {
      return b.correctionRate - a.correctionRate;
    }
    return b.correctedCount - a.correctedCount;
  });
  return <Card>
      <CardHeader>
        <CardTitle>学生统计详情</CardTitle>
        <p className="text-sm text-gray-600">
          按通过率从高到低排序，共 {data.length} 名学生
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">排名</TableHead>
                <TableHead className="w-[100px]">学生姓名</TableHead>
                <TableHead className="w-[100px]">班级</TableHead>
                <TableHead className="w-[90px] text-center">错题总数</TableHead>
                <TableHead className="w-[90px] text-center">通过数量</TableHead>
                <TableHead className="w-[90px] text-center">
                  未通过数量
                </TableHead>
                <TableHead className="w-[90px] text-center">通过率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((student, index) => <TableRow key={student.studentId}>
                  <TableCell className="text-left">
                    <span className={cn("text-xs px-2 py-1 rounded font-medium", index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-600")}>
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.studentName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {student.className}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-700 text-sm">
                      {student.totalMistakes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600 text-sm">
                      {student.correctedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-red-600 text-sm">
                      {student.uncorrectedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600 text-sm">
                      {student.correctionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
