// outsource dependencies
import { useCallback, useState } from 'react';
// local dependencies
import { config } from '../constants';
import { MessageService } from '../services/messages';
import { useForgotPasswordMutation } from '../store/api/authApi';

export const useForgotPassword = () => {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendResetEmail = useCallback(async (email: string) => {
        try {
            setError(null);
            setSuccess(false);

            await forgotPassword({
                email,
                resetUrl: `${config.websiteUrl}/public/change-password/`,
            }).unwrap();
      
            setEmail(email);
            setSuccess(true);
      
            MessageService.success({
                uid: 'ForgotPassword',
                title: 'Email Sent',
                message: 'Password reset instructions have been sent to your email',
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
            setError(errorMessage);
      
            MessageService.error({
                uid: 'ForgotPassword',
                title: 'Error',
                message: errorMessage,
            });
            throw error;
        }
    }, [forgotPassword]);

    const reset = useCallback(() => {
        setEmail('');
        setSuccess(false);
        setError(null);
    }, []);

    return {
        sendResetEmail,
        reset,
        email,
        success,
        error,
        isLoading,
    };
};
