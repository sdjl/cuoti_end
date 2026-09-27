"use client";

import { GraduationCap, Search, X } from "lucide-react";
// 错题批量任务班级筛选器，支持学科和年级勾选搜素
import { useMemo, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
export default function ClassRoomSelector({
  classRooms,
  isLoading,
  selectedClassIds,
  onSelectionChange,
  selectedSubject,
  onSubjectChange
}) {
  const {
    subjects
  } = useSubjects();
  const [searchKeyword, setSearchKeyword] = useState("");

  // 过滤后的班级列表
  const filteredClassRooms = useMemo(() => {
    if (!searchKeyword.trim()) return classRooms;
    const keyword = searchKeyword.toLowerCase();
    return classRooms.filter(classRoom => classRoom.name.toLowerCase().includes(keyword));
  }, [classRooms, searchKeyword]);

  // 获取所有年级列表
  const grades = useMemo(() => {
    const gradeSet = new Set();
    filteredClassRooms.forEach(classRoom => {
      if (classRoom.grade) {
        gradeSet.add(classRoom.grade);
      }
    });
    return Array.from(gradeSet).sort();
  }, [filteredClassRooms]);

  // 获取每个年级的班级ID列表
  const gradeClassRoomIds = useMemo(() => {
    const map = {};
    filteredClassRooms.forEach(classRoom => {
      if (classRoom.grade) {
        if (!map[classRoom.grade]) {
          map[classRoom.grade] = [];
        }
        map[classRoom.grade].push(classRoom._id);
      }
    });
    return map;
  }, [filteredClassRooms]);

  // 计算年级的选中状态
  const getGradeCheckState = grade => {
    const gradeClassIds = gradeClassRoomIds[grade] || [];
    const selectedCount = gradeClassIds.filter(id => selectedClassIds.includes(id)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === gradeClassIds.length) return true;
    return "indeterminate";
  };

  // 处理班级选择
  const handleClassToggle = classId => {
    if (selectedClassIds.includes(classId)) {
      onSelectionChange(selectedClassIds.filter(id => id !== classId));
    } else {
      onSelectionChange([...selectedClassIds, classId]);
    }
  };

  // 处理年级选择
  const handleGradeToggle = grade => {
    const gradeClassIds = gradeClassRoomIds[grade] || [];
    const allSelected = gradeClassIds.every(id => selectedClassIds.includes(id));
    if (allSelected) {
      // 取消选择该年级的所有班级
      onSelectionChange(selectedClassIds.filter(id => !gradeClassIds.includes(id)));
    } else {
      // 选择该年级的所有班级
      const newSelectedIds = new Set([...selectedClassIds, ...gradeClassIds]);
      onSelectionChange(Array.from(newSelectedIds));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedClassIds.length === filteredClassRooms.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredClassRooms.map(c => c._id));
    }
  };
  if (isLoading) {
    return <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载班级数据中...</p>
        </CardContent>
      </Card>;
  }
  if (classRooms.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>选择班级</CardTitle>
          <CardDescription>
            选择需要生成错题集的班级，可以选择多个班级
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无班级数据</p>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>选择班级</CardTitle>
            <CardDescription>
              选择需要生成错题集的班级，可以选择多个班级
            </CardDescription>
          </div>
          <div className="text-sm text-gray-600">
            已选择{" "}
            <span className="font-medium text-gray-900">
              {selectedClassIds.length}
            </span>{" "}
            个班级
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 搜索框和科目选择 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="搜索班级名称..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} className="pl-9 pr-9" />
            {searchKeyword && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchKeyword("")}>
                <X className="h-4 w-4" />
              </Button>}
          </div>

          {/* 科目选择 */}
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => <Button key={subject.name} variant={selectedSubject === subject.name ? "default" : "outline"} size="sm" onClick={() => onSubjectChange(subject.name)}>
                {subject.name}
              </Button>)}
          </div>
        </div>

        {/* 全选和年级选择 */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox id="select-all" checked={filteredClassRooms.length > 0 && selectedClassIds.length === filteredClassRooms.length} onCheckedChange={handleSelectAll} />
            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              全选
            </Label>
          </div>

          {/* 年级选择（仅在没有搜索关键词时显示） */}
          {!searchKeyword && grades.map(grade => <div key={grade} className="flex items-center space-x-2">
                <Checkbox id={`grade-${grade}`} checked={getGradeCheckState(grade) === true} onCheckedChange={() => handleGradeToggle(grade)} />
                <Label htmlFor={`grade-${grade}`} className="text-sm font-medium cursor-pointer">
                  {grade}
                </Label>
              </div>)}
        </div>

        {/* 班级列表（按年级分组） */}
        <div className="space-y-4">
          {grades.map(grade => {
          const gradeClassRooms = filteredClassRooms.filter(c => c.grade === grade);
          if (gradeClassRooms.length === 0) return null;
          return <div key={grade}>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {grade}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gradeClassRooms.map(classRoom => <div key={classRoom._id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedClassIds.includes(classRoom._id) ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"}`} onClick={() => handleClassToggle(classRoom._id)}>
                      <Checkbox id={`class-${classRoom._id}`} checked={selectedClassIds.includes(classRoom._id)} onCheckedChange={() => handleClassToggle(classRoom._id)} onClick={e => e.stopPropagation()} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {classRoom.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          学生数：{classRoom.studentCount}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>;
        })}
        </div>

        {filteredClassRooms.length === 0 && <div className="text-center py-8">
            <p className="text-gray-500">未找到匹配的班级</p>
          </div>}
      </CardContent>
    </Card>;
}
