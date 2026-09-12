CREATE TABLE `pilot_admissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pilot_admission_user_created` ON `pilot_admissions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pilot_admission_created` ON `pilot_admissions` (`created_at`);--> statement-breakpoint
CREATE TABLE `pilot_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`state_json` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`lease_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pilot_user_created` ON `pilot_runs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pilot_created` ON `pilot_runs` (`created_at`);