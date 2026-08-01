CREATE TABLE "video_trimmer_job" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
