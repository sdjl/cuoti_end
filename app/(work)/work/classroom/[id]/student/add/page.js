"use client";

// 添加学生页面，用于搜索现有学生或创建新学生并添加到班级
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { addExistingStudentToClassAction, createAndAddStudentAction, getClassRoomInfoAction, getNextStudentCodeAction, searchStudentsAction } from "./actions.js";
import { AddedStudentsList } from "./components/AddedStudentsList.js";
import { SearchResultsList } from "./components/SearchResultsList.js";
import { StudentSearchCard } from "./components/StudentSearchCard.js";
export default function AddStudentPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classRoomId = params.id;
  const {
    toast
  } = useToast();

  // 班级信息
  const [classRoom, setClassRoom] = useState(null);

  // 查询学生相关状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 新学生编号（独立管理）
  const [newStudentCode, setNewStudentCode] = useState("");

  // 新学生表单数据
  const [newStudentData, setNewStudentData] = useState({
    name: "",
    birthDate: "",
    ethnicity: "汉",
    homeAddress: "",
    gender: "未知",
    publicSchoolName: "",
    contactPhones: "",
    notes: ""
  });

  // 班级备注和状态
  const [classRoomNotes, setClassRoomNotes] = useState("");
  const [classRoomStatus, setClassRoomStatus] = useState("在读");

  // 添加状态
  const [isAdding, setIsAdding] = useState(false);

  // 已添加的学生列表
  const [addedStudents, setAddedStudents] = useState([]);

  // 检查当前校园和权限
  useEffect(() => {
    async function checkPermissions() {
      if (!user) return;
      if (!user.workSetting?.currentSchool) {
        router.push("/work/setting/curr-school");
        return;
      }
      try {
        const {
          classRoom: classRoomData,
          error
        } = await getClassRoomInfoAction(classRoomId);
        if (error) {
          router.push(`/work/error?message=${encodeURIComponent(error)}`);
          return;
        }
        setClassRoom(classRoomData);
      } catch (error) {
        console.error("检查权限失败:", error);
        router.push(`/work/error?message=${encodeURIComponent("检查权限失败")}`);
      }
    }
    checkPermissions();
  }, [user, router, classRoomId]);

  // 搜索学生
  const handleSearchStudent = useCallback(async () => {
    if (!searchKeyword.trim()) {
      toast({
        title: "请输入搜索关键词",
        description: "可以输入学生编号或姓名",
        variant: "destructive"
      });
      return;
    }
    setIsSearching(true);
    try {
      const {
        students,
        error
      } = await searchStudentsAction(classRoomId, searchKeyword);
      if (error) {
        toast({
          title: "查询失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setSearchResults(students);
      setSelectedStudent(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error("搜索学生失败:", error);
      toast({
        title: "搜索失败",
        description: "搜索学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [classRoomId, searchKeyword, toast]);

  // 显示新建学生表单
  const handleShowCreateForm = useCallback(async () => {
    setShowCreateForm(true);
    setSelectedStudent(null);
    setSearchResults([]);

    // 获取建议的学生编号
    try {
      const {
        suggestedCode
      } = await getNextStudentCodeAction();
      setNewStudentCode(suggestedCode);
    } catch (error) {
      console.error("获取建议学生编号失败:", error);
      setNewStudentCode("");
    }
  }, []);

  // 重置表单
  const resetForm = useCallback(() => {
    setSearchKeyword("");
    setSearchResults([]);
    setSelectedStudent(null);
    setShowCreateForm(false);
    setNewStudentCode("");
    setClassRoomNotes("");
    setClassRoomStatus("在读");
    setNewStudentData({
      name: "",
      birthDate: "",
      ethnicity: "汉",
      homeAddress: "",
      gender: "未知",
      publicSchoolName: "",
      contactPhones: "",
      notes: ""
    });
  }, []);

  // 选择学生
  const handleSelectStudent = useCallback(student => {
    setSelectedStudent(student);
    setShowCreateForm(false);
  }, []);

  // 添加已有学生到班级
  const handleAddExistingStudent = useCallback(async () => {
    if (!selectedStudent) return;
    setIsAdding(true);
    try {
      const {
        success,
        error
      } = await addExistingStudentToClassAction(classRoomId, selectedStudent._id, classRoomNotes.trim() || undefined, classRoomStatus);
      if (!success) {
        toast({
          title: "添加失败",
          description: error || "添加学生到班级失败",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "添加成功",
        description: `学生 ${selectedStudent.name} 已成功添加到班级`
      });

      // 添加到已添加列表
      setAddedStudents(prev => [...prev, selectedStudent]);

      // 重置状态
      resetForm();
    } catch (error) {
      console.error("添加学生失败:", error);
      toast({
        title: "添加失败",
        description: "添加学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  }, [classRoomId, selectedStudent, classRoomNotes, classRoomStatus, toast, resetForm]);

  // 创建新学生并添加到班级
  const handleCreateAndAddStudent = useCallback(async () => {
    if (!newStudentCode.trim()) {
      toast({
        title: "请填写学生编号",
        variant: "destructive"
      });
      return;
    }
    if (!newStudentData.name.trim()) {
      toast({
        title: "请填写学生姓名",
        variant: "destructive"
      });
      return;
    }
    setIsAdding(true);
    try {
      // 处理联系电话：将空格分隔的字符串转换为数组
      const contactPhonesArray = newStudentData.contactPhones.trim().split(/\s+/).filter(phone => phone.length > 0);
      const {
        success,
        student,
        error
      } = await createAndAddStudentAction(classRoomId, {
        ...newStudentData,
        studentCode: newStudentCode.trim(),
        publicSchoolName: newStudentData.publicSchoolName.trim() || undefined,
        contactPhones: contactPhonesArray.length > 0 ? contactPhonesArray : undefined
      }, classRoomNotes.trim() || undefined, classRoomStatus);
      if (!success) {
        toast({
          title: "创建失败",
          description: error || "创建学生失败",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "创建成功",
        description: `学生 ${newStudentData.name} 已成功创建并添加到班级`
      });

      // 添加到已添加列表
      if (student) {
        setAddedStudents(prev => [...prev, student]);
      }

      // 重置状态
      resetForm();
    } catch (error) {
      console.error("创建学生失败:", error);
      toast({
        title: "创建失败",
        description: "创建学生时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  }, [classRoomId, newStudentData, newStudentCode, classRoomNotes, classRoomStatus, toast, resetForm]);

  // 处理新学生表单变化
  const handleNewStudentDataChange = useCallback((field, value) => {
    setNewStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  if (!user || !classRoom) {
    return null;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <WorkHeader title={`${classRoom.name} - 添加学生`} showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生列表" />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* 搜索学生区域 */}
          <StudentSearchCard searchKeyword={searchKeyword} isSearching={isSearching} showCreateForm={showCreateForm} onSearchKeywordChange={setSearchKeyword} onSearch={handleSearchStudent} onShowCreateForm={handleShowCreateForm} />

          {/* 搜索结果列表 */}
          {!showCreateForm && <SearchResultsList searchResults={searchResults} selectedStudent={selectedStudent} onSelectStudent={handleSelectStudent} />}

          {/* 已选中学生信息 */}
          {selectedStudent && !showCreateForm && <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  已选中学生：{selectedStudent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>学生编号</Label>
                    <p className="text-sm font-medium">
                      {selectedStudent.studentCode}
                    </p>
                  </div>
                  <div>
                    <Label>学生姓名</Label>
                    <p className="text-sm font-medium">
                      {selectedStudent.name}
                    </p>
                  </div>
                  <div>
                    <Label>性别</Label>
                    <p className="text-sm">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <Label>出生日期</Label>
                    <p className="text-sm">
                      {selectedStudent.birthDate || "未填写"}
                    </p>
                  </div>
                  <div>
                    <Label>民族</Label>
                    <p className="text-sm">
                      {selectedStudent.ethnicity || "未填写"}
                    </p>
                  </div>
                  <div>
                    <Label>家庭地址</Label>
                    <p className="text-sm">
                      {selectedStudent.homeAddress || "未填写"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">
                    班级相关信息
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="existingClassRoomStatus">关系状态</Label>
                      <Select value={classRoomStatus} onValueChange={value => setClassRoomStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="在读">在读</SelectItem>
                          <SelectItem value="退学">退学</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="existingClassRoomNotes">班级备注</Label>
                    <Textarea id="existingClassRoomNotes" placeholder="为该学生在此班级添加备注..." value={classRoomNotes} onChange={e => setClassRoomNotes(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleAddExistingStudent} disabled={isAdding} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    {isAdding ? "添加中..." : "添加到此班级"}
                  </Button>
                  <Button onClick={() => setSelectedStudent(null)} variant="outline" disabled={isAdding}>
                    取消选择
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* 创建新学生表单 */}
          {showCreateForm && <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">创建新学生</CardTitle>
                <p className="text-sm text-gray-600">
                  请填写学生信息创建新学生
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 学生基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">
                    学生基本信息
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newStudentCode">学生编号 *</Label>
                      <Input id="newStudentCode" placeholder="请输入学生编号" value={newStudentCode} onChange={e => setNewStudentCode(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentName">学生姓名 *</Label>
                      <Input id="newStudentName" placeholder="请输入学生姓名" value={newStudentData.name} onChange={e => handleNewStudentDataChange("name", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentGender">性别</Label>
                      <Select value={newStudentData.gender} onValueChange={value => handleNewStudentDataChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="男">男</SelectItem>
                          <SelectItem value="女">女</SelectItem>
                          <SelectItem value="未知">未知</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="newStudentBirthDate">出生日期</Label>
                      <Input id="newStudentBirthDate" type="date" value={newStudentData.birthDate} onChange={e => handleNewStudentDataChange("birthDate", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentEthnicity">民族</Label>
                      <Input id="newStudentEthnicity" placeholder="请输入民族" value={newStudentData.ethnicity} onChange={e => handleNewStudentDataChange("ethnicity", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentHomeAddress">家庭地址</Label>
                      <Input id="newStudentHomeAddress" placeholder="请输入家庭地址" value={newStudentData.homeAddress} onChange={e => handleNewStudentDataChange("homeAddress", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentPublicSchoolName">
                        就读校园
                      </Label>
                      <Input id="newStudentPublicSchoolName" placeholder="请输入就读的公立校园名称" value={newStudentData.publicSchoolName} onChange={e => handleNewStudentDataChange("publicSchoolName", e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="newStudentContactPhones">联系电话</Label>
                      <Input id="newStudentContactPhones" placeholder="多个电话请用空格隔开" value={newStudentData.contactPhones} onChange={e => handleNewStudentDataChange("contactPhones", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newStudentNotes">学生备注</Label>
                    <Textarea id="newStudentNotes" placeholder="学生个人备注信息..." value={newStudentData.notes} onChange={e => handleNewStudentDataChange("notes", e.target.value)} />
                  </div>
                </div>

                {/* 班级相关信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">
                    班级相关信息
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newClassRoomStatus">关系状态</Label>
                      <Select value={classRoomStatus} onValueChange={value => setClassRoomStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="在读">在读</SelectItem>
                          <SelectItem value="退学">退学</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newClassRoomNotes">班级备注</Label>
                    <Textarea id="newClassRoomNotes" placeholder="该学生在此班级的备注信息..." value={classRoomNotes} onChange={e => setClassRoomNotes(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleCreateAndAddStudent} disabled={isAdding || !newStudentCode.trim() || !newStudentData.name.trim()} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    {isAdding ? "创建中..." : "创建并添加到班级"}
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)} variant="outline" disabled={isAdding}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* 已添加的学生列表 */}
          <AddedStudentsList addedStudents={addedStudents} />
        </div>
      </main>
    </div>;
}
