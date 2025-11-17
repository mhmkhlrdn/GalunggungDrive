<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Only admin and super-admin can access
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

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

        return response()->json([
            'status' => 'success',
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,staff,user,super-admin',
            'storage_limit' => 'nullable|integer|min:0',
        ]);

        $newUser = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'storage_limit' => $request->storage_limit ?? 1073741824, // 1GB default
            'approved' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'data' => $newUser,
        ], 201);
    }

    public function show(User $user)
    {
        $authUser = Auth::user();

        if (!$authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $user->loadCount(['files', 'folders']);

        return response()->json([
            'status' => 'success',
            'data' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $authUser = Auth::user();

        if (!$authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

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

        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully',
            'data' => $user,
        ]);
    }

    public function destroy(User $user)
    {
        $authUser = Auth::user();

        if (!$authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($user->id === $authUser->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot delete your own account.',
            ], 400);
        }

        if (in_array($user->role, ['admin', 'super-admin']) && User::whereIn('role', ['admin', 'super-admin'])->count() <= 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete the last admin user.',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully',
        ]);
    }

    public function toggleApproval(User $user)
    {
        $authUser = Auth::user();

        if (!$authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $user->update([
            'approved' => !$user->approved,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "User " . ($user->approved ? 'approved' : 'disapproved') . " successfully",
            'data' => $user,
        ]);
    }
}

