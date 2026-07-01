# Segurança operacional — Virtuosa USA

## Aplicar antes do próximo deploy

- Executar `supabase/migrations/002_api_rate_limits.sql` no SQL Editor do Supabase.
- Confirmar na Vercel que `SUPABASE_SERVICE_ROLE_KEY`, `SQUARE_ACCESS_TOKEN` e `SQUARE_WEBHOOK_SIGNATURE_KEY` estão marcadas como confidenciais e somente em Produção/Preview quando necessário.
- Confirmar que `SQUARE_WEBHOOK_NOTIFICATION_URL` usa `https://www.virtuosausa.com/api/webhooks/square` exatamente.

## Concluído no código

- Limite persistente e fallback local para solicitação/validação de OTP e criação de checkout.
- OTP com exatamente seis dígitos, resposta anti-enumeração e criação de conta somente após compra confirmada.
- Logout com revogação da sessão no Supabase.
- Headers HTTP de segurança, CSP, HSTS, proteção contra iframe e bloqueio de indexação de rotas privadas.
- Sacola com validade, versão e revalidação pelo catálogo oficial.
- Chave de idempotência estável no checkout e proteção contra payloads excessivos.
- Página de sucesso não limpa a sacola nem confirma pedido em acesso direto.
- Identificador de localização da Square removido do arquivo de exemplo atual.

## Próximas ações priorizadas

1. **Estoque real por tamanho/cor:** cadastrar quantidade por variante e reservar/decrementar estoque no fluxo Square. Sem esses dados, o sistema só consegue bloquear produtos marcados como indisponíveis.
2. **Monitoramento:** conectar Sentry ou serviço equivalente aos erros das APIs e do webhook.
3. **Legal:** publicar Política de Privacidade e Termos revisados para a operação nos Estados Unidos; revisar a redação de trocas/crédito/reembolso.
4. **Conta:** migrar a proteção inicial de `/conta` para validação no servidor; as APIs já exigem sessão válida.
5. **Dependências:** acompanhar a correção transitiva do PostCSS trazido pelo Next.js. O `npm audit --omit=dev` apontou duas ocorrências moderadas sem correção disponível e nenhuma vulnerabilidade alta/crítica.
6. **Operação:** testar mensalmente webhook, recuperação de conta, restauração de backup e expiração do carrinho.
