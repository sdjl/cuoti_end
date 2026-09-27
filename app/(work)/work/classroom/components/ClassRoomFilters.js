"use client";

// 班级管理页顶部筛选区域，负责搜索与年级、状态切换交互
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Input } from "../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.js";
import { getCurrentSchoolGrades } from "../../../../../lib/work/teacher/mySchool.js";
import { searchStudentSuggestionsAction } from "../actions.js";
export default function ClassRoomFilters({
  studentSearchTerm,
  setStudentSearchTerm,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedGrade,
  setSelectedGrade,
  onReset
}) {
  const [localStudentSearchTerm, setLocalStudentSearchTerm] = useState(studentSearchTerm);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [grades, setGrades] = useState([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // 学生建议相关状态
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const studentInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 同步外部的 studentSearchTerm 变化到本地状态
  useEffect(() => {
    setLocalStudentSearchTerm(studentSearchTerm);
  }, [studentSearchTerm]);

  // 同步外部的 searchTerm 变化到本地状态
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 加载年级列表
  useEffect(() => {
    const loadGrades = async () => {
      setIsLoadingGrades(true);
      try {
        const gradeList = await getCurrentSchoolGrades();
        setGrades(gradeList);
      } catch (error) {
        console.error("加载年级列表失败:", error);
      } finally {
        setIsLoadingGrades(false);
      }
    };
    loadGrades();
  }, []);

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = event => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && studentInputRef.current && !studentInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理学生搜索输入变化
  const handleStudentInputChange = useCallback(async value => {
    setLocalStudentSearchTerm(value);
    if (value.trim().length >= 1) {
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await searchStudentSuggestionsAction(value);
        setStudentSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("搜索学生建议失败:", error);
        setStudentSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // 选择学生建议
  const handleSelectStudent = useCallback(studentName => {
    setLocalStudentSearchTerm(studentName);
    setShowSuggestions(false);
  }, []);

  // 处理学生搜索
  const handleStudentSearch = useCallback(() => {
    setStudentSearchTerm(localStudentSearchTerm);
  }, [localStudentSearchTerm, setStudentSearchTerm]);

  // 处理班级搜索
  const handleClassSearch = useCallback(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm, setSearchTerm]);

  // 处理回车搜索
  const handleStudentKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleStudentSearch();
      setShowSuggestions(false);
    }
  }, [handleStudentSearch]);
  const handleClassKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleClassSearch();
    }
  }, [handleClassSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalStudentSearchTerm("");
    setLocalSearchTerm("");
    setStudentSuggestions([]);
    setShowSuggestions(false);
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 学生姓名搜索框 */}
        <div className="relative flex-shrink-0" style={{
        width: "240px"
      }}>
          <div className="flex gap-2">
            <Input ref={studentInputRef} placeholder="搜索学生..." value={localStudentSearchTerm} onChange={e => handleStudentInputChange(e.target.value)} onKeyPress={handleStudentKeyPress} onFocus={() => {
            if (studentSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }} className="flex-1" />
            <Button onClick={handleStudentSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 学生建议下拉列表 */}
          {showSuggestions && <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {isLoadingSuggestions ? <div className="px-3 py-2 text-sm text-gray-500">加载中...</div> : studentSuggestions.map(student => <div key={student._id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectStudent(student.name)}>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      编号: {student.studentCode}
                    </div>
                  </div>)}
            </div>}
        </div>

        {/* 班级搜索框 */}
        <div className="flex gap-2 flex-1 min-w-[240px]">
          <Input placeholder="搜索班级..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleClassKeyPress} className="flex-1" />
          <Button onClick={handleClassSearch} size="default" className="px-3">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* 年级筛选 */}
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="年级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部年级</SelectItem>
            {isLoadingGrades ? <SelectItem value="loading" disabled>
                加载中...
              </SelectItem> : grades.filter(grade => grade && grade.trim() !== "").map(grade => <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>)}
          </SelectContent>
        </Select>

        {/* 状态筛选 */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="正常">正常</SelectItem>
            <SelectItem value="毕业">毕业</SelectItem>
            <SelectItem value="停用">停用</SelectItem>
          </SelectContent>
        </Select>

        {/* 重置按钮 */}
        <Button variant="outline" onClick={handleReset} className="px-3">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>;
}
