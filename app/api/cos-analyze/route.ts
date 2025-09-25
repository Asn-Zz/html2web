import { NextRequest, NextResponse } from 'next/server'
import { billing } from "tencentcloud-sdk-nodejs-billing"

const BillingClient = billing.v20180709.Client;
const clientConfig = {
  credential: {
    secretId: process.env.NEXT_PUBLIC_COS_SECRET_ID,
    secretKey: process.env.NEXT_PUBLIC_COS_SECRET_KEY,
  },
  region: process.env.NEXT_PUBLIC_COS_REGION,
  profile: {
    httpProfile: {
      endpoint: "billing.tencentcloudapi.com",
    },
  },
};

export async function handler(request: NextRequest) {  
  const client = new BillingClient(clientConfig);
  const day = new Date().toISOString().split('T')[0];
  const params = {
      StartDate: day.replace(/.{2}$/, '01'),
      EndDate: day,
      BucketName: process.env.NEXT_PUBLIC_COS_BUCKET
  };  
  
  const result = await client.DescribeDosageCosDetailByDate(params as any)
  return new NextResponse(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };