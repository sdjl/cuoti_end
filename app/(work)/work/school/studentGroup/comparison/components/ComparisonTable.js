"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
// 学生分组对比表格组件，展示各分组的错题重练对比统计信息
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function ComparisonTable({
  data,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>分组对比表格</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载分组对比数据中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>分组对比表格</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">暂无分组数据</div>
        </CardContent>
      </Card>;
  }

  // 按通过率从高到低排序
  const sortedData = [...data].sort((a, b) => {
    if (b.correctionRate !== a.correctionRate) {
      return b.correctionRate - a.correctionRate;
    }
    return b.correctedCount - a.correctedCount;
  });
  return <Card>
      <CardHeader>
        <CardTitle>分组对比表格</CardTitle>
        <p className="text-sm text-gray-600">
          按通过率从高到低排序，共 {data.length} 个分组
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">排名</TableHead>
                <TableHead className="w-[150px]">分组名称</TableHead>
                <TableHead className="w-[100px]">负责老师</TableHead>
                <TableHead className="w-[90px] text-center">学生数</TableHead>
                <TableHead className="w-[90px] text-center">错题总数</TableHead>
                <TableHead className="w-[90px] text-center">通过数量</TableHead>
                <TableHead className="w-[90px] text-center">
                  未通过数量
                </TableHead>
                <TableHead className="w-[90px] text-center">通过率</TableHead>
                <TableHead className="w-[100px] text-center">
                  积分总增量
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  平均积分增量
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((group, index) => <TableRow key={group.groupId}>
                  <TableCell className="text-left">
                    <span className={cn("text-xs px-2 py-1 rounded font-medium", index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-600")}>
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {group.groupName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {group.teacherName}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-700 text-sm">
                      {group.studentCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-700 text-sm">
                      {group.totalMistakes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600 text-sm">
                      {group.correctedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-red-600 text-sm">
                      {group.uncorrectedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600 text-sm">
                      {group.correctionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-purple-600 text-sm">
                      {group.totalScoreIncrease}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-amber-600 text-sm">
                      {group.averageScorePerStudent.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}
