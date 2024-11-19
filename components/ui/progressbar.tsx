// ProgressBar.tsx

import React from 'react';

type ProgressBarProps = {
    percentage: number;
    isOutOfLimits: boolean;
    minCredits: number;
    maxCredits: number;
    currentCredits: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    percentage,
    isOutOfLimits,
    minCredits,
    maxCredits,
    currentCredits,
}) => {
    const barColor = isOutOfLimits ? 'bg-red-500' : 'bg-green-500';
    const normalizedPercentage = Math.min(100, Math.max(0, percentage));

    return (
        <div className="w-full bg-gray-300 rounded h-4 relative">
            <div
                className={`h-4 rounded ${barColor}`}
                style={{ width: `${normalizedPercentage}%` }}
            ></div>
            <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-white px-1">
                <span>{currentCredits} ECTS</span>
                <span>{normalizedPercentage.toFixed(0)}%</span>
            </div>
        </div>
    );
};
