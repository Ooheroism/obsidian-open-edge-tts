/* eslint-disable */
// @ts-check
/**
 * @typedef {import('obsidian').Plugin} Plugin
 */

class OpenInEdgePlugin extends obsidian.Plugin {
    async onload() {
        console.log('Loading Open in Microsoft Edge plugin');
        this.addRibbonIcon('edge', 'Open in Microsoft Edge', (evt: MouseEvent) => {
            const activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (!activeView) {
                console.warn('No active Markdown view');
                return;
            }
            const file = activeView.file;
            if (!file) {
                console.warn('No file in active view');
                return;
            }
            const vaultAdapter = this.app.vault.adapter;
            if (!vaultAdapter || !vaultAdapter.fullPath) {
                console.warn('Vault adapter does not support fullPath');
                return;
            }
            const fullPath = vaultAdapter.fullPath(file.path);
            if (!fullPath) {
                console.warn('Could not resolve absolute path for file:', file.path);
                return;
            }
            const url = new URL('file:///' + fullPath.replace(/\/g, '/'));
            const child_process = require('child_process');
            child_process.exec(`start msedge "${url.toString()}"`);
        });
    }

    onunload() {
        console.log('Unloading Open in Microsoft Edge plugin');
    }
}

module.exports = OpenInEdgePlugin;
