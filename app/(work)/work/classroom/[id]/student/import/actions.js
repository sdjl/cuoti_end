"use server";

import * as XLSX from "xlsx";
import { updateClassRoomStudentCount } from "../../../../../../../lib/collection/classroom.js";
import { getCurrentSchoolFromJWT } from "../../../../../../../lib/work/principal/mySchool.js";
import { assertClassRoomOwnership } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolFromDB } from "../../../../../../../lib/work/teacher/mySchool.js";
import { addStudentToMyClassBatch, checkStudentCodesDistribution, createMyStudentBatch, getClassStudents } from "../../../../../../../lib/work/teacher/myStudent.js";
import { getSchoolDocFromDB } from "./datas.js";


function isEmptyRow(row) {
  // 如果列数为0，直接判断为空行
  if (row.length === 0) {
    return true;
  }

  // 检查所有单元格是否都为空
  return row.every(cell => {
    if (cell === null || cell === undefined) {
      return true;
    }
    const cellStr = String(cell).trim();
    return cellStr === "" || cellStr === "null" || cellStr === "undefined";
  });
}


function filterUselessRows(jsonData, expectedColumnCount) {
  if (jsonData.length === 0) {
    return {
      success: false,
      error: "数据为空"
    };
  }

  // 使用传入的期望列数作为标准列数
  const standardColumnCount = expectedColumnCount;
  if (standardColumnCount === 0) {
    return {
      success: false,
      error: "无法确定表格的标准列数"
    };
  }

  // 找出开头连续的无用行（只过滤列数不够的行，不过滤空行）
  let filteredHeaderRowsCount = 0;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];

    // 如果当前行不是空行，但列数小于标准列数，说明可能存在合并单元格
    if (!isEmptyRow(row) && row.length < standardColumnCount) {
      // 必须是连续的无用行（从第1行开始）
      if (i === filteredHeaderRowsCount) {
        filteredHeaderRowsCount++;
      } else {
        // 如果不是连续的，说明表格格式有问题
        return {
          success: false,
          error: `表格格式错误：第${i + 1}行列数不正确，期望${standardColumnCount}列，实际${row.length}列`
        };
      }
    } else {
      // 找到第一个标准行或空行后就停止（空行保留，不算表头过滤行）
      break;
    }
  }

  // 找到末尾连续的空行数量
  let trailingEmptyRows = 0;
  for (let i = jsonData.length - 1; i >= 0; i--) {
    const row = jsonData[i];
    if (isEmptyRow(row)) {
      trailingEmptyRows++;
    } else {
      break;
    }
  }

  // 过滤掉开头的无用行和末尾的空行，保留中间的所有行（包括空行）
  const startIndex = filteredHeaderRowsCount;
  const endIndex = jsonData.length - trailingEmptyRows;
  if (startIndex >= endIndex) {
    return {
      success: false,
      error: "Excel文件中没有有效数据"
    };
  }
  const filteredData = jsonData.slice(startIndex, endIndex);
  if (filteredData.length === 0) {
    return {
      success: false,
      error: "过滤后没有有效数据"
    };
  }

  // 不在这里验证列数一致性，因为数据标准化会在后面进行
  return {
    success: true,
    data: filteredData,
    filteredHeaderRows: filteredHeaderRowsCount
  };
}

/**
 * 获取当前校园的表格列配置
 */
export async function getTableColumnsConfig(classRoomId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);

    // 获取当前校园信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      return {
        success: false,
        error: "请先选择要管理的校园"
      };
    }

    // 获取表格列配置
    const tableColumns = currentSchool.config?.importStudentData?.tableColumns;
    if (!tableColumns || Object.keys(tableColumns).length === 0) {
      return {
        success: false,
        error: "校园尚未配置学生导入表格列映射"
      };
    }
    return {
      success: true,
      data: {
        tableColumns,
        schoolName: currentSchool.name
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取配置失败"
    };
  }
}
export async function validateImportPermissions(classRoomId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);

    // 获取当前校园信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      return {
        success: false,
        error: "请先选择要管理的校园"
      };
    }

    // 检查校园配置
    const tableColumns = currentSchool.config?.importStudentData?.tableColumns;

    // 检查配置是否存在
    if (!tableColumns || Object.keys(tableColumns).length === 0) {
      return {
        success: false,
        error: "校园尚未配置学生导入表格列映射，请先完成配置"
      };
    }

    // 检查必须的配置项：学号和姓名
    const requiredFields = ["studentCode", "name"];
    const missingRequiredFields = [];
    for (const field of requiredFields) {
      if (!tableColumns[field] || tableColumns[field].trim() === "") {
        missingRequiredFields.push(field === "studentCode" ? "学号" : "姓名");
      }
    }
    if (missingRequiredFields.length > 0) {
      return {
        success: false,
        error: `缺少必要的导入配置：${missingRequiredFields.join(", ")}`
      };
    }
    return {
      success: true,
      data: {
        schoolId: currentSchool._id,
        schoolName: currentSchool.name,
        tableColumns: tableColumns
      }
    };
  } catch (error) {
    // 如果是权限错误，返回错误信息
    if (error instanceof Error && error.message.includes("权限")) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "验证权限失败"
    };
  }
}

/**
 * 读取并解析Excel文件内容
 */
export async function parseExcelFile(classRoomId, formData) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    const file = formData.get("file");
    if (!file) {
      return {
        success: false,
        error: "请选择要上传的Excel文件"
      };
    }

    // 检查文件类型
    const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // .xlsx
    "application/vnd.ms-excel" // .xls
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "请上传Excel文件(.xlsx或.xls格式)"
      };
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 将工作表转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1
    });
    if (jsonData.length === 0) {
      return {
        success: false,
        error: "Excel文件为空"
      };
    }

    // 先找到最大列数，用于过滤合并单元格行
    const maxColumnCount = Math.max(...jsonData.map(row => row.length));

    // 过滤开头的无用行（可能存在合并单元格）
    const filteredData = filterUselessRows(jsonData, maxColumnCount);
    if (!filteredData.success || !filteredData.data) {
      return {
        success: false,
        error: filteredData.error || "过滤数据失败"
      };
    }

    // 获取从开头连续过滤的表头行数
    const filteredHeaderRows = filteredData.filteredHeaderRows || 0;

    // 对过滤后的有效数据进行列数标准化
    const validData = filteredData.data.map(row => {
      const normalizedRow = [...row];
      while (normalizedRow.length < maxColumnCount) {
        normalizedRow.push(null);
      }
      return normalizedRow;
    });
    if (validData.length === 0) {
      return {
        success: false,
        error: "Excel文件没有有效数据"
      };
    }
    const headers = validData[0];
    const rows = validData.slice(1);
    if (headers.length === 0) {
      return {
        success: false,
        error: "Excel文件没有表头"
      };
    }
    return {
      success: true,
      data: {
        headers,
        rows,
        totalRows: rows.length,
        filteredHeaderRows
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "解析Excel文件失败"
    };
  }
}

/**
 * 验证Excel文件列是否符合校园配置
 */
export async function validateExcelColumns(classRoomId, headers) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);

    // 获取当前校园信息
    const currentSchool = await getCurrentSchoolFromJWT();
    if (!currentSchool) {
      return {
        success: false,
        error: "请先选择要管理的校园"
      };
    }

    // 获取校园配置
    const schoolDoc = await getSchoolDocFromDB(currentSchool._id);
    if (!schoolDoc) {
      return {
        success: false,
        error: "校园信息不存在"
      };
    }

    // 获取表列配置
    const tableColumns = schoolDoc.config?.importStudentData?.tableColumns;

    // 检查配置是否存在
    if (!tableColumns || Object.keys(tableColumns).length === 0) {
      return {
        success: false,
        error: "校园尚未配置学生导入表格列映射，请先完成配置"
      };
    }

    // 检查必须列（只有配置了值且值不为空的列才是必需的）
    const missingColumns = [];
    const requiredColumnValues = [];

    // 过滤出配置了值且值不为空的列
    for (const [, columnName] of Object.entries(tableColumns)) {
      if (columnName && columnName.trim() !== "") {
        requiredColumnValues.push(columnName);
        if (!headers.includes(columnName)) {
          missingColumns.push(columnName);
        }
      }
    }
    if (missingColumns.length > 0) {
      return {
        success: false,
        error: "缺少必要的列",
        missingColumns,
        requiredColumns: requiredColumnValues,
        currentColumns: headers
      };
    }

    // 返回列映射关系
    const columnMapping = {};
    for (const [field, columnName] of Object.entries(tableColumns)) {
      if (headers.includes(columnName)) {
        columnMapping[field] = columnName;
      }
    }
    return {
      success: true,
      data: {
        columnMapping,
        requiredColumns: requiredColumnValues
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "验证Excel列失败"
    };
  }
}

/**
 * 验证Excel数据完整性
 */
export async function validateExcelData(classRoomId, headers, rows, columnMapping) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    const errors = [];

    // 获取必要字段的列索引
    const studentCodeIndex = headers.indexOf(columnMapping.studentCode);
    const nameIndex = headers.indexOf(columnMapping.name);
    if (studentCodeIndex === -1 || nameIndex === -1) {
      return {
        success: false,
        error: "无法找到学生编号或姓名列"
      };
    }

    // 记录学生编号及其首次出现的行号
    const studentCodeMap = {};

    // 验证每一行数据
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel行号（从1开始，加上表头行）

      // 验证学生编号
      const studentCode = row[studentCodeIndex];
      if (!studentCode || String(studentCode).trim() === "") {
        errors.push({
          row: rowNumber,
          field: "studentCode",
          message: "学生编号不能为空"
        });
      } else {
        const codeStr = String(studentCode).trim();
        if (studentCodeMap[codeStr]) {
          // 重复编号，只标记当前行为错误（不标记第一次出现的行）
          errors.push({
            row: rowNumber,
            field: "studentCode",
            message: `学生编号重复，与 ${codeStr} 重复: `
          });
        } else {
          // 第一次出现，记录行号
          studentCodeMap[codeStr] = rowNumber;
        }
      }

      // 验证姓名
      const name = row[nameIndex];
      if (!name || String(name).trim() === "") {
        errors.push({
          row: rowNumber,
          field: "name",
          message: "姓名不能为空"
        });
      }
    }
    if (errors.length > 0) {
      return {
        success: false,
        error: "数据验证失败",
        validationErrors: errors
      };
    }
    return {
      success: true,
      message: "数据验证通过",
      validRowCount: rows.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "验证Excel数据失败"
    };
  }
}

/**
 * 检查学生编号分布情况
 */
export async function checkStudentDistribution(classRoomId, headers, rows, columnMapping) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);

    // 获取学生编号和姓名列索引
    const studentCodeIndex = headers.indexOf(columnMapping.studentCode);
    const nameIndex = headers.indexOf(columnMapping.name);
    if (studentCodeIndex === -1) {
      return {
        success: false,
        error: "无法找到学生编号列"
      };
    }
    if (nameIndex === -1) {
      return {
        success: false,
        error: "无法找到学生姓名列"
      };
    }

    // 创建学生编号和姓名的映射关系
    const studentMap = {};
    rows.forEach(row => {
      const code = String(row[studentCodeIndex]).trim();
      const name = String(row[nameIndex]).trim();
      if (code) {
        studentMap[code] = {
          code,
          name
        };
      }
    });

    // 提取所有学生编号
    const studentCodes = Object.keys(studentMap);
    if (studentCodes.length === 0) {
      return {
        success: false,
        error: "没有有效的学生编号"
      };
    }

    // 检查学生编号分布
    const distribution = await checkStudentCodesDistribution(classRoomId, studentCodes);

    // 确保返回的数据结构正确
    if (!distribution) {
      return {
        success: false,
        error: "分布数据为空"
      };
    }

    // 扩展返回数据，为不在学校的学生添加姓名信息
    const notInSchoolWithNames = distribution.notInSchool.map(code => ({
      code,
      name: studentMap[code]?.name || "未知"
    }));
    return {
      success: true,
      data: {
        ...distribution,
        notInSchoolWithNames
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "检查学生分布失败"
    };
  }
}

/**
 * 批量导入学生数据
 */
export async function importStudents(classRoomId, headers, rows, columnMapping, studentDistribution) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);

    // 获取学生编号和姓名列索引
    const studentCodeIndex = headers.indexOf(columnMapping.studentCode);
    const nameIndex = headers.indexOf(columnMapping.name);
    if (studentCodeIndex === -1 || nameIndex === -1) {
      return {
        success: false,
        error: "无法找到学生编号或姓名列"
      };
    }

    // 创建列映射表，将字段名映射到Excel表格列索引
    const fieldToIndexMap = new Map();
    Object.entries(columnMapping).forEach(([fieldName, columnName]) => {
      const index = headers.indexOf(columnName);
      if (index !== -1) {
        fieldToIndexMap.set(fieldName, index);
      }
    });

    // 为学生代码创建映射到行数据的字典
    const studentCodeToRowMap = new Map();
    rows.forEach(row => {
      const code = String(row[studentCodeIndex]).trim();
      if (code) {
        studentCodeToRowMap.set(code, row);
      }
    });

    // 统计导入结果
    let newStudentsCount = 0;
    let addedStudentsCount = 0;

    // 处理不在校园中的学生 - 使用 createMyStudentBatch 创建并添加到班级
    if (studentDistribution.notInSchool.length > 0) {
      // 准备创建学生的数据
      const studentsToCreate = studentDistribution.notInSchool.map(code => {
        // 获取该学生的Excel行数据
        const rowData = studentCodeToRowMap.get(code) || [];

        // 创建学生基本数据，包含默认值
        const studentData = {
          studentCode: code,
          name: "",
          gender: "未知",
          birthDate: "",
          ethnicity: "",
          homeAddress: ""
        };

        // 从Excel行数据中读取所有已配置的字段
        fieldToIndexMap.forEach((columnIndex, fieldName) => {
          if (columnIndex < rowData.length && rowData[columnIndex] !== null && rowData[columnIndex] !== undefined) {
            const value = String(rowData[columnIndex]).trim();
            if (value) {
              // 特殊处理性别字段，确保值合法
              if (fieldName === "gender") {
                if (value === "男" || value === "女") {
                  studentData[fieldName] = value;
                }
                // 其他值保持默认的"未知"
              } else if (fieldName === "contactPhones") {
                // 特殊处理联系电话字段，支持空格或逗号分隔
                const phones = value.split(/[,\s]+/) // 按逗号或空格分割
                .map(phone => phone.trim()).filter(phone => phone.length > 0);
                if (phones.length > 0) {
                  studentData[fieldName] = phones;
                }
              } else {
                studentData[fieldName] = value;
              }
            }
          }
        });

        // 确保至少有名字字段（以防数据不完整）
        if (!studentData.name && nameIndex !== -1 && nameIndex < rowData.length) {
          studentData.name = String(rowData[nameIndex] || "").trim();
        }
        return studentData;
      });

      // 批量创建学生并添加到班级
      const createResult = await createMyStudentBatch(classRoomId, studentsToCreate);
      newStudentsCount = createResult.added.length;
    }

    // 处理在校园中但不在班级中的学生 - 使用 addStudentToMyClassBatch 添加到班级
    if (studentDistribution.inSchoolNotInClass.length > 0) {
      // 提取学生ID
      const studentIds = studentDistribution.inSchoolNotInClass.map(student => student._id);

      // 批量添加学生到班级
      const addResult = await addStudentToMyClassBatch(studentIds, classRoomId);
      addedStudentsCount = addResult.length;
    }

    // 获取班级当前总学生数量
    const classStudents = await getClassStudents(classRoomId);
    const totalStudentsCount = classStudents.length;

    // 更新班级学生数量缓存
    await updateClassRoomStudentCount(classRoomId);

    // 返回导入结果
    return {
      success: true,
      data: {
        newStudentsCount,
        addedStudentsCount,
        totalStudentsCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "批量导入学生失败"
    };
  }
}
