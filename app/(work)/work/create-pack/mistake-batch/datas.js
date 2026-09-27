"use server";

/**
 * 注：如果一个学生在多个班级中都有错题数据，则这个学生会生成多个PDF文件，他所在的每个班级都会有一个独立文件。
 */
import { addDoc, addDocList, agg, aggregate, allDocs, collName, command, updateDoc } from "../../../../../lib/common/database.js";

/**
 * 根据班级、科目和时间区间查询符合条件的题集
 *
 * 查询逻辑：
 * 1. 题集类型必须是 "试卷"
 * 2. 题集科目必须匹配指定科目
 * 3. 在时间区间内有至少一个 StudentAnswerDoc
 * 4. StudentAnswerDoc.questionPackId 关联该题集
 * 5. StudentAnswerDoc.classId 在选择的班级中
 * 6. StudentAnswerDoc.created 在时间区间内
 */
export async function getQuestionPacksByTimeRange({
  classIds,
  subject,
  startDate,
  endDate
}) {
  try {
    const _ = command();

    // 第一步：使用聚合查询获取唯一的 questionPackId
    // 使用 group 对 questionPackId 进行分组，自动去重
    const result = await agg("student_answer").match({
      classId: _.in(classIds),
      created: _.gte(startDate).and(_.lte(endDate))
    }).group({
      _id: "$questionPackId"
    })
    // 设置limit，获取所有题集（聚合查询默认只返回20条，必须显式设置limit）
    .limit(100000).end();

    // 如果没有找到任何答卷，直接返回空数组
    if (!result.data || result.data.length === 0) {
      return [];
    }

    // 提取所有唯一的 questionPackId
    const questionPackIds = result.data.map(item => item._id);

    // 第二步：根据 questionPackId 查询题集，并筛选出类型为 "试卷" 且科目匹配的题集
    const questionPacks = await allDocs({
      c: "question_pack",
      match: {
        _id: _.in(questionPackIds),
        type: "试卷",
        subject: subject
      },
      sort: {
        created: -1 // 按创建时间倒序排列
      }
    });
    return questionPacks;
  } catch (error) {
    console.error("查询题集失败:", error);
    throw error;
  }
}

/**
 * 查询学生错题预览数据，用于选择学生的组件
 *
 * 使用聚合查询统计每个学生在选定题集中的错题数量
 *
 * 数据流程示例：
 * 1. student_answer_item 原始数据：
 *    { _id: "item1", studentAnswerId: "answer1", questionId: "q1" }
 *    { _id: "item2", studentAnswerId: "answer1", questionId: "q2" }
 *    { _id: "item3", studentAnswerId: "answer2", questionId: "q3" }
 *
 * 2. lookup 后数据格式：
 *    { _id: "item1", studentAnswerId: "answer1", questionId: "q1",
 *      answerInfo: [{ _id: "answer1", studentId: "s1", classId: "c1", questionPackId: "pack1" }] }
 *
 * 3. unwind 后数据格式：
 *    { _id: "item1", studentAnswerId: "answer1", questionId: "q1",
 *      answerInfo: { _id: "answer1", studentId: "s1", classId: "c1", questionPackId: "pack1" } }
 *
 * 4. 第二次 match 后：筛选出指定班级和题集的数据
 *
 * 5. group 后数据格式：
 *    { _id: { studentId: "s1", classId: "c1" }, mistakeCount: 5 }
 *    { _id: { studentId: "s2", classId: "c1" }, mistakeCount: 3 }
 *
 * 6. 最终返回格式：
 *    [
 *      { studentId: "s1", studentName: "张三", classId: "c1", className: "一班", grade: "高一", mistakeCount: 5 },
 *      { studentId: "s2", studentName: "李四", classId: "c1", className: "一班", grade: "高一", mistakeCount: 3 }
 *    ]
 */
export async function getStudentMistakesPreview({
  classIds,
  questionPackIds
}) {
  try {
    const _ = command();
    const $ = aggregate();

    // === 性能优化：先查询 student_answer 获取符合条件的 ID 列表 ===
    // 步骤1：查询符合条件的 student_answer 记录，获取其 _id
    // 作用：通过班级和题集过滤，大幅减少需要处理的数据量
    const answerIds = await allDocs({
      c: "student_answer",
      match: {
        classId: _.in(classIds),
        // 班级ID过滤
        questionPackId: _.in(questionPackIds) // 题集ID过滤
      },
      project: {
        _id: 1 // 只返回 _id 字段
      }
    });

    // 如果没有找到符合条件的答卷，直接返回空数组
    if (answerIds.length === 0) {
      return [];
    }

    // 提取所有答卷ID
    const studentAnswerIds = answerIds.map(item => item._id);

    // === 聚合查询流水线 ===
    // 步骤2：使用答卷ID列表过滤 student_answer_item，然后统计
    // 作用：只处理指定答卷的错题记录，大幅提升性能
    const result = await agg("student_answer_item")
    // 步骤2.1：使用答卷ID过滤，只处理符合条件的错题
    // 作用：利用索引快速定位，避免全表扫描
    .match({
      studentAnswerId: _.in(studentAnswerIds) // 只查询指定答卷的错题
    })
    // 步骤2.2：联表查询 student_answer 集合
    // 作用：获取答卷的详细信息（学生ID、班级ID等）
    // 结果：每条记录会增加一个 answerInfo 数组字段
    // 例如：{ _id: "item1", studentAnswerId: "answer1", answerInfo: [{...}] }
    .lookup({
      from: collName("student_answer"),
      // 要关联的集合名称
      localField: "studentAnswerId",
      // 当前集合的关联字段
      foreignField: "_id",
      // 目标集合的关联字段
      as: "answerInfo" // 存放关联结果的字段名（数组类型）
    })
    // 步骤2.3：展开 answerInfo 数组
    // 作用：将 answerInfo 从数组转换为对象，方便后续访问
    // 例如：{ answerInfo: [{...}] } 变成 { answerInfo: {...} }
    .unwind("$answerInfo")
    // 步骤2.4：按学生和班级分组，统计每个学生的错题数量
    // 作用：将同一个学生在同一个班级的所有错题聚合到一起，并计数
    // _id：分组的键，包含 studentId 和 classId
    // mistakeCount：使用 $.sum(1) 对每条记录计数，得到该学生的错题总数
    .group({
      _id: {
        studentId: "$answerInfo.studentId",
        // 按学生ID分组
        classId: "$answerInfo.classId" // 按班级ID分组
      },
      mistakeCount: $.sum(1) // 累加计数，每条记录贡献1
    })
    // 步骤2.5：设置limit，获取所有学生数据（聚合查询默认只返回20条，必须显式设置limit）
    .limit(100000).end();
    if (!result.data || result.data.length === 0) {
      return [];
    }

    // 定义聚合结果的类型

    const aggregateData = result.data;

    // 提取所有学生ID和班级ID
    const studentIds = Array.from(new Set(aggregateData.map(item => item._id.studentId)));
    const uniqueClassIds = Array.from(new Set(aggregateData.map(item => item._id.classId)));

    // 查询学生信息
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      }
    });

    // 查询班级信息
    const classes = await allDocs({
      c: "classroom",
      match: {
        _id: _.in(uniqueClassIds)
      }
    });

    // 组装数据
    const studentMap = new Map(students.map(s => [s._id, s]));
    const classMap = new Map(classes.map(c => [c._id, c]));
    const previewData = aggregateData.map(item => {
      const student = studentMap.get(item._id.studentId);
      const classRoom = classMap.get(item._id.classId);
      return {
        studentId: item._id.studentId,
        studentName: student?.name || "未知学生",
        classId: item._id.classId,
        className: classRoom?.name || "未知班级",
        grade: classRoom?.grade || "未知年级",
        mistakeCount: item.mistakeCount
      };
    });

    // 按年级、班级、学生姓名排序
    previewData.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      return a.studentName.localeCompare(b.studentName);
    });
    return previewData;
  } catch (error) {
    console.error("查询学生错题预览数据失败:", error);
    throw error;
  }
}


export async function createMistakeBatchTask(params) {
  try {
    const _ = command();
    const now = Date.now();

    // === 步骤1：查询每个学生在选定题集中的答卷 ===
    // 先查询所有符合条件的 student_answer，只查询需要的字段
    const answerDocs = await allDocs({
      c: "student_answer",
      match: {
        classId: _.in(params.classIds),
        questionPackId: _.in(params.questionPackIds),
        studentId: _.in(params.studentList.map(s => s.studentId))
      },
      only: "_id,studentId,classId,questionPackId"
    });

    // 提取所有答卷ID
    const answerIds = answerDocs.map(doc => doc._id);
    if (answerIds.length === 0) {
      throw new Error("未找到任何学生的答卷记录");
    }

    // 查询所有错题，只查询需要的字段
    const mistakeItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds)
      },
      only: "_id,studentAnswerId,questionId"
    });

    // === 步骤2：构建数据映射关系 ===
    /** 创建学生答卷映射：studentId -> classId -> questionPackId ->
     * Pick<StudentAnswerDoc, "_id" | "studentId" | "classId" | "questionPackId">
     *
     * 例如：
     * {
     *   "studentId": {
     *     "classId": {
     *       "questionPackId": {
     *         "_id": "answerId",
     *         "studentId": "studentId",
     *         "classId": "classId",
     *         "questionPackId": "questionPackId"
     *       }
     *     }
     *   }
     * }
     */
    const studentAnswerMap = new Map();
    answerDocs.forEach(answer => {
      if (!studentAnswerMap.has(answer.studentId)) {
        studentAnswerMap.set(answer.studentId, new Map());
      }
      const classMap = studentAnswerMap.get(answer.studentId);
      if (!classMap.has(answer.classId)) {
        classMap.set(answer.classId, new Map());
      }
      const packMap = classMap.get(answer.classId);
      packMap.set(answer.questionPackId, answer);
    });

    // 创建错题映射：studentAnswerId -> Array<{ questionId, itemId }>
    // 使用数组保持顺序，确保 questionId 和 itemId 一一对应
    const mistakeMap = new Map();
    mistakeItems.forEach(item => {
      if (!mistakeMap.has(item.studentAnswerId)) {
        mistakeMap.set(item.studentAnswerId, []);
      }
      mistakeMap.get(item.studentAnswerId).push({
        questionId: item.questionId,
        itemId: item._id
      });
    });

    // === 步骤3：创建任务记录（先创建，获取taskId）===
    const taskDoc = {
      taskName: params.taskName,
      taskDescription: params.taskDescription,
      status: "waiting",
      // 必须设置为waiting状态
      processingToken: "",
      // 默认为空字符串
      schoolId: params.schoolId,
      subject: params.subject,
      classIds: params.classIds,
      questionPackIds: params.questionPackIds,
      allowStudentsDownloadAnswers: params.allowStudentsDownloadAnswers,
      totalStudents: 0,
      // 先设为0，后面更新
      completedStudents: 0,
      failedStudents: 0,
      created: now
    };

    // 写入任务记录，获取任务ID
    const taskId = await addDoc("mistake_batch_task", taskDoc);

    // === 步骤4：生成学生PDF记录 ===
    const studentPdfDocs = [];
    for (const student of params.studentList) {
      const classMap = studentAnswerMap.get(student.studentId);
      if (!classMap) {
        // 该学生没有任何答卷记录，跳过
        continue;
      }
      const packMap = classMap.get(student.classId);
      if (!packMap) {
        // 该学生在这个班级中没有答卷记录，跳过
        continue;
      }

      // 按照排序后的题集顺序，收集该学生的所有错题
      const questionPackQuestions = [];
      const allQuestionIds = [];
      const allStudentAnswerItemIds = [];
      for (const pack of params.sortedQuestionPacks) {
        const answer = packMap.get(pack._id);

        // 如果学生没有该题集的答卷记录，说明没有参与该题集，跳过
        if (!answer) continue;

        // 获取该答卷的错题列表（包含questionId和itemId）
        const mistakes = mistakeMap.get(answer._id) || [];

        // 只有存在错题时才记录该题集
        // 如果 mistakes.length === 0，说明学生参与了该题集但没有错题，不记录
        if (mistakes.length === 0) continue;

        // 提取题目ID列表
        const questionIds = mistakes.map(m => m.questionId);
        questionPackQuestions.push({
          questionPackId: pack._id,
          questionPackName: pack.name,
          questionIds: questionIds
        });

        // 按顺序添加题目ID和对应的StudentAnswerItemDoc._id
        mistakes.forEach(mistake => {
          allQuestionIds.push(mistake.questionId);
          allStudentAnswerItemIds.push(mistake.itemId);
        });
      }

      // 如果该学生没有任何错题，跳过
      if (allQuestionIds.length === 0) continue;

      // 从 questionPackQuestions 中提取该学生实际有错题的题集ID列表
      const studentQuestionPackIds = questionPackQuestions.map(q => q.questionPackId);
      studentPdfDocs.push({
        taskId,
        schoolId: params.schoolId,
        studentId: student.studentId,
        studentName: student.studentName,
        classId: student.classId,
        status: "waiting",
        processingToken: "",
        questionPackIds: studentQuestionPackIds,
        // 只包含该学生实际有错题的题集
        questionIds: allQuestionIds,
        // 该学生的所有错题ID
        studentAnswerItemIds: allStudentAnswerItemIds,
        // StudentAnswerItemDoc._id列表，与questionIds一一对应
        questionPackQuestions,
        // 详细的题集-题目对应关系
        mistakeCount: allQuestionIds.length,
        created: now
      });
    }
    if (studentPdfDocs.length === 0) {
      throw new Error("所有学生都没有错题记录");
    }

    // === 步骤5：批量写入学生PDF记录 ===
    await addDocList("mistake_batch_student_pdf", studentPdfDocs);

    // === 步骤6：创建班级任务记录 ===
    // 收集所有涉及的班级ID（去重）
    const classIdSet = new Set();
    for (const student of params.studentList) {
      classIdSet.add(student.classId);
    }
    const uniqueClassIds = Array.from(classIdSet);

    // 批量查询所有班级信息
    const classrooms = await allDocs({
      c: "classroom",
      match: {
        _id: _.in(uniqueClassIds)
      },
      only: "_id,name"
    });

    // 为每个班级创建班级任务记录
    const classTaskDocs = [];
    for (const classroom of classrooms) {
      classTaskDocs.push({
        taskId,
        schoolId: params.schoolId,
        classId: classroom._id,
        className: classroom.name,
        status: "waiting",
        processingToken: "",
        created: now
      });
    }

    // 批量写入班级任务记录
    if (classTaskDocs.length > 0) {
      await addDocList("mistake_batch_class_task", classTaskDocs);
    }

    // === 步骤7：更新任务的学生总数 ===
    await updateDoc("mistake_batch_task", taskId, {
      totalStudents: studentPdfDocs.length
    });
    return taskId;
  } catch (error) {
    console.error("创建批量错题任务失败:", error);
    throw error;
  }
}
