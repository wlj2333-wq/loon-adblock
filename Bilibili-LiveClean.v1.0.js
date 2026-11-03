/* Bilibili live clean 1.1.0: opt-in experiment for Loon.
 * Edits captured app-interface v2 homepage carousels and two room-info paths.
 * JSON.parse validates syntax only; original text outside edit spans is preserved.
 * No network, persistent storage, external dependencies or payload logging.
 */
(function () {
  "use strict";
  var VERSION = "1.1.0", finished = false;
  var args = typeof $argument === "object" && $argument !== null ? $argument : {};
  var banner = args.live_activity_banner === true;
  var shopping = args.live_shopping === true;
  var debug = args.live_debug === true;
  function done(result) { if (!finished) { finished = true; $done(result); } }
  function log(message) { if (debug) console.log("[BilibiliLiveClean " + VERSION + "] " + message); }
  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === name) return String(headers[keys[i]]);
    return "";
  }
  try {
    if (!banner && !shopping) return done({});
    if (typeof $request === "undefined" || $request.method !== "GET") return done({});
    var route = /^https:\/\/api\.live\.bilibili\.com\/xlive\/(app-interface\/v2\/index\/feed|app-room\/v1\/index\/getInfoByRoom)(?:\?[^#]*)?$/.exec(String($request.url || ""));
    if (!route) return done({});
    var home = route[1] === "app-interface/v2/index/feed";
    if (home && !banner) return done({});
    if (typeof $response === "undefined" || Number($response.status) !== 200) return done({});
    if (!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(header($response.headers, "content-type"))) return done({});
    var text = $response.body;
    if (typeof text !== "string" || text.length > 2097152) { log("skip body-type-or-size"); return done({}); }
    // Validate the entire document, including unknown values and trailing data.
    // Never serialize the result, so integers outside Number's safe range survive.
    JSON.parse(text);
    var pos = 0, nodes = 0;
    function space() { while (pos < text.length && /[\x20\t\r\n]/.test(text.charAt(pos))) pos++; }
    function stringEnd() {
      pos++; // opening quote; JSON.parse has already validated escape sequences
      while (pos < text.length) {
        var c = text.charAt(pos++);
        if (c === "\\") pos++;
        else if (c === '"') return;
      }
      throw new Error("invalid-json");
    }
    function value(depth, wanted) {
      if (depth > 64 || ++nodes > 100000) throw new Error("structure-limit");
      space();
      var start = pos, first = text.charAt(pos), node = {start: start};
      if (first === "{") {
        node.type = "object";
        if (wanted && typeof wanted === "object" && !Array.isArray(wanted)) node.fields = Object.create(null);
        var seen = Object.create(null);
        pos++; space();
        if (text.charAt(pos) !== "}") {
          while (true) {
            space(); var keyStart = pos;
            if (text.charAt(pos) !== '"') throw new Error("invalid-json");
            stringEnd();
            var key = JSON.parse(text.slice(keyStart, pos));
            if (own(seen, key)) throw new Error("duplicate-key");
            seen[key] = true;
            space();
            if (text.charAt(pos++) !== ":") throw new Error("invalid-json");
            var keep = node.fields && own(wanted, key);
            var child = value(depth + 1, keep ? wanted[key] : null);
            if (keep) node.fields[key] = child;
            space();
            if (text.charAt(pos) !== ",") break;
            pos++;
          }
        }
        if (text.charAt(pos++) !== "}") throw new Error("invalid-json");
      } else if (first === "[") {
        node.type = "array"; pos++; space();
        if (Array.isArray(wanted)) node.elements = [];
        if (text.charAt(pos) !== "]") {
          while (true) {
            var element = value(depth + 1, node.elements ? wanted[0] : null);
            if (node.elements) node.elements.push(element);
            space();
            if (text.charAt(pos) !== ",") break;
            pos++;
          }
        }
        if (text.charAt(pos++) !== "]") throw new Error("invalid-json");
      } else if (first === '"') {
        node.type = "string"; stringEnd();
      } else {
        while (pos < text.length && !/[\x20\t\r\n,\]}]/.test(text.charAt(pos))) pos++;
        var raw = text.slice(start, pos);
        node.type = raw === "true" || raw === "false" ? "boolean" : raw === "null" ? "null" : "number";
      }
      node.end = pos;
      return node;
    }
    var root = value(0, {code: true, data: {
      activity_banner_info: true, shopping_info: {is_show: true},
      card_list: [{card_type: true, card_data: {banner_v2: {list: true}}}]
    }});
    space();
    if (pos !== text.length) throw new Error("invalid-json");
    var fields = root.fields, code = fields && fields.code, data = fields && fields.data;
    if (!code || code.type !== "number" || text.slice(code.start, code.end) !== "0" ||
        !data || data.type !== "object") return done({});
    var changes = [], countHome = 0, countBanner = 0, countShopping = 0;
    if (home) {
      var cards = data.fields.card_list;
      if (cards && cards.type === "array") {
        var elements = cards.elements;
        var remove = elements.map(function (card) {
          var type = card.fields && card.fields.card_type;
          var payload = card.fields && card.fields.card_data;
          var carousel = payload && payload.type === "object" && payload.fields.banner_v2;
          var list = carousel && carousel.type === "object" && carousel.fields.list;
          return type && type.type === "string" && JSON.parse(text.slice(type.start, type.end)) === "banner_v2" &&
            list && list.type === "array";
        });
        for (var i = 0; i < elements.length; i++) {
          if (!remove[i]) continue;
          var first = i;
          while (i + 1 < elements.length && remove[i + 1]) i++;
          countHome += i - first + 1;
          // Delete whole selected element ranges with the adjacent separator.
          // Retained cards and all text outside those ranges keep their original bytes.
          var start = elements[first].start, end = elements[i].end;
          if (i + 1 < elements.length) end = elements[i + 1].start;
          else if (first > 0) start = elements[first - 1].end;
          changes.push({start: start, end: end, replacement: ""});
        }
      }
    } else {
      var activity = data.fields.activity_banner_info;
      if (banner && activity && activity.type === "object") {
        changes.push({start: activity.start, end: activity.end, replacement: "null"});
        countBanner = 1;
      }
      var shop = data.fields.shopping_info;
      var show = shop && shop.type === "object" && shop.fields.is_show;
      if (shopping && show) {
        var original = text.slice(show.start, show.end);
        if ((show.type === "number" && original === "1") || (show.type === "boolean" && original === "true")) {
          changes.push({start: show.start, end: show.end, replacement: show.type === "boolean" ? "false" : "0"});
          countShopping = 1;
        }
      }
    }
    if (!changes.length) { log("home_carousels=0 banner=0 shopping=0 changed=false"); return done({}); }
    changes.sort(function (a, b) { return b.start - a.start; });
    changes.forEach(function (edit) { text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end); });
    var headers = {};
    Object.keys($response.headers || {}).forEach(function (key) {
      if (!/^(?:content-length|content-encoding|transfer-encoding|etag|content-md5|digest|x-bilibili-live-clean)$/i.test(key)) headers[key] = $response.headers[key];
    });
    headers["X-Bilibili-Live-Clean"] = VERSION;
    log("home_carousels=" + countHome + " banner=" + countBanner + " shopping=" + countShopping + " changed=true");
    done({body: text, headers: headers});
  } catch (error) {
    // Fixed labels only. JSON parse errors may contain account data: never print them.
    var reason = error && error.message;
    log("skip " + (reason === "structure-limit" || reason === "duplicate-key" ? reason : "invalid-or-unsupported-json") + "; unchanged");
    done({});
  }
})();
