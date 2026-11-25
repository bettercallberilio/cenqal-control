/* CENQAL LAB – acceso independiente con cuenta docente, sin tokens en URL ni localStorage. */
(() => {
  "use strict";
  const URL="https://aibtvkjlmpezjsujlkvn.supabase.co";
  const KEY="sb_publishable_UsEwh-LJbvhXFcX1snjLWw_YlnH9A6T";
  let client=null, token=null, tokenCreated=0, processing=false;

  function getClient(){
    if(!window.supabase)throw Error("No se pudo cargar el servicio de autenticación.");
    if(!client) client=window.supabase.createClient(URL,KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
            storageKey:"cenqal-control-auth-v1"}
    });
    return client;
  }
  function setStatus(s,error=false){
    const n=document.getElementById("labAuthMessage");
    if(n){n.textContent=s||"";n.style.color=error?"#a23d39":"#4c6675";}
  }
  function showLogin(reason=""){
    document.getElementById("labAuthGate")?.removeAttribute("hidden");
    document.getElementById("labApp")?.setAttribute("hidden","");
    document.getElementById("labSignOut")?.setAttribute("hidden","");
    token=null;tokenCreated=0;
    if(reason)setStatus(reason,true);
  }
  function showApp(){
    document.getElementById("labAuthGate")?.setAttribute("hidden","");
    document.getElementById("labApp")?.removeAttribute("hidden");
    document.getElementById("labSignOut")?.removeAttribute("hidden");
    window.dispatchEvent(new Event("cenqal-lab-session"));
  }
  async function getToken(force=false){
    if(!force&&token&&Date.now()-tokenCreated<18*60*1000)return token;
    const {data:{session},error}=await getClient().auth.getSession();
    if(error||!session?.access_token){showLogin("Tu sesión ha caducado. Inicia sesión de nuevo.");throw Error("Inicio de sesión necesario.");}
    const r=await fetch(URL+"/rest/v1/rpc/cenqal_control_issue_auth_token",{
      method:"POST",headers:{"apikey":KEY,"Authorization":"Bearer "+session.access_token,"Content-Type":"application/json"},
      body:"{}",cache:"no-store",referrerPolicy:"no-referrer"
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data?.ok||typeof data.token!=="string"){
      const msg=data?.error==="not_authorized"?"Esta cuenta no está autorizada como docente.":"No se pudo verificar el acceso docente.";
      showLogin(msg);throw Error(msg);
    }
    token=data.token;tokenCreated=Date.now();return token;
  }
  async function request(action,payload={}){
    if(!["overview","gym_start","gym_answer","save_card","card_status","improvement_add","improvement_revision"].includes(action))throw Error("Acción no autorizada.");
    const input=payload&&typeof payload==="object"&&!Array.isArray(payload)?payload:{};
    if(Object.keys(input).length>12)throw Error("Solicitud demasiado grande.");
    for(let attempt=0;attempt<2;attempt++){
      const t=await getToken(attempt===1);
      const r=await fetch(URL+"/functions/v1/cenqal-lab",{
        method:"POST",headers:{"apikey":KEY,"Content-Type":"application/json"},
        body:JSON.stringify({...input,p_token:t,action}),cache:"no-store",referrerPolicy:"no-referrer"
      });
      const data=await r.json().catch(()=>({}));
      if(r.status===401&&attempt===0){token=null;continue}
      if(!r.ok||!data?.ok){
        if(r.status===401||r.status===403){showLogin("No se ha podido verificar tu sesión docente.");}
        throw Error(data?.error||"No se pudo completar la consulta.");
      }
      return data;
    }
    throw Error("Tu sesión ha caducado.");
  }
  async function signIn(e){
    e?.preventDefault();if(processing)return;
    processing=true;
    const btn=document.getElementById("labLoginButton");
    if(btn)btn.disabled=true;
    setStatus("Verificando cuenta docente…");
    try{
      const email=document.getElementById("labEmail")?.value.trim()||"";
      const password=document.getElementById("labPassword")?.value||"";
      if(!email||!password)throw Error("Introduce correo y contraseña.");
      const {error}=await getClient().auth.signInWithPassword({email,password});
      if(error)throw Error("No se pudo iniciar sesión. Revisa tus credenciales.");
      await getToken(true);
      document.getElementById("labPassword").value="";
      showApp();
    }catch(err){setStatus(err.message||"Error de acceso.",true)}
    finally{processing=false;if(btn)btn.disabled=false}
  }
  async function signOut(){
    try{await getClient().auth.signOut()}catch{}
    showLogin("Sesión cerrada.");
  }
  async function init(){
    document.getElementById("labLoginForm")?.addEventListener("submit",signIn);
    document.getElementById("labSignOut")?.addEventListener("click",signOut);
    try{
      const {data:{session}}=await getClient().auth.getSession();
      if(session?.access_token){await getToken(true);showApp()}
      else showLogin();
    }catch(err){showLogin(err.message||"No se pudo comprobar la sesión.")}
  }
  window.CENQAL_LAB_API={request,init};
  // El iframe histórico sigue usando el puente seguro del panel y no necesita un segundo login.
  if(window.parent===window)document.addEventListener("DOMContentLoaded",init);
})();