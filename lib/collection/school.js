import { addDoc, allDocs, command, count, docs, getDoc, getOne, removeDoc, removeMatch, updateDoc, updateMatch } from "../common/database.js";

// 集合名称常量
const SCHOOL_COLLECTION = "school";
const CLASSROOM_COLLECTION = "classroom";
const STUDENT_CLASS_COLLECTION = "student_class";


function buildSchoolWhereCondition({
  keyword = "",
  region = "",
  status = "all"
} = {}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 关键词搜索（学校名称、地址、联系电话、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      address: searchRegex
    }, {
      phone: searchRegex
    }, {
      description: searchRegex
    });
  }

  // 区域筛选
  if (region && region !== "all") {
    andList.push({
      region
    });
  }

  // 状态筛选
  if (status && status !== "all") {
    andList.push({
      status
    });
  }

  // 构建最终的查询条件
  let where = {};
  if (orList.length > 0 && andList.length > 0) {
    // 既有OR条件又有AND条件
    where = _.and(_.or(...orList), ...andList);
  } else if (orList.length > 0) {
    // 只有OR条件
    where = _.or(...orList);
  } else if (andList.length > 0) {
    // 只有AND条件
    where = _.and(...andList);
  }
  return where;
}


export async function getSchools({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  region = "",
  status = "all"
} = {}) {
  const where = buildSchoolWhereCondition({
    keyword,
    region,
    status
  });
  return docs({
    c: SCHOOL_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getSchoolsCount({
  keyword = "",
  region = "",
  status = "all"
} = {}) {
  const where = buildSchoolWhereCondition({
    keyword,
    region,
    status
  });
  return count(SCHOOL_COLLECTION, where);
}


export async function getSchoolById(schoolId) {
  return getDoc(SCHOOL_COLLECTION, schoolId);
}


export async function createSchool(schoolData) {
  const timestamp = Date.now();
  const data = {
    ...schoolData,
    created: timestamp,
    updated: timestamp
  };
  return addDoc(SCHOOL_COLLECTION, data);
}


export async function updateSchool(schoolId, schoolData) {
  const timestamp = Date.now();
  const data = {
    ...schoolData,
    updated: timestamp
  };
  return updateDoc(SCHOOL_COLLECTION, schoolId, data);
}


export async function deleteSchool(schoolId) {
  try {
    // 1. 获取该学校下所有班级
    const classrooms = await allDocs({
      c: CLASSROOM_COLLECTION,
      match: {
        schoolId
      },
      only: "_id"
    });
    if (classrooms.length > 0) {
      // 2. 收集所有班级ID
      const classroomIds = classrooms.map(classroom => classroom._id);

      // 3. 一次性删除所有班级与学生的关联关系
      const _ = command();
      await removeMatch(STUDENT_CLASS_COLLECTION, {
        classRoomId: _.in(classroomIds)
      });

      // 4. 删除该学校下的所有班级
      await removeMatch(CLASSROOM_COLLECTION, {
        schoolId
      });
    }

    // 5. 最后删除学校本身
    return await removeDoc(SCHOOL_COLLECTION, schoolId);
  } catch (error) {
    console.error("删除学校失败:", error);
    return false;
  }
}


export async function getSchoolAdministratorsAndTeachers(schoolId) {
  // 获取学校信息
  const school = await getSchoolById(schoolId);
  if (!school) {
    return {
      administrators: [],
      teachers: []
    };
  }
  const adminOpenids = school.adminOpenids || [];
  const teacherOpenids = school.teacherOpenids || [];

  // 获取所有相关用户的openid列表（去重）
  const allOpenids = Array.from(new Set([...adminOpenids, ...teacherOpenids]));
  if (allOpenids.length === 0) {
    return {
      administrators: [],
      teachers: []
    };
  }

  // 使用command构建查询条件
  const _ = command();

  // 一次性查询所有相关用户
  const allUsers = await allDocs({
    c: "wx_user",
    match: {
      openid: _.in(allOpenids)
    },
    sort: {
      created: 1
    }
  });

  // 分离管理员和老师
  const administrators = allUsers.filter(user => adminOpenids.includes(user.openid));
  const teachers = allUsers.filter(user => teacherOpenids.includes(user.openid) && !adminOpenids.includes(user.openid));
  return {
    administrators,
    teachers
  };
}


export async function addTeacherToSchool(schoolId, teacherOpenid) {
  // 获取学校信息
  const school = await getSchoolById(schoolId);
  if (!school) {
    throw new Error("学校不存在");
  }

  // 检查用户是否已经是管理员
  if (school.adminOpenids.includes(teacherOpenid)) {
    throw new Error("该用户已经是校长，不能添加为教师");
  }

  // 检查用户是否已经是教师
  if (school.teacherOpenids.includes(teacherOpenid)) {
    return true; // 已经是教师，直接返回成功
  }

  // 获取用户信息，确保用户存在
  const user = await getOne("wx_user", {
    openid: teacherOpenid
  });
  if (!user) {
    throw new Error("用户不存在");
  }

  // 检查用户是否有教师角色，如果没有则添加
  let needUpdateUserRoles = false;
  const newRoles = [...user.roles];
  if (!user.roles.includes("teacher")) {
    newRoles.push("teacher");
    needUpdateUserRoles = true;
  }

  // 更新用户角色（如果需要）
  if (needUpdateUserRoles) {
    await updateDoc("wx_user", user._id, {
      roles: newRoles,
      updated: Date.now()
    });
  }

  // 添加教师到学校的教师列表
  const newTeacherOpenids = [...school.teacherOpenids, teacherOpenid];
  return await updateSchool(schoolId, {
    teacherOpenids: newTeacherOpenids
  });
}


export async function removeTeacherFromSchool(schoolId, teacherOpenid) {
  try {
    // 获取学校信息
    const school = await getSchoolById(schoolId);
    if (!school) {
      throw new Error("学校不存在");
    }

    // 检查用户是否是管理员（校长），如果是则不能删除
    if (school.adminOpenids.includes(teacherOpenid)) {
      throw new Error("该用户是校长，不能删除");
    }

    // 检查用户是否在教师列表中
    if (!school.teacherOpenids.includes(teacherOpenid)) {
      return true; // 用户不在教师列表中，视为删除成功
    }

    // 从教师列表中移除该用户
    const newTeacherOpenids = school.teacherOpenids.filter(openid => openid !== teacherOpenid);

    // 更新学校的教师列表
    const updateSchoolResult = await updateSchool(schoolId, {
      teacherOpenids: newTeacherOpenids
    });

    // 从该学校下所有班级的teacherOpenids中移除这个教师
    const _ = command();
    await updateMatch(CLASSROOM_COLLECTION, {
      schoolId: schoolId,
      teacherOpenids: _.in([teacherOpenid]) // 查找包含该教师openid的班级
    }, {
      teacherOpenids: _.pull(teacherOpenid),
      // 从数组中移除该openid
      updated: Date.now()
    });
    return updateSchoolResult;
  } catch (error) {
    console.error("删除教师失败:", error);
    throw error;
  }
}


export async function getSchoolByUserOpenid(openid) {
  const _ = command();

  // 优先查找用户作为管理员（校长）的学校
  const adminSchool = await getOne(SCHOOL_COLLECTION, {
    adminOpenids: _.in([openid]),
    status: "active" // 只查询激活状态的学校
  });
  if (adminSchool) {
    return adminSchool;
  }

  // 如果不是管理员，查找用户作为教师的学校
  const teacherSchool = await getOne(SCHOOL_COLLECTION, {
    teacherOpenids: _.in([openid]),
    status: "active" // 只查询激活状态的学校
  });
  return teacherSchool;
}
