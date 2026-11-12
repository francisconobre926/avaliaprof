#!/usr/bin/env bash
# Matriz de permissões: cada rota é chamada sem sessão e como estudante, docente e admin.
# Para cada papel autorizado o pedido NÃO pode dar 401/403; para os outros TEM de dar 401 (sem sessão) ou 403.
# Também verifica IDOR, token adulterado, fugas de dados e cabeçalhos. Uso igual ao dos outros smoke-*.sh.
source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'pm%@teste.com'); UPDATE teachers SET \"userId\"=NULL WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'pm%@teste.com'); DELETE FROM users WHERE email LIKE 'pm%@teste.com'" >/dev/null 2>&1
}
limpar; trap limpar EXIT
TA=$(admin_token); HA=$(auth $TA)
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
TURMA=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
mk() {
  local num="T${S:0:6}m$1" em="pm$S$1@teste.com"
  curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste$1\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$INF\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$TURMA\"}" $U/admin/students
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register | jq_ "d['token']"
}
TS=$(mk 1); HS=$(auth $TS); HS2=$(auth $(mk 2))
STR=$(curl -s -H "$HA" $U/admin/structure)
NOACC=$(echo "$STR" | jq_ "[t['id'] for t in d['teachers'] if t['account'] is None]")
read -r CS TID <<< "$(curl -s -H "$HS" $U/me/subjects | jq_ "next((i['courseSubjectId']+' '+t['id'] for i in d['items'] for t in i['teachers'] if t['id'] in $NOACC), '')")"
CODE=$(curl -s -H "$HA" $J -d "{\"email\":\"pm${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite | jq_ "d['code']")
TT=$(curl -s $J -d "{\"email\":\"pm${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"senha1234\"}" $U/auth/activate-teacher | jq_ "d['token']"); HT=$(auth $TT)
ID=$(uuid)

echo "-- matriz de permissões (rota × papel)"
# MÉTODO CAMINHO PAPÉIS  (PUBLIC = sem sessão; AUTH = qualquer sessão; ou lista de S,T,A)
while read -r M P R; do
  [ -z "$M" ] && continue
  path=${P//:id/$ID}; path=${path//:token/abcdefghijklmnopqrst}; path=${path//:code/abcdefghijklmnop}; path=${path//:courseSubjectId/$ID}
  chk() { # nome cabeçalho permitido?
    local c; if [ -n "$2" ]; then c=$(curl -s -o /dev/null -w '%{http_code}' -X $M -H "$2" $J -d '{}' "$U$path"); else c=$(curl -s -o /dev/null -w '%{http_code}' -X $M $J -d '{}' "$U$path"); fi
    if [ "$3" = 1 ]; then [ "$c" != 401 ] && [ "$c" != 403 ] && echo "OK   $M $P ($1 permitido: $c)" || { echo "FALHA $M $P: $1 devia ser permitido (obtido $c)"; FAIL=1; }
    else [ "$c" = 401 ] || [ "$c" = 403 ] && echo "OK   $M $P ($1 recusado: $c)" || { echo "FALHA $M $P: $1 devia ser recusado (obtido $c)"; FAIL=1; }; fi
  }
  allow() { [ "$R" = AUTH ] && { [ "$1" != anon ] && echo 1 || echo 0; return; }; [ "$R" = PUBLIC ] && { echo 1; return; }; case "$1" in anon) echo 0;; S) [[ $R == *S* ]] && echo 1 || echo 0;; T) [[ $R == *T* ]] && echo 1 || echo 0;; A) [[ $R == *A* ]] && echo 1 || echo 0;; esac; }
  chk "sem sessão" "" $(allow anon); chk estudante "$HS" $(allow S); chk docente "$HT" $(allow T); chk admin "$HA" $(allow A)
done <<'ROTAS'
GET /health PUBLIC
GET /courses AUTH
POST /auth/login PUBLIC
POST /auth/register PUBLIC
POST /auth/forgot PUBLIC
POST /auth/reset PUBLIC
POST /auth/activate-teacher PUBLIC
GET /me AUTH
PATCH /me AUTH
POST /me/password AUTH
POST /me/photo AUTH
DELETE /me/photo AUTH
GET /notifications AUTH
GET /notifications/unread-count AUTH
POST /notifications/read-all AUTH
POST /notifications/:id/read AUTH
POST /comments/:id/report AUTH
GET /teachers AUTH
GET /teachers/:id AUTH
GET /teachers/:id/stats AUTH
GET /teachers/:id/comments AUTH
GET /filters AUTH
GET /stats/options AUTH
GET /stats/ranking AUTH
GET /stats/overview AUTH
GET /periods/current S
GET /me/subjects S
GET /me/evaluations S
GET /home S
GET /teachers/:id/eligibility S
POST /evaluations S
PATCH /evaluations/:id S
DELETE /evaluations/:id S
POST /sync/evaluations S
GET /qr/teacher/:code S
GET /qr/session/:token S
GET /teacher/me T
GET /teacher/me/stats T
GET /teacher/me/comments T
PUT /teacher/me/comments/:id/reply T
DELETE /teacher/me/comments/:id/reply T
GET /teacher/me/sessions T
POST /teacher/me/sessions T
POST /teacher/me/sessions/:id/close T
GET /admin/academic-options A
GET /admin/audit A
GET /admin/stats A
GET /admin/structure A
GET /admin/semesters A
POST /admin/semesters/:id/current A
GET /admin/periods A
POST /admin/periods A
PATCH /admin/periods/:id A
DELETE /admin/periods/:id A
GET /admin/class-groups A
POST /admin/class-groups A
GET /admin/class-groups/:id A
DELETE /admin/class-groups/:id A
GET /admin/class-groups/:id/candidates A
POST /admin/class-groups/:id/students A
GET /admin/students A
POST /admin/students A
GET /admin/students/:id A
PATCH /admin/students/:id A
PATCH /admin/students/:id/enrollment A
GET /admin/students/:id/available-subjects A
POST /admin/students/:id/subjects A
DELETE /admin/students/:id/subjects/:courseSubjectId A
POST /admin/courses A
POST /admin/subjects A
POST /admin/subjects/:id/courses A
POST /admin/teachers A
POST /admin/teachers/:id/subjects A
POST /admin/teachers/:id/invite A
GET /admin/users A
PATCH /admin/users/:id/status A
GET /admin/comments A
PATCH /admin/comments/:id A
GET /admin/reports A
PATCH /admin/reports/:id A
ROTAS

echo "-- sessão e tokens"
ok "token adulterado (assinatura) => 401" "$(code -H "Authorization: Bearer ${TS%.*}.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" $U/me)" 401
H64=$(python3 -c "import base64,json;print(base64.urlsafe_b64encode(json.dumps({'alg':'none','typ':'JWT'}).encode()).decode().rstrip('='))")
P64=$(python3 -c "
import base64,json,sys
t='$TS'.split('.')[1]; t+='='*(-len(t)%4); p=json.loads(base64.urlsafe_b64decode(t)); 
print(base64.urlsafe_b64encode(json.dumps(p).encode()).decode().rstrip('='))")
ok "token com alg=none => 401" "$(code -H "Authorization: Bearer $H64.$P64." $U/me)" 401
ok "sem prefixo Bearer => 401" "$(code -H "Authorization: $TS" $U/me)" 401
ok "o papel vem da base, não do token (estudante continua sem acesso a /admin)" "$(code -H "$HS" $U/admin/stats)" 403
ok "autoatribuir papel por /me => 400" "$(code -X PATCH -H "$HS" $J -d '{"role":"ADMIN"}' $U/me)" 400
ok "autoatribuir estado por /me => 400" "$(code -X PATCH -H "$HS" $J -d '{"status":"ACTIVE"}' $U/me)" 400

echo "-- IDOR (acesso a dados de outra pessoa)"
EV=$(curl -s -H "$HS" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":4,\"punctuality\":4,\"availability\":4,\"mastery\":4,\"fairness\":4},\"comment\":\"Boas aulas, gostei.\"}" $U/evaluations)
EVID=$(echo "$EV" | jq_ "d['evaluation']['id']")
ok "outro estudante não edita a minha avaliação (404)" "$(code -X PATCH -H "$HS2" $J -d '{"scores":{"clarity":1}}' $U/evaluations/$EVID)" 404
ok "outro estudante não apaga a minha avaliação (404)" "$(code -X DELETE -H "$HS2" $U/evaluations/$EVID)" 404
ok "as minhas avaliações não aparecem a outro estudante" "$(curl -s -H "$HS2" $U/me/evaluations | jq_ "len(d['items'])")" 0
ok "a avaliação continua intacta" "$(curl -s -H "$HS" $U/me/evaluations | jq_ "d['items'][0]['scores']['clarity']")" 4
ok "reutilizar o clientId de outro estudante => 409" "$(code -H "$HS2" $J -d "{\"clientId\":\"$(echo "$EV" | jq_ "d['evaluation']['clientId']")\",\"teacherId\":\"$TID\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":4,\"punctuality\":4,\"availability\":4,\"mastery\":4,\"fairness\":4}}" $U/evaluations)" 409
ok "outro estudante não vê as minhas notificações" "$(curl -s -H "$HS2" $U/notifications | jq_ "len(d['items'])")" 0

echo "-- fugas de dados"
PUB=$(curl -s -H "$HT" $U/teacher/me | jq_ "d['publicCode']")
ok "o código do QR do docente não aparece em /teachers (estudante)" "$(curl -s -H "$HS" "$U/teachers?pageSize=50" | grep -c "$PUB")" 0
ok "...nem no perfil do docente" "$(curl -s -H "$HS" $U/teachers/$TID | grep -c "$PUB")" 0
ok "...nem no ranking, destaques e comentários" "$( (curl -s -H "$HS" $U/stats/ranking; curl -s -H "$HS" $U/home; curl -s -H "$HS" $U/teachers/$TID/comments) | grep -c "$PUB")" 0
ok "perfil do docente sem email nem userId" "$(curl -s -H "$HS" $U/teachers/$TID | grep -ci '"email"\|userId')" 0
ok "/me sem password nem códigos de recuperação" "$(curl -s -H "$HS" $U/me | grep -ci 'password\|resetCode')" 0
ok "listas de utilizadores do admin sem password" "$(curl -s -H "$HA" "$U/admin/users?q=pm$S" | grep -ci 'password\|resetCode')" 0
ok "erro 404 sem rasto de pilha" "$(curl -s -H "$HS" $U/teachers/$ID | grep -ci 'at \|node_modules\|prisma')" 0
ok "erro 500 improvável com injecção em pesquisa" "$(code -H "$HA" "$U/admin/students?q=%27%20OR%201%3D1%20--")" 200
ok "cabeçalho X-Powered-By ausente (helmet)" "$(curl -sI $U/health | grep -ci 'x-powered-by')" 0
ok "sem CORS aberto a qualquer origem" "$(curl -sI -H 'Origin: https://evil.example' $U/health | grep -ci 'access-control-allow-origin: \*')" 0

echo "-- docente: alcance"
OTHER=$(curl -s -H "$HA" "$U/teachers?pageSize=50" | jq_ "[t['id'] for t in d['items'] if t['id']!='$TID' and t['count']>0 and t['count']<5][0] if any(t['id']!='$TID' and 0<t['count']<5 for t in d['items']) else ''")
if [ -n "$OTHER" ]; then
  ok "docente vê comentários de OUTRO docente com poucas avaliações (só o próprio e os públicos)" "$(code -H "$HT" $U/teachers/$OTHER/comments)" 404
  ok "docente vê estatísticas de OUTRO docente com poucas avaliações (só o próprio e os públicos)" "$(code -H "$HT" $U/teachers/$OTHER/stats)" 404
else echo "AVISO: não há outro docente com 1–4 avaliações para testar o alcance do docente."; fi
exit ${FAIL:-0}
