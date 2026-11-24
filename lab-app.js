(() => {
"use strict";
const TOPICS=[
 {id:1,title:"Enlace químico, agua y actividad de agua",focus:"El agua no es solo un ingrediente: determina interacciones, movilidad molecular y estabilidad.",hook:"¿Por qué una mermelada puede conservarse mejor que una fruta fresca, aunque las dos contengan agua?",story:"La humedad indica cuánta agua hay. La actividad de agua describe su disponibilidad termodinámica. No son magnitudes equivalentes: el azúcar y otros solutos modifican el potencial químico del agua y, con ello, el crecimiento microbiano y varias velocidades de deterioro. La relación depende de la matriz y la temperatura.",anecdote:"Dos alimentos pueden tener porcentajes de humedad semejantes y actividades de agua muy distintas. Es un gran punto de partida para hablar de enlaces de hidrógeno y conservación.",teaching:"Presenta dos productos con humedad aparente similar. Antes de explicar la diferencia entre humedad y aᵥ, pide una predicción y haz explícita la razón que propone cada alumno. Después compara con datos reales del producto.",notes:"Distinguir contenido de agua y actividad de agua; incluir potencial químico, interacciones alimento-agua, isotermas de sorción y consecuencias sobre estabilidad microbiológica y fisicoquímica.",diagram:[["Estructura","Enlaces de hidrógeno"],["Interacciones","Solutos y matriz"],["Consecuencia","Actividad de agua y estabilidad"]],tags:["Agua y actividad de agua","Conservación de alimentos"]},
 {id:2,title:"Química orgánica, grupos funcionales e hidratos de carbono",focus:"Los grupos funcionales permiten anticipar reactividad, sabor y transformaciones tecnológicas.",hook:"¿Por qué el pan pierde frescura aunque no esté contaminado?",story:"El envejecimiento del pan incluye la retrogradación del almidón y redistribuciones de agua. Durante la cocción, los gránulos de almidón experimentan gelatinización bajo condiciones adecuadas de agua y temperatura. Después, ciertas cadenas pueden reorganizarse y contribuir al endurecimiento de la miga.",anecdote:"No confundas el endurecimiento de la miga con la pérdida de humedad: pueden ocurrir al mismo tiempo, pero son fenómenos distintos.",teaching:"Compara pan recién hecho, pan del día anterior y pan recalentado. Pide que expliquen qué cambios son reversibles parcialmente y cuáles no. Relaciona las observaciones con estructura molecular.",notes:"Añadir una tabla que separe gelatinización, gelificación, retrogradación, dextrinización, caramelización y reacción de Maillard. Explicar las condiciones para cada proceso.",diagram:[["Moléculas","Amilosa y amilopectina"],["Procesado","Gelatinización"],["Almacenamiento","Retrogradación y textura"]],tags:["Almidón","Carbohidratos","Reacción de Maillard"]},
 {id:3,title:"Aminoácidos y proteínas",focus:"La funcionalidad depende de la estructura, del medio y de las interacciones entre proteínas.",hook:"¿Cómo consigue la clara de huevo atrapar aire y formar una espuma?",story:"Durante el batido, las proteínas se adsorben en la interfase aire-agua y pueden reorganizarse, creando películas que retardan la coalescencia de las burbujas. La estabilidad depende de muchos factores, incluidos pH, azúcar, intensidad de batido y presencia de grasa.",anecdote:"No todas las desnaturalizaciones generan un alimento sólido: las proteínas también estabilizan espumas, emulsiones y geles.",teaching:"Enseña dos espumas de clara preparadas con condiciones diferentes y solicita hipótesis sobre por qué una es más estable. Evita dar una única explicación antes de contrastar las observaciones.",notes:"Separar desnaturalización de hidrólisis y de coagulación. Relacionar estructura primaria-cuaternaria con solubilidad, espumas, emulsiones, geles y textura de alimentos.",diagram:[["Estructura","Conformación proteica"],["Interfase","Adsorción y reorganización"],["Alimento","Espuma o gel funcional"]],tags:["Proteínas","Espumas","Geles"]},
 {id:4,title:"Lípidos",focus:"Los lípidos explican buena parte de la textura, el aroma y la estabilidad oxidativa.",hook:"¿Por qué el chocolate necesita un tratamiento térmico cuidadoso para tener brillo y un buen chasquido?",story:"La manteca de cacao es una mezcla de triacilglicéridos que puede cristalizar en distintas formas. Las condiciones de enfriamiento y templado influyen en la estructura cristalina, el brillo, la contracción y la textura. No hay que confundir polimorfismo con una reacción química: se trata de organización del sólido.",anecdote:"Un mismo chocolate puede presentar diferencias sensoriales evidentes sin cambiar su receta, solo por su historia térmica y cristalización.",teaching:"Compara piezas de chocolate correctamente templado y no templado. Pide describir brillo, fractura y superficie; después conecta las observaciones con polimorfismo y procesado.",notes:"Añadir comparación entre polimorfismo lipídico y oxidación. Incluir redes cristalinas, estabilidad, emulsiones y factores que favorecen el enranciamiento.",diagram:[["Composición","Triacilglicéridos"],["Procesado","Cristalización controlada"],["Resultado","Brillo, textura y estabilidad"]],tags:["Lípidos","Oxidación lipídica","Emulsiones"]},
 {id:5,title:"Enzimas",focus:"Las enzimas ofrecen selectividad y eficiencia, pero dependen de las condiciones del medio.",hook:"¿Por qué una rodaja de piña fresca puede impedir que una gelatina cuaje bien?",story:"La piña fresca contiene proteasas, entre ellas bromelina, capaces de hidrolizar proteínas. El tratamiento térmico modifica su actividad. El resultado depende de temperatura, cantidad de enzima, tiempo y composición del sistema, por lo que conviene comparar condiciones controladas.",anecdote:"La misma fruta puede ser un ingrediente culinario y una fuente de herramientas biotecnológicas; el calor cambia su efecto sobre determinadas proteínas.",teaching:"Presenta antes el resultado de dos gelatinas, una con piña fresca y otra con piña calentada. Pregunta qué variable explica la diferencia y cómo la comprobarían.",notes:"Reforzar sitio activo, especificidad, temperatura, pH, inhibición y desnaturalización, distinguiendo actividad de estabilidad enzimática.",diagram:[["Sustrato","Proteína alimentaria"],["Catalizador","Proteasa activa"],["Transformación","Hidrólisis de enlaces peptídicos"]],tags:["Enzimas","Proteínas","Procesado térmico"]},
 {id:6,title:"Sistemas dispersos, disoluciones y termoquímica",focus:"Una cocina permite observar emulsiones, coloides y transferencias de energía.",hook:"¿Por qué la mayonesa se mantiene dispersa si el aceite y el agua tienden a separarse?",story:"Las emulsiones son sistemas termodinámicamente inestables cuya separación puede ralentizarse gracias a moléculas interfaciales y a la estructura formada durante el mezclado. La energía mecánica ayuda a fragmentar gotas, mientras que el emulsificante interviene en su estabilidad cinética.",anecdote:"Una emulsión puede parecer estable durante horas y seguir siendo termodinámicamente desfavorable: estabilidad cinética y estabilidad termodinámica no son sinónimos.",teaching:"Compara una vinagreta y una emulsión preparada con un emulsificante alimentario. Analiza tamaño aparente de gotas, tiempo de separación y variables que intervienen.",notes:"Incluir un mapa que distinga disoluciones verdaderas, emulsiones, espumas, suspensiones y geles. Relacionar formación de estructuras con energía e interacciones moleculares.",diagram:[["Fases","Aceite y fase acuosa"],["Energía","Mezclado y creación de gotas"],["Interfase","Emulsificante y estabilidad"]],tags:["Emulsiones","Hidrocoloides","Geles"]},
 {id:7,title:"Cinética, equilibrio químico y ácido-base",focus:"Temperatura, pH y tiempo condicionan reacciones y propiedades de los alimentos.",hook:"¿Por qué una infusión morada puede transformarse en rosa al añadir limón?",story:"Algunas antocianinas participan en equilibrios dependientes del pH entre especies de distinta estructura y color. El comportamiento real varía con pigmento, matriz, concentración, temperatura y copigmentación. No todos los pigmentos alimentarios reaccionan igual.",anecdote:"Cambiar el color de una bebida con un ingrediente culinario puede ser una puerta de entrada a los equilibrios ácido-base y a las limitaciones de los indicadores.",teaching:"Muestra varios vasos con infusiones y distintas cantidades de limón. Pide ordenar la acidez antes de interpretar el equilibrio. Explica por qué el color no es una medida cuantitativa universal de pH.",notes:"Diferenciar velocidad de reacción y posición del equilibrio. Explicar el efecto del pH sobre color, proteínas, fermentaciones y conservación.",diagram:[["Medio","Cambio de pH"],["Equilibrio","Especies moleculares"],["Observación","Cambio de color"]],tags:["Pigmentos y color","Conservación de alimentos","Procesado térmico"]},
 {id:8,title:"Oxidación-reducción y transferencia de electrones",focus:"La oxidación enlaza color, aroma, estabilidad y vida útil.",hook:"¿Por qué una manzana se oscurece al cortarla y cómo se puede ralentizar?",story:"El pardeamiento enzimático de numerosas frutas requiere la actuación de polifenoloxidasas sobre determinados sustratos fenólicos en presencia de oxígeno. La acidez, el calentamiento y la disponibilidad de oxígeno pueden modificar la velocidad del proceso.",anecdote:"El oscurecimiento de una fruta cortada no es el mismo mecanismo que la reacción de Maillard de una corteza horneada.",teaching:"Organiza muestras iguales de manzana con distintas condiciones culinarias. Compara color y tiempo y pide separar las causas químicas de las enzimáticas.",notes:"Añadir diferencias entre pardeamiento enzimático, oxidación lipídica y Maillard; definir oxidante y reductor en sistemas alimentarios con ejemplos.",diagram:[["Sustrato","Fenoles y oxígeno"],["Sistema","Polifenoloxidasa"],["Resultado","Pigmentos de pardeamiento"]],tags:["Pigmentos y color","Oxidación lipídica","Conservación de alimentos"]}
];
const PRACTICES=[
 {topic:1,title:"Conservación y actividad de agua: el efecto del azúcar",time:"60–90 min",ingredients:"Fruta, azúcar, agua y recipientes alimentarios",equipment:"Báscula, cazo, cuchara, termómetro, vasos",process:"Preparar porciones con distintas concentraciones de azúcar y comparar movilidad del agua, textura y estabilidad aparente. Si no hay medidor de aᵥ, no afirmar valores: usarlo como modelo cualitativo.",safety:"Control de quemaduras y superficies calientes. No consumir preparaciones almacenadas sin un proceso de conservación validado.",signal:"Cambios de textura y concentración; comparar con datos bibliográficos sobre aᵥ."},
 {topic:2,title:"Gelatinización y retrogradación: dos almidones en cocina",time:"60–90 min",ingredients:"Almidón de maíz, harina de arroz y agua",equipment:"Cazos, varillas, báscula, termómetro y frigorífico",process:"Preparar dispersiones equivalentes, calentarlas con agitación y comparar viscosidad y firmeza tras enfriar. Anotar proporciones y tiempo de reposo.",safety:"Evitar quemaduras y alérgenos cruzados. Consumir solo si se cumplen condiciones higiénicas.",signal:"Viscosidad, formación de gel y firmeza tras enfriamiento."},
 {topic:3,title:"Espumas proteicas: batido, azúcar y acidez",time:"45–75 min",ingredients:"Claras pasteurizadas, azúcar y limón",equipment:"Batidora, báscula, cronómetro y recipientes",process:"Comparar el volumen inicial, la formación de espuma y el drenaje en preparaciones con pequeñas variaciones controladas de ingredientes.",safety:"Utilizar clara pasteurizada; no probar espumas sin tratamiento validado.",signal:"Volumen, estabilidad, drenaje y textura."},
 {topic:4,title:"Polimorfismo de la manteca de cacao con chocolate",time:"60–90 min",ingredients:"Chocolate de cobertura de una sola referencia",equipment:"Termómetro, baño maría, espátula y moldes",process:"Comparar pequeñas muestras templadas siguiendo el perfil recomendado para esa cobertura frente a otras que solidifiquen sin templado controlado.",safety:"Evitar sobrecalentamiento, agua en el chocolate y quemaduras.",signal:"Brillo, contracción, superficie y fractura."},
 {topic:5,title:"Proteasas culinarias: piña y gelatina",time:"40 min + enfriamiento",ingredients:"Piña fresca, piña calentada y gelatina alimentaria",equipment:"Cazo, báscula, moldes y frigorífico",process:"Preparar gelatinas iguales; incorporar piña fresca a una y piña calentada a otra. Mantener constantes las demás variables.",safety:"Control de temperaturas y refrigeración; informar de alérgenos y sensibilidades.",signal:"Diferencias de cuajado y consistencia."},
 {topic:6,title:"Emulsiones: mayonesa con y sin emulsificante",time:"45–70 min",ingredients:"Agua, aceite, limón y lecitina alimentaria o aquafaba",equipment:"Batidora, vasos transparentes, cronómetro y báscula",process:"Comparar sistemas equivalentes con y sin emulsificante; observar separación y estabilidad tras reposo.",safety:"Evitar huevo crudo; usar ingredientes aptos y una manipulación higiénica.",signal:"Separación de fases y estabilidad con el tiempo."},
 {topic:7,title:"Indicadores naturales de pH en cocina",time:"35–55 min",ingredients:"Col lombarda, limón, bicarbonato alimentario y agua",equipment:"Vasos, filtros, cuchara y hervidor",process:"Preparar un extracto acuoso de lombarda y añadir pequeñas cantidades de ingredientes alimentarios ácidos o básicos; observar y registrar colores.",safety:"No ingerir las muestras experimentales; evitar recipientes no alimentarios.",signal:"Cambios de color relacionados cualitativamente con el equilibrio ácido-base."},
 {topic:8,title:"Pardeamiento de manzana: oxígeno, acidez y calor",time:"40–60 min",ingredients:"Manzanas del mismo lote, limón y agua",equipment:"Cuchillos, recipientes, cronómetro y tabla",process:"Comparar rodajas equivalentes al aire, tratadas con zumo de limón, protegidas del aire y escaldadas; fotografiar en intervalos iguales.",safety:"Seguridad con cuchillos, calor y superficies limpias.",signal:"Velocidad y extensión del cambio de color."}
];
const state={data:null,topic:1,area:"lesson",gym:null,practiceAll:false,search:"",busy:false};
const pending=new Map();let nextRequest=0;
const el=(id)=>document.getElementById(id);
const esc=(s)=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function safeUrl(v){try{const u=new URL(String(v));return u.protocol==="https:"?u.href:""}catch{return ""}}
function notify(msg,bad){const n=el("notice");n.textContent=String(msg||"");n.className="notice"+(bad?" bad":"");n.hidden=false;clearTimeout(notify._timer);notify._timer=setTimeout(()=>n.hidden=true,6500)}
function api(action,payload={}){
 return new Promise((resolve,reject)=>{
  if(window.parent===window)return reject(Error("Abre CENQAL LAB desde tu panel docente."));
  const id=++nextRequest;const timer=setTimeout(()=>{pending.delete(id);reject(Error("La consulta ha tardado demasiado. Revisa la conexión."))},30000);
  pending.set(id,{resolve,reject,timer});
  window.parent.postMessage({type:"CENQAL_LAB_REQUEST",id,action,payload},window.location.origin);
 });
}
window.addEventListener("message",event=>{
 if(event.origin!==location.origin||event.source!==window.parent)return;
 const m=event.data||{};
 if(m.type==="CENQAL_LAB_RESPONSE"){
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);
  if(m.ok)p.resolve(m.data);else p.reject(Error(m.error||"Consulta no disponible"));
 }
 if(m.type==="CENQAL_LAB_RESET"){state.data=null;state.gym=null;load()}
});
function topic(){return TOPICS.find(t=>t.id===state.topic)||TOPICS[0]}
function tag(t,cls=""){return '<span class="chip '+cls+'">'+esc(t)+'</span>'}
function sectionTop(k,title,subtitle){return '<div class="heroPanel"><span class="eyebrow">'+esc(k)+'</span><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p>'+tag("Tema "+state.topic)+tag(topic().title,"gold")+'</div>'}
function libraryMatches(){
 const labels=topic().tags;const rs=(state.data?.resources||[]);
 const matches=rs.filter(r=>labels.includes(String(r.topic||"")));
 return matches.length?matches:rs.slice(0,12);
}
function resourceCard(r){
 const url=safeUrl(r.url)|| (r.doi&&/^[0-9.]+\/[A-Za-z0-9._;()/:-]+$/.test(String(r.doi))?"https://doi.org/"+r.doi:"");
 const meta=[r.publication_year||"Año no indicado",r.source_name||r.resource_type||"Fuente",r.topic||"General"].filter(Boolean).map(esc).join(" · ");
 return '<div class="resource"><div class="miniLabel">'+esc(r.resource_type==="review"?"Revisión científica":r.resource_type==="scientific_article"?"Artículo científico":"Recurso CENQAL")+'</div><h4>'+esc(r.title||"Recurso sin título")+'</h4><div class="meta">'+meta+'</div><p>'+esc((r.description||"").slice(0,300))+'</p>'+(url?'<a class="btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+esc(url)+'">Leer fuente original</a>':'<span class="subtle">Sin enlace abierto verificado</span>')+(r.doi?'<span class="subtle"> DOI: '+esc(r.doi)+'</span>':'')+'</div>';
}
function saveButton(section,title,summary){return '<button class="btn" data-save-prompt="'+esc(section)+'" data-prompt-title="'+esc(title)+'" data-prompt-summary="'+esc(summary)+'">＋ Guardar como idea</button>'}
function renderMetrics(){
 const d=state.data||{},n=Object.values(d.question_counts||{}).reduce((a,b)=>a+Number(b||0),0);
 const total=Object.values(d.progress||{}).reduce((a,b)=>a+Number(b.total||0),0);
 el("labMetrics").innerHTML=[
  ["Referencias CENQAL",d.resources?.length??"—","documentos validados"],
  ["Preguntas disponibles",n,"banco científico conectado"],
  ["Mis ideas",d.cards?.length??"—","archivo docente personal"],
  ["Repasos libres",total,"sin notas académicas"]
 ].map(a=>'<div class="stat"><span>'+esc(a[0])+'</span><b>'+esc(a[1])+'</b><small>'+esc(a[2])+'</small></div>').join("");
}
function renderTopicSelect(){
 const d=state.data||{};
 const names=new Map((d.topics||[]).map(t=>[Number(t.topic_number),t.title]));
 el("topicSelect").innerHTML=TOPICS.map(t=>'<option value="'+t.id+'"'+(state.topic===t.id?" selected":"")+'>Tema '+t.id+' · '+esc(names.get(t.id)||t.title)+'</option>').join("");
}
function renderInfographic(){
 const t=topic();
 return '<div class="panel"><div class="sectionTitle"><h2>Infografía · mecanismo en tres pasos</h2><button id="downloadInfographic" class="btn">⬇ Descargar SVG vectorial</button></div><div class="flowDiagram">'+t.diagram.map(s=>'<div class="flowStep">'+esc(s[0])+'<small>'+esc(s[1])+'</small></div>').join("")+'</div><p class="subtle">Esquema conceptual editable, propuesto para tus presentaciones. Debe revisarse junto con el apartado científico completo.</p></div>';
}
function renderLesson(){
 const t=topic();
 return sectionTop("LUNES · LA LECCIÓN MAGISTRAL","Una historia que merece ser contada","Ciencia, anécdotas y conexiones que puedes utilizar para despertar la curiosidad del alumnado.")+
 '<div class="deck"><div class="panel"><div class="miniLabel">Pregunta de apertura</div><h3>'+esc(t.hook)+'</h3><p class="lecture">'+esc(t.story)+'</p><div class="infoBand">'+esc(t.anecdote)+'</div></div><div class="panel"><div class="miniLabel">Hilo científico</div><h3>'+esc(t.focus)+'</h3>'+renderConcepts()+'<p class="subtle">Las referencias asociadas se consultan desde Radar de ciencia y la biblioteca CENQAL.</p>'+saveButton("lesson",t.hook,t.story)+'</div></div>'+renderInfographic();
}
function renderConcepts(){return '<div class="tagRow">'+topic().tags.map(x=>tag(x)).join("")+'</div><p class="subtle">Conexiones explícitas con conceptos ya catalogados en CENQAL.</p>'}
function renderRadar(){
 const rs=libraryMatches();
 return sectionTop("MARTES · RADAR DE CIENCIA","Ciencia conectada con tus temas","Selección del archivo de referencias validadas de CENQAL; no se presentan como publicaciones nuevas si no lo son.")+
 '<div class="deck"><div class="panel"><h3>Referencias científicas relacionadas</h3>'+rs.slice(0,5).map(resourceCard).join("")+'</div><div class="panel"><h3>Conexiones para explorar</h3>'+renderConcepts()+'<p>Una referencia puede relacionarse con varios temas: desde esta selección también puedes abrir el <b>Archivo CENQAL</b> y buscar por ingrediente, molécula o proceso.</p><button class="btn primary" data-switch="library">Consultar biblioteca y hallazgos</button><div class="infoBand slate">Las referencias visibles proceden de la base CENQAL. Berilio podrá añadir nuevas propuestas a la bandeja de revisión cuando se active el ciclo editorial.</div></div></div>';
}
function renderTeaching(){
 const t=topic();
 return sectionTop("MIÉRCOLES · MEJORA LA PROFESORA","Una forma mejor de enseñar","Técnicas que puedes incorporar cuando te interesen; sin entregas ni tareas obligatorias.")+
 '<div class="deck"><div class="panel"><div class="miniLabel">Propuesta pedagógica</div><h3>De la observación a la explicación</h3><p class="lecture">'+esc(t.teaching)+'</p><div class="infoBand green">Pregunta opcional para tu propia reflexión: ¿qué concepción previa sobre este tema descubrirían tus alumnos con esta demostración?</div>'+saveButton("teaching","Explicar mejor: "+t.title,t.teaching)+'</div><div class="panel"><h3>La secuencia pedagógica</h3><div class="flowDiagram"><div class="flowStep">Predecir<small>Qué esperas observar</small></div><div class="flowStep">Observar<small>Contrastar el fenómeno</small></div><div class="flowStep">Explicar<small>Modelo químico</small></div></div><p>La propuesta sirve para plantear preguntas, recoger ideas previas y guiar la explicación. La eficacia real depende del diseño, del feedback y de la adaptación al grupo.</p></div></div>';
}
function renderNotes(){
 const t=topic();const saved=(state.data?.cards||[]).filter(c=>c.topic_number===state.topic&&["notes","infographic"].includes(c.section));
 return sectionTop("JUEVES · BERILIO MEJORA MIS APUNTES","Revisión progresiva del tema","Ideas y contenidos listos para adaptar; los archivos originales no se modifican automáticamente.")+
 '<div class="panel"><div class="miniLabel">Actualización propuesta para el tema '+state.topic+'</div><h3>'+esc(t.title)+'</h3><p class="lecture">'+esc(t.notes)+'</p><div class="infoBand slate">Dónde incluirlo: en el apartado de fundamentos y aplicaciones alimentarias. Es una propuesta de redacción; revisa el encaje con tus diapositivas originales.</div>'+saveButton("notes","Ampliación de apuntes · "+t.title,t.notes)+'</div>'+renderInfographic()+
 '<div class="panel"><div class="sectionTitle"><h2>Mis propuestas guardadas</h2><button class="btn" data-switch="library">Abrir biblioteca</button></div>'+(saved.length?saved.map(cardHTML).join(""):'<p class="subtle">Todavía no has guardado ampliaciones de este tema. No hay nada pendiente.</p>')+'</div>';
}
function renderGrowth(){
 const d=state.data||{},rs=d.resources||[],cards=d.cards||[],recent=rs.filter(x=>x.created_at&&Date.now()-Date.parse(x.created_at)<7*86400000),byTopic=new Map();
 for(const r of rs)byTopic.set(r.topic||"Sin tema",(byTopic.get(r.topic||"Sin tema")||0)+1);
 const sorted=[...byTopic.entries()].sort((a,b)=>b[1]-a[1]);
 return sectionTop("VIERNES · CENQAL CRECE","Una base de conocimiento viva","Resumen de lo que está documentado y de las propuestas guardadas. No confunde referencias validadas con ideas por revisar.")+
 '<div class="deck"><div class="panel"><div class="miniLabel">Evolución verificada</div><h3>'+rs.length+' referencias científicas validadas</h3><p>'+recent.length+' referencias con alta registrada en los últimos 7 días.</p><p>'+cards.length+' ideas docentes personales registradas; '+cards.filter(c=>c.state==="approved").length+' marcadas como aprobadas por ti.</p><p class="subtle">Las propuestas docentes no alteran las fichas científicas oficiales automáticamente.</p></div><div class="panel"><h3>Temas más representados</h3>'+sorted.slice(0,9).map(([k,v])=>'<div class="resource"><b>'+esc(k)+'</b> <span class="chip slate">'+v+' referencias</span></div>').join("")+'</div></div>'+
 '<div class="panel"><h3>La conexión de esta semana</h3><p class="lecture">'+esc(topic().focus)+'</p>'+renderConcepts()+'<button class="btn primary" data-switch="library">Explorar referencias y propuestas</button></div>';
}
function renderReading(){
 const rs=libraryMatches(),review=rs.find(x=>x.resource_type==="review"),article=rs.find(x=>x.resource_type==="scientific_article"&&x.id!==review?.id),other=rs.find(x=>x.id!==review?.id&&x.id!==article?.id);
 const picks=[review,article,other].filter(Boolean);
 return sectionTop("SÁBADO · LECTURAS PARA EL FIN DE SEMANA","Leer por curiosidad","Tres lecturas vinculadas al hilo conductor, elegidas de la base validada. No hay seguimiento ni lecturas obligatorias.")+
 '<div class="panel"><h3>En tu mesita de lectura</h3>'+picks.map(resourceCard).join("")+'<div class="infoBand green">Si no te apetece leer ninguna, no pasa nada. Las referencias siguen disponibles en CENQAL.</div></div>';
}
function renderPractices(){
 const list=state.practiceAll?PRACTICES:PRACTICES.filter(p=>p.topic===state.topic);
 return sectionTop("BANCO DE PRÁCTICAS · COCINA DOCENTE","La cocina es nuestro laboratorio","Experiencias culinarias con fundamento químico, diseñadas para cocina docente. Son ideas para ensayar, no protocolos validados ni tareas pendientes.")+
 '<div class="actions"><button class="btn'+(state.practiceAll?" primary":"")+'" id="togglePractices">'+(state.practiceAll?"Ver solo tema "+state.topic:"Mostrar prácticas de todos los temas")+'</button><button class="btn" data-switch="library">Ver mis ideas guardadas</button></div>'+
 '<div class="kitchenGrid">'+list.map(p=>'<article class="kitchenCard"><div class="miniLabel">TEMA '+p.topic+' · '+esc(p.time)+'</div><h3>'+esc(p.title)+'</h3><p><b>Qué demuestra:</b> '+esc(TOPICS.find(t=>t.id===p.topic)?.focus||"Química alimentaria")+'</p><details><summary>Ver idea de práctica en cocina</summary><p><b>Ingredientes:</b> '+esc(p.ingredients)+'</p><p><b>Equipo:</b> '+esc(p.equipment)+'</p><p><b>Propuesta:</b> '+esc(p.process)+'</p><p><b>Qué observar:</b> '+esc(p.signal)+'</p><p><b>Seguridad:</b> '+esc(p.safety)+'</p></details>'+saveButton("practice",p.title,"Ingredientes: "+p.ingredients+". Equipo: "+p.equipment+". "+p.process+". Seguridad: "+p.safety+". Observación: "+p.signal)+'</article>').join("")+'</div>';
}
function renderGym(){
 const t=topic(),count=state.data?.question_counts?.[state.topic]||0,stat=state.data?.progress?.[state.topic]||{total:0,correct:0};
 if(!state.gym||state.gym.topic!==state.topic){
 return sectionTop("GIMNASIO · REPASO LIBRE","Cuestiones para mantener la curiosidad","Preguntas auténticas del banco CENQAL, con corrección y explicación. Tus respuestas se guardan en un registro docente separado; no generan notas, premios ni sanciones.")+
 '<div class="gymWrap"><div class="panel"><h3>'+esc(t.title)+'</h3><p class="lecture">Repasa diez preguntas de este tema, o vuelve otro día cuando te apetezca. Elige la respuesta y Berilio te explicará el fundamento.</p><div class="infoBand green">'+count+' preguntas activas disponibles para este tema.</div><button id="gymStart" class="btn primary"'+(count?"":" disabled")+'>Empezar un repaso de 10 preguntas</button></div><div class="panel"><h3>Tu recorrido personal</h3><p><b>'+stat.total+'</b> respuestas registradas · <b>'+stat.correct+'</b> aciertos.</p><div class="progressTrack"><div class="progressFill" style="width:'+(stat.total?Math.round(stat.correct/stat.total*100):0)+'%"></div></div><p class="subtle">Este indicador describe la práctica personal, no es una calificación docente.</p></div></div>';
 }
 const g=state.gym;
 if(g.index>=g.questions.length){
 return '<div class="heroPanel"><div class="eyebrow">REPASO COMPLETADO</div><h2>¡Buen recorrido científico!</h2><p>Has explorado '+g.questions.length+' cuestiones. Has acertado '+g.correct+' y tienes explicaciones para seguir aprendiendo cuando quieras.</p><button id="gymAgain" class="btn primary">Otro repaso</button></div>';
 }
 const q=g.questions[g.index],answered=g.answer;
 const options=["A","B","C","D"].map(letter=>{
  const name=q["option_"+letter.toLowerCase()];
  const cls=answered?(letter===answered.correct_option?" correct":letter===g.selected?" incorrect":""):(letter===g.selected?" chosen":"");
  return '<button class="optionRow'+cls+'" data-answer="'+letter+'" '+(answered?" disabled":"")+ '><span class="optLetter">'+letter+'</span><span>'+esc(name)+'</span></button>';
 }).join("");
 return '<div class="gymWrap"><div class="panel"><div class="miniLabel">PREGUNTA '+(g.index+1)+' DE '+g.questions.length+'</div><div class="progressTrack"><div class="progressFill" style="width:'+Math.round(g.index/g.questions.length*100)+'%"></div></div><h3 class="questionTitle">'+esc(q.question_text)+'</h3><div class="tagRow">'+tag(q.concept||"Concepto")+tag(q.difficulty||"Dificultad","slate")+'</div>'+options+(answered?'<div class="feedback'+(answered.correct?"":" bad")+'"><h4>'+(answered.correct?"Respuesta acertada":"Vamos a comprender la respuesta")+'</h4><p><b>Respuesta correcta: '+esc(answered.correct_option)+'</b></p><p>'+esc(answered.explanation)+'</p></div><button class="btn primary" id="gymNext">Siguiente →</button>':'<p class="subtle">Selecciona una opción. Recibirás una explicación inmediatamente.</p>')+'</div><div class="panel"><h3>Exploración sin presión</h3><p>'+esc(t.title)+'</p><p><b>'+g.correct+'</b> aciertos en este repaso.</p><p class="subtle">Puedes salir y volver cuando quieras; las respuestas anteriores ya estarán registradas.</p><button class="btn" id="gymStop">Volver a los temas</button></div></div>';
}
function cardHTML(c){
 const states={candidate:"Propuesta",reviewed:"Revisada",approved:"Aprobada"};
 const source=safeUrl(c.source_url);
 return '<div class="resource"><div class="tagRow">'+tag("Tema "+c.topic_number)+tag(c.section,"slate")+'<span class="status '+esc(c.state)+'">'+esc(states[c.state]||"Propuesta")+'</span></div><h4>'+esc(c.title)+'</h4><p>'+esc(c.summary||"Sin descripción")+'</p><div class="actions">'+(source?'<a class="btn" href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Abrir fuente</a>':'')+(c.state!=="reviewed"?'<button class="btn" data-card-id="'+esc(c.id)+'" data-card-state="reviewed">Marcar revisada</button>':'')+(c.state!=="approved"?'<button class="btn" data-card-id="'+esc(c.id)+'" data-card-state="approved">Aprobar idea</button>':'')+'</div></div>';
}
function renderLibrary(){
 const cards=state.data?.cards||[],q=state.search.toLowerCase(),filtered=cards.filter(c=>(String(c.title||"")+" "+String(c.summary||"")).toLowerCase().includes(q));
 return sectionTop("MI BIBLIOTECA DOCENTE","Ideas conectadas con CENQAL","Guarda conexiones, recursos, ideas de cocina y mejoras de apuntes. Las propuestas se mantienen separadas del conocimiento científico validado.")+
 '<div class="deck"><div class="panel"><h3>Añadir una idea o descubrimiento</h3><form id="newLabCard"><div class="inlineForm"><div class="field"><label for="cardTopic">Tema</label><select id="cardTopic" name="topic">'+TOPICS.map(t=>'<option value="'+t.id+'"'+(t.id===state.topic?" selected":"")+'>'+t.id+' · '+esc(t.title)+'</option>').join("")+'</select></div><div class="field"><label for="cardSection">Sección</label><select id="cardSection" name="section"><option value="lesson">Lección magistral</option><option value="radar">Radar de ciencia</option><option value="teaching">Mejora la profesora</option><option value="notes">Mis apuntes</option><option value="growth">CENQAL crece</option><option value="reading">Lecturas</option><option value="practice">Práctica en cocina</option><option value="infographic">Infografía</option></select></div></div><div class="field"><label for="cardTitle">Título</label><input id="cardTitle" name="title" maxlength="180" required placeholder="Algo que merece la pena conservar"></div><div class="field"><label for="cardSummary">Explicación o idea</label><textarea id="cardSummary" name="summary" maxlength="5000" placeholder="Resumen, observación o posible conexión…"></textarea></div><div class="field"><label for="cardURL">Enlace a la fuente (opcional)</label><input id="cardURL" name="source_url" type="url" placeholder="https://…"></div><button type="submit" class="btn primary">Guardar propuesta</button><p class="subtle">No se incorpora automáticamente al catálogo científico validado; primero queda como candidata.</p></form></div><div class="panel"><div class="sectionTitle"><h2>Mis ideas guardadas</h2><span class="chip">'+cards.length+'</span></div><div class="field"><label for="librarySearch">Buscar entre mis ideas</label><input id="librarySearch" placeholder="Buscar por título o descripción…" value="'+esc(state.search)+'"></div><div id="savedCards">'+(filtered.length?filtered.map(cardHTML).join(""):'<div class="empty">No hay ideas guardadas con esta búsqueda.</div>')+'</div></div></div>';
}
function draw(){
 if(!state.data){el("labContent").innerHTML='<div class="empty">Abre CENQAL LAB desde tu panel. Si ya estás dentro, actualiza la conexión.</div>';return}
 renderTopicSelect();renderMetrics();
 const actions={lesson:renderLesson,radar:renderRadar,teaching:renderTeaching,notes:renderNotes,growth:renderGrowth,reading:renderReading,practices:renderPractices,gym:renderGym,library:renderLibrary};
 el("labContent").innerHTML=(actions[state.area]||renderLesson)();
 document.querySelectorAll("#labNav button").forEach(b=>{b.classList.toggle("selected",b.dataset.area===state.area);b.setAttribute("aria-pressed",b.dataset.area===state.area?"true":"false")});
}
function svgDownload(){
 const t=topic(),text=(x)=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
 const boxes=t.diagram.map((a,i)=>{const x=30+i*393;return '<rect x="'+x+'" y="98" width="355" height="170" rx="18" fill="#e6f6f4" stroke="#86c5be" stroke-width="2"/><text x="'+(x+177)+'" y="165" text-anchor="middle" font-size="26" font-family="Arial,sans-serif" font-weight="bold" fill="#154956">'+text(a[0])+'</text><text x="'+(x+177)+'" y="211" text-anchor="middle" font-size="18" font-family="Arial,sans-serif" fill="#397180">'+text(a[1])+'</text>'}).join("");
 const arrows='<text x="409" y="192" font-size="44" fill="#14566c">→</text><text x="802" y="192" font-size="44" fill="#14566c">→</text>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="340" viewBox="0 0 1200 340"><rect width="1200" height="340" fill="#fff"/><text x="30" y="50" font-size="27" font-family="Arial,sans-serif" font-weight="bold" fill="#163951">CENQAL LAB · Tema '+t.id+'</text>'+boxes+arrows+'<text x="30" y="320" font-family="Arial,sans-serif" font-size="13" fill="#5c7280">Esquema conceptual para docencia · Revisar junto al contenido del tema</text></svg>';
 const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));const a=document.createElement("a");a.href=url;a.download="CENQAL_LAB_Tema_"+t.id+"_esquema.svg";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function saveIdea(section,title,summary,extra={}){
 try{
  const r=await api("save_card",{topic:extra.topic||state.topic,section,title,summary,source_url:extra.source_url||null});
  state.data.cards.unshift(r.card);notify("Idea guardada en tu biblioteca docente.");renderMetrics();if(state.area==="library")draw();
 }catch(e){notify(e.message,true)}
}
async function startGym(){
 if(state.busy)return;state.busy=true;try{
  const r=await api("gym_start",{topic:state.topic});if(!r.questions?.length)throw Error("Todavía no hay preguntas para este tema.");
  state.gym={topic:state.topic,questions:r.questions,index:0,answer:null,selected:null,correct:0};draw();
 }catch(e){notify(e.message,true)}finally{state.busy=false}
}
async function answerGym(selected){
 const g=state.gym;if(!g||g.answer||state.busy)return;state.busy=true;
 const q=g.questions[g.index];g.selected=selected;document.querySelectorAll("[data-answer]").forEach(x=>x.disabled=true);
 try{
  const r=await api("gym_answer",{topic:g.topic,question_id:q.id,selected});
  g.answer=r;if(r.correct)g.correct++;
  const p=state.data.progress[g.topic]||(state.data.progress[g.topic]={total:0,correct:0});p.total++;if(r.correct)p.correct++;
  draw();
 }catch(e){g.selected=null;notify(e.message,true);draw()}finally{state.busy=false}
}
async function load(){
 try{el("connection").textContent="Verificando acceso CENQAL…";const d=await api("overview");if(!d?.ok)throw Error("No se pudo verificar el acceso.");state.data=d;
  el("connection").textContent="Conectado a CENQAL · curso "+d.course_id;draw();
 }catch(e){el("connection").textContent="Sin conexión";el("labContent").innerHTML='<div class="empty">'+esc(e.message)+'</div>';}
}
document.querySelector("#labNav").addEventListener("click",e=>{
 const b=e.target.closest("button[data-area]");if(!b)return;state.area=b.dataset.area;state.gym=null;draw();el("labContent").focus({preventScroll:true});
});
el("topicSelect").addEventListener("change",e=>{state.topic=Number(e.target.value)||1;state.gym=null;state.practiceAll=false;draw()});
el("labContent").addEventListener("click",async e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.switch){state.area=b.dataset.switch;draw();return}
 if(b.id==="downloadInfographic"){svgDownload();return}
 if(b.id==="togglePractices"){state.practiceAll=!state.practiceAll;draw();return}
 if(b.dataset.savePrompt){await saveIdea(b.dataset.savePrompt,b.dataset.promptTitle,b.dataset.promptSummary);return}
 if(b.id==="gymStart"||b.id==="gymAgain"){await startGym();return}
 if(b.id==="gymNext"){const g=state.gym;if(!g)return;g.index++;g.selected=null;g.answer=null;draw();return}
 if(b.id==="gymStop"){state.gym=null;draw();return}
 if(b.dataset.answer){await answerGym(b.dataset.answer);return}
 if(b.dataset.cardId){if(state.busy)return;state.busy=true;try{
  const r=await api("card_status",{id:b.dataset.cardId,state:b.dataset.cardState});
  state.data.cards=state.data.cards.map(c=>c.id===r.card.id?r.card:c);notify("Estado de la propuesta actualizado.");draw();
 }catch(err){notify(err.message,true)}finally{state.busy=false}}
});
el("labContent").addEventListener("submit",async e=>{
 if(e.target.id!=="newLabCard")return;e.preventDefault();
 const form=e.target,data=new FormData(form);
 await saveIdea(String(data.get("section")),String(data.get("title")||"").trim(),String(data.get("summary")||"").trim(),{topic:Number(data.get("topic")),source_url:String(data.get("source_url")||"")});
});
el("labContent").addEventListener("input",e=>{
 if(e.target.id!=="librarySearch")return;
 state.search=e.target.value;const filtered=(state.data?.cards||[]).filter(c=>(String(c.title||"")+" "+String(c.summary||"")).toLowerCase().includes(state.search.toLowerCase()));
 const node=el("savedCards");if(node)node.innerHTML=filtered.length?filtered.map(cardHTML).join(""):'<div class="empty">No se han encontrado ideas.</div>';
});
if(window.parent===window){el("connection").textContent="Acceso desde el panel";el("labContent").innerHTML='<div class="empty">Abre la pestaña CENQAL LAB desde CENQAL Control. No se envían tokens por la URL.</div>'}
else {window.parent.postMessage({type:"CENQAL_LAB_READY"},location.origin);load();}
})();