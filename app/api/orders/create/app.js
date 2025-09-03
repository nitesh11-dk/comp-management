import axios from 'axios';
import FormData from 'form-data';
import Order from '@/lib/models/Order';

const providerApiUrl = process.env.PROVIDER_API_URL ;
const providerApiKey = process.env.PROVIDER_API_KEY ;


export async function updateOrderStatusFromApi(actualOrderIdFromApi, createdOrderId) {
  try {
    const form = new FormData();
    form.append('key', providerApiKey);
    form.append('action', 'status');
    form.append('order', actualOrderIdFromApi);

    const response = await axios.post(providerApiUrl, form, {
      headers: form.getHeaders(),
    });

    const { start_count, status, remains } = response.data;

    return await Order.findByIdAndUpdate(
      createdOrderId,
      { startCount: start_count, status, remains },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating order status:', error.message);
    throw new Error('Failed to update order status');
  }
} 
