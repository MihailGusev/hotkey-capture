const obsidian = require('obsidian');

class HotkeyCapturePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.isCapturing = false;
        this.capturedKeys = [];
        this.statusBarItem = null;
        this.captureScope = null;
    }

    async onload() {
        this.addCommand({
            id: 'start-hotkey-capture',
            name: 'Start capturing hotkey',
            hotkeys: [{ modifiers: ['Ctrl', 'Alt'], key: 'h' }],
            callback: () => this.startCapture()
        });

        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('');
    }

    onunload() {
        this.stopCapture(false);
    }

    startCapture() {
        if (this.isCapturing) return;

        const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!view) {
            new obsidian.Notice('Open a note first');
            return;
        }

        this.isCapturing = true;
        this.capturedKeys = [];

        if (this.statusBarItem) {
            this.statusBarItem.setText('🎹 Capturing...');
            this.statusBarItem.addClass('hotkey-capture-active');
        }

        new obsidian.Notice('Hotkey capture started. Press keys, then Esc to finish.');

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

        if (e.key === 'Escape') {
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
    }

    insertText(text) {
        const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!view) return;

        const editor = view.editor;
        const cursor = editor.getCursor();
        editor.replaceRange(text, cursor);

        editor.setCursor({
            line: cursor.line,
            ch: cursor.ch + text.length
        });
    }
}

module.exports = HotkeyCapturePlugin;
