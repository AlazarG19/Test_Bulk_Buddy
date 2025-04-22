import React, { useState, useEffect } from 'react';
import { airtableService } from '../../services/airtable';
import Button from '../Button/Button';
import './PoolOrders.css';

function PoolOrders({ onSelectPool, username }) {
  const [poolOrders, setPoolOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    fetchPoolOrders();
  }, []);

  const fetchPoolOrders = async () => {
    try {
      setLoading(true);
      const orders = await airtableService.getOpenPoolOrders();
      setPoolOrders(orders);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pool orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewPool = async () => {
    try {
      setRequestStatus('Creating new pool order...');
      const newPool = await airtableService.createPoolOrderRequest(username);
      setRequestStatus('Pool order created successfully!');
      // Refresh the list
      await fetchPoolOrders();
      // Automatically select the new pool
      onSelectPool(newPool.poolId);
    } catch (err) {
      setRequestStatus('Failed to create pool order');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="pool-orders loading">Loading pool orders...</div>;
  }

  return (
    <div className="pool-orders">
      <h2>Available Pool Orders</h2>
      
      {error && <div className="error-message">{error}</div>}
      {requestStatus && <div className="status-message">{requestStatus}</div>}

      {poolOrders.length === 0 ? (
        <div className="no-pools">
          <p>No open pool orders available</p>
          <Button
            title="Request New Pool Order"
            type="checkout"
            onClick={handleRequestNewPool}
          />
        </div>
      ) : (
        <>
          <div className="pool-list">
            {poolOrders.map((pool) => (
              <div key={pool.id} className="pool-item">
                <div className="pool-info">
                  <h3>Pool ID: {pool.poolId}</h3>
                  <p>Created by: {pool.createdBy}</p>
                  <p>Location: {pool.dropOffLocation}</p>
                </div>
                <Button
                  title="Join Pool"
                  type="checkout"
                  onClick={() => onSelectPool(pool.poolId)}
                />
              </div>
            ))}
          </div>
          
          <div className="request-new">
            <Button
              title="Request New Pool Order"
              type="checkout"
              onClick={handleRequestNewPool}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default PoolOrders; 