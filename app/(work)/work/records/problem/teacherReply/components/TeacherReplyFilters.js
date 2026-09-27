"use client";

// 自主上传错题老师帮助页面的过滤器组件，提供学生编号、姓名、班级、是否需要帮助和掌握情况等筛选条件
import { RotateCcw, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function TeacherReplyFilters({
  studentCode,
  setStudentCode,
  studentName,
  setStudentName,
  isNeedTeacherReply,
  setIsNeedTeacherReply,
  classId,
  setClassId,
  isStudentMaster,
  setIsStudentMaster,
  classOptions,
  onReset
}) {
  const [localStudentCode, setLocalStudentCode] = useState(studentCode);
  const [localStudentName, setLocalStudentName] = useState(studentName);
  const [localIsNeedTeacherReply, setLocalIsNeedTeacherReply] = useState(isNeedTeacherReply);
  const [localClassId, setLocalClassId] = useState(classId);
  const [localIsStudentMaster, setLocalIsStudentMaster] = useState(isStudentMaster);
  const handleSearch = useCallback(() => {
    setStudentCode(localStudentCode);
    setStudentName(localStudentName);
    setIsNeedTeacherReply(localIsNeedTeacherReply);
    setClassId(localClassId);
    setIsStudentMaster(localIsStudentMaster);
  }, [localStudentCode, localStudentName, localIsNeedTeacherReply, localClassId, localIsStudentMaster, setStudentCode, setStudentName, setIsNeedTeacherReply, setClassId, setIsStudentMaster]);
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);
  const handleReset = useCallback(() => {
    setLocalStudentCode("");
    setLocalStudentName("");
    setLocalIsNeedTeacherReply("need");
    setLocalClassId("all");
    setLocalIsStudentMaster("all");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
        {/* 学生信息 + 班级过滤，同一行，自适应换行 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1 min-w-[20rem]">
          {/* 学生编号 */}
          <div className="relative w-36">
            <Input placeholder="学生编号..." value={localStudentCode} onChange={e => setLocalStudentCode(e.target.value)} onKeyPress={handleKeyPress} className="pr-8 w-36" />
            {localStudentCode && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalStudentCode("")}>
                <X className="h-3 w-3" />
              </Button>}
          </div>

          {/* 学生姓名 */}
          <div className="relative w-36">
            <Input placeholder="学生姓名..." value={localStudentName} onChange={e => setLocalStudentName(e.target.value)} onKeyPress={handleKeyPress} className="pr-8 w-36" />
            {localStudentName && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalStudentName("")}>
                <X className="h-3 w-3" />
              </Button>}
          </div>

          {/* 班级过滤 */}
          <div className="flex-1 min-w-[11rem]">
            <Select value={localClassId} onValueChange={v => setLocalClassId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="班级过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classOptions.map(c => <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 是否需要老师帮助 */}
        <div className="w-32">
          <div className="w-32">
            <Select value={localIsNeedTeacherReply} onValueChange={v => setLocalIsNeedTeacherReply(v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="老师帮助" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">老师帮助(全部)</SelectItem>
                <SelectItem value="need">需要老师帮助</SelectItem>
                <SelectItem value="notNeed">不需要老师帮助</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 是否已掌握（固定宽度） */}
        <div className="w-32">
          <Select value={localIsStudentMaster} onValueChange={v => setLocalIsStudentMaster(v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="掌握情况" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">掌握情况(全部)</SelectItem>
              <SelectItem value="yes">已掌握</SelectItem>
              <SelectItem value="no">未掌握</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} size="default" className="px-3">
            <Search className="h-4 w-4 mr-2" /> 搜索
          </Button>
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
