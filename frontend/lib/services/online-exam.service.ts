import api from '../api';

export interface AnswerItem {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  isFlaggedForReview?: boolean;
  version: number;
  clientTimestamp: string;
}

export interface ProctoringEventItem {
  eventType: string;
  severity?: string;
  duration?: number;
  metadata?: any;
  evidenceUrl?: string;
}

export const onlineExamService = {
  // --- STUDENT API ---
  async checkEligibility(scheduleId: number) {
    const res = await api.get(`/online-exams/schedule/${scheduleId}/check-eligibility`, {
      params: { noCache: true },
    });
    return res.data;
  },

  async startAttempt(scheduleId: number, deviceInfo?: string, deviceFingerprint?: string) {
    const res = await api.post(`/online-exams/schedule/${scheduleId}/start`, {
      deviceInfo,
      deviceFingerprint,
    });
    return res.data;
  },

  async getAttemptQuestions(token: string) {
    const res = await api.get(`/online-exams/attempt/${token}/questions`, {
      params: { noCache: true },
    });
    return res.data;
  },

  async saveAnswers(token: string, answers: AnswerItem[]) {
    const res = await api.post(`/online-exams/attempt/${token}/answers/save`, { answers });
    return res.data;
  },

  async heartbeat(token: string) {
    const res = await api.post(`/online-exams/attempt/${token}/heartbeat`);
    return res.data;
  },

  async recordEvents(token: string, events: ProctoringEventItem[]) {
    const res = await api.post(`/online-exams/attempt/${token}/events`, { events });
    return res.data;
  },

  async submitAttempt(token: string) {
    const res = await api.post(`/online-exams/attempt/${token}/submit`);
    return res.data;
  },

  async getAttemptResult(attemptId: string) {
    const res = await api.get(`/online-exams/attempt/${attemptId}/result`, {
      params: { noCache: true },
    });
    return res.data;
  },

  async submitAppeal(attemptId: string, reason: string) {
    const res = await api.post(`/online-exams/attempt/${attemptId}/appeal`, { reason });
    return res.data;
  },

  // --- PROCTOR API ---
  async getLiveDashboard(scheduleRoomId: number) {
    const res = await api.get(`/proctor/live-dashboard/${scheduleRoomId}`, {
      params: { noCache: true },
    });
    return res.data;
  },

  async extendTime(attemptId: string, extraMinutes: number, reason: string) {
    const res = await api.post(`/proctor/attempt/${attemptId}/extend-time`, {
      extraMinutes,
      reason,
    });
    return res.data;
  },

  async reopenAttempt(attemptId: string, reason: string) {
    const res = await api.post(`/proctor/attempt/${attemptId}/reopen`, { reason });
    return res.data;
  },

  async flagIncident(attemptId: string, reason: string, decision: string) {
    const res = await api.post(`/proctor/attempt/${attemptId}/flag-incident`, {
      reason,
      decision,
    });
    return res.data;
  },
};
