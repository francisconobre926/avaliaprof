#!/usr/bin/env bash
# QR Code (sessões e código do docente), área do docente, painel de administração e sincronização offline.
# Uso: API=localhost:3102 DBCMD='docker exec -i avaliaprof-postgres-1 psql -U avaliaprof -d avaliaprof -c' bash test/smoke-phase6.sh
source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluation_sessions WHERE \"teacherId\" IN (SELECT \"id\" FROM teachers WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'p6%@teste.com')); DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'p6%@teste.com'); UPDATE teachers SET \"userId\"=NULL WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'p6%@teste.com'); DELETE FROM users WHERE email LIKE 'p6%@teste.com'; DELETE FROM evaluation_periods WHERE id NOT IN (SELECT \"periodId\" FROM evaluations) AND \"opensAt\" < '2000-01-01'" >/dev/null 2>&1
}
limpar; limpar_docentes; trap 'limpar; limpar_docentes' EXIT
TA=$(admin_token); HA=$(auth $TA)
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
TURMA=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
TURMA2=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==2 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
mk() { # n -> token de estudante de Eng. Informática (1.º ano, turma A)
  local num="T${S:0:6}p$1" em="p6$S$1@teste.com"
  curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste$1\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$INF\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$TURMA\"}" $U/admin/students
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register | jq_ "d['token']"
}
T1=$(mk 1); H1=$(auth $T1); T2=$(mk 2); H2=$(auth $T2); T3=$(mk 3); H3=$(auth $T3)

# docente criado para o teste (sem conta nem avaliações), a leccionar uma cadeira dos estudantes
STR=$(curl -s -H "$HA" $U/admin/structure)
ME1=$(curl -s -H "$H1" $U/me/subjects)
CS=$(echo "$ME1" | jq_ "d['items'][0]['courseSubjectId']")
SUBJ=$(echo "$ME1" | jq_ "d['items'][0]['subjectId']")
TID=$(mkteacher "Docente Teste p6$S" "$SUBJ")
[ -n "$TID" ] || { echo "FALHA não foi possível criar o docente de teste"; exit 1; }
OTHERCS=$(echo "$ME1" | jq_ "d['items'][1]['courseSubjectId']")

echo "-- convite e activação do docente"
ok "estudante não convida docentes => 403" "$(code -H "$H1" $J -d '{"email":"x@y.com"}' $U/admin/teachers/$TID/invite)" 403
INV=$(curl -s -H "$HA" $J -d "{\"email\":\"p6${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite)
CODE=$(echo "$INV" | jq_ "d['code']")
ok "convite devolve um código de 8 caracteres" "$(echo -n "$CODE" | wc -c | tr -d ' ')" 8
ok "login antes de activar => 401" "$(code $J -d "{\"email\":\"p6${S}doc@teste.com\",\"password\":\"senha1234\"}" $U/auth/login)" 401
ok "código errado => 400" "$(code $J -d "{\"email\":\"p6${S}doc@teste.com\",\"code\":\"AAAAAAAA\",\"password\":\"senha1234\"}" $U/auth/activate-teacher)" 400
ACT=$(curl -s $J -d "{\"email\":\"p6${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"senha1234\"}" $U/auth/activate-teacher)
HT=$(auth $(echo "$ACT" | jq_ "d['token']"))
ok "activação devolve papel TEACHER" "$(echo "$ACT" | jq_ "d['user']['role']")" TEACHER
ok "o código só serve uma vez => 400" "$(code $J -d "{\"email\":\"p6${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"outra12345\"}" $U/auth/activate-teacher)" 400
ok "convidar quem já activou => 409" "$(code -H "$HA" $J -d "{\"email\":\"p6${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite)" 409

echo "-- área do docente"
TM=$(curl -s -H "$HT" $U/teacher/me)
ok "docente vê a sua ficha" "$(echo "$TM" | jq_ "d['id']")" "$TID"
PUB=$(echo "$TM" | jq_ "d['publicCode']")
ok "estudante não acede a /teacher/me => 403" "$(code -H "$H1" $U/teacher/me)" 403
ok "admin não acede a /teacher/me => 403" "$(code -H "$HA" $U/teacher/me)" 403
ok "docente não avalia => 403" "$(code -H "$HT" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":5,\"punctuality\":5,\"availability\":5,\"mastery\":5,\"fairness\":5}}" $U/evaluations)" 403
ok "docente não gere estudantes => 403" "$(code -H "$HT" $U/admin/students)" 403
ok "estatísticas com poucas avaliações: sem médias" "$(curl -s -H "$HT" $U/teacher/me/stats | jq_ "d['sufficient']")" False
EV=$(curl -s -H "$H1" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":5,\"punctuality\":4,\"availability\":5,\"mastery\":5,\"fairness\":4},\"comment\":\"Explica muito bem a matéria.\"}" $U/evaluations)
ok "estudante avalia o docente" "$(echo "$EV" | jq_ "d['evaluation']['comment']['status']")" PUBLISHED
COM=$(curl -s -H "$HT" "$U/teacher/me/comments?pageSize=50")
CID=$(echo "$COM" | jq_ "[c['id'] for c in d['items'] if c['text']=='Explica muito bem a matéria.'][0]")
ok "docente vê o comentário sem autor nem data" "$(echo "$COM" | jq_ "sorted(d['items'][0].keys())")" "['id', 'reply', 'semester', 'subject', 'text']"
ok "responder ao comentário => 200" "$(code -X PUT -H "$HT" $J -d '{"text":"Obrigado pelo comentário!"}' $U/teacher/me/comments/$CID/reply)" 200
ok "resposta com dados pessoais => 422" "$(code -X PUT -H "$HT" $J -d '{"text":"Liga para 842345678 ou escreve para a@b.com"}' $U/teacher/me/comments/$CID/reply)" 422
ok "a resposta é pública" "$(curl -s -H "$H2" "$U/teachers/$TID/comments?pageSize=50" | jq_ "[c['reply'] for c in d['items'] if c['id']=='$CID'][0]")" "Obrigado pelo comentário!"
ok "não responde a comentários de outro docente (404)" "$(code -X PUT -H "$HT" $J -d '{"text":"Olá"}' $U/teacher/me/comments/$(uuid)/reply)" 404
ok "estudante não responde => 403" "$(code -X PUT -H "$H2" $J -d '{"text":"Olá"}' $U/teacher/me/comments/$CID/reply)" 403

echo "-- QR Code: código permanente do docente"
Q=$(curl -s -H "$H2" $U/qr/teacher/$PUB)
ok "ler o QR do docente devolve as cadeiras avaliáveis" "$(echo "$Q" | jq_ "(d['kind'], d['teacher']['id']=='$TID', any(i['courseSubjectId']=='$CS' and i['canEvaluate'] for i in d['items']))")" "('TEACHER', True, True)"
ok "QR não expõe o id interno nem o código no corpo de erro" "$(echo "$Q" | grep -c "$PUB")" 0
ok "QR inexistente => 404" "$(code -H "$H2" $U/qr/teacher/abcdefghijklmnop)" 404
ok "QR malformado => 404" "$(code -H "$H2" $U/qr/teacher/x)" 404
ok "sem sessão iniciada => 401" "$(code $U/qr/teacher/$PUB)" 401
ok "docente não lê QR de avaliação => 403" "$(code -H "$HT" $U/qr/teacher/$PUB)" 403
ok "quem já avaliou vê JA_AVALIADO" "$(curl -s -H "$H1" $U/qr/teacher/$PUB | jq_ "[i['reason'] for i in d['items'] if i['courseSubjectId']=='$CS'][0]")" JA_AVALIADO

echo "-- QR Code: sessões"
SES=$(curl -s -H "$HT" $J -d "{\"courseSubjectId\":\"$CS\",\"minutes\":30}" $U/teacher/me/sessions)
SID=$(echo "$SES" | jq_ "d['id']"); TOK=$(echo "$SES" | jq_ "d['qrToken']")
ok "docente cria sessão activa" "$(echo "$SES" | jq_ "d['status']")" ACTIVE
ok "sessão para cadeira que não lecciona => 403" "$(code -H "$HT" $J -d "{\"courseSubjectId\":\"$OTHERCS\",\"minutes\":30}" $U/teacher/me/sessions)" 403
ok "duração inválida => 400" "$(code -H "$HT" $J -d "{\"courseSubjectId\":\"$CS\",\"minutes\":1}" $U/teacher/me/sessions)" 400
ok "estudante não cria sessões => 403" "$(code -H "$H1" $J -d "{\"courseSubjectId\":\"$CS\",\"minutes\":30}" $U/teacher/me/sessions)" 403
ok "docente lista as suas sessões" "$(curl -s -H "$HT" $U/teacher/me/sessions | jq_ "any(s['id']=='$SID' for s in d['items'])")" True
QS=$(curl -s -H "$H2" $U/qr/session/$TOK)
ok "estudante da cadeira lê o QR da sessão" "$(echo "$QS" | jq_ "(d['kind'], len(d['items']), d['items'][0]['canEvaluate'])")" "('SESSION', 1, True)"
ok "QR de sessão inexistente => 404" "$(code -H "$H2" $U/qr/session/abcdefghijklmnopqrst)" 404
ok "e avalia: tudo o resto é regra normal (201)" "$(code -H "$H2" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":4,\"punctuality\":4,\"availability\":4,\"mastery\":4,\"fairness\":4}}" $U/evaluations)" 201
SESG=$(curl -s -H "$HT" $J -d "{\"courseSubjectId\":\"$CS\",\"minutes\":30,\"classGroupId\":\"$TURMA2\"}" $U/teacher/me/sessions)
ok "sessão de outra turma: estudante da turma A => 403 FORA_DA_TURMA" "$(curl -s -H "$H3" $U/qr/session/$(echo "$SESG" | jq_ "d['qrToken']") | jq_ "d['code']")" FORA_DA_TURMA
ok "turma de outro curso/semestre => 400" "$(code -H "$HT" $J -d "{\"courseSubjectId\":\"$CS\",\"minutes\":30,\"classGroupId\":\"$(uuid)\"}" $U/teacher/me/sessions)" 400
ok "encerrar a sessão => 200" "$(code -X POST -H "$HT" $U/teacher/me/sessions/$SID/close)" 200
ok "sessão encerrada => 409 SESSAO_ENCERRADA" "$(curl -s -H "$H3" $U/qr/session/$TOK | jq_ "d['code']")" SESSAO_ENCERRADA
[ -n "$DBCMD" ] && {
  $DBCMD "UPDATE evaluation_sessions SET \"closesAt\" = now() - interval '1 minute' WHERE id='$(echo "$SESG" | jq_ "d['id']")'" >/dev/null 2>&1
  ok "sessão expirada => 409 SESSAO_EXPIRADA" "$(curl -s -H "$H3" $U/qr/session/$(echo "$SESG" | jq_ "d['qrToken']") | jq_ "d['code']")" SESSAO_EXPIRADA
}
ok "docente não encerra sessões de outros (404)" "$(code -X POST -H "$HT" $U/teacher/me/sessions/$(uuid)/close)" 404

echo "-- denúncias e moderação"
ok "denunciar comentário => 201" "$(code -H "$H2" $J -d '{"reason":"Conteúdo inadequado"}' $U/comments/$CID/report)" 201
ok "denunciar duas vezes => 409" "$(code -H "$H2" $J -d '{"reason":"Conteúdo inadequado"}' $U/comments/$CID/report)" 409
ok "denunciar comentário inexistente => 404" "$(code -H "$H2" $J -d '{"reason":"Conteúdo inadequado"}' $U/comments/$(uuid)/report)" 404
ok "sem token => 401" "$(code $J -d '{"reason":"abc"}' $U/comments/$CID/report)" 401
REP=$(curl -s -H "$HA" "$U/admin/reports")
RID=$(echo "$REP" | jq_ "[r['id'] for r in d['items'] if r['comment']['id']=='$CID'][0]")
ok "admin vê a denúncia aberta" "$([ -n "$RID" ] && echo sim)" sim
ok "denúncias não identificam o denunciante nem o autor" "$(echo "$REP" | grep -ci 'reporter\|studentId\|@teste.com\|Aluno Teste')" 0
ok "estudante não vê denúncias => 403" "$(code -H "$H2" $U/admin/reports)" 403
ok "resolver e ocultar o comentário => 200" "$(code -X PATCH -H "$HA" $J -d '{"status":"RESOLVED","hideComment":true}' $U/admin/reports/$RID)" 200
ok "comentário oculto deixa de ser público" "$(curl -s -H "$H2" "$U/teachers/$TID/comments?pageSize=50" | jq_ "any(c['id']=='$CID' for c in d['items'])")" False
ok "admin vê o comentário oculto" "$(curl -s -H "$HA" "$U/admin/comments?status=HIDDEN" | jq_ "any(c['id']=='$CID' for c in d['items'])")" True
ok "a moderação não expõe o autor" "$(curl -s -H "$HA" "$U/admin/comments?status=HIDDEN" | grep -ci 'studentId\|@teste.com\|Aluno Teste')" 0
ok "admin volta a publicar" "$(code -X PATCH -H "$HA" $J -d '{"status":"PUBLISHED"}' $U/admin/comments/$CID)" 200
ok "estado inválido => 400" "$(code -X PATCH -H "$HA" $J -d '{"status":"BLOCKED"}' $U/admin/comments/$CID)" 400
ok "docente não modera => 403" "$(code -X PATCH -H "$HT" $J -d '{"status":"HIDDEN"}' $U/admin/comments/$CID)" 403

echo "-- painel do admin: períodos, semestres, utilizadores, estatísticas, auditoria"
ok "listar períodos" "$(curl -s -H "$HA" $U/admin/periods | jq_ "len(d['items'])>0")" True
PER=$(curl -s -H "$HA" $J -d "{\"semesterId\":\"$CUR\",\"opensAt\":\"1999-01-01T00:00:00Z\",\"closesAt\":\"1999-02-01T00:00:00Z\",\"status\":\"CLOSED\",\"courseIds\":[\"$INF\"]}" $U/admin/periods)
PID=$(echo "$PER" | jq_ "d['id']")
ok "criar período (fechado, âmbito curso)" "$(echo "$PER" | jq_ "(d['open'], len(d['courses']))")" "(False, 1)"
ok "datas invertidas => 400" "$(code -H "$HA" $J -d "{\"semesterId\":\"$CUR\",\"opensAt\":\"2030-02-01T00:00:00Z\",\"closesAt\":\"2030-01-01T00:00:00Z\"}" $U/admin/periods)" 400
ok "alterar período" "$(curl -s -X PATCH -H "$HA" $J -d '{"courseIds":[]}' $U/admin/periods/$PID | jq_ "len(d['courses'])")" 0
ok "estudante não gere períodos => 403" "$(code -H "$H1" $U/admin/periods)" 403
ok "apagar período sem avaliações => 200" "$(code -X DELETE -H "$HA" $U/admin/periods/$PID)" 200
EVP=$(curl -s -H "$HA" $U/admin/periods | jq_ "[p['id'] for p in d['items'] if p['evaluations']>0][0]")
ok "apagar período com avaliações => 409" "$(code -X DELETE -H "$HA" $U/admin/periods/$EVP)" 409
ok "listar semestres" "$(curl -s -H "$HA" $U/admin/semesters | jq_ "sum(1 for s in d['items'] if s['isCurrent'])")" 1
ok "tornar corrente o mesmo semestre mantém exactamente um" "$(curl -s -H "$HA" -X POST $U/admin/semesters/$CUR/current | jq_ "sum(1 for s in d['items'] if s['isCurrent'])")" 1
ok "pesquisar utilizadores" "$(curl -s -H "$HA" "$U/admin/users?q=p6${S}1@teste.com" | jq_ "d['total']")" 1
UID1=$(curl -s -H "$HA" "$U/admin/users?q=p6${S}1@teste.com" | jq_ "d['items'][0]['id']")
ok "suspender conta => 200" "$(code -X PATCH -H "$HA" $J -d '{"status":"SUSPENDED"}' $U/admin/users/$UID1/status)" 200
ok "conta suspensa perde o acesso de imediato (401)" "$(code -H "$H1" $U/me)" 401
ok "reactivar conta" "$(code -X PATCH -H "$HA" $J -d '{"status":"ACTIVE"}' $U/admin/users/$UID1/status)" 200
ok "...e o acesso volta" "$(code -H "$H1" $U/me)" 200
ADMID=$(curl -s -H "$HA" "$U/admin/users?role=ADMIN" | jq_ "d['items'][0]['id']")
ok "admin não suspende a própria conta => 409" "$(code -X PATCH -H "$HA" $J -d '{"status":"SUSPENDED"}' $U/admin/users/$ADMID/status)" 409
ST=$(curl -s -H "$HA" $U/admin/stats)
ok "estatísticas gerais" "$(echo "$ST" | jq_ "(d['evaluations']>0, d['teachers']>0, 'minSample' in d)")" "(True, True, True)"
ok "estudante não vê estatísticas gerais => 403" "$(code -H "$H1" $U/admin/stats)" 403
AU=$(curl -s -H "$HA" $U/admin/audit)
ok "auditoria regista as acções" "$(echo "$AU" | jq_ "any(a['action']=='DOCENTE_CONVIDADO' for a in d['items']) or d['total']>5")" True
ok "auditoria não é acessível a estudantes => 403" "$(code -H "$H1" $U/admin/audit)" 403
NC=$(curl -s -H "$HA" $J -d "{\"name\":\"Curso P6 $S\",\"code\":\"Cp$(echo ${S:0:4} | tr 0-9 a-j)\"}" $U/admin/courses)
ok "criar curso" "$(echo "$NC" | jq_ "d['name']")" "Curso P6 $S"
ok "curso duplicado => 409" "$(code -H "$HA" $J -d "{\"name\":\"Curso P6 $S\",\"code\":\"Cp$(echo ${S:0:4} | tr 0-9 a-j)\"}" $U/admin/courses)" 409
[ -n "$DBCMD" ] && $DBCMD "DELETE FROM courses WHERE name='Curso P6 $S'" >/dev/null 2>&1

echo "-- sincronização offline (fila do dispositivo)"
CIDN=$(uuid)
BODY="{\"operations\":[{\"op\":\"create\",\"clientId\":\"$CIDN\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":3,\"punctuality\":3,\"availability\":3,\"mastery\":3,\"fairness\":3}}]}"
R=$(curl -s -H "$H3" $J -d "$BODY" $U/sync/evaluations)
ok "criar via sync => OK" "$(echo "$R" | jq_ "d['results'][0]['status']")" OK
EVID=$(echo "$R" | jq_ "d['results'][0]['evaluation']['id']")
ok "reenviar o mesmo clientId => DUPLICATE (idempotente)" "$(curl -s -H "$H3" $J -d "$BODY" $U/sync/evaluations | jq_ "d['results'][0]['status']")" DUPLICATE
ok "actualizar com versão desactualizada => CONFLICT" "$(curl -s -H "$H3" $J -d "{\"operations\":[{\"op\":\"update\",\"evaluationId\":\"$EVID\",\"version\":7,\"patch\":{\"clarity\":5}}]}" $U/sync/evaluations | jq_ "(d['results'][0]['status'], d['results'][0]['currentVersion'])")" "('CONFLICT', 1)"
ok "actualizar com a versão certa => OK" "$(curl -s -H "$H3" $J -d "{\"operations\":[{\"op\":\"update\",\"evaluationId\":\"$EVID\",\"version\":1,\"patch\":{\"clarity\":5}}]}" $U/sync/evaluations | jq_ "(d['results'][0]['status'], d['results'][0]['evaluation']['version'])")" "('OK', 2)"
M=$(curl -s -H "$H3" $J -d "{\"operations\":[{\"op\":\"create\",\"clientId\":\"$(uuid)\",\"teacherId\":\"$(echo "$STR" | jq_ "[t['id'] for t in d['teachers'] if '$SUBJ' not in t['subjectIds']][0]")\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":3,\"punctuality\":3,\"availability\":3,\"mastery\":3,\"fairness\":3}},{\"op\":\"delete\",\"evaluationId\":\"$EVID\"}]}" $U/sync/evaluations)
ok "uma operação rejeitada não impede as seguintes" "$(echo "$M" | jq_ "(d['results'][0]['status'], d['results'][0]['code'], d['results'][1]['status'])")" "('REJECTED', 'DOCENTE_NAO_ASSOCIADO', 'OK')"
ok "sync só de estudantes => 403" "$(code -H "$HT" $J -d "$BODY" $U/sync/evaluations)" 403
ok "lote vazio => 400" "$(code -H "$H3" $J -d '{"operations":[]}' $U/sync/evaluations)" 400
ok "operação desconhecida => 400" "$(code -H "$H3" $J -d '{"operations":[{"op":"drop"}]}' $U/sync/evaluations)" 400
ok "estudante não sincroniza avaliações de outro (404 REJECTED)" "$(curl -s -H "$H2" $J -d "{\"operations\":[{\"op\":\"delete\",\"evaluationId\":\"$EVID\"}]}" $U/sync/evaluations | jq_ "d['results'][0]['status']")" REJECTED
exit ${FAIL:-0}
