import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { colors, formatRelativeTime, truncate, getVisibleWindow } from '../theme.js';
import { searchPrompts } from '../data.js';
export function Search({ onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searching, setSearching] = useState(false);
    const [searchedOnce, setSearchedOnce] = useState(false);
    const doSearch = useCallback((q) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        setSearchedOnce(true);
        setTimeout(() => {
            const r = searchPrompts(q, 20);
            setResults(r);
            setSearching(false);
            setSelectedIndex(0);
        }, 0);
    }, []);
    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, doSearch]);
    useInput((input, key) => {
        if (key.escape) {
            onClose();
            return;
        }
        if (results.length === 0)
            return;
        if (key.upArrow) {
            setSelectedIndex((i) => Math.max(0, i - 1));
        }
        else if (key.downArrow) {
            setSelectedIndex((i) => Math.min(results.length - 1, i + 1));
        }
        else if (key.return && results[selectedIndex]) {
            onSelect(results[selectedIndex].projectId);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", width: "100%", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.text.strong, bold: true, children: "Search" }), _jsx(Text, { color: colors.text.weak, children: " - Esc to close" })] }), _jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: colors.blue, children: '> ' }), _jsx(TextInput, { value: query, onChange: setQuery, placeholder: "Search conversations..." })] }), searching && (_jsxs(Box, { children: [_jsx(Text, { color: colors.text.weak, children: "Searching..." }), !searchedOnce && (_jsxs(Text, { color: colors.text.weak, dimColor: true, children: [' ', "(first search may take a moment to build index)"] }))] })), !searching && query.length >= 2 && results.length === 0 && (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, children: "No results found" }) })), !searching && results.length > 0 && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: colors.text.weak, children: [results.length, " results"] }), selectedIndex > 0 && _jsxs(Text, { color: colors.text.weak, children: [" [", selectedIndex + 1, "/", results.length, "]"] })] }), (() => {
                        const { items: visibleResults, startIndex } = getVisibleWindow(results, selectedIndex, 6);
                        return visibleResults.map((result, idx) => (_jsx(SearchResultRow, { result: result, isSelected: startIndex + idx === selectedIndex, query: query }, `${result.sessionId}-${result.messageId}`)));
                    })()] })), query.length < 2 && (_jsx(Box, { children: _jsx(Text, { color: colors.text.weak, dimColor: true, children: "Type at least 2 characters to search" }) }))] }));
}
function SearchResultRow({ result, isSelected, query }) {
    const snippetLength = 60;
    const lowerText = result.text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);
    let snippet = result.text;
    if (matchIndex > 20) {
        snippet = '...' + result.text.slice(matchIndex - 15);
    }
    snippet = truncate(snippet, snippetLength);
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: isSelected ? colors.blue : colors.text.weak, children: [isSelected ? '>' : ' ', ' '] }), _jsx(Text, { color: isSelected ? colors.text.strong : colors.text.base, bold: isSelected, children: truncate(result.projectName, 20) }), _jsx(Text, { color: colors.text.weak, children: ' / ' }), _jsx(Text, { color: colors.text.weak, children: truncate(result.sessionTitle, 30) }), _jsx(Text, { color: colors.text.weak, children: ' ' }), _jsx(Text, { color: colors.text.weak, dimColor: true, children: formatRelativeTime(result.timestamp) })] }), _jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: result.role === 'user' ? colors.blue : colors.text.weak, children: ["[", result.role, "]"] }), _jsx(Text, { color: colors.text.weak, children: ' ' }), _jsx(Text, { color: colors.text.base, children: snippet })] })] }));
}
