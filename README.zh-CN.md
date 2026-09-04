# Read with Edge

Obsidian 插件：将当前激活的 Markdown 文件转换为纯文字后，在 Obsidian 中打开只读阅读标签页。原始笔记不会被修改。

[English](README.md)

## 功能

- 侧边栏图标一键打开当前文件的纯文字阅读页
- 工作区命令：`在 Obsidian 中打开纯文字阅读页`
- 仅桌面端可用
- 自动移除 Markdown 格式，只保留适合朗读的纯文字
- 阅读页在 Obsidian 新标签页中打开，并且不可编辑

## 使用方法

1. 在 Obsidian 中打开一个 Markdown 笔记。
2. 点击侧边栏图标，或从命令面板运行 `在 Obsidian 中打开纯文字阅读页`。
3. 插件会在 Obsidian 中新建只读纯文字标签页；原始 Markdown 笔记不会被改动。

## 安装

### 从源码安装

将编译后的 `main.js` 和 `manifest.json` 放入 Obsidian 库的社区插件目录：

```
<vault>/.obsidian/plugins/read-with-edge/
```

然后在 **设置 → 社区插件** 中开启本插件，即可看到名为 **Read with Edge** 的命令和侧边栏图标。

### 从 GitHub Releases 安装

从最新 Release 下载 `main.js` 和 `manifest.json`，放到插件目录：

```
<vault>/.obsidian/plugins/read-with-edge/
```

## 许可

MIT
