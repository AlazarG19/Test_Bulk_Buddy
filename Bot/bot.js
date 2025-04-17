const { Telegraf, Markup } = require("telegraf");
const TOKEN = "8119115858:AAGvVisjMapkVru9RePnMrDNU5a24_YkHh0";
const bot = new Telegraf(TOKEN);

// Store user data temporarily (in production, use a database)
const userData = new Map();

// const web_link = "https://celebrated-torte-184681.netlify.app/";
const web_link = "https://tgbot.alazargetachew.com/";

// Helper function to create keyboard
const createMainMenu = () => {
  return Markup.keyboard([
    ['Make Order', 'View Orders'],
    ['Update Account']
  ]).resize();
};

// Helper function to create order type keyboard
const createOrderTypeMenu = () => {
  return Markup.keyboard([
    ['Single Order', 'Pool Order'],
    ['Back to Main Menu']
  ]).resize();
};

// Helper function to create pool selection keyboard
const createPoolMenu = () => {
  return Markup.keyboard([
    ['Pool 1', 'Pool 2', 'Pool 3'],
    ['Back to Order Type', 'Back to Main Menu']
  ]).resize();
};

// Start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  
  // Check if user already exists
  if (!userData.has(userId)) {
    await ctx.reply('Welcome! Let\'s create your account. Please share your phone number using the button below.', 
      Markup.keyboard([
        [Markup.button.contactRequest('Share Phone Number')],
        ['Back to Start']
      ]).resize()
    );
  } else {
    await ctx.reply('Welcome back! What would you like to do?', createMainMenu());
  }
});

// Handle contact sharing
bot.on('contact', async (ctx) => {
  const userId = ctx.from.id;
  const phoneNumber = ctx.message.contact.phone_number;
  
  // Store phone number
  userData.set(userId, { phoneNumber, name: null });
  
  await ctx.reply('Great! Now please send me your full name.', 
    
  );
});

// Handle name input
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  
  // If we have phone number but no name
  if (userData.has(userId) && userData.get(userId).name === null) {
    const userInfo = userData.get(userId);
    userInfo.name = text;
    userData.set(userId, userInfo);
    
    await ctx.reply(`Account created successfully!\nName: ${text}\nPhone: ${userInfo.phoneNumber}\n\nWhat would you like to do?`, createMainMenu());
    return;
  }
  
  // Handle menu options
  switch (text) {
    case 'Back to Start':
      await ctx.reply('Welcome! Let\'s create your account. Please share your phone number using the button below.', 
        Markup.keyboard([
          [Markup.button.contactRequest('Share Phone Number')],
          ['Back to Start']
        ]).resize()
      );
      break;

    case 'Back to Main Menu':
      await ctx.reply('Returning to main menu...', createMainMenu());
      break;

    case 'Back to Order Type':
      await ctx.reply('Choose order type:', createOrderTypeMenu());
      break;

    case 'Make Order':
      await ctx.reply('Choose order type:', createOrderTypeMenu());
      break;
      
    case 'Single Order':
      // Pass order type to web app
      const singleOrderUrl = `${web_link}?orderType=single&userId=${ctx.from.id}`;
      await ctx.reply('Opening web app for single order...', 
        Markup.inlineKeyboard([
          [Markup.button.webApp('Open Web App', singleOrderUrl)],
          [{ text: 'Back to Order Type', callback_data: 'back_to_order_type' }]
        ])
      );
      break;
      
    case 'Pool Order':
      await ctx.reply('Select your pool:', createPoolMenu());
      break;
      
    case 'Pool 1':
    case 'Pool 2':
    case 'Pool 3':
      const poolNumber = text.split(' ')[1];
      const poolOrderUrl = `${web_link}?orderType=pool&poolNumber=${poolNumber}&userId=${ctx.from.id}`;
      await ctx.reply(`Opening web app for ${text}...`, 
        Markup.inlineKeyboard([
          [Markup.button.webApp('Open Web App', poolOrderUrl)],
          [{ text: 'Back to Pool Selection', callback_data: 'back_to_pool' }]
        ])
      );
      break;
      
    case 'View Orders':
      await ctx.reply('Order history feature coming soon!', createMainMenu());
      break;
      
    case 'Update Account':
      await ctx.reply('Please share your phone number again to update your account.', 
        Markup.keyboard([
          [Markup.button.contactRequest('Share Phone Number')],
          ['Back to Main Menu']
        ]).resize()
      );
      break;
  }
});

// Handle callback queries (for inline keyboard buttons)
bot.action('back_to_order_type', async (ctx) => {
  await ctx.reply('Choose order type:', createOrderTypeMenu());
  await ctx.answerCbQuery();
});

bot.action('back_to_pool', async (ctx) => {
  await ctx.reply('Select your pool:', createPoolMenu());
  await ctx.answerCbQuery();
});

bot.launch();
