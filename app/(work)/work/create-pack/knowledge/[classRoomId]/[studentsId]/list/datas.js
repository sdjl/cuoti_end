"use server";

import { getClassRoomById } from "../../../../../../../../lib/collection/classroom.js";
import { getStudentById } from "../../../../../../../../lib/collection/student.js";
import { allDocs, command, getDoc, getOne, removeDoc, removeMatch, updateDoc } from "../../../../../../../../lib/common/database.js";
import { deleteFile } from "../../../../../../../../lib/common/file.js";
import { deletePdfFile, generateAnswersPdf, generateQuestionsPdf } from "./pdfOperations.js";

/**
 * 获取学生和班级信息
 */
export async function getStudentAndClassroomData(studentId, classRoomId) {
  try {
    const [student, classroom] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId)]);
    if (!student) {
      return {
        success: false,
        error: "学生信息不存在"
      };
    }
    if (!classroom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }

    // 获取学校信息
    const school = await getDoc("school", classroom.schoolId);
    const schoolName = school?.name || "未知学校";
    return {
      success: true,
      data: {
        student,
        classroom,
        schoolName
      }
    };
  } catch (error) {
    console.error("获取学生和班级信息失败:", error);
    return {
      success: false,
      error: "获取学生和班级信息失败"
    };
  }
}

/**
 * 获取学生的定制题集列表，包含答卷状态
 */
export async function getStudentCustomQuestionPacks(studentId, classRoomId, subjectFilter, hasAnswerFilter, searchTerm, hasQuestionsPdfFilter, hasAnswersPdfFilter, isAnalysisCompletedFilter) {
  try {
    // 获取班级信息来获得schoolId
    const classroom = await getClassRoomById(classRoomId);
    if (!classroom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }

    // 构建查询条件
    const match = {
      schoolId: classroom.schoolId,
      classId: classRoomId,
      studentId: studentId,
      type: "知识点"
    };

    // 添加学科过滤
    if (subjectFilter) {
      match.subject = subjectFilter;
    }

    // 查询该学生的定制题集（type=知识点）
    const questionPacks = await allDocs({
      c: "question_pack",
      match,
      sort: {
        created: -1
      } // 按创建时间倒序排列
    });

    // 一次性查询所有题集的答卷状态
    const _ = command();
    const studentAnswers = questionPacks.length > 0 ? await allDocs({
      c: "student_answer",
      match: {
        studentId,
        classId: classRoomId,
        courseId: "",
        // 定制题集courseId为空
        questionPackId: _.in(questionPacks.map(p => p._id))
      }
    }) : [];

    // 构建答卷状态映射
    const answerStatusMap = new Map(studentAnswers.map(answer => [answer.questionPackId, {
      studentAnswerId: answer._id,
      isAnalysisCompleted: answer.isAnalysisCompleted || false
    }]));

    // 合并数据
    let result = questionPacks.map(pack => {
      const answerInfo = answerStatusMap.get(pack._id);
      return {
        ...pack,
        hasAnswer: answerStatusMap.has(pack._id),
        studentAnswerId: answerInfo?.studentAnswerId || null,
        isAnalysisCompleted: answerInfo?.isAnalysisCompleted || false
      };
    });

    // 应用答卷状态过滤
    if (hasAnswerFilter !== undefined) {
      result = result.filter(pack => pack.hasAnswer === hasAnswerFilter);
    }

    // 应用文本搜索过滤
    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(pack => pack.name.toLowerCase().includes(searchLower) || pack.description.toLowerCase().includes(searchLower) || pack.subject.toLowerCase().includes(searchLower));
    }

    // 应用题目PDF过滤
    if (hasQuestionsPdfFilter !== undefined) {
      result = result.filter(pack => !!pack.questionsPdf === hasQuestionsPdfFilter);
    }

    // 应用答案PDF过滤
    if (hasAnswersPdfFilter !== undefined) {
      result = result.filter(pack => !!pack.answersPdf === hasAnswersPdfFilter);
    }

    // 应用分析状态过滤
    if (isAnalysisCompletedFilter !== undefined) {
      result = result.filter(pack => pack.isAnalysisCompleted === isAnalysisCompletedFilter);
    }
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("获取定制题集列表失败:", error);
    return {
      success: false,
      error: "获取定制题集列表失败"
    };
  }
}

/**
 * 删除题集
 */
export async function deleteQuestionPackData(questionPackId) {
  try {
    // 先获取题集信息，检查是否有PDF文件需要删除
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack) {
      return {
        success: false,
        error: "题集不存在"
      };
    }

    // 删除题目PDF文件（如果存在）
    if (questionPack.questionsPdf) {
      try {
        const deleteResult = await deletePdfFile(questionPack.questionsPdf.fileId);
        if (!deleteResult.success) {
          console.error("删除题目PDF文件失败:", deleteResult.error);
        }
      } catch (error) {
        console.error("删除题目PDF文件失败:", error);
      }
    }

    // 删除答案PDF文件（如果存在）
    if (questionPack.answersPdf) {
      try {
        const deleteResult = await deletePdfFile(questionPack.answersPdf.fileId);
        if (!deleteResult.success) {
          console.error("删除答案PDF文件失败:", deleteResult.error);
        }
      } catch (error) {
        console.error("删除答案PDF文件失败:", error);
      }
    }

    // 删除数据库记录
    const result = await removeDoc("question_pack", questionPackId);
    if (result) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "删除失败，题集可能不存在"
      };
    }
  } catch (error) {
    console.error("删除题集失败:", error);
    return {
      success: false,
      error: "删除题集失败"
    };
  }
}

/**
 * 删除学生答卷及所有关联数据（包括图片文件）
 */
export async function deleteStudentAnswerData(studentId, classRoomId, questionPackId) {
  try {
    // 查找学生答卷记录
    const studentAnswer = await getOne("student_answer", {
      studentId,
      classId: classRoomId,
      courseId: "",
      // 定制题集courseId为空
      questionPackId
    });
    if (!studentAnswer) {
      return {
        success: false,
        error: "答卷不存在"
      };
    }
    const studentAnswerId = studentAnswer._id;

    // 获取所有答卷项目（包含图片信息）
    const answerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId
      }
    });

    // 收集所有需要删除的图片文件ID
    const imageFileIDs = answerItems.filter(item => item.imageFileID).map(item => item.imageFileID);
    let deletedImageCount = 0;
    // 批量删除图片文件
    if (imageFileIDs.length > 0) {
      try {
        const deleteResult = await deleteFile(imageFileIDs);
        deletedImageCount = deleteResult.fileList?.length || 0;
      } catch (error) {
        console.error("批量删除图片文件失败:", error);
        // 图片删除失败不应阻止数据库数据的删除
      }
    }

    // 删除答卷项目和错误归因关联数据
    const [deletedItemCount] = await Promise.all([removeMatch("student_answer_item", {
      studentAnswerId
    }), removeMatch("mistake_point_question", {
      studentId,
      classId: classRoomId,
      courseId: "",
      questionPackId
    })]);

    // 删除答卷记录
    await removeDoc("student_answer", studentAnswerId);
    return {
      success: true,
      deletedItemCount,
      deletedImageCount
    };
  } catch (error) {
    console.error("删除学生答卷失败:", error);
    return {
      success: false,
      error: "删除答卷失败"
    };
  }
}

/**
 * 生成题目PDF并保存到云存储
 */
export async function generateQuestionsPdfData(studentId, classRoomId, questionPackId) {
  try {
    // 调用PDF操作函数生成PDF
    const pdfResult = await generateQuestionsPdf(studentId, classRoomId, questionPackId);
    if (!pdfResult.success || !pdfResult.data) {
      return {
        success: false,
        error: pdfResult.error || "生成PDF失败"
      };
    }

    // 更新题集记录
    const pdfInfo = {
      fileId: pdfResult.data.fileId,
      fileUrl: pdfResult.data.fileUrl,
      filePath: pdfResult.data.filePath,
      createdAt: Date.now()
    };
    await updateDoc("question_pack", questionPackId, {
      questionsPdf: pdfInfo
    });
    return {
      success: true,
      data: pdfResult.data
    };
  } catch (error) {
    console.error("生成题目PDF失败:", error);
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 生成答案PDF并保存到云存储
 */
export async function generateAnswersPdfData(studentId, classRoomId, questionPackId) {
  try {
    // 调用PDF操作函数生成PDF
    const pdfResult = await generateAnswersPdf(studentId, classRoomId, questionPackId);
    if (!pdfResult.success || !pdfResult.data) {
      return {
        success: false,
        error: pdfResult.error || "生成PDF失败"
      };
    }

    // 更新题集记录
    const pdfInfo = {
      fileId: pdfResult.data.fileId,
      fileUrl: pdfResult.data.fileUrl,
      filePath: pdfResult.data.filePath,
      createdAt: Date.now()
    };
    await updateDoc("question_pack", questionPackId, {
      answersPdf: pdfInfo
    });
    return {
      success: true,
      data: pdfResult.data
    };
  } catch (error) {
    console.error("生成答案PDF失败:", error);
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 删除题目PDF
 */
export async function deleteQuestionsPdfData(questionPackId) {
  try {
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack || !questionPack.questionsPdf) {
      return {
        success: false,
        error: "PDF文件不存在"
      };
    }

    // 删除云存储文件
    const deleteResult = await deletePdfFile(questionPack.questionsPdf.fileId);
    if (!deleteResult.success) {
      console.error("删除云存储文件失败:", deleteResult.error);
    }

    // 更新题集记录
    await updateDoc("question_pack", questionPackId, {
      questionsPdf: command().remove()
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("删除题目PDF失败:", error);
    return {
      success: false,
      error: "删除PDF失败"
    };
  }
}

/**
 * 删除答案PDF
 */
export async function deleteAnswersPdfData(questionPackId) {
  try {
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack || !questionPack.answersPdf) {
      return {
        success: false,
        error: "PDF文件不存在"
      };
    }

    // 删除云存储文件
    const deleteResult = await deletePdfFile(questionPack.answersPdf.fileId);
    if (!deleteResult.success) {
      console.error("删除云存储文件失败:", deleteResult.error);
    }

    // 更新题集记录
    await updateDoc("question_pack", questionPackId, {
      answersPdf: command().remove()
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("删除答案PDF失败:", error);
    return {
      success: false,
      error: "删除PDF失败"
    };
  }
}

/**
 * 更新题集基本信息
 */
export async function updateQuestionPackInDB(questionPackId, name, description) {
  return await updateDoc("question_pack", questionPackId, {
    name,
    description,
    updated: Date.now()
  });
}
