type VisibilityAttempt = {
  mode?: string | null;
  status?: string | null;
  gradingStatus?: string | null;
  publishedAt?: Date | string | null;
};

type VisibilityConfig = {
  mode?: string | null;
  showResultImmediately?: boolean | null;
  allowReview?: boolean | null;
};

type ExamScheduleTime = {
  examDate?: Date | string | null;
  endTime?: string | null;
};

/**
 * Central security policy for student-facing score and answer visibility.
 * Official exams never disclose scores while the shared exam window is open,
 * and answer keys require an explicit publication in addition to exam closure.
 */
export class OnlineExamVisibilityCore {
  isScheduleEnded(schedule?: ExamScheduleTime | null, now = new Date()): boolean {
    if (!schedule?.examDate || !schedule.endTime) return false;

    const [hours, minutes] = schedule.endTime.split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return false;

    const endAt = new Date(schedule.examDate);
    if (Number.isNaN(endAt.getTime())) return false;
    endAt.setHours(hours, minutes, 0, 0);
    return now >= endAt;
  }

  evaluate(
    attempt: VisibilityAttempt,
    config: VisibilityConfig | null | undefined,
    scheduleEnded: boolean,
  ) {
    const hasEssay = attempt.gradingStatus !== 'NOT_SUBMITTED';
    const isPublished = Boolean(attempt.publishedAt) || attempt.gradingStatus === 'PUBLISHED';
    const mode = attempt.mode || config?.mode || 'OFFICIAL';
    const isOfficial = mode === 'OFFICIAL';

    // Điểm kỳ thi chính thức chỉ được trả ra khi ADMIN đã công bố và ca thi
    // đã kết thúc. Không chỉ ẩn ở UI: mọi API dùng core này đều áp dụng luật.
    const canShowScore = isOfficial
      ? isPublished && scheduleEnded
      : isPublished || Boolean(config?.showResultImmediately);

    const canReviewAnswers = Boolean(config?.allowReview)
      && canShowScore
      && scheduleEnded
      && isPublished;

    return {
      hasEssay,
      isPublished,
      canShowScore,
      canReviewAnswers,
    };
  }
}
