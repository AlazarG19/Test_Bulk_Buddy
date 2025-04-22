const Airtable = require('airtable');
require('dotenv').config();

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Table names
const ORDERS_TABLE = 'Orders';
const ORDER_ITEMS_TABLE = 'OrderItem';
const PRODUCTS_TABLE = 'Products';
const POOLED_ORDERS_TABLE = 'Pooled Orders';

const airtableService = {
    // Fetch open pool orders
    async getOpenPoolOrders() {
        try {
            const records = await base(POOLED_ORDERS_TABLE)
                .select({
                    filterByFormula: "Status = 'Open'",
                    view: 'Grid view'
                })
                .all();
            
            return records.map(record => ({
                id: record.id,
                poolId: record.fields['Pool ID'],
                createdBy: record.fields['Created By'],
                dropOffLocation: record.fields['Drop-Off Location'],
                status: record.fields['Status']
            }));
        } catch (error) {
            console.error('Error fetching pool orders:', error);
            return [];
        }
    },

    // Fetch orders by username
    async getOrdersByUsername(username) {
        try {
            console.log("Fetching orders for username:", username);
            
            // First get all orders for the user
            const orderRecords = await base(ORDERS_TABLE)
                .select({
                    filterByFormula: `{Customer} = '${username}'`,
                    view: 'Grid view'
                })
                .all();

            console.log("Found orders:", orderRecords.length);

            // For each order, fetch its items and pool details if it's a pool order
            const ordersWithItems = await Promise.all(
                orderRecords.map(async (order) => {
                    console.log("Processing order:", order.fields['Order ID']);
                    
                    // Get order items
                    const orderItemIds = order.fields.OrderItem || [];
                    const orderItems = await Promise.all(
                        orderItemIds.map(async (itemId) => {
                            const itemRecord = await base(ORDER_ITEMS_TABLE).find(itemId);
                            const productId = itemRecord.fields.Products[0];
                            const productRecord = await base(PRODUCTS_TABLE).find(productId);
                            
                            return {
                                name: productRecord.fields['Product Name'],
                                quantity: itemRecord.fields.Quantity,
                                price: productRecord.fields['Price (per unit)']
                            };
                        })
                    );

                    // If it's a pool order, fetch the pool details
                    let poolDetails = null;
                    if (order.fields['Order Type'] === 'Pooled' && order.fields['Pool Group']) {
                        try {
                            const poolRecords = await base(POOLED_ORDERS_TABLE)
                                .select({
                                    filterByFormula: `{Pool ID} = '${order.fields['Pool Group']}'`,
                                    maxRecords: 1
                                })
                                .firstPage();
                            
                            if (poolRecords && poolRecords.length > 0) {
                                poolDetails = {
                                    dropOffLocation: poolRecords[0].fields['Drop-Off Location'],
                                    status: poolRecords[0].fields['Status']
                                };
                            }
                        } catch (error) {
                            console.error('Error fetching pool details:', error);
                        }
                    }

                    return {
                        orderId: order.fields['Order ID'],
                        orderType: order.fields['Order Type'],
                        status: order.fields.Status,
                        total: order.fields['Total Amount'],
                        poolGroup: order.fields['Pool Group'],
                        poolDetails: poolDetails,
                        items: orderItems
                    };
                })
            );

            console.log("Processed orders with items:", ordersWithItems.length);
            return ordersWithItems;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }
};

module.exports = airtableService; 