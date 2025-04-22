require('dotenv').config();
const { Telegraf, Markup } = require("telegraf");
const airtableService = require('./airtableService');

// Enable debug logging
const debug = true;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(TOKEN);

// Store user data temporarily (in production, use a database)
const userData = new Map();

// const web_link = "https://celebrated-torte-184681.netlify.app/";
const web_link = "https://tgbot.alazargetachew.com/";

// Helper function to log debug messages
const logDebug = (message, data = null) => {
  if (debug) {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Helper function to create keyboard
const createMainMenu = () => {
  logDebug('Creating main menu');
  return Markup.keyboard([
    ['Make Order', 'View Orders'],
    ['Update Account']
  ]).resize();
};

// Helper function to create order type keyboard
const createOrderTypeMenu = () => {
  logDebug('Creating order type menu');
  return Markup.keyboard([
    ['Single Order', 'Pool Order'],
    ['Back to Main Menu']
  ]).resize();
};

// Helper function to create pool selection keyboard
const createPoolMenu = async () => {
  try {
    logDebug('Fetching pool orders from Airtable');
    const poolOrders = await airtableService.getOpenPoolOrders();
    logDebug('Retrieved pool orders', poolOrders);

    const poolButtons = poolOrders.map(pool => [`Pool ${pool.poolId}`]);

    // Add navigation buttons
    poolButtons.push(['Back to Order Type', 'Back to Main Menu']);

    logDebug('Created pool menu buttons', poolButtons);
    return {
      keyboard: Markup.keyboard(poolButtons).resize(),
      pools: poolOrders // Return the pool data for message formatting
    };
  } catch (error) {
    logDebug('Error creating pool menu', error);
    return {
      keyboard: Markup.keyboard([
        ['Back to Order Type', 'Back to Main Menu']
      ]).resize(),
      pools: []
    };
  }
};

// Start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  logDebug('Start command received', { userId, user: ctx.from });

  // Check if user already exists
  if (!userData.has(userId)) {
    logDebug('New user detected, requesting phone number');
    await ctx.reply('Welcome! Let\'s create your account. Please share your phone number using the button below.',
      Markup.keyboard([
        [Markup.button.contactRequest('Share Phone Number')],
        ['Back to Start']
      ]).resize()
    );
  } else {
    logDebug('Existing user detected, showing main menu');
    await ctx.reply('Welcome back! What would you like to do?', createMainMenu());
  }
});

// Handle contact sharing
bot.on('contact', async (ctx) => {
  const userId = ctx.from.id;
  const phoneNumber = ctx.message.contact.phone_number;
  logDebug('Contact shared', { userId, phoneNumber });

  // Store phone number
  userData.set(userId, { phoneNumber, name: null });

  await ctx.reply('Great! Now please send me your full name.');
});

// Handle name input
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  logDebug('Text message received', { userId, text });

  // If we have phone number but no name
  if (userData.has(userId) && userData.get(userId).name === null) {
    const userInfo = userData.get(userId);
    userInfo.name = text;
    userData.set(userId, userInfo);
    logDebug('User account created', { userId, userInfo });

    await ctx.reply(`Account created successfully!\nName: ${text}\nPhone: ${userInfo.phoneNumber}\n\nWhat would you like to do?`, createMainMenu());
    return;
  }

  // Handle menu options
  switch (text) {
    case 'Back to Start':
      logDebug('Back to Start selected');
      await ctx.reply('Welcome! Let\'s create your account. Please share your phone number using the button below.',
        Markup.keyboard([
          [Markup.button.contactRequest('Share Phone Number')],
          ['Back to Start']
        ]).resize()
      );
      break;

    case 'Back to Main Menu':
      logDebug('Back to Main Menu selected');
      await ctx.reply('Returning to main menu...', createMainMenu());
      break;

    case 'Back to Order Type':
      logDebug('Back to Order Type selected');
      await ctx.reply('Choose order type:', createOrderTypeMenu());
      break;

    case 'Make Order':
      logDebug('Make Order selected');
      await ctx.reply('Choose order type:', createOrderTypeMenu());
      break;

    case 'Single Order':
      logDebug('Single Order selected');
      const singleOrderUrl = `${web_link}?orderType=single&username=${ctx.from.username || ctx.from.first_name}`;
      logDebug('Generated single order URL', { url: singleOrderUrl });
      await ctx.reply('Opening web app for single order...',
        Markup.inlineKeyboard([
          [Markup.button.webApp('Open Web App', singleOrderUrl)],
          [{ text: 'Back to Order Type', callback_data: 'back_to_order_type' }]
        ])
      );
      break;

    case 'Pool Order':
      logDebug('Pool Order selected');
      const poolMenuResult = await createPoolMenu();
      const poolMessage = poolMenuResult.pools.length > 0
        ? 'Available Pools:\n\n' + poolMenuResult.pools.map(pool =>
          `Pool ${pool.poolId}\nDrop-Off Location: ${pool.dropOffLocation}\n`
        ).join('\n')
        : 'No open pools available at the moment.';
      await ctx.reply(poolMessage, poolMenuResult.keyboard);
      break;

    case 'View Orders':
      logDebug('View Orders selected');
      try {
        const username = ctx.from.username || ctx.from.first_name;
        logDebug('Fetching orders for user', { username });
        
        const orders = await airtableService.getOrdersByUsername(username);
        logDebug('Retrieved orders', orders);
        
        if (orders.length === 0) {
          await ctx.reply('You have no orders yet.', createMainMenu());
          return;
        }
        
        // Format orders message
        const ordersMessage = orders.map(order => {
          const itemsList = order.items.map(item => 
            `- ${item.name} (${item.quantity} x ${item.price})`
          ).join('\n');
          
          let orderDetails = `Order #${order.orderId}
Type: ${order.orderType}
Status: ${order.status}`;

          // Add pool details if it's a pool order
          if (order.orderType === 'Pooled' && order.poolDetails) {
            orderDetails += `\nPool: ${order.poolGroup}
Drop-Off Location: ${order.poolDetails.dropOffLocation}
Pool Status: ${order.poolDetails.status}`;
          }
          
          return `${orderDetails}

Items:
${itemsList}
Total: ${order.total}

-------------------`;
        }).join('\n\n');
        
        await ctx.reply(`Your Orders:\n\n${ordersMessage}`, createMainMenu());
      } catch (error) {
        logDebug('Error fetching orders', error);
        await ctx.reply('Sorry, there was an error fetching your orders. Please try again later.', createMainMenu());
      }
      break;

    case 'Update Account':
      logDebug('Update Account selected');
      await ctx.reply('Please share your phone number again to update your account.',
        Markup.keyboard([
          [Markup.button.contactRequest('Share Phone Number')],
          ['Back to Main Menu']
        ]).resize()
      );
      break;

    default:
      // Check if the message is a pool selection
      if (text.startsWith('Pool ')) {
        const poolNumber = text.split(' ')[1];
        logDebug('Pool selected', { poolNumber });
        const poolOrderUrl = `${web_link}?orderType=pool&poolNumber=${poolNumber}&username=${ctx.from.username || ctx.from.first_name}`;
        logDebug('Generated pool order URL', { url: poolOrderUrl });
        await ctx.reply(`Opening web app for ${text}...`,
          Markup.inlineKeyboard([
            [Markup.button.webApp('Open Web App', poolOrderUrl)],
            [{ text: 'Back to Pool Selection', callback_data: 'back_to_pool' }]
          ])
        );
      }
      break;
  }
});

// Handle callback queries (for inline keyboard buttons)
bot.action('back_to_order_type', async (ctx) => {
  logDebug('Back to Order Type callback');
  await ctx.reply('Choose order type:', createOrderTypeMenu());
  await ctx.answerCbQuery();
});

bot.action('back_to_pool', async (ctx) => {
  logDebug('Back to Pool Selection callback');
  const poolMenu = await createPoolMenu();
  await ctx.reply('Select your pool:', poolMenu.keyboard);
  await ctx.answerCbQuery();
});

// Enable polling with debug logging
bot.launch().then(() => {
  logDebug('Bot started successfully');
}).catch((error) => {
  console.error('Failed to start bot:', error);
});
