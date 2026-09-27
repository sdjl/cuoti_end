"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
/**
 * 学习进度图表组件数据接口
 * 对应 LearningProgressChart 组件的单个数据点
 */


const formatDateForChart = dateString => {
  return dateString.substring(5); // 取月-日部分，去掉年份
};

/**
 * Tooltip 组件的 payload 数据类型
 */

/**
 * 自定义悬浮提示框的属性类型
 */

/**
 * 自定义悬浮提示框组件 - 手机端优化
 */
const CustomTooltip = ({
  active,
  payload,
  label
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const progressData = data.payload;
    return <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
        <p className="text-xs font-medium text-card-foreground mb-1">
          {progressData.testName}
        </p>
        <p className="text-xs text-muted-foreground mb-2">{`${label || ""}`}</p>

        {/* 掌握率 */}
        <p className="text-sm font-semibold mb-1" style={{
        color: "#10b981"
      }}>
          {`掌握率: ${data.value}%`}
        </p>

        {/* 知识点统计 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{`已掌握: ${progressData.masteredKnowledgePoints} 个`}</p>
          <p>{`总知识点: ${progressData.totalKnowledgePoints} 个`}</p>
        </div>
      </div>;
  }
  return null;
};

/**
 * 学习进度图表组件属性
 */

/**
 * 学习进度图表组件 - 手机端版本
 *
 * 功能：
 * - 展示学生知识掌握度变化图表
 * - 支持水平滑动查看长时间数据
 * - 自定义悬浮提示框
 * - Y轴固定范围 0-100%
 */
const LearningProgressChart = ({
  data,
  title = "知识点掌握率变化趋势",
  height = 300
}) => {
  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {title && <div className="px-4 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-card-foreground">
              {title}
            </h3>
          </div>}
        <div className="p-8 text-center">
          <div className="text-muted-foreground">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">暂无测验数据</p>
            <p className="text-xs mt-1">完成第一次测验后将显示进度变化</p>
          </div>
        </div>
      </div>;
  }

  // 手机端优化：根据数据点数量智能计算图表宽度
  // 数据点少时适合一屏显示，数据点多时才需要滑动
  const calculateChartWidth = () => {
    const dataCount = data.length;

    // 数据点较少时（≤7个），使用100%宽度，一屏显示完
    if (dataCount <= 7) {
      return "100%"; // 使用容器的100%宽度
    }

    // 数据点较多时，使用滚动模式
    return Math.max(500, dataCount * 50); // 最小500px，每个点50px
  };
  const chartWidth = calculateChartWidth();

  // 手机端优化：根据数据点数量调整X轴标签间隔
  const calculateLabelInterval = () => {
    const dataCount = data.length;

    // 数据点少时显示所有标签
    if (dataCount <= 7) {
      return 0; // 显示所有标签
    }

    // 数据点多时减少标签显示
    return Math.max(0, Math.floor(dataCount / 6));
  };
  const labelInterval = calculateLabelInterval();

  // 直接使用具体的颜色值
  const primaryColor = "#10b981"; // 绿色
  const mutedColor = "#f3f4f6";
  const borderColor = "#e5e7eb";
  const mutedForegroundColor = "#6b7280";
  const cardColor = "#ffffff";
  return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      {/* 图表标题 */}
      {title && <div className="px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold text-card-foreground">
            {title}
          </h3>
        </div>}

      {/* 图表容器 - 手机端优化滚动 */}
      <div className="relative">
        <div className="overflow-x-auto overflow-y-hidden mobile-scroll-area">
          <div style={{
          width: typeof chartWidth === "string" ? chartWidth : `${chartWidth}px`,
          height: `${height}px`
        }} className="px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{
              top: 10,
              right: 15,
              left: 10,
              bottom: 30
            }}>
                {/* 定义绿色渐变填充 */}
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                {/* X轴 - 日期 手机端优化 */}
                <XAxis dataKey="date" tick={{
                fontSize: 12,
                fill: mutedForegroundColor
              }} interval={labelInterval} angle={-30} textAnchor="end" height={30} axisLine={{
                stroke: borderColor,
                strokeWidth: 1
              }} tickLine={{
                stroke: borderColor,
                strokeWidth: 1
              }} tickFormatter={formatDateForChart} />

                {/* Y轴 - 掌握度百分比 手机端优化 */}
                <YAxis domain={[0, 100]} tick={{
                fontSize: 10,
                fill: mutedForegroundColor
              }} axisLine={{
                stroke: borderColor,
                strokeWidth: 1
              }} tickLine={{
                stroke: borderColor,
                strokeWidth: 1
              }} width={35} />

                {/* 网格线 - 手机端优化 */}
                <CartesianGrid strokeDasharray="2 2" stroke={mutedColor} opacity={0.8} />

                {/* 悬浮提示框 */}
                <Tooltip content={<CustomTooltip />} />

                {/* 面积图 - 手机端优化 */}
                <Area type="monotone" dataKey="overallMasteryRate" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrimary)" dot={false} activeDot={{
                r: 5,
                fill: primaryColor,
                stroke: cardColor,
                strokeWidth: 2
              }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 滑动提示 - 手机端 */}
        {data.length > 7 && <div className="absolute bottom-0 right-0 bg-foreground/75 text-background text-xs px-2 py-1 rounded-tl-md">
            ← 滑动查看更多
          </div>}
      </div>

      {/* 操作提示 - 手机端优化 */}
      <div className="px-4 py-2 bg-muted border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          💡 测验中遗忘知识点时掌握率会下降，持续学习可提升掌握度
          {data.length > 7 && " · 向左滑动查看历史数据"}
        </p>
      </div>
    </div>;
};
export default LearningProgressChart;
