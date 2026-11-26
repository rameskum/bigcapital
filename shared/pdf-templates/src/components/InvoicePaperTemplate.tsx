import { isEmpty } from 'lodash';
import { css } from '@emotion/css';
import { x } from '@xstyled/emotion';
import {
  PaperTemplate,
  PaperTemplateProps,
  PaperTemplateTotalBorder,
} from './PaperTemplate';
import { Box } from '../lib/layout/Box';
import { Text } from '../lib/text/Text';
import { Stack } from '../lib/layout/Stack';
import { Group } from '../lib/layout/Group';
import {
  DefaultPdfTemplateTerms,
  DefaultPdfTemplateItemDescription,
  DefaultPdfTemplateStatement,
  DefaultPdfTemplateItemName,
  DefaultPdfTemplateAddressBilledTo,
  DefaultPdfTemplateAddressBilledFrom,
} from './_constants';

interface InvoiceLine {
  item?: string;
  description?: string;
  quantity?: string;
  rate?: string;
  total?: string;
  discount?: string;
}

interface InvoiceTaxLine {
  label: string;
  amount: string;
}

export interface InvoicePaperTemplateProps extends PaperTemplateProps {
  primaryColor?: string;
  secondaryColor?: string;

  // Company
  showCompanyLogo?: boolean;
  companyLogoUri?: string;

  // Invoice number
  showInvoiceNumber?: boolean;
  invoiceNumber?: string;
  invoiceNumberLabel?: string;

  // Date of issue
  showDateIssue?: boolean;
  dateIssue?: string;
  dateIssueLabel?: string;

  // Due date
  showDueDate?: boolean;
  dueDate?: string;
  dueDateLabel?: string;

  companyName?: string;
  bigtitle?: string;

  // Address
  showCustomerAddress?: boolean;
  customerAddress?: string;

  showCompanyAddress?: boolean;
  companyAddress?: string;

  billedToLabel?: string;

  // Entries
  lineItemLabel?: string;
  lineQuantityLabel?: string;
  lineRateLabel?: string;
  lineTotalLabel?: string;

  // # Line Discount
  lineDiscountLabel?: string;
  showLineDiscount?: boolean;

  // Total
  showTotal?: boolean;
  totalLabel?: string;
  total?: string;

  // Discount
  showDiscount?: boolean;
  discountLabel?: string;
  discount?: string;

  // Adjustment
  showAdjustment?: boolean;
  adjustmentLabel?: string;
  adjustment?: string;

  // Subtotal
  showSubtotal?: boolean;
  subtotalLabel?: string;
  subtotal?: string;

  // Payment made
  showPaymentMade?: boolean;
  paymentMadeLabel?: string;
  paymentMade?: string;

  showTaxes?: boolean;

  // Due Amount
  showDueAmount?: boolean;
  dueAmountLabel?: string;
  dueAmount?: string;

  // Footer
  termsConditionsLabel?: string;
  showTermsConditions?: boolean;
  termsConditions?: string;

  // Statement
  statementLabel?: string;
  showStatement?: boolean;
  statement?: string;

  lines?: Array<InvoiceLine>;
  taxes?: Array<InvoiceTaxLine>;
}

// Wave layout (fork patch, see WAVE.md at the repository root): a header band
// with the logo on the left and the title and company block on the right, a
// full-width rule, Bill To beside the invoice details box, an items table whose
// coloured header band runs the full page width, the totals, the notes. The
// side margin is Wave's 21.5pt (28px). The top bar is a border: the stock inset
// shadow leaves a hairline down both edges of the printed page.
const SIDE_MARGIN = 28;
const fullBleed = { marginLeft: -SIDE_MARGIN, marginRight: -SIDE_MARGIN };
const itemsBand = css`
  table thead th {
    background: var(--invoice-primary-color);
    border-bottom: none;
    font-weight: 700;
    color: #000;
    padding: 10px;
  }
  table thead th:first-of-type,
  table tbody td:first-of-type {
    padding-left: ${SIDE_MARGIN}px;
  }
  table thead th:last-of-type,
  table tbody td:last-of-type {
    padding-right: ${SIDE_MARGIN}px;
  }
  table tbody td {
    border-bottom-color: #ddd;
  }
`;
const detailCell = { padding: '2px 6px' };
const detailLabel = {
  ...detailCell,
  fontWeight: 600,
  textAlign: 'right' as const,
};
const amountDue = { background: '#f1f3f4' };

export function InvoicePaperTemplate({
  // # Colors
  primaryColor,
  secondaryColor,

  showCompanyLogo = true,
  companyLogoUri = '',

  // # Due date
  dueDate = 'September 3, 2024',
  dueDateLabel = 'Date due',
  showDueDate = true,

  // # Issue date.
  dateIssue = 'September 3, 2024',
  dateIssueLabel = 'Date of issue',
  showDateIssue = true,

  // Invoice #,
  invoiceNumberLabel = 'Invoice number',
  invoiceNumber = '346D3D40-0001',
  showInvoiceNumber = true,

  // Address
  showCustomerAddress = true,
  customerAddress = DefaultPdfTemplateAddressBilledTo,

  showCompanyAddress = true,
  companyAddress = DefaultPdfTemplateAddressBilledFrom,

  billedToLabel = 'Billed To',

  // Entries
  lineItemLabel = 'Item',
  lineQuantityLabel = 'Qty',
  lineRateLabel = 'Rate',
  lineTotalLabel = 'Total',

  totalLabel = 'Total',
  subtotalLabel = 'Subtotal',
  discountLabel = 'Discount',
  adjustmentLabel = 'Adjustment',
  paymentMadeLabel = 'Payment Made',
  dueAmountLabel = 'Balance Due',

  // # Line Discount
  lineDiscountLabel = 'Discount',
  showLineDiscount = false,

  // Totals
  showTotal = true,
  total = '$662.75',

  showSubtotal = true,
  showDiscount = true,
  showTaxes = true,
  showPaymentMade = true,
  showDueAmount = true,
  showAdjustment = true,

  subtotal = '630.00',
  discount = '0.00',
  adjustment = '',
  paymentMade = '100.00',
  dueAmount = '$562.75',

  // Footer paragraphs.
  termsConditionsLabel = 'Terms & Conditions',
  showTermsConditions = true,
  termsConditions = DefaultPdfTemplateTerms,

  lines = [
    {
      item: DefaultPdfTemplateItemName,
      description: DefaultPdfTemplateItemDescription,
      rate: '1',
      quantity: '1000',
      total: '$1000.00',
    },
  ],
  taxes = [
    { label: 'Sample Tax1 (4.70%)', amount: '11.75' },
    { label: 'Sample Tax2 (7.00%)', amount: '21.74' },
  ],

  // # Statement
  statementLabel = 'Statement',
  showStatement = true,
  statement = DefaultPdfTemplateStatement,
  ...props
}: InvoicePaperTemplateProps) {
  return (
    <PaperTemplate
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      padding={`26px ${SIDE_MARGIN}px 30px`}
      boxShadow={'none'}
      borderTop={'4px solid var(--invoice-primary-color)'}
      {...props}
    >
      <Stack spacing={24}>
        <Group align="start" spacing={10}>
          <Box flex={1}>
            {companyLogoUri && showCompanyLogo && (
              <PaperTemplate.Logo logoUri={companyLogoUri} />
            )}
          </Box>
          <Box flex={1} textAlign={'right'}>
            <x.h1
              fontSize={'36px'}
              fontWeight={300}
              lineHeight={1}
              letterSpacing={'1px'}
              margin={'0 0 12px'}
              color={'#111'}
            >
              INVOICE
            </x.h1>
            {showCompanyAddress && (
              <Box dangerouslySetInnerHTML={{ __html: companyAddress }} />
            )}
          </Box>
        </Group>

        <Box style={fullBleed} borderTop={'1px solid #ddd'} />

        <Group align="start" spacing={10}>
          <Box flex={1}>
            {showCustomerAddress && (
              <>
                <Box color={'#888'} textTransform={'uppercase'}>
                  {billedToLabel}
                </Box>
                <Box dangerouslySetInnerHTML={{ __html: customerAddress }} />
              </>
            )}
          </Box>
          <Box
            display={'grid'}
            gridTemplateColumns={'auto auto'}
            alignContent={'start'}
            marginLeft={'auto'}
          >
            {showInvoiceNumber && (
              <>
                <span style={detailLabel}>{invoiceNumberLabel}</span>
                <span style={detailCell}>{invoiceNumber}</span>
              </>
            )}
            {showDateIssue && (
              <>
                <span style={detailLabel}>{dateIssueLabel}</span>
                <span style={detailCell}>{dateIssue}</span>
              </>
            )}
            {showDueDate && (
              <>
                <span style={detailLabel}>{dueDateLabel}</span>
                <span style={detailCell}>{dueDate}</span>
              </>
            )}
            {showDueAmount && (
              <>
                <span style={{ ...detailLabel, ...amountDue }}>
                  {dueAmountLabel}
                </span>
                <span style={{ ...detailCell, ...amountDue, fontWeight: 600 }}>
                  {dueAmount}
                </span>
              </>
            )}
          </Box>
        </Group>

        <Stack spacing={0}>
          <Box style={fullBleed} className={itemsBand}>
            <PaperTemplate.Table
              columns={[
                {
                  label: lineItemLabel,
                  accessor: (data) => (
                    <Stack spacing={2}>
                      <Text>{data.item}</Text>
                      <Text color={'#5f6b7c'} fontSize={12}>
                        {data.description}
                      </Text>
                    </Stack>
                  ),
                  thStyle: { width: '60%' },
                },
                {
                  label: lineQuantityLabel,
                  accessor: 'quantity',
                  align: 'right',
                },
                { label: lineRateLabel, accessor: 'rate', align: 'right' },
                {
                  label: lineDiscountLabel,
                  accessor: 'discount',
                  align: 'right',
                  visible: showLineDiscount,
                },
                { label: lineTotalLabel, accessor: 'total', align: 'right' },
              ]}
              data={lines}
            />
          </Box>
          <PaperTemplate.Totals>
            {showSubtotal && (
              <PaperTemplate.TotalLine
                label={subtotalLabel}
                amount={subtotal}
                border={PaperTemplateTotalBorder.Gray}
              />
            )}
            {showDiscount && !isEmpty(discount) && (
              <PaperTemplate.TotalLine
                label={discountLabel}
                amount={discount}
              />
            )}
            {showAdjustment && !isEmpty(adjustment) && (
              <PaperTemplate.TotalLine
                label={adjustmentLabel}
                amount={adjustment}
              />
            )}
            {showTaxes && (
              <>
                {taxes.map((tax, index) => (
                  <PaperTemplate.TotalLine
                    key={index}
                    label={tax.label}
                    amount={tax.amount}
                  />
                ))}
              </>
            )}
            {showTotal && (
              <PaperTemplate.TotalLine
                label={totalLabel}
                amount={total}
                border={PaperTemplateTotalBorder.Dark}
                style={{ fontWeight: 500 }}
              />
            )}
            {showPaymentMade && (
              <PaperTemplate.TotalLine
                label={paymentMadeLabel}
                amount={paymentMade}
              />
            )}
            {showDueAmount && (
              <PaperTemplate.TotalLine
                label={dueAmountLabel}
                amount={dueAmount}
                border={PaperTemplateTotalBorder.Dark}
                style={{ fontWeight: 500 }}
              />
            )}
          </PaperTemplate.Totals>
        </Stack>

        <Stack spacing={0}>
          {showTermsConditions && termsConditions && (
            <PaperTemplate.Statement label={termsConditionsLabel}>
              {termsConditions}
            </PaperTemplate.Statement>
          )}

          {showStatement && statement && (
            <PaperTemplate.Statement label={statementLabel}>
              {statement}
            </PaperTemplate.Statement>
          )}
        </Stack>
      </Stack>
    </PaperTemplate>
  );
}
