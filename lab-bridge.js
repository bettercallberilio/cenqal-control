/* CENQAL LAB: puente de mínima exposición. El iframe nunca recibe el token docente. */
const CENQAL_LAB_BRIDGE=(()=>{
  const allowed=new Set(["overview","gym_start","gym_answer","save_card","card_status"]);
  let loaded=false;
  function frame(){return document.getElementById("labFrame")}
  function open(){
    const f=frame();if(!f)return;
    if(!loaded){loaded=true;f.src="./lab.html?v=20261125-1"}
  }
  function reset(){
    const f=frame();loaded=false;if(f)f.src="about:blank";
  }
  window.addEventListener("message",async event=>{
    const f=frame();if(!f||event.source!==f.contentWindow||event.origin!==location.origin)return;
    const m=event.data||{};
    if(m.type==="CENQAL_LAB_READY"){
      // No credentials are ever posted into the microapplication.
      return;
    }
    if(m.type!=="CENQAL_LAB_REQUEST")return;
    if(!Number.isSafeInteger(m.id)||m.id<1||m.id>100000000)return;
    const respond=(ok,data,error)=>{if(event.source===f.contentWindow)f.contentWindow.postMessage({type:"CENQAL_LAB_RESPONSE",id:m.id,ok,data,error},location.origin)};
    if(!TOKEN||!allowed.has(m.action)){respond(false,null,"Sesión o acción no autorizada.");return}
    try{
      const payload=m.payload&&typeof m.payload==="object"&&!Array.isArray(m.payload)?m.payload:{};
      if(Object.keys(payload).length>12)throw Error("Solicitud demasiado extensa.");
      const content={...payload,p_token:TOKEN,action:m.action};
      // Only the stable, known CENQAL Supabase project is contacted.
      const result=await fetch(PUBLIC_SUPABASE_URL+"/functions/v1/cenqal-lab",{
        method:"POST",headers:{"apikey":PUBLIC_SUPABASE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify(content),cache:"no-store",referrerPolicy:"no-referrer"
      });
      const d=await result.json();
      if(!result.ok||!d.ok)throw Error(result.status===401||result.status===403?"Vuelve a iniciar sesión en CENQAL Control.":d.error||"No se pudo completar la solicitud.");
      respond(true,d,null);
    }catch(e){respond(false,null,e.message||"Error de conexión")}
  });
  return {open,reset};
})();