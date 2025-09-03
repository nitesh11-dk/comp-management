// app/api/orders/create/route.js
import { NextResponse } from 'next/server';
import connect from '@/lib/mongo';
import Order from '@/lib/models/Order';
import Wallet from '@/lib/models/Wallet';
import PlatformService from '@/lib/models/Service';
import FormData from 'form-data';
import axios from 'axios';
import { getUserFromCookies } from '@/lib/auth';
import User from '@/lib/models/User';
import {updateOrderStatusFromApi} from './app'


const providerApiUrl = process.env.PROVIDER_API_URL ;
const providerApiKey = process.env.PROVIDER_API_KEY ;


export async function POST(request) {
  try {
    await connect();

    // ✅ Get user from cookies
    const currUser = await getUserFromCookies(request);
    if (!currUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, platform, price, quantity, service, link } = body;

    // ✅ Input validation
    if (
      !category || typeof category !== 'string' ||
      !platform || typeof platform !== 'string' ||
      !link || typeof link !== 'string' ||
      !price || isNaN(Number(price)) || Number(price) <= 0 ||
      !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0 ||
      !service || isNaN(Number(service)) || Number(service) <= 0
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const userId = currUser.id;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Fetch wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    // ✅ Fetch platform service
    const platformService = await PlatformService.findOne({ name: platform });
    if (!platformService) {
      return NextResponse.json({ error: 'Platform not found.' }, { status: 404 });
    }

    // ✅ Get category services
    const categoryServices = platformService.categories.get(category) || platformService.categories[category];
    if (!categoryServices) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // ✅ Find matching service
    const matchedService = categoryServices.find(svc => svc.service === service);
    if (!matchedService) {
      return NextResponse.json({ error: 'Service not found in category.' }, { status: 404 });
    }

    // ✅ Validate quantity
    const qty = parseInt(quantity, 10);
    if (qty < matchedService.min || qty > matchedService.max) {
      return NextResponse.json({
        error: `Quantity must be between ${matchedService.min} and ${matchedService.max}.`
      }, { status: 400 });
    }

    // ✅ Calculate expected price (with discount)
    const discountArray = Array.isArray(user.discount) ? user.discount : [];
    const discountObj = discountArray.find(d =>
      d.serviceId.toString() === matchedService.service.toString()
    );
    const discountApplied = discountObj ? discountObj.discount : 0;

    let expectedPrice = (qty / 1000) * matchedService.rate;
    if (discountApplied) {
      expectedPrice *= (1 - discountApplied / 100);
    }
    expectedPrice = expectedPrice.toFixed(2);

    if (parseFloat(expectedPrice) !== parseFloat(price)) {
      return NextResponse.json({
        error: `Price mismatch. Expected price is ${expectedPrice}.`
      }, { status: 400 });
    }

    // ✅ Check wallet balance
    if (wallet.balance < parseFloat(expectedPrice)) {
      return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
    }

    // ✅ Send order to provider API with correct form-data
    const form = new FormData();
    form.append('key', providerApiKey);
    form.append('action', 'add');
    form.append('service', service);
    form.append('link', link); // use 'link' if that's what API expects
    form.append('quantity', qty);

    const apiResponse = await axios.post(providerApiUrl, form, {
      headers: form.getHeaders(),
    });

    if (!apiResponse.data.order) {
      return NextResponse.json({ error: apiResponse.data.error || 'Provider API error' }, { status: 500 });
    }

    const externalOrderId = apiResponse.data.order;

    // ✅ Deduct wallet balance
    wallet.balance -= parseFloat(expectedPrice);
    wallet.lastUpdated = new Date();
    await wallet.save();

    // ✅ Save new order in DB
    const newOrder = new Order({
      userId,
      category,
      platform,
      platformService: `${platform} - ${category}`,
      link,
      price: expectedPrice,
      quantity: qty,
      service: matchedService.service,
      actualOrderIdFromApi: externalOrderId,
      status: 'pending',
    });
    await newOrder.save();

console.log('Order created successfully:', newOrder);
    updateOrderStatusFromApi(externalOrderId, newOrder._id)

    return NextResponse.json({
      message: 'Order created successfully.',
      orderId: newOrder._id,
      platform: newOrder.platform,
      category: newOrder.category,
      validated: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
