const iconPaths = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
    ),
    tasks: (
        <>
            <path d="M9 5h10" />
            <path d="M9 12h10" />
            <path d="M9 19h10" />
            <path d="m3.5 5 1 1 2-2" />
            <path d="m3.5 12 1 1 2-2" />
            <path d="m3.5 19 1 1 2-2" />
        </>
    ),
    teams: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    users: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    analytics: (
        <>
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-7" />
            <path d="M22 20H2" />
        </>
    ),
    clipboard: (
        <>
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4V2h6v2" />
            <path d="M9 10h6" />
            <path d="M9 14h6" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </>
    ),
    progress: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v9h9" />
        </>
    ),
    check: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
        </>
    ),
    alert: (
        <>
            <path d="M12 3 2.5 20h19L12 3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 1 0-2.34 5.66" />
            <path d="M20 4v7h-7" />
        </>
    ),
    chevronDown: (
        <>
            <path d="m7 10 5 5 5-5" />
        </>
    ),
    logout: (
        <>
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </>
    ),
    menu: (
        <>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </>
    ),
    close: (
        <>
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
        </>
    ),
};

export default function Icon({ name, size = 20, className = '' }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {iconPaths[name] ?? iconPaths.clipboard}
        </svg>
    );
}
