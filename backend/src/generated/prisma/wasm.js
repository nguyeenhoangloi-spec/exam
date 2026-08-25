
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  email: 'email',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  module: 'module',
  description: 'description',
  sensitive: 'sensitive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  role: 'role',
  permissionId: 'permissionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserPermissionOverrideScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  permissionId: 'permissionId',
  effect: 'effect',
  reason: 'reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserAccessScopeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  resourceId: 'resourceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuthSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  revokedAt: 'revokedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name'
};

exports.Prisma.ClassScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  departmentId: 'departmentId'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  studentCode: 'studentCode',
  fullName: 'fullName',
  gender: 'gender',
  dateOfBirth: 'dateOfBirth',
  email: 'email',
  phone: 'phone',
  classId: 'classId',
  userId: 'userId'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  teacherCode: 'teacherCode',
  fullName: 'fullName',
  degree: 'degree',
  email: 'email',
  phone: 'phone',
  departmentId: 'departmentId',
  userId: 'userId'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  subjectCode: 'subjectCode',
  subjectName: 'subjectName',
  credits: 'credits',
  departmentId: 'departmentId'
};

exports.Prisma.MajorSubjectScalarFieldEnum = {
  id: 'id',
  departmentId: 'departmentId',
  subjectId: 'subjectId',
  type: 'type',
  recommendedSemester: 'recommendedSemester',
  note: 'note',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChapterScalarFieldEnum = {
  id: 'id',
  subjectId: 'subjectId',
  code: 'code',
  name: 'name',
  order: 'order',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentSubjectScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  subjectId: 'subjectId',
  semester: 'semester',
  schoolYear: 'schoolYear',
  status: 'status'
};

exports.Prisma.ExamPeriodScalarFieldEnum = {
  id: 'id',
  name: 'name',
  semester: 'semester',
  schoolYear: 'schoolYear',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status'
};

exports.Prisma.ExamScheduleScalarFieldEnum = {
  id: 'id',
  examPeriodId: 'examPeriodId',
  subjectId: 'subjectId',
  examDate: 'examDate',
  startTime: 'startTime',
  endTime: 'endTime',
  examType: 'examType',
  mode: 'mode',
  status: 'status',
  note: 'note',
  deletedAt: 'deletedAt',
  deletedById: 'deletedById'
};

exports.Prisma.ExamRoomScalarFieldEnum = {
  id: 'id',
  roomCode: 'roomCode',
  roomName: 'roomName',
  building: 'building',
  capacity: 'capacity',
  roomType: 'roomType',
  status: 'status'
};

exports.Prisma.ExamScheduleRoomScalarFieldEnum = {
  id: 'id',
  examScheduleId: 'examScheduleId',
  roomId: 'roomId'
};

exports.Prisma.ExamRoomStudentScalarFieldEnum = {
  id: 'id',
  examScheduleRoomId: 'examScheduleRoomId',
  studentId: 'studentId',
  examNumber: 'examNumber',
  seatNumber: 'seatNumber',
  status: 'status'
};

exports.Prisma.ExamSupervisorScalarFieldEnum = {
  id: 'id',
  examScheduleRoomId: 'examScheduleRoomId',
  teacherId: 'teacherId',
  role: 'role',
  status: 'status',
  note: 'note'
};

exports.Prisma.TeacherDutyAvailabilityScalarFieldEnum = {
  id: 'id',
  teacherId: 'teacherId',
  examDate: 'examDate',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  note: 'note',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupervisorChangeRequestScalarFieldEnum = {
  id: 'id',
  examSupervisorId: 'examSupervisorId',
  requesterTeacherId: 'requesterTeacherId',
  replacementTeacherId: 'replacementTeacherId',
  reason: 'reason',
  status: 'status',
  reviewNote: 'reviewNote',
  reviewedById: 'reviewedById',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuestionScalarFieldEnum = {
  id: 'id',
  code: 'code',
  subjectId: 'subjectId',
  chapterId: 'chapterId',
  content: 'content',
  contentRich: 'contentRich',
  normalizedContent: 'normalizedContent',
  type: 'type',
  difficulty: 'difficulty',
  bloomLevel: 'bloomLevel',
  score: 'score',
  explanation: 'explanation',
  keywords: 'keywords',
  status: 'status',
  rejectionReason: 'rejectionReason',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  approvedAt: 'approvedAt',
  archivedAt: 'archivedAt',
  createdById: 'createdById',
  approvedById: 'approvedById'
};

exports.Prisma.QuestionHistoryScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  action: 'action',
  oldData: 'oldData',
  newData: 'newData',
  note: 'note',
  createdAt: 'createdAt',
  changedById: 'changedById'
};

exports.Prisma.QuestionOptionScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  label: 'label',
  content: 'content',
  contentRich: 'contentRich',
  isCorrect: 'isCorrect',
  order: 'order'
};

exports.Prisma.FillBlankAnswerScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  blankIndex: 'blankIndex',
  answer: 'answer',
  normalizedAnswer: 'normalizedAnswer',
  acceptedAnswers: 'acceptedAnswers',
  score: 'score',
  caseSensitive: 'caseSensitive',
  ignoreWhitespace: 'ignoreWhitespace',
  ignoreVietnameseTone: 'ignoreVietnameseTone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuestionMediaScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  optionId: 'optionId',
  url: 'url',
  mimeType: 'mimeType',
  fileName: 'fileName',
  width: 'width',
  height: 'height',
  sortOrder: 'sortOrder',
  altText: 'altText',
  createdAt: 'createdAt'
};

exports.Prisma.QuestionStatisticScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  usedCount: 'usedCount',
  totalAnswers: 'totalAnswers',
  correctAnswers: 'correctAnswers',
  lastUsedAt: 'lastUsedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExamPaperScalarFieldEnum = {
  id: 'id',
  examScheduleId: 'examScheduleId',
  paperCode: 'paperCode',
  title: 'title',
  durationMinutes: 'durationMinutes',
  totalScore: 'totalScore',
  status: 'status',
  publishedAt: 'publishedAt',
  archivedAt: 'archivedAt',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById'
};

exports.Prisma.ExamPaperQuestionScalarFieldEnum = {
  id: 'id',
  examPaperId: 'examPaperId',
  questionId: 'questionId',
  questionOrder: 'questionOrder',
  score: 'score',
  usedAt: 'usedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  description: 'description',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.SecurityAuditEventScalarFieldEnum = {
  id: 'id',
  occurredAt: 'occurredAt',
  category: 'category',
  action: 'action',
  outcome: 'outcome',
  actorId: 'actorId',
  subjectUserId: 'subjectUserId',
  entityType: 'entityType',
  entityId: 'entityId',
  requestId: 'requestId',
  httpMethod: 'httpMethod',
  route: 'route',
  ipAddress: 'ipAddress',
  ipHash: 'ipHash',
  location: 'location',
  userAgentHash: 'userAgentHash',
  metadata: 'metadata',
  previousHash: 'previousHash',
  eventHash: 'eventHash',
  retentionUntil: 'retentionUntil',
  archivedAt: 'archivedAt',
  legalHold: 'legalHold'
};

exports.Prisma.SecurityAuditRetentionPolicyScalarFieldEnum = {
  id: 'id',
  category: 'category',
  hotDays: 'hotDays',
  retainDays: 'retainDays',
  rawIpDays: 'rawIpDays',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SecurityAuditLegalHoldScalarFieldEnum = {
  id: 'id',
  eventId: 'eventId',
  reason: 'reason',
  caseReference: 'caseReference',
  createdById: 'createdById',
  releasedAt: 'releasedAt',
  releasedById: 'releasedById',
  createdAt: 'createdAt'
};

exports.Prisma.DocumentTemplateScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  dataSource: 'dataSource',
  description: 'description',
  isDefault: 'isDefault',
  createdById: 'createdById',
  updatedById: 'updatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentTemplateVersionScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  version: 'version',
  status: 'status',
  config: 'config',
  createdById: 'createdById',
  publishedById: 'publishedById',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OnlineExamConfigScalarFieldEnum = {
  id: 'id',
  examScheduleId: 'examScheduleId',
  examPaperId: 'examPaperId',
  mode: 'mode',
  requireWebcam: 'requireWebcam',
  requireMic: 'requireMic',
  requireFullscreen: 'requireFullscreen',
  preventTabSwitch: 'preventTabSwitch',
  preventCopyPaste: 'preventCopyPaste',
  shuffleQuestions: 'shuffleQuestions',
  shuffleOptions: 'shuffleOptions',
  maxAllowedViolations: 'maxAllowedViolations',
  showImages: 'showImages',
  showVideos: 'showVideos',
  showAudios: 'showAudios',
  showResultImmediately: 'showResultImmediately',
  allowReview: 'allowReview',
  essayEnabled: 'essayEnabled',
  allowEssayFileUpload: 'allowEssayFileUpload',
  maxEssayFileSizeMb: 'maxEssayFileSizeMb',
  showEssayResultAfterApproval: 'showEssayResultAfterApproval',
  ipWhitelist: 'ipWhitelist',
  requireDeviceBinding: 'requireDeviceBinding',
  accessCode: 'accessCode',
  examPasswordHash: 'examPasswordHash',
  lateEntryWindowMinutes: 'lateEntryWindowMinutes',
  requireRulesAcceptance: 'requireRulesAcceptance',
  maxAttempts: 'maxAttempts',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExamSecurityPolicyScalarFieldEnum = {
  id: 'id',
  onlineExamConfigId: 'onlineExamConfigId',
  weightTabHidden: 'weightTabHidden',
  weightWindowBlur: 'weightWindowBlur',
  weightExitFull: 'weightExitFull',
  weightCopyPaste: 'weightCopyPaste',
  weightMultiSession: 'weightMultiSession',
  weightFaceMissing: 'weightFaceMissing',
  weightMultiFace: 'weightMultiFace',
  reviewThreshold: 'reviewThreshold'
};

exports.Prisma.ExamAttemptScalarFieldEnum = {
  id: 'id',
  onlineExamConfigId: 'onlineExamConfigId',
  studentId: 'studentId',
  mode: 'mode',
  attemptNumber: 'attemptNumber',
  attemptToken: 'attemptToken',
  status: 'status',
  startTime: 'startTime',
  endTime: 'endTime',
  expectedEndTime: 'expectedEndTime',
  submittedAt: 'submittedAt',
  extraMinutes: 'extraMinutes',
  extraTimeReason: 'extraTimeReason',
  clientIp: 'clientIp',
  userAgent: 'userAgent',
  deviceFingerprint: 'deviceFingerprint',
  totalScore: 'totalScore',
  maxScore: 'maxScore',
  penaltyPoints: 'penaltyPoints',
  penaltyReason: 'penaltyReason',
  riskScore: 'riskScore',
  isFlagged: 'isFlagged',
  gradingStatus: 'gradingStatus',
  gradedById: 'gradedById',
  gradedAt: 'gradedAt',
  approvedById: 'approvedById',
  approvedAt: 'approvedAt',
  publishedAt: 'publishedAt',
  rulesAcceptedAt: 'rulesAcceptedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExamSnapshotScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  paperTitle: 'paperTitle',
  duration: 'duration',
  questionCount: 'questionCount',
  snapshotData: 'snapshotData',
  createdAt: 'createdAt'
};

exports.Prisma.AttemptAnswerScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  questionId: 'questionId',
  selectedOptionIds: 'selectedOptionIds',
  textAnswer: 'textAnswer',
  textAnswerRich: 'textAnswerRich',
  fillBlankAnswers: 'fillBlankAnswers',
  fillBlankScore: 'fillBlankScore',
  fillBlankResult: 'fillBlankResult',
  isFlaggedForReview: 'isFlaggedForReview',
  lastSavedAt: 'lastSavedAt',
  submittedAt: 'submittedAt',
  gradingStatus: 'gradingStatus',
  teacherComment: 'teacherComment',
  finalScore: 'finalScore',
  aiSuggestedScore: 'aiSuggestedScore',
  aiSuggestedComment: 'aiSuggestedComment',
  aiConfidence: 'aiConfidence',
  aiGeneratedAt: 'aiGeneratedAt',
  aiConfirmedById: 'aiConfirmedById',
  aiConfirmedAt: 'aiConfirmedAt',
  rubricVersionId: 'rubricVersionId',
  version: 'version',
  clientTimestamp: 'clientTimestamp',
  serverTimestamp: 'serverTimestamp'
};

exports.Prisma.EssayGradeHistoryScalarFieldEnum = {
  id: 'id',
  attemptAnswerId: 'attemptAnswerId',
  criterionId: 'criterionId',
  oldScore: 'oldScore',
  newScore: 'newScore',
  oldComment: 'oldComment',
  newComment: 'newComment',
  actorId: 'actorId',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.EssayRubricCriterionScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  label: 'label',
  description: 'description',
  fullCreditGuide: 'fullCreditGuide',
  partialCreditGuide: 'partialCreditGuide',
  zeroCreditGuide: 'zeroCreditGuide',
  acceptedConcepts: 'acceptedConcepts',
  commonMistakes: 'commonMistakes',
  scoreStep: 'scoreStep',
  maxScore: 'maxScore',
  sortOrder: 'sortOrder',
  rubricVersionId: 'rubricVersionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EssayRubricVersionScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  version: 'version',
  referenceAnswer: 'referenceAnswer',
  gradingGuidance: 'gradingGuidance',
  totalScore: 'totalScore',
  isLocked: 'isLocked',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.EssayAiGradingRunScalarFieldEnum = {
  id: 'id',
  attemptAnswerId: 'attemptAnswerId',
  rubricVersionId: 'rubricVersionId',
  status: 'status',
  provider: 'provider',
  model: 'model',
  suggestedScore: 'suggestedScore',
  overallComment: 'overallComment',
  confidence: 'confidence',
  warning: 'warning',
  errorMessage: 'errorMessage',
  requestedById: 'requestedById',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.EssayAiCriterionResultScalarFieldEnum = {
  id: 'id',
  aiGradingRunId: 'aiGradingRunId',
  criterionId: 'criterionId',
  suggestedScore: 'suggestedScore',
  achievementLevel: 'achievementLevel',
  comment: 'comment',
  evidenceQuote: 'evidenceQuote',
  createdAt: 'createdAt'
};

exports.Prisma.EssayGradeScalarFieldEnum = {
  id: 'id',
  attemptAnswerId: 'attemptAnswerId',
  criterionId: 'criterionId',
  score: 'score',
  comment: 'comment',
  gradedById: 'gradedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EssaySubmissionFileScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  answerId: 'answerId',
  url: 'url',
  fileName: 'fileName',
  mimeType: 'mimeType',
  size: 'size',
  createdAt: 'createdAt'
};

exports.Prisma.ProctoringEventScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  eventType: 'eventType',
  severity: 'severity',
  occurredAt: 'occurredAt',
  duration: 'duration',
  metadata: 'metadata',
  evidenceUrl: 'evidenceUrl',
  reviewStatus: 'reviewStatus',
  reviewerNote: 'reviewerNote'
};

exports.Prisma.DeviceSessionScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  sessionToken: 'sessionToken',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  isActive: 'isActive',
  lastSeenAt: 'lastSeenAt'
};

exports.Prisma.ExamIncidentScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  reportedById: 'reportedById',
  reason: 'reason',
  decision: 'decision',
  studentAppeal: 'studentAppeal',
  reviewerNote: 'reviewerNote',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt'
};

exports.Prisma.GradeAppealScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  studentId: 'studentId',
  reason: 'reason',
  evidenceUrls: 'evidenceUrls',
  status: 'status',
  originalScore: 'originalScore',
  revisedScore: 'revisedScore',
  reviewerNote: 'reviewerNote',
  reviewerId: 'reviewerId',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BackupJobScalarFieldEnum = {
  id: 'id',
  snapshotId: 'snapshotId',
  type: 'type',
  status: 'status',
  storageKey: 'storageKey',
  manifestKey: 'manifestKey',
  checksum: 'checksum',
  sizeBytes: 'sizeBytes',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  appCommit: 'appCommit',
  migration: 'migration',
  errorMessage: 'errorMessage',
  retained: 'retained',
  initiatedById: 'initiatedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BackupRestoreRequestScalarFieldEnum = {
  id: 'id',
  backupJobId: 'backupJobId',
  target: 'target',
  status: 'status',
  reason: 'reason',
  confirmationHash: 'confirmationHash',
  requestedById: 'requestedById',
  approvedById: 'approvedById',
  expiresAt: 'expiresAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  message: 'message',
  link: 'link',
  metadata: 'metadata',
  isRead: 'isRead',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.PermissionOverrideEffect = exports.$Enums.PermissionOverrideEffect = {
  ALLOW: 'ALLOW',
  DENY: 'DENY'
};

exports.AccessScopeType = exports.$Enums.AccessScopeType = {
  DEPARTMENT: 'DEPARTMENT',
  CLASS: 'CLASS',
  SUBJECT: 'SUBJECT'
};

exports.SubjectRequirementType = exports.$Enums.SubjectRequirementType = {
  MANDATORY: 'MANDATORY',
  ELECTIVE: 'ELECTIVE'
};

exports.ExamMode = exports.$Enums.ExamMode = {
  MOCK: 'MOCK',
  OFFICIAL: 'OFFICIAL'
};

exports.TeacherAvailabilityStatus = exports.$Enums.TeacherAvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE'
};

exports.SupervisorChangeRequestStatus = exports.$Enums.SupervisorChangeRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.QuestionType = exports.$Enums.QuestionType = {
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  FILL_BLANK: 'FILL_BLANK',
  ESSAY: 'ESSAY'
};

exports.QuestionDifficulty = exports.$Enums.QuestionDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
};

exports.BloomLevel = exports.$Enums.BloomLevel = {
  REMEMBER: 'REMEMBER',
  UNDERSTAND: 'UNDERSTAND',
  APPLY: 'APPLY',
  ANALYZE: 'ANALYZE'
};

exports.QuestionStatus = exports.$Enums.QuestionStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED'
};

exports.QuestionHistoryAction = exports.$Enums.QuestionHistoryAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ARCHIVE: 'ARCHIVE',
  DUPLICATE: 'DUPLICATE',
  RESTORE: 'RESTORE',
  DELETE: 'DELETE',
  BULK_UPDATE: 'BULK_UPDATE'
};

exports.ExamPaperStatus = exports.$Enums.ExamPaperStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

exports.SecurityAuditCategory = exports.$Enums.SecurityAuditCategory = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  DATA_ACCESS: 'DATA_ACCESS',
  DATA_EXPORT: 'DATA_EXPORT',
  EXAMINATION: 'EXAMINATION',
  BACKUP_RECOVERY: 'BACKUP_RECOVERY',
  AI_PROCESSING: 'AI_PROCESSING',
  SYSTEM_SECURITY: 'SYSTEM_SECURITY'
};

exports.SecurityAuditOutcome = exports.$Enums.SecurityAuditOutcome = {
  SUCCESS: 'SUCCESS',
  DENIED: 'DENIED',
  FAILURE: 'FAILURE'
};

exports.DocumentTemplateDataSource = exports.$Enums.DocumentTemplateDataSource = {
  EXAM_SCHEDULE_LIST: 'EXAM_SCHEDULE_LIST',
  ROOM_DOOR_LIST: 'ROOM_DOOR_LIST',
  SUPERVISOR_ASSIGNMENT: 'SUPERVISOR_ASSIGNMENT',
  GRADE_REPORT: 'GRADE_REPORT',
  STUDENT_DIRECTORY: 'STUDENT_DIRECTORY',
  TEACHER_DIRECTORY: 'TEACHER_DIRECTORY',
  GENERIC_REPORT: 'GENERIC_REPORT'
};

exports.DocumentTemplateVersionStatus = exports.$Enums.DocumentTemplateVersionStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

exports.AttemptStatus = exports.$Enums.AttemptStatus = {
  NOT_STARTED: 'NOT_STARTED',
  DEVICE_CHECK: 'DEVICE_CHECK',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  DISCONNECTED: 'DISCONNECTED',
  SUBMITTED: 'SUBMITTED',
  AUTO_SUBMITTED: 'AUTO_SUBMITTED',
  TERMINATED: 'TERMINATED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  GRADED: 'GRADED',
  INVALIDATED: 'INVALIDATED'
};

exports.EssayAttemptGradingStatus = exports.$Enums.EssayAttemptGradingStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  UNDER_GRADING: 'UNDER_GRADING',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED'
};

exports.EssayAnswerGradingStatus = exports.$Enums.EssayAnswerGradingStatus = {
  NOT_GRADED: 'NOT_GRADED',
  IN_PROGRESS: 'IN_PROGRESS',
  GRADED: 'GRADED'
};

exports.EssayAiGradingStatus = exports.$Enums.EssayAiGradingStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED'
};

exports.EssayCriterionAchievementLevel = exports.$Enums.EssayCriterionAchievementLevel = {
  FULL: 'FULL',
  PARTIAL: 'PARTIAL',
  NOT_MET: 'NOT_MET',
  NEEDS_REVIEW: 'NEEDS_REVIEW'
};

exports.ProctoringEventType = exports.$Enums.ProctoringEventType = {
  TAB_HIDDEN: 'TAB_HIDDEN',
  WINDOW_BLUR: 'WINDOW_BLUR',
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
  COPY_ATTEMPT: 'COPY_ATTEMPT',
  PASTE_ATTEMPT: 'PASTE_ATTEMPT',
  CONTEXT_MENU_ATTEMPT: 'CONTEXT_MENU_ATTEMPT',
  NETWORK_DISCONNECTED: 'NETWORK_DISCONNECTED',
  NETWORK_RECONNECTED: 'NETWORK_RECONNECTED',
  PAGE_RELOAD: 'PAGE_RELOAD',
  MULTIPLE_SESSION: 'MULTIPLE_SESSION',
  CAMERA_DISABLED: 'CAMERA_DISABLED',
  FACE_NOT_FOUND: 'FACE_NOT_FOUND',
  MULTIPLE_FACES: 'MULTIPLE_FACES',
  SUSPICIOUS_DEVICE_CHANGE: 'SUSPICIOUS_DEVICE_CHANGE'
};

exports.EventSeverity = exports.$Enums.EventSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.GradeAppealStatus = exports.$Enums.GradeAppealStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED_REGRADE: 'APPROVED_REGRADE',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.BackupJobType = exports.$Enums.BackupJobType = {
  FULL: 'FULL',
  DATABASE: 'DATABASE',
  UPLOADS: 'UPLOADS',
  SAFETY: 'SAFETY'
};

exports.BackupJobStatus = exports.$Enums.BackupJobStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  VERIFYING: 'VERIFYING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  VERIFY_FAILED: 'VERIFY_FAILED',
  CANCELLED: 'CANCELLED'
};

exports.BackupRestoreTarget = exports.$Enums.BackupRestoreTarget = {
  STAGING: 'STAGING',
  PRODUCTION: 'PRODUCTION'
};

exports.BackupRestoreStatus = exports.$Enums.BackupRestoreStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  SCHEDULE_CHANGE: 'SCHEDULE_CHANGE',
  EXAM_CANCELLED: 'EXAM_CANCELLED',
  ASSIGNMENT_UPDATE: 'ASSIGNMENT_UPDATE',
  GENERAL: 'GENERAL',
  SYSTEM: 'SYSTEM'
};

exports.Prisma.ModelName = {
  User: 'User',
  Permission: 'Permission',
  RolePermission: 'RolePermission',
  UserPermissionOverride: 'UserPermissionOverride',
  UserAccessScope: 'UserAccessScope',
  AuthSession: 'AuthSession',
  Department: 'Department',
  Class: 'Class',
  Student: 'Student',
  Teacher: 'Teacher',
  Subject: 'Subject',
  MajorSubject: 'MajorSubject',
  Chapter: 'Chapter',
  StudentSubject: 'StudentSubject',
  ExamPeriod: 'ExamPeriod',
  ExamSchedule: 'ExamSchedule',
  ExamRoom: 'ExamRoom',
  ExamScheduleRoom: 'ExamScheduleRoom',
  ExamRoomStudent: 'ExamRoomStudent',
  ExamSupervisor: 'ExamSupervisor',
  TeacherDutyAvailability: 'TeacherDutyAvailability',
  SupervisorChangeRequest: 'SupervisorChangeRequest',
  Question: 'Question',
  QuestionHistory: 'QuestionHistory',
  QuestionOption: 'QuestionOption',
  FillBlankAnswer: 'FillBlankAnswer',
  QuestionMedia: 'QuestionMedia',
  QuestionStatistic: 'QuestionStatistic',
  ExamPaper: 'ExamPaper',
  ExamPaperQuestion: 'ExamPaperQuestion',
  AuditLog: 'AuditLog',
  SecurityAuditEvent: 'SecurityAuditEvent',
  SecurityAuditRetentionPolicy: 'SecurityAuditRetentionPolicy',
  SecurityAuditLegalHold: 'SecurityAuditLegalHold',
  DocumentTemplate: 'DocumentTemplate',
  DocumentTemplateVersion: 'DocumentTemplateVersion',
  OnlineExamConfig: 'OnlineExamConfig',
  ExamSecurityPolicy: 'ExamSecurityPolicy',
  ExamAttempt: 'ExamAttempt',
  ExamSnapshot: 'ExamSnapshot',
  AttemptAnswer: 'AttemptAnswer',
  EssayGradeHistory: 'EssayGradeHistory',
  EssayRubricCriterion: 'EssayRubricCriterion',
  EssayRubricVersion: 'EssayRubricVersion',
  EssayAiGradingRun: 'EssayAiGradingRun',
  EssayAiCriterionResult: 'EssayAiCriterionResult',
  EssayGrade: 'EssayGrade',
  EssaySubmissionFile: 'EssaySubmissionFile',
  ProctoringEvent: 'ProctoringEvent',
  DeviceSession: 'DeviceSession',
  ExamIncident: 'ExamIncident',
  GradeAppeal: 'GradeAppeal',
  BackupJob: 'BackupJob',
  BackupRestoreRequest: 'BackupRestoreRequest',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
