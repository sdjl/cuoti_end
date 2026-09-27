"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
// 班级选择器组件，用于选择班级（支持搜索过滤）
import { useMemo } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { ScrollArea } from "../../../../../../components/ui/scroll-area.js";
export default function ClassRoomSelector({
  classRooms,
  selectedClassRoom,
  onClassRoomSelect,
  classRoomFilter,
  classRoomFilterValue,
  onClassRoomFilterChange,
  isClassRoomFilterPending
}) {
  const router = useRouter();

  // 过滤后的班级列表
  const filteredClassRooms = useMemo(() => {
    const keyword = classRoomFilter.toLowerCase().trim();
    if (!keyword) return classRooms;
    return classRooms.filter(classRoom => classRoom.name.toLowerCase().includes(keyword) || classRoom.description?.toLowerCase().includes(keyword) || classRoom.headTeacher?.toLowerCase().includes(keyword));
  }, [classRooms, classRoomFilter]);
  return <Card className="h-fit">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            选择班级
          </CardTitle>
          <div className="flex items-center gap-2 w-40">
            <Input placeholder="过滤班级..." value={classRoomFilterValue} onChange={e => onClassRoomFilterChange(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 p-1">
            {isClassRoomFilterPending && <div className="text-center py-2 text-sm text-gray-500">
                过滤中...
              </div>}
            {filteredClassRooms.length === 0 ? <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                {classRooms.length === 0 ? <div>
                    <p className="text-gray-600 mb-2">您还没有创建任何班级</p>
                    <p className="text-sm text-gray-500 mb-4">
                      请先前往班级管理页面创建班级
                    </p>
                    <Button variant="outline" size="sm" onClick={() => router.push("/work/classroom")}>
                      前往班级管理
                    </Button>
                  </div> : <p>没有符合条件的班级</p>}
              </div> : filteredClassRooms.map(classRoom => <Card key={classRoom._id} className={`cursor-pointer transition-all hover:shadow-md ${selectedClassRoom?._id === classRoom._id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`} onClick={() => onClassRoomSelect(classRoom)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-base">
                          {classRoom.name}
                        </h4>
                        {classRoom.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {classRoom.description}
                          </p>}
                        {classRoom.headTeacher && <p className="text-xs text-gray-500 mt-1">
                            班主任：{classRoom.headTeacher}
                          </p>}
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        <Badge variant="secondary">
                          {classRoom.studentCount || 0}人
                        </Badge>
                        <Badge variant={classRoom.status === "正常" ? "default" : "outline"} className="text-xs">
                          {classRoom.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>;
}
