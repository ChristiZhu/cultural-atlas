CREATE TABLE `translations` (
	`pattern_id` text NOT NULL,
	`language` text NOT NULL,
	`text` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`pattern_id`, `language`)
);
