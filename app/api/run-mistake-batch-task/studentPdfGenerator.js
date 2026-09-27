import path from "node:path";
import { allDocs, command, getDoc, updateDoc, updateMatch } from "../../../lib/common/database.js";
import { getFileURL, uploadFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { createAnswerPdfBytes, createMistakePdfBytes } from "./pdfOperations.js";
import { HEADER_QR_CODE_SIZE, InsufficientMemoryError, MAX_IMAGE_SIZE, MAX_RETRY_COUNT, MAX_STUDENTS_PER_RUN, PDF_IMAGE_JPEG_QUALITY, SHOW_HEADER_ON_NON_FIRST_PAGE, STUDENT_PDF_QR_CODE_BASE_URL, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 并不需要在这个文件中把生成状态改成failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试生成
 */

/**
 * 原子性地获取并标记等待中的学生PDF记录为生成中状态
 * 使用处理令牌（processingToken）避免并发冲突
 * 返回实际被成功标记的学生PDF记录（完整数据）
 */
export async function atomicGetAndMarkStudentPdfs() {
  const _ = command();

  // 1. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 2. 查询等待中的学生PDF记录（只获取ID，减少数据传输）
  const waitingPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      status: "waiting",
      processingToken: ""
    },
    sort: {
      created: 1
    },
    // 按创建时间升序，先处理早创建的
    limit: MAX_STUDENTS_PER_RUN,
    only: "_id"
  });
  if (waitingPdfs.length === 0) {
    return [];
  }
  const pdfIds = waitingPdfs.map(pdf => pdf._id);

  // 3. 原子性地更新：只更新processingToken为空字符串的文档
  // 这样即使多个实例同时尝试更新，也只有一个能成功
  await updateMatch("mistake_batch_student_pdf", {
    _id: _.in(pdfIds),
    status: "waiting",
    processingToken: "" // 关键：只更新processingToken为空的文档
  }, {
    status: "generating",
    processingToken,
    // 设置为当前实例的唯一令牌
    startTime: Date.now()
  });

  // 4. 根据processingToken查询被当前实例成功标记的文档（完整数据）
  return await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      status: "generating",
      processingToken // 只查询带有当前实例令牌的文档
    }
  });
}

/**
 * 处理学生PDF生成任务（逐一生成）
 * 注意：腾讯云托管限制最多运行60秒，因此不一定能成功生成所有PDF
 * 所以在生成PDF的时候，成功生成一个PDF就要更新一次数据库
 */
export async function processStudentPdfs({
  studentPdfs,
  signal
}) {
  // 提前收集所有需要的IDs，避免在循环中多次查询数据库
  const studentIds = [...new Set(studentPdfs.map(pdf => pdf.studentId))];
  const classIds = [...new Set(studentPdfs.map(pdf => pdf.classId))];
  const taskIds = [...new Set(studentPdfs.map(pdf => pdf.taskId))];
  const questionIdSets = studentPdfs.map(pdf => pdf.questionIds);
  const allQuestionIds = [...new Set(questionIdSets.flat())];

  // 一次性读取所有学生数据（仅读取需要的字段）
  const _ = command();
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    only: "_id,name,studentCode"
  });
  const studentsMap = new Map(students.map(s => [s._id, s]));

  // 一次性读取所有班级数据（仅读取需要的字段）
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    },
    only: "_id,name,schoolId"
  });
  const classroomsMap = new Map(classrooms.map(c => [c._id, c]));

  // 一次性读取所有学校数据（仅读取需要的字段）
  const schoolIds = [...new Set(classrooms.map(c => c.schoolId))];
  const schools = await allDocs({
    c: "school",
    match: {
      _id: _.in(schoolIds)
    },
    only: "_id,name"
  });
  const schoolsMap = new Map(schools.map(s => [s._id, s]));

  // 一次性读取所有题目数据（仅读取需要的字段：imageUrl用于错题PDF，answer、parse、answerImage、parseImage用于答案PDF）
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(allQuestionIds)
    },
    only: "_id,imageUrl,answer,parse,answerImage,parseImage"
  });
  const questionsMap = new Map(questions.map(q => [q._id, q]));

  // 一次性读取所有任务数据（仅读取需要的字段：taskName）
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      _id: _.in(taskIds)
    },
    only: "_id,taskName"
  });
  const tasksMap = new Map(tasks.map(t => [t._id, t]));

  // 逐个处理学生PDF生成
  for (const studentPdf of studentPdfs) {
    // 检查是否已超时
    throwIfAborted(signal);
    await generatePdfForStudent({
      studentPdf,
      studentsMap,
      classroomsMap,
      schoolsMap,
      questionsMap,
      tasksMap,
      signal
    });
  }
}

/**
 * 为某个学生生成PDF
 */
async function generatePdfForStudent({
  studentPdf,
  studentsMap,
  classroomsMap,
  schoolsMap,
  questionsMap,
  tasksMap,
  signal
}) {
  // 检查是否已超时
  throwIfAborted(signal);

  // 重新获取最新的记录状态
  const latestPdf = await getDoc("mistake_batch_student_pdf", studentPdf._id, {
    only: "status"
  });

  // 如果不是生成中，不再继续处理（例如用户在网站中改成了清理状态）
  if (latestPdf?.status !== "generating") {
    return;
  }

  // 再次检查是否已超时（在数据库查询后）
  throwIfAborted(signal);
  try {
    // 执行PDF生成
    await generateMistakePdfsForStudent({
      studentPdf,
      studentsMap,
      classroomsMap,
      schoolsMap,
      questionsMap,
      tasksMap,
      signal
    });
  } catch (error) {
    // 如果是内存不足错误，直接标记为失败且不再重试
    if (error instanceof InsufficientMemoryError) {
      await updateDoc("mistake_batch_student_pdf", studentPdf._id, {
        status: "failed",
        retryCount: MAX_RETRY_COUNT,
        failureReason: error.message,
        processingToken: ""
      });
      return;
    }
    // 其他错误继续抛出，由超时检查机制处理
    throw error;
  }
}

/**
 * 为一个学生生成错题PDF和答案PDF
 */
async function generateMistakePdfsForStudent({
  studentPdf,
  studentsMap,
  classroomsMap,
  schoolsMap,
  questionsMap,
  tasksMap,
  signal
}) {
  throwIfAborted(signal);

  // 从Map中获取学生和班级信息（不再需要查询数据库）
  const student = studentsMap.get(studentPdf.studentId);
  const classroom = classroomsMap.get(studentPdf.classId);
  if (!student || !classroom) {
    throw new Error("学生或班级信息不存在");
  }
  throwIfAborted(signal);

  // 从Map中获取学校信息（不再需要查询数据库）
  const school = schoolsMap.get(classroom.schoolId);

  // 从Map中获取题目数据（不再需要查询数据库）
  const questions = studentPdf.questionIds.map(id => questionsMap.get(id)).filter(q => q !== undefined);
  throwIfAborted(signal);

  // 从Map中获取任务信息（不再需要查询数据库）
  const task = tasksMap.get(studentPdf.taskId);
  if (!task) {
    throw new Error("任务信息不存在");
  }
  throwIfAborted(signal);

  // 准备PDF生成配置
  const pdfConfig = {
    maxImageSize: MAX_IMAGE_SIZE,
    jpegQuality: PDF_IMAGE_JPEG_QUALITY,
    showHeaderOnNonFirstPage: SHOW_HEADER_ON_NON_FIRST_PAGE,
    fontPath: path.join(process.cwd(), "public/font/SourceHanSerifSC-Regular.otf"),
    qrcodePath: path.join(process.cwd(), "public/images/user/index/qrcode.jpg"),
    headerQrCodeSize: HEADER_QR_CODE_SIZE,
    studentPdfQrCodeBaseUrl: STUDENT_PDF_QR_CODE_BASE_URL
  };

  // 准备学生数据
  const studentData = {
    studentName: student.name,
    studentCode: student.studentCode,
    schoolName: school?.name || "",
    className: classroom.name,
    questions,
    studentPdfId: studentPdf._id,
    taskName: task.taskName
  };

  // 生成错题PDF
  const mistakePdfResult = await generateMistakePdf({
    studentPdf,
    studentData,
    pdfConfig,
    signal
  });
  throwIfAborted(signal);

  // 生成答案PDF
  const answerPdfResult = await generateAnswerPdf({
    studentPdf,
    studentData,
    pdfConfig,
    signal
  });

  // 更新数据库记录
  await updateDoc("mistake_batch_student_pdf", studentPdf._id, {
    status: "completed",
    mistakePdf: mistakePdfResult,
    answerPdf: answerPdfResult,
    completedTime: Date.now()
  });
}

/**
 * 生成错题PDF
 */
async function generateMistakePdf({
  studentPdf,
  studentData,
  pdfConfig,
  signal
}) {
  throwIfAborted(signal);

  // 调用纯PDF生成函数
  const {
    pdfBytes,
    fileSize
  } = await createMistakePdfBytes({
    studentData,
    config: pdfConfig,
    onProgress: () => {
      // 检查是否已超时
      throwIfAborted(signal);
    }
  });

  // 生成文件路径和文件名（添加时间戳避免CDN缓存）
  const timestamp = Date.now();
  const fileName = `${studentData.taskName}-${studentData.studentName}-错题集-${timestamp}.pdf`;
  const filePath = `cuoti/mistake_batch/${studentPdf.taskId}/student/${studentPdf.studentId}/${fileName}`;

  // 上传到云存储
  const uploadResult = await uploadFile(filePath, Buffer.from(pdfBytes));
  const fileUrl = await getFileURL(uploadResult.fileID);
  return {
    filePath,
    fileUrl,
    fileID: uploadResult.fileID,
    fileSize
  };
}

/**
 * 生成答案PDF
 */
async function generateAnswerPdf({
  studentPdf,
  studentData,
  pdfConfig,
  signal
}) {
  throwIfAborted(signal);

  // 调用纯PDF生成函数
  const {
    pdfBytes,
    fileSize
  } = await createAnswerPdfBytes({
    studentData,
    config: pdfConfig,
    onProgress: () => {
      // 检查是否已超时
      throwIfAborted(signal);
    }
  });

  // 生成文件路径和文件名（添加时间戳避免CDN缓存）
  const timestamp = Date.now();
  const fileName = `${studentData.taskName}-${studentData.studentName}-答案-${timestamp}.pdf`;
  const filePath = `cuoti/mistake_batch/${studentPdf.taskId}/student/${studentPdf.studentId}/${fileName}`;

  // 上传到云存储
  const uploadResult = await uploadFile(filePath, Buffer.from(pdfBytes));
  const fileUrl = await getFileURL(uploadResult.fileID);
  return {
    filePath,
    fileUrl,
    fileID: uploadResult.fileID,
    fileSize
  };
}
