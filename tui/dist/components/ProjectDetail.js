import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, truncate, formatDate, getVisibleWindow } from '../theme.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getProject, getSessionChanges, getSnapshots, getSnapshotFiles, getFileContent, getSnapshotArchive, } from '../data.js';
export function ProjectDetail({ projectId, onBack }) {
    const [project, setProject] = useState(null);
    const [tab, setTab] = useState('snapshots');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const data = getProject(projectId);
        setProject(data);
        setLoading(false);
    }, [projectId]);
    useInput((input, key) => {
        if (key.tab) {
            setTab((t) => (t === 'changes' ? 'snapshots' : 'changes'));
        }
    });
    if (loading) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: "Loading..." }) }));
    }
    if (!project) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.red, children: "Project not found" }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: colors.text.weak, children: ['<', " "] }), _jsx(Text, { color: colors.blue, children: "Esc to go back" })] }), _jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Text, { color: colors.text.strong, bold: true, children: project.name }), _jsx(Text, { color: colors.text.weak, dimColor: true, children: truncate(project.worktree, 60) }), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: colors.text.weak, children: [_jsx(Text, { color: colors.text.base, children: project.sessionCount }), " sessions"] }), _jsx(Text, { color: colors.text.weak, children: '  ' }), _jsxs(Text, { color: colors.green, children: [_jsx(Text, { children: project.changeCount }), " with changes"] })] })] }), _jsx(Tabs, { activeTab: tab, onTabChange: setTab }), _jsx(Box, { marginTop: 1, children: tab === 'changes' ? (_jsx(ChangesTab, { projectId: projectId, onBack: onBack })) : (_jsx(SnapshotsTab, { projectId: projectId, onBack: onBack })) })] }));
}
function Tabs({ activeTab, onTabChange, }) {
    return (_jsxs(Box, { children: [_jsx(Text, { color: activeTab === 'snapshots' ? colors.blue : colors.text.weak, children: activeTab === 'snapshots' ? '[' : ' ' }), _jsx(Text, { color: activeTab === 'snapshots' ? colors.text.strong : colors.text.weak, bold: activeTab === 'snapshots', children: "Snapshots" }), _jsx(Text, { color: activeTab === 'snapshots' ? colors.blue : colors.text.weak, children: activeTab === 'snapshots' ? ']' : ' ' }), _jsx(Text, { children: "  " }), _jsx(Text, { color: activeTab === 'changes' ? colors.blue : colors.text.weak, children: activeTab === 'changes' ? '[' : ' ' }), _jsx(Text, { color: activeTab === 'changes' ? colors.text.strong : colors.text.weak, bold: activeTab === 'changes', children: "Session Changes" }), _jsx(Text, { color: activeTab === 'changes' ? colors.blue : colors.text.weak, children: activeTab === 'changes' ? ']' : ' ' }), _jsxs(Text, { color: colors.text.weak, dimColor: true, children: ['  ', "Tab to switch"] })] }));
}
function ChangesTab({ projectId, onBack }) {
    const [changes, setChanges] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedFile, setSelectedFile] = useState(0);
    const [showAfter, setShowAfter] = useState(true);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const data = getSessionChanges(projectId);
        setChanges(data);
        setLoading(false);
    }, [projectId]);
    useInput((input, key) => {
        if (key.escape) {
            onBack();
            return;
        }
        if (loading || changes.length === 0)
            return;
        const currentChange = changes[selectedIndex];
        const maxFileIndex = currentChange?.files?.length - 1 || 0;
        if (key.upArrow || input === 'k') {
            if (selectedFile > 0) {
                setSelectedFile((i) => i - 1);
            }
            else if (selectedIndex > 0) {
                setSelectedIndex((i) => i - 1);
                const prevChange = changes[selectedIndex - 1];
                setSelectedFile((prevChange?.files?.length || 1) - 1);
            }
        }
        else if (key.downArrow || input === 'j') {
            if (selectedFile < maxFileIndex) {
                setSelectedFile((i) => i + 1);
            }
            else if (selectedIndex < changes.length - 1) {
                setSelectedIndex((i) => i + 1);
                setSelectedFile(0);
            }
        }
        else if (input === ' ') {
            setShowAfter((s) => !s);
        }
    });
    if (loading) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: "Loading changes..." }) }));
    }
    if (changes.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: colors.text.weak, children: "No file changes recorded." }), _jsx(Text, { color: colors.text.weak, dimColor: true, children: "Changes are recorded when OpenCode modifies files." })] }));
    }
    const currentChange = changes[selectedIndex];
    const currentFile = currentChange?.files?.[selectedFile];
    const { items: visibleChanges, startIndex: changesStart } = getVisibleWindow(changes, selectedIndex, 8);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", height: 15, children: [_jsx(Box, { flexDirection: "column", width: 40, marginRight: 2, children: visibleChanges.map((change, idx) => {
                            const actualIdx = changesStart + idx;
                            return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { color: actualIdx === selectedIndex ? colors.blue : colors.text.weak, children: [actualIdx === selectedIndex ? '>' : ' ', ' '] }), _jsx(Text, { color: actualIdx === selectedIndex ? colors.text.strong : colors.text.base, bold: actualIdx === selectedIndex, children: truncate(change.title, 32) })] }), actualIdx === selectedIndex &&
                                        change.files.map((file, fIdx) => (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: fIdx === selectedFile ? colors.blue : colors.text.weak, children: [fIdx === selectedFile ? '>' : ' ', ' '] }), _jsx(Text, { color: fIdx === selectedFile ? colors.text.strong : colors.text.weak, children: truncate(file.file, 30) })] }, file.file)))] }, change.sessionId));
                        }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: currentFile && (_jsxs(_Fragment, { children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.text.strong, children: currentFile.file }), _jsx(Text, { color: colors.text.weak, children: ' - ' }), _jsx(Text, { color: showAfter ? colors.green : colors.red, children: showAfter ? 'After' : 'Before' }), _jsxs(Text, { color: colors.text.weak, dimColor: true, children: [' ', "(space to toggle)"] })] }), _jsx(Box, { flexDirection: "column", height: 12, overflowY: "hidden", children: (showAfter ? currentFile.after : currentFile.before)
                                        .split('\n')
                                        .slice(0, 12)
                                        .map((line, i) => (_jsx(Text, { color: colors.text.base, children: truncate(line, 60) }, i))) })] })) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: colors.text.weak, dimColor: true, children: "j/k to navigate, space to toggle before/after" }) })] }));
}
function SnapshotsTab({ projectId, onBack }) {
    const [snapshots, setSnapshots] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [files, setFiles] = useState([]);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [fileContent, setFileContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [contentScroll, setContentScroll] = useState(0);
    useEffect(() => {
        const data = getSnapshots(projectId);
        setSnapshots(data);
        setLoading(false);
    }, [projectId]);
    useEffect(() => {
        if (viewMode === 'files' && snapshots[selectedIndex]) {
            const snapshot = snapshots[selectedIndex];
            const fileList = getSnapshotFiles(projectId, snapshot.hash);
            setFiles(fileList);
            setSelectedFileIndex(0);
        }
    }, [viewMode, selectedIndex, projectId, snapshots]);
    useEffect(() => {
        if (viewMode === 'content' && files[selectedFileIndex]) {
            const file = files[selectedFileIndex];
            const content = getFileContent(projectId, file.hash);
            setFileContent(content);
            setContentScroll(0);
        }
    }, [viewMode, selectedFileIndex, projectId, files]);
    useInput((input, key) => {
        if (loading)
            return;
        if (key.escape) {
            if (viewMode === 'content') {
                setViewMode('files');
            }
            else if (viewMode === 'files') {
                setViewMode('list');
            }
            else {
                onBack();
            }
            return;
        }
        if (viewMode === 'list') {
            if (snapshots.length === 0)
                return;
            if (key.upArrow || input === 'k') {
                setSelectedIndex((i) => Math.max(0, i - 1));
                setDownloadStatus(null);
            }
            else if (key.downArrow || input === 'j') {
                setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1));
                setDownloadStatus(null);
            }
            else if (key.return) {
                setViewMode('files');
            }
            else if (input === 'd') {
                const snapshot = snapshots[selectedIndex];
                if (snapshot) {
                    setDownloadStatus('Downloading...');
                    try {
                        const archive = getSnapshotArchive(projectId, snapshot.hash);
                        if (archive) {
                            const downloadsDir = path.join(os.homedir(), 'Downloads');
                            const filename = `snapshot-${snapshot.hash.slice(0, 8)}.zip`;
                            const filepath = path.join(downloadsDir, filename);
                            fs.writeFileSync(filepath, archive);
                            setDownloadStatus(`Saved to ~/Downloads/${filename}`);
                        }
                        else {
                            setDownloadStatus('Download failed: could not create archive');
                        }
                    }
                    catch (err) {
                        setDownloadStatus(`Download failed: ${err}`);
                    }
                }
            }
        }
        else if (viewMode === 'files') {
            if (files.length === 0)
                return;
            if (key.upArrow || input === 'k') {
                setSelectedFileIndex((i) => Math.max(0, i - 1));
            }
            else if (key.downArrow || input === 'j') {
                setSelectedFileIndex((i) => Math.min(files.length - 1, i + 1));
            }
            else if (key.return) {
                setViewMode('content');
            }
            else if (input === 'd') {
                const snapshot = snapshots[selectedIndex];
                if (snapshot) {
                    setDownloadStatus('Downloading...');
                    try {
                        const archive = getSnapshotArchive(projectId, snapshot.hash);
                        if (archive) {
                            const downloadsDir = path.join(os.homedir(), 'Downloads');
                            const filename = `snapshot-${snapshot.hash.slice(0, 8)}.zip`;
                            const filepath = path.join(downloadsDir, filename);
                            fs.writeFileSync(filepath, archive);
                            setDownloadStatus(`Saved to ~/Downloads/${filename}`);
                        }
                        else {
                            setDownloadStatus('Download failed: could not create archive');
                        }
                    }
                    catch (err) {
                        setDownloadStatus(`Download failed: ${err}`);
                    }
                }
            }
        }
        else if (viewMode === 'content') {
            const lines = fileContent.split('\n');
            const maxScroll = Math.max(0, lines.length - 15);
            if (key.upArrow || input === 'k') {
                setContentScroll((s) => Math.max(0, s - 1));
            }
            else if (key.downArrow || input === 'j') {
                setContentScroll((s) => Math.min(maxScroll, s + 1));
            }
            else if (key.pageUp || input === 'u') {
                setContentScroll((s) => Math.max(0, s - 10));
            }
            else if (key.pageDown || input === 'd') {
                setContentScroll((s) => Math.min(maxScroll, s + 10));
            }
            else if (input === 'g') {
                setContentScroll(0);
            }
            else if (input === 'G') {
                setContentScroll(maxScroll);
            }
        }
    });
    if (loading) {
        return (_jsxs(Box, { children: [_jsx(Text, { color: colors.text.weak, children: "Loading snapshots..." }), _jsxs(Text, { color: colors.text.weak, dimColor: true, children: [' ', "(this may take a moment)"] })] }));
    }
    if (snapshots.length === 0) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: "No snapshots found." }) }));
    }
    if (viewMode === 'content') {
        const file = files[selectedFileIndex];
        const lines = fileContent.split('\n');
        const visibleLines = lines.slice(contentScroll, contentScroll + 15);
        const totalLines = lines.length;
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.text.weak, children: '< ' }), _jsx(Text, { color: colors.blue, children: "Esc to go back" }), _jsx(Text, { color: colors.text.weak, children: ' - ' }), _jsx(Text, { color: colors.text.strong, children: file?.path }), totalLines > 15 && (_jsxs(Text, { color: colors.text.weak, children: [" [line ", contentScroll + 1, "-", Math.min(contentScroll + 15, totalLines), "/", totalLines, "]"] }))] }), _jsx(Box, { flexDirection: "column", height: 15, overflowY: "hidden", children: visibleLines.map((line, i) => (_jsxs(Box, { children: [_jsx(Box, { width: 5, children: _jsx(Text, { color: colors.text.weak, children: contentScroll + i + 1 }) }), _jsx(Text, { color: colors.text.base, children: truncate(line, 70) })] }, contentScroll + i))) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: colors.text.weak, dimColor: true, children: "j/k to scroll, u/d for page up/down, g/G for top/bottom, Esc to go back" }) })] }));
    }
    if (viewMode === 'files') {
        const snapshot = snapshots[selectedIndex];
        const { items: visibleFiles, startIndex: filesStart } = getVisibleWindow(files, selectedFileIndex, 12);
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.text.weak, children: '< ' }), _jsx(Text, { color: colors.blue, children: "Esc to go back" }), _jsx(Text, { color: colors.text.weak, children: ' - ' }), _jsx(Text, { color: colors.text.strong, children: truncate(snapshot.hash, 12) }), _jsxs(Text, { color: colors.text.weak, children: [' ', "(", files.length, " files)"] }), filesStart > 0 && _jsxs(Text, { color: colors.text.weak, children: [" [", selectedFileIndex + 1, "/", files.length, "]"] })] }), _jsx(Box, { flexDirection: "column", height: 12, overflowY: "hidden", children: visibleFiles.map((file, idx) => {
                        const actualIdx = filesStart + idx;
                        return (_jsxs(Box, { children: [_jsxs(Text, { color: actualIdx === selectedFileIndex ? colors.blue : colors.text.weak, children: [actualIdx === selectedFileIndex ? '>' : ' ', ' '] }), _jsx(Text, { color: actualIdx === selectedFileIndex ? colors.text.strong : colors.text.base, children: truncate(file.path, 60) })] }, file.path));
                    }) }), downloadStatus && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: downloadStatus.startsWith('Saved') ? colors.green : colors.yellow, children: downloadStatus }) })), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: colors.text.weak, dimColor: true, children: ["j/k to navigate, Enter to view file, ", _jsx(Text, { color: colors.blue, children: "d" }), " to download ZIP, Esc to go back"] }) })] }));
    }
    const { items: visibleSnapshots, startIndex: snapshotsStart } = getVisibleWindow(snapshots, selectedIndex, 12);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: colors.text.strong, children: [snapshots.length, " snapshots"] }), snapshotsStart > 0 && _jsxs(Text, { color: colors.text.weak, children: [" [", selectedIndex + 1, "/", snapshots.length, "]"] })] }), _jsx(Box, { flexDirection: "column", height: 12, overflowY: "hidden", children: visibleSnapshots.map((snapshot, idx) => {
                    const actualIdx = snapshotsStart + idx;
                    return (_jsxs(Box, { children: [_jsxs(Text, { color: actualIdx === selectedIndex ? colors.blue : colors.text.weak, children: [actualIdx === selectedIndex ? '>' : ' ', ' '] }), _jsx(Box, { width: 16, children: _jsx(Text, { color: colors.text.weak, children: formatDate(snapshot.timestamp) }) }), _jsx(Text, { children: " " }), _jsx(Text, { color: actualIdx === selectedIndex ? colors.text.strong : colors.text.base, children: truncate(snapshot.sessionTitle || snapshot.hash, 45) })] }, snapshot.hash));
                }) }), downloadStatus && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: downloadStatus.startsWith('Saved') ? colors.green : colors.yellow, children: downloadStatus }) })), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: colors.text.weak, dimColor: true, children: ["j/k to navigate, Enter to browse files, ", _jsx(Text, { color: colors.blue, children: "d" }), " to download ZIP"] }) })] }));
}
