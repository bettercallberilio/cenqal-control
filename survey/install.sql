-- Additive module. Does not alter Bot.py, grades, PP/Og, PRE or existing RPCs.
create schema if not exists cenqal_survey_private;
revoke all on schema cenqal_survey_private from public,anon,authenticated;

create table cenqal_survey_private.campaigns (
 id uuid primary key default gen_random_uuid(), code text unique not null,
 course_id bigint not null references public.cenqal_course_settings(id),
 title text not null, phase text not null check(phase in ('MID','FINAL')),
 instrument_version text not null, definition jsonb not null check(jsonb_typeof(definition)='array'),
 opens_at timestamptz not null, closes_at timestamptz not null,
 enabled boolean not null default false, require_submission boolean not null default true,
 challenge_id bigint, created_at timestamptz not null default now(),
 check(closes_at>opens_at)
);
create table cenqal_survey_private.responses (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references cenqal_survey_private.campaigns(id),
 student_id uuid not null references public.cenqal_students(id),
 answers jsonb not null check(jsonb_typeof(answers)='object'),
 research_consent boolean not null, consent_version text not null,
 research_withdrawn_at timestamptz,
 submitted_at timestamptz not null default now(),
 unique(campaign_id,student_id)
);
create table cenqal_survey_private.access_tokens (
 token_hash text primary key,
 campaign_id uuid not null references cenqal_survey_private.campaigns(id),
 student_id uuid not null references public.cenqal_students(id),
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
alter table cenqal_survey_private.campaigns enable row level security;
alter table cenqal_survey_private.responses enable row level security;
alter table cenqal_survey_private.access_tokens enable row level security;
revoke all on all tables in schema cenqal_survey_private from public,anon,authenticated;

-- Legacy CENQAL uses scoped bearer tokens rather than student Supabase Auth.
-- Helper is private and may only be called by the narrowly scoped RPC wrappers.
create function cenqal_survey_private.student(p_campaign uuid,p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare c cenqal_survey_private.campaigns; sid uuid; h text;
begin
 if p_token is null or length(p_token)<32 or length(p_token)>1024 then return null; end if;
 select * into c from cenqal_survey_private.campaigns where id=p_campaign;
 h:=encode(extensions.digest(p_token,'sha256'),'hex');
 select t.student_id into sid from public.cenqal_gym_access_tokens_v72 t
 join public.cenqal_students s on s.id=t.student_id and s.telegram_user_id=t.telegram_user_id and s.active
 join public.cenqal_course_enrollments e on e.student_id=s.id and e.course_id=c.course_id and e.active
 where t.token_hash=h and t.course_id=c.course_id and t.revoked_at is null and t.expires_at>now() limit 1;
 if sid is null then
  select t.student_id into sid from cenqal_survey_private.access_tokens t
  join public.cenqal_students s on s.id=t.student_id and s.active
  join public.cenqal_course_enrollments e on e.student_id=s.id and e.course_id=c.course_id and e.active
  where t.token_hash=h and t.campaign_id=c.id and t.expires_at>now() limit 1;
 end if;
 return sid;
end $$;
revoke all on function cenqal_survey_private.student(uuid,text) from public,anon,authenticated;

create function public.cenqal_survey_context_v1(p_campaign text,p_token text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare c cenqal_survey_private.campaigns; sid uuid; r cenqal_survey_private.responses; st text;
begin
 select * into c from cenqal_survey_private.campaigns where code=p_campaign;
 if c.id is null then raise exception 'Cuestionario no disponible'; end if;
 sid:=cenqal_survey_private.student(c.id,p_token);
 select * into r from cenqal_survey_private.responses where campaign_id=c.id and student_id=sid;
 st:=case when not c.enabled then 'disabled' when now()<c.opens_at then 'scheduled' when now()>=c.closes_at then 'closed' else 'open' end;
 return jsonb_build_object('ok',true,'authorized',sid is not null,'state',st,'server_time',now(),
  'submitted_at',r.submitted_at,'research_consent',r.research_consent,
  'campaign',jsonb_build_object('code',c.code,'title',c.title,'phase',c.phase,'instrument_version',c.instrument_version,
    'definition',c.definition,'opens_at',c.opens_at,'closes_at',c.closes_at,'enabled',c.enabled,'require_submission',c.require_submission));
end $$;

create function public.cenqal_survey_submit_v1(p_campaign text,p_token text,p_answers jsonb,p_research boolean,p_ack boolean,p_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c cenqal_survey_private.campaigns; sid uuid; r cenqal_survey_private.responses; item record; q jsonb; v jsonb;
begin
 select * into c from cenqal_survey_private.campaigns where code=p_campaign for share;
 if c.id is null then raise exception 'Cuestionario no disponible'; end if;
 sid:=cenqal_survey_private.student(c.id,p_token);
 if sid is null then raise exception 'Acceso personal no válido o caducado'; end if;
 -- A repeated request returns the original receipt and never changes answers.
 select * into r from cenqal_survey_private.responses where campaign_id=c.id and student_id=sid;
 if r.id is not null then return jsonb_build_object('ok',true,'already_submitted',true,'receipt',r.id,'submitted_at',r.submitted_at); end if;
 if not c.enabled or now()<c.opens_at or now()>=c.closes_at then raise exception 'El cuestionario está fuera de plazo'; end if;
 if p_ack is distinct from true or p_research is null then raise exception 'Confirma la entrega y elige el uso de tus respuestas'; end if;
 if p_version is distinct from c.instrument_version then raise exception 'La versión del cuestionario ha cambiado. Recarga la página'; end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>65536 then raise exception 'Respuestas no válidas'; end if;
 for item in select key,value from jsonb_each(p_answers) loop
  select x into q from jsonb_array_elements(c.definition) x where x->>'id'=item.key;
  if q is null then raise exception 'Pregunta desconocida'; end if;
  if item.value='null'::jsonb then continue; end if;
  if q->>'type'='text' then
   if jsonb_typeof(item.value)<>'string' or length(item.value#>>'{}')>3000 then raise exception 'Texto no válido'; end if;
  elsif q->>'type'='multi' then
   if jsonb_typeof(item.value)<>'array' then raise exception 'Selección múltiple no válida'; end if;
   if jsonb_array_length(item.value)>(select count(*) from jsonb_array_elements(q->'options')) then raise exception 'Selección múltiple excesiva'; end if;
   if (select count(*)<>count(distinct x) from jsonb_array_elements(item.value) x) then raise exception 'Opciones repetidas'; end if;
   for v in select value from jsonb_array_elements(item.value) loop
    if jsonb_typeof(v)<>'string' or not exists(select 1 from jsonb_array_elements(q->'options') o where o->>'value'=v#>>'{}') then raise exception 'Opción no válida'; end if;
   end loop;
   if item.value ? 'Prefiero no responder' and jsonb_array_length(item.value)>1 then raise exception 'Si prefieres no responder, no marques otras emociones'; end if;
  elsif jsonb_typeof(item.value) not in ('string','number') or not exists(select 1 from jsonb_array_elements(q->'options') o where o->>'value'=item.value#>>'{}') then
   raise exception 'Respuesta fuera de escala';
  end if;
 end loop;
 insert into cenqal_survey_private.responses(campaign_id,student_id,answers,research_consent,consent_version)
 values(c.id,sid,p_answers,p_research,'CENQAL-SURVEY-CONSENT-1') on conflict(campaign_id,student_id) do nothing;
 select * into r from cenqal_survey_private.responses where campaign_id=c.id and student_id=sid;
 return jsonb_build_object('ok',true,'receipt',r.id,'submitted_at',r.submitted_at);
end $$;

create function public.cenqal_survey_withdraw_v1(p_campaign text,p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; sid uuid;
begin
 select id into cid from cenqal_survey_private.campaigns where code=p_campaign;
 sid:=cenqal_survey_private.student(cid,p_token);
 if sid is null then raise exception 'Acceso no válido'; end if;
 update cenqal_survey_private.responses set research_consent=false,research_withdrawn_at=now() where campaign_id=cid and student_id=sid;
 return jsonb_build_object('ok',true);
end $$;

create function public.cenqal_control_survey_report_v1(p_token text,p_research_only boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid bigint; campaigns jsonb; responses jsonb; completion jsonb;
begin
 if public.cenqal_control_uid(p_token) is null then raise exception 'Sesión docente no autorizada'; end if;
 cid:=public.cenqal_control_course_id(p_token);
 select coalesce(jsonb_agg(to_jsonb(c) order by c.opens_at),'[]') into campaigns from cenqal_survey_private.campaigns c where c.course_id=cid;
 select coalesce(jsonb_agg(jsonb_build_object(
  'campaign_code',c.code,'phase',c.phase,'instrument_version',c.instrument_version,
  'student_code',case when p_research_only then 'R-'||left(encode(extensions.digest(cid::text||':'||s.id::text,'sha256'),'hex'),12) else s.student_code end,
  'submitted_at',case when p_research_only then to_char(r.submitted_at at time zone 'Europe/Madrid','YYYY-MM-DD') else r.submitted_at::text end,
  'research_consent',r.research_consent,
  'answers',case when p_research_only then coalesce((select jsonb_object_agg(a.key,a.value) from jsonb_each(r.answers) a where exists(select 1 from jsonb_array_elements(c.definition) q where q->>'id'=a.key and q->>'type'<>'text')),'{}') else r.answers end,
  'pre_submitted_at',case when p_research_only then null else pre.submitted_at end,
  'pre_knowledge_pct',pre.knowledge_pct,'pre_self_regulation',pre.self_regulation,
  'pre_technology',pre.technology,'pre_ai_literacy',pre.ai_literacy
 ) order by c.opens_at,s.student_code),'[]') into responses
 from cenqal_survey_private.responses r join cenqal_survey_private.campaigns c on c.id=r.campaign_id
 join public.cenqal_students s on s.id=r.student_id
 left join lateral(select i.* from public.cenqal_initial_assessments i where i.course_id=cid and i.student_code=s.student_code and i.assessment_phase='PRE' order by i.submitted_at limit 1) pre on true
 where c.course_id=cid and (not p_research_only or r.research_consent);
 if not p_research_only then
  select coalesce(jsonb_agg(jsonb_build_object('campaign_code',c.code,'student_code',s.student_code,'full_name',s.full_name,
   'submitted_at',r.submitted_at,'status',case when r.id is not null then 'entregado' else 'pendiente' end) order by c.opens_at,s.student_code),'[]') into completion
  from cenqal_survey_private.campaigns c
  join public.cenqal_course_enrollments e on e.course_id=c.course_id and e.active
  join public.cenqal_students s on s.id=e.student_id and s.active
  left join cenqal_survey_private.responses r on r.campaign_id=c.id and r.student_id=s.id where c.course_id=cid;
 end if;
 return jsonb_build_object('ok',true,'course_id',cid,'campaigns',campaigns,'responses',responses,'completion',coalesce(completion,'[]'),'research_only',p_research_only,'exported_at',now());
end $$;

create function public.cenqal_control_survey_link_v1(p_token text,p_campaign text,p_student_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c cenqal_survey_private.campaigns; sid uuid; raw text; cid bigint;
begin
 if public.cenqal_control_uid(p_token) is null then raise exception 'Sesión docente no autorizada'; end if;
 cid:=public.cenqal_control_course_id(p_token);
 select * into c from cenqal_survey_private.campaigns where code=p_campaign and course_id=cid;
 if c.id is null or now()>=c.closes_at then raise exception 'Campaña no disponible'; end if;
 select s.id into sid from public.cenqal_students s join public.cenqal_course_enrollments e on e.student_id=s.id and e.course_id=cid and e.active where s.student_code=p_student_code and s.active;
 if sid is null then raise exception 'Alumno no matriculado en este curso'; end if;
 raw:=encode(extensions.gen_random_bytes(32),'hex');
 insert into cenqal_survey_private.access_tokens(token_hash,campaign_id,student_id,expires_at)
 values(encode(extensions.digest(raw,'sha256'),'hex'),c.id,sid,c.closes_at+interval '7 days');
 return jsonb_build_object('ok',true,'token',raw,'campaign_code',c.code);
end $$;

revoke all on function public.cenqal_survey_context_v1(text,text) from public;
revoke all on function public.cenqal_survey_submit_v1(text,text,jsonb,boolean,boolean,text) from public;
revoke all on function public.cenqal_survey_withdraw_v1(text,text) from public;
revoke all on function public.cenqal_control_survey_report_v1(text,boolean) from public;
revoke all on function public.cenqal_control_survey_link_v1(text,text,text) from public;
grant execute on function public.cenqal_survey_context_v1(text,text) to anon,authenticated;
grant execute on function public.cenqal_survey_submit_v1(text,text,jsonb,boolean,boolean,text) to anon,authenticated;
grant execute on function public.cenqal_survey_withdraw_v1(text,text) to anon,authenticated;
grant execute on function public.cenqal_control_survey_report_v1(text,boolean) to anon,authenticated;
grant execute on function public.cenqal_control_survey_link_v1(text,text,text) to anon,authenticated;

DO $seed$
declare cid bigint; ch bigint; definition jsonb;
begin
 select c.id into strict cid from public.cenqal_course_settings c
 where c.active and c.archived_at is null and c.academic_year='2026-2027' and c.group_name='2627-T1' and c.subject='Química de los Alimentos';
 select w.id into strict ch from public.cenqal_weekly_challenges_v641 w where w.course_id=cid and w.week_start=date '2026-11-30' and w.status='scheduled';
 definition := $instrument$[
  {
    "id": "USE01",
    "label": "¿Con qué frecuencia has utilizado Berilio/CENQAL durante el último mes?",
    "group": "1 · Participación",
    "type": "single",
    "options": [
      {
        "value": "0",
        "label": "No lo he usado"
      },
      {
        "value": "1",
        "label": "Menos de una vez por semana"
      },
      {
        "value": "2",
        "label": "1–2 días por semana"
      },
      {
        "value": "3",
        "label": "3–4 días por semana"
      },
      {
        "value": "4",
        "label": "5 o más días por semana"
      },
      {
        "value": "NA",
        "label": "Prefiero no responder"
      }
    ]
  },
  {
    "id": "EASE01",
    "label": "Comparado con clases centradas en explicaciones y apuntes, aprender con esta metodología me resulta…",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "-2",
        "label": "Mucho más difícil"
      },
      {
        "value": "-1",
        "label": "Algo más difícil"
      },
      {
        "value": "0",
        "label": "Igual"
      },
      {
        "value": "1",
        "label": "Algo más fácil"
      },
      {
        "value": "2",
        "label": "Mucho más fácil"
      },
      {
        "value": "NA",
        "label": "No puedo comparar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LEARN01",
    "label": "Comprendo mejor los conceptos.",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LEARN02",
    "label": "Recuerdo lo aprendido días después.",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LEARN03",
    "label": "Puedo aplicar la química a situaciones alimentarias.",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LEARN04",
    "label": "Identifico mejor mis dudas.",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LEARN05",
    "label": "Estudio de forma más constante.",
    "group": "2 · Aprendizaje percibido",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "TECH01",
    "label": "Me ha interesado usar estas tecnologías en la asignatura.",
    "group": "3 · Tecnología e inteligencia artificial",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "TECH02",
    "label": "Me resulta sencillo utilizar las herramientas.",
    "group": "3 · Tecnología e inteligencia artificial",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "TECH03",
    "label": "Las respuestas y orientaciones de Berilio me ayudan a razonar.",
    "group": "3 · Tecnología e inteligencia artificial",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "TECH04",
    "label": "He aprendido a contrastar las respuestas de la IA con fuentes fiables.",
    "group": "3 · Tecnología e inteligencia artificial",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "TECH05",
    "label": "Sé cuándo necesito ayuda de la profesora.",
    "group": "3 · Tecnología e inteligencia artificial",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL01",
    "label": "¿Qué utilidad ha tenido para aprender? Retos y misiones",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL02",
    "label": "¿Qué utilidad ha tenido para aprender? Preguntas de práctica y repaso",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL03",
    "label": "¿Qué utilidad ha tenido para aprender? Tutor Berilio",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL04",
    "label": "¿Qué utilidad ha tenido para aprender? Búsqueda y aportación de artículos a CENQAL",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL05",
    "label": "¿Qué utilidad ha tenido para aprender? Puntos PP y Oganesones",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL06",
    "label": "¿Qué utilidad ha tenido para aprender? Ranking y niveles",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "UTIL07",
    "label": "¿Qué utilidad ha tenido para aprender? Actividades participativas en clase",
    "group": "4 · Utilidad de cada elemento",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nada útil"
      },
      {
        "value": "2",
        "label": "Poco útil"
      },
      {
        "value": "3",
        "label": "Algo útil"
      },
      {
        "value": "4",
        "label": "Bastante útil"
      },
      {
        "value": "5",
        "label": "Muy útil"
      },
      {
        "value": "NA",
        "label": "No lo he utilizado / Prefiero no responder"
      }
    ]
  },
  {
    "id": "EMO01",
    "label": "¿Cómo te has sentido? Puedes marcar emociones diferentes. Si eliges «prefiero no responder», deja el resto sin marcar.",
    "group": "5 · Bienestar",
    "type": "multi",
    "options": [
      {
        "value": "Interés",
        "label": "Interés"
      },
      {
        "value": "Motivación",
        "label": "Motivación"
      },
      {
        "value": "Confianza",
        "label": "Confianza"
      },
      {
        "value": "Apoyo",
        "label": "Apoyo"
      },
      {
        "value": "Indiferencia",
        "label": "Indiferencia"
      },
      {
        "value": "Confusión",
        "label": "Confusión"
      },
      {
        "value": "Frustración",
        "label": "Frustración"
      },
      {
        "value": "Agobio",
        "label": "Agobio"
      },
      {
        "value": "Vergüenza o miedo a equivocarme",
        "label": "Vergüenza o miedo a equivocarme"
      },
      {
        "value": "Prefiero no responder",
        "label": "Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST01",
    "label": "¿Con qué frecuencia has vivido esta situación? Presión por puntos o ranking",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST02",
    "label": "¿Con qué frecuencia has vivido esta situación? Miedo a equivocarme delante de compañeros",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST03",
    "label": "¿Con qué frecuencia has vivido esta situación? Sobrecarga de tareas o avisos",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST04",
    "label": "¿Con qué frecuencia has vivido esta situación? Frustración por fallos técnicos",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST05",
    "label": "¿Con qué frecuencia has vivido esta situación? Inseguridad por respuestas de IA",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "DIST06",
    "label": "¿Con qué frecuencia has vivido esta situación? Dificultades de acceso o uso que me han hecho sentir en desventaja",
    "group": "5 · Bienestar",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Nunca"
      },
      {
        "value": "2",
        "label": "Rara vez"
      },
      {
        "value": "3",
        "label": "A veces"
      },
      {
        "value": "4",
        "label": "A menudo"
      },
      {
        "value": "5",
        "label": "Muy a menudo"
      },
      {
        "value": "NA",
        "label": "No se aplica / Prefiero no responder"
      }
    ]
  },
  {
    "id": "LOAD01",
    "label": "La carga de trabajo respecto a lo que aprendo me parece…",
    "group": "6 · Organización y apoyo",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Muy baja"
      },
      {
        "value": "2",
        "label": "Algo baja"
      },
      {
        "value": "3",
        "label": "Adecuada"
      },
      {
        "value": "4",
        "label": "Algo alta"
      },
      {
        "value": "5",
        "label": "Excesiva"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "ORG01",
    "label": "Entiendo qué debo hacer en cada actividad.",
    "group": "6 · Organización y apoyo",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "ORG02",
    "label": "Entiendo cómo se evalúa mi trabajo.",
    "group": "6 · Organización y apoyo",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "ORG03",
    "label": "Los puntos y recompensas se aplican de manera clara.",
    "group": "6 · Organización y apoyo",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "ORG04",
    "label": "Puedo pedir ayuda sin sentirme juzgado/a.",
    "group": "6 · Organización y apoyo",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "AR01",
    "label": "Soy capaz de reconocer cuándo he entendido realmente un concepto y cuándo simplemente lo he memorizado.",
    "group": "7 · Cómo aprendo actualmente",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ],
    "pre_reference": "Pregunta inicial 17; comprobar equivalencia de codificación antes de calcular ganancias"
  },
  {
    "id": "AR02",
    "label": "Cuando no comprendo algo, pruebo diferentes maneras de resolver la duda.",
    "group": "7 · Cómo aprendo actualmente",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ],
    "pre_reference": "Pregunta inicial 18; comprobar equivalencia de codificación antes de calcular ganancias"
  },
  {
    "id": "AR03",
    "label": "Soy capaz de organizar mi trabajo sin que el profesor me diga exactamente qué hacer en cada momento.",
    "group": "7 · Cómo aprendo actualmente",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ],
    "pre_reference": "Pregunta inicial 19; comprobar equivalencia de codificación antes de calcular ganancias"
  },
  {
    "id": "AR04",
    "label": "Me resulta útil comprobar con frecuencia cuánto estoy aprendiendo.",
    "group": "7 · Cómo aprendo actualmente",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ],
    "pre_reference": "Pregunta inicial 20; comprobar equivalencia de codificación antes de calcular ganancias"
  },
  {
    "id": "AR05",
    "label": "Tiendo a dejar gran parte del estudio para los días anteriores al examen.",
    "group": "7 · Cómo aprendo actualmente",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "1 · Totalmente en desacuerdo"
      },
      {
        "value": "2",
        "label": "2 · En desacuerdo"
      },
      {
        "value": "3",
        "label": "3 · Ni de acuerdo ni en desacuerdo"
      },
      {
        "value": "4",
        "label": "4 · De acuerdo"
      },
      {
        "value": "5",
        "label": "5 · Totalmente de acuerdo"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ],
    "pre_reference": "Pregunta inicial 21; comprobar equivalencia de codificación antes de calcular ganancias"
  },
  {
    "id": "OPEN01",
    "label": "Si has vivido alguna situación de malestar, ¿qué ocurrió y qué cambio te habría ayudado? No incluyas nombres ni datos personales. Respuesta opcional.",
    "group": "8 · Propuestas de mejora",
    "type": "text"
  },
  {
    "id": "OPEN02",
    "label": "¿Qué mantendrías porque te ha ayudado especialmente a aprender? Aporta un ejemplo si puedes. No incluyas nombres ni datos personales. Respuesta opcional.",
    "group": "8 · Propuestas de mejora",
    "type": "text"
  },
  {
    "id": "OPEN03",
    "label": "¿Qué quitarías o reducirías y por qué? No incluyas nombres ni datos personales. Respuesta opcional.",
    "group": "8 · Propuestas de mejora",
    "type": "text"
  },
  {
    "id": "OPEN04",
    "label": "¿Qué añadirías o cambiarías para aprender mejor y sentirte más a gusto? Puedes proponer alternativas sin tecnología. No incluyas nombres ni datos personales. Respuesta opcional.",
    "group": "8 · Propuestas de mejora",
    "type": "text"
  },
  {
    "id": "OPEN05",
    "label": "Si quieres expresar otra emoción o experiencia, puedes hacerlo aquí. No incluyas nombres ni datos personales. Respuesta opcional.",
    "group": "8 · Propuestas de mejora",
    "type": "text"
  },
  {
    "id": "SAT01",
    "label": "¿Cuál es tu satisfacción global con la experiencia?",
    "group": "9 · Valoración global",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Muy insatisfecho/a"
      },
      {
        "value": "2",
        "label": "Insatisfecho/a"
      },
      {
        "value": "3",
        "label": "Ni satisfecho/a ni insatisfecho/a"
      },
      {
        "value": "4",
        "label": "Satisfecho/a"
      },
      {
        "value": "5",
        "label": "Muy satisfecho/a"
      },
      {
        "value": "NA",
        "label": "No puedo valorar / Prefiero no responder"
      }
    ]
  },
  {
    "id": "NEXT01",
    "label": "Para próximas ediciones, preferiría…",
    "group": "9 · Valoración global",
    "type": "single",
    "options": [
      {
        "value": "1",
        "label": "Mantenerla tal como está"
      },
      {
        "value": "2",
        "label": "Mantenerla con pequeños cambios"
      },
      {
        "value": "3",
        "label": "Mantenerla con cambios importantes"
      },
      {
        "value": "4",
        "label": "Sustituirla por otra metodología"
      },
      {
        "value": "5",
        "label": "No tengo una preferencia clara"
      },
      {
        "value": "NA",
        "label": "Prefiero no responder"
      }
    ]
  }
]
$instrument$::jsonb;
 insert into cenqal_survey_private.campaigns(code,course_id,title,phase,instrument_version,definition,opens_at,closes_at,enabled,challenge_id)
 values('MID-2026-11-30',cid,'Evaluación intermedia de la experiencia CENQAL–Berilio','MID','CENQAL-SURVEY-1',definition,
 timestamp '2026-11-30 00:00' at time zone 'Europe/Madrid',timestamp '2026-12-01 00:00' at time zone 'Europe/Madrid',true,ch);
end $seed$;
notify pgrst, 'reload schema';
