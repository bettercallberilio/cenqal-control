'use strict';
let cSurveyData=null;
function cSurveyFlat(data){
  return data.responses.map(r=>{const {answers,...row}=r;for(const [k,v] of Object.entries(answers||{}))row[k]=Array.isArray(v)?v.join(' | '):v;return row;});
}
function cSurveyDict(data){
  const seen=new Set(),rows=[];
  for(const c of data.campaigns)for(const q of c.definition){const key=c.instrument_version+':'+q.id;if(seen.has(key))continue;seen.add(key);rows.push({version:c.instrument_version,variable:q.id,pregunta:q.label,tipo:q.type,opciones:(q.options||[]).map(o=>o.value+' = '+o.label).join(' | '),referencia_pre:q.pre_reference||'Sin equivalencia PRE directa',tratamiento:'NA y omisión = dato ausente; no convertir en cero. AR05 tiene sentido inverso. No sumar utilidad, malestar y aprendizaje.'});}
  return rows;
}
function cSurveySummary(data){
  const rows=[];
  for(const c of data.campaigns){
    const responses=data.responses.filter(r=>r.campaign_code===c.code);
    for(const q of c.definition){if(q.type==='text')continue;
      const valid=responses.filter(r=>r.answers?.[q.id]!=null&&(!Array.isArray(r.answers[q.id])||r.answers[q.id].length));
      for(const option of q.options){const count=valid.filter(r=>Array.isArray(r.answers[q.id])?r.answers[q.id].includes(option.value):String(r.answers[q.id])===option.value).length;
        rows.push({campana:c.code,fase:c.phase,variable:q.id,opcion:option.label,n_entregas:responses.length,n_responden:valid.length,n_opcion:count,porcentaje:valid.length?Math.round(1000*count/valid.length)/10:null});
      }
    }
  }
  return rows;
}
async function cSurveyLoad(){
  const host=document.getElementById('cSurveyStatus');host.textContent='Consultando entregas…';
  try{
    cSurveyData=await rpc('cenqal_control_survey_report_v1',{p_token:TOKEN,p_research_only:false});
    host.replaceChildren();
    for(const c of cSurveyData.campaigns){const p=document.createElement('p');p.textContent=c.title+' · '+c.phase+' · '+new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'short'}).format(new Date(c.opens_at))+' → '+new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'short'}).format(new Date(c.closes_at));host.append(p);}
    const rows=cSurveyData.completion;
    const p=document.createElement('p');p.textContent=`${rows.filter(x=>x.status==='entregado').length} entregas de ${rows.length} previstas. La entrega no modifica calificaciones automáticamente.`;host.append(p);
    const table=document.createElement('table');table.className='table';
    const head=table.createTHead().insertRow();for(const h of ['Campaña','Alumno','Estado','Entrega','Acceso alternativo']){const th=document.createElement('th');th.textContent=h;head.append(th);}
    const body=table.createTBody();for(const x of rows){const row=body.insertRow();for(const value of [x.campaign_code,x.full_name||x.student_code,x.status,x.submitted_at?fmtDate(x.submitted_at):'—'])row.insertCell().textContent=value;
      const btn=document.createElement('button');btn.className='btn';btn.textContent='Preparar enlace personal';btn.onclick=()=>cSurveyLink(x.campaign_code,x.student_code);row.insertCell().append(btn);
    }
    const wrap=document.createElement('div');wrap.className='tablewrap';wrap.append(table);host.append(wrap);
  }catch(e){host.textContent='No se ha podido cargar el módulo de encuestas: '+e.message;}
}
async function cSurveyLink(campaign,student){
  try{const d=await rpc('cenqal_control_survey_link_v1',{p_token:TOKEN,p_campaign:campaign,p_student_code:student});
    const input=document.createElement('textarea');input.readOnly=true;input.setAttribute('aria-label','Enlace individual para '+student);input.value='https://bettercallberilio.github.io/cenqal-gym/survey.html?campaign='+encodeURIComponent(campaign)+'#token='+encodeURIComponent(d.token);
    const host=document.getElementById('cSurveyPrivateLink');host.replaceChildren();const label=document.createElement('p');label.textContent='Enlace personal para '+student+'. Entrégalo únicamente a este alumno; no lo publiques en el grupo.';host.append(label,input);input.focus();input.select();
  }catch(e){toast(e.message,true);}
}
async function cSurveyAppendSheets(wb,researchOnly=false){
  const data=await rpc('cenqal_control_survey_report_v1',{p_token:TOKEN,p_research_only:researchOnly});
  v69AddSheet(wb,'ENCUESTA_DATOS',cSurveyFlat(data),Array(55).fill(18));
  v69AddSheet(wb,'ENCUESTA_RESUMEN',cSurveySummary(data),Array(10).fill(20));
  v69AddSheet(wb,'ENCUESTA_DICCIONARIO',cSurveyDict(data),[22,18,75,18,70,55,80]);
  v69AddSheet(wb,'ENCUESTA_METODO',[{modo:researchOnly?'Solo con autorización científica; seudonimizado; sin texto libre':'Uso docente; contiene códigos personales y comentarios',fecha_exportacion:data.exported_at,version:'CENQAL-SURVEY-1',advertencia:'Estudio descriptivo intermedio. Aprendizaje percibido no equivale a conocimiento medido. No calcular ganancias entre ítems no equivalentes ni atribuir causalidad. Comparar MID y FINAL con igual versión. Revisar equivalencia PRE de AR01–AR05 y consentimiento para reutilizar datos previos.'}],[50,25,25,100]);
  if(!researchOnly)v69AddSheet(wb,'ENCUESTA_ENTREGAS',data.completion,Array(5).fill(25));
}
async function cSurveyResearchExport(){
  try{const wb=v69Workbook();await cSurveyAppendSheets(wb,true);v742PrepareExcel(wb,'CENQAL_Encuesta_Investigacion_Seudonimizada.xlsx');toast('Exportación científica preparada; incluye únicamente respuestas autorizadas.');}catch(e){toast(e.message,true);}
}
