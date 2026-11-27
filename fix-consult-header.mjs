import {existsSync,readFileSync,writeFileSync,copyFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";

const root=process.cwd();
if(!existsSync(join(root,"package.json"))||!existsSync(join(root,"app/consult/me/page.jsx"))){
  console.error("운세인사이트 프로젝트 폴더에서 실행하세요. app/consult/me/page.jsx가 있어야 합니다.");
  process.exit(1);
}
const paths=["app/components/layout/site-header.jsx","app/components/layout/site-header.tsx","app/components/layout/SiteHeader.tsx","app/components/common/SiteHeader.tsx","app/components/SiteHeader.tsx"];
const changes=[];
for(const path of paths){
  const target=join(root,path);
  if(!existsSync(target))continue;
  let code=readFileSync(target,"utf8");
  if(!/<LoginButton\b/.test(code))continue;
  if(!/import\s+StaffLinks\s+from/.test(code)){
    const loginImport=/^([ \t]*import\s+LoginButton\s+from\s+[^\r\n]+)/m;
    if(!loginImport.test(code))continue;
    code=code.replace(loginImport,'import StaffLinks from "@/app/consult/StaffLinks";\n$1');
    code=code.replace(/<LoginButton\b/g,"<StaffLinks /><LoginButton");
  }
  changes.push({target,path,code});
}
if(!changes.length){
  console.error("LoginButton을 사용하는 헤더를 찾지 못했습니다. app/home/page.tsx의 SiteHeader import 줄을 확인해 주세요.");
  process.exit(1);
}
function backup(target){
  const path=target+".before-consult-button.bak";
  if(existsSync(target)&&!existsSync(path))copyFileSync(target,path);
}
const staff=join(root,"app/consult/StaffLinks.jsx");
backup(staff);
copyFileSync(fileURLToPath(new URL("./StaffLinks.jsx",import.meta.url)),staff);
for(const {target,path,code} of changes){
  backup(target);
  writeFileSync(target,code);
  console.log("확인 완료 "+path);
}
console.log("상담 관리 버튼 적용 완료. 도사님 계정으로 확인하세요.");
