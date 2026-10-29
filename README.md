# Loon 去广告插件

推荐通用域名拦截：[通用广告平台屏蔽 v1.0.0](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/General-AdBlock.plugin)，收录 **27 组平台、100 条规则**，已包含 TANX。完整平台与来源见 [平台目录](General-AdBlock-Platforms.md)。无需 JS 或 MitM，可与下方 B 站、酷狗专用插件一起启用。

- [哔哩哔哩 v1.3.0（复写＋播放页脚本）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Bilibili-AdBlock-v1.2-Rewrite.plugin)
- [TANX 广告域名屏蔽 v1.0.0](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Tanx-AdBlock.plugin)
- [酷狗音乐 v1.1.0（复写版）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/KuGou-AdBlock.plugin)

哔哩哔哩沿用原订阅路径，文件名中的 v1.2 是历史名称；导入后插件名称应显示 v1.3.0。首页与开屏仍使用原生复写，只为播放页新增二进制辅助脚本。酷狗文件保持原样。

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

## 最新抓包与验证证据

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

首页与开屏查看「复写记录」，匹配响应头标记为 `X-Bilibili-AdBlock: 1.3.0-hybrid`。该 Header 只确认相应 Action 执行，仍应结合返回数据判断清理效果。

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
