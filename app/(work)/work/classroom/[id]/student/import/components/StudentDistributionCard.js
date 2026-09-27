/**
 * 学生分布情况展示组件
 *
 * 用途：展示导入文件中学生编号的分布情况
 * 使用场景：
 * - 数据验证通过后，在导入前展示学生分布情况
 * - 让用户明确了解导入操作将产生的影响
 *
 * 分布类型：
 * 1. 不在校园中的学生 - 将被新建并加入班级
 * 2. 在校园中但不在班级中的学生 - 将被添加到班级
 * 3. 已经在班级中的学生 - 将被跳过或更新
 */

"use client";

import { CircleAlert, ListChecks, School, UserPlus, Users } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../../../components/ui/tabs.js";
export default function StudentDistributionCard({
  notInSchool,
  inSchoolNotInClass,
  inSchoolAndInClass,
  notInSchoolWithNames = [],
  loadingDistribution
}) {
  // 各类型学生的数量
  const newStudentsCount = notInSchool.length;
  const existingStudentsCount = inSchoolNotInClass.length;
  const duplicateStudentsCount = inSchoolAndInClass.length;
  const totalCount = newStudentsCount + existingStudentsCount + duplicateStudentsCount;

  // 创建学生编号到姓名的映射
  const studentNameMap = new Map();
  if (notInSchoolWithNames && notInSchoolWithNames.length > 0) {
    notInSchoolWithNames.forEach(student => {
      studentNameMap.set(student.code, student.name);
    });
  }
  return <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-600" />
          学生分布情况
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingDistribution ? <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-gray-600">正在分析学生分布情况...</span>
          </div> : <>
            {/* 汇总统计信息 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
                <span className="text-blue-800 text-xs font-medium mb-1">
                  总学生数
                </span>
                <span className="text-2xl font-bold text-blue-700">
                  {totalCount}
                </span>
              </div>
              <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
                <span className="text-green-800 text-xs font-medium mb-1 flex items-center">
                  <UserPlus className="h-3 w-3 mr-1" />
                  新学生
                </span>
                <span className="text-2xl font-bold text-green-700">
                  {newStudentsCount}
                </span>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
                <span className="text-purple-800 text-xs font-medium mb-1 flex items-center">
                  <School className="h-3 w-3 mr-1" />
                  校内学生
                </span>
                <span className="text-2xl font-bold text-purple-700">
                  {existingStudentsCount}
                </span>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 flex flex-col items-center">
                <span className="text-orange-800 text-xs font-medium mb-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  班内学生
                </span>
                <span className="text-2xl font-bold text-orange-700">
                  {duplicateStudentsCount}
                </span>
              </div>
            </div>

            {/* 分类详细信息 */}
            <Tabs defaultValue="notInSchool" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="notInSchool" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  新建学生
                  <Badge variant="outline" className="ml-2 bg-green-50">
                    {newStudentsCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="inSchoolNotInClass" className="flex items-center">
                  <School className="h-4 w-4 mr-2" />
                  校内学生
                  <Badge variant="outline" className="ml-2 bg-purple-50">
                    {existingStudentsCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="inSchoolAndInClass" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  班内学生
                  <Badge variant="outline" className="ml-2 bg-orange-50">
                    {duplicateStudentsCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* 不在校园中的学生 - 将被新建 */}
              <TabsContent value="notInSchool">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center text-green-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      这些学生不在校园中，将被新建并加入班级，并使用Excel表中的学生信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {newStudentsCount > 0 ? <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>学生编号</TableHead>
                              <TableHead>姓名</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {notInSchoolWithNames && notInSchoolWithNames.length > 0 ? notInSchoolWithNames.map(student => <TableRow key={`new-${student.code}`}>
                                    <TableCell>{student.code}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                  </TableRow>) : notInSchool.map(code => <TableRow key={`new-${code}`}>
                                    <TableCell>{code}</TableCell>
                                    <TableCell>
                                      {studentNameMap.get(code) || "数据不可用"}
                                    </TableCell>
                                  </TableRow>)}
                          </TableBody>
                        </Table>
                      </div> : <div className="text-center py-4 text-gray-500">
                        没有需要新建的学生
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 在校园中但不在班级中的学生 - 将被添加到班级 */}
              <TabsContent value="inSchoolNotInClass">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center text-purple-700">
                      <School className="h-4 w-4 mr-2" />
                      这些学生在校园中但不在当前班级中，将被添加到班级，并使用已有学生信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {existingStudentsCount > 0 ? <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>学生编号</TableHead>
                              <TableHead>姓名</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inSchoolNotInClass.map(student => <TableRow key={`existing-${student._id}`}>
                                <TableCell>{student.studentCode}</TableCell>
                                <TableCell>{student.name}</TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div> : <div className="text-center py-4 text-gray-500">
                        没有需要添加到班级的学生
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 已经在班级中的学生 - 将被跳过 */}
              <TabsContent value="inSchoolAndInClass">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center text-orange-700">
                      <CircleAlert className="h-4 w-4 mr-2" />
                      这些学生已在当前班级中，将被跳过，不会更新学生信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {duplicateStudentsCount > 0 ? <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>学生编号</TableHead>
                              <TableHead>姓名</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inSchoolAndInClass.map(student => <TableRow key={`duplicate-${student._id}`}>
                                <TableCell>{student.studentCode}</TableCell>
                                <TableCell>{student.name}</TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div> : <div className="text-center py-4 text-gray-500">
                        没有已在班级中的学生
                      </div>}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>}
      </CardContent>
    </Card>;
}
