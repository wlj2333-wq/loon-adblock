/* Bilibili player ads 1.3.0, Loon binary response script.
 * Parses protobuf wire fields without decoding/re-encoding unrelated values.
 * No network, storage, account logging or external dependencies.
 */
(function () {
  "use strict";
  var VERSION = "1.3.0", finished = false;
  var match = /^https:\/\/grpc\.biliapi\.net(\/bilibili\.app\.viewunite\.v1\.View\/(View|RelatesFeed|PlayPause))(?:\?|$)/.exec(String($request.url || ""));
  var method = match ? match[2] : "";
  var counts = {cm: 0, cards: 0, pause: 0};
  function done(result) { if (!finished) { finished = true; $done(result); } }
  function log(text) { console.log("[BilibiliPlayerAds " + VERSION + "] " + method + " " + text); }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === name) return String(headers[keys[i]]);
    return "";
  }
  function join(parts) {
    var size = 0, offset = 0;
    parts.forEach(function (p) { size += p.length; });
    var result = new Uint8Array(size);
    parts.forEach(function (p) { result.set(p, offset); offset += p.length; });
    return result;
  }
  function readVar(bytes, state) {
    var value = 0, multiplier = 1, exact = true;
    for (var i = 0; i < 10; i++) {
      if (state.pos >= bytes.length) throw new Error("truncated-varint");
      var b = bytes[state.pos++];
      if (i === 9 && b > 1) throw new Error("invalid-varint");
      value += (b & 127) * multiplier;
      if (value > 9007199254740991) exact = false;
      if (b < 128) return exact ? value : null;
      multiplier *= 128;
    }
    throw new Error("invalid-varint");
  }
  function encodeVar(value) {
    var out = [];
    do { var b = value % 128; value = Math.floor(value / 128); out.push(b + (value ? 128 : 0)); } while (value);
    return new Uint8Array(out);
  }
  function parse(bytes) {
    var state = {pos: 0}, out = [];
    while (state.pos < bytes.length) {
      var start = state.pos, tag = readVar(bytes, state), keyEnd = state.pos;
      if (tag === null || tag < 8 || tag > 4294967295) throw new Error("invalid-tag");
      var number = Math.floor(tag / 8), wire = tag % 8, value = null, data = null;
      if (wire === 0) value = readVar(bytes, state);
      else if (wire === 2) {
        var size = readVar(bytes, state);
        if (size === null || size > bytes.length - state.pos) throw new Error("invalid-length");
        data = bytes.subarray(state.pos, state.pos + size); state.pos += size;
      } else if (wire === 1 || wire === 5) {
        state.pos += wire === 1 ? 8 : 4;
        if (state.pos > bytes.length) throw new Error("truncated-fixed");
      } else throw new Error("unsupported-wire");
      out.push({n: number, w: wire, value: value, data: data,
        key: bytes.subarray(start, keyEnd), raw: bytes.subarray(start, state.pos)});
    }
    return out;
  }
  function same(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function replace(field, data) { return join([field.key, encodeVar(data.length), data]); }
  function mapChildren(bytes, number, transform) {
    return join(parse(bytes).map(function (f) {
      if (f.n !== number || f.w !== 2) return f.raw;
      var data = transform(f.data);
      return same(data, f.data) ? f.raw : replace(f, data);
    }));
  }
  function hasAdType(bytes) {
    var marker = "type.googleapis.com/bilibili.ad.v1.";
    outer: for (var i = 0; i <= bytes.length - marker.length; i++) {
      for (var j = 0; j < marker.length; j++) if (bytes[i + j] !== marker.charCodeAt(j)) continue outer;
      return true;
    }
    return false;
  }
  function cardIsAd(bytes) {
    var fields = parse(bytes);
    var type = fields.some(function (f) { return f.n === 1 && f.w === 0 && f.value === 5; });
    return fields.some(function (f) { return f.n === 6 && f.w === 2 && (type || hasAdType(f.data)); });
  }
  function cleanCards(bytes) {
    return join(parse(bytes).filter(function (f) {
      if (f.n === 1 && f.w === 2 && cardIsAd(f.data)) { counts.cards++; return false; }
      return true;
    }).map(function (f) { return f.raw; }));
  }
  function cleanModule(bytes) {
    var fields = parse(bytes);
    var known = fields.some(function (f) { return f.n === 1 && f.w === 0 && (f.value === 15 || f.value === 28); });
    return known ? mapChildren(bytes, 22, cleanCards) : bytes;
  }
  function cleanView(bytes) {
    return join(parse(bytes).map(function (f) {
      // ViewReply.cm is an ad-only container; preserve an unrecognized payload.
      if (f.n === 7 && f.w === 2 && hasAdType(f.data)) { counts.cm++; return new Uint8Array(0); }
      if (f.n !== 5 || f.w !== 2) return f.raw;
      var tab = mapChildren(f.data, 1, function (tabModule) {
        return mapChildren(tabModule, 2, function (introduction) {
          return mapChildren(introduction, 2, cleanModule);
        });
      });
      return same(tab, f.data) ? f.raw : replace(f, tab);
    }));
  }
  function cleanPause(bytes) {
    var fields = parse(bytes);
    // The captured reply has an enabled flag, ad notice and ad content in 1/2/3.
    // Only act when field 3 contains a typed Bilibili advertising payload.
    if (!fields.some(function (f) { return f.n === 3 && f.w === 2 && hasAdType(f.data); })) return bytes;
    counts.pause++;
    return join(fields.map(function (f) {
      if ((f.n === 2 || f.n === 3) && f.w === 2) return new Uint8Array(0);
      if (f.n === 1 && f.w === 0) return join([f.key, new Uint8Array([0])]);
      return f.raw;
    }));
  }
  try {
    if (!method) return done({});
    if (typeof $response === "undefined" || Number($response.status) !== 200) { log("skip http-status"); return done({}); }
    if (!/^application\/grpc(?:[+;]|$)/i.test(header($response.headers, "content-type"))) { log("skip content-type"); return done({}); }
    var grpcStatus = header($response.h2_trailers, "grpc-status") || header($response.headers, "grpc-status");
    if (grpcStatus && grpcStatus !== "0") { log("skip grpc-status"); return done({}); }
    var bytes = $response.body;
    if (!(bytes instanceof Uint8Array)) { log("skip requires-binary-body"); return done({}); }
    var pos = 0, parts = [], changed = false;
    while (pos < bytes.length) {
      var start = pos;
      if (bytes.length - pos < 5) throw new Error("truncated-frame");
      var flag = bytes[pos], length = bytes[pos + 1] * 16777216 + bytes[pos + 2] * 65536 + bytes[pos + 3] * 256 + bytes[pos + 4];
      pos += 5;
      if ((flag !== 0 && flag !== 1) || length > bytes.length - pos) throw new Error("invalid-frame");
      var payload = bytes.subarray(pos, pos + length); pos += length;
      var decoded = payload;
      if (flag === 1) {
        if (header($response.headers, "grpc-encoding").toLowerCase() !== "gzip") throw new Error("unsupported-compression");
        if (typeof $utils === "undefined" || typeof $utils.ungzip !== "function" || typeof $utils.gzip !== "function") throw new Error("gzip-api-unavailable");
        decoded = $utils.ungzip(payload);
      }
      if (decoded.length > 16777216) throw new Error("message-too-large");
      var cleaned = method === "View" ? cleanView(decoded) : method === "RelatesFeed" ? cleanCards(decoded) : cleanPause(decoded);
      if (same(cleaned, decoded)) { parts.push(bytes.subarray(start, pos)); continue; }
      changed = true;
      var encoded = flag ? $utils.gzip(cleaned) : cleaned;
      var frame = new Uint8Array(5);
      frame[0] = flag;
      frame[1] = Math.floor(encoded.length / 16777216) % 256;
      frame[2] = Math.floor(encoded.length / 65536) % 256;
      frame[3] = Math.floor(encoded.length / 256) % 256;
      frame[4] = encoded.length % 256;
      parts.push(frame, encoded);
    }
    log("cm-containers=" + counts.cm + " ad-cards=" + counts.cards + " pause-blocks=" + counts.pause + " changed=" + changed);
    if (!changed) return done({});
    var headers = {};
    Object.keys($response.headers || {}).forEach(function (key) {
      if (!/^(?:content-length|content-encoding|transfer-encoding|x-bilibili-player-adblock)$/i.test(key)) headers[key] = $response.headers[key];
    });
    headers["X-Bilibili-Player-AdBlock"] = VERSION;
    done({body: join(parts), headers: headers});
  } catch (error) {
    // Fixed parser error labels only; never log raw payloads or URL query values.
    var reason = error && String(error.message || "");
    var known = /^(?:truncated-varint|invalid-varint|invalid-tag|invalid-length|truncated-fixed|unsupported-wire|truncated-frame|invalid-frame|unsupported-compression|gzip-api-unavailable|message-too-large)$/.test(reason);
    log("skip processing-error=" + (known ? reason : "runtime") + "; unchanged"); done({});
  }
})();
