# Poketto · 口袋工具箱

收藏小型交互式可视化工具的静态网站，部署在 Cloudflare Workers（见 `wrangler.jsonc`、`worker.js`）。每个工具是 `tools/` 下一个独立 HTML。完整说明在 `README.md`，这里只写做事时要知道的东西。

## 怎么协作

- 用中文，简洁直接，少用表情。不要说教，不要反复提醒健康或现实问题。
- 她想要方案时直接给方案；不确定她是想聊聊还是要方案时，先问一句。
- 能验证的先验证再说"好了"。验证不了的（真机帧率、手机、中文字体）要明说。
- 她允许直接推送到 `main`，推完告诉她提交号。大改动前先说一下打算怎么做。沙盒里直接推 `main` 会被拦：实际做法是新建分支、推送、开 PR、再合并（squash），不要把提交、推送、开 PR 和合并连成一条命令；每次推送前先等她说「推送」。
- 合并后 Cloudflare 的 Workers Builds 会自动部署，通常要一两分钟；线上还是旧版时先查构建状态，再让她强制刷新。

## 目录

```
index.html      首页，读取 tools.json
tools.json      工具清单：title / subject / description / url
tools/          每个工具一个 HTML，自包含
assets/         poketto.css、poketto.js 共享样式；planets/ 贴图；极光参考图.png
worker.js       静态资源 + 时间线 KV 接口
```

## 新增或修改工具

- 先看 `README.md` 的「工具页面设计约定」，并对照 `tools/moon-phases.html` 的结构：`pk-page`、`pk-bar`、`pk-head`、`pk-foot`，面板用 `pk-br`，滑杆 `pk-range`，按钮 `pk-chip`。
- 工具自己的 CSS 只管布局和专属可视化，字体、颜色、基础控件沿用共享样式。
- 新工具要加进 `tools.json`，并在 README「已收录」里加一条。
- 不要把口令或密钥写进仓库。时间线的写入密钥是 Worker Secret `EDIT_PASS`。

## 极光工具（`tools/aurora.html`，Tool No.07）

当前状态和待办写在 `README.md` 的「极光：说明与待办」，改之前先读那一节。要点：

- 第一部分是 WebGL2 片元着色器：光幕是 3 张薄片，沿视线分层累加亮度。树是另一张 2D canvas，用与天空相同的相机参数投影。
- 第二部分是磁场剖面和高度剖面。粒子能量滑条在两部分之间共用 `Energy` 状态。
- 「照片色」的颜色取自 `assets/极光参考图.png`，改色前用 PIL 取样，不要目测。
- **下一步**：加强粉紫核心和向上升起的竖直光柱（参考图中间那团饱和的粉紫），然后调青白弧带的色调。

## 艺术版（`tools/aurora-art.html`）

独立展示作品，用于申请和展示，不在 `tools.json`，不依赖共享样式。说明与状态写在 `README.md` 的「艺术版」一节，改之前先读。要点：

- 标题和文案由她定：「在地球另一端，和极光共振 / Resonating with the aurora, from the other end of the Earth」，开场句「动一动，它就会回应你。」，结尾句「共振停了。想象需要被一直维系。」。「共振」是文学用法，不是物理含义；不要把它做成频率匹配。
- 气质要求：浪漫、朦胧、温柔。拍手式的瞬时触发、突然变亮都被否决过。所有响应用缓慢的包络（升约 1 到 3 秒，降约 3 到 5 秒）。
- 输入：指针、点击、按住、音乐（标签页音频）。麦克风已删除，原因见 README「已放弃」。
- 音乐署名（CC BY 3.0）要求见 README；仓库里不放音频文件。
- 着色器是从 `tools/aurora.html` 复制后改的，两者不会自动同步；改科普版的着色器不会影响艺术版。

## 验证

没有浏览器时，用 Playwright 把 `tools/aurora.html`、`assets/poketto.css`、`assets/poketto.js` 通过路由喂给无头浏览器渲染并截图：

- 软件渲染下着色器很慢，等 8 到 9 秒再截图。
- 外部字体请求会被拦掉，控制台出现一条 `Failed to load resource` 是正常的。
- 沙盒里没有中文字体，截图里的中文是方块，不代表真实显示。
- GLSL 变量名不能以 `gl_` 开头。
- 本地打开 WebGL 页面请用静态服务器，不要双击文件。

### 用 Playwright MCP 验证艺术版

- 工具环境里没有 `require`、`process`，也不能访问 `file:` 和沙盒的本地端口。做法：用 Python 把页面 HTML 以 JSON 字符串嵌进一个 `.js` 代码文件，放到截图目录，再用 `browser_run_code_unsafe` 的 `filename` 参数运行，里面用 `page.route` 把一个假域名的请求回给 HTML。
- 每次运行都会把整个代码回显，很占上下文，所以一次运行里把多张截图和多项检查做完。
- 截图写到 `/projects/sandbox/.kiro/artifacts/screenshots/`，用 `read_file` 看。
- 软件渲染很慢，等 7 到 8 秒再截图；`?test` 下时钟冻结，画面稳定。
- 并行发出的命令可能抢跑（比如 PR 在分支推送完成前创建），有先后依赖的步骤不要并行。
