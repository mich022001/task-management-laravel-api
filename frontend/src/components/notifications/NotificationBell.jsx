import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    clearNotifications,
    listNotifications,
    markNotificationAsRead,
} from '../../services/notification.service.js';
import Icon from '../ui/Icon.jsx';

const REFRESH_INTERVAL_MS = 60_000;

function getErrorMessage(error) {
    return (
        error.response?.data?.message ??
        error.message ??
        'Notifications could not be loaded.'
    );
}

function formatNotificationDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [activeNotificationId, setActiveNotificationId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadNotifications = useCallback(async ({ silent = false } = {}) => {
        try {
            const response = await listNotifications({
                per_page: 20,
            });

            setNotifications(response.data ?? []);
            setUnreadCount(response.meta?.unread_count ?? 0);
            setErrorMessage('');
        } catch (error) {
            if (!silent) {
                setErrorMessage(getErrorMessage(error));
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const initialLoadId = window.setTimeout(() => {
            void loadNotifications();
        }, 0);

        const intervalId = window.setInterval(() => {
            void loadNotifications({
                silent: true,
            });
        }, REFRESH_INTERVAL_MS);

        return () => {
            window.clearTimeout(initialLoadId);
            window.clearInterval(intervalId);
        };
    }, [loadNotifications]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    async function handleNotificationClick(notification) {
        if (activeNotificationId) {
            return;
        }

        setActiveNotificationId(notification.id);
        setErrorMessage('');

        try {
            await markNotificationAsRead(notification.id);

            setNotifications((currentNotifications) =>
                currentNotifications.filter(
                    (currentNotification) =>
                        currentNotification.id !== notification.id,
                ),
            );

            setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
            setIsOpen(false);

            if (notification.task_id) {
                navigate(`/tasks/${notification.task_id}`);
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setActiveNotificationId(null);
        }
    }

    async function handleClearNotifications() {
        if (notifications.length === 0 || isClearing) {
            return;
        }

        setIsClearing(true);
        setErrorMessage('');

        try {
            await clearNotifications();

            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsClearing(false);
        }
    }

    return (
        <div className="notification-center" ref={containerRef}>
            <button
                type="button"
                className="notification-bell-button"
                aria-label={
                    unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : 'Notifications'
                }
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((currentValue) => !currentValue)}
            >
                <Icon name="bell" size={21} />

                {unreadCount > 0 ? (
                    <span className="notification-count" aria-hidden="true">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {isOpen ? (
                <section
                    className="notification-panel"
                    role="dialog"
                    aria-label="Notifications"
                >
                    <header className="notification-panel-header">
                        <div>
                            <strong>Notifications</strong>
                            <span>
                                {unreadCount === 1
                                    ? '1 unread notification'
                                    : `${unreadCount} unread notifications`}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="notification-clear-button"
                            disabled={notifications.length === 0 || isClearing}
                            onClick={handleClearNotifications}
                        >
                            {isClearing ? 'Clearing...' : 'Clear all'}
                        </button>
                    </header>

                    {errorMessage ? (
                        <div className="notification-error" role="alert">
                            <span>{errorMessage}</span>

                            <button
                                type="button"
                                onClick={() => void loadNotifications()}
                            >
                                Retry
                            </button>
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div
                            className="notification-panel-state"
                            aria-live="polite"
                        >
                            Loading notifications...
                        </div>
                    ) : null}

                    {!isLoading &&
                    !errorMessage &&
                    notifications.length === 0 ? (
                        <div className="notification-panel-state">
                            <Icon name="bell" size={24} />
                            <strong>You are all caught up</strong>
                            <span>No unread notifications are available.</span>
                        </div>
                    ) : null}

                    {!isLoading && notifications.length > 0 ? (
                        <ul className="notification-list">
                            {notifications.map((notification) => (
                                <li key={notification.id}>
                                    <button
                                        type="button"
                                        className="notification-item"
                                        disabled={
                                            activeNotificationId ===
                                            notification.id
                                        }
                                        onClick={() =>
                                            void handleNotificationClick(
                                                notification,
                                            )
                                        }
                                    >
                                        <span className="notification-item-icon">
                                            <Icon
                                                name={
                                                    notification.type ===
                                                    'deadline_reminder'
                                                        ? 'clock'
                                                        : notification.type ===
                                                            'task_cancelled'
                                                          ? 'alert'
                                                          : 'tasks'
                                                }
                                                size={18}
                                            />
                                        </span>

                                        <span className="notification-item-copy">
                                            <strong>
                                                {notification.title}
                                            </strong>

                                            <span>{notification.message}</span>

                                            <small>
                                                {formatNotificationDate(
                                                    notification.created_at,
                                                )}
                                            </small>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}
