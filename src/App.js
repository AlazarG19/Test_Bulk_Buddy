import { useState, useEffect } from "react";
import "./App.css";
import Card from "./Components/Card/Card";
import CartPage from "./Components/Cart/CartPage";
import OrderInfo from "./Components/OrderInfo/OrderInfo";
import { airtableService } from "./services/airtable";

// Check if running in Telegram WebApp
const isTelegramWebApp = window.Telegram && window.Telegram.WebApp;
const tele = isTelegramWebApp ? window.Telegram.WebApp : null;

// Debug logging function that works in both environments
const logDebug = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  // Always log to console
  console.log(logMessage, data || '');
  
  // For important messages, return them to be displayed in the UI
  if (data && (data.error || data.stack)) {
    return `${logMessage}\n${JSON.stringify(data, null, 2)}`;
  }
  return null;
};

function App() {
  const [foods, setFoods] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    // Load cart items from localStorage on initial render
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orderType, setOrderType] = useState(null);
  const [poolNumber, setPoolNumber] = useState(null);
  const [showOrderInfo, setShowOrderInfo] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [debugMessage, setDebugMessage] = useState(null);

  // Fetch products from Airtable
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const message = logDebug('Fetching products from Airtable');
        if (message) setDebugMessage(message);
        const products = await airtableService.getProducts();
        const successMessage = logDebug('Products fetched successfully', { count: products.length });
        if (successMessage) setDebugMessage(successMessage);
        setFoods(products);
      } catch (error) {
        const errorMessage = logDebug('Error loading products', error);
        if (errorMessage) setDebugMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get user info based on context
  useEffect(() => {
    if (isTelegramWebApp) {
      const initMessage = logDebug('Initializing Telegram WebApp');
      if (initMessage) setDebugMessage(initMessage);
      // Get user info from Telegram WebApp
      if (tele.initDataUnsafe?.user) {
        const user = tele.initDataUnsafe.user;
        const userMessage = logDebug('Telegram user info received', user);
        if (userMessage) setDebugMessage(userMessage);
        setUsername(user.username || user.first_name);
        // Initialize Telegram WebApp
        tele.ready();
        // Expand the WebApp to full height
        tele.expand();
      }
    } else {
      // Get user info from URL parameters (for regular browser)
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      if (username) {
        const userMessage = logDebug('Regular browser user detected', { username });
        if (userMessage) setDebugMessage(userMessage);
        setUsername(username);
      }
    }
  }, []);

  // Get order type and pool number from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('orderType');
    const pool = urlParams.get('poolNumber');
    
    logDebug('Order parameters received', { type, pool });
    setOrderType(type);
    setPoolNumber(pool);
  }, []);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    logDebug('Cart items updated', cartItems);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle closing the WebApp
  useEffect(() => {
    if (isTelegramWebApp) {
      logDebug('Setting up WebApp back button');
      // Add event listener for the back button
      tele.BackButton.onClick(() => {
        logDebug('Back button clicked');
        if (showCart) {
          setShowCart(false);
        } else if (showOrderInfo) {
          setShowOrderInfo(false);
        } else {
          tele.close();
        }
      });

      // Show/hide back button based on current view
      if (showCart || showOrderInfo) {
        tele.BackButton.show();
      } else {
        tele.BackButton.hide();
      }
    }
  }, [showCart, showOrderInfo]);

  const onAdd = (food) => {
    logDebug('Adding item to cart', food);
    const exist = cartItems.find((x) => x.id === food.id);
    if (exist) {
      setCartItems(
        cartItems.map((x) =>
          x.id === food.id ? { ...exist, quantity: exist.quantity + 1 } : x
        )
      );
    } else {
      setCartItems([...cartItems, { ...food, quantity: 1 }]);
    }
  };

  const onRemove = (food) => {
    logDebug('Removing item from cart', food);
    const exist = cartItems.find((x) => x.id === food.id);
    if (exist.quantity === 1) {
      setCartItems(cartItems.filter((x) => x.id !== food.id));
    } else {
      setCartItems(
        cartItems.map((x) =>
          x.id === food.id ? { ...exist, quantity: exist.quantity - 1 } : x
        )
      );
    }
  };

  const handleCheckout = async () => {
    logDebug('Checkout initiated', { orderType, cartItems });
    if (orderType === 'single') {
      setShowOrderInfo(true);
    } else {
      await processOrder();
    }
  };

  const processOrder = async (orderInfo = null) => {
    try {
      logDebug('Processing order', { orderInfo, cartItems });
      const total = cartItems.reduce((a, c) => a + c.price * c.quantity, 0);
      
      await airtableService.createOrder({
        orderType,
        poolNumber,
        items: cartItems,
        total,
        orderInfo,
        username
      });

      logDebug('Order processed successfully');
      setOrderStatus('Order placed successfully!');
      
      // Clear cart after successful order
      setCartItems([]);
      localStorage.removeItem('cartItems');
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setOrderStatus(null);
        setShowCart(false);
        setShowOrderInfo(false);
        // Close WebApp if in Telegram
        if (isTelegramWebApp) {
          tele.close();
        }
      }, 3000);
    } catch (error) {
      logDebug('Error processing order', error);
      
      // Format error message to be more readable
      let errorMessage = 'Failed to place order. Please try again.\n\n';
      
      if (error.message) {
        errorMessage += `Error: ${error.message}\n`;
      }
      
      if (error.response) {
        errorMessage += `Status: ${error.response.status}\n`;
        if (error.response.data) {
          errorMessage += `Details: ${JSON.stringify(error.response.data, null, 2)}\n`;
        }
      }
      
      if (error.stack) {
        errorMessage += `\nTechnical Details:\n${error.stack.split('\n').slice(0, 3).join('\n')}`;
      }
      
      setOrderStatus(errorMessage);
      
      // Keep error message visible longer
      setTimeout(() => {
        setOrderStatus(null);
      }, 10000); // Show error for 10 seconds
    }
  };

  const handleOrderInfoSubmit = async (orderInfo) => {
    logDebug('Order info submitted', orderInfo);
    await processOrder(orderInfo);
  };

  const handleBackToCart = () => {
    logDebug('Navigating back to cart');
    setShowOrderInfo(false);
  };

  const handleBackToMenu = () => {
    logDebug('Navigating back to menu');
    setShowCart(false);
  };

  const handleClearCart = () => {
    logDebug('Clearing cart');
    setCartItems([]);
    localStorage.removeItem('cartItems');
  };

  const handleViewCart = () => {
    logDebug('Viewing cart');
    setShowCart(true);
  };

  if (isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <>
      <h1 className="heading">
        {orderType === 'single' ? 'Single Order' : `Pool Order ${poolNumber}`}
      </h1>
      
      {orderStatus && (
        <div className="order-status">
          {orderStatus}
        </div>
      )}
      
      {debugMessage && (
        <div className="debug-message">
          <pre>{debugMessage}</pre>
        </div>
      )}
      
      {showOrderInfo ? (
        <OrderInfo 
          onSubmit={handleOrderInfoSubmit} 
          onBack={handleBackToCart}
          isPoolOrder={orderType !== 'single'}
        />
      ) : showCart ? (
        <CartPage 
          cartItems={cartItems}
          onAdd={onAdd}
          onRemove={onRemove}
          onCheckout={handleCheckout}
          onBack={handleBackToMenu}
          onClearCart={handleClearCart}
        />
      ) : (
        <>
          <div className="menu-header">
            <button className="view-cart-btn" onClick={handleViewCart}>
              View Cart ({cartItems.reduce((a, c) => a + c.quantity, 0)})
            </button>
          </div>
          <div className="cards__container">
            {foods.map((food) => {
              return (
                <Card 
                  food={food} 
                  key={food.id} 
                  onAdd={onAdd} 
                  onRemove={onRemove}
                  cartItems={cartItems}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default App;
