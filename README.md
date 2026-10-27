# 酷狗音乐 Loon 去广告 v2.0.0

根据两次酷狗音乐 iOS 抓包修订，抓包客户端参数为 `20835`。本版采用传统 `[Script]` 配置和 JavaScript，替换上一版原生 Rewrite/JQ 实现。

## 安装或更新

在 Loon 插件页面更新原有订阅，或添加以下地址：

```text
https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/KuGou-AdBlock.plugin
```

1. 更新后插件名称应为 **酷狗音乐去广告 v2.0.0**。如果名称仍是旧版，可移除旧条目后重新添加同一 URL。
2. 启用 Loon 的脚本功能和 MitM，并安装、信任自己的 Loon MitM 证书。确认脚本资源 `KuGou-AdBlock.v2.js` 已下载成功。
3. 你此前的配置同时启用了 `KuGou_remove_ads.lpx`。验证本版时先停用另一份酷狗去广告插件，便于识别规则执行情况。
4. 完全退出酷狗，停止并重新启动 Loon，再打开酷狗测试启动和切回场景。

日常过滤不需要持续开启抓包。若已有缓存广告，可能需要等待缓存过期或通过酷狗提供的缓存清理功能清理相关缓存。

插件引用同一仓库中的 [KuGou-AdBlock.v2.js](./KuGou-AdBlock.v2.js)，需要手机能够下载该脚本。采用 Loon 官方文档列出的传统 `http-request` / `http-response` 格式，不使用上一版的 `[Argument]` 与 JQ。

## 本次抓包发现了什么

第二次抓包共 524 条请求；47 条请求的 URL 能匹配上一版配置中的规则，但这些记录的复写、脚本列表均为空，响应修改标记均为 false。开屏响应保留了 4 条 `boot_ads` 和 4 条 `front_ads`，补发接口也保留了 `least_ads`。

用户已确认使用 Loon **3.5.2 (1005)**，复写及脚本总开关开启，因此不能简单归因为版本太旧或未开总开关。HAR 无法单独判定上一版规则未执行的具体加载或解析原因。

本版改为脚本实现、移除参数绑定和 JQ 依赖，并提供可识别的执行记录。还补充了第二次抓包中新出现的侧栏、底部和首页广告接口。

## 处理范围

| 类别 | 已观察到的接口 | 处理方式 |
| --- | --- | --- |
| 冷启动与切回开屏 | `ads.gateway/v4/mobile_splash` | 清空 `boot_ads`、`front_ads`、`discard` |
| 开屏补发、兜底 | `adserviceretry.kglink.cn/v4/mobile_splash_sort` | 清空广告、补发、兜底和相关曝光列表 |
| 会员页横幅 | `adservice/v3/vip_center`、`ads.service/v3/vip_center` | 清空广告列表 |
| 我的页面、底部、侧栏、首页 | `ads.gateway/v3/mine_link`、`ads.gateway/v3/mobile_down`、`ads.gateway/v2/sidebar_link`、`ads.gateway/v2/sidebar_top_card`、`ads.gateway/v2/home_card` | 清空响应中已有的 `ads` 数组；未知结构保持原样 |
| 推广入口、任务横幅 | `ads.gateway/v2/mobile_link`、`ads.gateway/v2/task_center_entrance` | 清空推广列表和广告数组 |
| 挂件与组合广告 | `adp/ad/v1/mine_top_banner`、`adp/ad/v1/multi_page_pendant`、`adp/ad/v1/home_combine` | 清空已有的顶层或嵌套 `ads` 数组 |
| 直播广告 | `fx.service.kugou.com/mfx-kugoulive/ad/query_all` | 请求阶段返回空列表及成功状态 |
| 广告曝光、点击 | `ads.gateway/v3/stat_expose`、`ads.gateway/v3/stat_click`、`adp/stat/v1/expose` | 请求阶段返回对应结构的空成功响应 |
| 统一广告 SDK | `mc.tencentmusic.com/sdk/ad/strategies` | 仅在 User-Agent 以 `kugou/` 开头时中断广告策略请求 |

未标注域名的接口位于 `gateway.kugou.com`。广告配置和其余响应字段会保留；请求 URI 按域名及完整路径边界匹配。

SDK 广告策略响应带加密标记，因此本版按请求来源与路径阻断，不尝试生成不符合其加密协议的假数据。共享 SDK 主机上其他 App 的请求会放行。需要展示广告的奖励功能可能随广告请求一起不可用。

### 可选运营弹窗

`酷狗v2可选运营弹窗` 这条脚本默认关闭。需要时可在 Loon 中启用它，清理 `aterouter/v2/get_dialog` 的弹窗列表与装扮促销弹窗。由于这些接口可能承载运营提示，启用后可能同时隐藏这些提示。

## 如何确认本版确实执行

- 脚本日志前缀：`[KuGouAdBlock 2.0.0]`。日志包含接口路径、清理数量或跳过原因。
- 已处理的广告响应或本地空成功响应带有：`X-KuGou-AdBlock: 2.0.0`。
- 开屏接口执行后，`data.boot_ads`、`data.front_ads` 应为空；开屏补发接口的 `data.least_ads` 应为空。
- 若广告仍在且没有脚本记录，先核实插件名称、脚本资源下载和所选配置。若脚本记录显示 `skip non-json` 或 `skip unexpected-schema`，可据对应接口继续调整。

日志不会记录 URL 查询参数、Token、请求头或响应原文；脚本不调用网络或持久化存储 API。

## 本地验证

使用 Node.js 隔离运行脚本，并模拟 Loon 的请求、响应与 `$done()` API，回放两份 HAR。回放不是手机实测。

| 抓包 | 扫描请求 | 本地空响应 | 酷狗 SDK 阻断 | 广告响应检查 | 实际改写响应 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 第一份 | 755 | 25 | 1 | 15 | 11 |
| 第二份 | 524 | 26 | 3 | 21 | 13 |

检查包括：已报告的开屏与补发清空、侧栏和底部广告清空、原状态及配置字段保留、嵌套广告的邻接字段保留、错误或未知结构放行、其他 App 的 SDK 请求放行、URL 边界、日志脱敏、单次完成回调和发布内容凭据扫描。检查通过。

**仍需在用户手机上验证。** 本地回放没有模拟 Loon 自身的脚本加载、证书处理和缓存。App 更新、缓存及其他广告渠道仍可能导致广告残留。

## 文档

- [Loon 传统 Script 配置](https://nsloon.app/docs/Script/)
- [Loon Script API](https://nsloon.app/docs/Script/script_api/)
- [Loon 插件文档](https://nsloon.app/docs/Plugin/)
