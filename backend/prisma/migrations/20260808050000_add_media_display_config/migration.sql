-- Add media display config to OnlineExamConfig
ALTER TABLE "online_exam_configs"
  ADD COLUMN "showImages" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "showVideos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "showAudios" BOOLEAN NOT NULL DEFAULT true;
