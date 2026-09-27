"use client";

// 学生统计表格组件，展示班级内学生的错题统计数据，包括错题总数、已掌握和未掌握题目数量
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
export default function StudentStatTable({
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
          <div className="text-center py-8 text-gray-500">暂无学生统计数据</div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle>学生统计详情</CardTitle>
        <p className="text-sm text-gray-600">
          按错题总数从高到低排序，共 {data.length} 名学生
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">学生姓名</TableHead>
                <TableHead className="w-[120px]">学生编号</TableHead>
                <TableHead className="w-[100px] text-center">
                  错题总数
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  已掌握题目
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  未掌握题目
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((student, index) => <TableRow key={student.studentId}>
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
                      {student.totalQuestions}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {student.correctedCount}
                    </span>
                    {student.totalQuestions > 0 && <div className="text-xs text-gray-500 mt-1">
                        {(student.correctedCount / student.totalQuestions * 100).toFixed(1)}
                        %
                      </div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-orange-600">
                      {student.uncorrectedCount}
                    </span>
                    {student.totalQuestions > 0 && <div className="text-xs text-gray-500 mt-1">
                        {(student.uncorrectedCount / student.totalQuestions * 100).toFixed(1)}
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
