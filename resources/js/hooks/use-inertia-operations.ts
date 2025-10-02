import { router } from '@inertiajs/react';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/messages';

interface OperationOptions {
    successMessage?: string;
    errorMessage?: string;
    preserveScroll?: boolean;
    preserveState?: boolean;
    replace?: boolean;
    onSuccess?: () => void;
    onError?: (errors: any) => void;
}

export const useInertiaOperations = () => {
    const { showSuccess, showError } = useSnackbar();

    const post = (
        url: string,
        data: any = {},
        options: OperationOptions = {}
    ) => {
        const {
            successMessage = SUCCESS_MESSAGES.OPERATION_SUCCESS,
            errorMessage = ERROR_MESSAGES.OPERATION_FAILED,
            preserveScroll = true,
            preserveState = false,
            replace = false,
            onSuccess,
            onError
        } = options;

        router.post(url, data, {
            preserveScroll,
            preserveState,
            replace,
            onSuccess: (page) => {
                showSuccess(successMessage);
                onSuccess?.();
            },
            onError: (errors) => {
                // Check if there are specific error messages from the server
                const serverErrorMessage = Object.values(errors)[0] as string;
                showError(serverErrorMessage || errorMessage);
                onError?.(errors);
            }
        });
    };

    const put = (
        url: string,
        data: any = {},
        options: OperationOptions = {}
    ) => {
        const {
            successMessage = SUCCESS_MESSAGES.DATA_UPDATED,
            errorMessage = ERROR_MESSAGES.OPERATION_FAILED,
            preserveScroll = true,
            preserveState = false,
            replace = false,
            onSuccess,
            onError
        } = options;

        router.put(url, data, {
            preserveScroll,
            preserveState,
            replace,
            onSuccess: (page) => {
                showSuccess(successMessage);
                onSuccess?.();
            },
            onError: (errors) => {
                const serverErrorMessage = Object.values(errors)[0] as string;
                showError(serverErrorMessage || errorMessage);
                onError?.(errors);
            }
        });
    };

    const patch = (
        url: string,
        data: any = {},
        options: OperationOptions = {}
    ) => {
        const {
            successMessage = SUCCESS_MESSAGES.DATA_UPDATED,
            errorMessage = ERROR_MESSAGES.OPERATION_FAILED,
            preserveScroll = true,
            preserveState = false,
            replace = false,
            onSuccess,
            onError
        } = options;

        router.patch(url, data, {
            preserveScroll,
            preserveState,
            replace,
            onSuccess: (page) => {
                showSuccess(successMessage);
                onSuccess?.();
            },
            onError: (errors) => {
                const serverErrorMessage = Object.values(errors)[0] as string;
                showError(serverErrorMessage || errorMessage);
                onError?.(errors);
            }
        });
    };

    const destroy = (
        url: string,
        options: OperationOptions = {}
    ) => {
        const {
            successMessage = SUCCESS_MESSAGES.OPERATION_SUCCESS,
            errorMessage = ERROR_MESSAGES.OPERATION_FAILED,
            preserveScroll = true,
            preserveState = false,
            replace = false,
            onSuccess,
            onError
        } = options;

        router.delete(url, {
            preserveScroll,
            preserveState,
            replace,
            onSuccess: (page) => {
                showSuccess(successMessage);
                onSuccess?.();
            },
            onError: (errors) => {
                const serverErrorMessage = Object.values(errors)[0] as string;
                showError(serverErrorMessage || errorMessage);
                onError?.(errors);
            }
        });
    };

    return {
        post,
        put,
        patch,
        destroy,
        showSuccess,
        showError
    };
};
