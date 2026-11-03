# Bilibili 直播净化来源与边界

核对日期：2026-11-04（北京时间）。实施基线：`wlj2333-wq/loon-adblock@03ccc1408a3254419e0421813e41b3aac89def5e`，插件 v1.3.2，播放页脚本 v1.3.0。

## 公开字段先例

| 字段及接口 | 可核对来源 | 证据能说明什么 |
| --- | --- | --- |
| GET `api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom` 的 `data.activity_banner_info` | [blackmatrix7 历史脚本固定版本](https://github.com/blackmatrix7/ios_rule_script/blob/593a8466ae434b4d5d969cf758e5050aabc10677/script/archive/bilibili/bilibili_plus.js)，搜索“直播去广告” | 旧脚本曾在该接口将活动横幅信息设为 null；文件位于 archive，不是当前手机仍有效的证据 |
| 同一 app-room/v1 房间信息接口的 `data.shopping_info.is_show` | [yaoyaole0112 公开规则固定版本](https://github.com/yaoyaole0112/surge/blob/72313cba3f509266317779c75207a1263d64976a/sgmodule/Ads/%E5%B9%BF%E5%91%8A%E6%8B%A6%E6%88%AA%E5%87%80%E5%8C%96%E5%90%88%E9%9B%86.sgmodule)，搜索 `shopping_info` | 发布者的 jq 规则明确覆盖 app-room/v1/getInfoByRoom，并把展示标志设为 0；这是第三方处理先例，不是官方协议或用户当前 HAR |

新实现仅参考以上两个字段及路径，没有复制或执行上游脚本。活动字段只处理对象；购物字段只处理原始整数 1 或布尔 true。数值 1.0、1e0、字符串、数组、未知数字和缺失字段均保留。布尔 true 是保持类型的兼容分支，尚无当前手机展示证据；它与数字 1 一样仅在用户主动开启实验开关时生效。

没有采用来源规则中清空全部 function_card、按 biz_id 删除未知组件、修改用户权限／会员状态或匹配其他接口的部分，也没有把公开规则里的更广匹配范围迁入本插件。

## Loon 配置依据

- [官方 Plugin 文档](https://nsloon.app/docs/Plugin/)：`[Argument]` 的 `switch,false` 默认值，以及插件参数传给 Script 的形式。
- [官方 Script 新语法](https://nsloon.app/docs/Script/script_v2/)：request/response 条件、对象参数、requires_body。新条目使用现有最低 Build 988 已覆盖的 983+ 语法。
- [官方 Script API](https://nsloon.app/docs/Script/script_api/)：读取请求／响应、以 `$done({})` 保持原响应、修改响应正文。脚本没有依赖浏览器 DOM 或第三方环境。

原生 jq 能表达简单清理，但这里要求不改变任何无关数字字面量，也没有当前 Loon 内核下 jq 长整数保真的实测。因此使用独立、无依赖的 JSON 文本定位器；完整语法校验和重复键拒绝先于区间编辑。它不递归搜索广告、不按字段名泛化删除，只精确编辑根对象 data 下的两个已登记路径。

## 验证分层与待核对内容

本地验证只说明合成响应的文本修改、边界和异常处理符合设计；不是网络回放，也不是在 Loon 内核运行。没有用户当前 B 站版本、直播 HAR 或当前真机界面结果。

手机待核对：当前版本是否请求该白名单接口；字段是否仍存在且类型相符；置空／关闭展示标志是否改变界面；登录与未登录、横竖屏、全屏和切房是否正常；普通弹幕、弹幕发送、关注和画质切换是否可用；以及是否与其他匹配相同接口的插件冲突。

原生礼物按钮、排行榜、PK 组件、实时消息和布局调整不在首版范围。两个实验开关默认关闭，用户更新插件不会自动开始修改直播响应。若接口或字段已经变化，先核对脱敏证据，再决定是否扩大覆盖。
