begin;
DO $tests$
declare c cenqal_survey_private.campaigns; tc uuid; tc2 uuid; sid uuid; raw text; teacher text; d jsonb; receipt text; rejected boolean;
begin
 select * into strict c from cenqal_survey_private.campaigns where code='MID-2026-11-30';
 assert c.opens_at=timestamp '2026-11-30 00:00' at time zone 'Europe/Madrid','Wrong opening';
 assert c.closes_at=timestamp '2026-12-01 00:00' at time zone 'Europe/Madrid','Wrong closing';
 assert has_schema_privilege('anon','cenqal_survey_private','USAGE')=false,'Private schema exposed';
 d:=public.cenqal_survey_context_v1(c.code,'');
 assert (d->>'authorized')::boolean=false and d->'submitted_at'='null'::jsonb,'Public identity leak';
 select e.student_id into strict sid from public.cenqal_course_enrollments e join public.cenqal_students s on s.id=e.student_id and s.active where e.course_id=c.course_id and e.active order by e.id limit 1;
 insert into cenqal_survey_private.campaigns(code,course_id,title,phase,instrument_version,definition,opens_at,closes_at,enabled)
 values('ROLLBACK-TEST',c.course_id,'Test','MID',c.instrument_version,c.definition,now()-interval '1 day',now()+interval '1 day',true) returning id into tc;
 raw:=encode(extensions.gen_random_bytes(32),'hex');
 insert into cenqal_survey_private.access_tokens values(encode(extensions.digest(raw,'sha256'),'hex'),tc,sid,now()+interval '2 days',now());
 d:=public.cenqal_survey_context_v1('ROLLBACK-TEST',raw);assert (d->>'authorized')::boolean and d->>'state'='open','Student context failed';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST','invalid','{}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Bad token accepted';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{"LEARN01":"6"}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Out-of-range accepted';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{"UNKNOWN":"1"}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Unknown item accepted';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{}',false,false,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Unconfirmed submission accepted';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{}',false,true,'WRONG');exception when others then rejected:=true;end;assert rejected,'Wrong version accepted';
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{"EMO01":["Agobio","Prefiero no responder"]}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Conflicting nonresponse accepted';
 d:=public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{"LEARN01":"NA","OPEN01":"Comentario de prueba"}',false,true,c.instrument_version);receipt:=d->>'receipt';assert receipt is not null,'No receipt';
 d:=public.cenqal_survey_submit_v1('ROLLBACK-TEST',raw,'{"LEARN01":"5"}',true,true,c.instrument_version);assert d->>'receipt'=receipt and (d->>'already_submitted')::boolean,'Duplicate receipt changed';
 assert (select answers->>'LEARN01'='NA' and research_consent=false from cenqal_survey_private.responses where id=receipt::uuid),'Retry changed answers or consent';
 teacher:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.cenqal_control_sessions(token_hash,telegram_user_id,expires_at,course_id) values(encode(extensions.digest(teacher,'sha256'),'hex'),-987654321,now()+interval '10 minutes',c.course_id);
 d:=public.cenqal_control_survey_report_v1(teacher,true);assert not exists(select 1 from jsonb_array_elements(d->'responses') r where r->>'campaign_code'='ROLLBACK-TEST'),'Research included nonconsenting responses';
 update cenqal_survey_private.responses set research_consent=true where id=receipt::uuid;
 d:=public.cenqal_control_survey_report_v1(teacher,true);
 assert exists(select 1 from jsonb_array_elements(d->'responses') r where r->>'campaign_code'='ROLLBACK-TEST' and r->>'student_code' like 'R-%' and not(r->'answers' ? 'OPEN01')),'Research export not pseudonymized or text leaked';
 perform public.cenqal_survey_withdraw_v1('ROLLBACK-TEST',raw);
 assert (select not research_consent and research_withdrawn_at is not null from cenqal_survey_private.responses where id=receipt::uuid),'Withdrawal failed';
 insert into cenqal_survey_private.campaigns(code,course_id,title,phase,instrument_version,definition,opens_at,closes_at,enabled)
 values('ROLLBACK-TEST-2',c.course_id,'Test','MID',c.instrument_version,c.definition,now()+interval '1 day',now()+interval '2 days',true) returning id into tc2;
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST-2',raw,'{}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Token crossed campaigns';
 update cenqal_survey_private.access_tokens set campaign_id=tc2 where campaign_id=tc;
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST-2',raw,'{}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Early submission accepted';
 update cenqal_survey_private.campaigns set opens_at=now()-interval '2 days',closes_at=now()-interval '1 second' where id=tc2;
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST-2',raw,'{}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Late submission accepted';
 update cenqal_survey_private.campaigns set closes_at=now()+interval '1 day',enabled=false where id=tc2;
 rejected:=false;begin perform public.cenqal_survey_submit_v1('ROLLBACK-TEST-2',raw,'{}',false,true,c.instrument_version);exception when others then rejected:=true;end;assert rejected,'Disabled campaign accepted';
 rejected:=false;begin perform public.cenqal_control_survey_report_v1('invalid',false);exception when others then rejected:=true;end;assert rejected,'Teacher report exposed';
end $tests$;
rollback;
select 'Passed: authorization, course/campaign isolation, date limits, validation, idempotency, consent, withdrawal and research export; all test rows rolled back.' as result;
