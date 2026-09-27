"use client";

/**
 * 班级选择器组件
 *
 * 依赖的 Server Action: app/(work)/work/dashboard/knowledge/componentsServerActions/classSelectorActions.ts
 */
import { BookOpen, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { getClassroomsWithGradesAction } from "../componentsServerActions/classSelectorActions.js";
// 开发调试配置：是否默认勾选所有班级
const DEV_AUTO_SELECT_ALL = false; // true: 默认全选，false: 需要手动选择

export default function ClassSelector({
  onSelectionChange
}) {
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();

  // 加载班级和年级数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getClassroomsWithGradesAction();
        setClasses(data.classrooms);
        setGrades(data.grades);

        // 如果开启了自动全选，则默认选中所有班级
        if (DEV_AUTO_SELECT_ALL && data.classrooms.length > 0) {
          const allClassIds = data.classrooms.map(cls => cls._id);
          setSelectedClassIds(allClassIds);
        }
      } catch (error) {
        console.error("加载班级数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 当科目列表加载完成后，默认选中第一个科目
  useEffect(() => {
    if (!subjectsLoading && subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name);
    }
  }, [subjects, subjectsLoading, selectedSubject]);

  // 当班级或科目选择变化时，通知父组件
  useEffect(() => {
    if (selectedClassIds.length > 0 && selectedSubject) {
      onSelectionChange(selectedClassIds, selectedSubject);
    }
  }, [selectedClassIds, selectedSubject, onSelectionChange]);
  const isSelected = classId => selectedClassIds.includes(classId);
  const onToggleClass = classId => {
    setSelectedClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  };

  // 按年级分组（使用配置的年级顺序）
  const groupedClasses = grades.reduce((acc, grade) => {
    const gradeClasses = classes.filter(cls => cls.grade === grade);
    if (gradeClasses.length > 0) {
      acc[grade] = gradeClasses;
    }
    return acc;
  }, {});

  // 查找没有年级或年级不在配置中的班级
  const classesWithoutGrade = classes.filter(cls => !cls.grade || !grades.includes(cls.grade));

  // 如果存在没有年级的班级，添加到 "暂无年级" 分组
  if (classesWithoutGrade.length > 0) {
    groupedClasses.暂无年级 = classesWithoutGrade;
  }

  // 全选所有班级
  const handleSelectAll = () => {
    if (selectedClassIds.length === classes.length) {
      // 如果已全选，则取消全选
      setSelectedClassIds([]);
    } else {
      // 选中所有班级
      const allClassIds = classes.map(cls => cls._id);
      setSelectedClassIds(allClassIds);
    }
  };

  // 全选某个年级的班级
  const handleSelectGrade = grade => {
    const gradeClasses = groupedClasses[grade];
    const allGradeSelected = gradeClasses.every(cls => isSelected(cls._id));
    if (allGradeSelected) {
      // 如果该年级已全选，则取消该年级的所有班级
      setSelectedClassIds(prev => prev.filter(id => !gradeClasses.some(cls => cls._id === id)));
    } else {
      // 选中该年级所有班级
      const gradeClassIds = gradeClasses.map(cls => cls._id);
      setSelectedClassIds(prev => {
        // 去重：已选中的保留，未选中的添加
        const newIds = gradeClassIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  // 判断某个年级是否全选
  const isGradeAllSelected = grade => {
    const gradeClasses = groupedClasses[grade];
    return gradeClasses?.every(cls => isSelected(cls._id));
  };
  if (isLoading) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">选择班级</h2>
        </div>
        <div className="text-center py-8 text-gray-500">加载班级数据中...</div>
      </div>;
  }
  if (classes.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">选择班级</h2>
        </div>
        <div className="text-center py-8 text-gray-500">暂无班级数据</div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">选择班级和科目</h2>
      </div>

      {/* 科目选择 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">科目</h3>
          </div>
          {subjectsLoading && <span className="text-xs text-gray-500">加载中...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {subjects.map(subject => <button key={subject.name} onClick={() => setSelectedSubject(subject.name)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSubject === subject.name ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {subject.name}
            </button>)}
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* 班级选择 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">班级</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            已选择 {selectedClassIds.length} 个班级
          </span>
          <button onClick={handleSelectAll} className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium">
            {selectedClassIds.length === classes.length ? "取消全选" : "全选"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedClasses).map(([grade, classList]) => <div key={grade}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{grade}</h3>
              <button onClick={() => handleSelectGrade(grade)} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium">
                {isGradeAllSelected(grade) ? `取消${grade}全选` : `${grade}全选`}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 max-w-full">
              {classList.map(cls => <div key={cls._id} onClick={() => onToggleClass(cls._id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer min-w-0 ${isSelected(cls._id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}>
                  <Checkbox checked={isSelected(cls._id)} onCheckedChange={() => onToggleClass(cls._id)} className="flex-shrink-0" />
                  <label className="font-medium text-gray-900 text-sm cursor-pointer flex-1 truncate">
                    {cls.name}
                  </label>
                </div>)}
            </div>
          </div>)}
      </div>

      {selectedClassIds.length === 0 && <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            请至少选择一个班级以查看数据统计
          </p>
        </div>}
    </div>;
}
