"use client";

import { List, Package, User, Users } from "lucide-react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
// 创建题集操作组件，用于显示已选择的班级和学生信息，并提供创建题集和查看题集列表的操作按钮
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function CreatePackAction({
  selectedClassRoom,
  selectedStudent,
  onCreatePack,
  onViewPackList
}) {
  return <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedClassRoom && selectedStudent ? <div>
                <h3 className="font-semibold text-lg mb-2">准备定制题集</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">班级：</span>
                    <span>{selectedClassRoom.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">学生：</span>
                    <span>{selectedStudent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedStudent.studentCode}
                    </Badge>
                  </div>
                </div>
              </div> : <div>
                <h3 className="font-semibold text-lg mb-2">请完成选择</h3>
                <p className="text-gray-600">请选择班级和学生后开始定制题集</p>
              </div>}
          </div>

          <Separator orientation="vertical" className="mx-6 h-16" />

          <div className="flex gap-3">
            <Button onClick={onViewPackList} disabled={!selectedClassRoom || !selectedStudent} size="lg" variant="outline" className="px-6">
              <List className="w-5 h-5 mr-2" />
              题集列表
            </Button>
            <Button onClick={onCreatePack} disabled={!selectedClassRoom || !selectedStudent} size="lg" className="px-8">
              <Package className="w-5 h-5 mr-2" />
              定制题集
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}
