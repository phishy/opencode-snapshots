import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { ProjectList } from './ProjectList.js';
import { ProjectDetail } from './ProjectDetail.js';
import { Search } from './Search.js';
import { colors } from '../theme.js';
export function App() {
    const { exit } = useApp();
    const [state, setState] = useState({
        screen: 'list',
        selectedProjectId: null,
    });
    const [showHelp, setShowHelp] = useState(false);
    useInput((input, key) => {
        if (input === 'q' && state.screen === 'list') {
            exit();
            return;
        }
        if (input === '?') {
            setShowHelp((h) => !h);
            return;
        }
        if (key.escape) {
            if (showHelp) {
                setShowHelp(false);
            }
            else if (state.screen === 'search') {
                setState((s) => ({ ...s, screen: 'list' }));
            }
            return;
        }
        if (input === '/' || input === 's') {
            if (state.screen !== 'search') {
                setState((s) => ({ ...s, screen: 'search' }));
            }
            return;
        }
    });
    const handleSelectProject = (projectId) => {
        setState({ screen: 'detail', selectedProjectId: projectId });
    };
    const handleBack = () => {
        setState({ screen: 'list', selectedProjectId: null });
    };
    const handleSearchSelect = (projectId) => {
        setState({ screen: 'detail', selectedProjectId: projectId });
    };
    if (showHelp) {
        return _jsx(HelpOverlay, { onClose: () => setShowHelp(false) });
    }
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Header, {}), _jsxs(Box, { marginTop: 1, children: [state.screen === 'list' && (_jsx(ProjectList, { onSelect: handleSelectProject })), state.screen === 'detail' && state.selectedProjectId && (_jsx(ProjectDetail, { projectId: state.selectedProjectId, onBack: handleBack })), state.screen === 'search' && (_jsx(Search, { onSelect: handleSearchSelect, onClose: () => setState((s) => ({ ...s, screen: 'list' })) }))] })] }));
}
function Header() {
    return (_jsxs(Box, { children: [_jsx(Text, { color: colors.text.strong, bold: true, children: "OpenCode Snapshot Browser" }), _jsxs(Text, { color: colors.text.weak, children: [" ", ' ', " "] }), _jsx(Text, { color: colors.text.weak, children: "Press ? for help" })] }));
}
function HelpOverlay({ onClose }) {
    useInput((input, key) => {
        if (input === '?' || key.escape || input === 'q') {
            onClose();
        }
    });
    const shortcuts = [
        ['Navigation', ''],
        ['  j/k or arrows', 'Move up/down'],
        ['  Enter', 'Select item'],
        ['  Esc', 'Go back'],
        ['  Tab', 'Switch tabs'],
        ['', ''],
        ['Actions', ''],
        ['  /', 'Open search'],
        ['  d', 'Download snapshot'],
        ['  space', 'Toggle before/after diff'],
        ['', ''],
        ['General', ''],
        ['  ?', 'Toggle help'],
        ['  q', 'Quit (from project list)'],
    ];
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { color: colors.text.strong, bold: true, children: "Keyboard Shortcuts" }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: shortcuts.map(([key, desc], i) => (_jsx(Box, { children: key === '' ? (_jsx(Text, { children: " " })) : desc === '' ? (_jsx(Text, { color: colors.blue, bold: true, children: key })) : (_jsxs(_Fragment, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: colors.text.base, children: key }) }), _jsx(Text, { color: colors.text.weak, children: desc })] })) }, i))) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: colors.text.weak, children: "Press ? or Esc to close" }) })] }));
}
