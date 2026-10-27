/* KuGou AdBlock 2.0.0 - Loon request/response script.
 * Logs contain endpoint paths and counters only. No network/storage API is used.
 */
(function () {
  "use strict";
  var VERSION = "2.0.0";
  var url = typeof $request !== "undefined" ? String($request.url || "") : "";
  var match = /^https?:\/\/([^\/:?#]+)(?::\d+)?([^?#]*)/i.exec(url);
  var host = match ? match[1].toLowerCase() : "";
  var path = match ? (match[2] || "/") : "";
  var argument = typeof $argument === "string" ? $argument : "";
  var debug = !/(?:^|&)debug=0(?:&|$)/.test(argument);
  var popups = /(?:^|&)popups=1(?:&|$)/.test(argument);
  var finished = false;

  function finish(result) {
    if (!finished) {
      finished = true;
      if (arguments.length === 0) $done();
      else $done(result);
    }
  }
  function log(message) {
    if (debug) console.log("[KuGouAdBlock " + VERSION + "] " + host + path + " " + message);
  }
  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === name.toLowerCase()) return String(headers[keys[i]]);
    }
    return "";
  }
  function reply(value, reason) {
    log("request-mock " + reason);
    finish({response: {status: 200, headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-KuGou-AdBlock": VERSION
    }, body: JSON.stringify(value)}});
  }
  function metricsGateway() {
    return host === "gateway.kugou.com" && /^\/ads\.gateway\/v3\/stat_(?:expose|click)$/.test(path);
  }
  function metricsAdp() {
    return host === "gateway.kugou.com" && path === "/adp/stat/v1/expose";
  }
  function liveAds() {
    return host === "fx.service.kugou.com" && path === "/mfx-kugoulive/ad/query_all";
  }
  function sdkAds() {
    return host === "mc.tencentmusic.com" && path === "/sdk/ad/strategies";
  }
  function category() {
    if (host === "gateway.kugou.com") {
      if (path === "/ads.gateway/v4/mobile_splash") return "splash";
      if (path === "/ads.gateway/v2/mobile_link") return "links";
      if (path === "/ads.gateway/v2/task_center_entrance") return "task";
      if (/^\/(?:adservice|ads\.service)\/v3\/vip_center$/.test(path) ||
          /^\/ads\.gateway\/(?:v3\/(?:mine_link|mobile_down)|v2\/(?:sidebar_link|sidebar_top_card|home_card))$/.test(path) ||
          /^\/adp\/ad\/v1\/(?:mine_top_banner|multi_page_pendant|home_combine)$/.test(path)) return "ads";
      if (path === "/aterouter/v2/get_dialog" && popups) return "dialog";
    }
    if (host === "adserviceretry.kglink.cn" && path === "/v4/mobile_splash_sort") return "splash-retry";
    if (host === "vipdress.kugou.com" && path === "/v1/dress_sales/get_popup_for_package" && popups) return "dress";
    return "";
  }

  try {
    if (typeof $response === "undefined" || $response === null) {
      if (metricsGateway()) return reply({status: 1, error_code: 0, data: ""}, "ad-metrics");
      if (metricsAdp()) return reply({errcode: 0, errmsg: "", data: {}, status: 1}, "adp-metrics");
      if (liveAds()) return reply({code: 0, data: [], msg: "", times: Date.now()}, "live-ad-list");
      if (sdkAds()) {
        // Shared SDK host: only block the KuGou client observed in both captures.
        if (/^kugou\//i.test(header($request.headers, "User-Agent"))) {
          log("request-block encrypted-ad-strategies");
          return finish();
        }
        return finish({});
      }
      return finish({});
    }

    var kind = category();
    if (!kind) return finish({});
    if (Number($response.status) !== 200) {
      log("skip http-status=" + Number($response.status));
      return finish({});
    }
    var payload;
    try { payload = JSON.parse($response.body); }
    catch (_) { log("skip non-json"); return finish({}); }
    if (!object(payload) || payload.status !== 1 || !object(payload.data)) {
      log("skip unexpected-schema");
      return finish({});
    }
    var data = payload.data;
    var removed = 0;
    var changed = false;
    function clearArray(container, key) {
      if (object(container) && Array.isArray(container[key])) {
        removed += container[key].length;
        if (container[key].length > 0) { container[key] = []; changed = true; }
      }
    }
    function clearNestedAds(value, depth) {
      if (depth > 8 || value === null || typeof value !== "object") return;
      Object.keys(value).forEach(function (key) {
        if (key === "ads" && Array.isArray(value[key])) clearArray(value, key);
        else if (value[key] !== null && typeof value[key] === "object") clearNestedAds(value[key], depth + 1);
      });
    }
    if (kind === "splash") {
      ["boot_ads", "front_ads", "discard"].forEach(function (key) { clearArray(data, key); });
    } else if (kind === "splash-retry") {
      ["ads", "retry_ads", "least_ads", "retry_id", "exposure_csj_ids", "exposure_tme_uni_ids"].forEach(function (key) { clearArray(data, key); });
    } else if (kind === "links") {
      clearArray(data, "info");
    } else if (kind === "task") {
      clearArray(data, "mine_page_under_tab_banner_ads");
      clearArray(data, "ads");
    } else if (kind === "ads") {
      clearNestedAds(data, 0);
    } else if (kind === "dialog") {
      clearArray(data, "popup_list");
    } else if (kind === "dress" && typeof data.need_popup === "boolean") {
      if (data.need_popup) { data.need_popup = false; changed = true; }
    }
    var headers = {};
    Object.keys($response.headers || {}).forEach(function (key) {
      if (!changed || !/^(?:content-length|content-encoding|transfer-encoding)$/i.test(key)) headers[key] = $response.headers[key];
    });
    headers["X-KuGou-AdBlock"] = VERSION;
    log("response " + kind + " removed=" + removed + " changed=" + changed);
    if (changed) {
      headers["Content-Type"] = "application/json; charset=utf-8";
      return finish({headers: headers, body: JSON.stringify(payload)});
    }
    return finish({headers: headers});
  } catch (_) {
    log("skip script-error");
    return finish({});
  }
}());
