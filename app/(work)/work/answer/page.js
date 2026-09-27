"use client";

// 作答工作台首页，汇总班级课程题包并引导老师进入采集与解析流程
import { BookOpen, FileText, Upload, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../components/ui/badge.js";
import { Button } from "../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card.js";
import { Input } from "../../../../components/ui/input.js";
import { ScrollArea } from "../../../../components/ui/scroll-area.js";
import { Separator } from "../../../../components/ui/separator.js";
import WorkHeader from "../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useAuth } from "../../../../hooks/useAuth.js";
import { loadAllAnswerDataAction, searchClassIdsByStudentAction } from "./actions.js";
export default function AnswerPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]);
  const [selected, setSelected] = useState({});

  // 过滤条件
  const [classroomFilter, setClassroomFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState(""); // 学生姓名过滤（后端）
  const [studentFilteredClassIds, setStudentFilteredClassIds] = useState(null); // 学生过滤后的班级ID列表
  const [, setIsStudentFiltering] = useState(false); // 学生过滤加载状态
  const [courseFilter, setCourseFilter] = useState("");
  const [questionPackFilter, setQuestionPackFilter] = useState("");

  // 使用 useDeferredValue 优化过滤性能
  const deferredClassroomFilter = useDeferredValue(classroomFilter);
  const deferredCourseFilter = useDeferredValue(courseFilter);
  const deferredQuestionPackFilter = useDeferredValue(questionPackFilter);

  // 一次性加载所有数据
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadAllAnswerDataAction();
      if (result.success) {
        setAllData(result.data || []);
      } else {
        toast({
          title: "加载失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);
  useEffect(() => {
    // 只有在用户存在且有当前校园时才加载数据
    if (user?.workSetting?.currentSchool) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // 学生姓名搜索的防抖处理
  useEffect(() => {
    const keyword = studentFilter.trim();
    if (!keyword) {
      // 清空搜索时，重置过滤结果
      setStudentFilteredClassIds(null);
      return;
    }

    // 使用防抖处理
    const timer = setTimeout(async () => {
      setIsStudentFiltering(true);
      try {
        const classIds = await searchClassIdsByStudentAction(keyword);
        setStudentFilteredClassIds(classIds);
      } catch (error) {
        console.error("根据学生搜索班级失败:", error);
        setStudentFilteredClassIds([]);
      } finally {
        setIsStudentFiltering(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentFilter]);

  // 过滤后的班级列表
  const filteredClassrooms = useMemo(() => {
    let result = allData;

    // 先应用学生姓名过滤（后端过滤结果）
    if (studentFilteredClassIds !== null) {
      result = result.filter(classroom => studentFilteredClassIds.includes(classroom._id));
    }

    // 再应用班级名称过滤（前端过滤）
    const keyword = deferredClassroomFilter.toLowerCase().trim();
    if (keyword) {
      result = result.filter(classroom => classroom.name.toLowerCase().includes(keyword) || classroom.description?.toLowerCase().includes(keyword) || classroom.headTeacher?.toLowerCase().includes(keyword));
    }
    return result;
  }, [allData, deferredClassroomFilter, studentFilteredClassIds]);

  // 过滤后的课程列表
  const filteredCourses = useMemo(() => {
    if (!selected.classroom) return [];
    const keyword = deferredCourseFilter.toLowerCase().trim();
    if (!keyword) return selected.classroom.courses;
    return selected.classroom.courses.filter(course => course.name.toLowerCase().includes(keyword) || course.subject.toLowerCase().includes(keyword) || course.description?.toLowerCase().includes(keyword));
  }, [selected.classroom, deferredCourseFilter]);

  // 过滤后的题集列表
  const filteredQuestionPacks = useMemo(() => {
    if (!selected.course) return [];
    const keyword = deferredQuestionPackFilter.toLowerCase().trim();
    if (!keyword) return selected.course.questionPacks;
    return selected.course.questionPacks.filter(pack => pack.name.toLowerCase().includes(keyword) || pack.type.toLowerCase().includes(keyword) || pack.subject.toLowerCase().includes(keyword) || pack.description?.toLowerCase().includes(keyword));
  }, [selected.course, deferredQuestionPackFilter]);

  // 选择班级
  const handleClassroomSelect = classroom => {
    setSelected({
      classroom
    });
    setCourseFilter("");
    setQuestionPackFilter("");
  };

  // 选择课程
  const handleCourseSelect = course => {
    setSelected(prev => ({
      ...prev,
      course
    }));
    setQuestionPackFilter("");
  };

  // 选择题集
  const handleQuestionPackSelect = questionPack => {
    setSelected(prev => ({
      ...prev,
      questionPack
    }));
  };

  // 提交答卷
  const handleSubmitAnswer = () => {
    if (!selected.classroom || !selected.course || !selected.questionPack) {
      toast({
        title: "请完整选择",
        description: "请先选择班级、课程和题集",
        variant: "destructive"
      });
      return;
    }

    // 在新窗口中打开答卷提交页面，传递班级ID、课程ID和题集ID
    window.open(`/work/answer/pick-students?classId=${selected.classroom._id}&courseId=${selected.course._id}&packId=${selected.questionPack._id}`, "_blank");
  };
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="上传答卷" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载数据中...</p>
          </div>
        </main>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="上传答卷" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-3">
            {/* 第一步：选择班级 */}
            <Card className="h-fit">
              <CardHeader className="p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  班级
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Input placeholder="过滤班级..." value={classroomFilter} onChange={e => setClassroomFilter(e.target.value)} className="h-8 text-sm flex-1" />
                  <Input placeholder="按学生姓名过滤..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="h-8 text-sm flex-1" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 p-1">
                    {filteredClassrooms.length === 0 ? <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        {allData.length === 0 ? <div>
                            <p className="text-gray-600 mb-2">
                              您还没有创建任何班级
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              请先前往班级管理页面创建班级
                            </p>
                            <Button variant="outline" size="sm" onClick={() => router.push("/work/classroom")}>
                              前往班级管理
                            </Button>
                          </div> : <p>没有符合条件的班级</p>}
                      </div> : filteredClassrooms.map(classroom => <Card key={classroom._id} className={`cursor-pointer transition-all hover:shadow-md ${selected.classroom?._id === classroom._id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`} onClick={() => handleClassroomSelect(classroom)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {classroom.name}
                                </h4>
                                {classroom.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {classroom.description}
                                  </p>}
                                {classroom.headTeacher && <p className="text-xs text-gray-500 mt-1">
                                    班主任：{classroom.headTeacher}
                                  </p>}
                              </div>
                              <div className="ml-3 flex flex-col items-end gap-1">
                                <Badge variant="secondary">
                                  {classroom.studentCount || 0}人
                                </Badge>
                                <Badge variant={classroom.status === "正常" ? "default" : "outline"} className="text-xs">
                                  {classroom.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>)}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 第二步：选择课程 */}
            <Card className={`h-fit ${!selected.classroom ? "opacity-50" : ""}`}>
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="w-4 h-4" />
                    课程
                  </CardTitle>
                  <div className="flex items-center gap-2 w-48">
                    <Input placeholder="过滤课程..." value={courseFilter} onChange={e => setCourseFilter(e.target.value)} disabled={!selected.classroom} className="h-8 text-sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {!selected.classroom ? <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择班级</p>
                  </div> : <ScrollArea className="h-[400px]">
                    <div className="space-y-3 p-1">
                      {filteredCourses.length === 0 ? <div className="text-center py-8 text-gray-500">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          {selected.classroom && selected.classroom.courses.length === 0 ? <div>
                              <p className="text-gray-600 mb-2">
                                该班级还没有添加课程
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                请先为班级添加课程，然后再选择题集提交答卷
                              </p>
                              <Button variant="outline" size="sm" onClick={() => router.push(`/work/classroom/${selected.classroom._id}/course/add`)}>
                                添加课程
                              </Button>
                            </div> : <p>没有符合条件的课程</p>}
                        </div> : filteredCourses.map(course => <Card key={course._id} className={`cursor-pointer transition-all hover:shadow-md ${selected.course?._id === course._id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`} onClick={() => handleCourseSelect(course)}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{course.name}</h4>
                                  <p className="text-sm text-primary font-medium mt-1">
                                    {course.subject}
                                  </p>
                                  {course.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {course.description}
                                    </p>}
                                </div>
                                <div className="ml-3 flex flex-col items-end gap-1">
                                  <Badge variant="outline">
                                    {course.questionPacks.length}个题集
                                  </Badge>
                                  <Badge variant={course.status === "使用中" ? "default" : "outline"} className="text-xs">
                                    {course.status}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                    </div>
                  </ScrollArea>}
              </CardContent>
            </Card>

            {/* 第三步：选择题集 */}
            <Card className={`h-fit ${!selected.course ? "opacity-50" : ""}`}>
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4" />
                    题集
                  </CardTitle>
                  <div className="flex items-center gap-2 w-48">
                    <Input placeholder="过滤题集..." value={questionPackFilter} onChange={e => setQuestionPackFilter(e.target.value)} disabled={!selected.course} className="h-8 text-sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {!selected.course ? <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请先选择课程</p>
                  </div> : <ScrollArea className="h-[400px]">
                    <div className="space-y-3 p-1">
                      {filteredQuestionPacks.length === 0 ? <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          {selected.course && selected.course.questionPacks.length === 0 ? <div>
                              <p className="text-gray-600 mb-2">
                                该课程还没有题集
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                请联系管理员为课程添加题集，或选择其他有题集的课程
                              </p>
                              <Button variant="outline" size="sm" onClick={() => router.push(`/work/school/course/${selected.course._id}/question-pack`)}>
                                管理题集
                              </Button>
                            </div> : <p>没有符合条件的题集</p>}
                        </div> : filteredQuestionPacks.map(pack => <Card key={pack._id} className={`cursor-pointer transition-all hover:shadow-md ${selected.questionPack?._id === pack._id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`} onClick={() => handleQuestionPackSelect(pack)}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{pack.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {pack.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {pack.subject}
                                    </Badge>
                                  </div>
                                  {pack.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                      {pack.description}
                                    </p>}
                                </div>
                                <div className="ml-3">
                                  <Badge variant="default" className="font-medium">
                                    {pack.questionIds.length}题
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                    </div>
                  </ScrollArea>}
              </CardContent>
            </Card>
          </div>

          {/* 提交区域 */}
          <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {selected.classroom && selected.course && selected.questionPack ? <div>
                      <h3 className="font-semibold text-lg mb-2">
                        即将提交答卷
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium">班级：</span>
                          <span>{selected.classroom.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="font-medium">课程：</span>
                          <span>{selected.course.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {selected.course.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium">题集：</span>
                          <span>{selected.questionPack.name}</span>
                          <Badge variant="default" className="text-xs">
                            {selected.questionPack.questionIds.length}题
                          </Badge>
                        </div>
                      </div>
                    </div> : <div>
                      <h3 className="font-semibold text-lg mb-2">请完成选择</h3>
                      <p className="text-gray-600">
                        请选择班级、课程和题集后提交答卷
                      </p>
                    </div>}
                </div>

                <Separator orientation="vertical" className="mx-6 h-16" />

                <div>
                  <Button onClick={handleSubmitAnswer} disabled={!selected.classroom || !selected.course || !selected.questionPack} size="lg" className="px-8">
                    <Upload className="w-5 h-5 mr-2" />
                    提交答卷
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}
