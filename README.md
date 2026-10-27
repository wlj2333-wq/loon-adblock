# 酷狗音乐 Loon 去广告插件

根据一次酷狗音乐 iOS 抓包制作，抓包中的 `clientver` 为 `20835`。插件由 10 条规则组成，覆盖 15 个已观察到的接口。

## 安装

需要 **Loon 3.5.1 (978) 或更新版本**，使用原生 Rewrite 和 JQ，单个插件文件即可使用。

1. 复制下面的订阅地址，在 Loon 的插件页面添加并启用：

   ```text
   https://raw.githubusercontent.com/wlj2333-wq/loon-adblock/main/KuGou-AdBlock.plugin
   ```

2. 在 Loon 中启用复写和 MitM，并安装、信任自己的 Loon MitM 证书。插件已列出需要解密的四个域名。
3. 完全退出酷狗音乐，再重新打开。已有缓存广告可能需要等待缓存过期；如果 App 提供广告或图片缓存清理，可先清理缓存。
4. 插件设置中默认开启「开屏广告」「横幅和推广」「广告上报」。可按需开启「促销弹窗」。

也可以下载 [KuGou-AdBlock.plugin](./KuGou-AdBlock.plugin) 后，通过 Loon 支持的文件导入方式安装。仓库订阅需要该文件可被手机直接访问。

## 处理内容

| 开关 | 接口范围 | 处理方式 |
| --- | --- | --- |
| 开屏广告 | `gateway.kugou.com/ads.gateway/v4/mobile_splash` | 清空 `boot_ads`、`front_ads`、`discard`，保留其他配置 |
| 开屏广告 | `adserviceretry.kglink.cn/v4/mobile_splash_sort` | 清空补发、兜底广告和相关曝光 ID 列表 |
| 横幅和推广 | `adservice/v3/vip_center`、`ads.service/v3/vip_center` | 清空会员页面广告列表 |
| 横幅和推广 | `ads.gateway/v3/mine_link`、`adp/ad/v1/mine_top_banner`、`adp/ad/v1/multi_page_pendant` | 清空我的页面广告和跨页面广告挂件 |
| 横幅和推广 | `ads.gateway/v2/mobile_link` | 清空推广入口列表；可能同时隐藏该接口提供的活动入口 |
| 横幅和推广 | `ads.gateway/v2/task_center_entrance` | 清空任务中心入口横幅 |
| 横幅和推广 | `fx.service.kugou.com/mfx-kugoulive/ad/query_all` | 本地返回空广告列表 |
| 广告上报 | `ads.gateway/v3/stat_expose`、`ads.gateway/v3/stat_click`、`adp/stat/v1/expose` | 本地返回对应结构的成功响应 |
| 促销弹窗（默认关闭） | `aterouter/v2/get_dialog`、`vipdress.kugou.com/v1/dress_sales/get_popup_for_package` | 清空运营弹窗列表或关闭装扮促销弹窗；可能同时隐藏其他运营提示 |

表中未标注域名的路径属于 `gateway.kugou.com`。规则按域名和完整路径匹配，使用查询参数边界，避免扩大到整个业务域名。

广告内容主要在收到响应后清理，保留原有成功状态和其余字段。直播广告与三类上报接口使用 Loon 原生 Mock，在请求发往服务器前直接返回。脚本不会上传日志，也不依赖外部 JavaScript 文件。

## 检查结果与限制

- 本地检查了抓包中的 **755 条请求**；15 个目标接口全部匹配，没有命中其余接口。
- 默认开启的规则命中 40 条抓包请求；可选弹窗规则另匹配 4 条。重复请求计入数量。
- 正则的域名后缀、路径后缀和普通业务 URL 反例检查通过；三种 Mock 响应的根字段、数据类型及成功状态与抓包结构一致。
- 发布文件检查未发现从抓包查询参数中复制的账号标识、Token 或签名。原始 HAR、请求头和响应原文不在仓库内。
- **尚未在 Loon/iPhone 上实测，也未运行 Loon 的原生 JQ 引擎。** 静态检查不等于手机上的完整效果验证。App 更新、缓存、其他广告渠道或无法被 MitM 解密的连接都可能导致广告残留。
- 只处理本次抓包中明确识别的接口。无法解析为 JSON 的广告 SDK 响应未做改写。

如果导入提示版本或语法错误，请先更新 Loon。如果有功能异常，可先关闭「促销弹窗」或「横幅和推广」，再完全退出并重新打开 App；停用整个插件可撤销这些规则。

## 格式参考

插件按 [Loon 插件文档](https://nsloon.app/docs/Plugin/) 和 [Rewrite 文档](https://nsloon.app/docs/Rewrite/rewrite_v2/) 编写。JSON 响应处理使用原生 JQ；Mock 的执行时机与配置方式见 Rewrite 文档。
