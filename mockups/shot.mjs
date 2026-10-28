import {chromium} from 'playwright';
const b=await chromium.launch();
for(const v of ['a','b'])for(const [n,w,h] of [['desktop',1440,900],['mobile',390,844]]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
 await p.goto('file://'+process.cwd()+`/${v}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);console.log(v,n,'scrollWidth',sw);
 await p.screenshot({path:`${v}-${n}.png`});}
await b.close();
