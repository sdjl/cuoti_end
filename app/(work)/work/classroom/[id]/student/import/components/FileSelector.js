/**
 * 文件选择器组件 - 学生批量导入第1步
 *
 * 用途：提供Excel文件的选择、上传和预览功能
 * 使用场景：
 * - 学生批量导入流程的第一步
 * - 用户需要选择包含学生信息的Excel文件
 *
 * 主要功能：
 * - 文件选择：支持点击选择和拖拽上传
 * - 文件验证：检查文件格式（仅支持.xlsx, .xls）
 * - 动态示例：根据学校配置显示Excel格式要求
 * - 文件预览：显示已选择文件的基本信息
 * - 错误提示：文件格式不正确时显示错误信息
 *
 * 特点：
 * - 从服务器获取学校的列配置，动态生成Excel格式示例
 * - 自动过滤表头行（如学校名称等非数据行）
 * - 友好的拖拽上传界面
 * - 实时文件大小显示
 */

"use client";

import { CheckCircle, FileText, Info, Upload, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatFileSize, validateExcelFile } from "../clientActions.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function FileSelector({
  file,
  onFileSelect,
  onFileRemove,
  isLoading,
  classRoomId
}) {
  const fileInputRef = useRef(null);
  const [tableColumns, setTableColumns] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [configLoading, setConfigLoading] = useState(true);

  // 获取表格列配置
  useEffect(() => {
    async function fetchTableColumns() {
      if (!classRoomId) return;
      try {
        // 这里需要导入 Server Action
        const {
          getTableColumnsConfig
        } = await import("../actions");
        const result = await getTableColumnsConfig(classRoomId);
        if (result.success && result.data) {
          setTableColumns(result.data.tableColumns);
          setSchoolName(result.data.schoolName);
        }
      } catch (error) {
        console.error("获取表格配置失败:", error);
      } finally {
        setConfigLoading(false);
      }
    }
    fetchTableColumns();
  }, [classRoomId]);

  // 渲染动态表格样例
  const renderTableExample = () => {
    if (configLoading) {
      return <div className="bg-white rounded border p-3 text-xs text-center text-gray-500">
          加载配置中...
        </div>;
    }
    if (!tableColumns) {
      return <div className="bg-white rounded border p-3 text-xs text-center text-red-500">
          无法获取表格配置，请联系管理员
        </div>;
    }

    // 过滤掉空字符串的列
    const validColumns = Object.entries(tableColumns).filter(([, columnName]) => columnName && columnName.trim() !== "");
    if (validColumns.length === 0) {
      return <div className="bg-white rounded border p-3 text-xs text-center text-red-500">
          没有有效的列配置
        </div>;
    }

    // 生成样例数据
    const sampleData = [generateSampleRow(validColumns, 0), generateSampleRow(validColumns, 1)];
    return <div className="bg-white rounded border p-3 text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <td colSpan={validColumns.length} className="border border-gray-300 px-2 py-1 text-center text-gray-500">
                {schoolName || "××学校"}学生名单 - 会被自动过滤
              </td>
            </tr>
            <tr className="text-gray-500">
              <td colSpan={Math.ceil(validColumns.length / 2)} className="border border-gray-300 px-2 py-1 text-center">
                - 会被自动过滤
              </td>
              <td colSpan={Math.floor(validColumns.length / 2)} className="border border-gray-300 px-2 py-1 text-center">
                - 会被自动过滤
              </td>
            </tr>
            <tr>
              {validColumns.map(([, columnName]) => <td key={columnName} className="border border-gray-300 px-2 py-1 font-medium bg-blue-100">
                  {columnName}
                </td>)}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, index) => <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                    {cell}
                  </td>)}
              </tr>)}
          </tbody>
        </table>
      </div>;
  };

  // 生成样例行数据
  const generateSampleRow = (columns, index) => {
    return columns.map(([fieldName]) => {
      switch (fieldName) {
        case "studentCode":
          return `202400${index + 1}`;
        case "name":
          return index === 0 ? "张三" : "李四";
        case "gender":
          return index === 0 ? "男" : "女";
        case "birthDate":
          return index === 0 ? "2010-01-15" : "2010-03-22";
        case "ethnicity":
          return index === 0 ? "汉族" : "汉族";
        case "homeAddress":
          return index === 0 ? "北京市朝阳区" : "上海市浦东区";
        case "notes":
          return index === 0 ? "班长" : "";
        default:
          return `数据${index + 1}`;
      }
    });
  };
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = event => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validation = validateExcelFile(selectedFile);
      if (validation.valid) {
        onFileSelect(selectedFile);
      } else {
        alert(validation.error);
      }
    }
    // 清空input值，允许重新选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleDragOver = event => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleDrop = event => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      const validation = validateExcelFile(droppedFile);
      if (validation.valid) {
        onFileSelect(droppedFile);
      } else {
        alert(validation.error);
      }
    }
  };
  return <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">选择Excel文件</h3>
        <p className="text-gray-600 text-sm">
          请选择包含学生信息的Excel文件（.xlsx或.xls格式，文件大小不超过20MB）
        </p>
      </div>

      {!file ? <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
          <CardContent className="p-8 text-center cursor-pointer" onClick={handleFileSelect} onDragOver={handleDragOver} onDrop={handleDrop}>
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  点击选择文件或拖拽文件到此处
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 .xlsx 和 .xls 格式
                </p>
              </div>
              <Button type="button" variant="outline" disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                选择文件
              </Button>
            </div>
          </CardContent>
        </Card> : <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onFileRemove} disabled={isLoading} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>}

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />

      {/* 导入说明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-800 text-base">
            <Info className="h-5 w-5 mr-2" />
            Excel表格格式要求
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-blue-700">
            <div className="mb-3">
              <h4 className="font-medium mb-2">支持的表格格式：</h4>
              <ul className="space-y-1 ml-4">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  系统会自动过滤掉表格顶部的合并单元格行
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  系统会自动过滤掉表格末尾的空行
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  表格中有效数据的所有行必须具有相同的列数
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <h4 className="font-medium mb-2">表格样例：</h4>
              {renderTableExample()}
              <p className="text-xs text-blue-600 mt-2">
                <Info className="h-3 w-3 inline mr-1" />
                注意：Excel表格中的列顺序可以是任意的，不需要与上面的样例顺序完全一致。系统会根据列名自动识别对应的字段。
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">注意事项：</h4>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>表格数据行的列数必须一致，不能有缺失列</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    必须按照校园配置的列名设置表头（如：学号、姓名等）
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
