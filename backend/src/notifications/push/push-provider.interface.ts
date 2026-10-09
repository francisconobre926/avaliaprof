export interface PushResult {
  invalidTokens: string[];
}

export interface PushProvider {
  send(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<PushResult>;
}

export const PUSH_PROVIDER = 'PUSH_PROVIDER';