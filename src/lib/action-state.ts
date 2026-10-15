export type ActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const IDLE_STATE: ActionState = { status: 'idle' };
export const SUCCESS_STATE: ActionState = { status: 'success' };

export const ACTION_MESSAGES = {
  notFound: 'Item não encontrado.',
  unavailable: 'Não foi possível salvar agora. Tente de novo em instantes.',
} as const;

export function errorState(message: string): ActionState {
  return { status: 'error', message };
}
