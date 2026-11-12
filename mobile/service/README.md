# Camada de serviços

Fala com a API REST do AvaliaProf (`backend/`). `EXPO_PUBLIC_API_URL` define o endereço.

- `api.ts` — instância axios, token (SecureStore), tratamento de 401.
- `erro.ts` — `ErroServico` e `traduzirErro` (mensagens claras para a UI).
- `authService.ts` — registo, login, sessão, recuperação de senha, perfil e fotografia.
- `catalogoService.ts` — cursos, filtros, professores (paginação, pesquisa, filtros).

Os ecrãs nunca chamam a API directamente. Na Fase 5 estes serviços passam a ler do
SQLite local e a sincronizar com a API.
