# Read with Edge

Obsidian 插件：将当前激活的 Markdown 文件直接用 Microsoft Edge 打开，使用 Edge 自带的 Read Aloud（TTS）功能朗读内容。

[English README → README.md](README.md)

## 功能

- 侧边栏图标一键调用 Edge 打开当前文件
- 工作区命令：`Read with Edge`
- 仅桌面端可用

## 使用方法

1. 在 Obsidian 中打开一个 Markdown 笔记。
2. 点击侧边栏图标，或从命令面板运行 `Read with Edge`。
3. 在打开的 Edge 窗口中，使用 `Ctrl + Shift + 右键点击` → **大声朗读** 开始文字转语音。

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