/** Copy shared validation/rendering into the independently deployed API checkout. */
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {culturalIcons} from '../dist/scripts/library-state.js';
import {projectSubmissions} from '../server/project-collection.mjs';
const root=resolve(import.meta.dirname,'..'),target=resolve(root,process.argv[2]||'work/community-host');
mkdirSync(target+'/shared/dist/scripts',{recursive:true});mkdirSync(target+'/shared/server',{recursive:true});
for(const name of ['library-state','icon-names','pattern-metadata','pattern-generator','pattern-colors','pattern-export'])cpSync(root+'/dist/scripts/'+name+'.js',target+'/shared/dist/scripts/'+name+'.js');
for(const name of ['pattern-schema','hosted-api','reflection-translation','project-translations'])cpSync(root+'/server/'+name+'.mjs',target+'/shared/server/'+name+'.mjs');
const assets=Object.fromEntries(culturalIcons.map(icon=>[icon.id,readFileSync(root+'/dist/'+icon.svg,'utf8').replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'')]));
writeFileSync(target+'/shared/assets.json',JSON.stringify(assets));
writeFileSync(target+'/shared/project-collection.json',JSON.stringify(projectSubmissions()));
console.log('Prepared shared validation, exact pattern renderer and trusted icon assets.');
