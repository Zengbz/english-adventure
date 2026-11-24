import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'courses');
const files=fs.readdirSync(dir).filter(f=>/^week[1-9]\d*-course\.json$/.test(f));
if(!files.length)throw new Error('No weekly course packages found.');
const weeks=[],lessonIds=new Set(),dayNumbers=new Set(),questionIds=new Set();
for(const file of files){const raw=fs.readFileSync(path.join(dir,file));const pack=JSON.parse(raw);if(pack.schemaVersion!==1||!Number.isInteger(pack.week)||file!==`week${pack.week}-course.json`||!Array.isArray(pack.lessons)||pack.lessons.length!==7)throw new Error(`Invalid weekly package: ${file}`);for(const lesson of pack.lessons){if(lessonIds.has(lesson.id))throw new Error(`Duplicate lesson ID: ${lesson.id}`);lessonIds.add(lesson.id);if(!Number.isInteger(lesson.day)||dayNumbers.has(lesson.day)||lesson.day<=(pack.week-1)*7||lesson.day>pack.week*7)throw new Error(`Lesson day must be globally numbered ${(pack.week-1)*7+1}–${pack.week*7}: ${file}`);dayNumbers.add(lesson.day);for(const q of lesson.quiz){if(questionIds.has(q.id))throw new Error(`Duplicate question ID: ${q.id}`);questionIds.add(q.id);}}weeks.push({week:pack.week,title:pack.title,summary:pack.summary,level:pack.level,file:`courses/${file}`,revision:crypto.createHash('sha256').update(raw).digest('hex'),lessons:pack.lessons.map(l=>({day:l.day,id:l.id,title:l.title,subtitle:l.subtitle,minutes:l.minutes}))});}
weeks.sort((a,b)=>a.week-b.week);fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify({schemaVersion:1,weeks},null,2)+'\n');
const out=path.join(root,'site');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});for(const f of ['index.html','styles.css','sw.js','manifest.webmanifest'])fs.copyFileSync(path.join(root,f),path.join(out,f));for(const f of ['src','courses','assets'])fs.cpSync(path.join(root,f),path.join(out,f),{recursive:true});console.log(`Built ${weeks.length} week(s), ${lessonIds.size} lessons, ${questionIds.size} quiz items into site/`);
