// Indonesian success messages
export const SUCCESS_MESSAGES = {
    // File operations
    FILE_UPLOADED: 'File berhasil diunggah',
    FILE_UPDATED: 'File berhasil diperbarui',
    FILE_DELETED: 'File berhasil dihapus',
    FILE_MOVED: 'File berhasil dipindahkan',
    FILE_STARRED: 'File berhasil ditandai sebagai favorit',
    FILE_UNSTARRED: 'File berhasil dihapus dari favorit',
    FILE_SHARED: 'File berhasil dibagikan',
    FILE_DOWNLOADED: 'File berhasil diunduh',
    FILE_RESTORED: 'File berhasil dipulihkan',
    
    // Folder operations
    FOLDER_CREATED: 'Folder berhasil dibuat',
    FOLDER_UPDATED: 'Folder berhasil diperbarui',
    FOLDER_DELETED: 'Folder berhasil dihapus',
    FOLDER_MOVED: 'Folder berhasil dipindahkan',
    FOLDER_SHARED: 'Folder berhasil dibagikan',
    FOLDER_RESTORED: 'Folder berhasil dipulihkan',
    
    // User operations
    USER_CREATED: 'Pengguna berhasil dibuat',
    USER_UPDATED: 'Pengguna berhasil diperbarui',
    USER_DELETED: 'Pengguna berhasil dihapus',
    
    // Storage operations
    STORAGE_LOCATION_CREATED: 'Lokasi penyimpanan berhasil dibuat',
    STORAGE_LOCATION_UPDATED: 'Lokasi penyimpanan berhasil diperbarui',
    STORAGE_LOCATION_DELETED: 'Lokasi penyimpanan berhasil dihapus',
    
    // Share operations
    SHARE_CREATED: 'Berbagi berhasil dibuat',
    SHARE_UPDATED: 'Berbagi berhasil diperbarui',
    SHARE_DELETED: 'Berbagi berhasil dihapus',
    
    // General operations
    OPERATION_SUCCESS: 'Operasi berhasil dilakukan',
    CHANGES_SAVED: 'Perubahan berhasil disimpan',
    DATA_UPDATED: 'Data berhasil diperbarui',
} as const;

// Indonesian error messages
export const ERROR_MESSAGES = {
    // File operations
    FILE_UPLOAD_FAILED: 'Gagal mengunggah file',
    FILE_UPDATE_FAILED: 'Gagal memperbarui file',
    FILE_DELETE_FAILED: 'Gagal menghapus file',
    FILE_MOVE_FAILED: 'Gagal memindahkan file',
    FILE_STAR_FAILED: 'Gagal menandai file sebagai favorit',
    FILE_SHARE_FAILED: 'Gagal membagikan file',
    FILE_DOWNLOAD_FAILED: 'Gagal mengunduh file',
    FILE_RESTORE_FAILED: 'Gagal memulihkan file',
    FILE_NOT_FOUND: 'File tidak ditemukan',
    FILE_TOO_LARGE: 'Ukuran file terlalu besar',
    FILE_TYPE_NOT_ALLOWED: 'Jenis file tidak diizinkan',
    
    // Folder operations
    FOLDER_CREATE_FAILED: 'Gagal membuat folder',
    FOLDER_UPDATE_FAILED: 'Gagal memperbarui folder',
    FOLDER_DELETE_FAILED: 'Gagal menghapus folder',
    FOLDER_MOVE_FAILED: 'Gagal memindahkan folder',
    FOLDER_SHARE_FAILED: 'Gagal membagikan folder',
    FOLDER_RESTORE_FAILED: 'Gagal memulihkan folder',
    FOLDER_NOT_FOUND: 'Folder tidak ditemukan',
    FOLDER_NOT_EMPTY: 'Folder tidak kosong',
    
    // User operations
    USER_CREATE_FAILED: 'Gagal membuat pengguna',
    USER_UPDATE_FAILED: 'Gagal memperbarui pengguna',
    USER_DELETE_FAILED: 'Gagal menghapus pengguna',
    USER_NOT_FOUND: 'Pengguna tidak ditemukan',
    
    // Storage operations
    STORAGE_LOCATION_CREATE_FAILED: 'Gagal membuat lokasi penyimpanan',
    STORAGE_LOCATION_UPDATE_FAILED: 'Gagal memperbarui lokasi penyimpanan',
    STORAGE_LOCATION_DELETE_FAILED: 'Gagal menghapus lokasi penyimpanan',
    STORAGE_FULL: 'Penyimpanan penuh',
    STORAGE_NOT_ACCESSIBLE: 'Penyimpanan tidak dapat diakses',
    
    // Share operations
    SHARE_CREATE_FAILED: 'Gagal membuat berbagi',
    SHARE_UPDATE_FAILED: 'Gagal memperbarui berbagi',
    SHARE_DELETE_FAILED: 'Gagal menghapus berbagi',
    
    // Permission errors
    ACCESS_DENIED: 'Akses ditolak',
    PERMISSION_DENIED: 'Izin ditolak',
    UNAUTHORIZED: 'Tidak memiliki otorisasi',
    
    // Validation errors
    VALIDATION_ERROR: 'Data tidak valid',
    REQUIRED_FIELD_MISSING: 'Field wajib tidak diisi',
    INVALID_FORMAT: 'Format tidak valid',
    
    // Network errors
    NETWORK_ERROR: 'Terjadi kesalahan jaringan',
    SERVER_ERROR: 'Terjadi kesalahan server',
    CONNECTION_FAILED: 'Koneksi gagal',
    
    // General errors
    OPERATION_FAILED: 'Operasi gagal dilakukan',
    UNEXPECTED_ERROR: 'Terjadi kesalahan yang tidak terduga',
    SOMETHING_WENT_WRONG: 'Terjadi kesalahan',
} as const;

// Helper function to get message by key
export const getSuccessMessage = (key: keyof typeof SUCCESS_MESSAGES): string => {
    return SUCCESS_MESSAGES[key];
};

export const getErrorMessage = (key: keyof typeof ERROR_MESSAGES): string => {
    return ERROR_MESSAGES[key];
};
