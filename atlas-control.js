
/* Gran Atlas: consulta docente privada; no altera datos ni motor de notas. */
function atlasGroupLabel(code){return code==='A'?'Grupo 1 · Equipo A':code==='B'?'Grupo 2 · Equipo B':'Grupo '+String(code||'—')}
function atlasBoardFood(id){return (state.atlasBoard?.groups||[]).flatMap(g=>g.foods||[]).find(f=>String(f.id)===String(id))}
async function atlasPrivateRequest(action,extra={}){
  if(!TOKEN||new URL(SBURL).origin!==new URL(PUBLIC_SUPABASE_URL).origin)throw Error('Inicia sesión docente en el proyecto oficial.');
  const res=await fetch(PUBLIC_SUPABASE_URL+'/functions/v1/cenqal-atlas-documents',{method:'POST',headers:{apikey:PUBLIC_SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_token:TOKEN,action,...extra}),cache:'no-store',referrerPolicy:'no-referrer'});
  const d=await res.json();if(!res.ok||!d.ok)throw Error(res.status===401||res.status===403?'Sesión no autorizada. Vuelve a entrar.':'No se pudo consultar la evidencia privada.');return d;
}
async function loadAtlasBoard(){
  try{const token=TOKEN,d=await atlasPrivateRequest('overview');if(token!==TOKEN||(state.selectedCourseId!=null&&String(d.course_id)!==String(state.selectedCourseId)))throw Error('Curso cambiado');state.atlasBoard=d;state.atlasBoardError=null;return d}
  catch(e){state.atlasBoard=null;state.atlasBoardError=e.message||String(e);return null}
}
function atlasStats(g){const f=g.foods||[];return{total:f.length,final:f.filter(x=>x.status==='final'&&x.teacher_score!=null).length,review:f.filter(x=>['ready_review','reviewed'].includes(x.status)).length,work:f.filter(x=>!['not_started','ready_review','reviewed','final'].includes(x.status||'not_started')).length,notStarted:f.filter(x=>!x.status||x.status==='not_started').length}}
function atlasCheck(f){const a=f?.grade_audit||[];return {total:a.length,match:f?.status==='final'&&f.teacher_score!=null?a.filter(m=>m.score!=null&&Math.abs(Number(m.score)-Number(f.teacher_score)/10)<0.0001).length:0}}
function atlasSafeLink(raw){try{const u=new URL(String(raw));return u.protocol==='https:'?u.href:''}catch(e){return ''}}
function atlasArchiveButton(kind,id,label){id=String(id||'');if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))return '';return '<button class="btn" type="button" onclick="atlasOpenArchive(\''+kind+'\',\''+id+'\')">'+esc(label)+'</button>'}
function atlasOriginalLinks(f){
 const link=atlasSafeLink(f.poster_url),files=f.files||[];
 return files.map(p=>atlasArchiveButton('poster',p.id,'Ver / descargar PDF original · '+(p.file_name||'Póster'))).join(' ')+(link?' <a class="btn" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Abrir póster original</a>':'')+(!files.length?'<span class="subtle">'+(link?' PDF no archivado; descarga desde SharePoint/Canva si tienes permiso.':' Sin PDF original ni enlace válido.')+'</span>':'');
}
function atlasActaLinks(){const a=state.atlasBoard?.actas||[];return a.length?a.map(x=>atlasArchiveButton('acta',x.id,x.title||'Acta general archivada')+' <span class="subtle">'+esc(fmtDate(x.generated_at))+'</span>').join('<br>'):'<span class="subtle">No consta acta general en esta consulta.</span>'}
async function atlasOpenArchive(kind,id){
 let panel=document.getElementById('atlasPrivatePanel');
 if(!panel||!document.getElementById('modalBack')?.classList.contains('show')){modal('<div class="sectionTitle"><h3>Documento privado · Atlas</h3><button class="btn" onclick="closeModal()">Cerrar</button></div><div id="atlasPrivatePanel"></div>');panel=document.getElementById('atlasPrivatePanel')}
 releaseControlPDF();const req=controlPDFRequest;panel.textContent='Cargando documento privado…';
 const active=()=>req===controlPDFRequest&&document.getElementById('atlasPrivatePanel')===panel&&document.getElementById('modalBack')?.classList.contains('show');
 try{const info=await atlasPrivateRequest('document',{kind,id}),url=new URL(info.signed_url);
 if(url.origin!==new URL(PUBLIC_SUPABASE_URL).origin||!url.pathname.startsWith('/storage/v1/object/sign/'))throw Error('Enlace no válido.');
 const r=await fetch(url.href,{cache:'no-store',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('Archivo no disponible.');
 const b=await r.arrayBuffer();if(new TextDecoder().decode(b.slice(0,5))!=='%PDF-')throw Error('Archivo no PDF.');if(!active())return;
 controlPDFUrl=URL.createObjectURL(new Blob([b],{type:'application/pdf'}));panel.replaceChildren();
 const a=document.createElement('a');a.className='btn primary';a.href=controlPDFUrl;a.download=String(info.file_name||'Atlas.pdf').replace(/[\\/]/g,'_');a.textContent='Descargar PDF';
 const ext=document.createElement('a');ext.className='btn';ext.href=controlPDFUrl;ext.target='_blank';ext.rel='noopener noreferrer';ext.textContent='Abrir en visor del dispositivo';
 panel.append(a,ext);const frame=document.createElement('iframe');frame.src=controlPDFUrl;frame.title='Documento Atlas';frame.style.cssText='width:100%;height:65vh;min-height:300px;border:1px solid #ddd;margin-top:8px';panel.append(frame);
 }catch(e){if(active())panel.textContent=e.message||'No se pudo abrir el documento.'}
}
function atlasAuditHTML(f){
 const c=atlasCheck(f);if(f.status!=='final'||f.teacher_score==null)return '<p class="subtle">La validación final asigna la misma nota a todos los integrantes activos matriculados.</p>';
 return '<div class="note '+(c.total&&c.match===c.total?'':'warn')+'"><b>Nota de equipo: '+esc(f.teacher_score)+'/100 · '+esc(Number(f.teacher_score)/10)+'/10</b><br>Expedientes comprobados: '+c.match+'/'+c.total+' · '+(c.total&&c.match===c.total?'misma nota para todos':'revisar distribución')+'<br>'+((f.grade_audit||[]).map(m=>esc(m.name)+': '+(m.score==null?'sin nota':esc(m.score)+'/10')).join(' · '))+'</div>';
}
function atlasFoodHTML(f){
 const st=f.status||'not_started',id=String(f.id||''),final=st==='final'&&f.teacher_score!=null;
 const label=final?'Calificada':st==='ready_review'?'Entregada · por corregir':st==='reviewed'?'Revisada · por validar':st==='not_started'?'Prevista · no iniciada':atlasV735Status(st)+' · sin entrega final';
 const review=(['ready_review','reviewed','final'].includes(st)||Boolean(f.submitted_at))&&/^[0-9a-f-]{36}$/i.test(id);
 return '<details class="card" data-atlas-food="'+esc(f.food_code)+'" style="margin:8px 0;padding:10px"><summary style="cursor:pointer;font-weight:700">Entrega '+esc(f.display_order??f.delivery_number??'—')+' · '+esc(f.name||f.food_name||f.food_code)+' <span class="status '+(final?'ok':['ready_review','reviewed'].includes(st)?'warn':'')+'">'+esc(label)+'</span></summary><div style="margin-top:10px"><p class="subtle">Código '+esc(f.food_code)+' · Progreso '+esc(f.progress_percent??0)+'%'+(f.submitted_at?' · Entregada '+esc(fmtDate(f.submitted_at)):'')+'</p>'+atlasAuditHTML(f)+'<div class="actions" style="margin-top:8px">'+atlasOriginalLinks(f)+'</div>'+(review?'<div class="actions" style="margin-top:8px"><button class="btn primary" onclick="atlasReviewFromBoard(\''+id+'\')">'+(final?'Ver evaluación / acta':'Evaluar con rúbrica')+'</button></div>':'')+'</div></details>';
}
const atlasOpenState=new Map();
function atlasRenderGroups(containerId,groups,expand=false){
 const root=document.getElementById(containerId);if(!root)return;
 const prev=atlasOpenState.get(containerId)||new Set();
 root.innerHTML=groups.map(g=>{
 const t=atlasStats(g),m=g.members||[],key='g:'+g.group_code;
 return '<details class="card" data-atlas-group="'+esc(g.group_code)+'" '+(expand||prev.has(key)?'open':'')+' style="margin:10px 0"><summary style="font-weight:700;cursor:pointer;padding:6px 0">'+esc(atlasGroupLabel(g.group_code))+' · '+t.final+'/'+t.total+' calificadas <span class="status '+(t.review?'warn':'ok')+'">'+t.review+' por corregir / validar</span></summary><div style="margin-top:12px"><h3>'+esc(g.name||g.group_code)+'</h3><div class="note"><b>'+m.length+' integrantes · nota común</b><br>'+m.map(x=>esc(x.full_name||x.student_code||x.telegram_user_id)).join(' · ')+'</div><p class="subtle">'+t.work+' en curso o perfiladas · '+t.notStarted+' previstas sin iniciar. No equivalen a retraso sin plazo acreditado.</p>'+(g.foods||[]).slice().sort((a,b)=>Number(a.display_order??a.delivery_number)-Number(b.display_order??b.delivery_number)).map(atlasFoodHTML).join('')+'</div></details>';
 }).join('')||'<div class="empty">No hay actividades para estos filtros.</div>';
 for(const d of root.querySelectorAll('details[data-atlas-group],details[data-atlas-food]')){
 const key=d.dataset.atlasGroup?'g:'+d.dataset.atlasGroup:'f:'+d.dataset.atlasFood;
 if(prev.has(key))d.open=true;d.addEventListener('toggle',()=>{if(d.open)prev.add(key);else prev.delete(key);atlasOpenState.set(containerId,prev)});
 }
}
function renderAtlasBoardMain(){
 const d=state.atlasBoard,grid=document.getElementById('groupsGrid'),open=document.getElementById('atlasOpenSessions');
 if(!d){if(grid)grid.insertAdjacentHTML('afterbegin','<div class="note warn">No se pudo verificar la lista completa, archivos y notas individuales: '+esc(state.atlasBoardError||'consulta pendiente')+'. Se conserva la vista anterior.</div>');return}
 if(grid)grid.classList.remove('two');atlasRenderGroups('groupsGrid',d.groups||[]);
 if(open)open.insertAdjacentHTML('beforeend','<div class="card" style="margin:10px 0"><h3>Acta general del Gran Atlas</h3><p class="subtle">Archivo del curso. Las actas por actividad se exportan desde su evaluación.</p><div class="actions">'+atlasActaLinks()+'</div></div>');
}
function renderAtlasInboxGrouped(rows,filtering){
 const groups=new Map();for(const x of rows){const k=x.group_code||'—',b=(state.atlasBoard?.groups||[]).find(g=>g.group_code===k);if(!groups.has(k))groups.set(k,{group_code:k,name:b?.name||k,members:b?.members||x.members||[],foods:[]});groups.get(k).foods.push({...x,...(atlasBoardFood(x.id)||{})})}
 atlasRenderGroups('atlasInbox',[...groups.values()].sort((a,b)=>String(a.group_code).localeCompare(String(b.group_code))),filtering);
 const root=document.getElementById('atlasInbox');if(root)root.insertAdjacentHTML('afterbegin','<p class="subtle">Aquí aparecen entregas localizadas con los filtros actuales. <button class="btn" onclick="go(\'groups\')">Ver las 13 actividades previstas de cada grupo y el acta</button></p>');
}
async function atlasReviewFromBoard(id){
 try{if(!atlasById(id))await loadDeliveries(true);if(!atlasById(id))return toast('No se ha localizado el contenido entregado. Actualiza.',true);showAtlasDetail(id)}
 catch(e){toast(e.message||String(e),true)}
}
function atlasDetailExtra(x){
 const f=atlasBoardFood(x.id),g=(state.atlasBoard?.groups||[]).find(g=>g.group_code===x.group_code),m=g?.members||x.members||[];
 return '<div class="card" style="margin-top:12px"><h3>Archivos, acta y nota de equipo</h3><p>La validación final registra la misma nota para cada integrante activo matriculado, no solo para quien subió la ficha.</p><div class="note"><b>'+esc(atlasGroupLabel(x.group_code))+' · '+m.length+' integrantes</b><br>'+m.map(a=>esc(a.full_name||a.student_code||a.telegram_user_id)).join(' · ')+'</div>'+(f?atlasAuditHTML(f):'<p class="subtle">Distribución individual aún no consultada.</p>')+'<div class="actions" style="margin-top:8px">'+atlasOriginalLinks(f||x)+'</div><div class="actions" style="margin-top:10px"><button class="btn" onclick="atlasExportPDF(\''+x.id+'\',false)">Descargar ficha escrita y rúbrica</button><button class="btn" onclick="atlasExportPDF(\''+x.id+'\',true)">Descargar acta de evaluación</button></div><p class="subtle">Antes de validar, el acta exportada es un borrador, no una nota definitiva.</p><div class="actions">'+atlasActaLinks()+'</div><div id="atlasPrivatePanel" style="margin-top:8px"></div></div>';
}
function atlasExportPDF(id,onlyActa){
 const x=atlasById(id),C=window.jspdf?.jsPDF;if(!x||!C)return toast('Ficha o generador PDF no disponible.',true);
 const f=atlasBoardFood(id),g=(state.atlasBoard?.groups||[]).find(g=>g.group_code===x.group_code);
 try{const doc=new C({orientation:'portrait',unit:'mm',format:'a4'});let y=20;
 const line=(v,bold=false,size=10)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(bold?55:35,bold?48:43,bold?105:63);const text=String(v??'—').replace(/\r/g,'').replace(/[^\u0009\u000a\u0020-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d€]/g,' ');for(const para of text.split('\n'))for(const seg of doc.splitTextToSize(para||' ',174)){if(y>275){doc.addPage();y=20}doc.text(seg,18,y);y+=size>=13?7:5}};
 const final=x.status==='final'&&x.teacher_score!=null;
 line('CENQAL | GRAN ATLAS',true,16);line(onlyActa?(final?'ACTA DE EVALUACIÓN · NOTA REGISTRADA':'BORRADOR DE ACTA · PENDIENTE DE VALIDACIÓN'):'FICHA ESCRITA Y RÚBRICA · COPIA',true,12);
 line(atlasGroupLabel(x.group_code)+' · '+(x.food_name||x.food_code),true,11);line('Entrega '+(x.delivery_number??f?.display_order??'—')+' · '+x.food_code+' · ID '+x.id);line('Fecha de entrega: '+fmtDate(x.submitted_at));line('Estado: '+atlasV735Status(x.status));line('Nota IA: '+(x.ai_score==null?'Pendiente':x.ai_score+'/100'));line('Nota docente registrada: '+(x.teacher_score==null?'Sin nota':x.teacher_score+'/100'));
 const draft=document.getElementById('atlasTeacherScore')?.value,feedback=document.getElementById('atlasTeacherFeedback')?.value;
 if(!final&&draft!=null&&draft!=='')line('Propuesta sin guardar: '+draft+'/100');line('Feedback registrado: '+(x.teacher_feedback||'—'));if(!final&&feedback&&feedback!==x.teacher_feedback)line('Feedback de borrador: '+feedback);
 line('Integrantes activos del equipo',true,11);for(const m of g?.members||x.members||[])line(m.full_name||m.student_code||m.telegram_user_id);
 if(final){const a=atlasCheck(f);line(f?'Distribución comprobada: '+a.match+'/'+a.total+' expedientes.':'Distribución no comprobada en esta consulta.');for(const m of f?.grade_audit||[])line(m.name+': '+(m.score==null?'Sin nota':m.score+'/10'))}
 line('Rúbrica automática registrada (orientativa)',true,11);const ev=x.ai_evaluation;
 if(ev&&typeof ev==='object'){line('Versión: '+(ev.rubric_version||'CENQAL Atlas'));for(const c of Object.values(ev.criteria||{})){line((c.label||'Criterio')+': '+(c.score??'—')+'/'+(c.max_points??'—'),true);line(c.feedback||'—')}if(ev.summary)line(ev.summary);for(const k of ['strengths','improvements','evidence_warnings','manual_checks'])if(Array.isArray(ev[k])&&ev[k].length){line(({strengths:'Fortalezas',improvements:'Mejoras',evidence_warnings:'Alertas',manual_checks:'Comprobaciones docentes'})[k],true);for(const z of ev[k])line(z)}}else line('No hay rúbrica automática registrada.');
 if(!onlyActa){line('Contenido escrito registrado',true,12);for(const [label,key] of [['Identidad','identity_text'],['Matriz y composición','matrix_text'],['Moléculas protagonistas','molecules_text'],['Procesado','processing_text'],['Transformaciones químicas','transformations_text'],['Agua / actividad de agua','water_aw_text'],['Química y percepción','sensory_text'],['Estabilidad','stability_text'],['Control tecnológico','industry_text'],['Esquema integrador','scheme_text'],['Conclusión crítica','conclusion_text'],['Dato que sorprende','surprising_fact_text'],['Evidencias científicas','sources_text']]){line(label,true);line(x[key]||'—')}}
 line('Póster original: '+(atlasSafeLink(x.poster_url)||'No consta enlace válido.'));line('Copia generada desde Control. No sustituye el PDF original ni el acta general archivada.');
 const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(100);doc.text('Academia CENQAL | Gran Atlas',18,289);doc.text(i+'/'+n,191,289,{align:'right'})}doc.save('CENQAL_Atlas_'+String(x.food_code||id).replace(/[^a-zA-Z0-9_-]/g,'_')+(onlyActa?'_acta':'_ficha_rubrica')+'.pdf');
 }catch(e){toast('No se pudo exportar el PDF: '+(e.message||String(e)),true)}
}
