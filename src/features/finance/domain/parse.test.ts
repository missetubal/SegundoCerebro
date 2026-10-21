import { describe, expect, it } from 'vitest';
import { parseCsv, parseOfx } from './parse';

const csv = 'data;descricao;valor\n02/04/2026;Padaria;-18,90\n';

const ofxAccount = `OFXHEADER:100
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS><STMTRS>
<CURDEF>BRL
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260402120000
<DTUSER>20260401
<TRNAMT>-18.90
<FITID>abc
<NAME>Padaria
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

const ofxCard = `<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS>
<CURDEF>BRL
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>PAYMENT
<DTPOSTED>20260410
<TRNAMT>-200.00
<FITID>pay-1
<NAME>Pagamento
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260403
<TRNAMT>40.00
<FITID>buy-1
<NAME>Mercado
</STMTTRN>
</BANKTRANLIST>
</CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>`;

describe('parsers', () => {
  it('requires a column mapping before reading CSV rows', () => {
    expect(parseCsv(csv, null, 'account', 'BRL')).toEqual({
      ok: false,
      reason: 'mapping_required',
    });
  });

  it('reads a mapped CSV expense', () => {
    const result = parseCsv(
      csv,
      {
        dateColumn: 'data',
        descriptionColumn: 'descricao',
        amountColumn: 'valor',
      },
      'account',
      'BRL',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines[0]).toMatchObject({
      transactionDate: '2026-04-02',
      description: 'Padaria',
      amountMinor: 1890n,
      type: 'expense',
    });
  });

  it('reads an account OFX and a card payment', () => {
    const account = parseOfx(ofxAccount, 'account', 'BRL');
    expect(account.ok).toBe(true);
    if (!account.ok) return;
    expect(account.lines[0]).toMatchObject({
      transactionDate: '2026-04-01',
      postedDate: '2026-04-02',
      type: 'expense',
      externalId: 'abc',
    });

    const card = parseOfx(ofxCard, 'card', 'BRL');
    expect(card.ok).toBe(true);
    if (!card.ok) return;
    expect(card.lines.map((line) => line.type)).toEqual([
      'invoice_payment',
      'expense',
    ]);
  });

  it('does not turn a PDF into lines', () => {
    expect(parseOfx('%PDF-1.7 fake', 'card', 'BRL')).toEqual({
      ok: false,
      reason: 'unsupported',
    });
  });

  it('marks a foreign file currency as incompatible', () => {
    const result = parseOfx(ofxAccount.replace('BRL', 'USD'), 'account', 'BRL');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines[0]?.incompatibleCurrency).toBe(true);
  });
});
