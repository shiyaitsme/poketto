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

## 计划收录

- [ ] 第一个工具：<https://claude.ai/artifact/GR9nNWZjGNbzTN3kGxyJng>（待迁移进 `tools/`）

## 部署

本仓库是纯静态网站，可直接用 GitHub Pages 发布：
Settings → Pages → Source 选择 `main` 分支、根目录 `/`。
