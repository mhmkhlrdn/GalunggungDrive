# Icon Guidelines for Galunggung Drive

## Overview
This project uses **Lucide React** for all icons instead of emojis. Lucide React provides a comprehensive set of free, open-source icons that are consistent, scalable, and accessible.

## Icon Library
- **Source**: [Lucide React](https://lucide.dev/)
- **License**: MIT License (free for commercial use)
- **Installation**: Already included in the project

## Usage Guidelines

### 1. Import Icons
```typescript
import { 
    Home, 
    Folder, 
    FileText, 
    Share2, 
    Settings,
    Image,
    Video,
    Music,
    File,
    Archive,
    FileSpreadsheet,
    PresentationChart,
    Crown,
    Zap,
    Handshake,
    Cog
} from 'lucide-react';
```

### 2. Standard Icon Sizes
- **Small**: `h-3 w-3` (12px) - For labels and small indicators
- **Default**: `h-4 w-4` (16px) - For buttons and list items
- **Medium**: `h-5 w-5` (20px) - For action buttons
- **Large**: `h-6 w-6` (24px) - For headers and prominent elements

### 3. Icon Categories

#### File Type Icons
- **Documents**: `File`, `FileText`, `FileSpreadsheet`, `PresentationChart`
- **Media**: `Image`, `Video`, `Music`
- **Archives**: `Archive`
- **Folders**: `Folder`

#### Navigation Icons
- **Sections**: `FileFolderIcon` (File Management), `Handshake` (Sharing), `Zap` (Quick Access), `Cog` (System), `Crown` (Admin)
- **Actions**: `Upload`, `Download`, `Share2`, `Edit`, `Trash2`, `Move`, `Star`
- **UI**: `ChevronRight`, `ChevronDown`, `MoreHorizontal`, `Plus`

#### Status Icons
- **Active/Inactive**: `Power`, `PowerOff`
- **Success/Error**: `Check`, `X`
- **Loading**: `Loader2` (with animation)

### 4. Color Guidelines

#### Default Colors
```typescript
// Default (inherits text color)
<File className="h-4 w-4" />

// Muted text
<File className="h-4 w-4 text-slate-500" />

// Brand colors
<File className="h-4 w-4 text-blue-600" />
```

#### Contextual Colors
- **File Types**: Use semantic colors (blue for documents, green for images, etc.)
- **Actions**: Use brand colors (blue for primary, red for destructive)
- **Status**: Use semantic colors (green for success, red for error, yellow for warning)

### 5. Icon in Gradient Containers
```typescript
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
    <Cloud className="h-4 w-4" />
</div>
```

### 6. Dynamic Icons (File Type Detection)
```typescript
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <File className="h-4 w-4" />;
    if (mimeType.includes('word')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <PresentationChart className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
};
```

## Migration from Emojis

### Before (Emojis)
```typescript
// ❌ Don't use emojis
<span>📁 File Management</span>
<span>🤝 Sharing & Collaboration</span>
<span>⚡ Quick Access</span>
```

### After (Lucide Icons)
```typescript
// ✅ Use Lucide icons
<div className="flex items-center gap-2">
    <FileFolderIcon className="h-3 w-3" />
    File Management
</div>
<div className="flex items-center gap-2">
    <Handshake className="h-3 w-3" />
    Sharing & Collaboration
</div>
<div className="flex items-center gap-2">
    <Zap className="h-3 w-3" />
    Quick Access
</div>
```

## Best Practices

1. **Consistency**: Always use the same icon for the same action/type
2. **Accessibility**: Icons should be accompanied by text labels when possible
3. **Semantic**: Choose icons that clearly represent their function
4. **Scalable**: Use SVG-based Lucide icons for crisp rendering at all sizes
5. **Performance**: Import only the icons you need

## Available Icons Reference

### Common File Types
- `File` - Generic file
- `FileText` - Document/Word
- `FileSpreadsheet` - Excel/Spreadsheet
- `PresentationChart` - PowerPoint/Presentation
- `Image` - Image files
- `Video` - Video files
- `Music` - Audio files
- `Archive` - ZIP/RAR archives
- `Folder` - Folders

### Navigation & Actions
- `Home` - Dashboard/Home
- `Upload` - Upload files
- `Download` - Download files
- `Share2` - Share files
- `Edit` - Edit/Modify
- `Trash2` - Delete
- `Move` - Move files
- `Star` - Favorite/Star
- `Search` - Search
- `Filter` - Filter options

### System & Admin
- `Settings` - Settings
- `Cog` - System management
- `Crown` - Admin privileges
- `Shield` - Security
- `Database` - Storage/Database
- `Server` - Server/Backend

### UI Elements
- `ChevronRight` - Expand/Collapse
- `ChevronDown` - Expand/Collapse
- `MoreHorizontal` - More options
- `Plus` - Add new
- `X` - Close/Cancel
- `Check` - Confirm/Success

## Future Development

When adding new features:
1. **Never use emojis** - Always use Lucide React icons
2. **Check existing icons first** - Reuse existing icons for consistency
3. **Follow naming conventions** - Use descriptive names for icon imports
4. **Consider accessibility** - Ensure icons are meaningful without color
5. **Test at different sizes** - Verify icons look good at all intended sizes

## Resources
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)
- [Icon Search](https://lucide.dev/icons/)
- [Icon Guidelines](https://lucide.dev/guide/packages/lucide-react)
