#!/usr/bin/env bash
# Regras de avaliação (R-1 a R-9) contra um servidor a correr.
# Uso: API=localhost:3102 DBCMD='docker compose exec -T postgres psql -U avaliaprof -d avaliaprof -c' bash test/smoke-evaluations.sh
# Cria utilizadores novos por execução. DBCMD (opcional) permite testar período fechado e papéis.
U=${API:-localhost:3000}; J='-H Content-Type:application/json'; S=$RANDOM$RANDOM
jq_() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
ok() { [ "$2" = "$3" ] && echo "OK   $1" || { echo "FALHA $1 (esperado $3, obtido $2)"; FAIL=1; }; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
uuid() { python3 -c "import uuid;print(uuid.uuid4())"; }
# Hermético: apaga só os dados dos utilizadores de teste (ev...@teste.com) no início e no fim.
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'ev%@teste.com'); DELETE FROM users WHERE email LIKE 'ev%@teste.com'" >/dev/null 2>&1
  type limpar_docentes >/dev/null 2>&1 && limpar_docentes
}
[ -n "$DBCMD" ] || echo "AVISO: sem DBCMD os testes assumem docentes sem avaliações anteriores."
limpar; trap limpar EXIT

source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
TA=$(admin_token); HA=$(auth $TA)
CID=$(curl -s -H "$HA" $U/courses | python3 -c "import sys,json;print([c['id'] for c in json.load(sys.stdin) if c['name']=='Engenharia Informática'][0])")
CUR=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
TURMA=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$CID' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")

# Fluxo real: o admin cadastra o estudante (turma A, 1.º ano), o estudante activa a conta e,
# se `all`, o admin associa-lhe as restantes cadeiras do semestre. Devolve o token.
mkstudent() {
  local n=$1 all=$2 num="T${S:0:6}0$1" em="ev$S$1@teste.com"
  local sid=$(curl -s -H "$HA" $J -d "{\"name\":\"Aluno Teste$n\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$CID\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$TURMA\"}" $U/admin/students | jq_ "d['id']")
  if [ "$all" = all ]; then
    for cs in $(curl -s -H "$HA" $U/admin/students/$sid/available-subjects | jq_ "' '.join(i['courseSubjectId'] for i in d['items'])"); do
      curl -s -o /dev/null -H "$HA" $J -d "{\"courseSubjectId\":\"$cs\"}" $U/admin/students/$sid/subjects
    done
  fi
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register | jq_ "d['token']"
}
reg() { mkstudent $1 all; }

T1=$(reg 1); H1=$(auth $T1)
AV=$(curl -s -H "$H1" $U/me/subjects)
# Docente criado para o teste, sem avaliações (os testes de amostra mínima precisam de partir de 0).
CS1=$(echo "$AV" | jq_ "d['items'][0]['courseSubjectId']")
TEACHER=$(mkteacher "Docente Teste ev$S" "$(echo "$AV" | jq_ "d['items'][0]['subjectId']")")
[ -n "$TEACHER" ] || { echo "FALHA não foi possível criar o docente de teste"; exit 1; }
# T0 só tem as cadeiras da sua turma (AUTO). OTHER_CS: cadeira que T0 NÃO tem e que é leccionada por um
# docente OTHER que não lecciona CS1.
T0=$(mkstudent 0 base); H0=$(auth $T0)
IDS0=$(curl -s -H "$H0" $U/me/subjects | jq_ "[i['courseSubjectId'] for i in d['items']]")
OTHER=$(echo "$AV" | jq_ "[t['id'] for i in d['items'] if i['courseSubjectId'] not in $IDS0 and i['courseSubjectId']!='$CS1' for t in i['teachers'] if t['id'] not in [x['id'] for x in [j for j in d['items'] if j['courseSubjectId']=='$CS1'][0]['teachers']]][0]")
OTHER_CS=$(echo "$AV" | jq_ "[i['courseSubjectId'] for i in d['items'] if i['courseSubjectId'] not in $IDS0 and any(t['id']=='$OTHER' for t in i['teachers'])][0]")
ALL=""
body() { echo "{\"clientId\":\"$1\",\"teacherId\":\"$2\",\"courseSubjectId\":\"$3\",\"scores\":{\"clarity\":$4,\"punctuality\":4,\"availability\":3,\"mastery\":5,\"fairness\":4}$5}"; }

echo "-- R-3: só avalia cadeiras da sua matrícula e docentes dessa cadeira"
ok "cadeira que não frequenta => 403 NAO_INSCRITO" "$(curl -s -H "$H0" $J -d "$(body $(uuid) $OTHER $OTHER_CS 5)" $U/evaluations | jq_ "d['code']")" NAO_INSCRITO
ok "docente que não lecciona a cadeira => 403" "$(curl -s -H "$H1" $J -d "$(body $(uuid) $OTHER $CS1 5)" $U/evaluations | jq_ "d['code']")" DOCENTE_NAO_ASSOCIADO
ok "elegibilidade: pode avaliar" "$(curl -s -H "$H1" $U/teachers/$TEACHER/eligibility | jq_ "d['items'][0]['canEvaluate']")" True

echo "-- criar, idempotência, unicidade (R-2, R-14)"
CLI=$(uuid)
R=$(curl -s -w '\n%{http_code}' -H "$H1" $J -d "$(body $CLI $TEACHER $CS1 5)" $U/evaluations); ST=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
ok "criar => 201" "$ST" 201
EV1=$(echo "$BODY" | jq_ "d['evaluation']['id']")
ok "média da avaliação (5+4+3+5+4)/5" "$(echo "$BODY" | jq_ "d['evaluation']['overall']")" 4.2
ok "resposta sem identificação do estudante" "$(echo "$BODY" | grep -ci 'studentId\|studentNumber\|Aluno Teste')" 0
ok "reenvio com o mesmo clientId => 200 duplicate" "$(curl -s -w '%{http_code}' -H "$H1" $J -d "$(body $CLI $TEACHER $CS1 5)" $U/evaluations | python3 -c "import sys;t=sys.stdin.read();print(t[-3:], 'true' in t.split('duplicate')[1][:8])")" "200 True"
ok "só ficou 1 avaliação" "$(curl -s -H "$H1" $U/me/evaluations | jq_ "len(d['items'])")" 1
ok "outro clientId, mesma combinação => 409 JA_AVALIADO" "$(curl -s -H "$H1" $J -d "$(body $(uuid) $TEACHER $CS1 3)" $U/evaluations | jq_ "d['code']")" JA_AVALIADO
ok "elegibilidade passa a JA_AVALIADO" "$(curl -s -H "$H1" $U/teachers/$TEACHER/eligibility | jq_ "d['items'][0]['reason']")" JA_AVALIADO

echo "-- validação das notas"
T2=$(reg 2); H2=$(auth $T2)
ok "nota 6 => 400" "$(code -H "$H2" $J -d "$(body $(uuid) $TEACHER $CS1 6)" $U/evaluations)" 400
ok "nota 0 => 400" "$(code -H "$H2" $J -d "$(body $(uuid) $TEACHER $CS1 0)" $U/evaluations)" 400
ok "critério em falta => 400" "$(code -H "$H2" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TEACHER\",\"courseSubjectId\":\"$CS1\",\"scores\":{\"clarity\":5}}" $U/evaluations)" 400
ok "clientId inválido => 400" "$(code -H "$H2" $J -d "$(body xyz $TEACHER $CS1 5)" $U/evaluations)" 400

echo "-- comentários: moderação separada da nota (R-6, R-9)"
ok "comentário ofensivo: avaliação gravada, comentário BLOCKED" "$(curl -s -H "$H2" $J -d "$(body $(uuid) $TEACHER $CS1 2 ',"comment":"O professor é um idiota"')" $U/evaluations | jq_ "(d['evaluation']['overall'], d['evaluation']['comment']['status'], d['evaluation']['comment']['reason'])")" "(3.6, 'BLOCKED', 'OFFENSIVE')"
T3=$(reg 3); H3=$(auth $T3)
ok "crítica legítima => PUBLISHED" "$(curl -s -H "$H3" $J -d "$(body $(uuid) $TEACHER $CS1 2 ',"comment":"O professor explica mal a matéria e devia melhorar a metodologia."')" $U/evaluations | jq_ "d['evaluation']['comment']['status']")" PUBLISHED
T4=$(reg 4); H4=$(auth $T4)
ok "acusação grave => PENDING_REVIEW" "$(curl -s -H "$H4" $J -d "$(body $(uuid) $TEACHER $CS1 1 ',"comment":"Dizem que o professor vende notas."')" $U/evaluations | jq_ "d['evaluation']['comment']['status']")" PENDING_REVIEW
COMM=$(curl -s -H "$H1" $U/teachers/$TEACHER/comments)
ok "comentários públicos: só o publicado" "$(echo "$COMM" | jq_ "(d['total'], len(d['items']))")" "(1, 1)"
ok "comentário público sem autor nem data" "$(echo "$COMM" | jq_ "sorted(d['items'][0].keys())")" "['id', 'reply', 'semester', 'text']"
T5=$(reg 5); H5=$(auth $T5)
ok "mesmo texto repetido no mesmo dia => BLOCKED SPAM" "$(curl -s -H "$H3" $J -d "$(body $(uuid) $OTHER $OTHER_CS 2 ',"comment":"O professor explica mal a matéria e devia melhorar a metodologia."')" $U/evaluations | jq_ "d['evaluation']['comment']['reason']")" SPAM

echo "-- amostra mínima (anonimato) e estatísticas agregadas"
ok "com 4 avaliações: sem médias (sufficient=false)" "$(curl -s -H "$H1" $U/teachers/$TEACHER/stats | jq_ "(d['count'], d['sufficient'], 'average' in d)")" "(4, False, False)"
ok "listagem: média oculta com amostra insuficiente" "$(curl -s -H "$H1" "$U/teachers?pageSize=50" | jq_ "[t for t in d['items'] if t['id']=='$TEACHER'][0]['average']")" None
curl -s -H "$H5" $J -d "$(body $(uuid) $TEACHER $CS1 4)" $U/evaluations >/dev/null
STATS=$(curl -s -H "$H1" $U/teachers/$TEACHER/stats)
ok "com 5 avaliações: já mostra médias" "$(echo "$STATS" | jq_ "(d['count'], d['sufficient'], 'average' in d, 'criteria' in d)")" "(5, True, True, True)"
ok "distribuição soma o nº de avaliações" "$(echo "$STATS" | jq_ "sum(d['distribution'].values())")" 5
ok "evolução tem o semestre corrente" "$(echo "$STATS" | jq_ "d['evolution'][0]['semester']")" 2026/2
ok "estatísticas sem dados de estudantes" "$(echo "$STATS$COMM" | grep -ci 'Aluno Teste\|@teste.com\|studentId')" 0
ok "listagem: média visível com 5 avaliações" "$(curl -s -H "$H1" "$U/teachers?pageSize=50" | jq_ "[t for t in d['items'] if t['id']=='$TEACHER'][0]['count']")" 5

echo "-- editar e apagar (R-4), conflitos"
ok "editar nota => version 2" "$(curl -s -X PATCH -H "$H1" $J -d '{"scores":{"clarity":3},"version":1}' $U/evaluations/$EV1 | jq_ "(d['version'], d['scores']['clarity'])")" "(2, 3)"
ok "versão desactualizada => 409 CONFLITO" "$(curl -s -X PATCH -H "$H1" $J -d '{"scores":{"clarity":1},"version":1}' $U/evaluations/$EV1 | jq_ "d['code']")" CONFLITO
ok "adicionar comentário ofensivo em edição => BLOCKED" "$(curl -s -X PATCH -H "$H1" $J -d '{"comment":"que merda de aulas"}' $U/evaluations/$EV1 | jq_ "d['comment']['status']")" BLOCKED
ok "remover comentário (null)" "$(curl -s -X PATCH -H "$H1" $J -d '{"comment":null}' $U/evaluations/$EV1 | jq_ "d['comment']")" None
ok "editar avaliação de outro estudante => 404" "$(code -X PATCH -H "$H2" $J -d '{"scores":{"clarity":1}}' $U/evaluations/$EV1)" 404
ok "apagar avaliação de outro estudante => 404" "$(code -X DELETE -H "$H2" $U/evaluations/$EV1)" 404
ok "apagar a própria => 200" "$(code -X DELETE -H "$H1" $U/evaluations/$EV1)" 200
ok "depois de apagar pode voltar a avaliar" "$(code -H "$H1" $J -d "$(body $(uuid) $TEACHER $CS1 4)" $U/evaluations)" 201

if [ -n "$DBCMD" ]; then
  echo "-- R-4: período fechado (hora/estado do servidor)"
  EV2=$(curl -s -H "$H1" $U/me/evaluations | jq_ "d['items'][0]['id']")
  $DBCMD "UPDATE evaluation_periods SET status='CLOSED'" >/dev/null
  ok "criar com período fechado => 409 PERIODO_FECHADO" "$(curl -s -H "$H2" $J -d "$(body $(uuid) $OTHER $OTHER_CS 3)" $U/evaluations | jq_ "d['code']")" PERIODO_FECHADO
  ok "editar com período fechado => 409" "$(code -X PATCH -H "$H1" $J -d '{"scores":{"clarity":1}}' $U/evaluations/$EV2)" 409
  ok "apagar com período fechado => 409" "$(code -X DELETE -H "$H1" $U/evaluations/$EV2)" 409
  ok "as minhas avaliações ficam não editáveis" "$(curl -s -H "$H1" $U/me/evaluations | jq_ "d['items'][0]['editable']")" False
  $DBCMD "UPDATE evaluation_periods SET status='OPEN'" >/dev/null
  ok "reaberto: volta a poder editar" "$(code -X PATCH -H "$H1" $J -d '{"scores":{"clarity":2}}' $U/evaluations/$EV2)" 200
  echo "-- R-1/R-5: docente e admin não avaliam"
  $DBCMD "UPDATE users SET role='TEACHER' WHERE email='ev${S}2@teste.com'" >/dev/null
  ok "docente a avaliar => 403" "$(code -H "$H2" $J -d "$(body $(uuid) $TEACHER $CS1 5)" $U/evaluations)" 403
  $DBCMD "UPDATE users SET role='ADMIN' WHERE email='ev${S}2@teste.com'" >/dev/null
  ok "admin a avaliar => 403" "$(code -H "$H2" $J -d "$(body $(uuid) $TEACHER $CS1 5)" $U/evaluations)" 403
  ok "docente/admin podem ler estatísticas" "$(code -H "$H2" $U/teachers/$TEACHER/stats)" 200
fi
ok "sem token => 401" "$(code $U/me/evaluations)" 401
exit ${FAIL:-0}
