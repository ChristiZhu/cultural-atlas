/** Owner-only local CLI; never shipped to the browser or exposed as a public endpoint. */
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
const [action,id]=process.argv.slice(2);
if(!['list','remove'].includes(action)||(action==='remove'&&!/^[\da-f-]{36}$/i.test(id||'')))throw new Error('Usage: node server/manage.mjs list | remove <entry-id>');
const db=new DatabaseSync(process.env.COMMUNITY_DB||resolve('work/community/community.sqlite'),{readOnly:action==='list'});
if(action==='list')console.log(JSON.stringify(db.prepare("SELECT id,creator_name,reflection,created_at FROM patterns WHERE visibility='public' ORDER BY rowid DESC LIMIT 100").all(),null,2));
else{if(db.prepare("SELECT name FROM sqlite_master WHERE name='translations'").get())db.prepare('DELETE FROM translations WHERE pattern_id=?').run(id);const result=db.prepare("UPDATE patterns SET visibility='removed',creator_name='',reflection='',data='{}',preview='' WHERE id=?").run(id);console.log(`Removed ${result.changes} entry. Its publication key remains blocked.`);}
db.close();
