"use client";

/**
 * 客户端文件处理函数
 */

/**
 * 验证文件是否为有效的Excel文件
 */
export function validateExcelFile(file) {
  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // .xlsx
  "application/vnd.ms-excel" // .xls
  ];
  const allowedExtensions = [".xlsx", ".xls"];

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    // 如果MIME类型检查失败，再检查文件扩展名
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        error: "请上传Excel文件(.xlsx或.xls格式)"
      };
    }
  }

  // 检查文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "文件大小不能超过10MB"
    };
  }
  return {
    valid: true
  };
}

/**
 * 创建FormData对象
 */
export function createFileFormData(file) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 导入步骤枚举
 */
export let ImportStep = /*#__PURE__*/function (ImportStep) {
  ImportStep["SELECT_FILE"] = "select_file";
  ImportStep["VALIDATE_COLUMNS"] = "validate_columns";
  ImportStep["VALIDATE_DATA"] = "validate_data";
  ImportStep["COMPLETE"] = "complete";
  return ImportStep;
}({});

/**
 * 导入状态接口
 */

/**
 * 初始导入状态
 */
export const initialImportState = {
  step: ImportStep.SELECT_FILE,
  file: null,
  headers: [],
  rows: [],
  columnMapping: {},
  validationErrors: [],
  isLoading: false,
  error: null,
  missingColumns: [],
  requiredColumns: [],
  currentColumns: [],
  filteredHeaderRows: 0,
  studentDistribution: {
    notInSchool: [],
    inSchoolNotInClass: [],
    inSchoolAndInClass: [],
    notInSchoolWithNames: []
  },
  loadingDistribution: false,
  importResult: undefined
};

/**
 * 导入状态更新函数类型
 */

/**
 * 通用状态更新函数 - 减少重复代码
 */
function updateState(state, updates) {
  return {
    ...state,
    ...updates
  };
}

/**
 * 重置导入状态到选择文件步骤
 */
export function resetToSelectFile() {
  return updateState(initialImportState, {
    step: ImportStep.SELECT_FILE
  });
}

/**
 * 设置加载状态
 */
export function setLoading(state, isLoading) {
  return updateState(state, {
    isLoading,
    error: null
  });
}

/**
 * 设置错误状态
 */
export function setError(state, error) {
  return updateState(state, {
    error,
    isLoading: false
  });
}

/**
 * 设置文件和解析结果
 */
export function setFileData(state, file, headers, rows, filteredHeaderRows) {
  return updateState(state, {
    file,
    headers,
    rows,
    filteredHeaderRows,
    step: ImportStep.VALIDATE_COLUMNS,
    isLoading: false,
    error: null
  });
}

/**
 * 设置列验证失败结果
 */
export function setColumnValidationError(state, missingColumns, requiredColumns, currentColumns) {
  return updateState(state, {
    missingColumns,
    requiredColumns,
    currentColumns,
    isLoading: false,
    error: "缺少必要的列"
  });
}

/**
 * 设置列验证成功结果
 */
export function setColumnValidationSuccess(state, columnMapping) {
  return updateState(state, {
    columnMapping,
    step: ImportStep.VALIDATE_DATA,
    isLoading: false,
    error: null
  });
}

/**
 * 设置数据验证失败结果
 */
export function setDataValidationError(state, validationErrors) {
  return updateState(state, {
    validationErrors,
    isLoading: false,
    error: "数据验证失败"
  });
}

/**
 * 设置数据验证成功结果
 */
export function setDataValidationSuccess(state) {
  return updateState(state, {
    step: ImportStep.VALIDATE_DATA,
    isLoading: false,
    error: null,
    validationErrors: [],
    loadingDistribution: true
  });
}

/**
 * 设置学生分布状态
 */
export function setStudentDistribution(state, distribution) {
  // 确保分布数据是有效的对象
  if (!distribution || typeof distribution !== "object") {
    return {
      ...state,
      loadingDistribution: false,
      error: "分布数据无效"
    };
  }

  // 确保所有必要的字段都存在
  const {
    notInSchool = [],
    inSchoolNotInClass = [],
    inSchoolAndInClass = [],
    notInSchoolWithNames = []
  } = distribution;
  return updateState(state, {
    studentDistribution: {
      notInSchool,
      inSchoolNotInClass,
      inSchoolAndInClass,
      notInSchoolWithNames
    },
    loadingDistribution: false
  });
}

/**
 * Toast 消息处理函数
 */

/**
 * 处理文件验证和上传
 */
export async function handleFileUpload(file, classRoomId, toast, parseExcelFile) {
  // 验证文件
  const validation = validateExcelFile(file);
  if (!validation.valid) {
    toast({
      title: "文件验证失败",
      description: validation.error || "文件验证失败",
      variant: "destructive"
    });
    return {
      success: false,
      error: validation.error
    };
  }
  try {
    // 解析文件
    const formData = createFileFormData(file);
    const result = await parseExcelFile(classRoomId, formData);
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          file,
          headers: result.data.headers,
          rows: result.data.rows,
          filteredHeaderRows: result.data.filteredHeaderRows
        }
      };
    } else {
      const errorMessage = result.error || "文件解析失败";
      toast({
        title: "文件解析失败",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "文件解析失败";
    toast({
      title: "文件解析失败",
      description: errorMessage,
      variant: "destructive"
    });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 处理列验证
 */
export async function handleColumnValidation(headers, classRoomId, toast, validateExcelColumns) {
  try {
    const result = await validateExcelColumns(classRoomId, headers);
    if (result.success && result.data) {
      return {
        success: true,
        data: {
          columnMapping: result.data.columnMapping
        }
      };
    } else {
      if (result.missingColumns && result.missingColumns.length > 0) {
        toast({
          title: "列验证失败",
          description: `缺少必要的列: ${result.missingColumns.join(", ")}`,
          variant: "destructive"
        });
      }
      return {
        success: false,
        missingColumns: result.missingColumns,
        requiredColumns: result.requiredColumns,
        currentColumns: result.currentColumns,
        error: result.error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "列验证失败";
    toast({
      title: "列验证失败",
      description: errorMessage,
      variant: "destructive"
    });
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 处理数据验证
 */
export async function handleDataValidation(headers, rows, columnMapping, classRoomId, toast, validateExcelData) {
  try {
    const result = await validateExcelData(classRoomId, headers, rows, columnMapping);
    if (result.success) {
      toast({
        title: "验证完成",
        description: `${result.validRowCount} 条记录验证通过`,
        variant: "default"
      });
      return {
        success: true,
        validRowCount: result.validRowCount
      };
    } else {
      // 不再使用toast显示数据验证错误，由组件展示详细错误信息
      return {
        success: false,
        validationErrors: result.validationErrors,
        error: result.error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "数据验证失败";
    toast({
      title: "数据验证失败",
      description: errorMessage,
      variant: "destructive"
    });
    return {
      success: false,
      error: errorMessage
    };
  }
}
