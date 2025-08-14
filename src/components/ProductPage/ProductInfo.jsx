import './ProductInfo.css';

const ProductInfo = () => {
  return (
    <div className="product-info">
      <h1 className="product-title">CUSTOM MAP Whiskey Glass</h1>
      
      <div className="product-price">
        <span className="price">$35.00</span>
        <span className="price-note">Free shipping on orders over $75</span>
      </div>
      
      <div className="product-description">
        <p>
          Raise a glass to honor your origins and local pride with our personalized 
          Hometown Map Engraved Whiskey Glass. Each sip celebrates your distinctive 
          sense of belonging.
        </p>
      </div>
      
      <div className="product-features">
        <ul>
          <li>11oz rocks glass, perfect for whiskey or cocktails</li>
          <li>Precision laser-engraved with your custom map</li>
          <li>Dishwasher safe, durable construction</li>
          <li>Made in USA with premium glass</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductInfo;