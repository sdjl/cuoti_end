/**
 * 学生批量导入业务逻辑Hook
 *
 * 用途：封装学生批量导入功能的所有业务逻辑，包括状态管理和操作处理
 * 使用场景：
 * - 学生批量导入页面的核心逻辑处理
 * - 需要复用导入逻辑的其他组件
 *
 * 功能包括：
 * - 权限验证：检查用户是否有导入学生的权限
 * - 文件处理：上传和解析Excel文件
 * - 列验证：检查Excel文件是否包含必需的列
 * - 数据验证：验证Excel中每行数据的格式和内容
 * - 状态管理：管理整个导入流程的状态转换
 * - 错误处理：处理各个步骤中可能出现的错误
 * - 自动化流程：文件上传后自动进行列验证和数据验证
 * - 批量导入：执行学生批量导入操作
 *
 * 返回值：
 * - importState: 当前导入状态（步骤、数据、错误等）
 * - isInitializing: 是否正在初始化
 * - permissionError: 权限验证错误信息
 * - handleFileSelect: 文件选择处理函数
 * - handleFileRemove: 文件移除处理函数
 * - handleBackToFileSelect: 返回文件选择步骤的处理函数
 * - handleConfirmImport: 确认导入学生数据的处理函数
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { checkStudentDistribution, importStudents, parseExcelFile, validateExcelColumns, validateExcelData, validateImportPermissions } from "./actions.js";
import { handleColumnValidation, handleDataValidation, handleFileUpload, ImportStep, initialImportState, resetToSelectFile, setColumnValidationError, setColumnValidationSuccess, setDataValidationError, setDataValidationSuccess, setError, setFileData, setLoading, setStudentDistribution } from "./clientActions.js";
export function useImportLogic(classRoomId) {
  const {
    toast
  } = useToast();
  const router = useRouter();
  const [importState, setImportState] = useState(initialImportState);
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissionError, setPermissionError] = useState(null);

  // 初始化权限验证
  useEffect(() => {
    async function checkPermissions() {
      if (!classRoomId) return;
      try {
        const result = await validateImportPermissions(classRoomId);
        if (!result.success) {
          setPermissionError(result.error || "权限验证失败");
        } else {
          setPermissionError(null);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "权限验证失败";
        setPermissionError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    }
    checkPermissions();
  }, [classRoomId, router, toast]);

  // 处理列验证
  const handleColumnValidationWrapper = async (headers, rows) => {
    if (!classRoomId) return;
    const result = await handleColumnValidation(headers, classRoomId, toast, validateExcelColumns);
    if (result.success && result.data) {
      setImportState(prev => setColumnValidationSuccess(prev, result.data.columnMapping));
      // 自动进行数据验证
      if (classRoomId) {
        handleDataValidationWrapper(headers, rows, result.data.columnMapping);
      }
    } else {
      setImportState(prev => setColumnValidationError(prev, result.missingColumns || [], result.requiredColumns || [], result.currentColumns || []));
    }
  };

  // 处理数据验证
  const handleDataValidationWrapper = useCallback(async (headers, rows, columnMapping) => {
    if (!classRoomId) return;
    try {
      const result = await handleDataValidation(headers, rows, columnMapping, classRoomId, toast, validateExcelData);
      if (result.success) {
        // 先更新状态为验证成功，且准备加载分布情况
        setImportState(prev => setDataValidationSuccess(prev));

        // 直接执行分布情况检查，不依赖于状态更新后的回调
        try {
          const distribution = await checkStudentDistribution(classRoomId, headers, rows, columnMapping);
          if (distribution.success && distribution.data) {
            // 更新状态，包含分布数据并关闭加载状态
            setImportState(prev => setStudentDistribution(prev, distribution.data));
          } else {
            toast({
              title: "检查学生分布失败",
              description: distribution.error || "无法获取学生分布情况",
              variant: "destructive"
            });
            // 确保关闭加载状态
            setImportState(prev => ({
              ...prev,
              loadingDistribution: false
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "检查学生分布失败";
          toast({
            title: "检查学生分布失败",
            description: errorMessage,
            variant: "destructive"
          });
          // 确保关闭加载状态
          setImportState(prev => ({
            ...prev,
            loadingDistribution: false
          }));
        }
      } else {
        setImportState(prev => setDataValidationError(prev, result.validationErrors || []));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "数据验证过程失败";
      toast({
        title: "验证失败",
        description: errorMessage,
        variant: "destructive"
      });
      // 确保关闭所有加载状态
      setImportState(prev => ({
        ...prev,
        isLoading: false,
        loadingDistribution: false,
        error: errorMessage
      }));
    }
  }, [classRoomId, toast]);

  // 处理确认导入
  const handleConfirmImport = async () => {
    if (!classRoomId) return;
    try {
      setImportState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      const {
        headers,
        rows,
        columnMapping,
        studentDistribution
      } = importState;

      // 调用批量导入函数
      const result = await importStudents(classRoomId, headers, rows, columnMapping, studentDistribution);
      if (result.success && result.data) {
        // 更新状态为导入完成
        setImportState(prev => ({
          ...prev,
          step: ImportStep.COMPLETE,
          isLoading: false,
          error: null,
          importResult: {
            newStudentsCount: result.data.newStudentsCount,
            addedStudentsCount: result.data.addedStudentsCount,
            totalStudentsCount: result.data.totalStudentsCount
          }
        }));
        toast({
          title: "导入成功",
          description: `成功导入 ${result.data.newStudentsCount + result.data.addedStudentsCount} 名学生`,
          variant: "default"
        });
      } else {
        setImportState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || "导入失败"
        }));
        toast({
          title: "导入失败",
          description: result.error || "导入学生数据失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "导入失败";
      setImportState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast({
        title: "导入失败",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // 处理文件选择
  const handleFileSelect = async file => {
    if (!classRoomId) return;
    setImportState(prev => setLoading(prev, true));
    const result = await handleFileUpload(file, classRoomId, toast, parseExcelFile);
    if (result.success && result.data) {
      setImportState(prev => setFileData(prev, result.data.file, result.data.headers, result.data.rows, result.data.filteredHeaderRows));
      // 自动进行列验证
      handleColumnValidationWrapper(result.data.headers, result.data.rows);
    } else {
      setImportState(prev => setError(prev, result.error || "文件处理失败"));
    }
  };

  // 处理文件移除
  const handleFileRemove = () => {
    setImportState(resetToSelectFile());
  };

  // 返回文件选择步骤
  const handleBackToFileSelect = () => {
    setImportState(resetToSelectFile());
  };

  // 自动进行下一步验证
  useEffect(() => {
    if (!classRoomId || importState.step !== ImportStep.VALIDATE_COLUMNS || importState.error || importState.headers.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      handleColumnValidationWrapper(importState.headers, importState.rows);
    }, 1000);
    return () => clearTimeout(timer);
  }, [classRoomId, importState.step, importState.error, importState.headers]);

  // 数据验证阶段的自动触发效果已移除，因为列验证成功后会自动进行数据验证
  // 这样可以避免重复验证和无限循环

  return {
    importState,
    isInitializing,
    permissionError,
    handleFileSelect,
    handleFileRemove,
    handleBackToFileSelect,
    handleConfirmImport
  };
}
