const RLS_HINTS: { match: RegExp; message: string }[] = [
  { match: /row-level security policy/i, message: 'Sua conta não tem permissão para salvar. Verifique se seu acesso está ativo.' },
  { match: /violates row-level security/i, message: 'Sua conta não tem permissão para salvar. Verifique se seu acesso está ativo.' },
  { match: /42501/i, message: 'Sua conta não tem permissão para salvar. Verifique se seu acesso está ativo.' },
  { match: /duplicate key/i, message: 'Já existe um registro com esses dados.' },
  { match: /foreign key/i, message: 'Um dos itens selecionados não existe mais. Atualize a página e tente novamente.' },
  { match: /network|failed to fetch/i, message: 'Falha de conexão. Verifique sua internet e tente novamente.' },
];

export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const maybe = err as { message?: string; code?: string };
    if (maybe.code === '42501') return RLS_HINTS[0].message;
    if (maybe.message) {
      const hint = RLS_HINTS.find((h) => h.match.test(maybe.message as string));
      if (hint) return hint.message;
      return maybe.message;
    }
  }
  return 'Algo deu errado. Tente novamente.';
}
