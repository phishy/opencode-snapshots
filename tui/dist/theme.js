export const colors = {
    bg: {
        base: '#131010',
        weak: '#1b1818',
        elevated: '#252121',
        hover: '#2d2828',
    },
    text: {
        strong: '#f1ecec',
        base: '#b7b1b1',
        weak: '#716c6b',
    },
    green: '#37db2e',
    red: '#ff917b',
    blue: '#89b5ff',
    yellow: '#fdd63c',
    purple: '#dca2e0',
    border: {
        subtle: '#252121',
        base: '#343030',
    },
};
export const icons = {
    arrow: { right: '\u25b6', down: '\u25bc', up: '\u25b2', left: '\u25c0' },
    bullet: '\u2022',
    check: '\u2713',
    cross: '\u2717',
    dot: '\u25cf',
    circle: '\u25cb',
    plus: '+',
    minus: '-',
};
export function formatRelativeTime(ts) {
    if (!ts)
        return '';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return 'just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    if (hours < 24)
        return `${hours}h ago`;
    if (days === 1)
        return '1d ago';
    return `${days}d ago`;
}
export function formatDate(ts) {
    if (!ts)
        return 'Unknown';
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
export function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, maxLen - 1) + '\u2026';
}
export function getVisibleWindow(items, selectedIndex, windowSize) {
    if (items.length <= windowSize) {
        return { items, startIndex: 0 };
    }
    let startIndex = Math.max(0, selectedIndex - Math.floor(windowSize / 2));
    if (startIndex + windowSize > items.length) {
        startIndex = items.length - windowSize;
    }
    return {
        items: items.slice(startIndex, startIndex + windowSize),
        startIndex,
    };
}
