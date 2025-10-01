import { useState } from 'react';
import { formatFileSize } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Share2, 
    Copy, 
    Mail, 
    Calendar, 
    Users, 
    Link, 
    Eye, 
    Edit, 
    Download,
    Clock,
    X
} from 'lucide-react';

interface FileShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        id: number;
        name: string;
        size: string;
        mime_type: string;
    };
}

export default function FileShareModal({ isOpen, onClose, file }: FileShareModalProps) {
    const [shareType, setShareType] = useState<'user' | 'public'>('user');
    const [permission, setPermission] = useState<'view' | 'edit' | 'download'>('view');
    const [expiration, setExpiration] = useState<'never' | '1day' | '1week' | '1month' | 'custom'>('never');
    const [customExpiration, setCustomExpiration] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');

    const handleGenerateLink = () => {
        // In a real app, this would make an API call
        const baseUrl = window.location.origin;
        const token = Math.random().toString(36).substring(2, 15);
        setGeneratedLink(`${baseUrl}/shared/${token}`);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        // You could add a toast notification here
    };

    const handleSendInvite = () => {
        // In a real app, this would make an API call
        console.log('Sending invite:', { email, message, permission, expiration });
    };

    const getExpirationDate = () => {
        if (expiration === 'never') return null;
        if (expiration === 'custom') return customExpiration;
        
        const now = new Date();
        switch (expiration) {
            case '1day':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            case '1week':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            case '1month':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Share2 className="h-5 w-5" />
                        <span>Share "{file.name}"</span>
                    </DialogTitle>
                    <DialogDescription>
                        Share this file with others or create a public link
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Info */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Share Type Selection */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">Share with</Label>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShareType('user')}
                                    className={`flex items-center space-x-3 rounded-lg border p-4 text-left transition-colors ${
                                        shareType === 'user'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Specific people</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Share with specific users</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setShareType('public')}
                                    className={`flex items-center space-x-3 rounded-lg border p-4 text-left transition-colors ${
                                        shareType === 'public'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <Link className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Public link</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Anyone with the link</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Permission Selection */}
                        <div>
                            <Label className="text-sm font-medium">Permission</Label>
                            <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="h-4 w-4" />
                                            <span>View only</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit">
                                        <div className="flex items-center space-x-2">
                                            <Edit className="h-4 w-4" />
                                            <span>Can edit</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="download">
                                        <div className="flex items-center space-x-2">
                                            <Download className="h-4 w-4" />
                                            <span>Can download</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expiration */}
                        <div>
                            <Label className="text-sm font-medium">Expiration</Label>
                            <Select value={expiration} onValueChange={(value: any) => setExpiration(value)}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="never">Never</SelectItem>
                                    <SelectItem value="1day">1 day</SelectItem>
                                    <SelectItem value="1week">1 week</SelectItem>
                                    <SelectItem value="1month">1 month</SelectItem>
                                    <SelectItem value="custom">Custom date</SelectItem>
                                </SelectContent>
                            </Select>
                            {expiration === 'custom' && (
                                <Input
                                    type="date"
                                    value={customExpiration}
                                    onChange={(e) => setCustomExpiration(e.target.value)}
                                    className="mt-2"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            )}
                        </div>

                        {/* User-specific sharing */}
                        {shareType === 'user' && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                                    <div className="mt-2 flex space-x-2">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <Button onClick={handleSendInvite} disabled={!email}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="message" className="text-sm font-medium">Message (optional)</Label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a message..."
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Public link sharing */}
                        {shareType === 'public' && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium">Public link</Label>
                                    <div className="mt-2 flex space-x-2">
                                        <Input
                                            value={generatedLink}
                                            placeholder="Click 'Generate Link' to create a shareable link"
                                            readOnly
                                        />
                                        <Button onClick={handleGenerateLink} variant="outline">
                                            Generate Link
                                        </Button>
                                        {generatedLink && (
                                            <Button onClick={handleCopyLink} variant="outline">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {generatedLink && (
                                    <div className="rounded-lg bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                                <Link className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                Link generated successfully
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                                            Anyone with this link can {permission} the file
                                            {getExpirationDate() && ` until ${getExpirationDate()}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {shareType === 'user' ? (
                            <Button onClick={handleSendInvite} disabled={!email}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Invite
                            </Button>
                        ) : (
                            <Button onClick={handleGenerateLink}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Generate Link
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


