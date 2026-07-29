export const errorMessages = {
  UNEXPECTED_ERROR: 'Unexpected Error',
  INCORRECT_DETAILS: 'Incorrect email or password',
  EMAIL_TAKEN: 'Email already taken',
  INVALID_TOKEN: 'Invalid token. Please provide a valid authentication token.',
  USER_UNAUTHORIZED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED_REQUEST: 'Unauthorized request.',
  FORBIDDEN: 'Forbidden — you do not have permission to perform this action.',
  NOT_FOUND: 'Not found.',
} as const;

export const successMessages = {
  USER_SIGNUP: 'User registered successfully.',
  USER_LOGGED_IN: 'User logged in successfully.',
  USER_LOGGED_OUT: 'User logged out successfully.',
  SUCCESSFULLY_CREATED: 'Created successfully.',
  SUCCESSFULLY_UPDATED: 'Updated successfully.',
  SUCCESSFULLY_GET_LIST: 'List retrieved successfully.',
  SUCCESSFULLY_FETCHED: 'retrieved successfully.',
  SUCCESSFULLY_DELETED: 'deleted successfully.',
} as const;

export const validationMessages = {
  REQUIRED: 'is required',
  NOT_EMPTY: 'Should not be empty.',
  INVALID_STRING: 'Should be a string.',
  INVALID_EMAIL: 'must be a valid email',
  INVALID_UUID: 'must be a valid uuid',
  INVALID_ROLE: 'role must be either admin or customer',
  PASSWORD_MIN: 'password must be at least 8 characters',
  PASSWORD_LETTER: 'password must contain at least 1 letter',
  PASSWORD_NUMBER: 'password must contain at least 1 number',
} as const;

export default {
  errorMessages,
  successMessages,
  validationMessages,
};
