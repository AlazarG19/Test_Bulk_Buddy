import React from "react";
import "./Card.css";
import Button from "../Button/Button";

function Card({ food, onAdd, onRemove, cartItems }) {
  const { title, Image, price, id } = food;
  console.log("food inside card",food)
  
  // Find the item in cart and get its quantity, or return 0 if not found
  const count = cartItems.find(item => item.id === id)?.quantity || 0;

  const handleIncrement = () => {
    onAdd(food);
  };

  const handleDecrement = () => {
    onRemove(food);
  };

  return (
    <div className="card">
      <span
        className={`${count !== 0 ? "card__badge" : "card__badge--hidden"}`}
      >
        {count}
      </span>
      <div className="image__container">
        <img src={Image} alt={title} />
      </div>
      <h4 className="card__title">
        {title} . <span className="card__price">$ {price}</span>
      </h4>

      <div className="btn-container">
        <Button title={"+"} type={"add"} onClick={handleIncrement} />
        {count !== 0 ? (
          <Button title={"-"} type={"remove"} onClick={handleDecrement} />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default Card;
