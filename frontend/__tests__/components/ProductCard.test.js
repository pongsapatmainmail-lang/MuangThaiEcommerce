/**
 * ===========================================
 * ProductCard Component Tests
 * ===========================================
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

// Mock useCart hook
jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    addItem: jest.fn(),
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: 1000,
    stock: 10,
    main_image: '/test-image.jpg',
    average_rating: 4.5,
    review_count: 10,
    seller_name: 'Test Shop',
  };

  it('renders product name correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product price correctly', () => {
    render(<ProductCard product={mockProduct} />);
    // Thai Baht format: ฿1,000.00
    expect(screen.getByText(/฿1,000/)).toBeInTheDocument();
  });

  it('renders seller name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Shop')).toBeInTheDocument();
  });

  it('renders rating', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('shows add to cart button when in stock', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('เพิ่มลงตะกร้า')).toBeInTheDocument();
  });

  it('shows out of stock message when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText('สินค้าหมด')).toBeInTheDocument();
  });

  it('links to product detail page', () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/1');
  });
});