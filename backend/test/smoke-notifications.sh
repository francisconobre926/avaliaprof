#!/usr/bin/env bash
# Notificações dentro da app: moderação, resposta do docente, denúncias, períodos, privacidade e leitura.
# Uso: API=localhost:3103 DBCMD='docker exec -i avaliaprof-postgres-1 psql -U avaliaprof -d avaliaprof -c' bash test/smoke-notifications.sh
source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
INICIO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
limpar() {
  [ -n "$DBCMD" ] || return 0
  # O período de teste avisa também estudantes reais do seed: apagar esses avisos criados durante o teste.
  $DBCMD "DELETE FROM notifications WHERE type LIKE 'PERIOD%' AND \"createdAt\" >= '$INICIO'" >/dev/null 2>&1
  $DBCMD "DELETE FROM evaluation_sessions WHERE \"teacherId\" IN (SELECT \"id\" FROM teachers WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'nt%@teste.com')); DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'nt%@teste.com'); UPDATE teachers SET \"userId\"=NULL WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'nt%@teste.com'); DELETE FROM users WHERE email LIKE 'nt%@teste.com'; DELETE FROM evaluation_periods WHERE \"opensAt\" < now() AND \"closesAt\" < now() + interval '4 hours' AND \"closesAt\" > now() + interval '2 hours' AND id NOT IN (SELECT \"periodId\" FROM evaluations)" >/dev/null 2>&1
}
limpar; trap limpar EXIT
TA=$(admin_token); HA=$(auth $TA)
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
TURMA=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
mk() {
  local num="T${S:0:6}n$1" em="nt$S$1@teste.com"
  curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste$1\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$INF\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$TURMA\"}" $U/admin/students
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register | jq_ "d['token']"
}
H1=$(auth $(mk 1)); H2=$(auth $(mk 2))
STR=$(curl -s -H "$HA" $U/admin/structure)
NOACC=$(echo "$STR" | jq_ "[t['id'] for t in d['teachers'] if t['account'] is None]")
read -r CS TID <<< "$(curl -s -H "$H1" $U/me/subjects | jq_ "next((i['courseSubjectId']+' '+t['id'] for i in d['items'] for t in i['teachers'] if t['id'] in $NOACC), '')")"
CODE=$(curl -s -H "$HA" $J -d "{\"email\":\"nt${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite | jq_ "d['code']")
HT=$(auth $(curl -s $J -d "{\"email\":\"nt${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"senha1234\"}" $U/auth/activate-teacher | jq_ "d['token']"))
ev() { echo "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":4,\"punctuality\":4,\"availability\":4,\"mastery\":4,\"fairness\":4}$1}"; }
tipos() { curl -s -H "$1" $U/notifications | jq_ "sorted(n['type'] for n in d['items'])"; }

echo "-- acesso e vazio"
ok "sem token => 401" "$(code $U/notifications)" 401
ok "conta nova: sem notificações" "$(curl -s -H "$H2" $U/notifications/unread-count | jq_ "d['unread']")" 0

echo "-- moderação do comentário"
curl -s -o /dev/null -H "$H1" $J -d "$(ev ',"comment":"O professor é um idiota"')" $U/evaluations
ok "comentário bloqueado avisa o autor" "$(tipos "$H1")" "['COMMENT_BLOCKED']"
ok "...e fica por ler" "$(curl -s -H "$H1" $U/notifications/unread-count | jq_ "d['unread']")" 1
ok "a notificação não revela o texto do comentário" "$(curl -s -H "$H1" $U/notifications | grep -ci 'idiota')" 0
ok "o outro estudante não recebe nada" "$(curl -s -H "$H2" $U/notifications/unread-count | jq_ "d['unread']")" 0

echo "-- resposta do docente e decisões do admin"
curl -s -o /dev/null -H "$H2" $J -d "$(ev ',"comment":"Explica muito bem a matéria."')" $U/evaluations
CID=$(curl -s -H "$HT" "$U/teacher/me/comments?pageSize=50" | jq_ "[c['id'] for c in d['items'] if c['text']=='Explica muito bem a matéria.'][0]")
curl -s -o /dev/null -X PUT -H "$HT" $J -d '{"text":"Obrigado!"}' $U/teacher/me/comments/$CID/reply
ok "resposta do docente avisa o autor do comentário" "$(tipos "$H2")" "['TEACHER_REPLY']"
ok "o docente não é avisado de comentários novos (não revela quando alguém avaliou)" "$(curl -s -H "$HT" $U/notifications | jq_ "[n['type'] for n in d['items'] if n['type'].startswith('COMMENT')]")" "[]"
curl -s -o /dev/null -X PATCH -H "$HA" $J -d '{"status":"HIDDEN"}' $U/admin/comments/$CID
ok "admin oculta: o autor é avisado" "$(tipos "$H2")" "['COMMENT_HIDDEN', 'TEACHER_REPLY']"
curl -s -o /dev/null -X PATCH -H "$HA" $J -d '{"status":"HIDDEN"}' $U/admin/comments/$CID
ok "repetir o mesmo estado não duplica o aviso" "$(curl -s -H "$H2" $U/notifications | jq_ "len(d['items'])")" 2
curl -s -o /dev/null -X PATCH -H "$HA" $J -d '{"status":"PUBLISHED"}' $U/admin/comments/$CID

echo "-- denúncias"
curl -s -o /dev/null -H "$H1" $J -d '{"reason":"Conteúdo inadequado"}' $U/comments/$CID/report
RID=$(curl -s -H "$HA" $U/admin/reports | jq_ "[r['id'] for r in d['items'] if r['comment']['id']=='$CID'][0]")
curl -s -o /dev/null -X PATCH -H "$HA" $J -d '{"status":"DISMISSED"}' $U/admin/reports/$RID
ok "quem denuncia é avisado do desfecho" "$(curl -s -H "$H1" $U/notifications | jq_ "'REPORT_REVIEWED' in [n['type'] for n in d['items']]")" True

echo "-- avisos de períodos"
curl -s -o /dev/null -H "$HA" $J -d "{\"semesterId\":\"$CUR\",\"opensAt\":\"$(python3 -c "import datetime as d;print((d.datetime.utcnow()-d.timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%SZ'))")\",\"closesAt\":\"$(python3 -c "import datetime as d;print((d.datetime.utcnow()+d.timedelta(hours=3)).strftime('%Y-%m-%dT%H:%M:%SZ'))")\",\"status\":\"OPEN\",\"courseIds\":[\"$INF\"]}" $U/admin/periods
sleep 2
ok "período novo aberto avisa os estudantes do âmbito" "$(curl -s -H "$H2" $U/notifications | jq_ "'PERIOD_OPEN' in [n['type'] for n in d['items']]")" True
ok "a menos de 24 h do fim avisa quem tem docentes por avaliar" "$(curl -s -H "$H2" $U/notifications | jq_ "'PERIOD_CLOSING' in [n['type'] for n in d['items']]")" True
ok "o docente não recebe avisos de período" "$(curl -s -H "$HT" $U/notifications | jq_ "[n['type'] for n in d['items'] if n['type'].startswith('PERIOD')]")" "[]"

echo "-- ler e marcar"
N=$(curl -s -H "$H1" $U/notifications); NID=$(echo "$N" | jq_ "d['items'][0]['id']"); UN=$(echo "$N" | jq_ "d['unread']")
ok "marcar uma como lida baixa o contador" "$(curl -s -X POST -H "$H1" $U/notifications/$NID/read | jq_ "d['unread']")" "$((UN-1))"
ok "marcar duas vezes é seguro" "$(code -X POST -H "$H1" $U/notifications/$NID/read)" 200
ok "não se marca a notificação de outra pessoa (404)" "$(code -X POST -H "$H2" $U/notifications/$NID/read)" 404
ok "id inválido => 400" "$(code -X POST -H "$H1" $U/notifications/xyz/read)" 400
ok "marcar todas" "$(curl -s -X POST -H "$H1" $U/notifications/read-all | jq_ "d['unread']")" 0
ok "contador a zero" "$(curl -s -H "$H1" $U/notifications/unread-count | jq_ "d['unread']")" 0
ok "listagem paginada" "$(curl -s -H "$H1" "$U/notifications?page=0" | jq_ "('hasMore' in d, 'total' in d)")" "(True, True)"
exit ${FAIL:-0}
