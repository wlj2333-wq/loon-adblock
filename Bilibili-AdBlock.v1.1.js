/* Bilibili AdBlock 1.1.0 for Loon. Logs contain paths and counters only. */
(function () {
  "use strict";
  var VERSION = "1.1.0";
  var url = typeof $request !== "undefined" ? String($request.url || "") : "";
  var match = /^https?:\/\/app\.bilibili\.com(\/[^?#]*)(?:\?|$)/i.exec(url);
  var path = match ? match[1] : "";
  var finished = false;
  function done(value) {
    if (!finished) { finished = true; $done(value); }
  }
  function log(message) {
    console.log("[BilibiliAdBlock " + VERSION + "] " + path + " " + message);
  }
  function object(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  try {
    var splash = /^\/x\/v2\/splash\/(?:list|show|brand\/list|event\/list2)$/.test(path);
    var feed = /^\/x\/v2\/feed\/index(?:\/story)?$/.test(path);
    var cart = path === "/x/v2/feed/index/story/cart";
    if (!splash && !feed && !cart) return done({});
    if (typeof $response === "undefined" || !$response || Number($response.status) !== 200) {
      log("skip http-status"); return done({});
    }
    var payload;
    try { payload = JSON.parse($response.body); }
    catch (_) { log("skip non-json"); return done({}); }
    if (!object(payload) || payload.code !== 0 || !object(payload.data)) {
      log("skip unexpected-schema"); return done({});
    }
    var data = payload.data;
    var changed = false, removed = 0, banners = 0, cards = 0, mall = 0;
    function clear(key) {
      if (Array.isArray(data[key]) && data[key].length) {
        removed += data[key].length; data[key] = []; changed = true;
      }
    }
    if (splash) {
      if (path === "/x/v2/splash/brand/list") {
        clear("list"); clear("preload");
        if (typeof data.forcibly === "boolean" && data.forcibly) { data.forcibly = false; changed = true; }
        if (typeof data.force_show_times === "number" && data.force_show_times !== 0) {
          data.force_show_times = 0; changed = true;
        }
      } else if (path === "/x/v2/splash/event/list2") clear("event_list");
      else { clear("list"); clear("show"); clear("keep_ids"); }
      log("splash array-items-removed=" + removed + " changed=" + changed);
    } else if (cart) {
      clear("ads");
      log("story-ads removed=" + removed + " changed=" + changed);
    } else if (Array.isArray(data.items)) {
      data.items = data.items.filter(function (item) {
        if (!object(item)) return true;
        var type = typeof item.card_type === "string" ? item.card_type : "";
        var isBanner = /^banner/.test(type) || item.card_goto === "banner";
        var isCard = /^cm_/.test(type) || (object(item.ad_info) && Object.keys(item.ad_info).length > 0);
        // Only inspect navigation fields on the feed card itself, never video descriptions.
        var isMall = item.card_goto === "mall" || item.goto === "mall" ||
          (typeof item.uri === "string" && /^(?:https?:\/\/mall\.bilibili\.com(?:[\/?#]|$)|bilibili:\/\/mall(?:[\/?#]|$))/i.test(item.uri));
        if (!isBanner && !isCard && !isMall) return true;
        if (isBanner) banners++;
        else if (isMall) mall++;
        else cards++;
        removed++; changed = true; return false;
      });
      log("feed removed=" + removed + " banners=" + banners + " ad-cards=" + cards + " mall-cards=" + mall + " kept=" + data.items.length + " changed=" + changed);
    } else { log("skip items-not-array"); return done({}); }
    if (!changed) return done({});
    var headers = {};
    Object.keys($response.headers || {}).forEach(function (key) {
      if (!/^(?:content-length|content-encoding|transfer-encoding|cache-control|x-bilibili-adblock)$/i.test(key)) {
        headers[key] = $response.headers[key];
      }
    });
    headers["Cache-Control"] = "no-store";
    headers["X-Bilibili-AdBlock"] = VERSION;
    done({body: JSON.stringify(payload), headers: headers});
  } catch (_) { log("error processing-response; passthrough"); done({}); }
})();
