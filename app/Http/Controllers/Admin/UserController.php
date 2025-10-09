<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $role = $request->get('role');
        $approved = $request->get('approved');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = User::withCount(['files', 'folders']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role', $role);
        }

        if ($approved !== null && $approved !== '') {
            $query->where('approved', $approved === '1');
        }

        $users = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        // Get statistics
        $stats = [
            'totalUsers' => User::count(),
            'adminUsers' => User::whereIn('role', ['admin', 'super-admin'])->count(),
            'staffUsers' => User::where('role', 'staff')->count(),
            'regularUsers' => User::where('role', 'user')->count(),
            'approvedUsers' => User::where('approved', true)->count(),
            'unapprovedUsers' => User::where('approved', false)->count(),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'approved' => $approved,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    public function create(): Response
    {
        $roles = ['user', 'staff', 'admin', 'super-admin'];
        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,staff,user,super-admin',
            'storage_limit' => 'nullable|integer|min:0',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'storage_limit' => $request->storage_limit ?? 1073741824, // 1GB default
            'approved' => true, // Admin-created users are approved by default
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user): Response
    {
        $user->load(['files', 'folders']);

        // Get recent activity
        $recentFiles = $user->files()
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        $recentFolders = $user->folders()
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'recentFiles' => $recentFiles,
            'recentFolders' => $recentFolders,
        ]);
    }

    public function edit(User $user): Response
    {
        $roles = ['user', 'staff', 'admin', 'super-admin'];
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|in:admin,staff,user,super-admin',
            'storage_limit' => 'nullable|integer|min:0',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'storage_limit' => $request->storage_limit,
        ];

        if ($request->password) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->withErrors([
                'error' => 'You cannot delete your own account.'
            ]);
        }

        if (in_array($user->role, ['admin', 'super-admin']) && User::whereIn('role', ['admin', 'super-admin'])->count() <= 1) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot delete the last admin user.'
            ]);
        }
        foreach ($user->files as $file) {
            if ($file->storageLocation) {
                $diskKey = $file->storageLocation->diskKey();
                if (Storage::disk($diskKey)->exists($file->path)) {
                    Storage::disk($diskKey)->delete($file->path);
                }
            }
            if ($file->visibility === 'private') {
                $file->forceDelete();
            }
        }

        foreach ($user->folders as $folder) {
            $folder->forceDelete();
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        $user->update([
            'is_active' => !$user->is_active,
        ]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return redirect()->back()->with('success', "User {$status} successfully.");
    }

    public function toggleApproval(User $user): RedirectResponse
    {
        $user->update([
            'approved' => !$user->approved,
        ]);

        $status = $user->approved ? 'approved' : 'disapproved';

        return redirect()->back()->with('success', "User {$status} successfully.");
    }
}
