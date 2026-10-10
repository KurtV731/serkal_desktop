'use strict';
const {spawn}=require('node:child_process');
const path=require('node:path');
const cli=require.resolve('@electron-forge/cli/dist/electron-forge.js');
const child=spawn(process.execPath,[cli,'start'],{cwd:path.resolve(__dirname,'..'),stdio:'inherit',env:{...process.env,SERKAL_CALENDAR_LAB:'1'}});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code===null?1:code;});
