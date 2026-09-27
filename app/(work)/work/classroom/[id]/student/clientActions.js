"use client";

/**
 * 客户端学生数据过滤和排序函数
 */

/**
 * 过滤学生数据（在前端执行）
 */
export function filterStudents(allStudents, searchTerm, selectedGender, selectedStatus, selectedNotesFilter, selectedSortBy, selectedSortOrder) {
  let filteredStudents = [...allStudents];

  // 性别过滤
  if (selectedGender !== "all") {
    filteredStudents = filteredStudents.filter(student => student.gender === selectedGender);
  }

  // 状态过滤
  if (selectedStatus !== "all") {
    filteredStudents = filteredStudents.filter(student => student.studentClass.status === selectedStatus);
  }

  // 关键词搜索
  if (searchTerm.trim()) {
    const keyword = searchTerm.trim().toLowerCase();
    filteredStudents = filteredStudents.filter(student => {
      return student.studentCode.toLowerCase().includes(keyword) || student.name.toLowerCase().includes(keyword) || student.ethnicity.toLowerCase().includes(keyword) || student.homeAddress.toLowerCase().includes(keyword) || student.notes?.toLowerCase().includes(keyword) || student.studentClass.notes?.toLowerCase().includes(keyword);
    });
  }

  // 备注筛选
  if (selectedNotesFilter !== "all") {
    filteredStudents = filteredStudents.filter(student => {
      const hasStudentNotes = student.notes && student.notes.trim() !== "";
      const hasClassNotes = student.studentClass.notes && student.studentClass.notes.trim() !== "";
      switch (selectedNotesFilter) {
        case "student_notes":
          return hasStudentNotes;
        case "class_notes":
          return hasClassNotes;
        case "any_notes":
          return hasStudentNotes || hasClassNotes;
        case "no_notes":
          return !hasStudentNotes && !hasClassNotes;
        default:
          return true;
      }
    });
  }

  // 排序
  filteredStudents.sort((a, b) => {
    let aValue;
    let bValue;
    switch (selectedSortBy) {
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
      case "birthDate":
        aValue = a.birthDate || "";
        bValue = b.birthDate || "";
        break;
      case "ethnicity":
        aValue = a.ethnicity;
        bValue = b.ethnicity;
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

    // 处理数字比较
    if (aValue < bValue) return selectedSortOrder === "desc" ? 1 : -1;
    if (aValue > bValue) return selectedSortOrder === "desc" ? -1 : 1;
    return 0;
  });
  return filteredStudents;
}
