const { Plugin, FileSystemAdapter, Notice, PluginSettingTab, Setting } = require('obsidian');
const { spawn, execFile } = require('child_process');
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
const READ_ALOUD_DELAY_MS = 1000;
const DEFAULT_SETTINGS = {
    alwaysOnTop: true,
    language: 'zh',
    x: 20,
    y: 20,
    width: 360,
    height: 800
};

module.exports = class OpenInEdgePlugin extends Plugin {
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new ReadInEdgeSettingTab(this.app, this));
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
                this.triggerReadAloud(activeFile.name.replace(/\.md$/i, ''));
                this.setEdgeWindowLayout(activeFile.name.replace(/\.md$/i, ''));
                new Notice(`已在 Edge 中打开纯文字页面: ${activeFile.name}`);
            } catch (error) {
                new Notice(`无法生成或打开 Edge 阅读页面: ${error.message}`);
                console.error(error);
            }
        } else {
            new Notice('无法获取当前文件的本地系统路径。');
        }
    }

    triggerReadAloud(windowTitle) {
        const escapedTitle = windowTitle.replace(/'/g, "''");
        const script = `Start-Sleep -Milliseconds ${READ_ALOUD_DELAY_MS}; $shell = New-Object -ComObject WScript.Shell; if ($shell.AppActivate('${escapedTitle}')) { $shell.SendKeys('^+u') }`;
        execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], (error) => {
            if (error) console.warn('无法自动启动 Edge 大声朗读', error.message);
        });
    }

    setEdgeWindowLayout(windowTitle) {
        const escapedTitle = windowTitle.replace(/'/g, "''");
        const topMostHandle = this.settings.alwaysOnTop ? '-1' : '-2';
        const script = `Start-Sleep -Milliseconds ${READ_ALOUD_DELAY_MS}; Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\npublic static class EdgeWindow {\n    [DllImport(\"user32.dll\")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);\n}\n'@; $p = Get-Process msedge | Where-Object { $_.MainWindowTitle -eq '${escapedTitle}' } | Select-Object -First 1; if ($p -and $p.MainWindowHandle -ne 0) { [EdgeWindow]::SetWindowPos($p.MainWindowHandle, [IntPtr](${topMostHandle}), ${this.settings.x}, ${this.settings.y}, ${this.settings.width}, ${this.settings.height}, 0x0040) | Out-Null }`;
        execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], (error) => {
            if (error) console.warn('无法设置 Edge 窗口布局', error.message);
        });
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

class ReadInEdgeSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        const en = this.plugin.settings.language === 'en';
        containerEl.createEl('h2', { text: en ? 'Read in Edge Settings' : 'Read in Edge 设置' });

        new Setting(containerEl)
            .setName(en ? 'Interface language' : '界面语言')
            .setDesc(en ? 'Choose the language used on this settings page.' : '选择设置页面使用的语言。')
            .addDropdown((dropdown) => dropdown
                .addOptions({ zh: '中文', en: 'English' })
                .setValue(this.plugin.settings.language)
                .onChange(async (value) => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveData(this.plugin.settings);
                    this.display();
                }));

        new Setting(containerEl)
            .setName(en ? 'Always on top' : '始终置顶')
            .setDesc(en ? 'Keep the Edge reading window above other windows.' : '让 Edge 阅读窗口保持在其他窗口上方。')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.alwaysOnTop)
                .onChange(async (value) => {
                    this.plugin.settings.alwaysOnTop = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        this.addNumberSetting(containerEl, en ? 'Window X coordinate' : '窗口 X 坐标', en ? 'Horizontal position of the top-left corner, in pixels.' : 'Edge 窗口左上角的水平坐标（像素）。', 'x', -2000, 10000);
        this.addNumberSetting(containerEl, en ? 'Window Y coordinate' : '窗口 Y 坐标', en ? 'Vertical position of the top-left corner, in pixels.' : 'Edge 窗口左上角的垂直坐标（像素）。', 'y', -2000, 10000);
        this.addNumberSetting(containerEl, en ? 'Window width' : '窗口宽度', en ? 'Edge window width, in pixels.' : 'Edge 窗口宽度（像素）。', 'width', 240, 2000);
        this.addNumberSetting(containerEl, en ? 'Window height' : '窗口高度', en ? 'Edge window height, in pixels.' : 'Edge 窗口高度（像素）。', 'height', 300, 2000);
    }

    addNumberSetting(containerEl, name, desc, key, min, max) {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => text
                .setValue(String(this.plugin.settings[key]))
                .setPlaceholder(String(DEFAULT_SETTINGS[key]))
                .onChange(async (value) => {
                    const number = Math.round(Number(value));
                    if (!Number.isFinite(number)) return;
                    this.plugin.settings[key] = Math.min(max, Math.max(min, number));
                    await this.plugin.saveData(this.plugin.settings);
                }));
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

/* nosourcemap */
