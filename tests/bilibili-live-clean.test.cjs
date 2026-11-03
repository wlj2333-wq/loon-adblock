const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'Bilibili-LiveClean.v1.0.js'), 'utf8');
const url = 'https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom?room_id=1';

function run(body, options = {}) {
  let result, calls = 0;
  const logs = [];
  const context = {
    $argument: {live_activity_banner: true, live_shopping: true, live_debug: false, ...options.args},
    $request: {url, method: 'GET', ...options.request},
    $response: {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}, body, ...options.response},
    $done(value) { calls++; result = JSON.parse(JSON.stringify(value)); },
    console: {log(value) { logs.push(value); }},
  };
  vm.runInNewContext(source, context, {timeout: 2000});
  assert.equal(calls, 1, 'exactly one completion');
  return {result, logs};
}
function unchanged(body, options) { assert.deepEqual(run(body, options).result, {}); }
const input = '{"code":0,"data":{"activity_banner_info":{"title":"活动"},"shopping_info":{"is_show":1,"goods_id":9223372036854775807},"room_id":9223372036854775807}}';

test('only known spans change; long IDs and unrelated formatting remain byte-for-byte', () => {
  const body = ' \n{"code":0, "data" : {"activity_banner_info" : {"title":"活动","text":"}\\\"[\\\\"}, "room_id":9223372036854775807, "shopping_info":{"is_show" : 1,"price":1.2300e+08},"extra":-0}}\n';
  const expected = ' \n{"code":0, "data" : {"activity_banner_info" : null, "room_id":9223372036854775807, "shopping_info":{"is_show" : 0,"price":1.2300e+08},"extra":-0}}\n';
  assert.equal(run(body).result.body, expected);
});

test('independent opt-in switches, missing arguments and strict booleans', () => {
  unchanged(input, {args: {live_activity_banner: false, live_shopping: false, live_debug: true}});
  unchanged(input, {args: {live_activity_banner: 'true', live_shopping: 1}});
  assert.equal(run(input, {args: {live_shopping: false}}).result.body,
    input.replace('{"title":"活动"}', 'null'));
  assert.equal(run(input, {args: {live_activity_banner: false}}).result.body,
    input.replace('"is_show":1', '"is_show":0'));
});

test('boolean shopping value keeps boolean type', () => {
  const body = '{"code":0,"data":{"shopping_info":{"is_show":true,"unknown":"x"}}}';
  assert.equal(run(body).result.body, body.replace(':true', ':false'));
});

for (const raw of ['false', '0', '2', '-1', '"1"', 'null', '{}', '[]', '1.0', '1e0', '1.00000000000000001']) {
  test('unrecognized shopping value is preserved: ' + raw, () => {
    unchanged('{"code":0,"data":{"shopping_info":{"is_show":' + raw + '}}}');
  });
}
for (const raw of ['null', '[]', 'true', '1', '"ad"']) {
  test('unknown activity field type is preserved: ' + raw, () => {
    unchanged('{"code":0,"data":{"activity_banner_info":' + raw + '}}');
  });
}
for (const raw of ['1', '-400', '1e-400', '"0"', 'false', 'null', '{}', '0.0']) {
  test('only successful integer code is handled: ' + raw, () => {
    unchanged(input.replace('"code":0', '"code":' + raw));
  });
}

test('unknown nested similarly named fields and all account/playback fields survive', () => {
  const body = '{"code":0,"data":{"activity_banner_info":{"ad":1},"unknown":{"activity_banner_info":{"ad":2},"shopping_info":{"is_show":1}},"room_info":{"is_show":1},"playurl":"https://example.test/a","uid":9223372036854775807,"is_admin":true,"vip":{"status":1},"danmaku":{"token":"SECRET"},"gift":{"is_show":1},"shopping_info":{"is_show":1,"order_token":"SECRET"}}}';
  assert.equal(run(body).result.body,
    body.replace('{"ad":1}', 'null').replace('"shopping_info":{"is_show":1,"order_token"', '"shopping_info":{"is_show":0,"order_token"'));
});

test('escaped target keys are recognized and retain original spelling', () => {
  const body = '{"co\\u0064e":0,"da\\u0074a":{"activity_banner_\\u0069nfo":{"x":1},"shopping_\\u0069nfo":{"is_\\u0073how":1}}}';
  assert.equal(run(body).result.body, body.replace('{"x":1}', 'null').replace('\\u0073how":1', '\\u0073how":0'));
});

for (const body of [
  input + ' trailing', input.slice(0, -1), input + '{}',
  '{"code":0,"data":{"activity_banner_info":{},}}',
  '{"code":0,"data":{"activity_banner_info":{"x":"\\q"}}}',
  '{"code":0,"data":{"activity_banner_info":{"x":"\n"}}}',
  '{"code":0,"data":{"activity_banner_info":{},"bad":01}}',
  '{"code":0,"data":{"activity_banner_info":{}},"bad":NaN}',
  '\uFEFF' + input,
]) {
  test('invalid complete document fails open: ' + JSON.stringify(body).slice(0, 70), () => unchanged(body));
}

for (const body of [
  '{"code":0,"code":1,"data":{"activity_banner_info":{}}}',
  '{"code":0,"data":{"activity_banner_info":{},"activity_banner_\\u0069nfo":{}}}',
  '{"code":0,"data":{"activity_banner_info":{},"unknown":{"x":1,"\\u0078":2}}}',
  '{"code":0,"data":{"shopping_info":{"is_show":1,"is_\\u0073how":false}}}',
]) {
  test('duplicate or escaped duplicate keys fail open', () => unchanged(body));
}

for (const request of [
  {method: 'POST'}, {method: 'HEAD'},
  {url: url.replace('https:', 'http:')},
  {url: url.replace('api.live.bilibili.com', 'api.live.bilibili.com.evil.test')},
  {url: url.replace('app-room/v1', 'web-room/v1')},
  {url: url.replace('app-room/v1', 'app-room/v2')},
  {url: url.replace('getInfoByRoom?', 'getInfoByRoomExtra?')},
  {url: url.replace('getInfoByRoom?', 'getDanmuInfo?')},
  {url: 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=1'},
  {url: 'https://api.live.bilibili.com/msg/send'},
  {url: 'wss://broadcastlv.chat.bilibili.com/sub'},
  {url: url + '#fragment'},
]) {
  test('HTTP scope protects unrelated traffic: ' + JSON.stringify(request), () => unchanged(input, {request}));
}

test('valid bare endpoint URL and JSON content-type casing', () => {
  assert.ok(run(input, {request: {url: url.split('?')[0]}, response: {headers: {'cOnTeNt-TyPe': 'application/json'}}}).result.body);
});

for (const response of [
  {status: 403}, {status: 500}, {headers: {}},
  {headers: {'Content-Type': 'text/html'}},
  {headers: {'Content-Type': 'application/grpc'}},
  {body: new Uint8Array([1, 2])}, {body: undefined},
]) {
  test('unsupported response is untouched: ' + JSON.stringify(response), () => unchanged(input, {response}));
}

test('limits reject oversized, very deep and overly complex documents', () => {
  unchanged('{"code":0,"data":{"activity_banner_info":{}},"large":"' + 'x'.repeat(2097152) + '"}');
  unchanged('{"code":0,"data":{"activity_banner_info":{}},"deep":' + '['.repeat(70) + '0' + ']'.repeat(70) + '}');
  unchanged('{"code":0,"data":{"activity_banner_info":{}},"many":[' + Array(100001).fill('0').join(',') + ']}');
});

test('empty, unknown and already clean structures are untouched', () => {
  for (const body of ['null', '[]', '0', '{}', '{"code":0}', '{"code":0,"data":null}', '{"code":0,"data":{"activity_banner_info":null,"shopping_info":{"is_show":0}}}']) unchanged(body);
});

test('changed responses remove stale representation headers; unrelated headers survive', () => {
  const headers = {'Content-Type': 'application/json', 'Content-Length': '123', 'content-encoding': 'gzip',
    ETag: 'old', Digest: 'old', 'Content-MD5': 'old', 'Transfer-Encoding': 'chunked', 'X-Other': 'keep'};
  const result = run(input, {response: {headers}}).result;
  assert.deepEqual(result.headers, {'Content-Type': 'application/json', 'X-Other': 'keep', 'X-Bilibili-Live-Clean': '1.0.0'});
});

test('diagnostics are silent by default and never contain payload, URL or error text', () => {
  assert.deepEqual(run(input).logs, []);
  const success = run(input, {args: {live_debug: true}, request: {url: url + '&access_key=SECRET'}});
  assert.deepEqual(success.logs, ['[BilibiliLiveClean 1.0.0] banner=1 shopping=1 changed=true']);
  const broken = run(input + 'SECRET', {args: {live_debug: true}});
  assert.deepEqual(broken.logs, ['[BilibiliLiveClean 1.0.0] skip invalid-or-unsupported-json; unchanged']);
});

test('generated unrelated number and string payloads retain exact source text', () => {
  for (let i = 0; i < 50; i++) {
    const body = '{"code":0,"data":{"activity_banner_info":{"i":' + i + '},"unknown":{"id":92233720368547758' + String(i).padStart(2, '0') + ',"s":' + JSON.stringify('x"\\\n' + i) + ',"n":1.2300e+08}}}';
    assert.equal(run(body).result.body, body.replace('{"i":' + i + '}', 'null'));
  }
});
