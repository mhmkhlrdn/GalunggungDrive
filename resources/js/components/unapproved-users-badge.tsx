import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

interface UnapprovedUsersBadgeProps {
    className?: string;
}

export function UnapprovedUsersBadge({ className = '' }: UnapprovedUsersBadgeProps) {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCount = async () => {
        try {
            const response = await fetch(route('admin.users.unapproved-count'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCount(data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unapproved users count:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCount();

        const handler = () => fetchCount();
        window.addEventListener('user-approval-toggled', handler);

        return () => {
            window.removeEventListener('user-approval-toggled', handler);
        };
    }, []);

    if (loading || count === null || count === 0) {
        return null;
    }

    return (
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}>
            {count}
        </span>
    );
}
