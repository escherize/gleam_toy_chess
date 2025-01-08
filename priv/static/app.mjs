// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length2 = 0;
    for (let _ of this)
      length2++;
    return length2;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index2) {
    return this.buffer[index2];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + start3,
      end - start3
    );
    return new _BitArray(buffer);
  }
  // @internal
  sliceAfter(index2) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + index2,
      this.buffer.byteLength - index2
    );
    return new _BitArray(buffer);
  }
};
var UtfCodepoint = class {
  constructor(value) {
    this.value = value;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    let value = 0;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value = value * 256 + byteArray[i];
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value = value * 256 + byteArray[i];
      }
    }
    if (isSigned) {
      const highBit = 2 ** (byteSize * 8 - 1);
      if (value >= highBit) {
        value -= highBit * 2;
      }
    }
    return value;
  } else {
    let value = 0n;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value = (value << 8n) + BigInt(byteArray[i]);
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value = (value << 8n) + BigInt(byteArray[i]);
      }
    }
    if (isSigned) {
      const highBit = 1n << BigInt(byteSize * 8 - 1);
      if (value >= highBit) {
        value -= highBit * 2n;
      }
    }
    return Number(value);
  }
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view2 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view2.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view2.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a = values2.pop();
    let b = values2.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values2.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function remainderInt(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a % b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function unwrap(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function lazy_or(first2, second) {
  if (first2.isOk()) {
    return first2;
  } else {
    return second();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function bit_array(data) {
  return decode_bit_array(data);
}
function int(data) {
  return decode_int(data);
}
function float(data) {
  return decode_float(data);
}
function bool(data) {
  return decode_bool(data);
}
function shallow_list(value) {
  return decode_list(value);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name) {
  let name$1 = identity(name);
  let decoder = any(
    toList([decode_string, (x) => {
      return map(int(x), to_string);
    }])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify_dynamic(name$1), ">"]);
      let _pipe$1 = concat(_pipe);
      return identity(_pipe$1);
    }
  })();
  let _record = error;
  return new DecodeError(
    _record.expected,
    _record.found,
    prepend(name$2, error.path)
  );
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function dict(key_type, value_type) {
  return (value) => {
    return try$(
      decode_map(value),
      (dict3) => {
        return try$(
          (() => {
            let _pipe = dict3;
            let _pipe$1 = map_to_list(_pipe);
            return try_map(
              _pipe$1,
              (pair) => {
                let k = pair[0];
                let v = pair[1];
                return try$(
                  (() => {
                    let _pipe$2 = key_type(k);
                    return map_errors(
                      _pipe$2,
                      (_capture) => {
                        return push_path(_capture, "keys");
                      }
                    );
                  })(),
                  (k2) => {
                    return try$(
                      (() => {
                        let _pipe$2 = value_type(v);
                        return map_errors(
                          _pipe$2,
                          (_capture) => {
                            return push_path(_capture, "values");
                          }
                        );
                      })(),
                      (v2) => {
                        return new Ok([k2, v2]);
                      }
                    );
                  }
                );
              }
            );
          })(),
          (pairs) => {
            return new Ok(from_list(pairs));
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float3) {
  const string2 = float3.toString().replace("+", "");
  if (string2.indexOf(".") >= 0) {
    return string2;
  } else {
    const index2 = string2.indexOf("e");
    if (index2 >= 0) {
      return string2.slice(0, index2) + ".0" + string2.slice(index2);
    } else {
      return string2 + ".0";
    }
  }
}
function string_length(string2) {
  if (string2 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string2);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string2.match(/./gsu).length;
  }
}
var segmenter = void 0;
function graphemes_iterator(string2) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string2)[Symbol.iterator]();
  }
}
function pop_grapheme(string2) {
  let first2;
  const iterator = graphemes_iterator(string2);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string2.match(/./su)?.[0];
  }
  if (first2) {
    return new Ok([first2, string2.slice(first2.length)]);
  } else {
    return new Error(Nil);
  }
}
function less_than(a, b) {
  return a < b;
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function bit_array_to_string(bit_array2) {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return new Ok(decoder.decode(bit_array2.buffer));
  } catch {
    return new Error(Nil);
  }
}
function print_debug(string2) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string2 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string2 + "\n"));
  } else {
    console.log(string2);
  }
}
function new_map() {
  return Dict.new();
}
function map_to_list(map4) {
  return List.fromArray(map4.entries());
}
function map_remove(key, map4) {
  return map4.delete(key);
}
function map_get(map4, key) {
  const value = map4.get(key, NOT_FOUND);
  if (value === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value);
}
function map_insert(key, value, map4) {
  return map4.set(key, value);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_float(data) {
  return typeof data === "number" ? new Ok(data) : decoder_error("Float", data);
}
function decode_bool(data) {
  return typeof data === "boolean" ? new Ok(data) : decoder_error("Bool", data);
}
function decode_bit_array(data) {
  if (data instanceof BitArray) {
    return new Ok(data);
  }
  if (data instanceof Uint8Array) {
    return new Ok(new BitArray(data));
  }
  return decoder_error("BitArray", data);
}
function decode_list(data) {
  if (Array.isArray(data)) {
    return new Ok(List.fromArray(data));
  }
  return data instanceof List ? new Ok(data) : decoder_error("List", data);
}
function decode_map(data) {
  if (data instanceof Dict) {
    return new Ok(data);
  }
  if (data instanceof Map || data instanceof WeakMap) {
    return new Ok(Dict.fromMap(data));
  }
  if (data == null) {
    return decoder_error("Dict", data);
  }
  if (typeof data !== "object") {
    return decoder_error("Dict", data);
  }
  const proto = Object.getPrototypeOf(data);
  if (proto === Object.prototype || proto === null) {
    return new Ok(Dict.fromObject(data));
  }
  return decoder_error("Dict", data);
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || Number.isInteger(v))
    return v.toString();
  if (t === "number")
    return float_to_string(v);
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map4) {
  let body = "dict.from_list([";
  let first2 = true;
  map4.forEach((value, key) => {
    if (!first2)
      body = body + ", ";
    body = body + "#(" + inspect(key) + ", " + inspect(value) + ")";
    first2 = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list2) {
  return `[${list2.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict3, key, value) {
  return map_insert(key, value, dict3);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let x = list2.head;
      let rest = list2.tail;
      loop$list = rest;
      loop$initial = insert(initial, x[0], x[1]);
    }
  }
}
function from_list(list2) {
  return from_list_loop(list2, new_map());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let first2 = list2.head;
      let rest = list2.tail;
      loop$list = rest;
      loop$acc = prepend(first2[0], acc);
    }
  }
}
function keys(dict3) {
  let list_of_pairs = map_to_list(dict3);
  return do_keys_loop(list_of_pairs, toList([]));
}
function delete$(dict3, key) {
  return map_remove(key, dict3);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function reverse_loop(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(list2) {
  return reverse_loop(list2, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list2 = loop$list;
    let elem = loop$elem;
    if (list2.hasLength(0)) {
      return false;
    } else if (list2.atLeastLength(1) && isEqual(list2.head, elem)) {
      let first$1 = list2.head;
      return true;
    } else {
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$elem = elem;
    }
  }
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let new_acc = (() => {
        let $ = fun(first$1);
        if ($.isOk()) {
          let first$2 = $[0];
          return prepend(first$2, acc);
        } else {
          return acc;
        }
      })();
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list2, fun) {
  return filter_map_loop(list2, fun, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list2, fun) {
  return map_loop(list2, fun, toList([]));
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list2, fun) {
  return try_map_loop(list2, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2.hasLength(0)) {
      return second;
    } else {
      let item = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second);
    }
  }
}
function append2(first2, second) {
  return append_loop(reverse(first2), second);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list2 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list2, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let x = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index2 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index2);
      loop$with = with$;
      loop$index = index2 + 1;
    }
  }
}
function index_fold(list2, initial, fun) {
  return index_fold_loop(list2, initial, fun, 0);
}
function intersperse_loop(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(x, prepend(separator, acc));
    }
  }
}
function intersperse(list2, elem) {
  if (list2.hasLength(0)) {
    return list2;
  } else if (list2.hasLength(1)) {
    return list2;
  } else {
    let x = list2.head;
    let rest$1 = list2.tail;
    return intersperse_loop(rest$1, elem, toList([x]));
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list2.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(reverse_loop(growing$1, toList([])), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list2.head;
      let rest$1 = list2.tail;
      let $ = compare4(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse_loop(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse_loop(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(reverse_loop(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list3 = list2;
      return reverse_loop(list3, acc);
    } else if (list2.hasLength(0)) {
      let list3 = list1;
      return reverse_loop(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse_loop(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse_loop(
        prepend(reverse_loop(sequence, toList([])), acc),
        toList([])
      );
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list3 = list2;
      return reverse_loop(list3, acc);
    } else if (list2.hasLength(0)) {
      let list3 = list1;
      return reverse_loop(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse_loop(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse_loop(
        prepend(reverse_loop(sequence, toList([])), acc),
        toList([])
      );
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return reverse_loop(sequence, toList([]));
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare4;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare4;
    }
  }
}
function sort(list2, compare4) {
  if (list2.hasLength(0)) {
    return toList([]);
  } else if (list2.hasLength(1)) {
    let x = list2.head;
    return toList([x]);
  } else {
    let x = list2.head;
    let y = list2.tail.head;
    let rest$1 = list2.tail.tail;
    let direction = (() => {
      let $ = compare4(x, y);
      if ($ instanceof Lt) {
        return new Ascending();
      } else if ($ instanceof Eq) {
        return new Ascending();
      } else {
        return new Descending();
      }
    })();
    let sequences$1 = sequences(
      rest$1,
      compare4,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare4);
  }
}
function range_loop(loop$start, loop$stop, loop$acc) {
  while (true) {
    let start3 = loop$start;
    let stop = loop$stop;
    let acc = loop$acc;
    let $ = compare(start3, stop);
    if ($ instanceof Eq) {
      return prepend(stop, acc);
    } else if ($ instanceof Gt) {
      loop$start = start3;
      loop$stop = stop + 1;
      loop$acc = prepend(stop, acc);
    } else {
      loop$start = start3;
      loop$stop = stop - 1;
      loop$acc = prepend(stop, acc);
    }
  }
}
function range(start3, stop) {
  return range_loop(start3, stop, toList([]));
}
function sized_chunk_loop(loop$list, loop$count, loop$left, loop$current_chunk, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let count = loop$count;
    let left = loop$left;
    let current_chunk = loop$current_chunk;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      if (current_chunk.hasLength(0)) {
        return reverse(acc);
      } else {
        let remaining = current_chunk;
        return reverse(prepend(reverse(remaining), acc));
      }
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let chunk$1 = prepend(first$1, current_chunk);
      let $ = left > 1;
      if ($) {
        loop$list = rest$1;
        loop$count = count;
        loop$left = left - 1;
        loop$current_chunk = chunk$1;
        loop$acc = acc;
      } else {
        loop$list = rest$1;
        loop$count = count;
        loop$left = count;
        loop$current_chunk = toList([]);
        loop$acc = prepend(reverse(chunk$1), acc);
      }
    }
  }
}
function sized_chunk(list2, count) {
  return sized_chunk_loop(list2, count, count, toList([]), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function compare3(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = less_than(a, b);
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string2 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string2;
      loop$times = times - 1;
      loop$acc = acc + string2;
    }
  }
}
function repeat(string2, times) {
  return repeat_loop(string2, times, "");
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string2 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string2;
    } else {
      let $1 = pop_grapheme(string2);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string2;
      }
    }
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function to_string2(bool3) {
  if (!bool3) {
    return "False";
  } else {
    return "True";
  }
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all2) {
    super();
    this.all = all2;
  }
};
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index2) => {
      let key$1 = key + "-" + to_string(index2);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value) {
  return new Attribute(name, identity(value), false);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function classes(names) {
  return attribute(
    "class",
    (() => {
      let _pipe = names;
      let _pipe$1 = filter_map(
        _pipe,
        (class$2) => {
          let $ = class$2[1];
          if ($) {
            return new Ok(class$2[0]);
          } else {
            return new Error(void 0);
          }
        }
      );
      return join(_pipe$1, " ");
    })()
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict3) {
    super();
    this.dict = dict3;
  }
};
function new$2() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value = attr[1];
    if (attr.as_property) {
      if (el[name] !== value)
        el[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value);
      delegated.push([name.slice(10), value]);
    } else if (name === "class") {
      className = className === null ? value : className + " " + value;
    } else if (name === "style") {
      style2 = style2 === null ? value : style2 + value;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value;
    } else {
      if (el.getAttribute(name) !== value)
        el.setAttribute(name, value);
      if (name === "value" || name === "selected")
        el[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el.setAttribute("style", style2);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property) => {
        const path = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key)
        keyedChildren.set(key, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update2, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update2, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update2, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update2, view2) {
  return new App(init3, update2, view2, new None());
}
function simple(init3, update2, view2) {
  let init$1 = (flags) => {
    return [init3(flags), none()];
  };
  let update$1 = (model, msg) => {
    return [update2(model, msg), none()];
  };
  return application(init$1, update$1, view2);
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function pre(attrs, children2) {
  return element("pre", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}

// build/dev/javascript/glam/glam/doc.mjs
var Line = class extends CustomType {
  constructor(size) {
    super();
    this.size = size;
  }
};
var Concat = class extends CustomType {
  constructor(docs) {
    super();
    this.docs = docs;
  }
};
var Text2 = class extends CustomType {
  constructor(text2, length2) {
    super();
    this.text = text2;
    this.length = length2;
  }
};
var Nest = class extends CustomType {
  constructor(doc, indentation2) {
    super();
    this.doc = doc;
    this.indentation = indentation2;
  }
};
var ForceBreak = class extends CustomType {
  constructor(doc) {
    super();
    this.doc = doc;
  }
};
var Break = class extends CustomType {
  constructor(unbroken, broken) {
    super();
    this.unbroken = unbroken;
    this.broken = broken;
  }
};
var FlexBreak = class extends CustomType {
  constructor(unbroken, broken) {
    super();
    this.unbroken = unbroken;
    this.broken = broken;
  }
};
var Group = class extends CustomType {
  constructor(doc) {
    super();
    this.doc = doc;
  }
};
var Broken = class extends CustomType {
};
var ForceBroken = class extends CustomType {
};
var Unbroken = class extends CustomType {
};
function break$(unbroken, broken) {
  return new Break(unbroken, broken);
}
function concat2(docs) {
  return new Concat(docs);
}
function from_string(string2) {
  return new Text2(string2, string_length(string2));
}
function zero_width_string(string2) {
  return new Text2(string2, 0);
}
function group(doc) {
  return new Group(doc);
}
function join2(docs, separator) {
  return concat2(intersperse(docs, separator));
}
function concat_join(docs, separators) {
  return join2(docs, concat2(separators));
}
function nest(doc, indentation2) {
  return new Nest(doc, indentation2);
}
function fits(loop$docs, loop$max_width, loop$current_width) {
  while (true) {
    let docs = loop$docs;
    let max_width2 = loop$max_width;
    let current_width = loop$current_width;
    if (current_width > max_width2) {
      return false;
    } else if (docs.hasLength(0)) {
      return true;
    } else {
      let indent = docs.head[0];
      let mode = docs.head[1];
      let doc = docs.head[2];
      let rest = docs.tail;
      if (doc instanceof Line) {
        return true;
      } else if (doc instanceof ForceBreak) {
        return false;
      } else if (doc instanceof Text2) {
        let length2 = doc.length;
        loop$docs = rest;
        loop$max_width = max_width2;
        loop$current_width = current_width + length2;
      } else if (doc instanceof Nest) {
        let doc$1 = doc.doc;
        let i = doc.indentation;
        let _pipe = prepend([indent + i, mode, doc$1], rest);
        loop$docs = _pipe;
        loop$max_width = max_width2;
        loop$current_width = current_width;
      } else if (doc instanceof Break) {
        let unbroken = doc.unbroken;
        if (mode instanceof Broken) {
          return true;
        } else if (mode instanceof ForceBroken) {
          return true;
        } else {
          loop$docs = rest;
          loop$max_width = max_width2;
          loop$current_width = current_width + string_length(unbroken);
        }
      } else if (doc instanceof FlexBreak) {
        let unbroken = doc.unbroken;
        if (mode instanceof Broken) {
          return true;
        } else if (mode instanceof ForceBroken) {
          return true;
        } else {
          loop$docs = rest;
          loop$max_width = max_width2;
          loop$current_width = current_width + string_length(unbroken);
        }
      } else if (doc instanceof Group) {
        let doc$1 = doc.doc;
        loop$docs = prepend([indent, mode, doc$1], rest);
        loop$max_width = max_width2;
        loop$current_width = current_width;
      } else {
        let docs$1 = doc.docs;
        let _pipe = map2(docs$1, (doc2) => {
          return [indent, mode, doc2];
        });
        let _pipe$1 = append2(_pipe, rest);
        loop$docs = _pipe$1;
        loop$max_width = max_width2;
        loop$current_width = current_width;
      }
    }
  }
}
function indentation(size) {
  return repeat(" ", size);
}
function do_to_string(loop$acc, loop$max_width, loop$current_width, loop$docs) {
  while (true) {
    let acc = loop$acc;
    let max_width2 = loop$max_width;
    let current_width = loop$current_width;
    let docs = loop$docs;
    if (docs.hasLength(0)) {
      return acc;
    } else {
      let indent = docs.head[0];
      let mode = docs.head[1];
      let doc = docs.head[2];
      let rest = docs.tail;
      if (doc instanceof Line) {
        let size = doc.size;
        let _pipe = acc + repeat("\n", size) + indentation(indent);
        loop$acc = _pipe;
        loop$max_width = max_width2;
        loop$current_width = indent;
        loop$docs = rest;
      } else if (doc instanceof FlexBreak) {
        let unbroken = doc.unbroken;
        let broken = doc.broken;
        let new_unbroken_width = current_width + string_length(unbroken);
        let $ = fits(rest, max_width2, new_unbroken_width);
        if ($) {
          let _pipe = acc + unbroken;
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = new_unbroken_width;
          loop$docs = rest;
        } else {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        }
      } else if (doc instanceof Break) {
        let unbroken = doc.unbroken;
        let broken = doc.broken;
        if (mode instanceof Unbroken) {
          let new_width = current_width + string_length(unbroken);
          loop$acc = acc + unbroken;
          loop$max_width = max_width2;
          loop$current_width = new_width;
          loop$docs = rest;
        } else if (mode instanceof Broken) {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        } else {
          let _pipe = acc + broken + "\n" + indentation(indent);
          loop$acc = _pipe;
          loop$max_width = max_width2;
          loop$current_width = indent;
          loop$docs = rest;
        }
      } else if (doc instanceof ForceBreak) {
        let doc$1 = doc.doc;
        let docs$1 = prepend([indent, new ForceBroken(), doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else if (doc instanceof Concat) {
        let docs$1 = doc.docs;
        let docs$2 = (() => {
          let _pipe = map2(
            docs$1,
            (doc2) => {
              return [indent, mode, doc2];
            }
          );
          return append2(_pipe, rest);
        })();
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$2;
      } else if (doc instanceof Group) {
        let doc$1 = doc.doc;
        let fits$1 = fits(
          toList([[indent, new Unbroken(), doc$1]]),
          max_width2,
          current_width
        );
        let new_mode = (() => {
          if (fits$1) {
            return new Unbroken();
          } else {
            return new Broken();
          }
        })();
        let docs$1 = prepend([indent, new_mode, doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else if (doc instanceof Nest) {
        let doc$1 = doc.doc;
        let i = doc.indentation;
        let docs$1 = prepend([indent + i, mode, doc$1], rest);
        loop$acc = acc;
        loop$max_width = max_width2;
        loop$current_width = current_width;
        loop$docs = docs$1;
      } else {
        let text2 = doc.text;
        let length2 = doc.length;
        loop$acc = acc + text2;
        loop$max_width = max_width2;
        loop$current_width = current_width + length2;
        loop$docs = rest;
      }
    }
  }
}
function to_string3(doc, limit) {
  return do_to_string("", limit, 0, toList([[0, new Unbroken(), doc]]));
}
var empty = /* @__PURE__ */ new Concat(/* @__PURE__ */ toList([]));
var flex_space = /* @__PURE__ */ new FlexBreak(" ", "");
var soft_break = /* @__PURE__ */ new Break("", "");
var space = /* @__PURE__ */ new Break(" ", "");

// build/dev/javascript/pprint/pprint_ffi.mjs
function decoder_error2(expected, got) {
  return decoder_error_no_classify2(expected, classify_dynamic(got));
}
function decoder_error_no_classify2(expected, got) {
  return new Error(
    List.fromArray([
      new DecodeError(expected, got, toList([]))
    ])
  );
}
function decode_custom_type(value) {
  if (value instanceof CustomType) {
    const name = value.constructor.name;
    const fields = Object.keys(value).map((label) => {
      return isNaN(parseInt(label)) ? new Labelled(label, value[label]) : new Positional(value[label]);
    });
    return new Ok(new TCustom(name, toList(fields)));
  }
  return decoder_error2("CustomType", value);
}
function decode_tuple7(value) {
  if (Array.isArray(value))
    return new Ok(toList(value));
  return decoder_error2("Tuple", value);
}
function decode_nil(value) {
  if (value === void 0)
    return new Ok();
  return decoder_error2("Nil", value);
}

// build/dev/javascript/pprint/pprint/decoder.mjs
var TString = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TInt = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TFloat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TBool = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TNil = class extends CustomType {
};
var TBitArray = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TDict = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TTuple = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TCustom = class extends CustomType {
  constructor(name, fields) {
    super();
    this.name = name;
    this.fields = fields;
  }
};
var TForeign = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Labelled = class extends CustomType {
  constructor(label, value) {
    super();
    this.label = label;
    this.value = value;
  }
};
var Positional = class extends CustomType {
  constructor(value) {
    super();
    this.value = value;
  }
};
function decode_type(value) {
  return lazy_or(
    map(int(value), (var0) => {
      return new TInt(var0);
    }),
    () => {
      return lazy_or(
        map(
          float(value),
          (var0) => {
            return new TFloat(var0);
          }
        ),
        () => {
          return lazy_or(
            map(
              decode_string(value),
              (var0) => {
                return new TString(var0);
              }
            ),
            () => {
              return lazy_or(
                map(
                  bool(value),
                  (var0) => {
                    return new TBool(var0);
                  }
                ),
                () => {
                  return lazy_or(
                    map(
                      decode_nil(value),
                      (_) => {
                        return new TNil();
                      }
                    ),
                    () => {
                      return lazy_or(
                        map(
                          bit_array(value),
                          (var0) => {
                            return new TBitArray(var0);
                          }
                        ),
                        () => {
                          return lazy_or(
                            decode_custom_type(value),
                            () => {
                              return lazy_or(
                                map(
                                  decode_tuple7(value),
                                  (var0) => {
                                    return new TTuple(var0);
                                  }
                                ),
                                () => {
                                  return lazy_or(
                                    map(
                                      shallow_list(value),
                                      (var0) => {
                                        return new TList(var0);
                                      }
                                    ),
                                    () => {
                                      return lazy_or(
                                        map(
                                          dict(
                                            decode_type,
                                            decode_type
                                          )(value),
                                          (var0) => {
                                            return new TDict(var0);
                                          }
                                        ),
                                        () => {
                                          return new Ok(
                                            new TForeign(inspect2(value))
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function classify(value) {
  let $ = decode_type(value);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "pprint/decoder",
      30,
      "classify",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let t = $[0];
  return t;
}

// build/dev/javascript/pprint/pprint.mjs
var Config = class extends CustomType {
  constructor(style_mode, bit_array_mode, label_mode) {
    super();
    this.style_mode = style_mode;
    this.bit_array_mode = bit_array_mode;
    this.label_mode = label_mode;
  }
};
var Unstyled = class extends CustomType {
};
var BitArraysAsString = class extends CustomType {
};
var KeepBitArrays = class extends CustomType {
};
var Labels = class extends CustomType {
};
var NoLabels = class extends CustomType {
};
function comma_list_space(docs, open, close, space2) {
  let trailing = (() => {
    if (docs.hasLength(0)) {
      return empty;
    } else {
      return break$("", ",");
    }
  })();
  let _pipe = toList([
    open,
    (() => {
      let _pipe2 = toList([
        soft_break,
        concat_join(docs, toList([from_string(","), space2]))
      ]);
      let _pipe$12 = concat2(_pipe2);
      return nest(_pipe$12, 2);
    })(),
    trailing,
    close
  ]);
  let _pipe$1 = concat2(_pipe);
  return group(_pipe$1);
}
function comma_list(docs, open, close) {
  return comma_list_space(docs, open, close, space);
}
var max_width = 40;
var reset = "\x1B[0m";
function ansi(text2, code, config) {
  let text_doc = from_string(text2);
  let $ = config.style_mode;
  if ($ instanceof Unstyled) {
    return text_doc;
  } else {
    return concat2(
      toList([
        zero_width_string(code),
        text_doc,
        zero_width_string(reset)
      ])
    );
  }
}
var green = "\x1B[38;5;2m";
function pretty_string(string2, config) {
  let _pipe = '"' + string2 + '"';
  return ansi(_pipe, green, config);
}
var yellow = "\x1B[38;5;3m";
var blue = "\x1B[38;5;4m";
var magenta = "\x1B[38;5;5m";
function pretty_bit_array(bits, config) {
  let _pipe = inspect2(bits);
  return ansi(_pipe, magenta, config);
}
var bold = "\x1B[1m";
var dim = "\x1B[2m";
function pretty_tuple(items, config) {
  let _pipe = map2(
    items,
    (_capture) => {
      return pretty_dynamic(_capture, config);
    }
  );
  return comma_list(_pipe, from_string("#("), from_string(")"));
}
function pretty_dynamic(value, config) {
  let _pipe = value;
  let _pipe$1 = classify(_pipe);
  return pretty_type(_pipe$1, config);
}
function pretty_type(value, config) {
  if (value instanceof TString) {
    let s = value[0];
    return pretty_string(s, config);
  } else if (value instanceof TInt) {
    let i = value[0];
    let _pipe = to_string(i);
    return ansi(_pipe, yellow, config);
  } else if (value instanceof TFloat) {
    let f = value[0];
    let _pipe = float_to_string(f);
    return ansi(_pipe, yellow, config);
  } else if (value instanceof TBool) {
    let b = value[0];
    let _pipe = to_string2(b);
    return ansi(_pipe, blue, config);
  } else if (value instanceof TBitArray) {
    let b = value[0];
    let $ = config.bit_array_mode;
    if ($ instanceof KeepBitArrays) {
      return pretty_bit_array(b, config);
    } else {
      let $1 = bit_array_to_string(b);
      if ($1.isOk()) {
        let s = $1[0];
        return pretty_string(s, config);
      } else {
        return pretty_bit_array(b, config);
      }
    }
  } else if (value instanceof TNil) {
    return ansi("Nil", blue, config);
  } else if (value instanceof TList) {
    let items = value[0];
    return pretty_list(items, config);
  } else if (value instanceof TDict) {
    let d = value[0];
    return pretty_dict(d, config);
  } else if (value instanceof TTuple) {
    let items = value[0];
    return pretty_tuple(items, config);
  } else if (value instanceof TCustom) {
    let name = value.name;
    let fields = value.fields;
    return pretty_custom_type(name, fields, config);
  } else {
    let f = value[0];
    return ansi(f, dim, config);
  }
}
function with_config(value, config) {
  let _pipe = value;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = pretty_dynamic(_pipe$1, config);
  return to_string3(_pipe$2, max_width);
}
function format(value) {
  return with_config(
    value,
    new Config(new Unstyled(), new BitArraysAsString(), new NoLabels())
  );
}
function pretty_list(items, config) {
  let items$1 = map2(items, classify);
  let space2 = (() => {
    if (items$1.atLeastLength(1) && items$1.head instanceof TInt) {
      return flex_space;
    } else if (items$1.atLeastLength(1) && items$1.head instanceof TFloat) {
      return flex_space;
    } else {
      return space;
    }
  })();
  let _pipe = map2(
    items$1,
    (_capture) => {
      return pretty_type(_capture, config);
    }
  );
  return comma_list_space(
    _pipe,
    from_string("["),
    from_string("]"),
    space2
  );
}
function pretty_dict(d, config) {
  let _pipe = map_to_list(d);
  let _pipe$1 = sort(
    _pipe,
    (one_field, other_field) => {
      let one_key = one_field[0];
      let other_key = other_field[0];
      return compare3(
        inspect2(one_key),
        inspect2(other_key)
      );
    }
  );
  let _pipe$2 = map2(
    _pipe$1,
    (field2) => {
      let _pipe$22 = toList([
        pretty_type(field2[0], config),
        pretty_type(field2[1], config)
      ]);
      return comma_list(_pipe$22, from_string("#("), from_string(")"));
    }
  );
  return comma_list(
    _pipe$2,
    from_string("dict.from_list(["),
    from_string("])")
  );
}
function pretty_custom_type(name, fields, config) {
  let style2 = (() => {
    if (name === "Ok") {
      return bold;
    } else if (name === "Error") {
      return bold;
    } else if (name === "Some") {
      return bold;
    } else if (name === "None") {
      return bold;
    } else {
      return "";
    }
  })();
  let fields$1 = map2(
    fields,
    (field2) => {
      let $ = config.label_mode;
      if (field2 instanceof Positional && $ instanceof Labels) {
        let value = field2.value;
        return pretty_dynamic(value, config);
      } else if (field2 instanceof Positional && $ instanceof NoLabels) {
        let value = field2.value;
        return pretty_dynamic(value, config);
      } else if (field2 instanceof Labelled && $ instanceof NoLabels) {
        let value = field2.value;
        return pretty_dynamic(value, config);
      } else {
        let label = field2.label;
        let value = field2.value;
        return concat2(
          toList([
            ansi(label + ": ", dim, config),
            pretty_dynamic(value, config)
          ])
        );
      }
    }
  );
  let name$1 = ansi(name, style2, config);
  let open = concat2(toList([name$1, from_string("(")]));
  let close = from_string(")");
  if (fields$1.hasLength(0)) {
    return name$1;
  } else if (fields$1.hasLength(1)) {
    let single = fields$1.head;
    return concat2(toList([open, single, close]));
  } else {
    let _pipe = fields$1;
    return comma_list(_pipe, open, close);
  }
}

// build/dev/javascript/app/team.mjs
var White = class extends CustomType {
};
var Black = class extends CustomType {
};

// build/dev/javascript/app/piece.mjs
var Pawn = class extends CustomType {
};
var Rook = class extends CustomType {
};
var Knight = class extends CustomType {
};
var Bishop = class extends CustomType {
};
var Queen = class extends CustomType {
};
var King = class extends CustomType {
};
var Piece = class extends CustomType {
  constructor(team, kind) {
    super();
    this.team = team;
    this.kind = kind;
  }
};
function new$3(team, kind) {
  return new Piece(team, kind);
}
function to_string4(piece) {
  let $ = piece.kind;
  if ($ instanceof Pawn) {
    return "\u265F";
  } else if ($ instanceof Rook) {
    return "\u265C";
  } else if ($ instanceof Knight) {
    return "\u265E";
  } else if ($ instanceof Bishop) {
    return "\u265D";
  } else if ($ instanceof Queen) {
    return "\u265B";
  } else {
    return "\u265A";
  }
}

// build/dev/javascript/app/util.mjs
function cartesian_product(list1, list2) {
  let _pipe = list1;
  let _pipe$1 = map2(
    _pipe,
    (x) => {
      return map2(list2, (y) => {
        return [x, y];
      });
    }
  );
  return flatten(_pipe$1);
}

// build/dev/javascript/app/point.mjs
var Point = class extends CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
};
function indexes() {
  return range(1, 8);
}
function new$4(rank, file) {
  let $ = rank >= 1;
  let $1 = rank <= 8;
  let $2 = file >= 1;
  let $3 = file <= 8;
  if ($ && $1 && $2 && $3) {
    return new Ok(new Point(rank, file));
  } else {
    return new Error(
      "invalid coordinate:" + to_string(rank) + ", " + to_string(
        file
      )
    );
  }
}
function all() {
  let ranks = indexes();
  let files = indexes();
  let _pipe = cartesian_product(files, ranks);
  return map2(
    _pipe,
    (rf) => {
      let r = rf[0];
      let f = rf[1];
      let $ = new$4(f, r);
      if (!$.isOk()) {
        throw makeError(
          "let_assert",
          "point",
          24,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let p = $[0];
      return p;
    }
  );
}
function new_ok(y, x) {
  let $ = new$4(y, x);
  if ($.isOk()) {
    let p = $[0];
    return p;
  } else {
    throw makeError(
      "panic",
      "point",
      45,
      "new_ok",
      "uh oh, new_ok failed. ",
      {}
    );
  }
}
function file_str(p) {
  let $ = p.y;
  if ($ === 1) {
    return "A";
  } else if ($ === 2) {
    return "B";
  } else if ($ === 3) {
    return "C";
  } else if ($ === 4) {
    return "D";
  } else if ($ === 5) {
    return "E";
  } else if ($ === 6) {
    return "F";
  } else if ($ === 7) {
    return "G";
  } else if ($ === 8) {
    return "H";
  } else {
    throw makeError("panic", "point", 65, "file_str", "impossible", {});
  }
}
function rank_str(p) {
  return to_string(p.x);
}
function to_string5(p) {
  return file_str(p) + rank_str(p);
}

// build/dev/javascript/app/board.mjs
function starting_row(b, y, t) {
  let _pipe = b;
  let _pipe$1 = insert(
    _pipe,
    new_ok(1, y),
    new$3(t, new Rook())
  );
  let _pipe$2 = insert(
    _pipe$1,
    new_ok(2, y),
    new$3(t, new Knight())
  );
  let _pipe$3 = insert(
    _pipe$2,
    new_ok(3, y),
    new$3(t, new Bishop())
  );
  let _pipe$4 = insert(
    _pipe$3,
    new_ok(4, y),
    new$3(t, new Queen())
  );
  let _pipe$5 = insert(
    _pipe$4,
    new_ok(5, y),
    new$3(t, new King())
  );
  let _pipe$6 = insert(
    _pipe$5,
    new_ok(6, y),
    new$3(t, new Bishop())
  );
  let _pipe$7 = insert(
    _pipe$6,
    new_ok(7, y),
    new$3(t, new Knight())
  );
  return insert(
    _pipe$7,
    new_ok(8, y),
    new$3(t, new Rook())
  );
}
function starting_pawns(board, y, t) {
  return fold(
    indexes(),
    board,
    (b, f) => {
      let $ = new$4(f, y);
      if (!$.isOk()) {
        throw makeError(
          "let_assert",
          "board",
          26,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let point = $[0];
      return insert(b, point, new$3(t, new Pawn()));
    }
  );
}
function new_board() {
  let _pipe = new_map();
  let _pipe$1 = starting_row(_pipe, 1, new White());
  let _pipe$2 = starting_pawns(_pipe$1, 2, new White());
  let _pipe$3 = starting_row(_pipe$2, 8, new Black());
  return starting_pawns(_pipe$3, 7, new Black());
}
function get(board, position) {
  let _pipe = map_get(board, position);
  return map_error(_pipe, (_) => {
    return "No piece at position";
  });
}
function set(board, position, piece) {
  return insert(board, position, piece);
}
function delete$2(board, position) {
  return delete$(board, position);
}

// build/dev/javascript/app/game.mjs
var Selected = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Idle = class extends CustomType {
};
var Game = class extends CustomType {
  constructor(board, team_turn, check, winner, mode) {
    super();
    this.board = board;
    this.team_turn = team_turn;
    this.check = check;
    this.winner = winner;
    this.mode = mode;
  }
};
function new$5() {
  return new Game(
    new_board(),
    new White(),
    new None(),
    new None(),
    new Idle()
  );
}
function pawn_starting_position(team, pos) {
  let $ = pos.y;
  if ($ === 2 && team instanceof White) {
    return true;
  } else if ($ === 7 && team instanceof Black) {
    return true;
  } else {
    return false;
  }
}
function legal_moves(game, pos) {
  let $ = get(game.board, pos);
  if ($.isOk()) {
    let piece = $[0];
    let $1 = piece.kind;
    if ($1 instanceof King) {
      return toList([]);
    } else if ($1 instanceof Bishop) {
      return toList([]);
    } else if ($1 instanceof Knight) {
      return toList([]);
    } else if ($1 instanceof Pawn) {
      let $2 = pawn_starting_position(game.team_turn, pos);
      if ($2) {
        return toList([new Point(pos.x, pos.y + 1), new Point(pos.x, pos.y + 2)]);
      } else {
        return toList([new Point(pos.x, pos.y + 1)]);
      }
    } else if ($1 instanceof Queen) {
      return toList([]);
    } else {
      return toList([]);
    }
  } else {
    return toList([]);
  }
}

// build/dev/javascript/app/render.mjs
function bg_color(p) {
  let $ = remainderInt(p.x + p.y, 2) === 0;
  if ($) {
    return "dark";
  } else {
    return "light";
  }
}
function piece_color(piece) {
  let $ = piece.team;
  if ($ instanceof White) {
    return "#bbb";
  } else {
    return "#444";
  }
}

// build/dev/javascript/app/app.mjs
var UserClickedPiece = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserClickedSquare = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserMovedPieceTo = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function init2(_) {
  return new$5();
}
function handle_clicked_piece(model, pt) {
  let board = model.board;
  let $ = get(board, pt);
  let $1 = model.mode;
  if ($.isOk()) {
    let _record = model;
    return new Game(
      _record.board,
      _record.team_turn,
      _record.check,
      _record.winner,
      new Selected(pt)
    );
  } else if (!$.isOk() && $1 instanceof Idle) {
    return model;
  } else {
    let _record = model;
    return new Game(
      _record.board,
      _record.team_turn,
      _record.check,
      _record.winner,
      new Idle()
    );
  }
}
function update(model, msg) {
  debug(["update got msg: ", msg]);
  if (msg instanceof UserClickedPiece) {
    let pos = msg[0];
    return handle_clicked_piece(model, pos);
  } else if (msg instanceof UserClickedSquare) {
    let $ = model.mode;
    if ($ instanceof Selected) {
      let _record = model;
      return new Game(
        _record.board,
        _record.team_turn,
        _record.check,
        _record.winner,
        new Idle()
      );
    } else {
      return model;
    }
  } else {
    let pos = msg[0];
    let $ = model.mode;
    if ($ instanceof Selected) {
      let from = $[0];
      let board = model.board;
      let $1 = get(board, from);
      if ($1.isOk()) {
        let piece = $1[0];
        let new_board2 = (() => {
          let _pipe = board;
          let _pipe$1 = set(_pipe, pos, piece);
          return delete$2(_pipe$1, from);
        })();
        debug(isEqual(new_board2, board));
        let _record = model;
        return new Game(
          new_board2,
          _record.team_turn,
          _record.check,
          _record.winner,
          new Idle()
        );
      } else {
        return model;
      }
    } else {
      return model;
    }
  }
}
function render_piece(model, pos) {
  let board = model.board;
  return try$(
    get(board, pos),
    (piece) => {
      let piece_color2 = piece_color(piece);
      return new Ok(
        div(
          toList([
            classes(toList([["piece", true], ["square", true]])),
            style(toList([["color", piece_color2]])),
            (() => {
              let $ = isEqual(piece.team, model.team_turn);
              if ($) {
                return on_click(new UserClickedPiece(pos));
              } else {
                return on_click(new UserClickedSquare(pos));
              }
            })()
          ]),
          toList([
            span(
              toList([
                style(toList([["cursor", "grab"]])),
                (() => {
                  let $ = model.mode;
                  if ($ instanceof Selected) {
                    let pt = $[0];
                    let $1 = isEqual(pt, pos);
                    if ($1) {
                      return style(toList([["color", "red"]]));
                    } else {
                      return style(toList([["color", piece_color2]]));
                    }
                  } else {
                    return style(toList([["color", piece_color2]]));
                  }
                })()
              ]),
              toList([text(to_string4(piece))])
            )
          ])
        )
      );
    }
  );
}
function render_idle_square(model, pos) {
  let board = model.board;
  return div(
    toList([
      class$("square"),
      class$(bg_color(pos))
    ]),
    toList([
      (() => {
        let $ = get(board, pos);
        if ($.isOk()) {
          let _pipe = render_piece(model, pos);
          return unwrap(_pipe, text("?"));
        } else {
          return div(
            toList([style(toList([["font-size", "10px"]]))]),
            toList([
              text(
                to_string5(pos) + "|" + inspect2(pos.x) + "," + inspect2(
                  pos.y
                )
              )
            ])
          );
        }
      })()
    ])
  );
}
function render_selected_square(model, pos, legal_moves2) {
  let $ = contains(legal_moves2, pos);
  if ($) {
    debug(["legal move: ", pos]);
    return div(
      toList([
        style(toList([["font-size", "13px"]])),
        on_click(new UserMovedPieceTo(pos))
      ]),
      toList([text(to_string5(pos))])
    );
  } else {
    return render_idle_square(model, pos);
  }
}
function render_square(model, pos) {
  let $ = model.mode;
  if ($ instanceof Selected) {
    let pt = $[0];
    debug(["selected: ", pt]);
    let legal_moves2 = legal_moves(model, pt);
    return render_selected_square(model, pos, legal_moves2);
  } else {
    return render_idle_square(model, pos);
  }
}
function info_section(model) {
  return div(
    toList([]),
    toList([
      text(
        with_config(
          model.mode,
          new Config(
            new Unstyled(),
            new BitArraysAsString(),
            new Labels()
          )
        )
      ),
      text(
        (() => {
          let $ = model.mode;
          if ($ instanceof Selected) {
            let pt = $[0];
            let legal_moves2 = legal_moves(model, pt);
            return format(legal_moves2);
          } else {
            return "";
          }
        })()
      )
    ])
  );
}
function view(model) {
  let $ = model.board;
  return div(
    toList([]),
    toList([
      pre(
        toList([class$("chessboard")]),
        map2(
          (() => {
            let _pipe = all();
            let _pipe$1 = sized_chunk(_pipe, 8);
            let _pipe$2 = reverse(_pipe$1);
            return flatten(_pipe$2);
          })(),
          (pt) => {
            return render_square(model, pt);
          }
        )
      ),
      info_section(model)
    ])
  );
}
function main() {
  let app = simple(init2, update, view);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      219,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
