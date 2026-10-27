# 哔哩哔哩与雷神加速器去广告

## 安装与更新

在 Loon 插件页面分别添加需要的链接，可与本仓库酷狗插件同时使用：

- [哔哩哔哩 v1.1.0（脚本版）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Bilibili-AdBlock.plugin)
- [雷神加速器 v1.0.0（原生复写）](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/Leigod-AdBlock.plugin)

哔哩哔哩需要开启 **脚本（Script）和 MitM**；雷神与酷狗需要开启 **复写（Rewrite）和 MitM**。安装并信任自己的 Loon MitM 证书。插件会自动加载需要的 JS，不必另建 JS 订阅。更新后确认名称与版本；完全退出对应 App 后重新打开测试。测试时同一 App 只保留一份处理相同广告响应的插件。

## 哔哩哔哩 v1.1.0

根据两份 iOS 抓包定位并处理：

- `/x/v2/splash/list` 与 `/show`：清空已有的 `list`、`show`、`keep_ids` 数组。
- `/x/v2/splash/brand/list`：清空品牌画面与预加载，关闭已存在的强制展示参数；也会隐藏品牌启动画面。
- `/x/v2/splash/event/list2`：清空活动启动列表，保留账号等其他字段。
- `/x/v2/feed/index` 与 `/story`：移除整块顶部轮播、广告卡片和会员购推广卡片；保留普通视频、直播及页面配置。
- `/x/v2/feed/index/story/cart`：清空独立广告列表。

顶部轮播包含普通活动推荐和商业广告；本插件按需求移除整块轮播。会员购推广在抓包中属于 `cm_v2` 广告卡片；此外也识别卡片自身明确指向会员购的导航字段。不会按普通视频的标题或简介关键词过滤，也没有屏蔽会员购或游戏落地页域名。

### 本次发现

最新 HAR 含 430 条请求。截图中的“我的世界联名交通卡”和另一张会员购推广卡片均位于首页广告卡片中，“异世界冒险！点击抽 iPhone 18 Pro”位于顶部轮播。对应首页响应有 11 张卡片。

这些首页和开屏请求在该 HAR 中均没有旧插件的复写执行记录、响应修改标记；旧规则本已覆盖它们。用户确认旧插件已添加并启用，**仅凭 HAR 不能判定未执行的具体原因**，也不能将这些内容一概视为遗漏的新接口。抓包中能看到 Biliverse 的另一条脚本执行记录。

因此本版将哔哩哔哩切换为兼容的 Script 配置，引用独立版本文件 `Bilibili-AdBlock.v1.1.js`，增加可查看的执行日志和响应版本标记。酷狗和雷神插件不在此次调整范围内。

### 如何验证

在 Loon「脚本」记录中查找：

```text
[BilibiliAdBlock 1.1.0] /x/v2/feed/index feed removed=3 banners=1 ad-cards=2 mall-cards=0 kept=8 changed=true
```

这行是针对此次 HAR 的本地回放结果示例；手机新请求的数量会变化。两张会员购卡片在此例中计入 `ad-cards`。有实际修改时，响应头包含 `X-Bilibili-AdBlock: 1.1.0`；没有广告而无需修改时不添加该头。日志只含路径及计数，不打印查询参数、令牌或账号数据。

开屏日志中的 `array-items-removed` 统计被清空的数组项，包含广告、展示计划及缓存 ID，不能直接理解为独立广告数量。`skip` 日志表示响应状态、JSON 或结构不符合处理条件。

### 验证范围

使用 Node VM 执行发布的实际 JS，对两份 HAR 共 **837 条请求**检查匹配并回放全部 13 个匹配响应；11 个响应发生修改。最新首页响应由 11 张变为 8 张，整块轮播及两张推广卡片被删除，保留卡片与原数据逐项相同，其他页面配置保留。

另检查了错误状态、无效 JSON、异常结构、单次完成回调、普通内容保留、域名和路径边界、脱敏日志及响应头处理。**本地回放通过，手机效果尚待更新后验证。** 没有处理 gRPC/Protobuf 广告；缓存也可能使旧广告继续显示。

## 雷神加速器 v1.0.0

本次原始抓包中的雷神版本为 iOS 2.6.1：

- 清空 `opapi.xxghh.biz/nn-assist/banner/list` 与 `banner/multiType/list` 的横幅和促销列表。
- 在独立的 `leigod_app_openadv` 字典及启动聚合配置中，仅将 `tobid` 的字符串值从 `1` 改为 `0`，其他业务配置保留。
- 「横幅和促销位」「尝试关闭开屏」默认开启，可单独关闭。

**雷神开屏规则仍属于待验证推断**：字段名和取值提示它可能控制 ToBid 初始化，官方隐私政策也列有 ToBid 广告 SDK，但尚无 App 对 `0` 的处理逻辑证据或完整开屏广告链。不能保证雷神开屏已去除。

雷神原生规则已完成原始 407 条请求的 URL、边界、重叠、响应结构和凭据静态检查，3 条规则覆盖 11 个请求；没有本地运行 Loon 原生 JQ。横幅清理会隐藏相关优惠入口。账号、实名、订单、加速节点、通知和升级接口未加入清理。

原始抓包中还有 HuaweiWear 登录请求，但缺少广告接口证据，未添加华为运动健康规则。本仓库不包含原始 HAR 或私人账户数据。

## 参考

- [Loon Script 与响应修改 API](https://nsloon.app/docs/Script/)
- [Loon 原生 Rewrite 文档](https://nsloon.app/docs/Rewrite/rewrite_v2/)
- [雷神官方隐私政策](https://www.xxghh.biz/m/app/policy/privacy)

