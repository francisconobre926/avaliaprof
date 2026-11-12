#!/usr/bin/env bash
# Endurecimento da autenticação: bloqueio por conta, códigos com limite de tentativas, renovação de sessão,
# terminar sessão, mudança de senha e registo de auditoria.
# Uso: API=localhost:3106 LOG=/tmp/api3106.log DBCMD='docker exec -i avaliaprof-postgres-1 psql -U avaliaprof -d avaliaprof -c' bash test/smoke-auth.sh
source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
[ -n "$LOG" ] && [ -n "$DBCMD" ] || { echo "LOG e DBCMD são necessários"; exit 2; }
limpar() { $DBCMD "UPDATE teachers SET \"userId\"=NULL WHERE \"userId\" IN (SELECT id FROM users WHERE email LIKE 'ah%@teste.com'); DELETE FROM users WHERE email LIKE 'ah%@teste.com'" >/dev/null 2>&1; }
limpar; trap limpar EXIT
TA=$(admin_token); HA=$(auth $TA)
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
TURMA=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
mk() { # n -> resposta completa do registo
  local num="T${S:0:6}h$1" em="ah$S$1@teste.com"
  curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste$1\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$INF\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$TURMA\"}" $U/admin/students
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register
}
login() { curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"ah$S$1@teste.com\",\"password\":\"$2\"}" $U/auth/login; }

echo "-- bloqueio por conta"
R1=$(mk 1)
for i in 1 2 3 4; do login 1 errada123 >/dev/null; done
ok "4 falhas ainda não bloqueiam" "$(login 1 senha1234)" 200
for i in 1 2 3 4 5; do login 1 errada123 >/dev/null; done
ok "à 5.ª falha seguida a conta fica bloqueada (mesmo com a senha certa) => 429" "$(login 1 senha1234)" 429
ok "o bloqueio devolve o código CONTA_BLOQUEADA" "$(curl -s $J -d "{\"email\":\"ah${S}1@teste.com\",\"password\":\"senha1234\"}" $U/auth/login | jq_ "d['code']")" CONTA_BLOQUEADA
$DBCMD "UPDATE users SET \"lockedUntil\"=NULL WHERE email='ah${S}1@teste.com'" >/dev/null
ok "passado o bloqueio, a senha certa entra" "$(login 1 senha1234)" 200
login 1 errada123 >/dev/null; login 1 senha1234 >/dev/null
ok "um login certo repõe o contador" "$($DBCMD "select \"loginFailures\" from users where email='ah${S}1@teste.com'" | sed -n 3p | tr -d ' ')" 0
ok "email inexistente continua a dar 401 (sem bloqueio nem pistas)" "$(code $J -d '{"email":"ah-nao-existe@teste.com","password":"x12345678"}' $U/auth/login)" 401

echo "-- renovação de sessão"
R=$(mk 2); AT=$(echo "$R" | jq_ "d['token']"); RT=$(echo "$R" | jq_ "d['refreshToken']")
ok "o registo devolve token de acesso e de renovação" "$(echo "$R" | jq_ "(len(d['token'])>20, len(d['refreshToken'])>40)")" "(True, True)"
ok "o token de acesso é curto (30 min por defeito)" "$(python3 -c "
import base64,json
t='$AT'.split('.')[1]; t+='='*(-len(t)%4); p=json.loads(base64.urlsafe_b64decode(t)); print(p['exp']-p['iat']<=1800)")" True
ok "o token de acesso funciona" "$(code -H "$(auth $AT)" $U/me)" 200
N=$(curl -s $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/refresh)
AT2=$(echo "$N" | jq_ "d['token']"); RT2=$(echo "$N" | jq_ "d['refreshToken']")
ok "renovar devolve um novo par" "$(echo "$N" | jq_ "(d['refreshToken']!='$RT', d['user']['role'])")" "(True, 'STUDENT')"
ok "o novo token de acesso funciona" "$(code -H "$(auth $AT2)" $U/me)" 200
ok "refresh com token inventado => 401" "$(code $J -d '{"refreshToken":"abcdefghijklmnopqrstuvwxyz0123456789"}' $U/auth/refresh)" 401
ok "refresh curto demais => 400" "$(code $J -d '{"refreshToken":"x"}' $U/auth/refresh)" 400
ok "reutilizar um token de renovação já usado => 401" "$(code $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/refresh)" 401
ok "...e revoga a sessão toda (suspeita de roubo): o token novo deixa de renovar" "$(code $J -d "{\"refreshToken\":\"$RT2\"}" $U/auth/refresh)" 401
ok "...e os tokens de acesso emitidos deixam de valer" "$(code -H "$(auth $AT2)" $U/me)" 401

echo "-- terminar sessão"
R=$(mk 3); AT=$(echo "$R" | jq_ "d['token']"); RT=$(echo "$R" | jq_ "d['refreshToken']")
ok "logout sem sessão => 401" "$(code -X POST $J -d '{}' $U/auth/logout)" 401
ok "logout deste dispositivo => 200" "$(code -X POST -H "$(auth $AT)" $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/logout)" 200
ok "depois do logout o token de renovação não serve (401)" "$(code $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/refresh)" 401
L=$(curl -s $J -d "{\"email\":\"ah${S}3@teste.com\",\"password\":\"senha1234\"}" $U/auth/login); ATL=$(echo "$L" | jq_ "d['token']"); RTL=$(echo "$L" | jq_ "d['refreshToken']")
ok "terminar sessão em todo o lado => 200" "$(code -X POST -H "$(auth $ATL)" $U/auth/logout-all)" 200
ok "...o token de acesso deixa de valer" "$(code -H "$(auth $ATL)" $U/me)" 401
ok "...e o de renovação também" "$(code $J -d "{\"refreshToken\":\"$RTL\"}" $U/auth/refresh)" 401

echo "-- recuperação de senha: limite de tentativas e fim das sessões"
R=$(mk 4); AT=$(echo "$R" | jq_ "d['token']"); RT=$(echo "$R" | jq_ "d['refreshToken']"); EM="ah${S}4@teste.com"
codigo() { curl -s -o /dev/null $J -d "{\"email\":\"$EM\"}" $U/auth/forgot; sleep 0.5; grep -o "$EM: [0-9]*" "$LOG" | tail -1 | grep -o '[0-9]*$'; }
reset() { code $J -d "{\"email\":\"$EM\",\"code\":\"$1\",\"newPassword\":\"novasenha99\"}" $U/auth/reset; }
C=$(codigo)
for i in 1 2 3 4 5; do reset 000000 >/dev/null; done
ok "5 códigos errados invalidam o código (o certo já não serve) => 400" "$(reset $C)" 400
C=$(codigo)
ok "novo código funciona => 200" "$(reset $C)" 200
ok "mudar a senha termina as sessões: acesso antigo => 401" "$(code -H "$(auth $AT)" $U/me)" 401
ok "...e o token de renovação antigo => 401" "$(code $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/refresh)" 401
ok "a senha nova entra" "$(code $J -d "{\"email\":\"$EM\",\"password\":\"novasenha99\"}" $U/auth/login)" 200

echo "-- perfil: alterar senha e campos protegidos"
R=$(mk 5); AT=$(echo "$R" | jq_ "d['token']"); RT=$(echo "$R" | jq_ "d['refreshToken']"); H5=$(auth $AT)
ok "o estudante não muda o próprio curso (400)" "$(code -X PATCH -H "$H5" $J -d "{\"courseId\":\"$INF\"}" $U/me)" 400
ok "senha actual errada => 400 SENHA_ACTUAL" "$(curl -s -H "$H5" $J -d '{"currentPassword":"errada123","newPassword":"outra12345"}' $U/me/password | jq_ "d['code']")" SENHA_ACTUAL
ok "nova senha igual à actual => 400" "$(code -H "$H5" $J -d '{"currentPassword":"senha1234","newPassword":"senha1234"}' $U/me/password)" 400
ok "nova senha fraca => 400" "$(code -H "$H5" $J -d '{"currentPassword":"senha1234","newPassword":"12345678"}' $U/me/password)" 400
ok "alterar senha sem sessão => 401" "$(code $J -d '{"currentPassword":"senha1234","newPassword":"outra12345"}' $U/me/password)" 401
NP=$(curl -s -H "$H5" $J -d '{"currentPassword":"senha1234","newPassword":"outra12345"}' $U/me/password)
ok "alterar senha devolve tokens novos para este dispositivo" "$(code -H "$(auth $(echo "$NP" | jq_ "d['token']"))" $U/me)" 200
ok "...o token antigo deixa de valer" "$(code -H "$H5" $U/me)" 401
ok "...e o de renovação antigo também" "$(code $J -d "{\"refreshToken\":\"$RT\"}" $U/auth/refresh)" 401
ok "a senha antiga já não entra" "$(login 5 senha1234)" 401
ok "a senha nova entra" "$(login 5 outra12345)" 200

echo "-- convite de docente: limite de tentativas"
STR=$(curl -s -H "$HA" $U/admin/structure)
TID=$(echo "$STR" | jq_ "[t['id'] for t in d['teachers'] if t['account'] is None][0]")
CODE=$(curl -s -H "$HA" $J -d "{\"email\":\"ah${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite | jq_ "d['code']")
for i in 1 2 3 4 5; do code $J -d "{\"email\":\"ah${S}doc@teste.com\",\"code\":\"AAAAAAAA\",\"password\":\"senha1234\"}" $U/auth/activate-teacher >/dev/null; done
ok "5 códigos de convite errados invalidam o convite => 400" "$(code $J -d "{\"email\":\"ah${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"senha1234\"}" $U/auth/activate-teacher)" 400
CODE=$(curl -s -H "$HA" $J -d "{\"email\":\"ah${S}doc@teste.com\"}" $U/admin/teachers/$TID/invite | jq_ "d['code']")
ok "novo convite funciona => 200" "$(code $J -d "{\"email\":\"ah${S}doc@teste.com\",\"code\":\"$CODE\",\"password\":\"senha1234\"}" $U/auth/activate-teacher)" 200

HTD=$(auth $(curl -s $J -d "{\"email\":\"ah${S}doc@teste.com\",\"password\":\"senha1234\"}" $U/auth/login | jq_ "d['token']"))
ok "o docente não muda o próprio nome (403)" "$(code -X PATCH -H "$HTD" $J -d '{"name":"Outro Nome"}' $U/me)" 403
python3 -c "import base64;open('/tmp/avaliaprof_p.png','wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='))"
PH=$(curl -s -H "$HTD" -F photo=@/tmp/avaliaprof_p.png $U/me/photo | jq_ "d['photoUrl']")
ok "a fotografia do docente passa a ser a do seu perfil público" "$(curl -s -H "$HA" $U/teachers/$TID | jq_ "d['photoUrl']")" "$PH"
ok "remover a fotografia também a tira do perfil público" "$(curl -s -X DELETE -H "$HTD" $U/me/photo >/dev/null; curl -s -H "$HA" $U/teachers/$TID | jq_ "d['photoUrl']")" None

echo "-- auditoria das acções do admin"
AU=$(curl -s -H "$HA" "$U/admin/audit")
ok "criar estudante fica registado" "$(echo "$AU" | jq_ "any(a['action']=='ESTUDANTE_CRIADO' for a in d['items'])")" True
ok "o registo não guarda dados pessoais" "$(echo "$AU" | grep -ci '@teste.com\|studentNumber\|Aluno Teste')" 0
exit ${FAIL:-0}
