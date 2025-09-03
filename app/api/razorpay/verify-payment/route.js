import crypto from 'crypto';
import Payment from '@/lib/models/Payment';
import Wallet from '@/lib/models/Wallet';
import connectDb from '@/lib/mongo';
import { getUserFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDb();
    const user = await getUserFromCookies();


    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();

    // console.log('verify-payment body:', body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ message: 'Missing required fields.' }),
        { status: 400 }
      );
    }

    const payment = await Payment.findOne({
      orderId: razorpay_order_id,
      userId,
    });

    if (!payment) {
      return new Response(
        JSON.stringify({ message: 'Order not found.' }),
        { status: 404 }
      );
    }

    if (payment.status === 'paid') {
      return new Response(
        JSON.stringify({ message: 'Payment already verified.' }),
        { status: 400 }
      );
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ message: 'Invalid payment signature.' }),
        { status: 400 }
      );
    }

    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: payment.amount });
    } else {
      wallet.balance += payment.amount;
      wallet.lastUpdated = Date.now();
    }
    await wallet.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified & wallet credited.',
        balance: wallet.balance,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('verify-payment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to verify payment.' }),
      { status: 500 }
    );
  }
}
