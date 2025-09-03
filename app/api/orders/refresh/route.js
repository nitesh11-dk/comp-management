
import { NextResponse } from 'next/server';
import connect from '@/lib/mongo'; // your mongoose connect util
import Order from '@/lib/models/Order';
import { updateOrderStatusFromApi } from '../create/app';



export async function POST(req) {
  try {
    await connect();

    const body = await req.json();
    const { actualOrderIdFromApi, createdOrderId } = body;

    if (!actualOrderIdFromApi || !createdOrderId) {
      return NextResponse.json(
        { error: "Missing actualOrderIdFromApi or createdOrderId in request body" },
        { status: 400 }
      );
    }

    // Find order from DB
    const existingOrder = await Order.findById(createdOrderId);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If already completed, skip update
    if (existingOrder.status.toString().toLowerCase() === "completed") {
      return NextResponse.json(
        {
          message: "Order is already completed — no update needed",
          updatedOrder: existingOrder,
        },
        { status: 200 }
      );
    }

    // Else, update from API
    const updatedOrder = await updateOrderStatusFromApi(
      actualOrderIdFromApi,
      createdOrderId
    );

    return NextResponse.json(
      {
        message: "Order status updated successfully",
        updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in refreshOrderById:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

