#!/usr/bin/env bash
# Início do estudante (resumo, por avaliar, destaques), ranking e estatísticas agregadas.
# Uso: API=localhost:3102 DBCMD='docker compose exec -T postgres psql -U avaliaprof -d avaliaprof -c' bash test/smoke-insights.sh
source test/lib.sh
[ -n "$ADMIN_EMAIL" ] || { echo "ADMIN_EMAIL/ADMIN_PASSWORD em falta"; exit 2; }
limpar() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"studentId\" IN (SELECT id FROM users WHERE email LIKE 'ins%@teste.com'); DELETE FROM users WHERE email LIKE 'ins%@teste.com'" >/dev/null 2>&1
}
limpar; trap limpar EXIT
TA=$(admin_token); HA=$(auth $TA)
OPT=$(curl -s -H "$HA" $U/admin/academic-options)
CUR=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if s['isCurrent']][0]")
INF=$(echo "$OPT" | jq_ "[c['id'] for c in d['courses'] if c['name']=='Engenharia Informática'][0]")
TURMA=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==1 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
TURMA2=$(echo "$OPT" | jq_ "[g['id'] for g in d['classGroups'] if g['courseId']=='$INF' and g['courseYear']==2 and g['semesterId']=='$CUR' and g['regime']=='LABORAL'][0]")
mk() { # n [ano] [turma] -> token de um estudante de Eng. Informática (por defeito 1.º ano, turma A) com conta activada
  local num="T${S:0:6}0$1" em="ins$S$1@teste.com" ano=${2:-1} turma=${3:-$TURMA}
  curl -s -o /dev/null -H "$HA" $J -d "{\"name\":\"Aluno Teste$1\",\"studentNumber\":\"$num\",\"email\":\"$em\",\"courseId\":\"$INF\",\"courseYear\":$ano,\"semesterId\":\"$CUR\",\"classGroupId\":\"$turma\"}" $U/admin/students
  curl -s $J -d "{\"studentNumber\":\"$num\",\"email\":\"$em\",\"password\":\"senha1234\"}" $U/auth/register | jq_ "d['token']"
}
T1=$(mk 1); H1=$(auth $T1)
ME=$(curl -s -H "$H1" $U/me/subjects)
SCOPE=$(echo "$ME" | jq_ "sorted(set(t['id'] for i in d['items'] for t in i['teachers']))")
PARES=$(echo "$ME" | jq_ "sum(len(i['teachers']) for i in d['items'])")
ALL=""
RKA_ALL=$(curl -s -H "$HA" "$U/stats/ranking?limit=50")
ADMIN_IDS=$(echo "$RKA_ALL" | jq_ "sorted(i['teacher']['id'] for i in d['items'])")

echo "-- acesso"
ok "sem token => 401" "$(code $U/home)" 401
ok "admin não tem o ecrã de início do estudante => 403" "$(code -H "$HA" $U/home)" 403
ok "estatísticas sem token => 401" "$(code $U/stats/ranking)" 401

echo "-- início do estudante"
HOME_=$(curl -s -H "$H1" $U/home)
NSUBJ=$(echo "$ME" | jq_ "len(d['items'])"); NTEACH=$(echo "$SCOPE" | jq_ "len(d)" 2>/dev/null || python3 -c "print(len($SCOPE))")
ok "resumo: cadeiras e docentes batem com a matrícula" "$(echo "$HOME_" | jq_ "(d['summary']['subjects'], d['summary']['teachers'])")" "($NSUBJ, $NTEACH)"
ok "resumo: ainda sem avaliações feitas" "$(echo "$HOME_" | jq_ "d['summary']['evaluationsDone']")" 0
ok "por avaliar = docentes x cadeiras com período aberto" "$(echo "$HOME_" | jq_ "(d['summary']['pending'], len(d['pending']) == min($PARES, 10))")" "($PARES, True)"
ok "destaques: são docentes de todo o curso (não só os meus), todos do ranking geral" "$(echo "$HOME_" | jq_ "all(f['id'] in $ADMIN_IDS for f in d['featured'])")" True
ok "destaques: todos com amostra mínima e ordenados por média" "$(echo "$HOME_" | jq_ "(all(f['count']>=d['minSample'] for f in d['featured']), [f['average'] for f in d['featured']]==sorted([f['average'] for f in d['featured']], reverse=True))")" "(True, True)"
ok "destaques: no máximo 5" "$(echo "$HOME_" | jq_ "len(d['featured'])<=5")" True
ok "ainda sem avaliações recentes" "$(echo "$HOME_" | jq_ "d['recent']")" "[]"

echo "-- avaliar faz o início actualizar"
FIRST=$(echo "$HOME_" | jq_ "d['pending'][0]['courseSubjectId']+' '+d['pending'][0]['teacherId']")
CS=${FIRST% *}; TC=${FIRST#* }
ok "avaliar um dos pendentes => 201" "$(code -H "$H1" $J -d "{\"clientId\":\"$(uuid)\",\"teacherId\":\"$TC\",\"courseSubjectId\":\"$CS\",\"scores\":{\"clarity\":5,\"punctuality\":4,\"availability\":3,\"mastery\":5,\"fairness\":4}}" $U/evaluations)" 201
H2_=$(curl -s -H "$H1" $U/home)
ok "o pendente desaparece (-1) e conta como feita (+1)" "$(echo "$H2_" | jq_ "(d['summary']['pending'], d['summary']['evaluationsDone'])")" "($((PARES-1)), 1)"
ok "aparece nas avaliações recentes (só as minhas)" "$(echo "$H2_" | jq_ "(len(d['recent']), d['recent'][0]['teacher']['id']=='$TC', d['recent'][0]['overall'])")" "(1, True, 4.2)"

echo "-- ranking"
RK=$(curl -s -H "$H1" "$U/stats/ranking?limit=50")
ok "ranking: todos os docentes com amostra mínima (igual ao do admin)" "$(echo "$RK" | jq_ "(sorted(i['teacher']['id'] for i in d['items'])==$ADMIN_IDS, all(i['count']>=d['minSample'] for i in d['items']))")" "(True, True)"
ok "ranking: posições 1..n por ordem decrescente de média" "$(echo "$RK" | jq_ "([i['position'] for i in d['items']]==list(range(1,len(d['items'])+1)), [i['average'] for i in d['items']]==sorted([i['average'] for i in d['items']], reverse=True))")" "(True, True)"
ok "ranking: indica quantos docentes ficam de fora por amostra" "$(echo "$RK" | jq_ "isinstance(d['hidden'], int)")" True
ok "ranking: limit=1 devolve no máximo 1" "$(curl -s -H "$H1" "$U/stats/ranking?limit=1" | jq_ "len(d['items'])<=1")" True
ok "ranking: limit=0 => 400" "$(code -H "$H1" "$U/stats/ranking?limit=0")" 400
ok "ranking: cadeira mal formada => 400" "$(code -H "$H1" "$U/stats/ranking?subjectId=xyz")" 400
ANY_SUBJ=$(curl -s -H "$HA" $U/stats/options | jq_ "d['subjects'][0]['id']")
ok "ranking por cadeira: igual para estudante e admin" "$(curl -s -H "$H1" "$U/stats/ranking?subjectId=$ANY_SUBJ" | jq_ "d['items']")" "$(curl -s -H "$HA" "$U/stats/ranking?subjectId=$ANY_SUBJ" | jq_ "d['items']")"
ok "ranking: semestre sem avaliações => vazio" "$(curl -s -H "$H1" "$U/stats/ranking?semesterId=$(echo "$OPT" | jq_ "[s['id'] for s in d['semesters'] if not s['isCurrent']][0]")" | jq_ "d['items']")" "[]"
ok "ranking por curso (filtro courseId) responde" "$(code -H "$H1" "$U/stats/ranking?courseId=$INF")" 200
T2=$(mk 2 2 $TURMA2); H2=$(auth $T2)
ok "um estudante do 2.º ano vê o mesmo ranking, mesmo sem aulas com esses docentes" "$(curl -s -H "$H2" "$U/stats/ranking?limit=50" | jq_ "sorted(i['teacher']['id'] for i in d['items'])==$ADMIN_IDS")" True
ok "...e os mesmos destaques no início" "$(curl -s -H "$H2" $U/home | jq_ "[f['id'] for f in d['featured']]")" "$(echo "$HOME_" | jq_ "[f['id'] for f in d['featured']]")"

echo "-- estatísticas agregadas"
OV=$(curl -s -H "$H1" "$U/stats/overview")
ok "overview: com amostra suficiente mostra critérios, distribuição e evolução" "$(echo "$OV" | jq_ "(d['sufficient'], sorted(d['criteria'].keys()), sum(d['distribution'].values())==d['count'], len(d['evolution'])>0) if d['sufficient'] else (False,)")" "(True, ['availability', 'clarity', 'fairness', 'mastery', 'punctuality'], True, True)"
SUBJS=$(curl -s -H "$H1" $U/stats/options | jq_ "' '.join(s['id'] for s in d['subjects'])")
POUCA=""; for sid in $SUBJS; do R=$(curl -s -H "$H1" "$U/stats/overview?subjectId=$sid"); [ "$(echo "$R" | jq_ "d['sufficient']")" = False ] && { POUCA="$R"; break; }; done
ok "overview: cadeira com poucas avaliações não mostra médias (anonimato)" "$(echo "$POUCA" | jq_ "('average' in d, 'criteria' in d, 'evolution' in d)")" "(False, False, False)"
ok "overview: igual para estudante e admin" "$(curl -s -H "$H1" "$U/stats/overview?subjectId=$ANY_SUBJ" | jq_ "(d['count'], d['sufficient'])")" "$(curl -s -H "$HA" "$U/stats/overview?subjectId=$ANY_SUBJ" | jq_ "(d['count'], d['sufficient'])")"
ok "overview: semestre com filtro inválido => 400" "$(code -H "$H1" "$U/stats/overview?semesterId=xyz")" 400
OPS=$(curl -s -H "$H1" $U/stats/options)
ok "opções: cursos, cadeiras e semestres de todo o catálogo" "$(echo "$OPS" | jq_ "(len(d['courses'])>=4, len(d['subjects'])>20, len(d['semesters'])>=2, d['minSample'])")" "(True, True, True, 5)"
ok "opções: iguais para o admin" "$(curl -s -H "$HA" $U/stats/options | jq_ "len(d['subjects'])")" "$(echo "$OPS" | jq_ "len(d['subjects'])")"

echo "-- anonimato e estudante sem matrícula"
ok "nenhuma resposta contém dados de estudantes" "$(echo "$HOME_$H2_$RK$OV$OPS$POUCA" | grep -ci 'Aluno Teste\|@teste.com\|studentId\|studentNumber')" 0
NOMAT=$(mk 8)
SIDN=$(curl -s -H "$HA" "$U/admin/students?q=ins${S}8@teste.com" | jq_ "d['items'][0]['id']")
curl -s -o /dev/null -X PATCH -H "$HA" $J -d '{"status":"INACTIVE"}' $U/admin/students/$SIDN/enrollment
HN=$(auth $NOMAT)
ok "sem matrícula: nada de pessoal no início (cadeiras, por avaliar, recentes)" "$(curl -s -H "$HN" $U/home | jq_ "(d['summary']['subjects'], d['pending'], d['recent'])")" "(0, [], [])"
ok "sem matrícula: os destaques públicos aparecem" "$(curl -s -H "$HN" $U/home | jq_ "[f['id'] for f in d['featured']]")" "$(echo "$HOME_" | jq_ "[f['id'] for f in d['featured']]")"
ok "sem matrícula: ranking e estatísticas públicos continuam visíveis" "$(curl -s -H "$HN" "$U/stats/ranking?limit=50" | jq_ "sorted(i['teacher']['id'] for i in d['items'])==$ADMIN_IDS")" True

exit ${FAIL:-0}
