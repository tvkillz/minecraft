import { getSitePublicUrl, getShortSiteName } from '@/lib/site'

const siteUrl = getSitePublicUrl().replace(/\/$/, '')
const shortSiteName = getShortSiteName()
export const TERMS_OF_SALE_POLICY = {
  title: 'Terms of Sale & Digital Purchase Policy',
  lastUpdated: '29 June 2026',
  intro:
    `By clicking "BUY" or initiating a transaction to purchase ${shortSiteName} Credits on this Platform, you expressly acknowledge, understand, and agree to the following binding commercial terms:`,
  sections: [
    {
      title: '1. Nature of the Purchase',
      items: [
        {
          label: 'Virtual Currency Only',
          text: `You are purchasing "${shortSiteName} Credits," which constitute a limited, non-assignable, revocable, and non-transferable license to access specific digital content and features within the Game hosted on ${siteUrl}.`,
        },
        {
          label: 'No Monetary Value',
          text: `${shortSiteName} Credits do not constitute legal tender, fiat currency, e-money, investment instruments, or store-of-value assets outside of this entertainment ecosystem. They cannot be redeemed for real-world currency from us unless processed strictly under our platform\'s withdrawal rules.`,
        },
      ],
    },
    {
      title: '2. Immediate Performance & Waiver of Cancellation',
      items: [
        {
          label: 'Instant Delivery',
          text: `By completing this purchase, you give your explicit consent to immediately credit the ${shortSiteName} Credits to your Account profile upon successful payment processing.`,
        },
        {
          label: 'Loss of Withdrawal Rights',
          text: 'Because this digital service is delivered instantly, you explicitly waive your right to cancel this transaction or claim a statutory refund under regional consumer protection laws (including UK/EU consumer cooling-off periods). All sales are final.',
        },
      ],
    },
    {
      title: '3. Pricing, Fees, and Fraud Prevention',
      items: [
        {
          label: 'Exchange Rate',
          text: 'The standard conversion rate is fixed at 100 credits = €1.00 (or the corresponding equivalent displayed in your selected currency).',
        },
        {
          label: 'Chargeback Consequences',
          text: 'Any attempt to initiate an unmerited, fraudulent, or bad-faith chargeback or payment dispute through your credit card provider or bank will result in the immediate and permanent termination of your platform account and the complete forfeiture of all virtual items, decks, and remaining balances.',
        },
        {
          label: 'Closed-Loop Verification',
          text: 'Any future requests to withdraw eligible internal balances back to real-world currency are subject to strict anti-money laundering controls. Funds will only be processed back to this exact payment method and will incur a mandatory 5% processing fee.',
        },
      ],
    },
  ],
} as const
