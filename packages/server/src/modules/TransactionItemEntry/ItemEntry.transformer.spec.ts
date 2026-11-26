import { DiscountType } from '@/common/types/Discount';
import { transformCreditNoteToPdfTemplate } from '@/modules/CreditNotes/utils';
import { transformEstimateToPdfTemplate } from '@/modules/SaleEstimates/utils';
import { transformInvoiceToPdfTemplate } from '@/modules/SaleInvoices/utils';
import { transformReceiptToBrandingTemplateAttributes } from '@/modules/SaleReceipts/utils';
import { ItemEntryTransformer } from './ItemEntry.transformer';
import { ItemEntry } from './models/ItemEntry';

/**
 * Transforms an item entry the same way the sales documents queries do.
 */
const transformEntry = (attributes: Partial<ItemEntry>) => {
  const transformer = new ItemEntryTransformer();
  transformer.setContext({ currencyCode: 'CAD' } as any);

  const entry = Object.assign(new ItemEntry(), {
    quantity: 32,
    rate: 100,
    taxRate: 13,
    isInclusiveTax: 0,
    discountType: DiscountType.Percentage,
    discount: null,
    ...attributes,
  });
  return transformer.work([entry]);
};

describe.each([
  ['invoice', transformInvoiceToPdfTemplate],
  ['receipt', transformReceiptToBrandingTemplateAttributes],
  ['estimate', transformEstimateToPdfTemplate],
  ['credit note', transformCreditNoteToPdfTemplate],
])('%s PDF line total', (_, transformToPdfTemplate: (doc: any) => any) => {
  const printedLineTotal = (attributes: Partial<ItemEntry> = {}): string =>
    transformToPdfTemplate({
      entries: transformEntry(attributes),
      taxes: [],
      customer: {},
    }).lines[0].total;

  it('prints the amount before tax of a tax exclusive line', () => {
    expect(printedLineTotal()).toBe('3,200.00');
  });

  it('prints the amount of a tax inclusive line', () => {
    expect(printedLineTotal({ isInclusiveTax: 1 })).toBe('3,200.00');
  });

  it('subtracts a percentage line discount', () => {
    expect(printedLineTotal({ discount: 10 })).toBe('2,880.00');
  });

  it('subtracts an amount line discount', () => {
    expect(
      printedLineTotal({ discountType: DiscountType.Amount, discount: 200 }),
    ).toBe('3,000.00');
  });
});
