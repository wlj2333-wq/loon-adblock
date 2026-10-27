# 酷狗音乐 Loon 去广告 v1.1.0（复写版）

当前订阅使用 Loon 原生 Rewrite，在第一版的基础上补充后续抓包发现的广告域名和接口。

## 安装或更新

```text
https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/KuGou-AdBlock.plugin
```

1. 在 Loon 插件页面更新这个订阅，名称应显示 **酷狗音乐去广告 v1.1.0（复写版）**。
2. 开启 **复写（Rewrite）和 MitM**，安装并信任自己的 Loon MitM 证书。需要 Loon 3.5.1 (978) 或更新版本。
3. 验证时只启用这一份酷狗去广告插件，完全退出酷狗、重新连接 Loon，再打开酷狗测试。

本版不需要单独导入 JS；执行信息在请求详情的复写记录中。看不到脚本执行日志是本版的预期行为。

## 最新抓包证据

用户提供的第三份酷狗 HAR 包含 526 条请求，其中 30 条带有第一版规则的复写记录和响应修改标记。已观察到：

| 接口 | 抓包中的结果 |
| --- | --- |
| `gateway.kugou.com/ads.gateway/v4/mobile_splash` | 已命中复写，`boot_ads`、`front_ads`、`discard` 均为空 |
| `gateway.kugou.com/adp/ad/v1/mine_top_banner` | 已命中复写，广告列表为空 |
| `gateway.kugou.com/adservice/v3/vip_center` | 11 次请求均有复写记录，返回的广告列表为空 |
| `gateway.kugou.com/aterouter/v2/get_dialog` | 已命中用户开启的可选弹窗规则，弹窗列表为空 |
| `ads.service.kugou.com/v4/mobile_splash_sort` | 第一版未覆盖这个补发域名，`least_ads` 仍有 1 条 |
| `gateway.kugou.com/ads.gateway/v3/mobile_down` | 第一版未覆盖，返回 2 条广告 |
| `gateway.kugou.com/ads.gateway/v2/sidebar_link` | 第一版未覆盖，返回 14 条广告 |
| `ad.tencentmusic.com/sdk/ad/strategies` | 第一版未覆盖的新 SDK 域名，响应带加密标记 |

这些记录确认第一版在此次测试中已执行。此前“所有规则没有执行记录”的现象与本次结果已经不同，不能再据旧抓包判断复写未启用。

## v1.1.0 补充内容

- 开屏补发同时覆盖 `adserviceretry.kglink.cn` 和 `ads.service.kugou.com`，处理 `/v4/mobile_splash_sort` 中的补发、兜底及相关列表。
- 补充底部广告 `mobile_down`、侧栏 `sidebar_link`、`sidebar_top_card` 和首页 `home_card` 的广告列表清理。
- 对 `/adp/ad/v1/home_combine` 中已存在的 `data.home_city_rankings.ads` 数组做清理。
- 增加「广告SDK策略」开关：对 `mc.tencentmusic.com`、`ad.tencentmusic.com` 的 `/sdk/ad/strategies` 请求，仅当 User-Agent 以 `kugou/` 开头时在本地返回 503，阻断该广告策略请求。未改写共享主机的其他配置接口。

SDK 广告策略响应是加密数据，因此使用请求拦截。此开关可能影响看广告领奖等依赖广告展示的功能，可单独关闭。

## 插件开关

| 开关 | 默认 | 作用 |
| --- | --- | --- |
| 开屏广告 | 开 | 清理开屏和开屏补发列表 |
| 横幅和推广 | 开 | 清理已覆盖接口中的横幅、推广入口和广告数组 |
| 广告上报 | 开 | 本地返回曝光、点击接口的空成功响应 |
| 广告SDK策略 | 开 | 拦截酷狗客户端的统一广告策略请求 |
| 促销弹窗 | 关 | 可选清理运营弹窗与装扮促销弹窗，可能同时隐藏其他运营提示 |

## 如何验证

- 在复写记录中确认对应请求命中本插件；开屏主接口和补发接口不一定出现在脚本记录列表里。
- 开屏主接口的 `data.boot_ads`、`data.front_ads` 应为空。
- 两个开屏补发域名的 `data.least_ads`、`data.retry_ads` 应为空。
- 启用 SDK 开关后，符合酷狗 User-Agent 条件的广告策略请求应在本地返回 503，这是该条拦截规则的预期结果。
- 缓存广告仍可能显示，需完全退出酷狗后重试，或使用酷狗提供的相关缓存清理功能。

## 验证范围

本地扫描了三份 HAR，共 **1,805 条请求**，检查正则编译、域名及路径边界、规则重叠、原有 JQ 表达式保留、内联 JSON、SDK User-Agent 条件及发布内容凭据扫描，均通过。累计识别并覆盖 8 个第一版未覆盖的域名与路径组合。

第一版原有规则已有本次手机抓包的执行证据；**本版新增规则仍需更新后在手机上验证**。本地未运行 Loon 的原生 JQ 引擎，也没有把静态匹配检查当作手机实测。广告 SDK 的缓存、额外渠道和 App 后续更新可能导致广告残留。

## 文档

- [Loon Rewrite](https://nsloon.app/docs/Rewrite/rewrite_v2/)
- [Loon 插件](https://nsloon.app/docs/Plugin/)
- [Loon MitM](https://nsloon.app/docs/MitM/)
