import fs from "node:fs";
const files=["app/components/layout/site-header.jsx","app/components/layout/site-header.tsx","app/components/common/SiteHeader.tsx","app/components/SiteHeader.tsx"];
const file=process.argv[2]||files.find(f=>fs.existsSync(f));
if(!file)throw Error("현재 공통 헤더 파일 경로를 명령 뒤에 입력하세요.");
const original=fs.readFileSync(file,"utf8");
if(original.includes("<VipBrand />")){console.log("이미 적용되었습니다.");process.exit(0);}
const split=/<div data-unse-brand-links\b[\s\S]*?<\/div>\s*<\/div>/g;
const logo= /<Link\b(?:(?!<Link\b|<\/Link>)[\s\S])*?<\/Link>/g;
let source=original.includes("data-unse-brand-links")?original.replace(split,"<VipBrand />"):
original.replace(logo,tag=>/<(?:img|Image)\b/.test(tag)&&/\/brand\/unseinsight|alt=["']운세인사이트|aria-label=["']운세인사이트 홈/.test(tag)?"<VipBrand />":tag);
if(source===original)throw Error("로고 위치를 찾지 못했습니다. 기존 헤더의 로고 블록을 <VipBrand />로 교체하세요.");
source=source.replace(/^(import\s)/m,'import VipBrand from "@/app/consult/VipBrand";\n$1');
if(source.includes("const navigation = [")&&!source.includes('"/consult/me"'))source=source.replace("const navigation = [",'const navigation = [\n  { label: "상담 마이페이지", href: "/consult/me" },');
if(!fs.existsSync(file+".before-vip"))fs.copyFileSync(file,file+".before-vip");
fs.writeFileSync(file,source);
console.log("VIP 상담 연결 완료:",file);
