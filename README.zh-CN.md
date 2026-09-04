# Read in Edge

Obsidian 插件：将当前激活的 Markdown 文件转换为纯文字页面后，用 Microsoft Edge 打开并自动启动“大声朗读”。原始笔记不会被修改。

[English](README.md)

## 功能

- 侧边栏图标一键在 Edge 中打开当前文件
- 工作区命令：`在 Edge 浏览器中打开当前文件`
- 仅桌面端可用
- 自动移除 Markdown 格式，只保留适合朗读的纯文字
- Edge 打开后自动启动“大声朗读”，无需手动按 `Ctrl + Shift + U`
- Edge 阅读窗口支持始终置顶、坐标和宽高设置
- 设置界面支持中文和 English

## 使用方法

1. 在 Obsidian 中打开一个 Markdown 笔记。
2. 点击侧边栏图标，或从命令面板运行 `在 Edge 浏览器中打开当前文件`。
3. 插件会生成仅供 Edge 使用的纯文字临时页面，原始 Markdown 笔记不会被改动。
4. Edge 窗口打开约 1 秒后会自动启动“大声朗读”。

## 设置

在 **设置 → Read in Edge** 中可以配置：

- 界面语言：中文 / English；
- 是否始终置顶；
- X、Y 坐标；
- 窗口宽度和高度。

## 安装

### 从源码安装

将 `main.js`、`manifest.json` 和 `styles.css` 放入 Obsidian 库的社区插件目录：

```
<vault>/.obsidian/plugins/read-in-edge/
```

然后在 **设置 → 社区插件** 中开启本插件。

### 从 GitHub Releases 安装

从最新 Release 下载 `main.js`、`manifest.json` 和 `styles.css`，放到插件目录：

```
<vault>/.obsidian/plugins/read-in-edge/
```

## 许可

MIT
