# Funções partilhadas pelos testes de fumo. Uso: source test/lib.sh (precisa de API e, para o admin, de ADMIN_EMAIL/ADMIN_PASSWORD).
U=${API:-localhost:3000}; J='-H Content-Type:application/json'; S=$RANDOM$RANDOM
jq_() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
ok() { [ "$2" = "$3" ] && echo "OK   $1" || { echo "FALHA $1 (esperado $3, obtido $2)"; FAIL=1; }; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
uuid() { python3 -c "import uuid;print(uuid.uuid4())"; }
auth() { echo "Authorization: Bearer $1"; }
if [ -z "$ADMIN_EMAIL" ] && [ -f .env ]; then eval "$(grep -E '^ADMIN_(EMAIL|PASSWORD)=' .env)"; fi
admin_token() { curl -s $J -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" $U/auth/login | jq_ "d['token']"; }
# Docente só para o teste, a leccionar a cadeira indicada (precisa de HA). Assim os testes não dependem de haver docentes sem avaliações.
mkteacher() { # nome subjectId -> id
  local dep=$(curl -s -H "$HA" $U/admin/structure | jq_ "d['departments'][0]['id']")
  local id=$(curl -s -H "$HA" $J -d "{\"name\":\"$1\",\"departmentId\":\"$dep\"}" $U/admin/teachers | jq_ "d['id']")
  curl -s -o /dev/null -H "$HA" $J -d "{\"subjectIds\":[\"$2\"]}" $U/admin/teachers/$id/subjects
  echo $id
}
# Apaga os docentes de teste (nome "Docente Teste ...") e o que depende deles.
limpar_docentes() {
  [ -n "$DBCMD" ] || return 0
  $DBCMD "DELETE FROM evaluations WHERE \"teacherId\" IN (SELECT id FROM teachers WHERE name LIKE 'Docente Teste %'); UPDATE teachers SET \"userId\"=NULL WHERE name LIKE 'Docente Teste %'; DELETE FROM teachers WHERE name LIKE 'Docente Teste %'" >/dev/null 2>&1
}
