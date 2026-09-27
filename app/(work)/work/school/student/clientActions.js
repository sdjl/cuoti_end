"use client";

/**
 * 客户端学生数据过滤和排序函数
 */

/**
 * 过滤和排序学生数据（在前端执行）
 */
export function filterAndSortStudents(allStudents, searchTerm, selectedGender, selectedSortBy, selectedSortOrder) {
  let filteredStudents = [...allStudents];

  // 性别过滤
  if (selectedGender !== "all") {
    filteredStudents = filteredStudents.filter(student => student.gender === selectedGender);
  }

  // 关键词搜索
  if (searchTerm.trim()) {
    const keyword = searchTerm.trim().toLowerCase();
    filteredStudents = filteredStudents.filter(student => {
      return student.studentCode.toLowerCase().includes(keyword) || student.name.toLowerCase().includes(keyword) || student.ethnicity.toLowerCase().includes(keyword) || student.homeAddress.toLowerCase().includes(keyword) || student.notes?.toLowerCase().includes(keyword);
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
      case "gender":
        aValue = a.gender;
        bValue = b.gender;
        break;
      case "birthDate":
        aValue = a.birthDate || "";
        bValue = b.birthDate || "";
        break;
      case "ethnicity":
        aValue = a.ethnicity;
        bValue = b.ethnicity;
        break;
      case "homeAddress":
        aValue = a.homeAddress;
        bValue = b.homeAddress;
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
