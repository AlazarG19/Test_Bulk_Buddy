import React, { useState } from 'react';
import './OrderInfo.css';

const OrderInfo = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    contactNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="order-info">
      <h2>Order Information</h2>
      <form onSubmit={handleSubmit} className="order-info-form">
        <div className="form-group">
          <label htmlFor="deliveryAddress">Delivery Address</label>
          <textarea
            id="deliveryAddress"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
            required
            placeholder="Enter your delivery address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number</label>
          <input
            type="tel"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            placeholder="Enter your contact number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialInstructions">Special Instructions</label>
          <textarea
            id="specialInstructions"
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={handleChange}
            placeholder="Any special instructions for delivery"
          />
        </div>

        <div className="button-group">
          <button type="button" className="back-button" onClick={onBack}>
            Back to Cart
          </button>
          <button type="submit" className="submit-button">
            Proceed to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderInfo; 