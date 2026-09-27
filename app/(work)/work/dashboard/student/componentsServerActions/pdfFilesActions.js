"use server";

/**
 * PDF文件列表组件的 Server Actions
 *
 * 用于组件：
 * - app/(work)/work/dashboard/student/components/PDFFilesList.tsx
 *
 * 功能：
 * - 获取学生的课程错题集PDF文件列表
 * - 获取学生的知识点定制题集PDF文件列表（待实现）
 * - 显示PDF生成状态、下载状态、重新提交答案状态等
 *
 * 数据来源：
 * - MistakeBatchStudentPdfDoc: 学生PDF生成记录
 * - MistakeBatchTaskDoc: 批量生成任务信息
 */
import { getClassroomsByIds, getMistakeBatchTasksByIds, getQuestionPacksByIds, getStudentAllMistakeBatchPdfs, getStudentKnowledgeQuestionPacks, getStudentMistakeBatchPdfs } from "../datas.js";

/**
 * 课程错题集PDF文件信息
 */

/**
 * 知识点定制题集信息
 */

/**
 * 学生的任务信息（用于选择）
 */


export async function getMistakeBatchPdfsAction(studentId, subject, limit) {
  try {
    // 1. 获取学生的PDF记录
    const pdfRecords = await getStudentMistakeBatchPdfs(studentId, subject, limit);
    if (pdfRecords.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有任务信息
    const taskIds = [...new Set(pdfRecords.map(pdf => pdf.taskId))];
    const tasks = await getMistakeBatchTasksByIds(taskIds);

    // 创建任务映射
    const tasksMap = new Map(tasks.map(task => [task._id, task]));

    // 3. 获取所有班级信息
    const classIds = [...new Set(pdfRecords.map(pdf => pdf.classId).filter(id => !!id))];
    const classrooms = classIds.length > 0 ? await getClassroomsByIds(classIds) : [];
    const classroomsMap = new Map(classrooms.map(cls => [cls._id, cls]));

    // 4. 获取所有题集信息
    const questionPackIds = [...new Set(pdfRecords.flatMap(pdf => pdf.questionPackIds || []))];
    const questionPacks = questionPackIds.length > 0 ? await getQuestionPacksByIds(questionPackIds) : [];
    const questionPacksMap = new Map(questionPacks.map(qp => [qp._id, qp]));

    // 5. 组装数据
    const pdfInfoList = pdfRecords.map(pdf => {
      const task = tasksMap.get(pdf.taskId);
      const classroom = classroomsMap.get(pdf.classId);

      // 获取题集列表
      const packs = (pdf.questionPackIds || []).map(qpId => {
        const qp = questionPacksMap.get(qpId);
        return qp ? {
          _id: qp._id,
          name: qp.name
        } : null;
      }).filter(qp => qp !== null);
      return {
        _id: pdf._id,
        taskId: pdf.taskId,
        taskName: task?.taskName || "未知任务",
        className: classroom?.name || "未知班级",
        status: pdf.status,
        mistakeCount: pdf.mistakeCount,
        created: pdf.created,
        hasDownloadedMistakePdf: pdf.hasDownloadedMistakePdf || false,
        hasResubmittedAnswer: pdf.hasResubmittedAnswer || false,
        mistakePdfUrl: pdf.mistakePdf?.fileUrl,
        answerPdfUrl: pdf.answerPdf?.fileUrl,
        questionPacks: packs
      };
    });
    return {
      success: true,
      data: pdfInfoList
    };
  } catch (error) {
    console.error("获取课程错题集PDF列表失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getKnowledgeQuestionPacksAction(studentId, subject, limit) {
  try {
    // 1. 获取学生的知识点定制题集
    const questionPacks = await getStudentKnowledgeQuestionPacks(studentId, subject, limit);
    if (questionPacks.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classIds = [...new Set(questionPacks.map(qp => qp.classId).filter(id => !!id))];
    const classrooms = classIds.length > 0 ? await getClassroomsByIds(classIds) : [];

    // 创建班级映射
    const classroomsMap = new Map(classrooms.map(cls => [cls._id, cls]));

    // 3. 组装数据
    const packInfoList = questionPacks.map(pack => {
      const classroom = pack.classId ? classroomsMap.get(pack.classId) : undefined;
      return {
        _id: pack._id,
        name: pack.name,
        classId: pack.classId,
        className: classroom?.name || "未知班级",
        questionCount: pack.questionIds?.length || 0,
        created: pack.created,
        questionsPdfUrl: pack.questionsPdf?.fileUrl,
        answersPdfUrl: pack.answersPdf?.fileUrl
      };
    });
    return {
      success: true,
      data: packInfoList
    };
  } catch (error) {
    console.error("获取知识点定制题集列表失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getStudentTasksAction(studentId, subject, limit = 5) {
  try {
    // 1. 获取学生的所有PDF记录
    const pdfRecords = await getStudentAllMistakeBatchPdfs(studentId, subject);
    if (pdfRecords.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取唯一的任务ID列表
    const taskIds = [...new Set(pdfRecords.map(pdf => pdf.taskId))];

    // 3. 获取所有任务信息
    const tasks = await getMistakeBatchTasksByIds(taskIds);

    // 4. 按创建时间降序排序，取最近的N个任务
    const sortedTasks = tasks.sort((a, b) => b.created - a.created).slice(0, limit);

    // 5. 组装数据
    const taskInfoList = sortedTasks.map(task => ({
      _id: task._id,
      taskName: task.taskName,
      created: task.created
    }));
    return {
      success: true,
      data: taskInfoList
    };
  } catch (error) {
    console.error("获取学生任务列表失败:", error);
    return {
      success: false,
      data: []
    };
  }
}
