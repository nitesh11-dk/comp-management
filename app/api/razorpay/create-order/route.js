import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '@/lib/models/Payment';  // adjust import path
import connectDb from '@/lib/mongo';
import { getUserFromCookies } from "@/lib/auth";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Next.js 15 App Router API handler is an async function called GET, POST, etc.
export async function POST(request) {
  await connectDb();

  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("Unauthorized");
  }
const userId = user.id ;
  const { amount} = await request.json();

  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    return new Response(JSON.stringify({ message: "Amount must be a whole number greater than 0." }), { status: 400 });
  }

  if (amount < 1 || amount > 5000) {
    return new Response(JSON.stringify({ message: "Amount must be between ₹1 and ₹5000." }), { status: 400 });
  }

  try {
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId,
      orderId: order.id,
      amount,
      status: 'pending'
    });

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      amount,
      currency: order.currency
    }), { status: 200 });

  } catch (error) {
    console.error('create-order error:', error);
    return new Response(JSON.stringify({ message: "Failed to create order." }), { status: 500 });
  }
}
