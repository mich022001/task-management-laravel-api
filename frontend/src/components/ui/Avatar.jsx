function getInitials(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export default function Avatar({ name, size = 'medium' }) {
    return (
        <span className={`avatar avatar-${size}`} aria-hidden="true">
            {getInitials(name) || 'U'}
        </span>
    );
}
