"use client";

// 班级教师队伍编辑页面，用于为指定班级添加或移除教师
import { Info, Loader2, Save, Search, UserCheck, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { getClassRoomDetailAction, getSchoolTeachersAction, updateClassRoomTeachersAction } from "./actions.js";
import { TeacherCard } from "./components/TeacherCard.js";
export default function ClassRoomTeacherPage() {
  const params = useParams();
  const {
    toast
  } = useToast();
  const classRoomId = params.id;
  const [classRoom, setClassRoom] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 过滤后的教师列表
  const filteredTeachers = teachers.filter(teacher => {
    const keyword = searchTerm.toLowerCase();
    const name = teacher.userInfo?.name || teacher.userWxInfo?.nickname || "";
    const phone = teacher.userInfo?.phone || "";
    const email = teacher.userInfo?.email || "";
    return name.toLowerCase().includes(keyword) || phone.includes(keyword) || email.toLowerCase().includes(keyword);
  });

  // 可选的教师（未被选为班级教师的）
  const availableTeachers = filteredTeachers.filter(teacher => !selectedTeachers.has(teacher.openid));

  // 已选的教师
  const selectedTeacherList = filteredTeachers.filter(teacher => selectedTeachers.has(teacher.openid));

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classRoomResult, teachersResult] = await Promise.all([getClassRoomDetailAction(classRoomId), getSchoolTeachersAction()]);
      if (classRoomResult.success && classRoomResult.data) {
        setClassRoom(classRoomResult.data);
        // 设置已选中的教师
        setSelectedTeachers(new Set(classRoomResult.data.teacherOpenids));
      } else {
        toast({
          title: "获取班级信息失败",
          description: classRoomResult.error,
          variant: "destructive"
        });
      }
      if (teachersResult.success && teachersResult.data) {
        setTeachers(teachersResult.data);
      } else {
        toast({
          title: "获取教师列表失败",
          description: teachersResult.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      toast({
        title: "加载数据失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classRoomId, toast]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换教师选择状态
  const toggleTeacher = teacherOpenid => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherOpenid)) {
        newSet.delete(teacherOpenid);
      } else {
        newSet.add(teacherOpenid);
      }
      return newSet;
    });
  };

  // 保存更改
  const handleSave = async () => {
    if (!classRoom) return;
    setIsSaving(true);
    try {
      const result = await updateClassRoomTeachersAction(classRoomId, Array.from(selectedTeachers));
      if (result.success) {
        toast({
          title: "保存成功",
          description: "班级教师队伍已更新"
        });
        // 关闭窗口
        window.close();
      } else {
        toast({
          title: "保存失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>;
  }
  if (!classRoom) {
    return <div className="text-center py-10">
        <div className="text-muted-foreground">班级信息不存在</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`编辑班级教师队伍 - ${classRoom.name}`} rightContent={<Button variant="ghost" size="sm" onClick={() => window.close()} className="flex items-center text-gray-600 hover:text-primary transition-colors">
            关闭窗口
          </Button>} />

      <main className="p-6 space-y-6 pb-20">
        <div className="container mx-auto space-y-6">
          {/* 提示信息 */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-blue-700">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-2">
                  <div>• 只有当前校园的教师才能被添加到班级教师队伍中</div>
                  <div>• 点击教师卡片可以添加或移除该教师</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 搜索框 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                搜索教师
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="搜索姓名、电话或邮箱..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
            </CardContent>
          </Card>

          {/* 双栏布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：可选校园教师 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  校园教师 ({availableTeachers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableTeachers.length > 0 ? availableTeachers.map(teacher => <TeacherCard key={teacher._id} teacher={teacher} isSelected={false} onToggle={toggleTeacher} />) : <div className="text-center text-muted-foreground py-8">
                      {searchTerm ? "没有找到匹配的教师" : "没有可选的教师"}
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* 右侧：已选教师 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  班级教师 ({selectedTeacherList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedTeacherList.length > 0 ? selectedTeacherList.map(teacher => <TeacherCard key={teacher._id} teacher={teacher} isSelected={true} onToggle={toggleTeacher} />) : <div className="text-center text-muted-foreground py-8">
                      还未选择任何教师
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 固定在右下角的保存按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          保存设置
        </Button>
      </div>
    </div>;
}
