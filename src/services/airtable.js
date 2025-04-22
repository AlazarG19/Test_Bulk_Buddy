import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_API_KEY }).base(process.env.REACT_APP_AIRTABLE_BASE_ID);

// Products table
const PRODUCTS_TABLE = 'Products';
// Orders table
const ORDERS_TABLE = 'Orders';
// Order Items table
const ORDER_ITEMS_TABLE = 'OrderItem';
// Pooled Orders table
const POOLED_ORDERS_TABLE = 'Pooled Orders';

// Helper function to generate random ID
const generateOrderId = () => {
    return Math.floor(Math.random() * (100 - 1 + 1)) + 1;
};

export const airtableService = {
    // Fetch all products
    async getProducts() {
        try {
            const records = await base(PRODUCTS_TABLE).select({
                view: 'Grid view'
            }).all();
            console.log("records", records)
            return records.map(record => ({
                id: record.id,
                title: record.fields["Product Name"],
                price: record.fields["Price (per unit)"],
                description: record.fields.Description,
                image: record.fields.Image?.[0]?.url
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    // Create order items and return their IDs
    async createOrderItems(orderId, items) {
        try {
            const orderItemRecords = await Promise.all(
                items.map(async (item) => {
                    console.log("orderitem", {
                        'Order': orderId,
                        'Products': [item.id],
                        'Quantity': item.quantity
                    });
                    const record = await base(ORDER_ITEMS_TABLE).create({
                        'Order': orderId,
                        'Products': [item.id],
                        'Quantity': item.quantity
                    });
                    return record.id;
                })
            );
            return orderItemRecords;
        } catch (error) {
            console.error('Error creating order items:', error);
            throw error;
        }
    },

    // Create a new order
    async createOrder(orderData) {
        try {
            const { orderType, poolNumber, items, total, orderInfo, username } = orderData;
            
            // Format pool group value based on order type
            const poolGroupValue = orderType === 'single' ? null : poolNumber;
            
            // First create the order
            const orderRecord = await base(ORDERS_TABLE).create({
                'Order ID': generateOrderId(),
                'Customer': username,
                'Order Type': orderType === 'single' ? 'Single' : 'Pooled',
                'Status': 'Pending',
                'Total Amount': total,
                'Payment Status': 'Pending',
                'Pool Group': poolGroupValue,
                'Delivery Date': orderInfo?.deliveryDate || null
            });

            // Then create order items linked to this order
            const orderItemIds = await this.createOrderItems(orderRecord.id, items);

            // Update the order with the order item references
            await base(ORDERS_TABLE).update(orderRecord.id, {
                'OrderItem': orderItemIds
            });

            return orderRecord;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

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

    // Create a new pool order request
    async createPoolOrderRequest(username) {
        try {
            // Generate a new pool ID (you might want to make this more sophisticated)
            const poolId = `${Math.floor(Math.random() * 10000)}`;
            console.log("poolId", poolId)
            const record = await base(POOLED_ORDERS_TABLE).create({
                'Pool ID': poolId,
                'Created By': username,
                'Status': 'Waiting For Acceptance',
                'Drop-Off Location': 'To be determined'
            });

            return {
                id: record.id,
                poolId: record.fields['Pool ID'],
                createdBy: record.fields['Created By'],
                status: record.fields['Status']
            };
        } catch (error) {
            console.error('Error creating pool order:', error);
            throw error;
        }
    },

    // Fetch orders by username
    async getOrdersByUsername(username) {
        try {
            console.log("username", username)
            // First get all orders for the user
            const orderRecords = await base(ORDERS_TABLE)
                .select({
                    filterByFormula: `{Customer} = '${username}'`,
                    view: 'Grid view'
                })
                .all();
            console.log("orderRecords", orderRecords)
            // For each order, fetch its items
            const ordersWithItems = await Promise.all(
                orderRecords.map(async (order) => {
                    // Get order item
                    console.log("order", order)
                    const orderItemIds = order.fields.OrderItem || [];
                    const orderItems = await Promise.all(
                        orderItemIds.map(async (itemId) => {
                            const itemRecord = await base(ORDER_ITEMS_TABLE).find(itemId);
                            const productId = itemRecord.fields.Products[0];
                            const productRecord = await base(PRODUCTS_TABLE).find(productId);
                            
                            return {
                                name: productRecord.fields['Products'],
                                quantity: itemRecord.fields.Quantity
                            };
                        })
                    );

                    return {
                        orderId: order.fields['Order ID'],
                        orderType: order.fields['Order Type'],
                        status: order.fields.Status,
                        total: order.fields['Total Amount'],
                        poolGroup: order.fields['Pool Group'],
                        items: orderItems
                    };
                })
            );

            return ordersWithItems;
        } catch (error) {
            console.error('Error fetching orderss:', error);
            throw error;
        }
    }
}; 