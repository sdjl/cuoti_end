"use server";


export async function generateStudentAnswerReport(data) {
  try {
    // 生成HTML内容
    const htmlContent = generateReportHTML(data);

    // 这里应该使用PDF生成库（如puppeteer或类似的库）
    // 由于项目中可能没有安装相关依赖，我们先返回HTML内容的base64
    // 实际项目中需要安装并使用PDF生成库
    const pdfBase64 = Buffer.from(htmlContent).toString("base64");
    const filename = `${data.student.name}_${data.questionPack.name}_答卷报告_${new Date().toISOString().split("T")[0]}.pdf`;
    return {
      success: true,
      pdfBase64,
      filename
    };
  } catch (error) {
    console.error("生成PDF报告失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成报告失败"
    };
  }
}

/**
 * 生成报告HTML内容
 */
function generateReportHTML(data) {
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  const getQuestionNumber = questionId => {
    const index = data.questionPack.questionIds.indexOf(questionId);
    return index >= 0 ? index + 1 : 0;
  };
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>学生答卷报告</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
        }
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            min-width: 80px;
        }
        .question-item {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 30px;
            overflow: hidden;
        }
        .question-header {
            background: #dc3545;
            color: white;
            padding: 15px;
            font-weight: bold;
        }
        .question-content {
            padding: 20px;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 6px;
        }
        .question-info {
            background: #f0f8ff;
            border-left: 4px solid #87ceeb;
        }
        .student-info {
            background: #fff5f5;
            border-left: 4px solid #ffb3b3;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .answer-item {
            margin: 8px 0;
        }
        .correct-answer {
            color: #4caf50;
            font-weight: bold;
        }
        .student-answer {
            color: #f44336;
            font-weight: bold;
        }
        .mistake-point {
            background: #fffbf0;
            border: 1px solid #f0e68c;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
        }
        .parse-content {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
            line-height: 1.8;
            white-space: pre-wrap;
        }
        .student-answer-content {
            background: #fff5f5;
            border: 1px solid #ffcdd2;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
            line-height: 1.8;
            color: #d32f2f;
            font-weight: bold;
        }
        .difficulty {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .difficulty-easy { background: #e8f5e8; color: #2e7d32; }
        .difficulty-medium { background: #fff8e1; color: #f57c00; }
        .difficulty-hard { background: #ffebee; color: #c62828; }
        .knowledge-point {
            display: inline-block;
            background: #f0f8ff;
            color: #1976d2;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin: 2px;
        }
        .no-data {
            color: #999;
            font-style: italic;
        }
        .ai-diagnosis {
            background: #f8f9ff;
            border: 1px solid #e3e8ff;
            border-radius: 8px;
            margin-bottom: 30px;
            overflow: hidden;
        }
        .ai-diagnosis-header {
            background: #6f42c1;
            color: white;
            padding: 15px;
            font-weight: bold;
        }
        .ai-diagnosis-content {
            padding: 20px;
        }
        .ai-diagnosis-item {
            background: #f8f9fa;
            border-left: 4px solid #6f42c1;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 8px 8px 0;
        }
        .ai-diagnosis-item:last-child {
            margin-bottom: 0;
        }
        .ai-diagnosis-title {
            font-weight: bold;
            color: #6f42c1;
            margin-bottom: 8px;
        }
        .ai-diagnosis-text {
            line-height: 1.8;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>学生答卷分析报告</h1>
        <p>生成时间：${formatDate(Date.now())}</p>
    </div>

    <div class="info-section">
        <h2>基本信息</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">学生姓名：</span>
                <span>${data.student.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">学生编号：</span>
                <span>${data.student.studentCode}</span>
            </div>
            <div class="info-item">
                <span class="info-label">年级：</span>
                <span>${data.classRoom.grade}</span>
            </div>
            <div class="info-item">
                <span class="info-label">班级：</span>
                <span>${data.classRoom.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">课程：</span>
                <span>${data.course.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">科目：</span>
                <span>${data.course.subject}</span>
            </div>
            <div class="info-item">
                <span class="info-label">提交时间：</span>
                <span>${formatDate(data.studentAnswer.created)}</span>
            </div>
        </div>
    </div>

    <div class="info-section">
        <h2>题集信息</h2>
        <div class="answer-item">
            <span class="info-label">题集名称：</span>
            <span>${data.questionPack.name}</span>
        </div>
        <div class="answer-item">
            <span class="info-label">题集描述：</span>
            <span>${data.questionPack.description || '<span class="no-data">无</span>'}</span>
        </div>
        <div class="answer-item">
            <span class="info-label">总题目数：</span>
            <span>${data.questionPack.questionIds.length} 道</span>
        </div>
        <div class="answer-item">
            <span class="info-label">错题数：</span>
            <span class="student-answer">${data.answerItems.length} 道</span>
        </div>
    </div>

    ${data.studentAnswer.aiDiagnosis ? `
    <div class="ai-diagnosis">
        <div class="ai-diagnosis-header">
            🤖 AI综合诊断
        </div>
        <div class="ai-diagnosis-content">
            <div class="ai-diagnosis-item">
                <div class="ai-diagnosis-title">📈 总体表现</div>
                <div class="ai-diagnosis-text">${data.studentAnswer.aiDiagnosis.overallPerformance}</div>
            </div>
            <div class="ai-diagnosis-item">
                <div class="ai-diagnosis-title">🏆 优势保持</div>
                <div class="ai-diagnosis-text">${data.studentAnswer.aiDiagnosis.strength}</div>
            </div>
            <div class="ai-diagnosis-item">
                <div class="ai-diagnosis-title">📚 重点提升</div>
                <div class="ai-diagnosis-text">${data.studentAnswer.aiDiagnosis.improvement}</div>
            </div>
        </div>
    </div>
    ` : ""}

    <h2>错题详情分析</h2>
    ${data.answerItems.map(item => `
        <div class="question-item">
            <div class="question-header">
                第 ${getQuestionNumber(item.questionId)} 题 (${item.questionType})
                <span class="difficulty difficulty-${item.question.difficulty === "容易" ? "easy" : item.question.difficulty === "中等" ? "medium" : "hard"}">
                    ${item.question.difficulty}
                </span>
            </div>
            <div class="question-content">
                <div class="section question-info">
                    <div class="section-title">📚 题目信息</div>
                    <div class="answer-item">
                        <strong>题目内容：</strong>
                        ${item.question.questionText ? `
                            <div class="parse-content">${item.question.questionText}</div>
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>正确答案：</strong>
                        ${item.question.answer && item.question.answer.length > 0 ? `
                            <span class="correct-answer">${item.question.answer.join(", ")}</span>
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>题目解析：</strong>
                        ${item.question.parse && item.question.parse.length > 0 ? `
                            <div class="parse-content">${item.question.parse.join("<br>")}</div>
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>关联知识点：</strong>
                        ${item.question.knowledgePoints && item.question.knowledgePoints.length > 0 ? `<br>
                            ${item.question.knowledgePoints.map(point => `<span class="knowledge-point">${point}</span>`).join(" ")}
                        ` : '<span class="no-data">无</span>'}
                    </div>
                </div>

                <div class="section student-info">
                    <div class="section-title">👤 学生答卷信息</div>
                    <div class="answer-item">
                        <strong>错题图片：</strong>
                        ${item.imageUrl ? `
                            <br><img src="${item.imageUrl}" alt="第${getQuestionNumber(item.questionId)}题错题图片" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px;">
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>学生答案：</strong>
                        ${item.answerValue.length > 0 ? `
                            <div class="student-answer-content">
                                ${item.answerValue.map(line => line.trim() || "(空行)").join("<br>")}
                            </div>
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>犯错解析：</strong>
                        ${item.parse && item.parse.length > 0 ? `
                            <div class="parse-content">
                                ${item.parse.map(line => line.trim() || "(空行)").join("<br>")}
                            </div>
                        ` : '<span class="no-data">无</span>'}
                    </div>
                    <div class="answer-item">
                        <strong>学生所犯错误归因：</strong>
                        ${item.mistakePoints.length > 0 ? `
                            ${item.mistakePoints.map(point => `
                                <div class="mistake-point">
                                    <strong>${point.name}</strong>
                                    ${point.description ? `<br><small>${point.description}</small>` : ""}
                                </div>
                            `).join("")}
                        ` : '<span class="no-data">无</span>'}
                    </div>
                </div>
            </div>
        </div>
    `).join("")}
</body>
</html>
  `;
}
