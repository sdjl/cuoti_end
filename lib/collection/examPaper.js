"use server";

import { PDFDocument } from "pdf-lib";
import { addDoc, command, count, docs, getDoc, removeDoc, removeMatch, updateDoc } from "../common/database.js";
import { deleteFile, getTempFileURL, uploadFile } from "../common/file.js";
import { timestamp } from "../common/time.js";
import { batchInsertExamQuestions } from "./examQuestion.js";

/**
 * 试卷集合名
 */
const EXAM_PAPER_COLL = "exam_paper";

/**
 * 试卷页面信息集合名
 */
const EXAM_PAGE_INFO_COLL = "exam_page_info";


async function uploadPdfAndUpdateExamPaper(examId, pdfFile) {
  // 构建云存储路径
  const pdfPath = `cuoti/exam/${examId}/pdf/exam_paper.pdf`;

  // 获取PDF页数
  let pdfPageCount = 0;
  if (Buffer.isBuffer(pdfFile)) {
    try {
      const pdfDoc = await PDFDocument.load(pdfFile);
      pdfPageCount = pdfDoc.getPageCount();
    } catch (error) {
      console.error("获取PDF页数失败:", error);
    }
  }

  // 上传文件到云存储
  const uploadResult = await uploadFile(pdfPath, pdfFile);
  const pdfFileID = uploadResult.fileID;

  // 获取文件访问链接
  const tempFileURLResult = await getTempFileURL([pdfFileID]);

  // 获取文件URL
  const fileInfo = tempFileURLResult.fileList[0];
  let pdfUrl = fileInfo.tempFileURL || "";

  // pdfUrl删除?后面的内容
  if (pdfUrl.includes("?")) {
    pdfUrl = pdfUrl.split("?")[0];
  }

  // 更新试卷文档
  await updateDoc(EXAM_PAPER_COLL, examId, {
    pdfPath,
    pdfUrl,
    pdfFileID,
    pdfPageCount,
    // 添加PDF页数
    cuttingStatus: "waiting"
  });
  return {
    pdfPath,
    pdfUrl,
    pdfFileID
  };
}


export async function createExamPaper(data, pdfFile) {
  const now = timestamp();
  const examPaperData = {
    ...data,
    // 初始化PDF相关字段为空值
    pdfPath: "",
    pdfUrl: "",
    pdfFileID: "",
    created: now,
    updated: now,
    cuttingStatus: "waiting",
    cuttingError: "",
    pages: []
  };

  // 先创建试卷文档，获取ID
  const examId = await addDoc(EXAM_PAPER_COLL, examPaperData);
  try {
    // 上传PDF文件并更新试卷文档
    await uploadPdfAndUpdateExamPaper(examId, pdfFile);
    return examId;
  } catch (error) {
    // 如果PDF上传或更新失败，删除刚创建的试卷文档
    await removeDoc(EXAM_PAPER_COLL, examId);
    // 抛出错误
    throw new Error(`PDF文件处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function updateExamPaper(id, data) {
  const updateData = {
    ...data,
    updated: timestamp()
  };
  return await updateDoc(EXAM_PAPER_COLL, id, updateData);
}


export async function getExamPaperRelatedFileIDs(examPaper, includeMainDoc = true) {
  const fileIDs = [];

  // 添加试卷PDF文件ID（如果存在且需要包含主文档）
  if (includeMainDoc && examPaper.pdfFileID) {
    fileIDs.push(examPaper.pdfFileID);
  }

  // 添加试卷解析报告中的带解析PDF文件ID（如果存在）
  if (examPaper.analysisReport?.pdfWithParseFileID) {
    fileIDs.push(examPaper.analysisReport.pdfWithParseFileID);
  }

  // 遍历每一页
  if (examPaper.pages && examPaper.pages.length > 0) {
    for (const page of examPaper.pages) {
      // 添加页面PDF文件ID
      if (page.pdfFileID) {
        fileIDs.push(page.pdfFileID);
      }
      // 添加页面图片文件ID（如果存在）
      if (page.imageFileID) {
        fileIDs.push(page.imageFileID);
      }
      // 遍历页面中每个题目
      if (page.questions && page.questions.length > 0) {
        for (const question of page.questions) {
          // 添加题目图片文件ID（如果存在）
          if (question.imageFileID) {
            fileIDs.push(question.imageFileID);
          }
        }
      }
    }
  }
  return fileIDs;
}


export async function deleteExamPaper(id) {
  try {
    // 先获取试卷数据
    const examPaper = await getExamPaperById(id);
    if (!examPaper) {
      // 试卷不存在，直接返回成功
      return true;
    }

    // 获取关联文件ID列表
    const fileIDs = await getExamPaperRelatedFileIDs(examPaper);

    // 如果有关联文件，分批删除文件，每批最多20个
    if (fileIDs.length > 0) {
      const batchSize = 20;
      for (let i = 0; i < fileIDs.length; i += batchSize) {
        const batchFileIDs = fileIDs.slice(i, i + batchSize);
        await deleteFile(batchFileIDs);
      }
    }

    // 使用removeMatch批量删除关联的exam_page_info数据
    await removeMatch(EXAM_PAGE_INFO_COLL, {
      examPaperId: id
    });

    // 删除试卷数据
    return await removeDoc(EXAM_PAPER_COLL, id);
  } catch (error) {
    console.error("删除试卷失败:", error);
    throw error;
  }
}


export async function getExamPaperById(id) {
  const result = await getDoc(EXAM_PAPER_COLL, id);
  return result;
}


export async function getExamPapers({
  pageNum = 0,
  pageSize = 20,
  subject = "",
  keyword = "",
  isLocked = null
} = {}) {
  const _ = command();

  // 构建基础查询条件
  const baseWhere = {};

  // 如果有指定科目，添加科目条件
  if (subject) {
    baseWhere.subject = subject;
  }

  // 添加锁定状态筛选条件
  if (isLocked !== null) {
    baseWhere.isLocked = isLocked;
  }

  // 处理查询条件
  let queryCondition;

  // 如果有关键词，添加模糊查询
  if (keyword) {
    // 拆分关键词，支持多个关键词AND查询
    const keywords = keyword.trim().split(/\s+/);
    if (keywords.length === 1) {
      // 单个关键词 - 直接在 baseWhere 中添加
      baseWhere.title = new RegExp(`.*${keywords[0]}.*`, "i");
      queryCondition = baseWhere;
    } else {
      // 多个关键词 - 使用 command 的 and 操作符
      const titleConditions = keywords.map(key => ({
        title: new RegExp(`.*${key}.*`, "i")
      }));

      // 如果有基础条件，则添加到查询条件中
      if (Object.keys(baseWhere).length > 0) {
        queryCondition = _.and([baseWhere, ...titleConditions]);
      } else {
        // 只有标题关键词条件
        queryCondition = _.and(titleConditions);
      }
    }
  } else {
    // 没有关键词，使用基础条件
    queryCondition = baseWhere;
  }

  // 限制最大分页大小为1000
  const actualPageSize = Math.min(pageSize, 1000);
  // 查询数据
  const result = await docs({
    c: EXAM_PAPER_COLL,
    w: queryCondition,
    pageNum,
    pageSize: actualPageSize,
    orderBy: {
      created: -1
    } // 默认按创建时间降序排序
  });
  return result;
}


export async function getExamPapersCount({
  subject = "",
  keyword = "",
  isLocked = null
} = {}) {
  const _ = command();

  // 构建基础查询条件
  const baseWhere = {};

  // 如果有指定科目，添加科目条件
  if (subject) {
    baseWhere.subject = subject;
  }

  // 添加锁定状态筛选条件
  if (isLocked !== null) {
    baseWhere.isLocked = isLocked;
  }

  // 处理查询条件
  let queryCondition;

  // 如果有关键词，添加模糊查询
  if (keyword) {
    // 拆分关键词，支持多个关键词AND查询
    const keywords = keyword.trim().split(/\s+/);
    if (keywords.length === 1) {
      // 单个关键词 - 直接在 baseWhere 中添加
      baseWhere.title = new RegExp(`.*${keywords[0]}.*`, "i");
      queryCondition = baseWhere;
    } else {
      // 多个关键词 - 使用 command 的 and 操作符
      const titleConditions = keywords.map(key => ({
        title: new RegExp(`.*${key}.*`, "i")
      }));

      // 如果有基础条件，则添加到查询条件中
      if (Object.keys(baseWhere).length > 0) {
        queryCondition = _.and([baseWhere, ...titleConditions]);
      } else {
        // 只有标题关键词条件
        queryCondition = _.and(titleConditions);
      }
    }
  } else {
    // 没有关键词，使用基础条件
    queryCondition = baseWhere;
  }

  // 计数
  return await count(EXAM_PAPER_COLL, queryCondition);
}


function isQuestionValid(question) {
  // 检查必需字段是否存在且有效
  if (typeof question.questionNumber !== "number" || question.questionNumber <= 0) {
    return false;
  }

  // 检查坐标信息
  if (!question.leftTop || typeof question.leftTop.x !== "number" || typeof question.leftTop.y !== "number" || !question.rightBottom || typeof question.rightBottom.x !== "number" || typeof question.rightBottom.y !== "number") {
    return false;
  }

  // 检查可选字段是否有值（虽然类型定义为可选，但锁定时要求必须有值）
  if (!question.questionType || !question.questionText || !question.answer || !Array.isArray(question.answer) || question.answer.length === 0 || !question.parse || !Array.isArray(question.parse) || question.parse.length === 0 || !question.knowledgePoints || !Array.isArray(question.knowledgePoints) || question.knowledgePoints.length === 0 || !question.imagePath || !question.imageUrl || !question.imageFileID || typeof question.imageHeight !== "number" || question.imageHeight <= 0 || typeof question.imageWidth !== "number" || question.imageWidth <= 0) {
    return false;
  }
  return true;
}


function checkExamPaperLockConditions(examPaper) {
  const issues = [];

  // 检查试卷是否已经被锁定
  if (examPaper.isLocked) {
    issues.push("试卷已经被锁定");
    return {
      canLock: false,
      issues
    };
  }

  // 检查是否有页面数据
  if (!examPaper.pages || examPaper.pages.length === 0) {
    issues.push("试卷没有页面数据");
    return {
      canLock: false,
      issues
    };
  }
  let totalQuestionCount = 0;
  let invalidQuestionCount = 0;
  console.log("examPaper.pages", examPaper.pages);

  // 检查每一页的题目
  for (const page of examPaper.pages) {
    if (!page.questions || page.questions.length === 0) {
      issues.push(`第${page.pageNumber}页没有题目数据`);
      continue;
    }
    for (const question of page.questions) {
      totalQuestionCount++;
      if (!isQuestionValid(question)) {
        invalidQuestionCount++;
        issues.push(`第${page.pageNumber}页第${question.questionNumber}题数据不完整`);
      }
    }
  }
  if (totalQuestionCount === 0) {
    issues.push("试卷没有任何题目");
    return {
      canLock: false,
      issues
    };
  }
  if (invalidQuestionCount > 0) {
    issues.push(`共有${invalidQuestionCount}道题目数据不完整`);
    return {
      canLock: false,
      issues
    };
  }
  return {
    canLock: true,
    issues: []
  };
}


export async function lockExamPaper(examPaperId) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examPaperId);
    if (!examPaper) {
      return {
        success: false,
        message: "试卷不存在"
      };
    }

    // 检查是否符合锁定条件
    const checkResult = checkExamPaperLockConditions(examPaper);
    if (!checkResult.canLock) {
      return {
        success: false,
        message: checkResult.issues.join("；")
      };
    }

    // 批量写入题目数据到 exam_question 集合，并获取插入的题目ID数组
    const insertResult = await batchInsertExamQuestions(examPaperId, examPaper);
    if (!insertResult.success) {
      return {
        success: false,
        message: "写入题目数据失败"
      };
    }

    // 创建题目包数据并写入 question_pack 集合
    const questionPackData = {
      schoolId: null,
      // 试卷题目包为公共题目包
      subject: examPaper.subject,
      studentId: null,
      // 试卷题目包不属于特定学生
      type: "试卷",
      name: examPaper.title,
      description: examPaper.description || "",
      questionIds: insertResult.questionIds,
      examPaperId: examPaperId,
      // 关联试卷ID
      created: timestamp()
    };
    const questionPackId = await addDoc("question_pack", questionPackData);
    if (!questionPackId) {
      return {
        success: false,
        message: "创建题目包失败"
      };
    }

    // 更新试卷状态为已锁定，并记录关联的题目包ID
    const updateSuccess = await updateExamPaper(examPaperId, {
      isLocked: true,
      questionPackId: questionPackId // 记录关联的题目包ID
    });
    if (!updateSuccess) {
      return {
        success: false,
        message: "更新试卷锁定状态失败"
      };
    }
    return {
      success: true,
      message: "试卷锁定成功"
    };
  } catch (error) {
    console.error("锁定试卷失败:", error);
    return {
      success: false,
      message: `锁定失败：${error instanceof Error ? error.message : String(error)}`
    };
  }
}


export async function updateExamPaperStatistics(examId) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      return {
        success: false,
        message: "试卷不存在"
      };
    }

    // 计算统计数据
    let missingAnswerCount = 0;
    let missingParseCount = 0;
    let missingKnowledgePointCount = 0;
    let missingCoordinateCount = 0;

    // 统计每个题目的缺失数据
    for (const page of examPaper.pages) {
      for (const question of page.questions) {
        if (question.questionText) {
          // 检查缺失答案
          if (!question.answer || question.answer.length === 0 || question.answer.filter(item => item.trim()).length === 0) {
            missingAnswerCount++;
          }

          // 检查缺失解析
          if (!question.parse || question.parse.length === 0 || question.parse.filter(item => item.trim()).length === 0) {
            missingParseCount++;
          }

          // 检查缺失知识点
          if (!question.knowledgePoints || question.knowledgePoints.length === 0) {
            missingKnowledgePointCount++;
          }

          // 检查缺失坐标信息
          const hasValidLeftTop = question.leftTop && typeof question.leftTop.x === "number" && typeof question.leftTop.y === "number";
          const hasValidRightBottom = question.rightBottom && typeof question.rightBottom.x === "number" && typeof question.rightBottom.y === "number";
          if (!hasValidLeftTop || !hasValidRightBottom) {
            missingCoordinateCount++;
          }
        }
      }
    }

    // 更新试卷统计数据
    const updateData = {
      "analysisReport.missingAnswerCount": missingAnswerCount,
      "analysisReport.missingParseCount": missingParseCount,
      "analysisReport.missingKnowledgePointCount": missingKnowledgePointCount,
      "analysisReport.missingCoordinateCount": missingCoordinateCount
    };
    const updateSuccess = await updateExamPaper(examId, updateData);
    if (!updateSuccess) {
      return {
        success: false,
        message: "更新统计数据失败"
      };
    }
    return {
      success: true,
      message: "统计数据更新成功",
      statistics: {
        missingAnswerCount,
        missingParseCount,
        missingKnowledgePointCount,
        missingCoordinateCount
      }
    };
  } catch (error) {
    console.error("更新试卷统计数据失败:", error);
    return {
      success: false,
      message: `更新失败：${error instanceof Error ? error.message : String(error)}`
    };
  }
}
