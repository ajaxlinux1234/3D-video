/**
 * KeyboardShortcutsHelp Component
 * Displays a modal with all available keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import './KeyboardShortcutsHelp.css';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '播放控制',
    shortcuts: [
      { keys: ['Space'], description: '播放/暂停' },
      { keys: ['←'], description: '后退 5 秒' },
      { keys: ['→'], description: '前进 5 秒' },
    ],
  },
  {
    title: '编辑操作',
    shortcuts: [
      { keys: ['Delete'], description: '删除选中片段' },
      { keys: ['Ctrl', 'Z'], description: '撤销 (即将推出)' },
      { keys: ['Ctrl', 'Y'], description: '重做 (即将推出)' },
      { keys: ['Ctrl', 'C'], description: '复制 (即将推出)' },
      { keys: ['Ctrl', 'V'], description: '粘贴 (即将推出)' },
    ],
  },
  {
    title: '项目管理',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: '保存项目' },
      { keys: ['Ctrl', 'O'], description: '打开项目' },
      { keys: ['Ctrl', 'N'], description: '新建项目' },
      { keys: ['Ctrl', 'E'], description: '导出视频' },
    ],
  },
  {
    title: '界面导航',
    shortcuts: [
      { keys: ['Tab'], description: '切换侧边栏' },
      { keys: ['1'], description: '素材库面板' },
      { keys: ['2'], description: '特效面板' },
      { keys: ['3'], description: '转场面板' },
      { keys: ['4'], description: '属性面板' },
      { keys: ['?'], description: '显示快捷键帮助' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with ? key
      if (e.key === '?' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        className="shortcuts-help-button"
        onClick={() => setIsOpen(true)}
        title="键盘快捷键 (?)"
      >
        ⌨️
      </button>
    );
  }

  return (
    <>
      <div className="shortcuts-overlay" onClick={() => setIsOpen(false)} />
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <h2>键盘快捷键</h2>
          <button
            className="shortcuts-close"
            onClick={() => setIsOpen(false)}
            title="关闭 (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="shortcuts-content">
          {shortcutGroups.map((group, index) => (
            <div key={index} className="shortcut-group">
              <h3 className="group-title">{group.title}</h3>
              <div className="shortcuts-list">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx}>
                          <kbd className="shortcut-key">{key}</kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="key-separator">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="shortcut-description">{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>按 <kbd>?</kbd> 随时显示此帮助</p>
        </div>
      </div>
    </>
  );
}
