const obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
    stopKey: 'Escape'
};

class HotkeyCapturePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.isCapturing = false;
        this.capturedKeys = [];
        this.statusBarItem = null;
        this.captureScope = null;
        this.settings = DEFAULT_SETTINGS;
    }

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new HotkeyCaptureSettingTab(this.app, this));

        this.addCommand({
            id: 'start-hotkey-capture',
            name: 'Start capturing hotkey',
            editorCallback: (editor, view) => this.startCapture(editor)
        });

        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('');
    }

    onunload() {
        this.stopCapture(false);
    }

    startCapture(editor) {
        if (this.isCapturing) return;

        this.isCapturing = true;
        this.capturedKeys = [];
        this.activeEditor = editor;

        if (this.statusBarItem) {
            this.statusBarItem.setText('🎹 Capturing...');
            this.statusBarItem.addClass('hotkey-capture-active');
        }

        new obsidian.Notice('Hotkey capture started. Press keys, then ' + this.settings.stopKey + ' to finish.');

        // Создаём scope с высшим приоритетом для перехвата ВСЕХ клавиш
        this.captureScope = new obsidian.Scope();

        // Регистрируем catch-all handler (null, null = любые модификаторы, любая клавиша)
        this.captureScope.register(null, null, (evt) => {
            return this.handleKeyDown(evt);
        });

        // Делаем scope активным - теперь он перехватывает ВСЕ клавиши
        this.app.keymap.pushScope(this.captureScope);
    }

    handleKeyDown(e) {
        if (!this.isCapturing) return true; // пропускаем если не захватываем

        if (e.key === this.settings.stopKey) {
            this.stopCapture(true);
            return false; // блокируем
        }

        // Игнорируем одиночные модификаторы
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            return false; // блокируем но не записываем
        }

        const keyCombo = this.formatKeyCombo(e);
        this.capturedKeys.push(keyCombo);

        if (this.statusBarItem) {
            this.statusBarItem.setText('🎹 ' + this.capturedKeys.join(', '));
        }

        return false; // ВАЖНО: return false блокирует Obsidian hotkeys
    }

    formatKeyCombo(e) {
        const parts = [];

        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Win');

        let key = e.key;

        const keyMap = {
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Enter': 'Enter',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'Home': 'Home',
            'End': 'End',
            'PageUp': 'PageUp',
            'PageDown': 'PageDown',
            'Insert': 'Insert',
        };

        if (keyMap[key]) {
            key = keyMap[key];
        } else if (key.length === 1) {
            key = key.toUpperCase();
        }

        parts.push(key);
        return parts.join('+');
    }

    stopCapture(insertResult) {
        if (!this.isCapturing) return;

        this.isCapturing = false;

        // ВАЖНО: убираем scope ПЕРВЫМ
        if (this.captureScope) {
            this.app.keymap.popScope(this.captureScope);
            this.captureScope = null;
        }

        if (this.statusBarItem) {
            this.statusBarItem.setText('');
            this.statusBarItem.removeClass('hotkey-capture-active');
        }

        if (insertResult && this.capturedKeys.length > 0) {
            const result = this.capturedKeys.join(', ');
            this.insertText(result);
            new obsidian.Notice('Inserted: ' + result);
        } else if (insertResult) {
            new obsidian.Notice('No keys captured');
        }

        this.capturedKeys = [];
        this.activeEditor = null;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    insertText(text) {
        const editor = this.activeEditor;
        if (!editor) return;
        const cursor = editor.getCursor();
        editor.replaceRange(text, cursor);

        editor.setCursor({
            line: cursor.line,
            ch: cursor.ch + text.length
        });
    }
}

class HotkeyCaptureSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new obsidian.Setting(containerEl)
            .setName('Start capture shortcut')
            .setDesc('Managed by Obsidian — go to Settings → Hotkeys and search "Hotkey Capture" to change it.');

        const stopKeySetting = new obsidian.Setting(containerEl)
            .setName('Stop capture key')
            .setDesc('The key that stops capturing and inserts the result. Current: ' + this.plugin.settings.stopKey);

        stopKeySetting.addButton(btn => {
            btn.setButtonText(this.plugin.settings.stopKey)
                .onClick(() => {
                    btn.setButtonText('Press a key...');
                    const scope = new obsidian.Scope();
                    scope.register(null, null, (evt) => {
                        if (['Control', 'Alt', 'Shift', 'Meta'].includes(evt.key)) return false;
                        evt.preventDefault();
                        this.plugin.app.keymap.popScope(scope);
                        this.plugin.settings.stopKey = evt.key;
                        this.plugin.saveSettings();
                        this.display();
                        return false;
                    });
                    this.plugin.app.keymap.pushScope(scope);
                    const handler = (evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        if (['Control', 'Alt', 'Shift', 'Meta'].includes(evt.key)) return;
                        document.removeEventListener('keydown', handler, true);
                    };
                    document.addEventListener('keydown', handler, true);
                });
            return btn;
        });
    }
}

module.exports = HotkeyCapturePlugin;
