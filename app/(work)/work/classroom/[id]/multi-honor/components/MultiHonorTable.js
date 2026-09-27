"use client";

// 多荣誉编辑表格，支持批量设置学生荣誉和展示配置
import { Card } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
export default function MultiHonorTable({
  students,
  studentHonorData,
  honors,
  subjects,
  isLoading,
  onUpdateStudentHonor
}) {
  if (isLoading) {
    return <Card className="bg-white p-8">
        <div className="text-center text-gray-500">加载中...</div>
      </Card>;
  }
  if (students.length === 0) {
    return <Card className="bg-white p-8">
        <div className="text-center text-gray-500">暂无学生数据</div>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>学生姓名</TableHead>
            <TableHead>学生编号</TableHead>
            <TableHead>荣誉名称</TableHead>
            <TableHead>考试名称</TableHead>
            <TableHead>显示在荣誉榜</TableHead>
            <TableHead>科目</TableHead>
            <TableHead>分数</TableHead>
            <TableHead>老师备注</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
          const honorData = studentHonorData.find(data => data.studentId === student._id);
          const isChecked = !!honorData?.honorName;
          return <TableRow key={student._id}>
                <TableCell>
                  <Checkbox checked={isChecked} disabled />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{student.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{student.studentCode || "-"}</div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Select value={honorData?.honorName || "none"} onValueChange={value => {
                        const newValue = value === "none" ? "" : value;
                        onUpdateStudentHonor(student._id, "honorName", newValue);
                      }}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="选择荣誉" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">选择荣誉</SelectItem>
                              {honors.map(honor => <SelectItem key={honor.name} value={honor.name}>
                                  {honor.name}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      {honorData?.honorName && <TooltipContent>
                          {(() => {
                      const selectedHonor = honors.find(h => h.name === honorData.honorName);
                      return selectedHonor ? `获得积分：${selectedHonor.points} 分` : "未知积分";
                    })()}
                        </TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Input placeholder="考试名称" value={honorData?.examName || ""} onChange={e => onUpdateStudentHonor(student._id, "examName", e.target.value)} className="w-[150px]" />
                </TableCell>
                <TableCell>
                  <Switch checked={honorData?.showInSchoolHonorBoard === "true"} onCheckedChange={checked => onUpdateStudentHonor(student._id, "showInSchoolHonorBoard", checked ? "true" : "false")} />
                </TableCell>
                <TableCell>
                  <Select value={honorData?.subject || "none"} onValueChange={value => {
                const newValue = value === "none" ? "" : value;
                onUpdateStudentHonor(student._id, "subject", newValue);
              }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">选择科目</SelectItem>
                      {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                          {subject.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input type="number" placeholder="分数" value={honorData?.score || ""} onChange={e => onUpdateStudentHonor(student._id, "score", e.target.value)} className="w-[100px]" />
                </TableCell>
                <TableCell>
                  <Input placeholder="老师备注" value={honorData?.teacherRemark || ""} onChange={e => onUpdateStudentHonor(student._id, "teacherRemark", e.target.value)} className="min-w-[200px]" />
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </Card>;
}
