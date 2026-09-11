CREATE TABLE `tool_saves` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tool_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`input_json` text NOT NULL,
	`result_json` text,
	`engine_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tool_saves_user_created` ON `tool_saves` (`user_id`,`created_at`);