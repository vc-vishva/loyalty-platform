/**
 * Create an object composed of the picked object properties.
 */
const pick = <T extends object, K extends keyof T>(object: T | undefined, keys: K[]): Partial<Pick<T, K>> => {
  return keys.reduce<Partial<Pick<T, K>>>((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export default pick;
