/** Utilizador a quem pertencem os dados offline. Tudo (fila e cache) é filtrado por este id. */
let utilizadorId: string | null = null;
export const definirUtilizadorOffline = (id: string | null) => { utilizadorId = id; };
export const utilizadorOffline = () => utilizadorId;
