"use client";

// 学生搜索栏组件，用于搜索学生并选择科目查看学情数据
import { BookOpen, Search, User, UserSearch, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { searchStudentsAction } from "../componentsServerActions/studentSearchActions.js";
// 开发调试模式配置（修改此处可控制是否自动加载调试学生）
const DEV_AUTO_LOAD = false; // true: 自动加载调试学生，false: 生产环境模式
const DEV_STUDENT_CODE = "202009011207"; // 调试学生的学号
const DEV_SUBJECT = "物理"; // 调试科目

export default function StudentSearchBar({
  onSelectStudent,
  selectedStudent,
  selectedSubject
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tempSelectedStudent, setTempSelectedStudent] = useState(null);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  // 控制重新选择科目时的科目选择器显示
  const [showReselectSubjectSelector, setShowReselectSubjectSelector] = useState(false);
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();

  // 开发调试：自动加载调试学生
  useEffect(() => {
    if (DEV_AUTO_LOAD && !selectedStudent && !subjectsLoading) {
      const autoLoadDebugStudent = async () => {
        const result = await searchStudentsAction(DEV_STUDENT_CODE);
        if (result.success && result.data.length > 0) {
          const student = result.data[0];
          // 自动选择学生和科目
          onSelectStudent(student, DEV_SUBJECT);
        }
      };
      autoLoadDebugStudent();
    }
  }, [selectedStudent, subjectsLoading, onSelectStudent]);

  // 搜索学生
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        setIsSearching(true);
        const result = await searchStudentsAction(searchTerm);
        if (result.success) {
          setSearchResults(result.data);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(searchDebounce);
  }, [searchTerm]);
  const handleClickStudent = student => {
    setTempSelectedStudent(student);
    setShowSubjectSelector(true);
    setShowDropdown(false);
  };
  const handleSelectSubject = subject => {
    if (tempSelectedStudent) {
      onSelectStudent(tempSelectedStudent, subject);
      setSearchTerm("");
      setTempSelectedStudent(null);
      setShowSubjectSelector(false);
    }
  };

  // 处理重新选择科目时选中科目
  const handleReselectSubjectSelect = subject => {
    if (selectedStudent) {
      onSelectStudent(selectedStudent, subject);
      setShowReselectSubjectSelector(false);
    }
  };
  const handleClearSelection = () => {
    setSearchTerm("");
    setShowDropdown(false);
    setTempSelectedStudent(null);
    setShowSubjectSelector(false);
  };
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <UserSearch className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">学生查询</h2>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="输入学生姓名或编号..." value={searchTerm} onChange={e => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }} onFocus={() => setShowDropdown(true)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* 搜索结果下拉框 */}
        {showDropdown && searchTerm && <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {isSearching ? <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>搜索中...</p>
              </div> : searchResults.length > 0 ? searchResults.map(student => <button key={student._id} onClick={() => handleClickStudent(student)} className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">
                        学号：{student.studentCode}
                      </div>
                    </div>
                  </div>
                </button>) : <div className="px-4 py-8 text-center text-gray-500">
                未找到匹配的学生
              </div>}
          </div>}
      </div>

      {/* 科目选择器 */}
      {showSubjectSelector && tempSelectedStudent && <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">{tempSelectedStudent.name}</div>
                <div className="text-sm text-gray-600">
                  学号：{tempSelectedStudent.studentCode}
                </div>
              </div>
            </div>
            <button onClick={handleClearSelection} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="border-t border-amber-200 pt-3">
            <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              请选择要查看的科目：
            </p>
            {subjectsLoading ? <div className="text-center py-4 text-gray-500">
                加载科目列表...
              </div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {subjects.map(subject => <button key={subject.name} onClick={() => handleSelectSubject(subject.name)} className="px-4 py-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 hover:border-amber-400 transition-colors text-sm font-medium">
                    {subject.name}
                  </button>)}
              </div>}
          </div>
        </div>}

      {/* 已选中的学生和科目 - 非重新选择科目状态 */}
      {selectedStudent && selectedSubject && !showReselectSubjectSelector && <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧：学生信息 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg">{selectedStudent.name}</div>
                <div className="text-sm text-gray-600">
                  学号：{selectedStudent.studentCode}
                </div>
              </div>
            </div>

            {/* 中间：科目和说明 */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {selectedSubject}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                查看该学生在所有班级的数据
              </div>
            </div>

            {/* 右侧：选择科目按钮 */}
            <button onClick={() => {
          setShowReselectSubjectSelector(true);
        }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors flex-shrink-0">
              选择科目
            </button>
          </div>
        </div>}

      {/* 重新选择科目的科目选择器 */}
      {selectedStudent && showReselectSubjectSelector && <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">{selectedStudent.name}</div>
                <div className="text-sm text-gray-600">
                  学号：{selectedStudent.studentCode}
                </div>
              </div>
            </div>
            <button onClick={() => setShowReselectSubjectSelector(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="border-t border-amber-200 pt-3">
            <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              请选择要查看的科目：
            </p>
            {subjectsLoading ? <div className="text-center py-4 text-gray-500">
                加载科目列表...
              </div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {subjects.map(subject => <button key={subject.name} onClick={() => handleReselectSubjectSelect(subject.name)} className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${selectedSubject === subject.name ? "bg-amber-200 border-amber-400 text-amber-800" : "bg-white border-amber-300 hover:bg-amber-100 hover:border-amber-400"}`}>
                    {subject.name}
                  </button>)}
              </div>}
          </div>
        </div>}
    </div>;
}
