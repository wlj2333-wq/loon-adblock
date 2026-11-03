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
  assert.deepEqual(result.headers, {'Content-Type': 'application/json', 'X-Other': 'keep', 'X-Bilibili-Live-Clean': '1.1.0'});
});

test('diagnostics are silent by default and never contain payload, URL or error text', () => {
  assert.deepEqual(run(input).logs, []);
  const success = run(input, {args: {live_debug: true}, request: {url: url + '&access_key=SECRET'}});
  assert.deepEqual(success.logs, ['[BilibiliLiveClean 1.1.0] home_carousels=0 banner=1 shopping=1 changed=true']);
  const broken = run(input + 'SECRET', {args: {live_debug: true}});
  assert.deepEqual(broken.logs, ['[BilibiliLiveClean 1.1.0] skip invalid-or-unsupported-json; unchanged']);
});

test('generated unrelated number and string payloads retain exact source text', () => {
  for (let i = 0; i < 50; i++) {
    const body = '{"code":0,"data":{"activity_banner_info":{"i":' + i + '},"unknown":{"id":92233720368547758' + String(i).padStart(2, '0') + ',"s":' + JSON.stringify('x"\\\n' + i) + ',"n":1.2300e+08}}}';
    assert.equal(run(body).result.body, body.replace('{"i":' + i + '}', 'null'));
  }
});

const homeUrl = 'https://api.live.bilibili.com/xlive/app-interface/v2/index/feed';
const carousel = '{"card_type":"banner_v2","card_data":{"banner_v2":{"list":[{"static":{"title":"公开活动示例"}}]}}}';
function home(body, options = {}) { return run(body, {...options, request: {url: homeUrl, ...options.request}}); }

test('captured homepage shape loses only carousel; follow/area/20 live cards and pagination keep original text', () => {
  const cards = [carousel,
    '{"card_type":"my_idol_v1","card_data":{"unknown":9223372036854775807}}',
    '{"card_type":"area_entrance_v3","card_data":{"unknown":[1,2,3]}}',
    ...Array.from({length: 20}, (_, i) => '{"card_type":"small_card_v1","card_data":{"synthetic_index":' + i + ',"long_number":9223372036854775807,"exact":1.2300e+08}}')];
  const prefix = '{"code":0,"data":{"card_list":[  ';
  const suffix = '  ],"has_more":1,"trigger_time":9223372036854775807,"feature_switch":{"unknown":true},"activity_banner_info":{"keep":true},"shopping_info":{"is_show":1}}}';
  const result = home(prefix + cards.join(' , \n  ') + suffix, {args: {live_debug: true}});
  assert.equal(result.result.body, prefix + cards.slice(1).join(' , \n  ') + suffix);
  assert.deepEqual(result.logs, ['[BilibiliLiveClean 1.1.0] home_carousels=1 banner=0 shopping=0 changed=true']);
});

test('all removal positions and adjacent groups preserve surviving cards and JSON syntax', () => {
  for (let mask = 1; mask < 32; mask++) {
    const cards = Array.from({length: 5}, (_, i) => mask & (1 << i) ? carousel :
      '{"card_type":"unknown_' + i + '","card_data":{"exact":1.2300e+08,"id":9223372036854775807}}');
    const body = '{"code":0,"data":{"card_list":[ \n' + cards.join(' ,\t') + '\n ],"has_more":1}}';
    const result = home(body).result.body;
    const parsed = JSON.parse(result);
    const retained = cards.filter((_, i) => !(mask & (1 << i)));
    assert.equal(parsed.data.card_list.length, retained.length);
    for (const raw of retained) assert.ok(result.includes(raw), 'surviving item preserves every original character');
    assert.ok(result.endsWith('\n ],"has_more":1}}'), 'unrelated suffix survives');
    assert.equal(parsed.data.has_more, 1);
    assert.deepEqual(home(result).result, {}, 'idempotent after removing known carousel');
  }
});

test('homepage only removes the documented type plus known payload structure', () => {
  const unknownCards = [
    '{"card_type":"banner_v1","card_data":{"banner_v2":{"list":[]}}}',
    '{"card_type":"banner_v2","card_data":{"banner_v2":{"list":{}}}}',
    '{"card_type":"banner_v2","card_data":{"banner_v2":[]}}',
    '{"card_type":"banner_v2","card_data":{"list":[]}}',
    '{"card_type":"banner_v2","card_data":null}',
    '{"card_type":"banner_v2","card_data":[]}',
    '{"card_type":"banner_v2"}', 'null', '[]', '1',
    '{"card_type":"small_card_v1","card_data":{"banner_v2":{"list":[]},"title":"banner_v2"}}',
    '{"card_type":"unknown","card_data":{"nested":' + carousel + '}}',
  ];
  const body = '{"code":0,"data":{"card_list":[' + unknownCards.join(',') + ']}}';
  assert.deepEqual(home(body).result, {});
  assert.equal(home(body.replace('"card_list":[', '"card_list":[' + carousel + ',')).result.body, body);
});

test('carousel requires its switch, exact route and a successful response', () => {
  const body = '{"code":0,"data":{"card_list":[' + carousel + ']}}';
  assert.deepEqual(home(body, {args: {live_activity_banner: false, live_shopping: true, live_debug: true}}), {result: {}, logs: []});
  for (const request of [
    {method: 'POST'}, {method: 'HEAD'},
    {url: homeUrl.replace('/v2/', '/v1/')}, {url: homeUrl + '/extra'}, {url: homeUrl + '#fragment'},
    {url: homeUrl.replace('api.live.bilibili.com', 'api.live.bilibili.com.evil.test')},
  ]) assert.deepEqual(home(body, {request}).result, {});
  assert.deepEqual(home(body, {response: {status: 500}}).result, {});
  assert.deepEqual(home(body.replace('"code":0', '"code":1e-400')).result, {});
  assert.deepEqual(home(body, {request: {url}}).result, {}, 'room route never touches homepage card_list');
});

test('homepage escaped keys work, but ambiguous duplicate keys fail open', () => {
  const escaped = '{"code":0,"data":{"card_\\u006cist":[{"card_\\u0074ype":"banner_\\u00762","card_data":{"banner_v2":{"list":[]}}}]}}';
  assert.equal(home(escaped).result.body, '{"code":0,"data":{"card_\\u006cist":[]}}');
  const duplicate = '{"code":0,"data":{"card_list":[{"card_type":"banner_v2","card_\\u0074ype":"small_card_v1","card_data":{"banner_v2":{"list":[]}}}]}}';
  assert.deepEqual(home(duplicate).result, {});
});
