import React, { useState } from "react";
import "./OrderInfo.css";
import Button from "../Button/Button";

function OrderInfo({ onSubmit, onBack, isPoolOrder }) {
  const [formData, setFormData] = useState({
    location: "",
    deliveryDate: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="order-info">
      <h2>Order Information</h2>
      <form onSubmit={handleSubmit}>
        {!isPoolOrder && (
          <div className="form-group">
            <label htmlFor="location">Delivery Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required={!isPoolOrder}
              placeholder="Enter your delivery address"
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="deliveryDate">Delivery Date</label>
          <input
            type="date"
            id="deliveryDate"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any special instructions?"
            rows="3"
          />
        </div>

        <div className="button-group">
          <Button
            title="Back to Cart"
            type="back"
            onClick={onBack}
          />
          <Button
            title="Place Order"
            type="submit"
          />
        </div>
      </form>
    </div>
  );
}

export default OrderInfo; 