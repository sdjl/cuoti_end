/**
 * 学生批量导入页面
 *
 * 该页面用于从Excel文件批量导入学生信息到指定班级中。
 * 导入过程分为4个步骤：
 * 1. SELECT_FILE - 选择并上传Excel文件
 * 2. VALIDATE_COLUMNS - 验证Excel列是否符合要求
 * 3. VALIDATE_DATA - 验证Excel数据是否符合要求
 * 4. COMPLETE - 导入完成
 *
 * 权限要求：需要是班级的老师或管理员才能进行批量导入操作
 */

"use client";

import { useParams } from "next/navigation";
import ColumnValidator from "./components/ColumnValidator.js"; // 第2步：Excel列验证组件，检查是否包含必需的列
import ContentLoadingSpinner from "./components/ContentLoadingSpinner.js"; // 内容区域加载指示器，用于文件处理过程中
import DataValidator from "./components/DataValidator.js"; // 第3步：Excel数据验证组件，检查数据格式和内容

// 导入流程的各个步骤组件
import FileSelector from "./components/FileSelector.js"; // 第1步：文件选择和上传组件
import ImportComplete from "./components/ImportComplete.js"; // 第4步：导入完成提示组件
// 页面布局组件
import ImportPageLayout from "./components/ImportPageLayout.js"; // 提供统一的页面布局结构（包含Header和Card容器）
// 加载状态相关组件
import LoadingCard from "./components/LoadingCard.js"; // 全页面加载状态组件，用于权限验证等初始化过程

// 错误处理组件
import PermissionError from "./components/PermissionError.js"; // 权限错误提示组件，当用户没有导入权限时显示
// 导入步骤枚举
import { ImportStep } from "./clientActions.js";
// 业务逻辑Hook
import { useImportLogic } from "./useImportLogic.js"; // 封装所有导入相关的业务逻辑

/**
 * 学生批量导入页面组件
 *
 * 页面流程：
 * 1. 初始化：验证用户权限
 * 2. 如果权限验证失败：显示权限错误页面
 * 3. 如果权限验证成功：根据当前步骤显示对应的组件
 *    - SELECT_FILE：显示文件选择界面
 *    - VALIDATE_COLUMNS：显示列验证结果
 *    - VALIDATE_DATA：显示数据验证结果
 *    - COMPLETE：显示导入完成提示
 */
export default function ImportStudentPage() {
  const params = useParams();
  const classRoomId = params.id; // 从URL参数获取班级ID

  // 使用自定义Hook获取所有导入相关的状态和处理函数
  const {
    importState,
    // 导入流程的当前状态
    isInitializing,
    // 是否正在初始化（验证权限中）
    permissionError,
    // 权限验证错误信息
    handleFileSelect,
    // 处理文件选择
    handleFileRemove,
    // 处理文件移除
    handleBackToFileSelect,
    // 返回到文件选择步骤
    handleConfirmImport // 处理确认导入
  } = useImportLogic(classRoomId);

  // 基础参数验证：班级ID必须存在
  if (!classRoomId) {
    return <div>班级ID无效</div>;
  }

  // 第一阶段：初始化加载状态
  // 显示全页面加载状态，提示正在验证用户权限
  if (isInitializing) {
    return <LoadingCard message="验证权限中..." classRoomId={classRoomId} />;
  }

  // 第二阶段：权限验证失败
  // 如果用户没有导入权限，显示权限错误页面
  if (permissionError) {
    return <ImportPageLayout classRoomId={classRoomId}>
        <PermissionError error={permissionError} classRoomId={classRoomId} />
      </ImportPageLayout>;
  }

  // 第三阶段：正常的导入流程
  // 根据当前步骤显示对应的界面
  return <ImportPageLayout classRoomId={classRoomId}>
      {/* 处理中的加载状态：显示在文件上传和处理过程中 */}
      {importState.isLoading && <ContentLoadingSpinner message="处理中..." />}

      {/* 非加载状态：根据当前步骤显示对应的组件 */}
      {!importState.isLoading && <>
          {/* 步骤1：SELECT_FILE - 文件选择阶段 */}
          {/* 用户可以选择和上传Excel文件，系统会解析文件内容 */}
          {importState.step === ImportStep.SELECT_FILE && <FileSelector file={importState.file} onFileSelect={handleFileSelect} onFileRemove={handleFileRemove} isLoading={importState.isLoading} classRoomId={classRoomId} />}

          {/* 步骤2：VALIDATE_COLUMNS - 列验证阶段 */}
          {/* 检查Excel文件是否包含必需的列（如姓名、学号等） */}
          {/* 如果缺少必需列，会显示错误信息和要求 */}
          {importState.step === ImportStep.VALIDATE_COLUMNS && <ColumnValidator missingColumns={importState.missingColumns} // 缺失的必需列
      requiredColumns={importState.requiredColumns} // 所有必需列
      currentColumns={importState.currentColumns} // 当前文件包含的列
      onBack={handleBackToFileSelect} // 返回重新选择文件
      isLoading={importState.isLoading} />}

          {/* 步骤3：VALIDATE_DATA - 数据验证阶段 */}
          {/* 检查Excel中每行数据的格式和内容是否正确 */}
          {/* 如果有数据错误，会显示具体的错误信息和位置 */}
          {importState.step === ImportStep.VALIDATE_DATA && <DataValidator validationErrors={importState.validationErrors} // 数据验证错误列表
      totalRows={importState.rows.length} // 总行数
      headers={importState.headers} // Excel表头
      rows={importState.rows} // Excel数据行
      columnMapping={importState.columnMapping} // 列映射关系
      onBack={handleBackToFileSelect} // 返回重新选择文件
      isLoading={importState.isLoading} filteredHeaderRows={importState.filteredHeaderRows} // 过滤后的表头行
      studentDistribution={importState.studentDistribution} // 学生分布情况
      loadingDistribution={importState.loadingDistribution} // 是否正在加载分布情况
      onConfirmImport={handleConfirmImport} // 确认导入回调函数
      />}

          {/* 步骤4：COMPLETE - 导入完成阶段 */}
          {/* 显示导入成功的信息和统计数据 */}
          {importState.step === ImportStep.COMPLETE && <ImportComplete validRowCount={importState.rows.length} // 成功导入的学生数量
      onBack={handleBackToFileSelect} // 返回重新导入
      isLoading={importState.isLoading} classRoomId={classRoomId} // 班级ID，用于返回班级页面
      importResult={importState.importResult || {
        // 导入结果统计
        newStudentsCount: 0,
        addedStudentsCount: 0,
        totalStudentsCount: 0
      }} />}
        </>}
    </ImportPageLayout>;
}
