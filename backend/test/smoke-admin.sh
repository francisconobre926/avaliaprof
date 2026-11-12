#!/usr/bin/env bash
# Gestão de estudantes e turmas (só admin), matrícula e vista do estudante.
# Uso: API=localhost:3102 DBCMD='docker compose exec -T postgres psql -U avaliaprof -d avaliaprof -c' bash test/smoke-admin.sh
# Precisa de ADMIN_EMAIL/ADMIN_PASSWORD (lidos de .env). Cria dados com prefixo de teste e apaga-os no fim.
source test/lib.sh
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'adm%@teste.com'); DELETE FROM users WHERE email LIKE 'adm%@teste.com'; DELETE FROM class_groups WHERE name IN ('Info3Lab2P','Info4Lab2P','Info2Lab2P') AND id NOT IN (SELECT \"classGroupId\" FROM enrollments)" >/dev/null 2>&1
}
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
limpar; trap limpar EXIT
TA=$(admin_token); HA=$(auth $TA)

echo "-- RBAC"
ok "sem token => 401" "$(code $U/admin/students)" 401
CIDX=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "d['courses'][0]['id']")
CURX=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
TURX=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$CIDX' and g['semesterId']=='$CURX'][0]")
YX=$(curl -s -H "$HA" $U/admin/academic-options | jq_ "[g['courseYear'] for g in d['classGroups'] if g['id']=='$TURX'][0]")
curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Livre\",\"studentNumber\":\"T${S:0:6}99\",\"email\":\"adm${S}livre@teste.com\",\"courseId\":\"$CIDX\",\"courseYear\":$YX,\"semesterId\":\"$CURX\",\"classGroupId\":\"$TURX\"}" $U/admin/students
R=$(curl -s $J -d "{\"studentNumber\":\"T${S:0:6}99\",\"email\":\"adm${S}livre@teste.com\",\"password\":\"senha1234\"}" $U/auth/register)
ok "registo livre fechado: quem não consta no cadastro => 403" "$(code $J -d "{\"studentNumber\":\"T${S:0:6}98\",\"email\":\"adm${S}intruso@teste.com\",\"password\":\"senha1234\"}" $U/auth/register)" 403
HL=$(auth $(echo "$R" | jq_ "d['token']"))
ok "estudante não gere estudantes => 403" "$(code -H "$HL" $U/admin/students)" 403
ok "estudante não gere turmas => 403" "$(code -H "$HL" $U/admin/class-groups)" 403
ok "estudante não cria turmas => 403" "$(code -H "$HL" $J -d '{}' $U/admin/class-groups)" 403
ok "estudante não vê as opções académicas => 403" "$(code -H "$HL" $U/admin/academic-options)" 403
ok "admin vê as opções => 200" "$(code -H "$HA" $U/admin/academic-options)" 200

OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
DIR=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Direito'][0]")
ok "anos curriculares vêm das cadeiras existentes" "$(echo "$OPT" | jq_ "[c for c in d['courses'] if c['id']=='$INF'][0]['years']")" "[1, 2, 3, 4]"

echo "-- turmas"
# As turmas de teste são pós-laborais dos anos 3 e 4 (e 2) de Informática, que o seed não cria: Info3Lab2P, Info4Lab2P, Info2Lab2P.
G=Info3Lab2P; G3N=Info4Lab2P
NEW=$(curl -s -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":3,\"semesterId\":\"$CUR\",\"regime\":\"POS_LABORAL\"}" $U/admin/class-groups)
GID=$(echo "$NEW" | jq_ "d['id']")
ok "criar turma => id" "$([ -n "$GID" ] && echo sim)" sim
ok "turma duplicada => 409" "$(code -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":3,\"semesterId\":\"$CUR\",\"regime\":\"POS_LABORAL\"}" $U/admin/class-groups)" 409
ok "ano sem cadeiras => 400" "$(code -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":9,\"semesterId\":\"$CUR\",\"regime\":\"POS_LABORAL\"}" $U/admin/class-groups)" 400
ok "regime inválido => 400" "$(code -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":3,\"semesterId\":\"$CUR\",\"regime\":\"NOITE\"}" $U/admin/class-groups)" 400
ok "o nome é gerado pelo servidor (curso, ano, semestre, regime)" "$(echo "$NEW" | jq_ "d['name']")" "$G"
ok "a turma não pode ser renomeada à mão (PATCH não existe)" "$(code -X PATCH -H "$HA" $J -d '{"name":"X"}' $U/admin/class-groups/$GID)" 404
ok "listar turmas com contagem de estudantes" "$(curl -s -H "$HA" "$U/admin/class-groups?courseId=$INF" | jq_ "[g['students'] for g in d['items'] if g['id']=='$GID'][0]")" 0
G2=$(curl -s -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":2,\"semesterId\":\"$CUR\",\"regime\":\"POS_LABORAL\"}" $U/admin/class-groups | jq_ "d['id']")
ok "apagar turma vazia => 200" "$(code -X DELETE -H "$HA" $U/admin/class-groups/$G2)" 200

echo "-- cadastro manual de estudante"
NUM="T${S:0:6}01"; EM="adm${S}1@teste.com"
mk() { echo "{\"name\":\"$1\",\"studentNumber\":\"$2\",\"email\":\"$3\",\"courseId\":\"$INF\",\"courseYear\":${4:-3},\"semesterId\":\"$CUR\",\"classGroupId\":\"${5:-$GID}\"${6}}"; }
R=$(curl -s -w '\n%{http_code}' -H "$HA" $J -d "$(mk 'Maria Teste' $NUM ${EM^^})" $U/admin/students)
ok "criar estudante => 201" "$(echo "$R" | tail -1)" 201
B=$(echo "$R" | head -1); SID=$(echo "$B" | jq_ "d['id']")
ok "conta fica pendente (sem senha)" "$(echo "$B" | jq_ "d['accountStatus']")" PENDING
ok "email normalizado" "$(echo "$B" | jq_ "d['email']")" "$EM"
ok "matrícula activa na turma, curso e ano" "$(echo "$B" | jq_ "(d['enrollment']['status'], d['enrollment']['classGroup']['name'], d['enrollment']['courseYear'], d['course']['name'])")" "('ACTIVE', '${G}', 3, 'Engenharia Informática')"
ok "cadeiras do 3.º ano e semestre da turma associadas (AUTO)" "$(echo "$B" | jq_ "(len(d['subjects'])>0, all(s['source']=='AUTO' and s['courseYear']==3 for s in d['subjects']))")" "(True, True)"
ok "email duplicado => 409" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' T${S:0:6}02 $EM)" $U/admin/students)" 409
ok "número duplicado => 409" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' $NUM adm${S}x@teste.com)" $U/admin/students)" 409
ok "número inválido => 400" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' 12 adm${S}y@teste.com)" $U/admin/students)" 400
ok "email inválido => 400" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' T${S:0:6}03 nao-e-email)" $U/admin/students)" 400
ok "nome curto => 400" "$(code -H "$HA" $J -d "$(mk 'Ab' T${S:0:6}03 adm${S}z@teste.com)" $U/admin/students)" 400
ok "turma de outro ano (inconsistente) => 400" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' T${S:0:6}04 adm${S}w@teste.com 2)" $U/admin/students)" 400
ok "turma de outro curso (inconsistente) => 400" "$(code -H "$HA" $J -d "{\"name\":\"Outra Pessoa\",\"studentNumber\":\"T${S:0:6}05\",\"email\":\"adm${S}v@teste.com\",\"courseId\":\"$DIR\",\"courseYear\":1,\"semesterId\":\"$CUR\",\"classGroupId\":\"$GID\"}" $U/admin/students)" 400
ok "campo desconhecido => 400" "$(code -H "$HA" $J -d "$(mk 'Outra Pessoa' T${S:0:6}06 adm${S}u@teste.com 3 $GID ',"role":"ADMIN"')" $U/admin/students)" 400
ok "estudante inactivo à partida" "$(curl -s -H "$HA" $J -d "$(mk 'Joao Inativo' T${S:0:6}07 adm${S}2@teste.com 3 $GID ',"status":"INACTIVE"')" $U/admin/students | jq_ "d['enrollment']['status']")" INACTIVE

echo "-- consulta, pesquisa e paginação"
ok "pesquisa por nome" "$(curl -s -H "$HA" "$U/admin/students?q=maria%20teste" | jq_ "[i['studentNumber'] for i in d['items']]")" "['$NUM']"
ok "pesquisa por número" "$(curl -s -H "$HA" "$U/admin/students?q=$NUM" | jq_ "d['total']")" 1
ok "filtro por turma" "$(curl -s -H "$HA" "$U/admin/students?classGroupId=$GID" | jq_ "d['total']")" 2
ok "filtro por estado da matrícula" "$(curl -s -H "$HA" "$U/admin/students?classGroupId=$GID&status=INACTIVE" | jq_ "[i['name'] for i in d['items']]")" "['Joao Inativo']"
ok "paginação respeita pageSize" "$(curl -s -H "$HA" "$U/admin/students?pageSize=2" | jq_ "(len(d['items']), d['hasMore'])")" "(2, True)"
ok "pageSize excessivo => 400" "$(code -H "$HA" "$U/admin/students?pageSize=500")" 400
ok "detalhe de estudante" "$(curl -s -H "$HA" $U/admin/students/$SID | jq_ "d['name']")" "Maria Teste"
ok "detalhe inexistente => 404" "$(code -H "$HA" $U/admin/students/$(uuid))" 404
ok "a resposta nunca inclui a senha" "$(curl -s -H "$HA" $U/admin/students/$SID | grep -ci 'password\|resetCode')" 0

echo "-- actualizar, mudar de turma, activar/desactivar"
ok "actualizar nome" "$(curl -s -X PATCH -H "$HA" $J -d '{"name":"Maria Alterada"}' $U/admin/students/$SID | jq_ "d['name']")" "Maria Alterada"
ok "mudar para número já existente => 409" "$(code -X PATCH -H "$HA" $J -d "{\"studentNumber\":\"T${S:0:6}07\"}" $U/admin/students/$SID)" 409
ok "mudar curso sem turma => 400" "$(code -X PATCH -H "$HA" $J -d "{\"courseYear\":4}" $U/admin/students/$SID)" 400
G3=$(curl -s -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":4,\"semesterId\":\"$CUR\",\"regime\":\"POS_LABORAL\"}" $U/admin/class-groups | jq_ "d['id']")
MV=$(curl -s -X PATCH -H "$HA" $J -d "{\"courseId\":\"$INF\",\"courseYear\":4,\"semesterId\":\"$CUR\",\"classGroupId\":\"$G3\"}" $U/admin/students/$SID)
ok "mudar para a turma do 4.º ano troca as cadeiras AUTO (passam a ser do 4.º ano)" "$(echo "$MV" | jq_ "(len(d['subjects'])>0, all(s['source']=='AUTO' and s['courseYear']==4 for s in d['subjects']))")" "(True, True)"
N2=$(echo "$MV" | jq_ "len(d['subjects'])")
ok "desactivar matrícula" "$(curl -s -X PATCH -H "$HA" $J -d '{"status":"INACTIVE"}' $U/admin/students/$SID/enrollment | jq_ "d['enrollment']['status']")" INACTIVE
ok "estado inválido => 400" "$(code -X PATCH -H "$HA" $J -d '{"status":"X"}' $U/admin/students/$SID/enrollment)" 400
ok "reactivar matrícula" "$(curl -s -X PATCH -H "$HA" $J -d '{"status":"ACTIVE"}' $U/admin/students/$SID/enrollment | jq_ "d['enrollment']['status']")" ACTIVE
ok "apagar turma com estudantes => 409" "$(code -X DELETE -H "$HA" $U/admin/class-groups/$G3)" 409

echo "-- cadeiras associadas manualmente (ex.: cadeira em atraso)"
AVS=$(curl -s -H "$HA" $U/admin/students/$SID/available-subjects)
CUR_IDS=$(curl -s -H "$HA" $U/admin/students/$SID | jq_ "[s['courseSubjectId'] for s in d['subjects']]")
ok "candidatas existem e excluem as já associadas" "$(echo "$AVS" | jq_ "(len(d['items'])>0, all(i['courseSubjectId'] not in $CUR_IDS for i in d['items']))")" "(True, True)"
CSP2=$(echo "$AVS" | jq_ "d['items'][0]['courseSubjectId']")
ASS=$(curl -s -H "$HA" $J -d "{\"courseSubjectId\":\"$CSP2\"}" $U/admin/students/$SID/subjects)
ok "associar cadeira manualmente (origem MANUAL, +1 cadeira)" "$(echo "$ASS" | jq_ "(len(d['subjects'])==$N2+1, [s['source'] for s in d['subjects'] if s['courseSubjectId']=='$CSP2'])")" "(True, ['MANUAL'])"
ok "cadeira inexistente ou de outro curso => 400" "$(code -H "$HA" $J -d "{\"courseSubjectId\":\"$(curl -s -H "$HA" $U/admin/students/$SID | jq_ "'00000000-0000-4000-8000-000000000000'")\"}" $U/admin/students/$SID/subjects)" 400
ok "remover cadeira" "$(curl -s -X DELETE -H "$HA" $U/admin/students/$SID/subjects/$CSP2 | jq_ "len(d['subjects'])==$N2")" True
ok "remover cadeira inexistente => 404" "$(code -X DELETE -H "$HA" $U/admin/students/$SID/subjects/$CSP2)" 404

echo "-- activação da conta e vista do estudante"
reg() { curl -s $J -d "{\"studentNumber\":\"$2\",\"email\":\"$3\",\"password\":\"senha1234\"}" $U/auth/register; }
ok "login antes de activar => 401" "$(code $J -d "{\"email\":\"$EM\",\"password\":\"senha1234\"}" $U/auth/login)" 401
ok "registo com o email do cadastro mas outro número => 403" "$(code $J -d "{\"studentNumber\":\"T${S:0:6}55\",\"email\":\"$EM\",\"password\":\"senha1234\"}" $U/auth/register)" 403
ACT=$(reg "Maria Teste" $NUM $EM)
ok "registo com email e número do cadastro activa a conta" "$(echo "$ACT" | jq_ "d['user']['name']")" "Maria Alterada"
ok "...e o login passa a funcionar" "$(code $J -d "{\"email\":\"$EM\",\"password\":\"senha1234\"}" $U/auth/login)" 200
ok "conta activa no cadastro" "$(curl -s -H "$HA" $U/admin/students/$SID | jq_ "d['accountStatus']")" ACTIVE
ok "segundo registo com os mesmos dados => 409" "$(code $J -d "{\"studentNumber\":\"$NUM\",\"email\":\"$EM\",\"password\":\"outra12345\"}" $U/auth/register)" 409
HS=$(auth $(echo "$ACT" | jq_ "d['token']"))
ME=$(curl -s -H "$HS" $U/me/subjects)
ok "estudante vê só as cadeiras da sua turma (4.º ano)" "$(echo "$ME" | jq_ "(len(d['items'])==$N2, all(i['courseYear']==4 for i in d['items']))")" "(True, True)"
ok "...cada uma com os seus docentes" "$(echo "$ME" | jq_ "all(len(i['teachers'])>0 for i in d['items'])")" True
ok "...e a turma, ano e curso" "$(echo "$ME" | jq_ "(d['enrollment']['classGroup']['name'], d['enrollment']['courseYear'], d['enrollment']['course']['name'])")" "('$G3N', 4, 'Engenharia Informática')"

echo "-- o estudante só vê os docentes que lhe dão aulas"
TIDS=$(echo "$ME" | jq_ "sorted(set(t['id'] for i in d['items'] for t in i['teachers']))")
LIST=$(curl -s -H "$HS" "$U/teachers?pageSize=50")
ok "a lista é exactamente os docentes das suas cadeiras" "$(echo "$LIST" | jq_ "sorted(t['id'] for t in d['items'])==$TIDS")" True
TOTAL_ADMIN=$(curl -s -H "$HA" "$U/teachers?pageSize=1" | jq_ "d['total']")
ok "o admin vê muitos mais (todos os docentes)" "$(echo "$LIST" | jq_ "d['total'] < $TOTAL_ADMIN")" True
# FORA: docente que não lhe dá aulas e ainda sem amostra pública (poucas avaliações)
FORA=$(curl -s -H "$HA" "$U/teachers?pageSize=50" | jq_ "[t for t in d['items'] if t['id'] not in $TIDS and t['count'] < 5][0]['id']")
POP=$(curl -s -H "$HA" "$U/teachers?pageSize=50" | jq_ "([t for t in d['items'] if t['id'] not in $TIDS and t['count'] >= 5] or [{'id':''}])[0]['id']")
FORA_NOME=$(curl -s -H "$HA" $U/teachers/$FORA | jq_ "d['name']")
ok "pesquisar um docente que não lhe dá aulas não devolve nada" "$(curl -s -H "$HS" "$U/teachers?q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$FORA_NOME")" | jq_ "d['total']")" 0
ok "perfil de docente que não lhe dá aulas e com poucas avaliações => 404" "$(code -H "$HS" $U/teachers/$FORA)" 404
ok "...estatísticas => 404" "$(code -H "$HS" $U/teachers/$FORA/stats)" 404
ok "...comentários => 404" "$(code -H "$HS" $U/teachers/$FORA/comments)" 404
ok "perfil de docente que lhe dá aulas => 200" "$(code -H "$HS" $U/teachers/$(python3 -c "print($TIDS[0])"))" 200
ok "estatísticas desse docente => 200" "$(code -H "$HS" $U/teachers/$(python3 -c "print($TIDS[0])")/stats)" 200
FIL=$(curl -s -H "$HS" $U/filters)
ok "filtros: só o seu curso" "$(echo "$FIL" | jq_ "[c['name'] for c in d['courses']]")" "['Engenharia Informática']"
ok "filtros: só as suas cadeiras" "$(echo "$FIL" | jq_ "len(d['subjects'])==$(echo "$ME" | jq_ "len(d['items'])")")" True
ok "filtros: departamentos só dos seus docentes" "$(echo "$FIL" | jq_ "len(d['departments']) < $(curl -s -H "$HA" $U/filters | jq_ "len(d['departments'])")+1")" True
if [ -n "$POP" ]; then
  ok "docente popular (com amostra) de outro ano: perfil visível => 200" "$(code -H "$HS" $U/teachers/$POP)" 200
  ok "...estatísticas visíveis => 200" "$(code -H "$HS" $U/teachers/$POP/stats)" 200
  ok "...comentários visíveis => 200" "$(code -H "$HS" $U/teachers/$POP/comments)" 200
  ok "...mas continua fora da lista de professores do estudante" "$(curl -s -H "$HS" "$U/teachers?pageSize=50" | jq_ "'$POP' in [t['id'] for t in d['items']]")" False
  ok "...e não pode avaliá-lo (sem cadeiras em comum)" "$(curl -s -H "$HS" $U/teachers/$POP/eligibility | jq_ "d['items']")" "[]"
fi
ok "docente/admin continuam a ver o catálogo todo" "$(code -H "$HA" $U/teachers/$FORA)" 200

TEACH=$(echo "$ME" | jq_ "[i for i in d['items'] if i['teachers']][0]['teachers'][0]['id']"); CSM=$(echo "$ME" | jq_ "[i for i in d['items'] if i['teachers']][0]['courseSubjectId']")
ev() { echo "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TEACH\",\"courseSubjectId\":\"$CSM\",\"scores\":{\"clarity\":4,\"punctuality\":4,\"availability\":4,\"mastery\":4,\"fairness\":4}}"; }
ok "avaliar com matrícula activa => 201" "$(code -H "$HS" $J -d "$(ev)" $U/evaluations)" 201
curl -s -X PATCH -H "$HA" $J -d '{"status":"INACTIVE"}' $U/admin/students/$SID/enrollment >/dev/null
ok "matrícula inactiva: também não vê docentes" "$(curl -s -H "$HS" "$U/teachers?pageSize=50" | jq_ "d['total']")" 0
ok "matrícula inactiva: sem cadeiras" "$(curl -s -H "$HS" $U/me/subjects | jq_ "(d['enrollment']['status'], d['items'])")" "('INACTIVE', [])"
ok "matrícula inactiva: não avalia => 403 MATRICULA_INACTIVA" "$(curl -s -H "$HS" $J -d "$(ev)" $U/evaluations | jq_ "d['code']")" MATRICULA_INACTIVA
curl -s -X PATCH -H "$HA" $J -d '{"status":"ACTIVE"}' $U/admin/students/$SID/enrollment >/dev/null
ok "reactivada: volta a ver as cadeiras" "$(curl -s -H "$HS" $U/me/subjects | jq_ "len(d['items'])==$N2")" True
[ -n "$DBCMD" ] && $DBCMD "DELETE FROM student_subjects WHERE \"studentId\" IN (SELECT id FROM users WHERE email='adm${S}livre@teste.com'); DELETE FROM enrollments WHERE \"studentId\" IN (SELECT id FROM users WHERE email='adm${S}livre@teste.com')" >/dev/null 2>&1
ok "sem matrícula: não avalia => 403 NAO_MATRICULADO" "$(curl -s -H "$HL" $J -d "$(ev)" $U/evaluations | jq_ "d['code']")" NAO_MATRICULADO
ok "admin não avalia => 403" "$(code -H "$HA" $J -d "$(ev)" $U/evaluations)" 403

echo "-- turma: ver os estudantes e adicionar um ou vários"
DET=$(curl -s -H "$HA" $U/admin/class-groups/$G3)
ok "detalhe da turma lista os seus estudantes" "$(echo "$DET" | jq_ "('$SID' in [x['id'] for x in d['students']], d['courseYear'], d['course']['name'])")" "(True, 4, 'Engenharia Informática')"
ok "detalhe de turma inexistente => 404" "$(code -H "$HA" $U/admin/class-groups/$(uuid))" 404
mkp() { curl -s -H "$HA" $J -d "{\"name\":\"$1\",\"studentNumber\":\"T${S:0:6}$2\",\"email\":\"adm${S}$2@teste.com\",\"courseId\":\"${4:-$INF}\",\"courseYear\":$([ -n "$4" ] && echo 1 || echo 3),\"semesterId\":\"$CUR\",\"classGroupId\":\"${5:-$GID}\"$3}" $U/admin/students | jq_ "d['id']"; }
P1=$(mkp 'Pedro Candidato' 31); P2=$(mkp 'Paula Candidata' 32); P5=$(mkp 'Pia Candidata' 35)
P3=$(mkp 'Rui Candidato Inativo' 33 ',"status":"INACTIVE"')
DGID=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$DIR' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
P4=$(mkp 'Dora Candidata' 34 '' $DIR $DGID)
CAND=$(curl -s -H "$HA" "$U/admin/class-groups/$G3/candidates?q=Candidat&pageSize=50")
ok "candidatos: só do mesmo curso e com matrícula activa" "$(echo "$CAND" | jq_ "[x['name'] for x in d['items']]")" "['Paula Candidata', 'Pedro Candidato', 'Pia Candidata']"
ok "candidatos indicam a turma actual" "$(echo "$CAND" | jq_ "d['items'][0]['currentGroup']")" "{'name': '${G}', 'courseYear': 3}"
ok "quem já está na turma não é candidato" "$(curl -s -H "$HA" "$U/admin/class-groups/$G3/candidates?q=Maria%20Alterada" | jq_ "d['total']")" 0
ok "candidatos paginados" "$(curl -s -H "$HA" "$U/admin/class-groups/$G3/candidates?q=Candidat&pageSize=2" | jq_ "(len(d['items']), d['total'], d['hasMore'])")" "(2, 3, True)"
ok "pageSize excessivo nos candidatos => 400" "$(code -H "$HA" "$U/admin/class-groups/$G3/candidates?pageSize=500")" 400
grp() { curl -s -H "$HA" $U/admin/students/$1 | jq_ "d['enrollment']['classGroup']['name']"; }
add() { curl -s -w '\n%{http_code}' -H "$HA" $J -d "$1" $U/admin/class-groups/$G3/students; }
ok "matrícula inactiva não pode ser adicionada => 400" "$(add "{\"studentIds\":[\"$P3\"]}" | tail -1)" 400
ok "...com o motivo MATRICULA_INACTIVA" "$(add "{\"studentIds\":[\"$P3\"]}" | head -1 | jq_ "d['invalid'][0]['reason']")" MATRICULA_INACTIVA
ok "estudante de outro curso => 400 OUTRO_CURSO" "$(add "{\"studentIds\":[\"$P4\"]}" | head -1 | jq_ "d['invalid'][0]['reason']")" OUTRO_CURSO
ok "id desconhecido => 400 SEM_MATRICULA" "$(add "{\"studentIds\":[\"$(uuid)\"]}" | head -1 | jq_ "d['invalid'][0]['reason']")" SEM_MATRICULA
ok "tudo ou nada: com um inválido nenhum válido é movido" "$(add "{\"studentIds\":[\"$P5\",\"$P4\"]}" >/dev/null; grp $P5)" "$G"
ok "lista vazia => 400" "$(code -H "$HA" $J -d '{"studentIds":[]}' $U/admin/class-groups/$G3/students)" 400
ok "ids repetidos => 400" "$(code -H "$HA" $J -d "{\"studentIds\":[\"$P1\",\"$P1\"]}" $U/admin/class-groups/$G3/students)" 400
ok "id mal formado => 400" "$(code -H "$HA" $J -d '{"studentIds":["xyz"]}' $U/admin/class-groups/$G3/students)" 400
ok "estudante não adiciona à turma => 403" "$(code -H "$HL" $J -d "{\"studentIds\":[\"$P1\"]}" $U/admin/class-groups/$G3/students)" 403
ok "estudante não vê candidatos => 403" "$(code -H "$HL" $U/admin/class-groups/$G3/candidates)" 403
R=$(add "{\"studentIds\":[\"$P1\",\"$P2\"]}"); B2=$(echo "$R" | head -1)
ok "adicionar vários => 200" "$(echo "$R" | tail -1)" 200
ok "...2 adicionados e a turma passa a tê-los" "$(echo "$B2" | jq_ "(d['added'], d['alreadyInGroup'], sorted(x['name'] for x in d['group']['students'] if x['id'] in ['$P1','$P2']))")" "(2, 0, ['Paula Candidata', 'Pedro Candidato'])"
ok "o estudante passa a estar na turma do 4.º ano" "$(grp $P1)" "$G3N"
ok "...e as cadeiras AUTO passam a ser do 4.º ano" "$(curl -s -H "$HA" $U/admin/students/$P1 | jq_ "(len(d['subjects'])>0, all(s['courseYear']==4 for s in d['subjects']))")" "(True, True)"
ok "repetir é seguro (nada a mover)" "$(add "{\"studentIds\":[\"$P1\",\"$P2\"]}" | head -1 | jq_ "(d['added'], d['alreadyInGroup'])")" "(0, 2)"
ok "quem foi adicionado deixa de ser candidato" "$(curl -s -H "$HA" "$U/admin/class-groups/$G3/candidates?q=Candidat&pageSize=50" | jq_ "[x['name'] for x in d['items']]")" "['Pia Candidata']"
ok "a turma de origem perdeu-os" "$(curl -s -H "$HA" $U/admin/class-groups/$GID | jq_ "sorted(x['name'] for x in d['students'] if 'Candidat' in x['name'])")" "['Pia Candidata', 'Rui Candidato Inativo']"

exit ${FAIL:-0}
