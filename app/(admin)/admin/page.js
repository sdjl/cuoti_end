"use client";

import { Cpu, FolderOpen, HardDrive, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button } from "../../../components/ui/button.js";
import { Card } from "../../../components/ui/card.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart.js";
import { getSystemInfo, getTempFileStats } from "./actions.js";
export default function AdminPage() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [tempFileStats, setTempFileStats] = useState(null);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  const [isLoadingTemp, setIsLoadingTemp] = useState(false);
  const [showTempStats, setShowTempStats] = useState(false);

  // 加载系统信息
  const loadSystemInfo = useCallback(async () => {
    setIsLoadingSystem(true);
    try {
      const data = await getSystemInfo();
      setSystemInfo(data);
    } catch (error) {
      console.error("加载系统信息失败:", error);
    } finally {
      setIsLoadingSystem(false);
    }
  }, []);

  // 加载临时文件统计
  const loadTempFileStats = useCallback(async () => {
    setIsLoadingTemp(true);
    setShowTempStats(true);
    try {
      const data = await getTempFileStats();
      setTempFileStats(data);
    } catch (error) {
      console.error("加载临时文件统计失败:", error);
    } finally {
      setIsLoadingTemp(false);
    }
  }, []);

  // 初始加载系统信息
  useEffect(() => {
    loadSystemInfo();
  }, [loadSystemInfo]);

  // 格式化字节大小
  const formatBytes = bytes => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  };

  // 准备内存使用饼状图数据
  const memoryChartData = systemInfo ? [{
    name: "已使用",
    value: systemInfo.usedMemory,
    fill: "#ef4444" // red-500
  }, {
    name: "空闲",
    value: systemInfo.freeMemory,
    fill: "#22c55e" // green-500
  }] : [];
  const chartConfig = {
    used: {
      label: "已使用",
      color: "#ef4444"
    },
    free: {
      label: "空闲",
      color: "#22c55e"
    }
  };
  return <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系统监控</h1>
          <p className="text-muted-foreground">服务器资源使用情况</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSystemInfo} disabled={isLoadingSystem}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSystem ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 系统信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPU 信息 */}
        {systemInfo?.cpuCount && <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPU 核心数</p>
                <p className="text-2xl font-bold">{systemInfo.cpuCount}</p>
              </div>
            </div>
          </Card>}

        {/* 总内存 */}
        {systemInfo && <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总内存</p>
                <p className="text-2xl font-bold">
                  {formatBytes(systemInfo.totalMemory)}
                </p>
              </div>
            </div>
          </Card>}

        {/* 已使用内存 */}
        {systemInfo && <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已使用内存</p>
                <p className="text-2xl font-bold">
                  {formatBytes(systemInfo.usedMemory)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemInfo.memoryUsagePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>}
      </div>

      {/* 内存使用饼状图 */}
      {systemInfo && <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">内存使用情况</h2>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={memoryChartData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                percent
              }) => `${name}: ${(percent * 100).toFixed(1)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {memoryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">已使用</p>
              <p className="font-semibold text-red-600">
                {formatBytes(systemInfo.usedMemory)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">空闲</p>
              <p className="font-semibold text-green-600">
                {formatBytes(systemInfo.freeMemory)}
              </p>
            </div>
          </div>
        </Card>}

      {/* 临时文件统计按钮 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">临时文件统计</h2>
            <p className="text-sm text-muted-foreground">
              查看错题批量任务的临时文件占用
            </p>
          </div>
          <Button onClick={loadTempFileStats} disabled={isLoadingTemp}>
            <FolderOpen className={`h-4 w-4 mr-2 ${isLoadingTemp ? "animate-pulse" : ""}`} />
            {isLoadingTemp ? "统计中..." : "查看临时文件"}
          </Button>
        </div>

        {/* 临时文件统计结果 */}
        {showTempStats && tempFileStats && <div className="mt-6 space-y-4">
            {/* 总体统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">文件总数</p>
                <p className="text-2xl font-bold">{tempFileStats.totalFiles}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">占用空间</p>
                <p className="text-2xl font-bold">
                  {formatBytes(tempFileStats.totalSize)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">目录总数</p>
                <p className="text-2xl font-bold">
                  {tempFileStats.classDirs + tempFileStats.taskDirs}
                </p>
              </div>
            </div>

            {/* 详细统计 */}
            {(tempFileStats.details.classFiles.length > 0 || tempFileStats.details.taskFiles.length > 0) && <div className="space-y-4">
                {/* 班级目录 */}
                {tempFileStats.details.classFiles.length > 0 && <div>
                    <h3 className="font-semibold mb-2">
                      班级目录 ({tempFileStats.classDirs})
                    </h3>
                    <div className="space-y-2">
                      {tempFileStats.details.classFiles.map((item, index) => <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm">
                          <span className="font-mono text-xs">
                            {item.dirName}
                          </span>
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{item.fileCount} 文件</span>
                            <span className="font-semibold text-foreground">
                              {formatBytes(item.size)}
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}

                {/* 任务目录 */}
                {tempFileStats.details.taskFiles.length > 0 && <div>
                    <h3 className="font-semibold mb-2">
                      任务目录 ({tempFileStats.taskDirs})
                    </h3>
                    <div className="space-y-2">
                      {tempFileStats.details.taskFiles.map((item, index) => <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg text-sm">
                          <span className="font-mono text-xs">
                            {item.dirName}
                          </span>
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{item.fileCount} 文件</span>
                            <span className="font-semibold text-foreground">
                              {formatBytes(item.size)}
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>}
              </div>}

            {/* 如果没有临时文件 */}
            {tempFileStats.totalFiles === 0 && <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无临时文件</p>
              </div>}
          </div>}
      </Card>
    </div>;
}
