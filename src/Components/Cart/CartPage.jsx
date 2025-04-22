import React from "react";
import "./CartPage.css";
import Button from "../Button/Button";

function CartPage({ cartItems, onAdd, onRemove, onCheckout, onBack, onClearCart }) {
  const totalPrice = cartItems.reduce((a, c) => a + c.price * c.quantity, 0);

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Button
            title="Back to Menu"
            type="back"
            onClick={onBack}
          />
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h3>{item.title}</h3>
                  <div className="item-quantity">
                    <button 
                      className="quantity-btn" 
                      onClick={() => onRemove(item)}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => onAdd(item)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total-section">
              <span>Order Total:</span>
              <span className="total-price">${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="button-group">
              <Button
                title="Back to Menu"
                type="back"
                onClick={onBack}
              />
              <Button
                title="Clear Cart"
                type="remove"
                onClick={onClearCart}
              />
              <Button
                title="Proceed to Checkout"
                type="checkout"
                onClick={onCheckout}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage; 