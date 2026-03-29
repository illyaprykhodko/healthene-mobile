// outsource dependencies
import React from 'react';
// local dependencies
import { UpdatePolicy } from 'types';
import ConfirmationAlert from 'components/ConfirmationAlert';

interface SoftUpdateModalProps {
    visible: boolean;
    onCancel: () => void;
    onUpdate: () => void;
    policy: UpdatePolicy | null;
}

export const SoftUpdateModal: React.FC<SoftUpdateModalProps> = ({
    policy,
    visible,
    onCancel,
    onUpdate,
}) => {
    if (!policy) { return null; }

    return (
        <ConfirmationAlert
            isOpen={visible}
            applyTxt="Update"
            cancelTxt="Cancel"
            onClose={onCancel}
            onSubmit={onUpdate}
            message={policy.message}
            title={policy.title || 'Update Available'}
        />
    );
};
