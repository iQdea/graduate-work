export function merge(t: { [x: string]: any }, s: { [x: string]: any }) {
  const o = Object,
    a = o.assign;
  for (const k of o.keys(s)) {
    s[k] instanceof o && a(s[k], merge(t[k], s[k]));
  }
  return a(t || {}, s), t;
}
export const removeProperty = (propKey: any, { [propKey]: propValue, ...rest }: any) => rest;
export const removeProperties: (object: any, ...keys: any[]) => any = (object: any, ...keys: any[]) =>
  keys.length > 0 ? removeProperties(removeProperty(keys.pop(), object), ...keys) : object;
