"use client";

import { useEffect, useState } from "react";
import { CONFIG_KEYS } from "../lib/config/constants.js";
import { getSetting } from "../lib/utils/setting.js";


export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoading(true);
        const settings = await getSetting(CONFIG_KEYS.SUBJECTS);
        setSubjects(settings[CONFIG_KEYS.SUBJECTS] || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);
  return {
    subjects,
    loading,
    error
  };
}


export function useQuestionTypes() {
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchQuestionTypes() {
      try {
        setLoading(true);
        const settings = await getSetting(CONFIG_KEYS.QUESTION_TYPES);
        setQuestionTypes(settings[CONFIG_KEYS.QUESTION_TYPES] || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchQuestionTypes();
  }, []);
  return {
    questionTypes,
    loading,
    error
  };
}


export function useRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchRegions() {
      try {
        setLoading(true);
        const settings = await getSetting(CONFIG_KEYS.REGIONS);

        // 处理regions数据，兼容旧格式
        const regionsData = settings[CONFIG_KEYS.REGIONS];
        if (Array.isArray(regionsData)) {
          if (regionsData.length > 0 && typeof regionsData[0] === "string") {
            // 旧格式：字符串数组
            setRegions(regionsData.map(name => ({
              name,
              locked: false
            })));
          } else {
            // 新格式：对象数组
            setRegions(regionsData);
          }
        } else {
          setRegions([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchRegions();
  }, []);
  return {
    regions,
    loading,
    error
  };
}


export function useAdminConfig() {
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError
  } = useSubjects();
  const {
    questionTypes,
    loading: questionTypesLoading,
    error: questionTypesError
  } = useQuestionTypes();
  const {
    regions,
    loading: regionsLoading,
    error: regionsError
  } = useRegions();
  const loading = subjectsLoading || questionTypesLoading || regionsLoading;
  const error = subjectsError || questionTypesError || regionsError;
  return {
    subjects,
    questionTypes,
    regions,
    loading,
    error
  };
}
