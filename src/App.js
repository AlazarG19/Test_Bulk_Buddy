import { useState, useEffect } from "react";
import "./App.css";
import Card from "./Components/Card/Card";
import CartPage from "./Components/Cart/CartPage";
import OrderInfo from "./Components/OrderInfo/OrderInfo";
const { getData } = require("./db/db");
const foods = getData();

const tele = window.Telegram.WebApp;

function App() {
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

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    tele.ready();
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('orderType');
    const pool = urlParams.get('poolNumber');
    
    setOrderType(type);
    setPoolNumber(pool);
  }, []);

  const onAdd = (food) => {
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
    if (orderType === 'single') {
      setShowOrderInfo(true);
    } else {
      await processOrder();
    }
  };

  const processOrder = async () => {
    try {
      // Dummy API endpoint - replace with your actual endpoint
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType,
          poolNumber,
          items: cartItems,
          total: cartItems.reduce((a, c) => a + c.price * c.quantity, 0),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      const result = await response.json();
      setOrderStatus('Order placed successfully!');
      
      // Clear cart after successful order
      setCartItems([]);
      localStorage.removeItem('cartItems');
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setOrderStatus(null);
        setShowCart(false);
      }, 3000);
    } catch (error) {
      setOrderStatus('Failed to place order. Please try again.');
    }
  };

  const handleOrderInfoSubmit = async (orderInfo) => {
    try {
      // Dummy API endpoint - replace with your actual endpoint
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType,
          items: cartItems,
          total: cartItems.reduce((a, c) => a + c.price * c.quantity, 0),
          orderInfo,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      const result = await response.json();
      setOrderStatus('Order placed successfully!');
      
      // Clear cart after successful order
      setCartItems([]);
      localStorage.removeItem('cartItems');
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setOrderStatus(null);
        setShowOrderInfo(false);
      }, 3000);
    } catch (error) {
      setOrderStatus('Failed to place order. Please try again.');
    }
  };

  const handleBackToCart = () => {
    setShowOrderInfo(false);
  };

  const handleBackToMenu = () => {
    setShowCart(false);
  };

  const handleViewCart = () => {
    setShowCart(true);
  };

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
      
      {showOrderInfo ? (
        <OrderInfo onSubmit={handleOrderInfoSubmit} onBack={handleBackToCart} />
      ) : showCart ? (
        <CartPage 
          cartItems={cartItems}
          onAdd={onAdd}
          onRemove={onRemove}
          onCheckout={handleCheckout}
          onBack={handleBackToMenu}
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
                <Card food={food} key={food.id} onAdd={onAdd} onRemove={onRemove} />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default App;
