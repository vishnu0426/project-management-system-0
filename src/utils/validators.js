// Email validation function
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation function
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Phone number validation function
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

// Name validation function
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};

// URL validation function
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Role validation function
export const isValidRole = (role) => {
  const validRoles = ['admin', 'manager', 'employee', 'viewer'];
  return validRoles.includes(role?.toLowerCase());
};

// Organization name validation
export const isValidOrganization = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

// Required field validation
export const isRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Email normalization function
export const normalizeEmails = (emails) => {
  if (!emails) return [];
  
  // Handle string input (comma-separated emails)
  if (typeof emails === 'string') {
    return emails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0 && isValidEmail(email));
  }
  
  // Handle array input
  if (Array.isArray(emails)) {
    return emails
      .map(email => typeof email === 'string' ? email.trim().toLowerCase() : '')
      .filter(email => email.length > 0 && isValidEmail(email));
  }
  
  return [];
};

// Domain validation function
export const isAllowedDomain = (email, allowedDomains = []) => {
  if (!email || !isValidEmail(email)) return false;
  if (!allowedDomains || allowedDomains.length === 0) return true;
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.some(domain => 
    emailDomain === domain.toLowerCase() || 
    emailDomain.endsWith(`.${domain.toLowerCase()}`)
  );
};

// Extract domain from email
export const extractDomain = (email) => {
  if (!email || !isValidEmail(email)) return null;
  return email.split('@')[1]?.toLowerCase();
};

// Batch email validation
export const validateEmailBatch = (emails, allowedDomains = []) => {
  const normalizedEmails = normalizeEmails(emails);
  const results = {
    valid: [],
    invalid: [],
    domainRestricted: []
  };
  
  normalizedEmails.forEach(email => {
    if (!isValidEmail(email)) {
      results.invalid.push(email);
    } else if (!isAllowedDomain(email, allowedDomains)) {
      results.domainRestricted.push(email);
    } else {
      results.valid.push(email);
    }
  });
  
  return results;
};

// Generic validation function
export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) {
      return result; // Return error message
    }
  }
  return true;
};

// Check if email is already in use (helper for duplicate checking)
export const isDuplicateEmail = (email, existingEmails = []) => {
  const normalizedEmail = email.toLowerCase().trim();
  return existingEmails.some(existing => existing.toLowerCase().trim() === normalizedEmail);
};

// Validate member invitation data
export const validateMemberInvitation = (data, existingMembers = [], allowedDomains = []) => {
  const errors = {};
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  } else if (!isAllowedDomain(data.email, allowedDomains) && allowedDomains.length > 0) {
    errors.email = `Email domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`;
  } else if (isDuplicateEmail(data.email, existingMembers.map(m => m.email))) {
    errors.email = 'This email is already associated with a member';
  }
  
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!isValidRole(data.role)) {
    errors.role = 'Please select a valid role';
  }
  
  if (data.name && !isValidName(data.name)) {
    errors.name = 'Please enter a valid name (at least 2 characters)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Parse and validate bulk email input
export const parseBulkEmails = (input, allowedDomains = []) => {
  if (!input) return { valid: [], invalid: [], duplicates: [], domainRestricted: [] };
  
  // Split by common delimiters: comma, semicolon, newline, space
  const emails = input
    .split(/[,;\n\s]+/)
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
  
  const results = {
    valid: [],
    invalid: [],
    duplicates: [],
    domainRestricted: []
  };
  
  const seen = new Set();
  
  emails.forEach(email => {
    if (!isValidEmail(email)) {
      results.invalid.push(email);
    } else if (seen.has(email)) {
      results.duplicates.push(email);
    } else if (!isAllowedDomain(email, allowedDomains) && allowedDomains.length > 0) {
      results.domainRestricted.push(email);
    } else {
      results.valid.push(email);
      seen.add(email);
    }
  });
  
  return results;
};

// Validation rules factory
export const createValidationRules = {
  required: (message = 'This field is required') => (value) => 
    isRequired(value) || message,
  
  email: (message = 'Please enter a valid email address') => (value) => 
    isValidEmail(value) || message,
  
  minLength: (min, message) => (value) => 
    (value && value.length >= min) || message || `Minimum ${min} characters required`,
  
  maxLength: (max, message) => (value) => 
    (!value || value.length <= max) || message || `Maximum ${max} characters allowed`,
  
  pattern: (regex, message) => (value) => 
    (!value || regex.test(value)) || message || 'Invalid format',
    
  domain: (allowedDomains, message) => (value) => 
    (!value || isAllowedDomain(value, allowedDomains)) || message || 'Email domain not allowed'
};