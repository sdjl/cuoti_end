"use client";

/**
 * 客户端学生数据过滤和排序函数（用于答卷提交）
 */

/**
 * 过滤学生数据（在前端执行）
 */
export function filterStudents(allStudents, searchTerm, selectedGender, selectedStatus, selectedSubmitStatus, selectedSortBy, selectedSortOrder) {
  let filteredStudents = [...allStudents];

  // 性别过滤
  if (selectedGender !== "all") {
    filteredStudents = filteredStudents.filter(student => student.gender === selectedGender);
  }

  // 状态过滤
  if (selectedStatus !== "all") {
    filteredStudents = filteredStudents.filter(student => student.studentClass.status === selectedStatus);
  }

  // 提交状态过滤
  if (selectedSubmitStatus !== "all") {
    filteredStudents = filteredStudents.filter(student => {
      if (selectedSubmitStatus === "submitted") {
        return student.hasSubmitted === true;
      } else if (selectedSubmitStatus === "notSubmitted") {
        return student.hasSubmitted !== true;
      }
      return true;
    });
  }

  // 关键词搜索
  if (searchTerm.trim()) {
    const keyword = searchTerm.trim().toLowerCase();
    filteredStudents = filteredStudents.filter(student => {
      return student.studentCode.toLowerCase().includes(keyword) || student.name.toLowerCase().includes(keyword) || student.notes?.toLowerCase().includes(keyword) || student.studentClass.notes?.toLowerCase().includes(keyword);
    });
  }

  // 排序
  filteredStudents.sort((a, b) => {
    let aValue;
    let bValue;
    switch (selectedSortBy) {
      case "correctRate":
        // 正确率排序：未提交的学生排在最后，已提交的按正确率排序
        if (!a.hasSubmitted && !b.hasSubmitted) return 0;
        if (!a.hasSubmitted) return 1;
        if (!b.hasSubmitted) return -1;
        aValue = a.correctRate ?? 0;
        bValue = b.correctRate ?? 0;
        break;
      case "studentCode":
        aValue = a.studentCode;
        bValue = b.studentCode;
        break;
      case "score":
        aValue = a.growthData?.score ?? 0;
        bValue = b.growthData?.score ?? 0;
        break;
      case "gender":
        aValue = a.gender;
        bValue = b.gender;
        break;
      case "status":
        aValue = a.studentClass.status;
        bValue = b.studentClass.status;
        break;
      case "submitStatus":
        aValue = a.hasSubmitted === true ? 1 : 0;
        bValue = b.hasSubmitted === true ? 1 : 0;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
        break;
    }

    // 处理字符串比较
    if (typeof aValue === "string" && typeof bValue === "string") {
      const result = aValue.localeCompare(bValue);
      return selectedSortOrder === "desc" ? -result : result;
    }

    // 处理数字和布尔值比较
    if (aValue < bValue) return selectedSortOrder === "desc" ? 1 : -1;
    if (aValue > bValue) return selectedSortOrder === "desc" ? -1 : 1;
    return 0;
  });
  return filteredStudents;
}
