"use client";

import { RotateCcw, Search, X } from "lucide-react";
// 非登录用户老师回复过滤器组件，支持按学生姓名、OpenID、是否需要帮助和掌握情况筛选
import { useCallback, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function GuestTeacherReplyFilters({
  studentName,
  setStudentName,
  openid,
  setOpenid,
  isNeedTeacherReply,
  setIsNeedTeacherReply,
  isStudentMaster,
  setIsStudentMaster,
  onReset
}) {
  const [localStudentName, setLocalStudentName] = useState(studentName);
  const [localOpenid, setLocalOpenid] = useState(openid);
  const [localIsNeedTeacherReply, setLocalIsNeedTeacherReply] = useState(isNeedTeacherReply);
  const [localIsStudentMaster, setLocalIsStudentMaster] = useState(isStudentMaster);
  const handleSearch = useCallback(() => {
    setStudentName(localStudentName);
    setOpenid(localOpenid);
    setIsNeedTeacherReply(localIsNeedTeacherReply);
    setIsStudentMaster(localIsStudentMaster);
  }, [localStudentName, localOpenid, localIsNeedTeacherReply, localIsStudentMaster, setStudentName, setOpenid, setIsNeedTeacherReply, setIsStudentMaster]);
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);
  const handleReset = useCallback(() => {
    setLocalStudentName("");
    setLocalOpenid("");
    setLocalIsNeedTeacherReply("need");
    setLocalIsStudentMaster("all");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
        {/* 学生信息搜索，同一行，自适应换行 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1 min-w-[20rem]">
          {/* 学生姓名 */}
          <div className="relative w-36">
            <Input placeholder="学生姓名..." value={localStudentName} onChange={e => setLocalStudentName(e.target.value)} onKeyPress={handleKeyPress} className="pr-8 w-36" />
            {localStudentName && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalStudentName("")}>
                <X className="h-3 w-3" />
              </Button>}
          </div>

          {/* OpenID */}
          <div className="relative flex-1 min-w-[12rem]">
            <Input placeholder="OpenID..." value={localOpenid} onChange={e => setLocalOpenid(e.target.value)} onKeyPress={handleKeyPress} className="pr-8" />
            {localOpenid && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalOpenid("")}>
                <X className="h-3 w-3" />
              </Button>}
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
