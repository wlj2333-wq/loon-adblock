# Loon 去广告插件

推荐通用域名拦截：[通用广告平台屏蔽 v1.0.0](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/General-AdBlock.plugin)，收录 **27 组平台、100 条规则**，已包含 TANX。完整平台与来源见 [平台目录](General-AdBlock-Platforms.md)。无需 JS 或 MitM，可与下方 B 站、酷狗专用插件一起启用。

- [哔哩哔哩 v1.3.2（复写＋播放页脚本）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Bilibili-AdBlock-v1.2-Rewrite.plugin)
- [TANX 广告域名屏蔽 v1.0.0](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Tanx-AdBlock.plugin)
- [酷狗音乐 v1.1.0（复写版）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/KuGou-AdBlock.plugin)

哔哩哔哩沿用原订阅路径，文件名中的 v1.2 是历史名称；导入后插件名称应显示 v1.3.2。首页与开屏仍使用原生复写；开屏 `list/show` 返回本地成功空响应，另补拦已确认的单条开屏视频下载，只为播放页加载二进制辅助脚本。酷狗文件保持原样。

## 开屏补充：v1.3.2

2026-10-30 用户反馈京东开屏广告。本次 48 条请求中，唯一的 `/x/v2/splash/list` 已在 11:12:04.050 发起、约 7 ms 后完成本地响应，带有 `X-Bilibili-AdBlock: 1.3.1-local-splash`，`max_time=0`，`keep_ids/list/show` 均为空。说明 v1.3.1 的 Mock 已执行；空响应及 `max_time=0` 在这次启动中仍未阻止广告展示，不能当作客户端关闭开屏的保证。

同一素材的展示上报时间约为 11:12:04.205，视频实际播放上报约 2.8 秒。素材 ID 已出现在请求的 `loaded_creative_list` 中，且本次没有该视频的下载请求；另有缓存监测上报。上述证据支持已加载或缓存素材继续播放的判断，但没有捕获最初下载过程，也不能排除未捕获的网络来源。上报内关联到 `im-x.jd.com/dsp/np` 京东监测地址；监测提交失败后仍有视频播放上报，屏蔽监测不能等同于移除广告。

本次只补拦已确认的视频路径：

```text
https://upos-sz-static.bilivideo.com/ssaxcode/jb/2r/n261028a210b9cll18b0cnj9e3ys2rjb-1-SiteTool_1080.mp4
```

使用原生请求阶段 `reject(403)`，匹配此主机及完整路径的 HTTP/HTTPS GET、HEAD，可带查询参数；新增该主机到 MitM。语法依据 [Loon 官方 Reject 文档](https://nsloon.app/docs/Rewrite/rewrite_v2/#reject)。这是阻止此素材再次联网下载的补充，不会清理 App 内存或磁盘中的已有副本，也不保证拦截更换地址后的广告。未扩大为整个 CDN 或整个 `ssaxcode` 目录的拦截。

更新插件并确认显示 v1.3.2 后，可先使用 B 站应用内的清理缓存功能，再完全退出并重开。该清理功能是否包含开屏素材仍需手机验证，不能承诺一次清理即可消失。若仍出现，保留覆盖本次启动的抓包；如果视频全程没有联网请求，Loon 的 URL 规则无法拦截本地副本的播放。插件不能直接操作 B 站本地缓存。

当前开屏空响应标记更新为 `1.3.2-local-splash`，其他原生复写为 `1.3.2-hybrid`；播放页脚本仍为 v1.3.0。离线验证需区分实际请求和上报内嵌地址：此 HAR 实际命中 1 条开屏 Mock、0 条新增素材拦截；上报关联的视频地址命中新增规则。另以 6 个正例、15 个反例检查网址和方法边界，全部通过；同时核对原有响应规则与播放页脚本引用除版本标记外保持一致。发布文本未包含本次离线提取的 13 项账号、设备或认证值。以上检查不能据此宣称已在手机阻断视频或解决缓存广告。原始 HAR、账号与监测参数不上传仓库。

回退本次补充可使用 [v1.3.1 固定版本](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/331de430002c16d35efc29d6a1a8e042e578a6b2/Bilibili-AdBlock-v1.2-Rewrite.plugin)。

## 开屏更新：v1.3.1（历史）

已在未经复写的响应中核对到此前出现的淘宝广告视频：它由 B 站 `/x/v2/splash/list` 下发，并带有预下载与后台下载开关。两次原始列表分别有 86、87 条素材；监测请求是否被阻断不能代表素材已被移除。

现在仅针对 `/x/v2/splash/list` 和 `/x/v2/splash/show` 的 GET 请求，使用 Loon 原生 `response.body.mock` 在请求发往上游前返回 HTTP 200 和成功空列表，同时将本地响应的 `max_time` 设为 0。该字段的实际客户端效果仍需手机验证。无需增加 JS；品牌、活动、首页和播放页的处理方式保持原样。语法依据 [Loon 官方 Mock 响应文档](https://nsloon.app/docs/Rewrite/rewrite_v2/#mock-响应-body)。

原开屏列表清空规则在该样本的本地结构检查中同样能够清空广告；本次改变用于避免继续获取整份开屏配置，不将“新供应商”“响应过大”或“旧缓存”当作已经证实的漏拦原因。插件不能直接删除 App 缓存，也不保证覆盖未捕获的开屏来源。

更新并重新启用插件后，完全退出并打开 B 站。开屏 `list/show` 的响应头应为 `X-Bilibili-AdBlock: 1.3.1-local-splash`，数据中的 `list`、`show`、`keep_ids` 应为空数组。其他原生复写的标记为 `1.3.1-hybrid`，播放页脚本及其日志版本仍为 `1.3.0`。本次离线扫描三份抓包共 283 条请求，匹配 7 个目标请求；未经修改的两份列表共含 173 条素材、对应展示列表合计 103 项，均被本地空响应替换。验证还检查了请求方法及网址边界，品牌、活动、首页、播放页与普通视频不会命中这条新增 Mock。此处只验证 URL 匹配和本地数据结构，不执行 Loon 内核，也不等同于真机测试。

回退可使用 [v1.3.0 固定版本](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/beb33c2c31fda8fc943521745eada6ccb60f37fc/Bilibili-AdBlock-v1.2-Rewrite.plugin)。原始 HAR、监测参数与账号信息不上传仓库。

## 哔哩哔哩安装

在 Loon「插件」更新或添加上面的哔哩哔哩链接，开启 **复写（Rewrite）、脚本（Script）和 MitM**，安装并信任自己的 MitM 证书。需要 Loon Build 988+，用户当前 3.5.2 (1005) 满足声明的版本要求。插件自动加载 `Bilibili-PlayerAds.v1.3.js`，无需另建 JS 订阅。

完全退出 B 站后重新打开测试；避免同时启用其他处理相同广告响应的插件。此前纯复写版已保存在本地备份，Git 历史保留。

## 处理范围

原生复写继续处理：

- 开屏广告列表、展示计划、品牌及活动启动画面。
- 首页整块顶部轮播、会员购推广和已识别的信息流广告卡片。
- 竖屏流独立广告列表。

辅助 JS 只匹配 `grpc.biliapi.net` 的三个方法：

| 方法 | 处理 |
| --- | --- |
| `bilibili.app.viewunite.v1.View/View` | 删除确认含 B 站广告类型标记的 CM 容器；过滤已知相关推荐模块中的 CM 卡片 |
| `bilibili.app.viewunite.v1.View/RelatesFeed` | 过滤明确带 CM 类型和广告载荷的推荐卡片，保留普通推荐与分页 |
| `bilibili.app.viewunite.v1.View/PlayPause` | 仅在字段 3 含已确认的广告类型标记时，清理捕获样本中的暂停广告、提示内容及启用标志 |

脚本解析 gRPC 帧并用 Loon 内置 gzip API 解压和重新压缩，再按 Protobuf 字段边界清理广告；不对二进制内容做文本替换。不重新编码无关字段，保留未处理的原始字段字节及未知字段。错误状态、截断数据、不支持的压缩或结构会原样放行。

没有匹配视频播放地址接口 `Player/PlayViewUnite`、弹幕接口或整个 gRPC 域名。没有加入额外联网、持久存储或账号日志。该版本不保证覆盖其他业务接口、缓存广告和未来变更的数据结构。

## 播放页版本的历史验证证据

最新 HAR 含 483 条请求，出现 6 条原生复写记录；其中 5 个完整响应记录了 Body 复写。后续开屏、品牌画面、活动列表及首页已出现清理结果；另一次开屏请求中途被客户端关闭，不能当作完成清理的证据。因此原生复写已执行，新增播放页广告属于不同的数据接口。

对发布的实际二进制 JS 使用 Node VM 回放三份 HAR，共扫描 **1,320 条请求**，匹配 10 个响应，其中 6 个发生修改。Node 使用 gzip 接口替身模拟 Loon 工具 API，**不是手机实测**。

最新一份中的处理结果：

- 两个 `View` 响应各删除一个广告容器，其中一个同时删除 1 张广告推荐卡片。
- 两个 `RelatesFeed` 响应各删除 2 张广告卡片；其余三次不含广告的分页响应保持不变。
- 一个 `PlayPause` 响应清理了暂停广告内容和提示。
- 普通推荐卡片、分页、合集、标题、UP 主和其他模块、账号状态及未处理字段均通过原始字节保留检查。
- gzip 和未压缩帧、未知 64 位数值、异常输入、错误状态、网址边界与单次完成回调检查通过。

暂停响应的 1/2/3 字段处理来自本次抓包结构和广告类型标记，仍需手机验证实际展示行为。未把静态检查或本地回放描述为设备实测。

## 如何验证

首页与开屏查看「复写记录」：当前版本 `list/show` 标记为 `X-Bilibili-AdBlock: 1.3.2-local-splash`，其他原生复写为 `1.3.2-hybrid`。新增的单条视频请求拦截应显示上述完整素材路径及本地 403；没有视频网络请求时不会产生该拦截记录。该 Header 只确认相应 Action 执行，仍应结合返回数据判断清理效果。

播放页在「脚本」记录中查看日志：

```text
[BilibiliPlayerAds 1.3.0] View cm-containers=1 ad-cards=1 pause-blocks=0 changed=true
[BilibiliPlayerAds 1.3.0] RelatesFeed cm-containers=0 ad-cards=2 pause-blocks=0 changed=true
[BilibiliPlayerAds 1.3.0] PlayPause cm-containers=0 ad-cards=0 pause-blocks=1 changed=true
```

这些是回放日志示例；计数随新请求变化。实际修改的响应添加 `X-Bilibili-Player-AdBlock: 1.3.0`。无广告时 `changed=false` 为正常结果。若仍有广告，请提供对应方法的脚本日志及覆盖本次展示的抓包。

## 酷狗音乐

酷狗恢复版本为 v1.1.0 原生复写版，开启复写和 MitM。此次没有修改酷狗规则。

## 参考

- [Loon Rewrite](https://nsloon.app/docs/Rewrite/rewrite_v2/)
- [Loon Script API：二进制响应及 gzip](https://nsloon.app/docs/Script/script_api/)
- [社区整理的 View/RelatesFeed Protobuf 定义](https://github.com/bilibili-plugins/bilibili-api-collect/blob/master/grpc_api/bilibili/app/viewunite/v1/viewunite.proto)
- [社区整理的广告卡片和模块定义](https://github.com/bilibili-plugins/bilibili-api-collect/blob/master/grpc_api/bilibili/app/viewunite/common.proto)

社区定义用于字段含义核对；实际字节结构另与用户 HAR 验证。仓库不包含原始 HAR、令牌、账号数据或私人配置。

## TANX 广告提供商域名拦截

在 Loon「插件」添加 [Tanx-AdBlock.plugin](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Tanx-AdBlock.plugin) 并启用，可与本仓库其他插件同时使用。

```ini
[Rule]
DOMAIN-SUFFIX,tanx.com,REJECT
```

规则覆盖 `tanx.com` 和它的全部子域名，包括本次抓包出现的 `ef-dongfeng.tanx.com`，而非只拦截一个监测请求或某个带参数的网址。它会阻断匹配域名的连接，对所有经过 Loon 的 App 生效，不仅是哔哩哔哩；无需 JS、复写总开关或 MitM 证书。使用规则模式，且主配置中若有更高优先级的直连规则，需要避免其提前放行此域名。

[TANX 官网](https://tanx.com/)与[官方 SDK 隐私政策](https://terms.alicdn.com/legal-agreement/terms/suit_bu1_ali_mama_division/suit_bu1_ali_mama_division202202171548_47251.html)确认其广告平台与广告投放、监测用途。[Loon 域名规则文档](https://nsloon.app/docs/Rule/domain_rule/)说明 DOMAIN-SUFFIX 的匹配范围。

本插件不扩大到淘宝、阿里云或其他共享 CDN 域名。通过 B 站自有接口、缓存或其他域名提供的广告不属于这条后缀规则的覆盖范围，不能据此声称该平台的全部广告都已消失。实际展示效果仍需设备验证。

本地核对本次 51 条请求中有 1 条匹配此规则，并检查了域名边界；未重放带监测参数的请求，也未将其参数发布到仓库。
