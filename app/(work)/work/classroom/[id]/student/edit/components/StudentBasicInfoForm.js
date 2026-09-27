"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../../components/ui/textarea.js";

/**
 * 学生基本信息表单
 * 用于编辑学生的基本信息，包括编号、姓名、性别、出生日期等
 */

export function StudentBasicInfoForm({
  studentData,
  onStudentDataChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle>学生基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentCode">学生编号 *</Label>
            <Input id="studentCode" value={studentData.studentCode} onChange={e => onStudentDataChange("studentCode", e.target.value)} placeholder="请输入学生编号" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">学生姓名 *</Label>
            <Input id="name" value={studentData.name} onChange={e => onStudentDataChange("name", e.target.value)} placeholder="请输入学生姓名" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">出生日期</Label>
            <Input id="birthDate" type="date" value={studentData.birthDate} onChange={e => onStudentDataChange("birthDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select value={studentData.gender} onValueChange={value => onStudentDataChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
                <SelectItem value="未知">未知</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ethnicity">民族</Label>
            <Input id="ethnicity" value={studentData.ethnicity} onChange={e => onStudentDataChange("ethnicity", e.target.value)} placeholder="请输入民族" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homeAddress">家庭地址</Label>
            <Input id="homeAddress" value={studentData.homeAddress} onChange={e => onStudentDataChange("homeAddress", e.target.value)} placeholder="请输入家庭地址" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publicSchoolName">就读校园</Label>
            <Input id="publicSchoolName" value={studentData.publicSchoolName} onChange={e => onStudentDataChange("publicSchoolName", e.target.value)} placeholder="请输入就读的公立校园名称" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhones">联系电话</Label>
            <Input id="contactPhones" value={studentData.contactPhones} onChange={e => onStudentDataChange("contactPhones", e.target.value)} placeholder="多个电话请用空格隔开" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentNotes">学生备注</Label>
          <Textarea id="studentNotes" value={studentData.notes} onChange={e => onStudentDataChange("notes", e.target.value)} placeholder="请输入学生备注信息" rows={3} />
        </div>
      </CardContent>
    </Card>;
}
