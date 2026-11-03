const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'Bilibili-LiveClean.v1.0.js'), 'utf8');
const url = 'https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom?room_id=1&access_key=PRIVATE_SENTINEL';
const all = {live_activity_banner:true,live_shopping:true,live_debug:true};
let runs=0;
function execute(body, options={}) {
  const calls=[], logs=[];
  const context = {$request:{url,method:'GET',...options.request},$response:{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Content-Length':'1','ETag':'old',Keep:'yes'},body,...options.response},$argument:options.args ?? all,console:{log:m=>logs.push(String(m))},$done:r=>calls.push(r)};
  vm.runInNewContext(source,context,{timeout:1500});
  assert.equal(calls.length,1,'exactly one completion');
  assert(!logs.join('\n').includes('PRIVATE_SENTINEL'),'query must never leak');
  runs++;
  return {result:calls[0],logs};
}
function unchanged(body,options) {assert.deepEqual(Object.keys(execute(body,options).result),[]);}
const basic = '{"code":0,"data":{"activity_banner_info":{"x":1},"shopping_info":{"is_show":1},"room_id":18446744073709551615}}';
for(let i=0;i<500;i++) {
  const banner=JSON.stringify({id:i,content:'quote" slash\\ close} brace{ unicode🦊',more:[false,null,i]});
  const sibling=JSON.stringify({keep:i,activity_banner_info:{retain:true},shopping_info:{is_show:1},nested:[{x:'keep'}]});
  const show=i%2?'true':'1';
  const build=(b,s)=>` { "code" : 0, "data" : { "room_id":1844674407370955${String(i).padStart(4,'0')}, "activity_banner_info" : ${b}, "shopping_info" : {"is_show":${s},"unknown":${sibling}},"other":${sibling}}, "uid":900719925474099312345 }\n`;
  const before=build(banner,show), expected=build('null',show==='true'?'false':'0');
  const {result}=execute(before);
  assert.equal(result.body,expected,'only the two intended spans may differ');
  assert.equal(result.headers.Keep,'yes');
  assert(!Object.keys(result.headers).some(k=>/^(content-length|etag)$/i.test(k)));
  unchanged(result.body);
  unchanged(before,{args:{}});
}
for(const request of [
  {method:'POST'},{method:'HEAD'},
  {url:url.replace('api.live.bilibili.com','api.live.bilibili.com.evil.test')},
  {url:url.replace('/app-room/v1/','/web-room/v1/')},
  {url:url.replace('getInfoByRoom','getInfoByUser')},
  {url:url.replace('getInfoByRoom','getInfoByRoomExtra')},
  {url:url.replace('getInfoByRoom','getDanmuInfo')},
  {url:url.replace('getInfoByRoom','getRoomPlayInfo')},
  {url:url.replace('?room_id','/extra?room_id')},
  {url:url.replace('https:','http:')},
]) unchanged(basic,{request});
for(const response of [{status:403},{status:204},{headers:{'Content-Type':'text/html'}},{headers:{'Content-Type':'application/jsonp'}},{headers:{}},{body:new Uint8Array([123,125])}]) unchanged(basic,{response});
for(const body of [
  basic+'x',basic.slice(0,-1),'{"code":0,"code":0,"data":{"activity_banner_info":{}}}',
  '{"code":0,"data":{},"\\u0064ata":{"activity_banner_info":{}}}',
  '{"code":0,"data":{"activity_banner_info":{},"unrelated":{"a":1,"a":2}}}',
  '{"code":1e-400,"data":{"activity_banner_info":{}}}',
  '{"code":"0","data":{"activity_banner_info":{}}}',
  '{"code":0,"data":{"activity_banner_info":[],"shopping_info":{"is_show":1.00000000000000001}}}',
  '{"code":0,"data":{"activity_banner_info":"{}","shopping_info":{"is_show":"1"}}}',
  '{"code":0,"data":{"activity_banner_info":false,"shopping_info":{"is_show":2}}}',
  '[{"code":0,"data":{"activity_banner_info":{}}}]',
  '{"code":0,"data":null}',
  '{"code":0,"data":{"activity_banner_info":{},"deep":'+ '['.repeat(70)+'0'+']'.repeat(70)+'}}',
  '{"code":0,"data":{"activity_banner_info":{}},"padding":"'+'x'.repeat(2097152)+'"}',
]) unchanged(body);
const quiet=execute(basic,{args:{...all,live_debug:false}});
assert.equal(quiet.logs.length,0,'diagnostics default off must be silent');
const escaped='{ "code":0,"data":{"act\\u0069vity_banner_info":{"x":1},"shopping_info":{"is_show":true}},"message":"activity_banner_info is_show 18446744073709551615"}';
assert.equal(execute(escaped).result.body,escaped.replace('{"x":1}','null').replace('"is_show":true','"is_show":false'));
const crypto = require('node:crypto');
const normalize = text => text.replace(/\r\n/g, '\n');
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
const plugin = normalize(fs.readFileSync(path.join(root, 'Bilibili-AdBlock-v1.2-Rewrite.plugin'), 'utf8'));
const player = normalize(fs.readFileSync(path.join(root, 'Bilibili-PlayerAds.v1.3.js'), 'utf8')).trimEnd()+'\n';
assert.equal(sha256(player),'bfb017566a65de15d955d4e4cb187fe6f20a2c68e096937ed1087208f2664516','existing player script stays unchanged from main 03ccc14');
assert.equal(sha256(plugin.split('[Rewrite]\n')[1].split('\n[Script]')[0]),'caf6108402c3b35a4c2f7791d7dd2b872c8948afcef07297876a3a860c64407f','existing Rewrite block stays unchanged from main 03ccc14');
for (const name of ['live_activity_banner','live_shopping','live_debug']) {
  assert(plugin.includes(name+' = switch,false,'),name+' defaults off');
  assert(plugin.includes('${'+name+'}'),name+' is wired to script');
}
const liveRule = plugin.split('\n').find(line => line.startsWith('response if ') && line.includes('Bilibili-LiveClean.v1.0.js'));
assert(liveRule && liveRule.includes('${request.method} == "GET"') && liveRule.includes('${response.status} == 200'));
assert(liveRule.includes('requires_body=true'));
const liveRegexText = liveRule.match(/\$\{url\} ~= (\/.*?\/) &&/)[1];
const liveRegex = new RegExp(liveRegexText.slice(1,-1));
assert(liveRegex.test(url));
for(const suffix of ['getInfoByRoomExtra','getInfoByUser','getDanmuInfo','getRoomPlayInfo']) assert(!liveRegex.test(url.replace('getInfoByRoom',suffix)));
console.log(JSON.stringify({review:'independent synthetic HTTP/JSON and stable-rule checks',runs,deviceTest:false}));
