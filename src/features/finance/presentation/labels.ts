import type { AssetClass } from '../domain/validation';

export const CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Ação',
  reit: 'FII',
  etf: 'ETF',
  fixed_income: 'Renda fixa',
  fund: 'Fundo',
  crypto: 'Cripto',
  other: 'Outro',
};

export const TYPE_LABELS: Record<string, string> = {
  expense: 'Despesa',
  income: 'Receita',
  refund: 'Estorno',
  invoice_payment: 'Pagamento',
  transfer: 'Transferência',
};

export const OPERATION_LABELS: Record<string, string> = {
  buy: 'Compra',
  sell: 'Venda',
  income: 'Provento',
  adjustment: 'Ajuste',
};
