const { Plugin, FileSystemAdapter, Notice } = require('obsidian');
const { exec } = require('child_process');
const path = require('path'); // 引入 path 模块处理 Windows 路径

module.exports = class OpenInEdgePlugin extends Plugin {
    async onload() {
        // 添加左侧边栏图标 (换成了 Lucide 内置的 'external-link' 图标)
        this.addRibbonIcon('external-link', '在 Edge 中打开当前文件', () => {
            this.openCurrentFileInEdge();
        });

        // 添加命令面板命令
        this.addCommand({
            id: 'open-current-file-in-edge',
            name: '在 Edge 浏览器中打开当前文件',
            callback: () => this.openCurrentFileInEdge()
        });
    }

    openCurrentFileInEdge() {
        const activeFile = this.app.workspace.getActiveFile();
        
        if (!activeFile) {
            new Notice('当前没有打开任何文件！');
            return;
        }

        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            const vaultPath = this.app.vault.adapter.getBasePath();
            
            // 使用 path.join 自动适配 Windows 的 \ 路径分隔符
            const fullPath = path.join(vaultPath, activeFile.path);
            
            // Windows 下启动 Edge
            const command = `start msedge "${fullPath}"`;

            exec(command, (error) => {
                if (error) {
                    new Notice(`无法在 Edge 中打开文件: ${error.message}`);
                    console.error(error);
                } else {
                    new Notice(`已在 Edge 中打开: ${activeFile.name}`);
                }
            });
        } else {
            new Notice('无法获取当前文件的本地系统路径。');
        }
    }

    onunload() {
        // 清理工作
    }
}