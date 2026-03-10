// utils/__tests__/validation.test.js
// Unit tests for validation utility

import { validateInput, validateSchema, ERROR_MESSAGES } from '../validation';

describe('validateInput', () => {
  describe('required', () => {
    it('should return true for valid values', () => {
      expect(validateInput.required('test')).toBe(true);
      expect(validateInput.required(123)).toBe(true);
      expect(validateInput.required(0)).toBe(true);
      expect(validateInput.required(false)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(validateInput.required('')).toBe(false);
      expect(validateInput.required(null)).toBe(false);
      expect(validateInput.required(undefined)).toBe(false);
    });
  });

  describe('email', () => {
    it('should return true for valid emails', () => {
      expect(validateInput.email('test@example.com')).toBe(true);
      expect(validateInput.email('user.name@domain.co.uk')).toBe(true);
      expect(validateInput.email('test+tag@example.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateInput.email('invalid-email')).toBe(false);
      expect(validateInput.email('test@')).toBe(false);
      expect(validateInput.email('@example.com')).toBe(false);
      expect(validateInput.email('')).toBe(false);
    });
  });

  describe('barcode', () => {
    it('should return true for valid barcodes', () => {
      expect(validateInput.barcode('123456789')).toBe(true);
      expect(validateInput.barcode('ABC123DEF')).toBe(true);
      expect(validateInput.barcode('123-456-789')).toBe(true);
      expect(validateInput.barcode('ABC_123_DEF')).toBe(true);
    });

    it('should return false for invalid barcodes', () => {
      expect(validateInput.barcode('12')).toBe(false); // Too short
      expect(validateInput.barcode('A'.repeat(51))).toBe(false); // Too long
      expect(validateInput.barcode('123@456')).toBe(false); // Invalid character
      expect(validateInput.barcode('')).toBe(false);
    });
  });

  describe('productCode', () => {
    it('should return true for valid product codes', () => {
      expect(validateInput.productCode('ABC123')).toBe(true);
      expect(validateInput.productCode('123')).toBe(true);
      expect(validateInput.productCode('ABC_123')).toBe(true);
      expect(validateInput.productCode('A'.repeat(20))).toBe(true);
    });

    it('should return false for invalid product codes', () => {
      expect(validateInput.productCode('')).toBe(false);
      expect(validateInput.productCode('A'.repeat(21))).toBe(false); // Too long
      expect(validateInput.productCode('ABC@123')).toBe(false); // Invalid character
    });
  });

  describe('productName', () => {
    it('should return true for valid product names', () => {
      expect(validateInput.productName('Product Name')).toBe(true);
      expect(validateInput.productName('Product-Name')).toBe(true);
      expect(validateInput.productName('Product_Name')).toBe(true);
      expect(validateInput.productName('Product.Name')).toBe(true);
    });

    it('should return false for invalid product names', () => {
      expect(validateInput.productName('')).toBe(false);
      expect(validateInput.productName('A'.repeat(101))).toBe(false); // Too long
      expect(validateInput.productName('Product@Name')).toBe(false); // Invalid character
    });
  });

  describe('password', () => {
    it('should return true for valid passwords', () => {
      expect(validateInput.password('Password123')).toBe(true);
      expect(validateInput.password('MyPass@123')).toBe(true);
      expect(validateInput.password('SecurePass1')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(validateInput.password('short')).toBe(false); // Too short
      expect(validateInput.password('password')).toBe(false); // No numbers
      expect(validateInput.password('12345678')).toBe(false); // No letters
      expect(validateInput.password('')).toBe(false);
    });
  });

  describe('currency', () => {
    it('should return true for valid currency values', () => {
      expect(validateInput.currency('123.45')).toBe(true);
      expect(validateInput.currency('0.99')).toBe(true);
      expect(validateInput.currency('1000')).toBe(true);
      expect(validateInput.currency('0')).toBe(true);
    });

    it('should return false for invalid currency values', () => {
      expect(validateInput.currency('-123.45')).toBe(false); // Negative
      expect(validateInput.currency('123.456')).toBe(false); // Too many decimals
      expect(validateInput.currency('abc')).toBe(false); // Non-numeric
      expect(validateInput.currency('1000000')).toBe(false); // Too large
    });
  });

  describe('quantity', () => {
    it('should return true for valid quantities', () => {
      expect(validateInput.quantity('1')).toBe(true);
      expect(validateInput.quantity('9999')).toBe(true);
      expect(validateInput.quantity('100')).toBe(true);
      expect(validateInput.quantity(5)).toBe(true);
      expect(validateInput.quantity('5')).toBe(true);
    });

    it('should return false for invalid quantities', () => {
      expect(validateInput.quantity('0')).toBe(false); // Zero
      expect(validateInput.quantity('-1')).toBe(false); // Negative
      expect(validateInput.quantity('10000')).toBe(false); // Too large
      expect(validateInput.quantity('abc')).toBe(false); // Non-numeric
      expect(validateInput.quantity('')).toBe(false); // Empty
      expect(validateInput.quantity(null)).toBe(false); // Null
      expect(validateInput.quantity(undefined)).toBe(false); // Undefined
    });
  });

  describe('length', () => {
    it('should return true for valid lengths', () => {
      expect(validateInput.length('test', 1, 10)).toBe(true);
      expect(validateInput.length('test', 4, 4)).toBe(true);
      expect(validateInput.length('test', 1, 100)).toBe(true);
    });

    it('should return false for invalid lengths', () => {
      expect(validateInput.length('test', 5, 10)).toBe(false); // Too short
      expect(validateInput.length('test', 1, 3)).toBe(false); // Too long
      expect(validateInput.length('', 1, 10)).toBe(false); // Empty
    });
  });

  describe('range', () => {
    it('should return true for valid ranges', () => {
      expect(validateInput.range('5', 1, 10)).toBe(true);
      expect(validateInput.range('1', 1, 10)).toBe(true);
      expect(validateInput.range('10', 1, 10)).toBe(true);
    });

    it('should return false for invalid ranges', () => {
      expect(validateInput.range('0', 1, 10)).toBe(false); // Below minimum
      expect(validateInput.range('11', 1, 10)).toBe(false); // Above maximum
      expect(validateInput.range('abc', 1, 10)).toBe(false); // Non-numeric
    });
  });
});

describe('validateSchema', () => {
  describe('product', () => {
    it('should validate a complete product', () => {
      const product = {
        code: 'ABC123',
        name: 'Test Product',
        price: '19.99',
        category: 'Electronics',
        stock: '10'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate a complete product with stock', () => {
      const product = {
        code: 'ABC123',
        name: 'Test Product',
        price: '19.99',
        category: 'Electronics',
        stock: '5'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate a product with numeric stock', () => {
      const product = {
        code: 'ABC123',
        name: 'Test Product',
        price: '19.99',
        stock: 5
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject invalid product code', () => {
      const product = {
        code: '',
        name: 'Test Product',
        price: '19.99'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.code).toBeDefined();
    });

    it('should reject invalid product name', () => {
      const product = {
        code: 'ABC123',
        name: '',
        price: '19.99'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should reject invalid price', () => {
      const product = {
        code: 'ABC123',
        name: 'Test Product',
        price: '-19.99'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.price).toBeDefined();
    });

    it('should reject invalid stock quantity', () => {
      const product = {
        code: 'ABC123',
        name: 'Test Product',
        price: '19.99',
        stock: '-5'
      };

      const result = validateSchema.product(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.stock).toBeDefined();
    });
  });

  describe('cartItem', () => {
    it('should validate a complete cart item', () => {
      const cartItem = {
        code: 'ABC123',
        qty: '2',
        price: '19.99'
      };

      const result = validateSchema.cartItem(cartItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject invalid product code', () => {
      const cartItem = {
        code: '',
        qty: '2',
        price: '19.99'
      };

      const result = validateSchema.cartItem(cartItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.code).toBeDefined();
    });

    it('should reject invalid quantity', () => {
      const cartItem = {
        code: 'ABC123',
        qty: '0',
        price: '19.99'
      };

      const result = validateSchema.cartItem(cartItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.qty).toBeDefined();
    });

    it('should reject invalid price', () => {
      const cartItem = {
        code: 'ABC123',
        qty: '2',
        price: '-19.99'
      };

      const result = validateSchema.cartItem(cartItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.price).toBeDefined();
    });
  });
});

describe('sanitize', () => {
  describe('string', () => {
    it('should sanitize strings', () => {
      expect(validateInput.sanitize.string('  test  ')).toBe('test');
      expect(validateInput.sanitize.string('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(validateInput.sanitize.string(123)).toBe('');
    });
  });

  describe('number', () => {
    it('should sanitize numbers', () => {
      expect(validateInput.sanitize.number('123.45')).toBe(123.45);
      expect(validateInput.sanitize.number('abc')).toBe(0);
      expect(validateInput.sanitize.number('')).toBe(0);
    });
  });

  describe('integer', () => {
    it('should sanitize integers', () => {
      expect(validateInput.sanitize.integer('123')).toBe(123);
      expect(validateInput.sanitize.integer('123.45')).toBe(123);
      expect(validateInput.sanitize.integer('abc')).toBe(0);
    });
  });

  describe('email', () => {
    it('should sanitize emails', () => {
      expect(validateInput.sanitize.email('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(validateInput.sanitize.email('<script>test@example.com</script>')).toBe('scripttest@example.com/script');
    });
  });

  describe('barcode', () => {
    it('should sanitize barcodes', () => {
      expect(validateInput.sanitize.barcode('  abc123  ')).toBe('ABC123');
      expect(validateInput.sanitize.barcode('<script>abc123</script>')).toBe('SCRIPTABC123/SCRIPT');
    });
  });

  describe('productCode', () => {
    it('should sanitize product codes', () => {
      expect(validateInput.sanitize.productCode('  abc123  ')).toBe('ABC123');
      expect(validateInput.sanitize.productCode('<script>abc123</script>')).toBe('SCRIPTABC123/SCRIPT');
    });
  });
}); 