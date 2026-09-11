CREATE TABLE `ai_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_works` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`job` text NOT NULL,
	`brief` text NOT NULL,
	`profile` text NOT NULL,
	`history_json` text NOT NULL,
	`request_hash` text NOT NULL,
	`status` text NOT NULL,
	`result_json` text,
	`error` text,
	`model` text NOT NULL,
	`tokens` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_user_created` ON `ai_works` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_created` ON `ai_works` (`created_at`);