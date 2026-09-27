/**
 * Excel数据验证组件 - 学生批量导入第3步
 *
 * 用途：验证Excel文件中每行数据的格式和完整性
 * 使用场景：
 * - 列验证通过后自动执行
 * - 对Excel中的学生数据进行详细的格式和内容验证
 *
 * 主要功能：
 * - 数据格式验证：检查姓名、学号、出生日期、性别等字段格式
 * - 必填字段检查：确保必需字段不为空
 * - 数据重复检查：检查学号等唯一字段是否重复
 * - 错误定位：精确显示错误所在的行和列
 * - 数据预览：显示有错误的行的完整数据
 * - 统计信息：显示总行数、错误行数、有效行数等
 *
 * 验证规则：
 * - 姓名：不能为空，长度限制
 * - 学号：不能为空，格式验证，重复检查
 * - 出生日期：日期格式验证
 * - 性别：枚举值验证（男/女）
 * - 其他字段：根据配置的验证规则
 *
 * 错误展示：
 * - 按行分组显示错误
 * - 每个错误行显示完整的数据内容
 * - 具体的错误字段和错误原因
 * - 友好的字段名称映射
 *
 * 特点：
 * - 支持大量数据的验证和展示
 * - 滚动容器防止页面过长
 * - 颜色编码区分正常和错误状态
 * - 详细的统计信息包括过滤的表头行数
 */

"use client";

import { AlertTriangle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "../../../../../../../../components/ui/alert.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import StudentDistributionCard from "./StudentDistributionCard.js";
export default function DataValidator({
  validationErrors,
  totalRows,
  headers,
  rows,
  columnMapping,
  onBack,
  isLoading,
  filteredHeaderRows,
  studentDistribution,
  loadingDistribution,
  onConfirmImport
}) {
  const hasErrors = validationErrors.length > 0;

  // 按行号分组错误
  const errorsByRow = validationErrors.reduce((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = [];
    }
    acc[error.row].push(error);
    return acc;
  }, {});
  const errorRows = Object.keys(errorsByRow).map(Number).sort((a, b) => a - b);

  // 获取错误行的数据
  const getRowData = rowNumber => {
    const rowIndex = rowNumber - 2; // Excel行号转换为数组索引（减去表头行，rows数组已经是过滤后的数据）
    if (rowIndex >= 0 && rowIndex < rows.length) {
      return rows[rowIndex];
    }
    return [];
  };

  // 获取字段的友好名称
  const getFieldDisplayName = field => {
    const reverseMapping = {};
    Object.entries(columnMapping).forEach(([key, value]) => {
      reverseMapping[key] = value;
    });

    // 如果在columnMapping中找到，返回配置的列名
    if (reverseMapping[field]) {
      return reverseMapping[field];
    }

    // 否则返回友好的默认名称
    const fieldNameMap = {
      studentCode: "学生编号",
      name: "姓名",
      birthDate: "出生日期",
      ethnicity: "民族",
      homeAddress: "家庭地址",
      gender: "性别"
    };
    return fieldNameMap[field] || field;
  };
  return <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">数据验证</h3>
        <p className="text-gray-600 text-sm">
          检查Excel文件中的数据完整性和正确性
        </p>
      </div>

      {hasErrors ? <Alert className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              数据验证失败，发现 {validationErrors.length}{" "}
              个错误，请修正后重新上传
            </AlertDescription>
          </div>
        </Alert> : <Alert className="border-green-200 bg-green-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              数据验证通过，正在分析学生分布情况
            </AlertDescription>
          </div>
        </Alert>}

      {/* 数据统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalRows}
              </div>
              <div className="text-sm text-gray-600">总行数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {errorRows.length}
              </div>
              <div className="text-sm text-gray-600">错误行数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalRows - errorRows.length}
              </div>
              <div className="text-sm text-gray-600">有效行数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredHeaderRows}
              </div>
              <div className="text-sm text-gray-600">过滤表头行数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 如果数据验证通过，显示学生分布情况 */}
      {!hasErrors && <StudentDistributionCard notInSchool={studentDistribution.notInSchool} inSchoolNotInClass={studentDistribution.inSchoolNotInClass} inSchoolAndInClass={studentDistribution.inSchoolAndInClass} notInSchoolWithNames={studentDistribution.notInSchoolWithNames} loadingDistribution={loadingDistribution} />}

      {/* 错误详情 */}
      {hasErrors && <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              错误详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="max-h-[48rem] overflow-y-auto space-y-4">
                {errorRows.map(rowNumber => {
              const rowData = getRowData(rowNumber);
              const rowErrors = errorsByRow[rowNumber];
              return <Card key={rowNumber} className="border-red-200 bg-red-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive" className="text-sm">
                            Excel第 {rowNumber + filteredHeaderRows} 行
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* 显示行数据 */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            行数据：
                          </div>
                          <div className="bg-white rounded border p-3 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {headers.map((header, index) => <TableHead key={index} className="text-xs min-w-[100px] border-r last:border-r-0">
                                      {header}
                                    </TableHead>)}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  {headers.map((_, index) => {
                              const cellValue = rowData[index];
                              const cellStr = cellValue ? String(cellValue) : "";
                              const isEmpty = !cellStr || cellStr.trim() === "";
                              return <TableCell key={index} className={`text-xs min-w-[100px] border-r last:border-r-0 ${isEmpty ? "bg-red-100 text-red-600 font-medium" : "text-gray-800"}`}>
                                        {isEmpty ? "(空)" : cellStr}
                                      </TableCell>;
                            })}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* 显示错误信息 */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            错误信息：
                          </div>
                          <div className="space-y-1">
                            {rowErrors.map((error, errorIndex) => <div key={errorIndex} className="text-sm text-red-600 flex items-start">
                                <XCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                                <span>
                                  <span className="font-medium">
                                    {getFieldDisplayName(error.field)}：
                                  </span>
                                  {error.message}
                                </span>
                              </div>)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
            })}
              </div>

              {errorRows.length > 5 && <div className="text-sm text-gray-500 text-center">
                  显示 {errorRows.length} 个错误行
                </div>}
            </div>
          </CardContent>
        </Card>}

      {/* 解决方案提示 */}
      {hasErrors && <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="font-medium text-orange-800">解决方案：</p>
              <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                <li>确保学生编号和姓名列的每一行都有数据</li>
                <li>检查学生编号是否有重复</li>
                <li>修正上述错误后重新上传Excel文件</li>
              </ul>
            </div>
          </CardContent>
        </Card>}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          重新选择文件
        </Button>

        {!hasErrors && !loadingDistribution && <Button type="button" variant="default" onClick={onConfirmImport} disabled={isLoading || loadingDistribution} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            确定导入
          </Button>}
      </div>
    </div>;
}
