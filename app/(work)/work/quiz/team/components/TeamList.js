"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Clock, Eye, User, Users } from "lucide-react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
// 队伍列表组件，展示口述核心知识点的组队信息、成员统计和总分数
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export default function TeamList({
  teams,
  quizzes,
  isLoading,
  teamsStats
}) {
  // 根据quizId获取口述核心知识点信息
  const getQuizInfo = quizId => {
    const quiz = quizzes.find(q => q._id === quizId);
    return quiz || {
      title: `未知${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`,
      subject: "",
      grade: ""
    };
  };

  // 获取队伍成员统计信息
  const getTeamMemberStats = teamId => {
    return teamsStats[teamId]?.memberStats || [];
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (teams.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无队伍数据</p>
          <p className="text-sm text-gray-400 mt-2">
            学生在开启组队功能的{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
            中创建队伍后，将在此显示
          </p>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>队伍信息</TableHead>
              <TableHead>关联{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}</TableHead>
              <TableHead>队长</TableHead>
              <TableHead>成员</TableHead>
              <TableHead>总分数</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map(team => <TableRow key={team._id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {team.teamName}
                    </div>
                    {team.teamDescription && <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-gray-500 cursor-help truncate max-w-xs">
                            {team.teamDescription}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs whitespace-pre-wrap">
                            {team.teamDescription}
                          </p>
                        </TooltipContent>
                      </Tooltip>}
                  </div>
                </TableCell>

                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-blue-700 border-blue-200 cursor-help">
                        {getQuizInfo(team.quizId).title}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p>
                          <span className="font-medium">科目：</span>
                          {getQuizInfo(team.quizId).subject || "未设置"}
                        </p>
                        <p>
                          <span className="font-medium">年级：</span>
                          {getQuizInfo(team.quizId).grade || "不限"}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      {team.members.length > 0 ? <div>
                          <div className="font-medium text-sm">
                            {team.members[0].name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {team.members[0].grade} • {team.members[0].gender}
                          </div>
                        </div> : <span className="text-gray-400 text-sm">暂无成员</span>}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">
                        {team.members.length} 人
                      </div>
                      <div className="text-xs text-gray-500">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help hover:text-gray-700">
                              查看详细信息
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 shadow-lg">
                            <div className="space-y-3 max-w-sm">
                              {(() => {
                            const memberStats = getTeamMemberStats(team._id);
                            return team.members.map((member, index) => {
                              const stats = memberStats.find(s => s.openid === member.openid);
                              return <div key={index} className="text-sm border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                                      <div className="font-medium text-gray-900">
                                        {member.name}
                                      </div>
                                      <div className="text-gray-500 text-xs mt-1 space-y-1">
                                        <div>
                                          {member.grade} • {member.gender}
                                        </div>
                                        <div>
                                          贡献分数:{" "}
                                          <span className="font-medium text-blue-600">
                                            {stats?.passedCount || 0}
                                          </span>
                                        </div>
                                        <div>
                                          提交状态:{" "}
                                          <span className={`font-medium ${stats?.isSubmitted ? "text-green-600" : "text-orange-600"}`}>
                                            {stats?.isSubmitted ? "已提交" : "未提交"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>;
                            });
                          })()}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {(() => {
                    const memberStats = getTeamMemberStats(team._id);
                    return memberStats.reduce((total, member) => total + (member.passedCount || 0), 0);
                  })()}
                    </div>
                    <div className="text-xs text-gray-500">总分</div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(team.created), {
                    addSuffix: true,
                    locale: zhCN
                  }).replace("大约", "")}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => {
                  const url = `/work/quiz/takeList?teamId=${team._id}`;
                  window.open(url, "_blank");
                }} className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      查看答案
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>
    </TooltipProvider>;
}
