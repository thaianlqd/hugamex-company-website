import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
if(!readFileSync(resolve(root,'backend/.env'),'utf8').includes('SPRING_PROFILES_ACTIVE=dev'))throw new Error('Development profile required.');
if(!/^DATABASE_URL=['"]?jdbc:postgresql:\/\/(?:127\.0\.0\.1|localhost):5432\/hugamex['"]?$/m.test(readFileSync(resolve(root,'backend/.env'),'utf8')))throw new Error('Seed is restricted to the local Docker database; never use it with Supabase.');
const fixturePath=resolve(root,'.local/e2e.json');
const fixture=JSON.parse(readFileSync(fixturePath,'utf8'));
const statePath=resolve(root,'.local/seed-state.json');
const state=existsSync(statePath)?JSON.parse(readFileSync(statePath,'utf8')):{};
const base='http://127.0.0.1:8080/api/v1';const cookies=new Map();let token='';let csrfToken='';
async function request(path,body,method='GET'){
 const headers={Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')};
 if(token)headers.Authorization=`Bearer ${token}`;
 if(csrfToken)headers['X-CSRF-TOKEN']=csrfToken;
 if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';
 const res=await fetch(base+path,{method,headers,body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined});
 for(const value of res.headers.getSetCookie()){const pair=value.split(';')[0];const i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}
 const data=await res.json();if(!res.ok)throw new Error(`API ${res.status}: ${data.detail||'Request failed'}`);return data;
}
csrfToken=(await request('/auth/csrf')).token;
token=(await request('/auth/login',{email:fixture.email,password:fixture.password},'POST')).accessToken;
const recovery=fixture.recoveryCodes?.pop();if(!recovery)throw new Error('Run the admin MFA smoke test or configure the local QA account first.');
await request('/auth/mfa/recovery',{code:recovery},'POST');fixture.recoveryCodes=(await request('/auth/mfa/recovery/regenerate',{},'POST')).recoveryCodes;writeFileSync(fixturePath,JSON.stringify(fixture),{mode:0o600});
async function photo(key,id){if(state[key])return state[key];const res=await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`);if(!res.ok)throw new Error('Stock image unavailable');const form=new FormData();form.append('file',new Blob([await res.arrayBuffer()],{type:'image/jpeg'}),`stock-${id}.jpg`);form.append('altText','Temporary stock photograph - not a HUGAMEX factory');form.append('isPublic','true');state[key]=(await request('/admin/media',form,'POST')).id;writeFileSync(statePath,JSON.stringify(state),{mode:0o600});return state[key];}
const sewing=await photo('sewingImage','5830692');const detail=await photo('detailImage','12362544');
const paragraph=text=>({type:'paragraph',content:[{type:'text',text}]});
const notice={vi:'NỘI DUNG MINH HỌA — CHỜ DOANH NGHIỆP DUYỆT. Hình ảnh là ảnh stock tạm, không phải ảnh nhà máy HUGAMEX.',en:'PLACEHOLDER CONTENT — REQUIRES CLIENT APPROVAL. Images are temporary stock photography, not HUGAMEX factory photographs.'};
async function content(resource,key,vi,en,metadata={},media=sewing){
 let id=state[key];for(const [locale,copy] of [['vi',vi],['en',en]]){
  const body={locale,title:copy[0],slug:locale==='vi'?key:`${key}-en`,excerpt:copy[1],content:{type:'doc',content:[paragraph(notice[locale]),...copy.slice(2).map(paragraph)]},seoTitle:copy[0],seoDescription:copy[1],featuredMediaId:media,featured:resource==='hero-slides',metadata,categoryIds:[]};
  const result=await request(`/admin/${resource}${id?'/'+id:''}`,body,id?'PUT':'POST');id=result.id;
 }
 await request(`/admin/${resource}/${id}/status`,{status:'PUBLISHED'},'PATCH');state[key]=id;writeFileSync(statePath,JSON.stringify(state),{mode:0o600});return id;
}
const pageSpecs=[
 ['gioi-thieu','Giới thiệu HUGAMEX','About HUGAMEX','Công ty Cổ phần May Hữu Nghị hoạt động trong lĩnh vực may mặc.','Huu Nghi Garment Joint Stock Company operates in garment manufacturing.'],
 ['lich-su','Lịch sử phát triển','Our history','Các cột mốc doanh nghiệp sẽ được bổ sung sau khi xác nhận hồ sơ chính thức.','Company milestones will be added after verification of official records.'],
 ['tam-nhin-su-menh','Tầm nhìn & sứ mệnh','Vision & mission','Định hướng phát triển và các cam kết của HUGAMEX đang chờ doanh nghiệp phê duyệt.','The company vision and commitments await client approval.'],
 ['nang-luc-san-xuat','Năng lực sản xuất','Manufacturing capabilities','Giới thiệu chuỗi công đoạn: nguyên liệu, cắt, may, hoàn thiện, kiểm tra và giao hàng.','An illustrative workflow: materials, cutting, sewing, finishing, quality control and delivery.'],
 ['phat-trien-ben-vung','Phát triển bền vững','Sustainability','Chính sách về con người, môi trường và trách nhiệm sản phẩm sẽ được công bố sau khi xác nhận.','Policies on people, environment and product responsibility await verification.'],
 ['tuyen-dung','Cơ hội nghề nghiệp','Careers','Chưa có thông tin tuyển dụng đã được xác nhận. Gửi yêu cầu qua trang liên hệ.','No verified vacancies are available yet. Please use our contact form for enquiries.'],
 ['chinh-sach-bao-mat','Chính sách bảo mật — bản dự thảo','Privacy policy — draft','Biểu mẫu liên hệ lưu tên, email và nội dung để xử lý yêu cầu.','Contact forms store your name, email and message to process enquiries.'],
];
for(const [key,titleVi,titleEn,bodyVi,bodyEn] of pageSpecs)await content('pages',key,[titleVi,bodyVi,bodyVi,'Nội dung cần được rà soát và phê duyệt trước khi website chính thức hoạt động.'],[titleEn,bodyEn,bodyEn,'This content requires review and approval before launch.'],{routeKey:key},detail);
const products=[];
for(const [key,vi,en] of [['ao-khoac','Áo khoác — minh họa','Outerwear — illustrative'],['trang-phuc-the-thao','Trang phục thể thao — minh họa','Sportswear — illustrative'],['quan-thoi-trang','Quần & thời trang — minh họa','Trousers & fashion — illustrative']])products.push(await content('products',key,[vi,'Danh mục sản phẩm mẫu, cần cập nhật hình ảnh và thông số.','Nội dung minh họa cấu trúc giới thiệu sản phẩm. Không phải catalog chính thức.'],[en,'Illustrative product category; photographs and specifications await approval.','This is an example of the product showcase structure, not an official catalogue.'],{specification:''},detail));
const branch=await content('branches','dia-diem-minh-hoa',['Địa điểm — chờ xác nhận','Thông tin nhà máy / văn phòng đang được cập nhật.','Tên địa điểm, địa chỉ, giờ làm việc và liên hệ sẽ được bổ sung sau xác nhận.'],['Location — awaiting confirmation','Factory and office information is being updated.','Official names, addresses and contact details will be added after verification.'],{type:'OFFICE',address:'',phone:'',email:'',hours:''});
const partner=await content('partners','doi-tac-minh-hoa',['Thông tin đối tác — chờ xác nhận','Danh sách và thương hiệu đối tác chưa được phê duyệt.','Không có thương hiệu đối tác giả trong dữ liệu mẫu này.'],['Partner information — awaiting approval','Partner names and brands require approval.','No fictitious partner brands are included in this fixture.']);
const certification=await content('certifications','ho-so-chat-luong',['Hồ sơ chất lượng — chờ xác minh','Chứng nhận hiện hành cần được kiểm tra hiệu lực.','Dữ liệu mẫu này không tuyên bố doanh nghiệp đang sở hữu một chứng nhận cụ thể.'],['Quality documents — awaiting verification','Current certificate validity needs verification.','This fixture does not claim that the company holds any specific certification.'],{issuer:'',validUntil:''});
const news=[];
for(const [key,vi,en] of [['gioi-thieu-chuyen-mon','Góc nhìn may mặc: từ chất liệu đến thành phẩm','A garment perspective: from fabric to finishing'],['chi-tiet-va-chat-luong','Chi tiết trong sản xuất may mặc','Details in garment manufacturing'],['ket-noi-hop-tac','Trao đổi về nhu cầu hợp tác','Start a manufacturing conversation']])news.push(await content('posts',key,[vi+' — minh họa','Bài viết mẫu để xem bố cục và kiểm thử quy trình xuất bản.','Bài viết minh họa, không phải sự kiện hoặc thông báo chính thức của HUGAMEX.','Bạn có thể sửa nội dung, ảnh, bản dịch và SEO trong CMS.'],[en+' — illustrative','An example article for layout and publishing workflow review.','This is sample content, not an official company event or announcement.','Editors can replace the copy, media, translations and SEO in the CMS.']));
await content('hero-slides','hero-minh-hoa',['Từ từng đường kim,\nđến giá trị.','HUGAMEX — Công ty Cổ phần May Hữu Nghị. Nội dung đề xuất, chờ doanh nghiệp duyệt.'],['Thoughtfully made.\nPrecisely sewn.','HUGAMEX — Huu Nghi Garment. Proposed copy awaiting client approval.'],{link:'/gioi-thieu'});
const sections=await request('/admin/homepage');const refs={about:[state['gioi-thieu']],manufacturing:[state['nang-luc-san-xuat']],products,branches:[branch],quality:[certification],partners:[partner],news};
for(const section of sections)await request(`/admin/homepage/${section.id}`,{...section,contentIds:refs[section.key]||[]},'PUT');
csrfToken=(await request('/auth/csrf')).token;
await request('/auth/logout',{},'POST');
console.log('Seeded explicitly labelled development content and stock media through the authenticated API. No production service was changed.');
