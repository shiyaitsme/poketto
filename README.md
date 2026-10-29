# Poketto · 口袋工具箱

**Poketto**（ポケット，口袋）是一个收藏小型交互式可视化工具的网站。
不限学科、不限主题：数学、物理、语言、历史、音乐……只要一个小工具能让某个知识点“看得见、摸得着”，就可以放进这个口袋里。

## 理念

- **小**：每个工具只讲清楚一件事，打开就能用。
- **可视化**：用交互和图形代替大段文字。
- **随手积累**：遇到好用的想法，就做成一个小工具收进来。

## 目录结构

```
index.html        首页，列出所有工具
tools/            每个工具一个独立的 HTML 文件
tools.json        工具清单（标题、学科、简介、链接）
assets/           共享设计样式、纸张与笔刷效果、工具脚本
```

## 添加一个新工具

1. 把工具的 HTML 放进 `tools/`，例如 `tools/my-tool.html`。
2. 在 `tools.json` 里加一条记录：

```json
{
  "title": "工具名称",
  "subject": "学科",
  "description": "一句话说明它能做什么",
  "url": "tools/my-tool.html"
}
```

首页会自动读取 `tools.json` 并显示新工具。

## 工具页面设计约定

新增或修改工具时，先对照已有工具，并复用 `assets/poketto.css` 和 `assets/poketto.js`。工具自己的 CSS 只负责布局和专属可视化，字体、颜色和基础控件沿用共享样式。

- 页面使用 `pk-page`、`pk-bar`、`pk-head` 和 `pk-foot`，保持统一的导航、标题星形装饰和返回首页入口。
- 卡片和面板使用 `pk-br` 四角括号边框；需要遮住背景笔刷时叠加 `pk-veil`。
- 滑杆使用 `pk-range`，快捷按钮使用 `pk-chip`（中文加 `zh`），不另写浏览器默认控件样式。
- 「生活里的光」场景卡片只在 hover 时显示淡绿色底色，选中状态用实心圆点及 `aria-pressed` 标识，不保留绿色底色。
- 桌面可视化与控制区分栏，小屏改为单栏；保留键盘焦点样式及控件标签。

## 已收录

- [x] 地理 · 地球上的东南西北（`tools/earth-directions.html`）
- [x] 天文 · 太阳系的公转（`tools/solar-system.html`）
- [x] 历史 · 同一条时间线上（`tools/timeline.html`）
- [x] 物理 · 生活里的光（`tools/light.html`）：散射、薄膜干涉与折射的交互示意。

## 部署

本仓库是纯静态网站，可直接用 GitHub Pages 发布：
Settings → Pages → Source 选择 `main` 分支、根目录 `/`。
