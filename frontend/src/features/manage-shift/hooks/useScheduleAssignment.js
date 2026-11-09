'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getShifts } from '../services/shift.service';
import { assignShift, getActiveStaff, getWeeklySchedules } from '../services/schedule.service';

const pad = (value) => String(value).padStart(2, '0');

function formatDate(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getWeekRange(anchor = new Date()) {
  const date = typeof anchor === 'string'
    ? new Date(`${anchor}T00:00:00Z`)
    : new Date(Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()));
  const day = date.getUTCDay();
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: formatDate(monday), to: formatDate(sunday) };
}

export function useScheduleAssignment() {
  const [week, setWeek] = useState(() => getWeekRange());
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentError, setAssignmentError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setError(null);
    try {
      const [staffData, shiftData] = await Promise.all([
        getActiveStaff(),
        getShifts({ activeOnly: true }),
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setShifts(Array.isArray(shiftData) ? shiftData : []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải nhân viên và ca đang hoạt động');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    setScheduleLoading(true);
    setError(null);
    try {
      const data = await getWeeklySchedules(week);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải lịch làm việc trong tuần');
    } finally {
      setScheduleLoading(false);
    }
  }, [week]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const changeWeek = useCallback((anchor) => {
    setWeek(getWeekRange(anchor));
    setAssignmentError(null);
    setSuccess(null);
  }, []);

  const submitAssignment = useCallback(async (payload) => {
    setSubmitting(true);
    setAssignmentError(null);
    setSuccess(null);
    try {
      const created = await assignShift(payload);
      setSuccess(created);
      await loadSchedules();
      return { success: true, data: created };
    } catch (requestError) {
      const normalized = {
        code: requestError.code,
        message: requestError.message || 'Không thể phân ca',
        details: requestError.details,
      };
      setAssignmentError(normalized);
      return { success: false, error: normalized };
    } finally {
      setSubmitting(false);
    }
  }, [loadSchedules]);

  return useMemo(() => ({
    week,
    staff,
    shifts,
    schedules,
    optionsLoading,
    scheduleLoading,
    error,
    assignmentError,
    success,
    submitting,
    changeWeek,
    refresh: async () => Promise.all([loadOptions(), loadSchedules()]),
    submitAssignment,
  }), [
    week, staff, shifts, schedules, optionsLoading, scheduleLoading, error,
    assignmentError, success, submitting, changeWeek, loadOptions, loadSchedules,
    submitAssignment,
  ]);
}
