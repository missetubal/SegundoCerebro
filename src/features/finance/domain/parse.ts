import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';
import { parseAmountToMinor } from './money';
import {
  defaultDirection,
  type Direction,
  type TransactionType,
} from './validation';

export const MAX_INCLUDED_ROWS = 2000;
export const MAX_PREVIEW_ROWS = 5000;

export function csvHeaders(text: string): string[] {
  const headerLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter,
    preview: 1,
  });
  return parsed.meta.fields?.filter((field) => field.trim() !== '') ?? [];
}

export type InstrumentKind = 'account' | 'card';

export type CsvMapping = {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
};

export type ParsedLine = {
  transactionDate: string;
  postedDate: string | null;
  description: string;
  amountMinor: bigint;
  type: TransactionType;
  direction: Direction;
  externalId: string | null;
  incompatibleCurrency: boolean;
};

export type ParseResult =
  | { ok: true; lines: ParsedLine[]; headers?: string[] }
  | { ok: false; reason: 'mapping_required' | 'unsupported' | 'unreadable' };

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

export function parseCsv(
  text: string,
  mapping: CsvMapping | null,
  instrument: InstrumentKind,
  currency: string,
): ParseResult {
  if (!mapping) return { ok: false, reason: 'mapping_required' };
  if (text.includes('\0')) return { ok: false, reason: 'unreadable' };
  const delimiter = detectDelimiter(text);
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });
  if (parsed.errors.some((error) => error.type === 'Quotes')) {
    return { ok: false, reason: 'unreadable' };
  }
  const headers = parsed.meta.fields ?? [];
  const lines: ParsedLine[] = [];
  for (const row of parsed.data) {
    const description = (row[mapping.descriptionColumn] ?? '').trim();
    const transactionDate = normalizeCsvDate(row[mapping.dateColumn] ?? '');
    const signed = signedFromCsv(row, mapping);
    if (!description || !transactionDate || signed === null || signed === 0n) {
      continue;
    }
    const suggested = suggestType(instrument, signed, null);
    lines.push({
      transactionDate,
      postedDate: null,
      description,
      amountMinor: suggested.amountMinor,
      type: suggested.type,
      direction: suggested.direction,
      externalId: null,
      incompatibleCurrency: false,
    });
  }
  void currency;
  return { ok: true, lines, headers };
}

export function parseOfx(
  text: string,
  instrument: InstrumentKind,
  currency: string,
): ParseResult {
  if (text.startsWith('%PDF') || text.includes('\0')) {
    return { ok: false, reason: 'unsupported' };
  }
  let xml: string;
  try {
    xml = sgmlToXml(text);
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  let document: unknown;
  try {
    document = parser.parse(xml);
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  const transactions = findTransactions(document);
  const fileCurrency = findCurrency(document);
  if (transactions.length === 0) return { ok: false, reason: 'unreadable' };
  const lines = transactions.flatMap((entry) => {
    const line = lineFromOfx(entry, instrument, currency, fileCurrency);
    return line ? [line] : [];
  });
  if (lines.length === 0) return { ok: false, reason: 'unreadable' };
  return { ok: true, lines };
}

export function suggestType(
  instrument: InstrumentKind,
  signedMinor: bigint,
  trnType: string | null,
): { type: TransactionType; direction: Direction; amountMinor: bigint } {
  const normalized = trnType?.toUpperCase() ?? '';
  if (normalized === 'PAYMENT' || normalized === 'REPEATPMT') {
    const type: TransactionType = 'invoice_payment';
    return {
      type,
      direction: defaultDirection(type, instrument),
      amountMinor: signedMinor < 0n ? -signedMinor : signedMinor,
    };
  }
  if (normalized === 'XFER' || normalized === 'TRANSFER') {
    return {
      type: 'transfer',
      direction: signedMinor < 0n ? 'outflow' : 'inflow',
      amountMinor: signedMinor < 0n ? -signedMinor : signedMinor,
    };
  }
  const amountMinor = signedMinor < 0n ? -signedMinor : signedMinor;
  if (instrument === 'card') {
    return signedMinor < 0n
      ? { type: 'refund', direction: 'inflow', amountMinor }
      : { type: 'expense', direction: 'outflow', amountMinor };
  }
  return signedMinor < 0n
    ? { type: 'expense', direction: 'outflow', amountMinor }
    : { type: 'income', direction: 'inflow', amountMinor };
}

function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  const semicolons = header.split(';').length;
  const commas = header.split(',').length;
  return semicolons > commas ? ';' : ',';
}

function signedFromCsv(
  row: Record<string, string>,
  mapping: CsvMapping,
): bigint | null {
  if (mapping.amountColumn) {
    return parseAmountToMinor(row[mapping.amountColumn] ?? '');
  }
  const debit = parseAmountToMinor(row[mapping.debitColumn ?? ''] ?? '');
  const credit = parseAmountToMinor(row[mapping.creditColumn ?? ''] ?? '');
  if (debit === null && credit === null) return null;
  const debitAbs = debit === null ? 0n : debit < 0n ? -debit : debit;
  const creditAbs = credit === null ? 0n : credit < 0n ? -credit : credit;
  if (debitAbs > 0n && creditAbs === 0n) return -debitAbs;
  if (creditAbs > 0n && debitAbs === 0n) return creditAbs;
  return null;
}

function normalizeCsvDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function sgmlToXml(ofx: string): string {
  const start = ofx.search(/<OFX>/i);
  const body = start >= 0 ? ofx.slice(start) : ofx;
  return body.replace(
    /<([A-Za-z0-9.]+)>([^<\r\n]+)/g,
    (_match, tag: string, value: string) => `<${tag}>${value.trim()}</${tag}>`,
  );
}

function findTransactions(document: unknown): Record<string, string>[] {
  const found: Record<string, string>[] = [];
  walk(document, (node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const record = node as Record<string, unknown>;
    const list = record.STMTTRN;
    if (!list) return;
    const items = Array.isArray(list) ? list : [list];
    for (const item of items) {
      if (item && typeof item === 'object') {
        found.push(stringifyFields(item as Record<string, unknown>));
      }
    }
  });
  return found;
}

function walk(node: unknown, visit: (node: unknown) => void) {
  visit(node);
  if (!node || typeof node !== 'object') return;
  for (const value of Object.values(node as Record<string, unknown>)) {
    walk(value, visit);
  }
}

function stringifyFields(node: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' || typeof value === 'number') {
      result[key] = String(value);
    }
  }
  return result;
}

function findCurrency(document: unknown): string | null {
  let currency: string | null = null;
  walk(document, (node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const value = (node as Record<string, unknown>).CURDEF;
    if (typeof value === 'string') currency = value.trim().toUpperCase();
  });
  return currency;
}

function lineFromOfx(
  entry: Record<string, string>,
  instrument: InstrumentKind,
  currency: string,
  fileCurrency: string | null,
): ParsedLine | null {
  const signed = parseAmountToMinor(entry.TRNAMT ?? '');
  const rawDate = entry.DTUSER || entry.DTPOSTED;
  const transactionDate = ofxDate(rawDate);
  const description = (entry.NAME || entry.MEMO || '').trim();
  if (signed === null || signed === 0n || !transactionDate || !description) {
    return null;
  }
  const suggested = suggestType(instrument, signed, entry.TRNTYPE ?? null);
  return {
    transactionDate,
    postedDate: ofxDate(entry.DTPOSTED),
    description,
    amountMinor: suggested.amountMinor,
    type: suggested.type,
    direction: suggested.direction,
    externalId: entry.FITID ?? null,
    incompatibleCurrency: fileCurrency !== null && fileCurrency !== currency,
  };
}

function ofxDate(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
