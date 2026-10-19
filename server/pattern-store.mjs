import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {renderArtwork} from '../dist/scripts/pattern-export.js';

export function openPatternStore(database,assetRoot){
  mkdirSync(dirname(database),{recursive:true});
  const db=new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS patterns (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, digest TEXT NOT NULL, creator_name TEXT NOT NULL, reflection TEXT NOT NULL, city TEXT NOT NULL, data TEXT NOT NULL, preview TEXT NOT NULL, created_at TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'public');
    CREATE INDEX IF NOT EXISTS patterns_city ON patterns(city,created_at);
    CREATE TABLE IF NOT EXISTS limits (client TEXT PRIMARY KEY,start INTEGER NOT NULL,count INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS translations(pattern_id TEXT NOT NULL,language TEXT NOT NULL,text TEXT NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(pattern_id,language));`);
  const assets=Object.fromEntries(culturalIcons.map(icon=>[
    icon.id,readFileSync(resolve(assetRoot,icon.svg),'utf8').replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'')
  ]));
  const find=id=>db.prepare("SELECT * FROM patterns WHERE id=? AND visibility='public'").get(id);
  function list(city,before){
    const anchor=before?db.prepare('SELECT rowid FROM patterns WHERE id=?').get(before)?.rowid:null;
    if(before&&!anchor)throw Object.assign(new Error('This gallery page is no longer available.'),{status:400});
    return db.prepare("SELECT * FROM patterns WHERE visibility='public' AND (?='*' OR city=?) AND (? IS NULL OR rowid < ?) ORDER BY rowid DESC LIMIT 13").all(city,city,anchor??null,anchor??null);
  }
  function publish(clean,address){
    const digest=createHash('sha256').update(JSON.stringify(clean)).digest('hex');
    const previous=db.prepare('SELECT * FROM patterns WHERE request_id=?').get(clean.requestId);
    if(previous){
      if(previous.visibility!=='public')throw Object.assign(new Error('This publication is no longer available.'),{status:410});
      if(previous.digest!==digest)throw Object.assign(new Error('This request has already been published.'),{status:409});
      return {entry:previous,created:false};
    }
    const client=createHash('sha256').update(address).digest('hex'),now=Date.now();
    db.prepare('DELETE FROM limits WHERE start < ?').run(now-3600000);
    if(db.prepare('SELECT count FROM limits WHERE client=?').get(client)?.count>=20)throw Object.assign(new Error('Please try sharing again later.'),{status:429});
    const id=randomUUID(),createdAt=new Date().toISOString();
    // Store a vector rendition as well as geometry. No generator runs on publication.
    const preview=renderArtwork(clean.patternData,assets,'community-artwork');
    db.exec('BEGIN IMMEDIATE');
    try{
      db.prepare('INSERT INTO patterns(id,request_id,digest,creator_name,reflection,city,data,preview,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,clean.requestId,digest,clean.creatorName,clean.reflection,clean.patternData.selectedCity,JSON.stringify(clean.patternData),preview,createdAt);
      db.prepare('INSERT INTO limits(client,start,count) VALUES(?,?,1) ON CONFLICT(client) DO UPDATE SET count=count+1').run(client,now);
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
    return {entry:find(id),created:true};
  }
  const translations={read:(id,language)=>db.prepare('SELECT text,updated_at FROM translations WHERE pattern_id=? AND language=?').get(id,language),write:(id,language,text,now)=>db.prepare("INSERT INTO translations(pattern_id,language,text,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM patterns WHERE id=? AND visibility='public') ON CONFLICT(pattern_id,language) DO UPDATE SET text=excluded.text,updated_at=excluded.updated_at").run(id,language,text,now,id)};
  return {find,list,publish,translations,close:()=>db.close()};
}
/** No request keys, rate-limit hashes or other internal columns leave the service. */
export function publicEntry(row,detail=false){
  const patternData=JSON.parse(row.data);
  return {id:row.id,creatorName:row.creator_name,reflection:row.reflection,citySelection:row.city,iconsUsed:patternData.selectedIcons,createdAt:row.created_at,visibility:'public',previewImage:`patterns/${row.id}/preview.svg`,...(detail?{patternData}:{})};
}
