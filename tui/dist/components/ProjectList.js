import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, formatRelativeTime, truncate, getVisibleWindow } from '../theme.js';
import { getProjects } from '../data.js';
export function ProjectList({ onSelect }) {
    const [projects, setProjects] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = getProjects();
                setProjects(data);
            }
            finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, []);
    useInput((input, key) => {
        if (loading || projects.length === 0)
            return;
        if (key.upArrow || input === 'k') {
            setSelectedIndex((i) => Math.max(0, i - 1));
        }
        else if (key.downArrow || input === 'j') {
            setSelectedIndex((i) => Math.min(projects.length - 1, i + 1));
        }
        else if (key.return) {
            onSelect(projects[selectedIndex].id);
        }
    });
    if (loading) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: "Loading projects..." }) }));
    }
    if (projects.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: colors.text.weak, children: "No projects found." }), _jsx(Text, { color: colors.text.weak, dimColor: true, children: "OpenCode data is read from ~/.local/share/opencode/" })] }));
    }
    const { items: visibleProjects, startIndex } = getVisibleWindow(projects, selectedIndex, 15);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.text.strong, bold: true, children: "Projects" }), _jsxs(Text, { color: colors.text.weak, children: [" (", projects.length, ")"] }), startIndex > 0 && _jsxs(Text, { color: colors.text.weak, children: [" [", selectedIndex + 1, "/", projects.length, "]"] })] }), visibleProjects.map((project, index) => (_jsx(ProjectRow, { project: project, isSelected: startIndex + index === selectedIndex }, project.id))), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: colors.text.weak, dimColor: true, children: "j/k to navigate, Enter to select, / to search, q to quit" }) })] }));
}
function ProjectRow({ project, isSelected }) {
    const indicator = isSelected ? '>' : ' ';
    return (_jsxs(Box, { children: [_jsxs(Text, { color: isSelected ? colors.blue : colors.text.weak, children: [indicator, ' '] }), _jsx(Box, { width: 20, children: _jsx(Text, { color: colors.text.strong, bold: isSelected, children: truncate(project.name, 18) }) }), _jsx(Box, { width: 14, children: _jsxs(Text, { color: colors.text.weak, children: [project.sessionCount, " sessions"] }) }), project.changeCount > 0 ? (_jsx(Box, { width: 14, children: _jsxs(Text, { color: colors.green, children: ["+", project.changeCount, " changes"] }) })) : (_jsx(Box, { width: 14, children: _jsx(Text, { color: colors.text.weak, children: " " }) })), project.lastSession && (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: formatRelativeTime(project.lastSession.updated) }) }))] }));
}
