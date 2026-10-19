import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const patterns=sqliteTable('patterns',{
 id:text('id').primaryKey(),requestId:text('request_id').notNull().unique(),digest:text('digest').notNull(),creatorName:text('creator_name').notNull(),reflection:text('reflection').notNull(),city:text('city').notNull(),data:text('data').notNull(),preview:text('preview').notNull(),createdAt:text('created_at').notNull(),visibility:text('visibility').notNull().default('public'),source:text('source').notNull().default('visitor'),
},table=>[index('patterns_city').on(table.city,table.createdAt)]);
export const limits=sqliteTable('limits',{client:text('client').primaryKey(),start:integer('start').notNull(),count:integer('count').notNull()});
export const translations=sqliteTable('translations',{patternId:text('pattern_id').notNull(),language:text('language').notNull(),text:text('text').notNull(),updatedAt:integer('updated_at').notNull()},table=>[primaryKey({columns:[table.patternId,table.language]})]);
