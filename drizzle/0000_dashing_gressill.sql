CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`source_label` text NOT NULL,
	`target_name` text NOT NULL,
	`schedule` text NOT NULL,
	`review_required` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_agents_user` ON `agents` (`user_id`);--> statement-breakpoint
CREATE TABLE `help_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'recorded' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_help_user_created` ON `help_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sample_id` text NOT NULL,
	`supplier` text NOT NULL,
	`invoice_number` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`due_date` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_runs_user_sample` ON `runs` (`user_id`,`sample_id`);