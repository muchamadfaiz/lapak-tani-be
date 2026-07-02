import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.development'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require('midtrans-client');

async function main() {
  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });
  const ON = 'ORD-20260702-1108';

  console.log('--- transaction.status(order_id) ---');
  try {
    const s = await snap.transaction.status(ON);
    console.log('OK transaction_status=', s.transaction_status, ' fraud=', s.fraud_status);
  } catch (e: any) {
    console.log('STATUS ERROR:', e?.message, e?.ApiResponse ?? '');
  }

  console.log('--- transaction.notification({order_id}) ---');
  try {
    const n = await snap.transaction.notification({ order_id: ON });
    console.log('OK notif → transaction_status=', n.transaction_status, ' fraud=', n.fraud_status, ' order_id=', n.order_id);
  } catch (e: any) {
    console.log('NOTIF ERROR:', e?.message);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
