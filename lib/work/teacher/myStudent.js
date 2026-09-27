"use server";

import { getMultiStudentMistakePoints, getStudentMistakePoints, updateMistakePointQuestions } from "../../collection/mistake.js";
import { addStudentToClass, createStudent, getStudentByCode, removeStudentFromClass, updateStudent } from "../../collection/student.js";
import { addDoc, addDocList, allDocs, command, count, docs, getDoc, getOne, removeDoc, removeMatch, updateDoc } from "../../common/database.js";
import { deleteFile } from "../../common/file.js";
import { getMyStudentById as _getMyStudentById, updateMyStudent as _updateMyStudent } from "../principal/myStudent.js";
import { getCurrentSchoolId } from "./mySchool.js";


export async function createMyStudent(classRoomId, studentData, notes, status = "在读") {
  const schoolId = await getCurrentSchoolId();

  // 检查studentCode是否为空
  if (!studentData.studentCode || studentData.studentCode.trim() === "") {
    throw new Error("学生编号不能为空");
  }

  // 先根据studentCode查找现有学生
  const existingStudent = await getStudentByCode(schoolId, studentData.studentCode);
  let studentId;
  if (existingStudent) {
    // 如果学生已存在，使用现有学生ID
    studentId = existingStudent._id;
    // 更新学生
    await updateStudent(studentId, studentData);
  } else {
    // 如果学生不存在，创建新学生
    studentId = await createStudent({
      ...studentData,
      schoolId
    });
  }

  // 将学生加入班级
  await addStudentToClass(studentId, classRoomId, notes, status);
  return studentId;
}


export async function addStudentToMyClass(studentId, classRoomId, notes, status = "在读") {
  const relationId = await addStudentToClass(studentId, classRoomId, notes, status);
  return relationId;
}


export async function removeStudentFromMyClass(studentId, classRoomId) {
  const removedCount = await removeStudentFromClass(studentId, classRoomId);
  return removedCount;
}


export async function removeStudentsFromMyClassBatch(studentIds, classRoomId) {
  if (studentIds.length === 0) {
    return 0;
  }
  const _ = command();

  // 批量删除学生班级关系
  const removedCount = await removeMatch("student_class", {
    studentId: _.in(studentIds),
    classRoomId: classRoomId
  });
  return removedCount;
}


export const getMyStudentById = _getMyStudentById;


export const updateMyStudent = _updateMyStudent;


export async function getClassStudents(classRoomId) {
  try {
    // 第一步：使用 allDocs 读取 student_class 中某个班级的所有关系
    const studentClassList = await allDocs({
      c: "student_class",
      match: {
        classRoomId: classRoomId
      }
    });

    // 如果没有学生关系，直接返回空数组
    if (studentClassList.length === 0) {
      return [];
    }

    // 第二步：得到所有学生的 ID
    const studentIds = studentClassList.map(sc => sc.studentId);

    // 第三步：使用 allDocs 去 student 读取所有学生的数据
    const _ = command();
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      }
    });

    // 第四步：把学生数据和关系关联在一起
    const studentsWithClass = students.map(student => {
      const studentClass = studentClassList.find(sc => sc.studentId === student._id);
      return {
        ...student,
        studentClass: studentClass
      };
    });

    // 按学生姓名排序
    studentsWithClass.sort((a, b) => a.name.localeCompare(b.name));
    return studentsWithClass;
  } catch (error) {
    console.error("获取班级学生列表失败:", error);
    throw new Error("获取班级学生列表失败");
  }
}


export async function getStudentByCodeInSchool(studentCode) {
  try {
    const schoolId = await getCurrentSchoolId();

    // 根据学生编号和学校ID查询学生
    const student = await getStudentByCode(schoolId, studentCode);
    return student;
  } catch (error) {
    console.error("查询学生失败:", error);
    return null;
  }
}


export async function isStudentInClass(studentId, classRoomId) {
  try {
    const result = await getOne("student_class", {
      studentId,
      classRoomId
    });
    return result !== null;
  } catch (error) {
    console.error("检查学生是否在班级失败:", error);
    return false;
  }
}


export async function checkStudentCodesDistribution(classRoomId, studentCodes) {
  try {
    // 检查学生编号是否有重复或空字符串
    const trimmedCodes = studentCodes.map(code => String(code).trim());

    // 过滤掉空字符串
    const validCodes = trimmedCodes.filter(code => code !== "");
    if (validCodes.length === 0) {
      return {
        notInSchool: [],
        inSchoolNotInClass: [],
        inSchoolAndInClass: []
      };
    }

    // 检查重复编号
    const uniqueCodes = [...new Set(validCodes)];
    const schoolId = await getCurrentSchoolId();

    // 获取当前校园中所有学生
    const _ = command();
    const allStudentsInSchool = await allDocs({
      c: "student",
      match: {
        schoolId: schoolId,
        studentCode: _.in(uniqueCodes)
      }
    });

    // 获取班级中的所有学生关系
    const studentClassRelations = await allDocs({
      c: "student_class",
      match: {
        classRoomId: classRoomId,
        status: "在读"
      }
    });

    // 提取班级中学生的ID
    const studentIdsInClass = new Set(studentClassRelations.map(relation => relation.studentId));

    // 找到校园中的学生编号
    const foundStudentCodes = new Set(allStudentsInSchool.map(student => student.studentCode));

    // 1. 校园中没有的学生编号
    const notInSchool = uniqueCodes.filter(code => !foundStudentCodes.has(code));

    // 2. 在校园中但不在班级中的学生
    const inSchoolNotInClass = allStudentsInSchool.filter(student => !studentIdsInClass.has(student._id));

    // 3. 在校园中且在班级中的学生
    const inSchoolAndInClass = allStudentsInSchool.filter(student => studentIdsInClass.has(student._id));

    // 构造结果对象
    const result = {
      notInSchool,
      inSchoolNotInClass,
      inSchoolAndInClass
    };
    return result;
  } catch (error) {
    console.error("检查学生编号分布失败:", error);
    return {
      notInSchool: [],
      inSchoolNotInClass: [],
      inSchoolAndInClass: []
    };
  }
}


export async function createMyStudentBatch(classRoomId, studentsData, status = "在读") {
  try {
    const schoolId = await getCurrentSchoolId();

    // 验证所有学生编号都不为空
    if (studentsData.some(s => !s.studentCode || s.studentCode.trim() === "")) {
      throw new Error("学生编号不能为空");
    }

    // 提取所有学生编号
    const studentCodes = studentsData.map(s => s.studentCode);

    // 检查学校中是否已存在这些学生编号
    const _ = command();
    const existingStudents = await allDocs({
      c: "student",
      match: {
        schoolId,
        studentCode: _.in(studentCodes)
      }
    });
    const existingStudentCodeMap = new Map(existingStudents.map(student => [student.studentCode, student._id]));

    // 准备要新增的学生数据
    const timestamp = Date.now();
    const newStudentsData = studentsData.filter(s => !existingStudentCodeMap.has(s.studentCode)).map(s => ({
      ...s,
      schoolId,
      created: timestamp,
      updated: timestamp
    }));

    // 批量插入新学生数据
    let addedStudentIds = [];
    if (newStudentsData.length > 0) {
      const result = await addDocList("student", newStudentsData.map(s => ({
        ...s,
        notes: "" // 导入学生数据时不写入notes，这个notes会写入班级关系中
      })));
      addedStudentIds = result.ids;
    }

    // 准备所有学生与班级的关联数据
    const studentClassRelations = [];

    // 添加已存在的学生关系
    for (const student of existingStudents) {
      const studentData = studentsData.find(s => s.studentCode === student.studentCode);
      studentClassRelations.push({
        studentId: student._id,
        classRoomId,
        status,
        notes: studentData?.notes || ""
      });
    }

    // 添加新学生关系
    for (let i = 0; i < addedStudentIds.length; i++) {
      const studentData = newStudentsData[i];
      studentClassRelations.push({
        studentId: addedStudentIds[i],
        classRoomId,
        status,
        notes: studentData.notes || ""
      });
    }

    // 批量插入学生与班级关系
    if (studentClassRelations.length > 0) {
      await addDocList("student_class", studentClassRelations);
    }
    return {
      added: addedStudentIds,
      existing: existingStudents.map(s => s._id)
    };
  } catch (error) {
    console.error("批量创建学生失败:", error);
    throw new Error("批量创建学生失败");
  }
}


export async function addStudentToMyClassBatch(studentIds, classRoomId, notes = "", status = "在读") {
  try {
    if (studentIds.length === 0) {
      return [];
    }

    // 检查学生是否已经在班级中
    const _ = command();
    const existingRelations = await allDocs({
      c: "student_class",
      match: {
        studentId: _.in(studentIds),
        classRoomId
      }
    });
    const existingStudentIdSet = new Set(existingRelations.map(relation => relation.studentId));

    // 过滤出尚未在班级中的学生
    const newStudentIds = studentIds.filter(id => !existingStudentIdSet.has(id));
    if (newStudentIds.length === 0) {
      return []; // 所有学生都已在班级中
    }

    // 准备批量插入的关系数据
    const studentClassRelations = newStudentIds.map(studentId => ({
      studentId,
      classRoomId,
      status,
      notes
    }));

    // 批量插入学生与班级关系
    const result = await addDocList("student_class", studentClassRelations);
    return result.ids;
  } catch (error) {
    console.error("批量添加学生到班级失败:", error);
    throw new Error("批量添加学生到班级失败");
  }
}


export async function deleteStudentAnswer(studentId, classId, courseId, questionPackId) {
  try {
    // 注意：studentId, classId, courseId, questionPackId 四个字段组成唯一主键，最多只有一条记录
    // 先获取要删除的答卷，以便获取其ID用于删除答案条目
    const existingAnswer = await getOne("student_answer", {
      studentId,
      classId,
      courseId,
      questionPackId
    });
    if (!existingAnswer) {
      return {
        answerCount: 0,
        itemCount: 0,
        mistakePointCount: 0
      };
    }

    // 构建错误归因查询条件
    const mistakePointWhere = {
      studentId,
      classId,
      questionPackId
    };

    // 处理courseId为null的情况
    if (courseId === null) {
      const _ = command();
      mistakePointWhere.courseId = _.eq(null);
    } else {
      mistakePointWhere.courseId = courseId;
    }

    // 并行删除相关数据
    const [itemCount, mistakePointCount, answerCount] = await Promise.all([
    // 删除答案条目数据
    removeMatch("student_answer_item", {
      studentAnswerId: existingAnswer._id
    }),
    // 删除错误归因统计记录
    removeMatch("mistake_point_question", mistakePointWhere),
    // 删除答卷数据
    removeMatch("student_answer", {
      studentId,
      classId,
      courseId,
      questionPackId
    })]);
    return {
      answerCount,
      itemCount,
      mistakePointCount
    };
  } catch (error) {
    console.error("删除学生答卷失败:", error);
    throw error;
  }
}


export async function saveStudentAnswerData(answerData, type) {
  try {
    const {
      classId,
      courseId,
      questionPackId,
      studentId,
      wrongQuestions
    } = answerData;
    let questionPackType = type;

    // 如果没有提供type参数，则查询题集获取type
    if (!questionPackType) {
      const questionPack = await getDoc("question_pack", questionPackId);
      if (!questionPack) {
        throw new Error("题目集合不存在");
      }
      questionPackType = questionPack.type;
    }

    // 1. 创建或更新学生答卷记录
    const existingAnswer = await getOne("student_answer", {
      studentId,
      classId,
      courseId,
      questionPackId
    });
    let studentAnswerId;
    if (existingAnswer) {
      // 更新现有答卷
      studentAnswerId = existingAnswer._id;
      await updateDoc("student_answer", studentAnswerId, {
        type: questionPackType,
        created: Date.now() // 更新提交时间
      });
    } else {
      // 创建新答卷
      studentAnswerId = await addDoc("student_answer", {
        studentId,
        classId,
        courseId,
        questionPackId,
        type: questionPackType,
        created: Date.now()
      });
    }

    // 2. 在删除答案项目之前，先删除关联的图片文件
    const existingAnswerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId
      }
    });

    // 获取当前要保存的题目ID集合
    const currentQuestionIds = new Set(wrongQuestions.map(q => q.questionId));

    // 找出需要删除图片的答案项目（不在当前保存列表中的项目）
    const itemsToDeleteImages = existingAnswerItems.filter(item => !currentQuestionIds.has(item.questionId) && item.imageFileID);

    // 删除不再需要的图片文件
    if (itemsToDeleteImages.length > 0) {
      const fileIdsToDelete = itemsToDeleteImages.map(item => item.imageFileID).filter(Boolean);
      if (fileIdsToDelete.length > 0) {
        try {
          await deleteFile(fileIdsToDelete);
          console.log(`已删除 ${fileIdsToDelete.length} 个不再需要的图片文件`);
        } catch (error) {
          console.error("删除图片文件失败:", error);
          // 不阻断保存流程，只记录错误
        }
      }
    }

    // 3. 删除该学生这个答卷的现有答案项目和错误归因统计记录
    await Promise.all([removeMatch("student_answer_item", {
      studentAnswerId
    }), removeMatch("mistake_point_question", {
      studentId,
      classId,
      courseId
    })]);

    // 4. 准备批量插入答案项目数据
    const answerItems = [];
    for (const wrongQuestion of wrongQuestions) {
      const {
        questionId
      } = wrongQuestion;

      // 查找是否有现有的图片信息需要保留
      const existingItem = existingAnswerItems.find(item => item.questionId === questionId);

      // 准备答案项目数据（不再包含mistakePointIds）
      const answerItemData = {
        studentAnswerId,
        questionId,
        questionType: "选择题",
        // 这里需要从实际题目获取类型，暂时使用默认值
        answerValue: [],
        // 学生的答案，这里暂时为空
        parse: [] // 答案解析，这里暂为空
      };

      // 如果存在图片信息，保留图片信息
      if (existingItem?.imageFileID) {
        answerItemData.imagePath = existingItem.imagePath;
        answerItemData.imageUrl = existingItem.imageUrl;
        answerItemData.imageFileID = existingItem.imageFileID;
      }
      answerItems.push(answerItemData);
    }

    // 5. 插入答案项目数据
    if (answerItems.length > 0) {
      await addDocList("student_answer_item", answerItems);
    }

    // 6. 批量处理错误归因关联数据
    for (const wrongQuestion of wrongQuestions) {
      const {
        questionId,
        mistakePointIds
      } = wrongQuestion;

      // 使用新的错误归因集合函数更新错误归因关联
      await updateMistakePointQuestions({
        mistakePointIds,
        questionId,
        studentId,
        classId,
        courseId,
        questionPackId,
        type: questionPackType
      });
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("保存学生答卷数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败"
    };
  }
}


export async function getOneStudentAnswer(params) {
  try {
    const {
      classId,
      courseId,
      questionPackId,
      studentId
    } = params;

    // 1. 查找学生答卷记录
    const studentAnswer = await getOne("student_answer", {
      studentId,
      classId,
      courseId,
      questionPackId
    });
    if (!studentAnswer) {
      return null;
    }

    // 2. 查找该答卷的所有答案项目
    const answerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: studentAnswer._id
      }
    });

    // 3. 获取学生的错误归因数据
    const mistakePointsResult = await getStudentMistakePoints({
      studentId,
      classId,
      courseId,
      questionPackId
    });
    const questionMistakePoints = mistakePointsResult.success ? mistakePointsResult.data || {} : {};

    // 4. 构建返回数据，包含图片信息和错误归因信息
    const wrongQuestions = answerItems.map(item => ({
      questionId: item.questionId,
      mistakePointIds: questionMistakePoints[item.questionId] || [],
      imagePath: item.imagePath,
      imageUrl: item.imageUrl,
      imageFileID: item.imageFileID
    }));
    return {
      wrongQuestions
    };
  } catch (error) {
    console.error("获取学生答卷数据失败:", error);
    return null;
  }
}


export async function getMultiStudentAnswers(params) {
  try {
    const {
      classId,
      courseId,
      questionPackId,
      studentIds
    } = params;
    if (studentIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    const _ = command();

    // 1. 一次性查询所有学生的答卷记录
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        studentId: _.in(studentIds),
        classId,
        courseId,
        questionPackId
      }
    });

    // 2. 如果没有任何答卷记录，直接返回空数据
    if (studentAnswers.length === 0) {
      const emptyData = studentIds.map(studentId => ({
        studentId,
        wrongQuestions: [],
        hasExistingData: false
      }));
      return {
        success: true,
        data: emptyData
      };
    }

    // 3. 获取所有答卷的ID，用于查询答案项目
    const studentAnswerIds = studentAnswers.map(answer => answer._id);

    // 4. 一次性查询所有答案项目
    const answerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(studentAnswerIds)
      }
    });

    // 5. 构建学生ID到答卷ID的映射
    const studentIdToAnswerIdMap = new Map();
    studentAnswers.forEach(answer => {
      studentIdToAnswerIdMap.set(answer.studentId, answer._id);
    });

    // 6. 构建答卷ID到答案项目的映射
    const answerIdToItemsMap = new Map();
    answerItems.forEach(item => {
      const items = answerIdToItemsMap.get(item.studentAnswerId) || [];
      items.push(item);
      answerIdToItemsMap.set(item.studentAnswerId, items);
    });

    // 7. 获取所有学生的错误归因数据
    const mistakePointsResult = await getMultiStudentMistakePoints({
      studentIds,
      classId,
      courseId,
      questionPackId
    });
    const allStudentMistakePoints = mistakePointsResult.success ? mistakePointsResult.data || {} : {};

    // 8. 组装最终数据，包含图片信息和错误归因信息
    const result = studentIds.map(studentId => {
      const studentAnswerId = studentIdToAnswerIdMap.get(studentId);
      if (!studentAnswerId) {
        // 该学生没有答卷记录
        return {
          studentId,
          wrongQuestions: [],
          hasExistingData: false
        };
      }

      // 获取该学生的答案项目和错误归因数据
      const items = answerIdToItemsMap.get(studentAnswerId) || [];
      const studentMistakePoints = allStudentMistakePoints[studentId] || {};
      const wrongQuestions = items.map(item => ({
        questionId: item.questionId,
        mistakePointIds: studentMistakePoints[item.questionId] || [],
        imagePath: item.imagePath,
        imageUrl: item.imageUrl,
        imageFileID: item.imageFileID
      }));
      return {
        studentId,
        wrongQuestions,
        hasExistingData: true
      };
    });
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("批量获取学生答卷数据失败:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "获取学生答卷数据失败"
    };
  }
}


function buildStudentAnswersWhereCondition(studentId, classId, courseId) {
  const whereCondition = {
    studentId
  };

  // 处理班级ID过滤
  if (classId) {
    whereCondition.classId = classId;
  }

  // 处理课程ID过滤
  if (courseId !== undefined) {
    if (courseId === null) {
      // 查询没有课程关联的答卷
      const _ = command();
      whereCondition.$or = [{
        courseId: _.eq(null)
      }, {
        courseId: _.eq("")
      }, {
        courseId: {
          $exists: false
        }
      }];
    } else {
      // 查询指定课程的答卷
      whereCondition.courseId = courseId;
    }
  }
  return whereCondition;
}


export async function getStudentAnswersCount(studentId, {
  classId,
  courseId
}) {
  try {
    const whereCondition = buildStudentAnswersWhereCondition(studentId, classId, courseId);
    return await count("student_answer", whereCondition);
  } catch (error) {
    console.error("获取学生答卷总数失败:", error);
    return 0;
  }
}


export async function getStudentAnswers(studentId, {
  classId,
  courseId,
  pageNum = 0,
  pageSize = 20
}) {
  try {
    // 构建查询条件
    const whereCondition = buildStudentAnswersWhereCondition(studentId, classId, courseId);

    // 获取答卷列表，按创建时间倒序排列
    const answers = await docs({
      c: "student_answer",
      w: whereCondition,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });

    // 一次性获取所有答卷对应的错题数量
    const answerIds = answers.map(answer => answer._id);
    const _ = command();
    const allAnswerItems = answerIds.length > 0 ? await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds)
      },
      project: {
        studentAnswerId: 1
      }
    }) : [];

    // 统计每个答卷的错题数量
    const answerItemCounts = allAnswerItems.reduce((acc, item) => {
      acc[item.studentAnswerId] = (acc[item.studentAnswerId] || 0) + 1;
      return acc;
    }, {});

    // 获取所有相关的课程、题集和班级信息
    const courseIds = answers.filter(a => a.courseId).map(a => a.courseId);
    const questionPackIds = answers.map(a => a.questionPackId);
    const classIds = [...new Set(answers.map(a => a.classId))];
    const [courses, questionPacks, classes] = await Promise.all([courseIds.length > 0 ? allDocs({
      c: "course",
      match: {
        _id: _.in(courseIds)
      },
      project: {
        _id: 1,
        name: 1
      }
    }) : [], questionPackIds.length > 0 ? allDocs({
      c: "question_pack",
      match: {
        _id: _.in(questionPackIds)
      },
      project: {
        _id: 1,
        name: 1
      }
    }) : [], classIds.length > 0 ? allDocs({
      c: "classroom",
      match: {
        _id: _.in(classIds)
      },
      project: {
        _id: 1,
        name: 1
      }
    }) : []]);

    // 创建查找映射
    const courseMap = courses.reduce((acc, course) => {
      acc[course._id] = course.name;
      return acc;
    }, {});
    const questionPackMap = questionPacks.reduce((acc, pack) => {
      acc[pack._id] = pack.name;
      return acc;
    }, {});
    const classMap = classes.reduce((acc, cls) => {
      acc[cls._id] = cls.name;
      return acc;
    }, {});

    // 组装最终数据
    const answersWithCount = answers.map(answer => ({
      ...answer,
      questionCount: answerItemCounts[answer._id] || 0,
      courseName: answer.courseId ? courseMap[answer.courseId] : undefined,
      questionPackName: questionPackMap[answer.questionPackId] || undefined,
      className: classMap[answer.classId] || undefined
    }));
    return answersWithCount;
  } catch (error) {
    console.error("获取学生答卷列表失败:", error);
    throw new Error("获取学生答卷列表失败");
  }
}


export async function getStudentClasses(studentId) {
  try {
    // 先获取学生的班级关系
    const studentClasses = await allDocs({
      c: "student_class",
      match: {
        studentId
      },
      project: {
        classRoomId: 1
      }
    });
    if (studentClasses.length === 0) {
      return [];
    }

    // 获取班级详细信息
    const classIds = studentClasses.map(sc => sc.classRoomId);
    const _ = command();
    const classes = await allDocs({
      c: "classroom",
      match: {
        _id: _.in(classIds)
      }
    });
    return classes;
  } catch (error) {
    console.error("获取学生班级列表失败:", error);
    return [];
  }
}


export async function deleteStudentAnswerComplete(studentAnswerId) {
  try {
    // 获取所有答卷项目
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
      }
    }

    // 删除所有答卷项目
    const deletedItemCount = await removeMatch("student_answer_item", {
      studentAnswerId
    });

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
      deletedItemCount: 0,
      deletedImageCount: 0,
      error: "删除答卷失败"
    };
  }
}
