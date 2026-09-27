"use client";

// 批量添加学生页面的筛选面板组件，提供学生姓名/编号搜索、班级筛选和年级筛选功能
import { RefreshCw, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
export default function FilterPanel({
  classrooms,
  onSearch,
  isSearching
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedClassRoom, setSelectedClassRoom] = useState(null);
  const [classRoomInput, setClassRoomInput] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 获取所有年级
  const grades = Array.from(new Set(classrooms.map(c => c.grade).filter(Boolean))).sort();

  // 过滤班级
  const filteredClassrooms = classrooms.filter(classroom => {
    if (!classRoomInput.trim()) return true;
    return classroom.name.toLowerCase().includes(classRoomInput.toLowerCase().trim());
  });

  // 处理搜索
  const handleSearch = useCallback(() => {
    onSearch({
      keyword: keyword.trim(),
      classRoomId: selectedClassRoom?._id || "",
      grade: selectedGrade === "all" ? "" : selectedGrade
    });
  }, [keyword, selectedClassRoom, selectedGrade, onSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setKeyword("");
    setSelectedClassRoom(null);
    setClassRoomInput("");
    setSelectedGrade("all");

    // 重置后立即搜索
    onSearch({
      keyword: "",
      classRoomId: "",
      grade: ""
    });
  }, [onSearch]);

  // 选择班级
  const handleSelectClassRoom = useCallback(classroom => {
    setSelectedClassRoom(classroom);
    setClassRoomInput(classroom.name);
    setPopoverOpen(false);
  }, []);

  // 清空班级
  const handleClearClassRoom = useCallback(() => {
    setSelectedClassRoom(null);
    setClassRoomInput("");
  }, []);
  return <Card>
      <CardContent className="p-6">
        <div className="flex items-end gap-4">
          {/* 过滤学生 */}
          <div className="flex-1">
            <Label htmlFor="keyword">学生姓名或编号</Label>
            <Input id="keyword" placeholder="输入学生姓名或编号" value={keyword} onChange={e => setKeyword(e.target.value)} onKeyPress={e => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }} />
          </div>

          {/* 过滤班级 */}
          <div className="flex-1 relative">
            <Label>过滤班级</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input placeholder="输入班级名称筛选" value={classRoomInput} onChange={e => {
                setClassRoomInput(e.target.value);
                // 只有当有输入内容时才打开
                if (e.target.value.trim()) {
                  setPopoverOpen(true);
                } else {
                  setPopoverOpen(false);
                }
              }} onBlur={() => {
                // 延迟关闭，确保可以点击选项
                setTimeout(() => setPopoverOpen(false), 300);
              }} onFocus={() => {
                // 如果有输入内容，聚焦时也显示列表
                if (classRoomInput.trim()) {
                  setPopoverOpen(true);
                }
              }} />
                {/* 使用绝对定位的 div 代替 Popover，避免焦点管理冲突 */}
                {popoverOpen && <div className="absolute z-50 w-80 mt-1 bg-white rounded-md border shadow-md" onMouseDown={e => {
                // 防止点击列表时触发 input 的 blur 事件
                e.preventDefault();
              }}>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredClassrooms.length === 0 ? <div className="p-4 text-sm text-gray-500 text-center">
                          没有找到匹配的班级
                        </div> : filteredClassrooms.map(classroom => <div key={classroom._id} className={`p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${selectedClassRoom?._id === classroom._id ? "bg-blue-50" : ""}`} onClick={() => handleSelectClassRoom(classroom)}>
                            <div className="font-medium">{classroom.name}</div>
                            {classroom.grade && <div className="text-xs text-gray-500">
                                年级: {classroom.grade}
                              </div>}
                          </div>)}
                    </div>
                  </div>}
              </div>
              {selectedClassRoom && <Button size="icon" variant="outline" onClick={handleClearClassRoom}>
                  <X className="h-4 w-4" />
                </Button>}
            </div>
          </div>

          {/* 选择年级 */}
          <div className="w-40">
            <Label>年级</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="全部年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                {grades.map(grade => <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 搜索按钮 */}
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "搜索中..." : "搜索"}
          </Button>

          {/* 重置按钮 */}
          <Button onClick={handleReset} variant="outline" disabled={isSearching}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </CardContent>
    </Card>;
}
