--
-- PostgreSQL database dump
--

-- \restrict qcvDzyaOVu6gJ5eUnV8DiTOqeerQhriE48az41Jquju21mli3pyd2Pg7BLT57G1

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS "teachers_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS "teachers_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS "subjects_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS "students_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS "students_classId_fkey";
ALTER TABLE IF EXISTS ONLY public.student_subjects DROP CONSTRAINT IF EXISTS "student_subjects_subjectId_fkey";
ALTER TABLE IF EXISTS ONLY public.student_subjects DROP CONSTRAINT IF EXISTS "student_subjects_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_subjectId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_chapterId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public.question_statistics DROP CONSTRAINT IF EXISTS "question_statistics_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public.question_options DROP CONSTRAINT IF EXISTS "question_options_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public.question_histories DROP CONSTRAINT IF EXISTS "question_histories_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public.question_histories DROP CONSTRAINT IF EXISTS "question_histories_changedById_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_supervisors DROP CONSTRAINT IF EXISTS "exam_supervisors_teacherId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_supervisors DROP CONSTRAINT IF EXISTS "exam_supervisors_examScheduleRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_schedules DROP CONSTRAINT IF EXISTS "exam_schedules_subjectId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_schedules DROP CONSTRAINT IF EXISTS "exam_schedules_examPeriodId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_schedule_rooms DROP CONSTRAINT IF EXISTS "exam_schedule_rooms_roomId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_schedule_rooms DROP CONSTRAINT IF EXISTS "exam_schedule_rooms_examScheduleId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_room_students DROP CONSTRAINT IF EXISTS "exam_room_students_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_room_students DROP CONSTRAINT IF EXISTS "exam_room_students_examScheduleRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_papers DROP CONSTRAINT IF EXISTS "exam_papers_examScheduleId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_papers DROP CONSTRAINT IF EXISTS "exam_papers_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_paper_questions DROP CONSTRAINT IF EXISTS "exam_paper_questions_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public.exam_paper_questions DROP CONSTRAINT IF EXISTS "exam_paper_questions_examPaperId_fkey";
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS "classes_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS "chapters_subjectId_fkey";
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."teachers_userId_key";
DROP INDEX IF EXISTS public."teachers_teacherCode_key";
DROP INDEX IF EXISTS public."subjects_subjectCode_key";
DROP INDEX IF EXISTS public."students_userId_key";
DROP INDEX IF EXISTS public."students_studentCode_key";
DROP INDEX IF EXISTS public."questions_subjectId_chapterId_status_idx";
DROP INDEX IF EXISTS public."questions_normalizedContent_trgm_idx";
DROP INDEX IF EXISTS public."questions_createdById_createdAt_idx";
DROP INDEX IF EXISTS public.questions_code_key;
DROP INDEX IF EXISTS public."question_statistics_questionId_key";
DROP INDEX IF EXISTS public."question_options_questionId_order_key";
DROP INDEX IF EXISTS public."question_histories_questionId_createdAt_idx";
DROP INDEX IF EXISTS public."exam_rooms_roomCode_key";
DROP INDEX IF EXISTS public.departments_code_key;
DROP INDEX IF EXISTS public.classes_code_key;
DROP INDEX IF EXISTS public."chapters_subjectId_order_key";
DROP INDEX IF EXISTS public."chapters_subjectId_code_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS teachers_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY public.student_subjects DROP CONSTRAINT IF EXISTS student_subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY public.question_statistics DROP CONSTRAINT IF EXISTS question_statistics_pkey;
ALTER TABLE IF EXISTS ONLY public.question_options DROP CONSTRAINT IF EXISTS question_options_pkey;
ALTER TABLE IF EXISTS ONLY public.question_histories DROP CONSTRAINT IF EXISTS question_histories_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_supervisors DROP CONSTRAINT IF EXISTS exam_supervisors_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_schedules DROP CONSTRAINT IF EXISTS exam_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_schedule_rooms DROP CONSTRAINT IF EXISTS exam_schedule_rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_rooms DROP CONSTRAINT IF EXISTS exam_rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_room_students DROP CONSTRAINT IF EXISTS exam_room_students_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_periods DROP CONSTRAINT IF EXISTS exam_periods_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_papers DROP CONSTRAINT IF EXISTS exam_papers_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_paper_questions DROP CONSTRAINT IF EXISTS exam_paper_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.classes DROP CONSTRAINT IF EXISTS classes_pkey;
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS chapters_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.teachers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subjects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.students ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.student_subjects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_supervisors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_schedules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_schedule_rooms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_rooms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_room_students ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_periods ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_papers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exam_paper_questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.departments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.classes ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.teachers_id_seq;
DROP TABLE IF EXISTS public.teachers;
DROP SEQUENCE IF EXISTS public.subjects_id_seq;
DROP TABLE IF EXISTS public.subjects;
DROP SEQUENCE IF EXISTS public.students_id_seq;
DROP TABLE IF EXISTS public.students;
DROP SEQUENCE IF EXISTS public.student_subjects_id_seq;
DROP TABLE IF EXISTS public.student_subjects;
DROP TABLE IF EXISTS public.questions;
DROP TABLE IF EXISTS public.question_statistics;
DROP TABLE IF EXISTS public.question_options;
DROP TABLE IF EXISTS public.question_histories;
DROP SEQUENCE IF EXISTS public.question_code_seq;
DROP SEQUENCE IF EXISTS public.exam_supervisors_id_seq;
DROP TABLE IF EXISTS public.exam_supervisors;
DROP SEQUENCE IF EXISTS public.exam_schedules_id_seq;
DROP TABLE IF EXISTS public.exam_schedules;
DROP SEQUENCE IF EXISTS public.exam_schedule_rooms_id_seq;
DROP TABLE IF EXISTS public.exam_schedule_rooms;
DROP SEQUENCE IF EXISTS public.exam_rooms_id_seq;
DROP TABLE IF EXISTS public.exam_rooms;
DROP SEQUENCE IF EXISTS public.exam_room_students_id_seq;
DROP TABLE IF EXISTS public.exam_room_students;
DROP SEQUENCE IF EXISTS public.exam_periods_id_seq;
DROP TABLE IF EXISTS public.exam_periods;
DROP SEQUENCE IF EXISTS public.exam_papers_id_seq;
DROP TABLE IF EXISTS public.exam_papers;
DROP SEQUENCE IF EXISTS public.exam_paper_questions_id_seq;
DROP TABLE IF EXISTS public.exam_paper_questions;
DROP SEQUENCE IF EXISTS public.departments_id_seq;
DROP TABLE IF EXISTS public.departments;
DROP SEQUENCE IF EXISTS public.classes_id_seq;
DROP TABLE IF EXISTS public.classes;
DROP TABLE IF EXISTS public.chapters;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."QuestionType";
DROP TYPE IF EXISTS public."QuestionStatus";
DROP TYPE IF EXISTS public."QuestionHistoryAction";
DROP TYPE IF EXISTS public."QuestionDifficulty";
DROP TYPE IF EXISTS public."BloomLevel";
DROP EXTENSION IF EXISTS pg_trgm;
--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: BloomLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BloomLevel" AS ENUM (
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE'
);


--
-- Name: QuestionDifficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionDifficulty" AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);


--
-- Name: QuestionHistoryAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionHistoryAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'SUBMIT',
    'APPROVE',
    'REJECT',
    'ARCHIVE',
    'DUPLICATE',
    'RESTORE',
    'DELETE',
    'BULK_UPDATE'
);


--
-- Name: QuestionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionType" AS ENUM (
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'FILL_BLANK',
    'ESSAY'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: chapters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapters (
    id uuid NOT NULL,
    "subjectId" integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "departmentId" integer NOT NULL
);


--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: exam_paper_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_paper_questions (
    id integer NOT NULL,
    "examPaperId" integer NOT NULL,
    "questionId" uuid NOT NULL,
    "questionOrder" integer NOT NULL,
    score double precision NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: exam_paper_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_paper_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_paper_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_paper_questions_id_seq OWNED BY public.exam_paper_questions.id;


--
-- Name: exam_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_papers (
    id integer NOT NULL,
    "examScheduleId" integer NOT NULL,
    "paperCode" text NOT NULL,
    title text NOT NULL,
    "durationMinutes" integer NOT NULL,
    "totalScore" double precision NOT NULL,
    "createdById" integer NOT NULL
);


--
-- Name: exam_papers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_papers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_papers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_papers_id_seq OWNED BY public.exam_papers.id;


--
-- Name: exam_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_periods (
    id integer NOT NULL,
    name text NOT NULL,
    semester text NOT NULL,
    "schoolYear" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'UPCOMING'::text NOT NULL
);


--
-- Name: exam_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_periods_id_seq OWNED BY public.exam_periods.id;


--
-- Name: exam_room_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_room_students (
    id integer NOT NULL,
    "examScheduleRoomId" integer NOT NULL,
    "studentId" integer NOT NULL,
    "examNumber" text NOT NULL,
    "seatNumber" integer NOT NULL,
    status text DEFAULT 'ASSIGNED'::text NOT NULL
);


--
-- Name: exam_room_students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_room_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_room_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_room_students_id_seq OWNED BY public.exam_room_students.id;


--
-- Name: exam_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_rooms (
    id integer NOT NULL,
    "roomCode" text NOT NULL,
    "roomName" text NOT NULL,
    building text NOT NULL,
    capacity integer NOT NULL,
    "roomType" text DEFAULT 'THI_LY_THUYET'::text NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL
);


--
-- Name: exam_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_rooms_id_seq OWNED BY public.exam_rooms.id;


--
-- Name: exam_schedule_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_schedule_rooms (
    id integer NOT NULL,
    "examScheduleId" integer NOT NULL,
    "roomId" integer NOT NULL
);


--
-- Name: exam_schedule_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_schedule_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_schedule_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_schedule_rooms_id_seq OWNED BY public.exam_schedule_rooms.id;


--
-- Name: exam_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_schedules (
    id integer NOT NULL,
    "examPeriodId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "examDate" timestamp(3) without time zone NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "examType" text DEFAULT 'TRAC_NGHIEM'::text NOT NULL,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    note text
);


--
-- Name: exam_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_schedules_id_seq OWNED BY public.exam_schedules.id;


--
-- Name: exam_supervisors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_supervisors (
    id integer NOT NULL,
    "examScheduleRoomId" integer NOT NULL,
    "teacherId" integer NOT NULL,
    role text DEFAULT 'SUPERVISOR_1'::text NOT NULL,
    note text
);


--
-- Name: exam_supervisors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_supervisors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_supervisors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_supervisors_id_seq OWNED BY public.exam_supervisors.id;


--
-- Name: question_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_histories (
    id uuid NOT NULL,
    "questionId" uuid NOT NULL,
    action public."QuestionHistoryAction" NOT NULL,
    "oldData" jsonb,
    "newData" jsonb,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "changedById" integer NOT NULL
);


--
-- Name: question_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_options (
    id uuid NOT NULL,
    "questionId" uuid NOT NULL,
    label text NOT NULL,
    content text NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "order" integer NOT NULL
);


--
-- Name: question_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_statistics (
    id uuid NOT NULL,
    "questionId" uuid NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "totalAnswers" integer DEFAULT 0 NOT NULL,
    "correctAnswers" integer DEFAULT 0 NOT NULL,
    "lastUsedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid NOT NULL,
    code text NOT NULL,
    "subjectId" integer NOT NULL,
    "chapterId" uuid NOT NULL,
    content text NOT NULL,
    "normalizedContent" text NOT NULL,
    type public."QuestionType" NOT NULL,
    difficulty public."QuestionDifficulty" DEFAULT 'MEDIUM'::public."QuestionDifficulty" NOT NULL,
    "bloomLevel" public."BloomLevel" DEFAULT 'UNDERSTAND'::public."BloomLevel" NOT NULL,
    score double precision DEFAULT 0.25 NOT NULL,
    explanation text,
    keywords text,
    status public."QuestionStatus" DEFAULT 'DRAFT'::public."QuestionStatus" NOT NULL,
    "rejectionReason" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "createdById" integer NOT NULL,
    "approvedById" integer
);


--
-- Name: student_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_subjects (
    id integer NOT NULL,
    "studentId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    semester text NOT NULL,
    "schoolYear" text NOT NULL,
    status text DEFAULT 'ELIGIBLE'::text NOT NULL
);


--
-- Name: student_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_subjects_id_seq OWNED BY public.student_subjects.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id integer NOT NULL,
    "studentCode" text NOT NULL,
    "fullName" text NOT NULL,
    gender text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone NOT NULL,
    email text NOT NULL,
    phone text,
    "classId" integer NOT NULL,
    "userId" integer NOT NULL
);


--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    "subjectCode" text NOT NULL,
    "subjectName" text NOT NULL,
    credits integer NOT NULL,
    "departmentId" integer NOT NULL
);


--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id integer NOT NULL,
    "teacherCode" text NOT NULL,
    "fullName" text NOT NULL,
    degree text NOT NULL,
    email text NOT NULL,
    phone text,
    "departmentId" integer NOT NULL,
    "userId" integer NOT NULL
);


--
-- Name: teachers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teachers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teachers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teachers_id_seq OWNED BY public.teachers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'STUDENT'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: exam_paper_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_paper_questions ALTER COLUMN id SET DEFAULT nextval('public.exam_paper_questions_id_seq'::regclass);


--
-- Name: exam_papers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_papers ALTER COLUMN id SET DEFAULT nextval('public.exam_papers_id_seq'::regclass);


--
-- Name: exam_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_periods ALTER COLUMN id SET DEFAULT nextval('public.exam_periods_id_seq'::regclass);


--
-- Name: exam_room_students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_room_students ALTER COLUMN id SET DEFAULT nextval('public.exam_room_students_id_seq'::regclass);


--
-- Name: exam_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_rooms ALTER COLUMN id SET DEFAULT nextval('public.exam_rooms_id_seq'::regclass);


--
-- Name: exam_schedule_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedule_rooms ALTER COLUMN id SET DEFAULT nextval('public.exam_schedule_rooms_id_seq'::regclass);


--
-- Name: exam_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedules ALTER COLUMN id SET DEFAULT nextval('public.exam_schedules_id_seq'::regclass);


--
-- Name: exam_supervisors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_supervisors ALTER COLUMN id SET DEFAULT nextval('public.exam_supervisors_id_seq'::regclass);


--
-- Name: student_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects ALTER COLUMN id SET DEFAULT nextval('public.student_subjects_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: teachers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers ALTER COLUMN id SET DEFAULT nextval('public.teachers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c210cba1-a28d-45c0-b142-bbc07ece53dc	de79b79b0d6eb27ba6ab18f784e705df1d9676ca42f463e1c736f6ba511e164e	2026-08-03 15:03:41.1489+07	20260803080204_init_postgresql	\N	\N	2026-08-03 15:03:39.630131+07	1
\.


--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chapters (id, "subjectId", code, name, "order", "createdAt", "updatedAt") FROM stdin;
cba7162a-936b-43c1-8721-b78ace065b10	1	CH01	Chương 1	1	2026-08-03 08:06:13.714	2026-08-03 08:06:13.714
37836e8a-7565-448e-91d2-9238f606a415	1	CH02	Chương 2	2	2026-08-03 08:06:13.719	2026-08-03 08:06:13.719
8adaaae2-09fb-46ca-9369-fdfa3a9695fe	1	CH03	Chương 3	3	2026-08-03 08:06:13.72	2026-08-03 08:06:13.72
4c35d04c-dc05-444c-ad48-93afbabc47db	2	CH01	Chương 1	1	2026-08-03 08:06:13.722	2026-08-03 08:06:13.722
ac42935e-5ccd-4b7c-97bc-de6b9840b10e	2	CH04	Chương 4	4	2026-08-03 08:06:13.725	2026-08-03 08:06:13.725
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classes (id, code, name, "departmentId") FROM stdin;
1	CNTT-K65	Lớp CNTT K65	1
2	DTVT-K65	Lớp DTVT K65	2
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, code, name) FROM stdin;
1	CNTT	Khoa Công nghệ thông tin
2	DTVT	Khoa Điện tử viễn thông
\.


--
-- Data for Name: exam_paper_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_paper_questions (id, "examPaperId", "questionId", "questionOrder", score, "usedAt") FROM stdin;
\.


--
-- Data for Name: exam_papers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_papers (id, "examScheduleId", "paperCode", title, "durationMinutes", "totalScore", "createdById") FROM stdin;
\.


--
-- Data for Name: exam_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_periods (id, name, semester, "schoolYear", "startDate", "endDate", status) FROM stdin;
1	Kỳ thi Cuối học kỳ 1 (2025-2026)	HK1	2025-2026	2026-08-01 00:00:00	2026-08-30 00:00:00	ONGOING
\.


--
-- Data for Name: exam_room_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_room_students (id, "examScheduleRoomId", "studentId", "examNumber", "seatNumber", status) FROM stdin;
1	1	1	SBD0001	1	ASSIGNED
2	1	2	SBD0002	2	ASSIGNED
3	1	3	SBD0003	3	ASSIGNED
4	1	4	SBD0004	4	ASSIGNED
\.


--
-- Data for Name: exam_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_rooms (id, "roomCode", "roomName", building, capacity, "roomType", status) FROM stdin;
1	P101	Phòng thi P101	Nhà A2	40	THI_LY_THUYET	AVAILABLE
2	P102	Phòng thi P102	Nhà A2	30	THI_LY_THUYET	AVAILABLE
3	PM201	Phòng Máy PM201	Nhà B1	50	THI_MAY_TINH	AVAILABLE
\.


--
-- Data for Name: exam_schedule_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_schedule_rooms (id, "examScheduleId", "roomId") FROM stdin;
1	1	1
\.


--
-- Data for Name: exam_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_schedules (id, "examPeriodId", "subjectId", "examDate", "startTime", "endTime", "examType", status, note) FROM stdin;
1	1	1	2026-08-15 00:00:00	08:00	09:30	TRAC_NGHIEM	SCHEDULED	Thi trắc nghiệm tập trung
\.


--
-- Data for Name: exam_supervisors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_supervisors (id, "examScheduleRoomId", "teacherId", role, note) FROM stdin;
\.


--
-- Data for Name: question_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_histories (id, "questionId", action, "oldData", "newData", note, "createdAt", "changedById") FROM stdin;
c5bc3df2-66e2-4647-9225-8dffccf940d7	36cca545-51b1-4d61-8960-a9ff74b3e79f	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.883	1
f81b2912-23d4-419c-893d-827f086645fb	25e33c73-fa65-4aab-8393-ac7a48c61fb6	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.924	1
a15d122b-4f82-4af4-94ff-fa9e1c8f9f8f	508d83e3-b641-42e3-974f-6df9189a9e63	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.939	1
9b4d11c5-b422-458b-bf7e-11b2b5f42d53	5af149ff-7df3-4ebe-82e2-efc2179e7d74	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.955	1
333cdbb6-1be8-4d80-a928-61811d549e0d	52a0bff8-5a71-4427-8a62-592ab6b6d48e	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.969	1
b65fdcc6-8292-4a58-8502-4cb85af3eb7d	591e11c3-d8bf-4c07-801c-c4cadd67c906	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:21.985	1
1ed09a91-222a-4e9b-9a4f-d9abb3c21b96	1a9fe178-fa37-45ff-bede-bd673476379d	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:22.001	1
ebf386bf-4abb-4864-85f9-41f0b9fbef94	69842f7f-2cc5-4707-8cd6-3db17359f364	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:22.017	1
e471f093-0b4b-4444-9cb0-6d18ec1076e6	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:22.033	1
74ecf244-746b-43e4-bfac-5a4000139c69	10a7808c-8690-440b-b8e7-a3606339d63b	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:35:22.048	1
aee83fae-9e18-49d7-aebc-3990450d88d6	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	CREATE	\N	\N	Tạo câu hỏi nháp	2026-08-03 07:36:00.03	1
\.


--
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_options (id, "questionId", label, content, "isCorrect", "order") FROM stdin;
af2e86cd-d1d4-42c2-b5aa-e329e579a6f6	d26abc56-0f70-401d-86e9-1160f3731c1e	A	Tính kế thừa (Inheritance)	f	0
9410afbf-8b2a-41a5-9283-d76bdce76605	d26abc56-0f70-401d-86e9-1160f3731c1e	B	Tính đóng gói (Encapsulation)	t	1
89739804-8352-4d98-af05-e0939320f266	d26abc56-0f70-401d-86e9-1160f3731c1e	C	Tính đa hình (Polymorphism)	f	2
3475c14f-cfe6-4142-b237-62e1f424c049	d26abc56-0f70-401d-86e9-1160f3731c1e	D	Tính trừu tượng (Abstraction)	f	3
b3b12ca6-2ef4-4a2a-80ba-e029ec72b8c1	4046387c-26b6-4499-a073-645784e0e22c	A	implements	f	0
c871bda7-7833-4544-b757-96840c633789	4046387c-26b6-4499-a073-645784e0e22c	B	extends	t	1
0f5a5a43-52aa-422e-a6ba-366d61a3bd51	4046387c-26b6-4499-a073-645784e0e22c	C	inherits	f	2
14216180-dfd7-4e8e-96cb-7afb84b6aa6f	4046387c-26b6-4499-a073-645784e0e22c	D	super	f	3
dc144cb5-2c35-4b86-9a88-c1bb04d537b9	f4fac05d-2c87-414d-b3d4-32845051c8d4	A	Cùng tên và cùng kiểu dữ liệu tham số	f	0
53884e86-9fb9-4625-a7f5-63acfa44f330	f4fac05d-2c87-414d-b3d4-32845051c8d4	B	Cùng tên nhưng khác danh sách tham số trong cùng một lớp	t	1
2afdcbae-785a-465a-aa87-2981b1002343	f4fac05d-2c87-414d-b3d4-32845051c8d4	C	Phương thức lớp con ghi đè phương thức lớp cha	f	2
bb32c92d-63ef-48eb-a297-18711d5d4b47	f4fac05d-2c87-414d-b3d4-32845051c8d4	D	Phương thức static gọi phương thức instance	f	3
228ed871-64b5-4a50-a443-86ed353782b9	30537926-c363-49bc-8e1d-de073ef1d3b5	A	Cùng chữ ký phương thức giữa lớp con và lớp cha	t	0
4387528e-fc62-4239-905f-1f0d73e6be7b	30537926-c363-49bc-8e1d-de073ef1d3b5	B	Khác tên phương thức	f	1
31b1568b-37fd-4371-9dc8-9d20c25cd6be	30537926-c363-49bc-8e1d-de073ef1d3b5	C	Phải dùng từ khóa private	f	2
94e0206d-ac08-4700-a5c0-755673de7b8d	30537926-c363-49bc-8e1d-de073ef1d3b5	D	Không được truyền tham số	f	3
24b636d9-31f3-4921-8bcd-e2f1c63f566c	251b4357-59b8-4777-9ceb-431a0ec75871	A	Single Responsibility Principle	t	0
1b285678-6c94-44a2-abe9-07e0f5b85574	251b4357-59b8-4777-9ceb-431a0ec75871	B	Subclass Substitution Principle	f	1
9d870e82-0bc7-4630-bc4a-e33a43b9bfca	251b4357-59b8-4777-9ceb-431a0ec75871	C	Shared State Principle	f	2
e7e204a3-9d29-4e90-92ad-93ef56620f3e	251b4357-59b8-4777-9ceb-431a0ec75871	D	Sequential Execution Principle	f	3
21cd104d-508e-4289-a1fc-64792e27e3d7	1d9893bf-fcd0-404f-a10c-03ce235fcd03	A	Có thể tạo vô số thể hiện	f	0
d8063a04-790b-4041-829b-37eeb3919f6b	1d9893bf-fcd0-404f-a10c-03ce235fcd03	B	Một lớp chỉ có duy nhất một instance duy nhất	t	1
04ef4d7a-00d9-4ce4-b33e-c4d8a30535a7	1d9893bf-fcd0-404f-a10c-03ce235fcd03	C	Dữ liệu được lưu trữ ngầm	f	2
36e4bb07-e555-4fcc-a308-7ad7b5df495a	1d9893bf-fcd0-404f-a10c-03ce235fcd03	D	Không thể khởi tạo thuộc tính static	f	3
9b2c64e8-48e5-4b91-943b-4569743b81cf	36cca545-51b1-4d61-8960-a9ff74b3e79f	A	Khái niệm cơ bản và nguyên lý về Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
a7bf6581-d6f7-4b65-8fff-663c43fa7caa	36cca545-51b1-4d61-8960-a9ff74b3e79f	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
24b27fa6-02da-4cfe-bc8b-75ea65eb6d0e	36cca545-51b1-4d61-8960-a9ff74b3e79f	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
4c2731c4-44c9-4026-aab3-039ef83b359f	36cca545-51b1-4d61-8960-a9ff74b3e79f	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
28d95d27-11f1-4da0-996e-271f522ab522	25e33c73-fa65-4aab-8393-ac7a48c61fb6	A	Ứng dụng và đặc điểm quan trọng của Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
a7f7973e-652e-45c4-901c-638eaeb004b0	25e33c73-fa65-4aab-8393-ac7a48c61fb6	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
0393ab89-769c-4e32-88bb-2c66232a1a5e	25e33c73-fa65-4aab-8393-ac7a48c61fb6	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
81033b56-46c6-43b7-9f28-452e78af2ac2	25e33c73-fa65-4aab-8393-ac7a48c61fb6	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
278ea2c8-7a5b-417d-8e6b-87e1d3a058d0	508d83e3-b641-42e3-974f-6df9189a9e63	A	Phương pháp triển khai và tối ưu trong Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
28a7945c-f773-441c-a889-8cc2b5548902	508d83e3-b641-42e3-974f-6df9189a9e63	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
6ac941c4-e931-40ec-936e-18064887edea	508d83e3-b641-42e3-974f-6df9189a9e63	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
26d6d605-1cee-4253-a5f5-691fd3dffb1a	508d83e3-b641-42e3-974f-6df9189a9e63	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
1a4f13e2-d851-4d1d-8dd7-78fe7e0b388d	5af149ff-7df3-4ebe-82e2-efc2179e7d74	A	Quy trình xử lý chuẩn đối với Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
96d884c5-f6cf-48ae-ba0f-5aeebaffc12f	5af149ff-7df3-4ebe-82e2-efc2179e7d74	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
92517964-7dbc-4e35-8e1b-de023216393a	5af149ff-7df3-4ebe-82e2-efc2179e7d74	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
f629d061-6645-44e5-8a3e-450c08a79e4d	5af149ff-7df3-4ebe-82e2-efc2179e7d74	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
d61452e3-bc7a-42c6-bb2e-acca1c8a2892	52a0bff8-5a71-4427-8a62-592ab6b6d48e	A	Ràng buộc và quy tắc cốt lõi trong Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
b5b1d77b-a384-4b62-941b-6b90dc399d69	52a0bff8-5a71-4427-8a62-592ab6b6d48e	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
2dcb96e1-2710-4ca1-9489-0fd8413914ff	52a0bff8-5a71-4427-8a62-592ab6b6d48e	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
0d8d4919-3939-44ca-8b43-8065f8dba0db	52a0bff8-5a71-4427-8a62-592ab6b6d48e	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
21fe0ffd-ad89-4226-a7b2-8ddc0f105f40	591e11c3-d8bf-4c07-801c-c4cadd67c906	A	Khái niệm cơ bản và nguyên lý về Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
cc2b4b61-6110-4c0c-948c-4873ffe64647	591e11c3-d8bf-4c07-801c-c4cadd67c906	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
1ba6383b-5aea-4bda-8a4d-604ca25bd9b2	591e11c3-d8bf-4c07-801c-c4cadd67c906	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
3e6ba8c9-8672-49f9-a300-54c235bb4e82	591e11c3-d8bf-4c07-801c-c4cadd67c906	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
4194776f-d415-448e-8fe9-eddd61438991	1a9fe178-fa37-45ff-bede-bd673476379d	A	Ứng dụng và đặc điểm quan trọng của Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
3327ce33-66f4-4c03-9618-abb7c70b3f45	1a9fe178-fa37-45ff-bede-bd673476379d	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
6f485eba-6d52-4837-a9de-70109e2cb48b	1a9fe178-fa37-45ff-bede-bd673476379d	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
6d031c06-ff8a-4f52-9121-cba1b703f101	1a9fe178-fa37-45ff-bede-bd673476379d	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
196bf4e0-5b83-4080-b520-ab9700b62eb8	69842f7f-2cc5-4707-8cd6-3db17359f364	A	Phương pháp triển khai và tối ưu trong Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
8c278634-eb18-411d-93c5-80e429f408b1	69842f7f-2cc5-4707-8cd6-3db17359f364	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
4fd1e709-4d34-4da4-92de-6a858d87472e	69842f7f-2cc5-4707-8cd6-3db17359f364	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
66d67470-ed33-46c7-8d35-9f043f740a4d	69842f7f-2cc5-4707-8cd6-3db17359f364	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
d950b54f-2491-4c4c-9776-725de8de3ffe	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	A	Quy trình xử lý chuẩn đối với Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
e497f726-92b8-4175-b611-e70ed699133d	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
31dc1873-7c04-4453-8edb-3f881fdfcfe9	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
08fc24df-ccdc-4809-a874-4b12a9da3846	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
c725c5a3-c455-4bc3-914b-96b08f6a22d8	10a7808c-8690-440b-b8e7-a3606339d63b	A	Ràng buộc và quy tắc cốt lõi trong Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
355a0d00-12bb-4c16-a4f9-701aeae8dada	10a7808c-8690-440b-b8e7-a3606339d63b	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
48215128-3551-4efe-ab0c-dc8db993f9cc	10a7808c-8690-440b-b8e7-a3606339d63b	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
cf63fabf-d764-4519-8193-b219d3473930	10a7808c-8690-440b-b8e7-a3606339d63b	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
b58a52f1-64b7-4161-8014-5997ac8e50c2	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	A	Khái niệm cơ bản và nguyên lý về Cơ sở dữ liệu được áp dụng chính xác theo tiêu chuẩn.	t	0
dd51812e-4e03-46b2-9ced-473254fd1dba	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	B	Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.	f	1
ab40b321-a075-48e9-bfbe-438334ec7d6e	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	C	Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.	f	2
457580e1-d278-4159-8878-e88139e35df2	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	D	Không cần tuân thủ cấu trúc dữ liệu ban đầu.	f	3
\.


--
-- Data for Name: question_statistics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_statistics (id, "questionId", "usedCount", "totalAnswers", "correctAnswers", "lastUsedAt", "updatedAt") FROM stdin;
207099ec-493f-4b27-b66b-75099635d989	d26abc56-0f70-401d-86e9-1160f3731c1e	0	0	0	\N	2026-08-03 08:06:13.729
bf7c7bcf-4c34-4f1c-be36-f5579ec6f7e5	4046387c-26b6-4499-a073-645784e0e22c	0	0	0	\N	2026-08-03 08:06:13.756
82811f57-ecee-402d-8259-e44905ca1817	f4fac05d-2c87-414d-b3d4-32845051c8d4	0	0	0	\N	2026-08-03 08:06:13.76
cc28ea6b-b2f6-4c0f-b823-77d585a80371	30537926-c363-49bc-8e1d-de073ef1d3b5	0	0	0	\N	2026-08-03 08:06:13.764
5c241182-a9b5-4f15-bb2b-ee2e25b51e4b	251b4357-59b8-4777-9ceb-431a0ec75871	0	0	0	\N	2026-08-03 08:06:13.767
a9f48ab6-5a16-4f1b-b968-47674fc0e85d	1d9893bf-fcd0-404f-a10c-03ce235fcd03	0	0	0	\N	2026-08-03 08:06:13.771
eedeeb28-938e-474f-966f-9c379d20bac7	36cca545-51b1-4d61-8960-a9ff74b3e79f	0	0	0	\N	2026-08-03 08:06:13.776
edeb08ff-cf02-4c47-9022-7267a838906a	25e33c73-fa65-4aab-8393-ac7a48c61fb6	0	0	0	\N	2026-08-03 08:06:13.779
50306c2b-2c68-4736-bb84-ee95b84b8087	508d83e3-b641-42e3-974f-6df9189a9e63	0	0	0	\N	2026-08-03 08:06:13.782
27e18e0d-c10e-4e6f-ab1d-249808159855	5af149ff-7df3-4ebe-82e2-efc2179e7d74	0	0	0	\N	2026-08-03 08:06:13.785
a4a68ae9-1156-4ed9-a972-a0c143f80c7a	52a0bff8-5a71-4427-8a62-592ab6b6d48e	0	0	0	\N	2026-08-03 08:06:13.788
707477f8-a987-442d-9388-49513b3518de	591e11c3-d8bf-4c07-801c-c4cadd67c906	0	0	0	\N	2026-08-03 08:06:13.793
a02b762e-01a8-447a-b14d-90fd3f510999	1a9fe178-fa37-45ff-bede-bd673476379d	0	0	0	\N	2026-08-03 08:06:13.798
017155be-1cd3-4127-8a6c-e4b463ca37be	69842f7f-2cc5-4707-8cd6-3db17359f364	0	0	0	\N	2026-08-03 08:06:13.803
dda49f75-9f2c-4f0a-a061-5e6ce25dae9d	02148d3a-7ad0-45af-8f19-4588eb8cc4f4	0	0	0	\N	2026-08-03 08:06:13.807
ef503d65-4595-4fec-bc49-8e6c0d08c03a	10a7808c-8690-440b-b8e7-a3606339d63b	0	0	0	\N	2026-08-03 08:06:13.811
410d2873-2ff8-4094-b734-3254d4a80c80	3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	0	0	0	\N	2026-08-03 08:06:13.815
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions (id, code, "subjectId", "chapterId", content, "normalizedContent", type, difficulty, "bloomLevel", score, explanation, keywords, status, "rejectionReason", "isActive", "createdAt", "updatedAt", "deletedAt", "approvedAt", "archivedAt", "createdById", "approvedById") FROM stdin;
d26abc56-0f70-401d-86e9-1160f3731c1e	Q000001	1	cba7162a-936b-43c1-8721-b78ace065b10	Trong lập trình hướng đối tượng, tính chất nào cho phép che giấu thông tin chi tiết bên trong đối tượng?	trong lap trinh huong đoi tuong tinh chat nao cho phep che giau thong tin chi tiet ben trong đoi tuong	SINGLE_CHOICE	EASY	UNDERSTAND	0.25	Tính đóng gói (Encapsulation) giúp che giấu dữ liệu.	\N	APPROVED	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	2	1
4046387c-26b6-4499-a073-645784e0e22c	Q000002	1	cba7162a-936b-43c1-8721-b78ace065b10	Từ khóa nào trong TypeScript/Java dùng để kế thừa một lớp khác?	tu khoa nao trong typescript java dung đe ke thua mot lop khac	SINGLE_CHOICE	EASY	UNDERSTAND	0.25	Extends được dùng để mở rộng/kế thừa từ lớp cha.	\N	APPROVED	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	2	1
f4fac05d-2c87-414d-b3d4-32845051c8d4	Q000003	1	37836e8a-7565-448e-91d2-9238f606a415	Nạp chồng phương thức (Method Overloading) xảy ra khi nào?	nap chong phuong thuc method overloading xay ra khi nao	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Các phương thức cùng tên trong một lớp có danh sách tham số khác nhau.	\N	APPROVED	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	2	1
30537926-c363-49bc-8e1d-de073ef1d3b5	Q000004	1	37836e8a-7565-448e-91d2-9238f606a415	Ghi đè phương thức (Method Overriding) yêu cầu điều kiện gì?	ghi đe phuong thuc method overriding yeu cau đieu kien gi	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Phương thức ở lớp con phải có cùng tên và cùng tham số với phương thức ở lớp cha.	\N	APPROVED	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	3	1
251b4357-59b8-4777-9ceb-431a0ec75871	Q000005	1	8adaaae2-09fb-46ca-9369-fdfa3a9695fe	Trong thiết kế phần mềm, nguyên lý SOLID thì chữ S đại diện cho nguyên lý nào?	trong thiet ke phan mem nguyen ly solid thi chu s đai dien cho nguyen ly nao	SINGLE_CHOICE	HARD	UNDERSTAND	0.25	Single Responsibility Principle - Nguyên lý đơn trách nhiệm.	\N	APPROVED	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	3	1
1d9893bf-fcd0-404f-a10c-03ce235fcd03	Q000006	1	8adaaae2-09fb-46ca-9369-fdfa3a9695fe	Mô hình thiết kế Singleton đảm bảo điều gì?	mo hinh thiet ke singleton đam bao đieu gi	SINGLE_CHOICE	HARD	UNDERSTAND	0.25	Singleton chỉ cho phép một thể hiện duy nhất của class tồn tại trong ứng dụng.	\N	PENDING	\N	t	2026-08-03 00:27:07	2026-08-03 00:27:07	\N	\N	\N	3	\N
36cca545-51b1-4d61-8960-a9ff74b3e79f	Q000007	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Trong môn Cơ sở dữ liệu (Chương 1), yếu tố nào đóng vai trò khái niệm cơ bản và nguyên lý về cơ sở dữ liệu?	trong mon co so du lieu chuong 1 yeu to nao đong vai tro khai niem co ban va nguyen ly ve co so du lieu	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.883	2026-08-03 07:35:21.883	\N	\N	\N	1	\N
25e33c73-fa65-4aab-8393-ac7a48c61fb6	Q000008	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Tài liệu đầu vào để hệ thống tự động sinh câu hỏi..."?	noi dung nao sau đay mo ta đung nhat ve tai lieu đau vao đe he thong tu đong sinh cau hoi	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.924	2026-08-03 07:35:21.924	\N	\N	\N	1	\N
508d83e3-b641-42e3-974f-6df9189a9e63	Q000009	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Phạm vi: Khái niệm nền tảng, mô hình quan hệ, SQL, chuẩn hóa và giao d..."?	noi dung nao sau đay mo ta đung nhat ve pham vi khai niem nen tang mo hinh quan he sql chuan hoa va giao d	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.939	2026-08-03 07:35:21.939	\N	\N	\N	1	\N
5af149ff-7df3-4ebe-82e2-efc2179e7d74	Q000010	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Mức độ kiến thức: Cơ bản đến trung bình..."?	noi dung nao sau đay mo ta đung nhat ve muc đo kien thuc co ban đen trung binh	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.955	2026-08-03 07:35:21.955	\N	\N	\N	1	\N
52a0bff8-5a71-4427-8a62-592ab6b6d48e	Q000011	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Trong môn Cơ sở dữ liệu (Chương 1), yếu tố nào đóng vai trò ràng buộc và quy tắc cốt lõi trong cơ sở dữ liệu?	trong mon co so du lieu chuong 1 yeu to nao đong vai tro rang buoc va quy tac cot loi trong co so du lieu	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.969	2026-08-03 07:35:21.969	\N	\N	\N	1	\N
591e11c3-d8bf-4c07-801c-c4cadd67c906	Q000012	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "1.1. Khái niệm dữ liệu và cơ sở dữ liệu..."?	noi dung nao sau đay mo ta đung nhat ve 1 1 khai niem du lieu va co so du lieu	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:21.985	2026-08-03 07:35:21.985	\N	\N	\N	1	\N
1a9fe178-fa37-45ff-bede-bd673476379d	Q000013	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Dữ liệu là các sự kiện, con số, ký hiệu, hình ảnh hoặc mô tả được thu ..."?	noi dung nao sau đay mo ta đung nhat ve du lieu la cac su kien con so ky hieu hinh anh hoac mo ta đuoc thu	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:22.001	2026-08-03 07:35:22.001	\N	\N	\N	1	\N
69842f7f-2cc5-4707-8cd6-3db17359f364	Q000014	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Cơ sở dữ liệu là một tập hợp dữ liệu có liên quan với nhau, được tổ ch..."?	noi dung nao sau đay mo ta đung nhat ve co so du lieu la mot tap hop du lieu co lien quan voi nhau đuoc to ch	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:22.017	2026-08-03 07:35:22.017	\N	\N	\N	1	\N
02148d3a-7ad0-45af-8f19-4588eb8cc4f4	Q000015	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Ví dụ, cơ sở dữ liệu quản lý sinh viên có thể lưu mã sinh viên, họ tên..."?	noi dung nao sau đay mo ta đung nhat ve vi du co so du lieu quan ly sinh vien co the luu ma sinh vien ho ten	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:22.033	2026-08-03 07:35:22.033	\N	\N	\N	1	\N
10a7808c-8690-440b-b8e7-a3606339d63b	Q000016	2	4c35d04c-dc05-444c-ad48-93afbabc47db	Nội dung nào sau đây mô tả đúng nhất về: "Đặc trưng quan trọng: dữ liệu có cấu trúc, có liên hệ, được lưu trữ lâ..."?	noi dung nao sau đay mo ta đung nhat ve đac trung quan trong du lieu co cau truc co lien he đuoc luu tru la	SINGLE_CHOICE	MEDIUM	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 1.	\N	DRAFT	\N	t	2026-08-03 07:35:22.048	2026-08-03 07:35:22.048	\N	\N	\N	1	\N
3d6b548a-444d-48b3-8f9b-c4fe74d5fc42	Q000017	2	ac42935e-5ccd-4b7c-97bc-de6b9840b10e	Trong môn Cơ sở dữ liệu (Chương 4), yếu tố nào đóng vai trò khái niệm cơ bản và nguyên lý về cơ sở dữ liệu?	trong mon co so du lieu chuong 4 yeu to nao đong vai tro khai niem co ban va nguyen ly ve co so du lieu	SINGLE_CHOICE	HARD	UNDERSTAND	0.25	Định nghĩa chính xác theo kiến thức Cơ sở dữ liệu chương 4.	\N	DRAFT	\N	t	2026-08-03 07:36:00.03	2026-08-03 07:36:00.03	\N	\N	\N	1	\N
\.


--
-- Data for Name: student_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_subjects (id, "studentId", "subjectId", semester, "schoolYear", status) FROM stdin;
1	1	1	HK1	2025-2026	ELIGIBLE
2	2	1	HK1	2025-2026	ELIGIBLE
3	3	1	HK1	2025-2026	ELIGIBLE
4	4	1	HK1	2025-2026	ELIGIBLE
5	1	2	HK1	2025-2026	ELIGIBLE
6	2	2	HK1	2025-2026	ELIGIBLE
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, "studentCode", "fullName", gender, "dateOfBirth", email, phone, "classId", "userId") FROM stdin;
1	SV001	Lê Văn C	Nam	2003-05-15 00:00:00	levanc@student.edu.vn	0933111222	1	4
2	SV002	Phạm Thị D	Nữ	2003-08-20 00:00:00	phamthid@student.edu.vn	0933222333	1	5
3	SV003	Hoàng Văn E	Nam	2003-02-10 00:00:00	hoangvane@student.edu.vn	0933333444	1	6
4	SV004	Vũ Thị F	Nữ	2003-11-25 00:00:00	vuthif@student.edu.vn	0933444555	2	7
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subjects (id, "subjectCode", "subjectName", credits, "departmentId") FROM stdin;
1	INT1001	Lập trình hướng đối tượng	3	1
2	INT1002	Cơ sở dữ liệu	3	1
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teachers (id, "teacherCode", "fullName", degree, email, phone, "departmentId", "userId") FROM stdin;
1	GV001	Nguyễn Văn A	Tiến sĩ	nguyenvana@school.edu.vn	0987654321	1	2
2	GV002	Trần Thị B	Thạc sĩ	tranthib@school.edu.vn	0912345678	1	3
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, email, role, status, "createdAt", "updatedAt") FROM stdin;
1	admin	$2b$10$JYm16SMMGA8C4LALAlh/5OVU7/N0lDsFHY0zFdZ/cWKr2Fc5LAswW	admin@school.edu.vn	ADMIN	ACTIVE	2026-08-03 03:17:27.93	2026-08-03 03:17:27.93
2	teacher1	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	nguyenvana@school.edu.vn	TEACHER	ACTIVE	2026-08-03 03:17:27.938	2026-08-03 03:17:27.938
3	teacher2	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	tranthib@school.edu.vn	TEACHER	ACTIVE	2026-08-03 03:17:27.945	2026-08-03 03:17:27.945
4	student1	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	levanc@student.edu.vn	STUDENT	ACTIVE	2026-08-03 03:17:27.951	2026-08-03 03:17:27.951
5	student2	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	phamthid@student.edu.vn	STUDENT	ACTIVE	2026-08-03 03:17:27.957	2026-08-03 03:17:27.957
6	student3	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	hoangvane@student.edu.vn	STUDENT	ACTIVE	2026-08-03 03:17:27.963	2026-08-03 03:17:27.963
7	student4	$2b$10$pQFLOETTX5rSQHdvFFeeBub0Cz1kz1P1u0TMixKl5I1f6qyHAO6O6	vuthif@student.edu.vn	STUDENT	ACTIVE	2026-08-03 03:17:27.969	2026-08-03 03:17:27.969
\.


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 2, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 2, true);


--
-- Name: exam_paper_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_paper_questions_id_seq', 1, false);


--
-- Name: exam_papers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_papers_id_seq', 1, false);


--
-- Name: exam_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_periods_id_seq', 1, true);


--
-- Name: exam_room_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_room_students_id_seq', 4, true);


--
-- Name: exam_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_rooms_id_seq', 3, true);


--
-- Name: exam_schedule_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_schedule_rooms_id_seq', 1, true);


--
-- Name: exam_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_schedules_id_seq', 1, true);


--
-- Name: exam_supervisors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_supervisors_id_seq', 1, false);


--
-- Name: question_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.question_code_seq', 17, true);


--
-- Name: student_subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_subjects_id_seq', 6, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 4, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subjects_id_seq', 2, true);


--
-- Name: teachers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teachers_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: exam_paper_questions exam_paper_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_paper_questions
    ADD CONSTRAINT exam_paper_questions_pkey PRIMARY KEY (id);


--
-- Name: exam_papers exam_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_papers
    ADD CONSTRAINT exam_papers_pkey PRIMARY KEY (id);


--
-- Name: exam_periods exam_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_periods
    ADD CONSTRAINT exam_periods_pkey PRIMARY KEY (id);


--
-- Name: exam_room_students exam_room_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_room_students
    ADD CONSTRAINT exam_room_students_pkey PRIMARY KEY (id);


--
-- Name: exam_rooms exam_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_rooms
    ADD CONSTRAINT exam_rooms_pkey PRIMARY KEY (id);


--
-- Name: exam_schedule_rooms exam_schedule_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedule_rooms
    ADD CONSTRAINT exam_schedule_rooms_pkey PRIMARY KEY (id);


--
-- Name: exam_schedules exam_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedules
    ADD CONSTRAINT exam_schedules_pkey PRIMARY KEY (id);


--
-- Name: exam_supervisors exam_supervisors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_supervisors
    ADD CONSTRAINT exam_supervisors_pkey PRIMARY KEY (id);


--
-- Name: question_histories question_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_histories
    ADD CONSTRAINT question_histories_pkey PRIMARY KEY (id);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: question_statistics question_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_statistics
    ADD CONSTRAINT question_statistics_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: student_subjects student_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT student_subjects_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chapters_subjectId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chapters_subjectId_code_key" ON public.chapters USING btree ("subjectId", code);


--
-- Name: chapters_subjectId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "chapters_subjectId_order_key" ON public.chapters USING btree ("subjectId", "order");


--
-- Name: classes_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX classes_code_key ON public.classes USING btree (code);


--
-- Name: departments_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code);


--
-- Name: exam_rooms_roomCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "exam_rooms_roomCode_key" ON public.exam_rooms USING btree ("roomCode");


--
-- Name: question_histories_questionId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "question_histories_questionId_createdAt_idx" ON public.question_histories USING btree ("questionId", "createdAt");


--
-- Name: question_options_questionId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "question_options_questionId_order_key" ON public.question_options USING btree ("questionId", "order");


--
-- Name: question_statistics_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "question_statistics_questionId_key" ON public.question_statistics USING btree ("questionId");


--
-- Name: questions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX questions_code_key ON public.questions USING btree (code);


--
-- Name: questions_createdById_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "questions_createdById_createdAt_idx" ON public.questions USING btree ("createdById", "createdAt");


--
-- Name: questions_normalizedContent_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "questions_normalizedContent_trgm_idx" ON public.questions USING gin ("normalizedContent" public.gin_trgm_ops);


--
-- Name: questions_subjectId_chapterId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "questions_subjectId_chapterId_status_idx" ON public.questions USING btree ("subjectId", "chapterId", status);


--
-- Name: students_studentCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "students_studentCode_key" ON public.students USING btree ("studentCode");


--
-- Name: students_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "students_userId_key" ON public.students USING btree ("userId");


--
-- Name: subjects_subjectCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "subjects_subjectCode_key" ON public.subjects USING btree ("subjectCode");


--
-- Name: teachers_teacherCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "teachers_teacherCode_key" ON public.teachers USING btree ("teacherCode");


--
-- Name: teachers_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "teachers_userId_key" ON public.teachers USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: chapters chapters_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: classes classes_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_paper_questions exam_paper_questions_examPaperId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_paper_questions
    ADD CONSTRAINT "exam_paper_questions_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES public.exam_papers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_paper_questions exam_paper_questions_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_paper_questions
    ADD CONSTRAINT "exam_paper_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_papers exam_papers_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_papers
    ADD CONSTRAINT "exam_papers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_papers exam_papers_examScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_papers
    ADD CONSTRAINT "exam_papers_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES public.exam_schedules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_room_students exam_room_students_examScheduleRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_room_students
    ADD CONSTRAINT "exam_room_students_examScheduleRoomId_fkey" FOREIGN KEY ("examScheduleRoomId") REFERENCES public.exam_schedule_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_room_students exam_room_students_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_room_students
    ADD CONSTRAINT "exam_room_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_schedule_rooms exam_schedule_rooms_examScheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedule_rooms
    ADD CONSTRAINT "exam_schedule_rooms_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES public.exam_schedules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_schedule_rooms exam_schedule_rooms_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedule_rooms
    ADD CONSTRAINT "exam_schedule_rooms_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.exam_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_schedules exam_schedules_examPeriodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedules
    ADD CONSTRAINT "exam_schedules_examPeriodId_fkey" FOREIGN KEY ("examPeriodId") REFERENCES public.exam_periods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_schedules exam_schedules_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_schedules
    ADD CONSTRAINT "exam_schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_supervisors exam_supervisors_examScheduleRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_supervisors
    ADD CONSTRAINT "exam_supervisors_examScheduleRoomId_fkey" FOREIGN KEY ("examScheduleRoomId") REFERENCES public.exam_schedule_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_supervisors exam_supervisors_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_supervisors
    ADD CONSTRAINT "exam_supervisors_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teachers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: question_histories question_histories_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_histories
    ADD CONSTRAINT "question_histories_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: question_histories question_histories_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_histories
    ADD CONSTRAINT "question_histories_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: question_options question_options_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: question_statistics question_statistics_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_statistics
    ADD CONSTRAINT "question_statistics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public.chapters(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_subjects student_subjects_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT "student_subjects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_subjects student_subjects_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subjects
    ADD CONSTRAINT "student_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: students students_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: students students_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subjects subjects_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teachers teachers_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT "teachers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teachers teachers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

-- \unrestrict qcvDzyaOVu6gJ5eUnV8DiTOqeerQhriE48az41Jquju21mli3pyd2Pg7BLT57G1

