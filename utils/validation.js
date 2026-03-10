// utils/validation.js
// Comprehensive input validation for security and data integrity

// Validation patterns
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  BARCODE: /^.{1,100}$/,
  PRODUCT_CODE: /^.{1,50}$/,
  PRODUCT_NAME: /^.{1,200}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  CURRENCY: /^\d+(\.\d{1,2})?$/,
  INTEGER: /^\d+$/,
  POSITIVE_NUMBER: /^[1-9]\d*$/,
  URL: /^https?:\/\/.+$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}$/
};

// Validation rules
const RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PRODUCT_NAME: 1,
  MAX_PRODUCT_NAME: 100,
  MIN_PRODUCT_CODE: 1,
  MAX_PRODUCT_CODE: 20,
  MIN_PRICE: 0,
  MAX_PRICE: 999999.99,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9999,
  MIN_BARCODE_LENGTH: 1,
  MAX_BARCODE_LENGTH: 100,
  MAX_SEARCH_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500
};

// Sanitization functions
const sanitize = {
  string: (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/[<>]/g, '');
  },

  number: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  },

  integer: (value) => {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  },

  email: (value) => {
    return sanitize.string(value).toLowerCase();
  },

  barcode: (value) => {
    return sanitize.string(value).toUpperCase();
  },

  productCode: (value) => {
    return sanitize.string(value).toUpperCase();
  }
};

// Validation functions
const validate = {
  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  email: (value) => {
    return PATTERNS.EMAIL.test(sanitize.email(value));
  },

  phone: (value) => {
    return PATTERNS.PHONE.test(sanitize.string(value));
  },

  barcode: (value) => {
    const sanitized = sanitize.barcode(value);
    return PATTERNS.BARCODE.test(sanitized) &&
      sanitized.length >= RULES.MIN_BARCODE_LENGTH &&
      sanitized.length <= RULES.MAX_BARCODE_LENGTH;
  },

  productCode: (value) => {
    const sanitized = sanitize.productCode(value);
    return PATTERNS.PRODUCT_CODE.test(sanitized) &&
      sanitized.length >= RULES.MIN_PRODUCT_CODE &&
      sanitized.length <= RULES.MAX_PRODUCT_CODE;
  },

  productName: (value) => {
    const sanitized = sanitize.string(value);
    return PATTERNS.PRODUCT_NAME.test(sanitized) &&
      sanitized.length >= RULES.MIN_PRODUCT_NAME &&
      sanitized.length <= RULES.MAX_PRODUCT_NAME;
  },

  password: (value) => {
    const sanitized = sanitize.string(value);
    return PATTERNS.PASSWORD.test(sanitized) &&
      sanitized.length >= RULES.MIN_PASSWORD_LENGTH &&
      sanitized.length <= RULES.MAX_PASSWORD_LENGTH;
  },

  currency: (value) => {
    const num = sanitize.number(value);
    return PATTERNS.CURRENCY.test(value.toString()) &&
      num >= RULES.MIN_PRICE &&
      num <= RULES.MAX_PRICE;
  },

  quantity: (value) => {
    // Handle different data types more flexibly
    if (value === null || value === undefined || value === '') {
      return false; // Empty values are invalid for quantity
    }

    // Convert to string and trim
    const stringValue = String(value).trim();

    // Check if it's a valid non-negative integer
    const num = parseInt(stringValue);
    if (isNaN(num) || num < 0 || num > RULES.MAX_QUANTITY) {
      return false;
    }

    // Allow 0 and positive numbers
    return num >= 0;
  },

  integer: (value) => {
    return PATTERNS.INTEGER.test(value.toString());
  },

  positiveNumber: (value) => {
    return PATTERNS.POSITIVE_NUMBER.test(value.toString());
  },

  url: (value) => {
    return PATTERNS.URL.test(sanitize.string(value));
  },

  date: (value) => {
    return PATTERNS.DATE.test(value);
  },

  time: (value) => {
    return PATTERNS.TIME.test(value);
  },

  length: (value, min, max) => {
    const length = sanitize.string(value).length;
    return length >= min && length <= max;
  },

  range: (value, min, max) => {
    const num = sanitize.number(value);
    return num >= min && num <= max;
  }
};

// Main validation object
export const validateInput = {
  // Basic validations
  required: validate.required,
  email: validate.email,
  phone: validate.phone,
  password: validate.password,
  url: validate.url,
  date: validate.date,
  time: validate.time,

  // Product validations
  barcode: validate.barcode,
  productCode: validate.productCode,
  productName: validate.productName,

  // Numeric validations
  currency: validate.currency,
  quantity: validate.quantity,
  integer: validate.integer,
  positiveNumber: validate.positiveNumber,

  // Custom validations
  length: validate.length,
  range: validate.range,

  // Sanitization
  sanitize
};

// Validation schemas for complex objects
export const validateSchema = {
  product: (data) => {
    const errors = {};

    if (!validateInput.productCode(data.code)) {
      errors.code = 'Invalid product code format';
    }

    if (!validateInput.productName(data.name)) {
      errors.name = 'Invalid product name format';
    }

    if (!validateInput.currency(data.price)) {
      errors.price = 'Invalid price format';
    }

    if (data.category && !validateInput.length(data.category, 1, 50)) {
      errors.category = 'Category must be between 1 and 50 characters';
    }

    // Improved stock validation - handle various data types from Google Sheets
    if (data.stock !== undefined && data.stock !== null && data.stock !== '') {
      const stockValue = String(data.stock).trim();
      if (stockValue !== '' && !validateInput.quantity(stockValue)) {
        errors.stock = 'Invalid stock quantity - must be a non-negative number between 0 and 9999';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  cartItem: (data) => {
    const errors = {};

    if (!validateInput.productCode(data.code)) {
      errors.code = 'Invalid product code';
    }

    if (!validateInput.quantity(data.qty)) {
      errors.qty = 'Invalid quantity';
    }

    if (!validateInput.currency(data.price)) {
      errors.price = 'Invalid price';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_PASSWORD: 'Password must be at least 8 characters with letters and numbers',
  INVALID_BARCODE: 'Invalid barcode format',
  INVALID_PRODUCT_CODE: 'Invalid product code format',
  INVALID_PRODUCT_NAME: 'Invalid product name format',
  INVALID_PRICE: 'Please enter a valid price',
  INVALID_QUANTITY: 'Please enter a valid quantity',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date (YYYY-MM-DD)',
  INVALID_TIME: 'Please enter a valid time (HH:MM)',
  TOO_SHORT: (min) => `Must be at least ${min} characters`,
  TOO_LONG: (max) => `Must be no more than ${max} characters`,
  TOO_SMALL: (min) => `Must be at least ${min}`,
  TOO_LARGE: (max) => `Must be no more than ${max}`,
  NETWORK_ERROR: 'Network error. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Access denied. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.'
};

// Utility functions
export const getErrorMessage = (error, field = null) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && error.message) {
    return error.message;
  }

  if (field && ERROR_MESSAGES[field.toUpperCase()]) {
    return ERROR_MESSAGES[field.toUpperCase()];
  }

  return ERROR_MESSAGES.VALIDATION_ERROR;
};

export const validateAndSanitize = (data, schema) => {
  const sanitized = {};
  const errors = {};

  for (const [key, value] of Object.entries(data)) {
    if (validateInput.sanitize[key]) {
      sanitized[key] = validateInput.sanitize[key](value);
    } else {
      sanitized[key] = value;
    }
  }

  const validation = validateSchema[schema](sanitized);

  return {
    ...validation,
    data: sanitized
  };
}; 