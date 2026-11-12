# Publicar o backend: Render (API) + Neon (base de dados)

## 1. Base de dados no Neon
1. Em <https://neon.tech> cria um projecto (região **AWS Europe – Frankfurt**, a mesma da API) e uma base `avaliaprof`.
2. Em **Connection Details** desliga a opção *Connection pooling* e copia o endereço **directo**
   (o host **não** tem `-pooler`). Deve terminar em `?sslmode=require`:
   `postgresql://<utilizador>:<senha>@ep-xxxx.eu-central-1.aws.neon.tech/avaliaprof?sslmode=require`
   As migrações do Prisma precisam da ligação directa; para uma só instância da API ela chega também para o uso normal.

## 2. API no Render
1. O código tem de estar no GitHub (ramo com a pasta `backend/` e o ficheiro `render.yaml` na raiz).
2. No Render: **New > Blueprint**, escolhe o repositório e o ramo. O `render.yaml` cria o serviço `avaliaprof-api`.
3. Preenche as variáveis pedidas:
   - `DATABASE_URL`: o endereço directo do Neon (passo 1).
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 12 caracteres): a conta de administrador criada pelo seed.
   - `JWT_SECRET` é gerado pelo Render.
4. Primeiro deploy: com `SEED_ON_START=true` o arranque aplica as migrações e corre o seed (admin + catálogo e estudantes de exemplo).
   Depois de confirmares que entra, muda `SEED_ON_START` para `false`. Para dados reais, `SEED_DEV_CATALOG=false` **antes** do primeiro deploy.
5. Testa: `https://<serviço>.onrender.com/health` deve responder `{"status":"ok"}`.

## 3. App móvel
Em `mobile/.env`: `EXPO_PUBLIC_API_URL=https://<serviço>.onrender.com` e reinicia o Expo (`npx expo start -c`).

## Limitações do plano gratuito
- **O serviço adormece** após ~15 min sem pedidos; o primeiro pedido seguinte demora dezenas de segundos (a app espera 20 s e pode ser preciso repetir).
  Enquanto dorme, a tarefa dos avisos de períodos não corre.
- **Fotografias de perfil perdem-se** a cada deploy ou reinício: o disco do Render gratuito não é persistente. Para as manter é preciso um disco pago
  (`UPLOADS_DIR` a apontar para ele) ou armazenamento externo.
- **Neon suspende a base** quando não há actividade e acorda no pedido seguinte (cerca de um segundo). A tarefa dos avisos (de 10 em 10 min) acorda-a;
  para poupar horas de computação: `NOTIFICATIONS_JOB=false`.
- **Email**: em produção a recuperação de senha não envia nada (não há provedor configurado) e o código deixa de aparecer no log.
- Os dados de demonstração de Informática não vão no seed: `npx ts-node prisma/seed-demo-informatica.ts` com `DATABASE_URL` do Neon, a partir do teu computador.
