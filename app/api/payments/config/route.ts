import { NextResponse } from 'next/server';
import { gatewayConfig } from '@/lib/gateways';

// Which gateways are configured. Only booleans leave the server,
// never a key. The checkout reads this and shows only the payment
// options that are actually switched on.
export async function GET() {
  return NextResponse.json(gatewayConfig());
}
