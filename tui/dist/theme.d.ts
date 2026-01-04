export declare const colors: {
    readonly bg: {
        readonly base: "#131010";
        readonly weak: "#1b1818";
        readonly elevated: "#252121";
        readonly hover: "#2d2828";
    };
    readonly text: {
        readonly strong: "#f1ecec";
        readonly base: "#b7b1b1";
        readonly weak: "#716c6b";
    };
    readonly green: "#37db2e";
    readonly red: "#ff917b";
    readonly blue: "#89b5ff";
    readonly yellow: "#fdd63c";
    readonly purple: "#dca2e0";
    readonly border: {
        readonly subtle: "#252121";
        readonly base: "#343030";
    };
};
export declare const icons: {
    readonly arrow: {
        readonly right: "▶";
        readonly down: "▼";
        readonly up: "▲";
        readonly left: "◀";
    };
    readonly bullet: "•";
    readonly check: "✓";
    readonly cross: "✗";
    readonly dot: "●";
    readonly circle: "○";
    readonly plus: "+";
    readonly minus: "-";
};
export declare function formatRelativeTime(ts: number | null): string;
export declare function formatDate(ts: number | null): string;
export declare function truncate(str: string, maxLen: number): string;
export declare function getVisibleWindow<T>(items: T[], selectedIndex: number, windowSize: number): {
    items: T[];
    startIndex: number;
};
