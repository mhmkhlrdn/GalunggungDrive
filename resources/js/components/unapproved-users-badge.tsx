import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

interface UnapprovedUsersBadgeProps {
    className?: string;
}

export function UnapprovedUsersBadge({ className = '' }: UnapprovedUsersBadgeProps) {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const response = await fetch('/admin/users/unapproved-count', {
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

        fetchCount();
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
