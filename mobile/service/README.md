# Camada de serviços

Todos os ecrãs/stores falam com `service/*`, nunca directamente com AsyncStorage ou ficheiros mock.

| Serviço | Secção | Endpoints esperados |
|---|---|---|
| `anunciosService` | Explorar, mapa, detalhe, publicar, gerir | `GET /anuncios`, `GET /anuncios/:id`, `POST /anuncios`, `DELETE /anuncios/:id` |
| `reservasService` | Reservas | `GET /reservas`, `POST /reservas`, `POST /reservas/:id/cancelar` |
| `favoritosService` | Salvos | `GET/PUT /favoritos` |
| `carteiraService` | Carteira | `GET/PUT/DELETE /carteira` |
| `referenciaService` | Programa de referência | `GET/PUT/DELETE /referencia` |
| `moderacaoService` | Denúncias, avisos, suspensão | `/moderacao/{denuncias,avisos,suspensao}` |
| `perfilService` | Perfil | `GET/PUT /perfil` |
| `conversasService` | Mensagens | `GET /conversas` |
| `authService` | Login/registo/2FA | `/auth/*` (ainda sem fallback; o login da app é local) |

## Como funciona o fallback
- `EXPO_PUBLIC_API_URL` vazio → tudo local (mock + AsyncStorage), com 250 ms de latência simulada (`config.ts`).
- URL definida → **leituras** tentam a API; em erro de rede, timeout, 4xx/5xx ou resposta inválida usam o local. **Escritas** gravam sempre local primeiro e sincronizam em segundo plano (falhas da API não partem a app).
- Para trocar de mock para API real: preencha a URL; ajuste só o ficheiro do serviço se o formato da resposta for diferente.
