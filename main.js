const { Plugin, FileSystemAdapter, Notice } = require('obsidian');

module.exports = class ReadInEdgePlugin extends Plugin {
    async onload() {
        this.addRibbonIcon('external-link', '在 Edge 中打开当前文件', () => {
            this.openCurrentFileInEdge();
        });

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
            const fullPath = require('path').join(vaultPath, activeFile.path);

            require('electron').shell.openPath(fullPath);
            new Notice(`已在 Edge 中打开: ${activeFile.name}`);
        } else {
            new Notice('无法获取当前文件的本地系统路径。');
        }
    }

    onunload() {
        // 清理工作
    }
}
