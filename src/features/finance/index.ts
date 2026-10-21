/** Client-safe public API. Server: `@/features/finance/server` */
export {
  CURRENCIES,
  formatMinor,
  isCurrency,
  type Currency,
} from './domain/money';
export { monthInTimeZone, nextDueDate, todayInTimeZone } from './domain/dates';
export {
  filterByOrigin,
  reconcileIncluded,
  spendingByMonth,
  summarizePeriod,
  totalsByCategory,
  totalsByInstrument,
  type LedgerRow,
  type MoneyTotals,
  type NamedTotal,
  type SpendingOrigin,
} from './domain/aggregation';
export {
  TRANSACTION_TYPES,
  type Direction,
  type TransactionType,
} from './domain/validation';
export * from './presentation';
