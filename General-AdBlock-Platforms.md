# 通用广告平台屏蔽 v1.0.0

收录 27 组国内/出海与海外广告平台、100 条手工筛选的域名规则。这里的“平台组”按广告产品和投放网络分组，不等同于 27 家独立公司，也不是按市场份额排名。首版优先选择能核对用途的广告域名，不能理解为全平台、全渠道广告无遗漏。

## 安装

[导入 General-AdBlock.plugin](https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/General-AdBlock.plugin)

在 Loon「插件」添加上述链接并启用，使用自动分流/规则模式。此插件只有 `[Rule]`，无需 JS、复写总开关或 MitM 证书。只对经过 Loon 且能匹配目标域名的连接生效；已绕过 Loon 的流量不受它控制。

已包含此前 TANX 插件的 `DOMAIN-SUFFIX,tanx.com,REJECT`，可停用单独的 TANX 插件。可与本仓库 B 站及酷狗专用插件同时使用：通用版负责广告平台域名，专用版继续处理混在正常业务响应中的广告数据。

## 平台对照

| 分类 | 平台/产品组 | 规则数 | 代表域名 | 原始规则证据 |
| --- | --- | ---: | --- | --- |
| 国内/出海 | 阿里妈妈 TANX | 1 | `tanx.com` | [来源](https://tanx.com/) |
| 国内/出海 | 腾讯广告／优量汇 | 4 | `gdt.qq.com`、`gdtimg.com`、`ugdtimg.com` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/tencent#L131) |
| 国内/出海 | 穿山甲／Pangle | 16 | `pangolin-sdk-toutiao.com`、`pangolin-sdk-toutiao-b.com`、`pangolin-sdk-toutiao1.com` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/bytedance#L411) |
| 国内/出海 | 百度联盟／百青藤 | 9 | `mobads.baidu.com`、`mobads-logs.baidu.com`、`cpro.baidu.com` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/baidu#L121) |
| 国内/出海 | 快手广告／磁力引擎 | 7 | `adkwai.com`、`adukwai.com`、`adbkwai.com` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/kuaishou#L31) |
| 国内/出海 | Mintegral | 1 | `mintegral.com` | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L471) |
| 国内/出海 | Sigmob | 2 | `sigmob.com`、`sigmob.cn` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/category-ads-all#L34) |
| 国内/出海 | 倍孜／AdScope | 1 | `beizi.biz` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/category-ads#L138) |
| 海外 | Google Ads／AdMob／DoubleClick | 16 | `doubleclick.net`、`doubleclick.cn`、`doubleclick.com` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/google#L564) |
| 海外 | AppLovin | 2 | `applovin.com`、`applvn.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/category-ads#L145) |
| 海外 | Unity Ads | 2 | `unityads.unity3d.com`、`iads.unity3d.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/unity#L13) |
| 海外 | ironSource／LevelPlay | 3 | `supersonicads.com`、`ssacdn.com`、`supersonicads-a.akamaihd.net` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/supersonic#L3) |
| 海外 | Liftoff Monetize／Vungle | 1 | `vungle.com` | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L1046) |
| 海外 | InMobi | 5 | `ads.inmobi.com`、`appgw.inmobi.com`、`config.inmobi.com` 等 | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L917) |
| 海外 | Chartboost | 2 | `chartboost.com`、`chartboosts.com` | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L867) |
| 海外 | AdColony／Fyber 广告网络 | 4 | `adcolony.com`、`fyber.com`、`inner-active.com` 等 | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L763) |
| 海外 | Amazon Ads | 2 | `amazon-adsystem.com`、`serving-sys.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/amazon#L139) |
| 海外 | Meta 广告域名（有限覆盖） | 1 | `facebookads.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/facebook#L401) |
| 海外 | Microsoft 广告域名（有限覆盖） | 2 | `microsoftads.com`、`msads.net` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/microsoft#L319) |
| 海外 | Xandr／AppNexus | 1 | `adnxs.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/category-ads-all#L22) |
| 海外 | Criteo | 2 | `criteo.com`、`criteo.net` | [来源](https://github.com/AdguardTeam/AdguardFilters/blob/e224dbe933b8bf91e90970e53d04e7068ab153f3/MobileFilter/sections/adservers.txt#L98) |
| 海外 | PubMatic | 2 | `pubmatic.com`、`pubmatic.co.jp` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/pubmatic#L3) |
| 海外 | OpenX | 5 | `openx.net`、`openxadexchange.com`、`openxcdn.net` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/openx#L1) |
| 海外 | Index Exchange／Casale | 1 | `casalemedia.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/category-ads-all#L25) |
| 海外 | Taboola | 1 | `taboola.com` | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/taboola#L4) |
| 海外 | The Trade Desk | 1 | `adsrvr.org` | [来源](https://www.thetradedesk.com/assets/general/Unified-ID-Adoption-Guidelines-for-DMPs-v1.0.pdf) |
| 海外 | Yandex Ads／AdFox | 6 | `adfox.ru`、`adfox.yandex.ru`、`an.yandex.ru` 等 | [来源](https://github.com/v2fly/domain-list-community/blob/333d8a1810d04600bcb00870155a369954ed37f5/data/yandex#L120) |

完整的 100 条域名、精确/后缀匹配类型及逐条来源见 [general-adblock-domains.json](general-adblock-domains.json)。每个平台对应的实际规则也在插件中以注释分组。

## 范围选择

- 独立广告域名使用 `DOMAIN-SUFFIX`，同时匹配该域及全部子域；共享平台上的特定主机优先使用 `DOMAIN`。
- 没有整域屏蔽 `qq.com`、`baidu.com`、`google.com`、`facebook.com`、`microsoft.com`、`taobao.com` 等业务主域。
- 没有整域屏蔽 `alicdn.com`、`gtimg.cn`、`bdstatic.com`、`pstatp.com`、`snssdk.com`、`byteoversea.com`、`amazonaws.com`、`akamaihd.net`、`unity3d.com` 等共享资源域。
- 没有整包导入统计/崩溃/推送域名；未纳入 Bugly、Sentry、Firebase 推送、Google Analytics、AppMetrica 等一般统计或开发基础服务。
- Meta 和 Microsoft 在本版中明确属于有限域名覆盖。Facebook、Instagram、YouTube 等与正常内容同域或同接口下发的广告，不能靠这份域名插件保证清除。
- 广告厂商自有整域也可能提供官网和开发者后台；拦截 Mintegral、AppLovin、Taboola 等整域时，这些页面也可能无法访问。

具体平台备注：

- **Mintegral**：整域也包含其官网和开发者平台；未扩展到 Mobvista 其他业务域名。
- **Google Ads／AdMob／DoubleClick**：不屏蔽 google.com、googleapis.com、gstatic.com 整域；广告跳转链接可能受影响。
- **AppLovin**：applovin.com 整域也包含平台官网。
- **Unity Ads**：不屏蔽 unity.com、unity3d.com 整域及其开发工具、非广告云服务。
- **InMobi**：不屏蔽 inmobi.com 整域、Glance 和 inmobicdn.net 共享内容域。
- **Amazon Ads**：不屏蔽 amazon.com 和 AWS 共享域名。
- **Meta 广告域名（有限覆盖）**：仅收录确认的独立广告域；不屏蔽 Facebook／Instagram 主站，不能靠本条清除其全部信息流广告。
- **Microsoft 广告域名（有限覆盖）**：不屏蔽 Bing、Microsoft 主站及登录域名；不保证清除其主站信息流广告。
- **Taboola**：其官网和投放共用域名，整域规则也会阻止访问 Taboola 官网。
- **Yandex Ads／AdFox**：不屏蔽 yandex.ru 整域，也未纳入 AppMetrica、Metrika 等通用统计服务。

域名拦截可能影响看广告领奖、广告补贴入口和广告跳转链接；也可能仅隐藏图片而留下占位。广告缓存、服务端插入的视频广告以及尚未收录的新域名仍可能显示。没有把“加入黑名单”描述为“手机上所有广告已消失”。

## 规则优先级与排查

Loon 主配置中更高优先级的放行规则可能先于插件规则命中，尤其是提前出现的 `GEOIP`、`DOMAIN-SUFFIX` 或其他宽泛直连规则。若广告请求仍被放行，请在请求记录中查看实际命中的规则；仅启用插件不能证明每一条请求都已被拦截。

如出现业务异常，可以先停用此通用插件确认关联，再提供被拒绝的域名和 App 功能，针对该域名收窄规则。插件按平台分组，方便检查和调整。不要为解决单个误拦而放行整个共享 CDN 或业务主域。

## 来源与更新方式

本版将规则写在插件本体中，不额外加载未经筛选的远程大黑名单。核对来源包括：

- v2fly/domain-list-community：固定快照 `333d8a1810d04600bcb00870155a369954ed37f5`。仅从相关平台文件及广告分类中选取清单需要的域名，没有引入整包广告/统计分类。
- AdguardTeam/AdguardFilters：固定快照 `e224dbe933b8bf91e90970e53d04e7068ab153f3`，主要用其移动广告原始规则核对独立广告域名；没有机械转换路径、通配符或第三方条件规则。
- [TANX 官方平台](https://tanx.com/)与[官方 SDK 隐私政策](https://terms.alicdn.com/legal-agreement/terms/suit_bu1_ali_mama_division/suit_bu1_ali_mama_division202202171548_47251.html)。
- [Google 广告产品域名说明](https://business.safety.google/adscookies/)。
- [The Trade Desk 自有 adsrvr.org 域名说明](https://www.thetradedesk.com/assets/general/Unified-ID-Adoption-Guidelines-for-DMPs-v1.0.pdf)。
- [Loon 域名规则语法](https://nsloon.app/docs/Rule/domain_rule/)与[插件格式](https://nsloon.app/docs/Plugin/)。

收录的证据是原始规则和官方说明，不是每个域名在每款 App 中的展示行为实测。平台归属按广告网络名称整理，部分收购后品牌或聚合平台合并在一个组中；域名所有权也可能在未来变化，后续应随证据维护。

## 验证

发布前已检查 100 条规则格式、域名边界、重复与包含关系、41 个选定业务主机保护及全部逐条来源。规则由 75 条后缀匹配和 25 条精确匹配组成，未发现重复或互相包含。

另扫描已有 9 份 HAR，共 3,670 条请求，其中 2 条命中 TANX 域名规则；其他平台的此次覆盖依据为维护清单及官方资料，不能据这批抓包声称其他平台均已实际拦截验证。没有重放广告点击或监测请求，也没有上传 HAR、账号、令牌或私人配置。手机拦截和兼容性仍需用户环境验证。

[来源与许可说明](THIRD-PARTY-NOTICES-General-AdBlock.md)。本次新增的通用插件、平台说明和域名清单采用 GPL-3.0-only；不改变仓库中既有插件的许可说明。
