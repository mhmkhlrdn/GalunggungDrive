<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            // Add indexes for common query patterns
            $table->index(['user_id', 'folder_id', 'deleted_at'], 'files_user_folder_deleted_idx');
            $table->index(['folder_id', 'deleted_at'], 'files_folder_deleted_idx');
            $table->index(['mime_type', 'deleted_at'], 'files_mime_type_deleted_idx');
            $table->index(['visibility', 'deleted_at'], 'files_visibility_deleted_idx');
            $table->index(['updated_at', 'deleted_at'], 'files_updated_deleted_idx');
            $table->index(['disk_id', 'deleted_at'], 'files_disk_deleted_idx');
            $table->index(['name', 'deleted_at'], 'files_name_deleted_idx');
        });

        Schema::table('folders', function (Blueprint $table) {
            // Add indexes for folder queries
            $table->index(['user_id', 'parent_id', 'deleted_at'], 'folders_user_parent_deleted_idx');
            $table->index(['parent_id', 'deleted_at'], 'folders_parent_deleted_idx');
            $table->index(['visibility', 'deleted_at'], 'folders_visibility_deleted_idx');
            $table->index(['name', 'deleted_at'], 'folders_name_deleted_idx');
        });

        Schema::table('file_shares', function (Blueprint $table) {
            // Add indexes for share queries
            $table->index(['file_id', 'shared_with', 'expires_at'], 'file_shares_file_shared_expires_idx');
            $table->index(['shared_with', 'expires_at'], 'file_shares_shared_expires_idx');
        });

        Schema::table('folder_shares', function (Blueprint $table) {
            // Add indexes for folder share queries
            $table->index(['folder_id', 'shared_with', 'expires_at'], 'folder_shares_folder_shared_expires_idx');
            $table->index(['shared_with', 'expires_at'], 'folder_shares_shared_expires_idx');
        });

        Schema::table('user_starred', function (Blueprint $table) {
            // Add indexes for starred files
            $table->index(['user_id', 'file_id'], 'user_starred_user_file_idx');
            $table->index(['file_id'], 'user_starred_file_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            // Add indexes for activity logs
            $table->index(['user_id', 'created_at'], 'activity_logs_user_created_idx');
            $table->index(['target_type', 'target_id'], 'activity_logs_target_idx');
            $table->index(['action', 'created_at'], 'activity_logs_action_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropIndex('files_user_folder_deleted_idx');
            $table->dropIndex('files_folder_deleted_idx');
            $table->dropIndex('files_mime_type_deleted_idx');
            $table->dropIndex('files_visibility_deleted_idx');
            $table->dropIndex('files_updated_deleted_idx');
            $table->dropIndex('files_disk_deleted_idx');
            $table->dropIndex('files_name_deleted_idx');
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->dropIndex('folders_user_parent_deleted_idx');
            $table->dropIndex('folders_parent_deleted_idx');
            $table->dropIndex('folders_visibility_deleted_idx');
            $table->dropIndex('folders_name_deleted_idx');
        });

        Schema::table('file_shares', function (Blueprint $table) {
            $table->dropIndex('file_shares_file_shared_expires_idx');
            $table->dropIndex('file_shares_shared_expires_idx');
        });

        Schema::table('folder_shares', function (Blueprint $table) {
            $table->dropIndex('folder_shares_folder_shared_expires_idx');
            $table->dropIndex('folder_shares_shared_expires_idx');
        });

        Schema::table('user_starred', function (Blueprint $table) {
            $table->dropIndex('user_starred_user_file_idx');
            $table->dropIndex('user_starred_file_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_user_created_idx');
            $table->dropIndex('activity_logs_target_idx');
            $table->dropIndex('activity_logs_action_created_idx');
        });
    }
};
