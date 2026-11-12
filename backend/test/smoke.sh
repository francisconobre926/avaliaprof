#!/usr/bin/env bash
# Teste de fumo da API contra um servidor a correr.
# Uso: API=localhost:3102 LOG=api.log DBCMD='docker compose exec -T postgres psql -U avaliaprof -d avaliaprof -c' bash test/smoke.sh
# DBCMD (opcional) permite testar papéis e suspensão alterando a conta de teste directamente na base.
# Cria um utilizador novo por execução (sufixo aleatório). Precisa de curl e python3.
U=${API:-localhost:3000}; J='-H Content-Type:application/json'; S=$RANDOM$RANDOM
EMAIL="aluno$S@teste.com"; NUM="T${S:0:8}"; PW=senha1234
jq_() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
ok() { [ "$2" = "$3" ] && echo "OK   $1" || { echo "FALHA $1 (esperado $3, obtido $2)"; FAIL=1; }; }

# Hermético: apaga as contas de teste (aluno...@teste.com) no início e no fim.
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'aluno%@teste.com'); DELETE FROM users WHERE email LIKE 'aluno%@teste.com'" >/dev/null 2>&1
}
limpar; trap limpar EXIT
# O catálogo completo é do admin/docente; o estudante só vê os docentes das suas cadeiras (testado em smoke-admin.sh).
[ -z "$ADMIN_EMAIL" ] && [ -f .env ] && eval "$(grep -E '^ADMIN_(EMAIL|PASSWORD)=' .env)"
HA="Authorization: Bearer $(curl -s $J -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" $U/auth/login | jq_ "d['token']")"
CID=$(curl -s -H "$HA" $U/courses | jq_ "d[0]['id']")
ok "sem token => 401" "$(curl -s -o /dev/null -w '%{http_code}' $U/teachers)" 401
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CURX=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
TURX=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['semesterId']=='$CURX' and g['courseYear']==1][0]")
CIDX=$(echo "$OPT" | jq_ "[g['courseId'] for g in d['classGroups'] if g['id']=='$TURX'][0]")
ok "registo sem cadastro prévio => 403 (registo livre fechado)" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"studentNumber\":\"$NUM\",\"email\":\"$EMAIL\",\"password\":\"senha1234\"}" $U/auth/register)" 403
curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste\",\"studentNumber\":\"$NUM\",\"email\":\"$EMAIL\",\"courseId\":\"$CIDX\",\"courseYear\":1,\"semesterId\":\"$CURX\",\"classGroupId\":\"$TURX\"}" $U/admin/students
R=$(curl -s $J -d "{\"studentNumber\":\"$NUM\",\"email\":\"${EMAIL^^}\",\"password\":\"senha1234\"}" $U/auth/register)
TOKEN=$(echo "$R" | jq_ "d['token']"); H="Authorization: Bearer $TOKEN"
ok "registo devolve email normalizado" "$(echo "$R" | jq_ "d['user']['email']")" "$EMAIL"
ok "registo não expõe password" "$(echo "$R" | jq_ "'password' in d['user']")" False
ok "conta já activada => 409" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"studentNumber\":\"$NUM\",\"email\":\"$EMAIL\",\"password\":\"senha1234\"}" $U/auth/register)" 409
ok "senha sem letra => 400" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"studentNumber\":\"8$NUM\",\"email\":\"x$EMAIL\",\"password\":\"12345678\"}" $U/auth/register)" 400
ok "campo extra => 400" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"role\":\"ADMIN\",\"studentNumber\":\"7$NUM\",\"email\":\"y$EMAIL\",\"password\":\"senha1234\"}" $U/auth/register)" 400
ok "login errado => 401" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"password\":\"errada123\"}" $U/auth/login)" 401
ok "login ok => 200" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"password\":\"senha1234\"}" $U/auth/login)" 200
ok "/me devolve o papel STUDENT" "$(curl -s -H "$H" $U/me | jq_ "d['role']")" STUDENT
ok "PATCH /me altera o nome" "$(curl -s -X PATCH $J -H "$H" -d '{"name":"Nome Novo"}' $U/me | jq_ "d['name']")" "Nome Novo"
ok "PATCH /me ignora role (400)" "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH $J -H "$H" -d '{"role":"ADMIN"}' $U/me)" 400
ok "pesquisa por nome" "$(curl -s -H "$HA" "$U/teachers?q=COSSA" | jq_ "d['items'][0]['name']")" "Armando Cossa"
TOT=$(curl -s -H "$HA" "$U/teachers?pageSize=10" | jq_ "d['total']"); ULT=$(( (TOT-1)/10 ))
ok "paginação: última página tem o resto e hasMore=false" "$(curl -s -H "$HA" "$U/teachers?page=$ULT&pageSize=10" | jq_ "(len(d['items']), d['hasMore'])")" "($(( TOT-ULT*10 )), False)"
ok "pageSize acima do limite => 400" "$(curl -s -o /dev/null -w '%{http_code}' -H "$HA" "$U/teachers?pageSize=500")" 400
DIR=$(curl -s -H "$HA" $U/courses | jq_ "[c['id'] for c in d if c['name']=='Direito'][0]")
ok "filtro por curso (Direito) devolve só parte dos docentes" "$(curl -s -H "$HA" "$U/teachers?courseId=$DIR&pageSize=50" | jq_ "0 < d['total'] < $TOT")" True
TID=$(curl -s -H "$HA" "$U/teachers?pageSize=50" | jq_ "[t['id'] for t in d['items'] if t['count'] < 5][0]")
ok "detalhe: tem cadeiras" "$(curl -s -H "$HA" $U/teachers/$TID | jq_ "len(d['subjects'])>0")" True
ok "poucas avaliações => média oculta (anonimato)" "$(curl -s -H "$HA" $U/teachers/$TID | jq_ "(d['count'] < 5, d['average'])")" "(True, None)"
ok "id inválido => 400" "$(curl -s -o /dev/null -w '%{http_code}' -H "$HA" $U/teachers/xyz)" 400
ok "recuperação responde 200 mesmo sem conta" "$(curl -s -o /dev/null -w '%{http_code}' $J -d '{"email":"nao@existe.com"}' $U/auth/forgot)" 200
if [ -n "$LOG" ]; then
  curl -s $J -d "{\"email\":\"$EMAIL\"}" $U/auth/forgot >/dev/null; sleep 0.5
  CODE=$(grep -o "$EMAIL: [0-9]*" "$LOG" | tail -1 | grep -o '[0-9]*$')
  ok "reset com código errado => 400" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"code\":\"000000\",\"newPassword\":\"novasenha99\"}" $U/auth/reset)" 400
  ok "reset com código certo => 200" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\",\"newPassword\":\"novasenha99\"}" $U/auth/reset)" 200
  ok "código só serve uma vez => 400" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\",\"newPassword\":\"outra12345\"}" $U/auth/reset)" 400
  PW=novasenha99
  # Mudar a senha termina as sessões abertas: o token antigo deixa de valer e é preciso entrar de novo.
  ok "mudar a senha invalida o token antigo" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me)" 401
  TOKEN=$(curl -s $J -d "{\"email\":\"$EMAIL\",\"password\":\"novasenha99\"}" $U/auth/login | jq_ "d['token']"); H="Authorization: Bearer $TOKEN"
  ok "login com a nova senha" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"password\":\"novasenha99\"}" $U/auth/login)" 200
fi
echo "nao sou imagem" > /tmp/avaliaprof_x.jpg
ok "upload não-imagem => 400" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" -F photo=@/tmp/avaliaprof_x.jpg $U/me/photo)" 400
python3 -c "import base64;open('/tmp/avaliaprof_p.png','wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='))"
PH=$(curl -s -H "$H" -F photo=@/tmp/avaliaprof_p.png $U/me/photo | jq_ "d['photoUrl']")
ok "upload PNG válido e servido" "$(curl -s -o /dev/null -w '%{http_code}' $U$PH)" 200
ok "remover foto => photoUrl nulo" "$(curl -s -X DELETE -H "$H" $U/me/photo | jq_ "d['photoUrl']")" None
# ── Fase 3B / matrícula: o estudante só consulta ──
# O registo livre está fechado: para simular "sem matrícula" retira-se a matrícula directamente na base.
[ -n "$DBCMD" ] && $DBCMD "DELETE FROM student_subjects WHERE \"studentId\" IN (SELECT id FROM users WHERE email='$EMAIL'); DELETE FROM enrollments WHERE \"studentId\" IN (SELECT id FROM users WHERE email='$EMAIL')" >/dev/null 2>&1
SUBJ=$(curl -s -H "$H" $U/me/subjects)
ok "sem matrícula: não há cadeiras para mostrar" "$(echo "$SUBJ" | jq_ "(d['enrollment'], d['items'])")" "(None, [])"
ok "o estudante não pode alterar as cadeiras (PUT não existe)" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT $J -H "$H" -d '{"courseSubjectIds":[]}' $U/me/subjects)" 404
ok "lista global de cadeiras deixou de existir (/me/subjects/available)" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me/subjects/available)" 404
ok "estudante sem matrícula: não vê nenhum docente" "$(curl -s -H "$H" "$U/teachers?pageSize=50" | jq_ "(d['total'], d['items'])")" "(0, [])"
ok "estudante sem matrícula: filtros vazios" "$(curl -s -H "$H" $U/filters | jq_ "(d['subjects'], d['departments'])")" "([], [])"
ok "estudante sem matrícula: perfil de docente => 404" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/teachers/$TID)" 404
ok "estudante sem matrícula: estatísticas de docente => 404" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/teachers/$TID/stats)" 404
ok "estudante não acede a /admin/students => 403" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/admin/students)" 403
ok "período corrente: hora do servidor e estado aberto" "$(curl -s -H "$H" $U/periods/current | jq_ "(d['periods'][0]['open'], 'serverTime' in d)")" "(True, True)"
if [ -n "$DBCMD" ]; then
  $DBCMD "UPDATE users SET role='ADMIN' WHERE email='$EMAIL'" >/dev/null
  ok "admin não usa rotas de estudante (RBAC) => 403" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me/subjects)" 403
  ok "admin acede a /admin/students => 200" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/admin/students)" 200
  $DBCMD "UPDATE users SET role='TEACHER' WHERE email='$EMAIL'" >/dev/null
  ok "docente não usa rotas de estudante (RBAC) => 403" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me/subjects)" 403
  ok "docente não acede a /admin/students => 403" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/admin/students)" 403
  $DBCMD "UPDATE users SET role='STUDENT', status='SUSPENDED' WHERE email='$EMAIL'" >/dev/null
  ok "conta suspensa: token deixa de servir => 401" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me)" 401
  ok "conta suspensa: login recusado => 403" "$(curl -s -o /dev/null -w '%{http_code}' $J -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}" $U/auth/login)" 403
  $DBCMD "UPDATE users SET status='ACTIVE' WHERE email='$EMAIL'" >/dev/null
  ok "reactivada: volta a ter acesso" "$(curl -s -o /dev/null -w '%{http_code}' -H "$H" $U/me)" 200
fi
exit ${FAIL:-0}
