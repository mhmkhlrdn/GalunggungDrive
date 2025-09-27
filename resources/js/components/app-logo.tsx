import { Cloud } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Cloud className="size-6" />
            </div>
            <div className="ml-3 grid flex-1 text-left">
                <span className="truncate leading-tight font-bold text-md bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Galunggung Drive
                </span>
                <span className="text-xs text-muted-foreground truncate">
                    Penyimpanan Cloud
                </span>
            </div>
        </>
    );
}
