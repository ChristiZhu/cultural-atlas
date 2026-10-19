CREATE TABLE `limits` (
	`client` text PRIMARY KEY NOT NULL,
	`start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`digest` text NOT NULL,
	`creator_name` text NOT NULL,
	`reflection` text NOT NULL,
	`city` text NOT NULL,
	`data` text NOT NULL,
	`preview` text NOT NULL,
	`created_at` text NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`source` text DEFAULT 'visitor' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patterns_request_id_unique` ON `patterns` (`request_id`);--> statement-breakpoint
CREATE INDEX `patterns_city` ON `patterns` (`city`,`created_at`);