const { Plugin, FileSystemAdapter, Notice } = require('obsidian');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TEMP_PREFIX = 'obsidian-read-in-edge-';
const EDGE_PATHS = [
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
];

module.exports = class OpenInEdgePlugin extends Plugin {
    async onload() {
        this.tempPages = new Map();
        this.cleanupStalePages();

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

    async openCurrentFileInEdge() {
        const activeFile = this.app.workspace.getActiveFile();
        
        if (!activeFile) {
            new Notice('当前没有打开任何文件！');
            return;
        }

        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            try {
                const markdown = await this.app.vault.read(activeFile);
                const text = stripMarkdown(markdown);
                const page = this.createTempPage(activeFile.name, text);
                const edgePath = EDGE_PATHS.find((candidate) => candidate && fs.existsSync(candidate));
                if (!edgePath) {
                    this.deleteTempPage(page.tempPath);
                    this.deleteTempPage(page.profilePath);
                    throw new Error('找不到 Microsoft Edge 安装程序');
                }
                const edge = spawn(edgePath, [
                    `--user-data-dir=${page.profilePath}`,
                    '--no-first-run',
                    '--no-default-browser-check',
                    `--app=file:///${page.tempPath.replace(/\\/g, '/')}`
                ], { detached: false, windowsHide: true });
                this.tempPages.set(page.tempPath, { profilePath: page.profilePath, edge });
                edge.once('error', (error) => {
                    this.deleteTempPage(page.tempPath);
                    this.deleteTempPage(page.profilePath);
                    this.tempPages.delete(page.tempPath);
                    new Notice(`无法在 Edge 中打开文件: ${error.message}`);
                    console.error(error);
                });
                edge.once('close', () => {
                    this.deleteTempPage(page.tempPath);
                    this.deleteTempPage(page.profilePath);
                    this.tempPages.delete(page.tempPath);
                });
                new Notice(`已在 Edge 中打开纯文字页面: ${activeFile.name}`);
            } catch (error) {
                new Notice(`无法生成或打开 Edge 阅读页面: ${error.message}`);
                console.error(error);
            }
        } else {
            new Notice('无法获取当前文件的本地系统路径。');
        }
    }

    createTempPage(fileName, text) {
        const id = crypto.randomBytes(8).toString('hex');
        const tempPath = path.join(os.tmpdir(), `${TEMP_PREFIX}${id}.html`);
        const profilePath = path.join(os.tmpdir(), `${TEMP_PREFIX}${id}-profile`);
        const title = escapeHtml(fileName.replace(/\.md$/i, ''));
        const body = escapeHtml(text);
        const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;line-height:1.8;white-space:pre-wrap;word-wrap:break-word;color:#222;background:#fff}@media(prefers-color-scheme:dark){body{color:#eee;background:#1e1e1e}}</style></head><body>${body}</body></html>`;
        fs.writeFileSync(tempPath, html, 'utf8');
        return { tempPath, profilePath };
    }

    cleanupStalePages() {
        try {
            for (const file of fs.readdirSync(os.tmpdir())) {
                if (file.startsWith(TEMP_PREFIX) && file.endsWith('.html')) {
                    this.deleteTempPage(path.join(os.tmpdir(), file));
                }
                if (file.startsWith(TEMP_PREFIX) && file.endsWith('-profile')) {
                    this.deleteTempPage(path.join(os.tmpdir(), file));
                }
            }
        } catch (error) {
            console.warn('无法清理遗留 Edge 临时页面', error);
        }
    }

    deleteTempPage(tempPath) {
        try {
            if (fs.existsSync(tempPath)) {
                fs.rmSync(tempPath, { recursive: true, force: true });
            }
        } catch (error) { /* already removed or still in use; next startup retries */ }
    }

    onunload() {
        // Do not delete active pages here; their Edge process owns their lifecycle.
    }
}

function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripMarkdown(markdown) {
    let text = markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, '');
    text = text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '');
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/!\[[^\]]*\]\[[^\]]*\]/g, '');
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
    text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/^\s{0,3}>\s?/gm, '');
    text = text.replace(/^\s*(?:[-*_])(?:\s*\1){2,}\s*$/gm, '');
    text = text.replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/gm, '');
    text = text.replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?[ \t]*$/gm, '');
    text = text.replace(/\|/g, ' ');
    text = text.replace(/(``?)(.*?)\1/g, '$2').replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(~~)(.*?)\1/g, '$2');
    text = text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1$2').replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1$2');
    text = text.replace(/<[^>]*>/g, '').replace(/\\([\\`*{}\[\]()#+.!_>\-|])/g, '$1');
    return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
