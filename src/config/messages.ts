export const errorMessages = {
  UNEXPECTED_ERROR: 'Unexpected Error',
  INCORRECT_DETAILS: 'Invalid email or password',
  INVALID_TOKEN: 'Invalid token. Please provide a valid authentication token.',
  USER_UNAUTHORIZED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED_REQUEST: 'Unauthorized request.',
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
  PASSWORD_IS_VALID:
    'Password should contain minimum 8 characters, 1 small or capital letter, 1 number, and 1 special character.',
  NOT_EMPTY: 'Should not be empty.',
  INVALID_STRING: 'Should be a string.',
} as const;

export default {
  errorMessages,
  successMessages,
  validationMessages,
};
