import React from 'react';

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 10v2a7 7 0 01-14 0v-2"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19v3"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 22h8"
        />
    </svg>
);

export default MicrophoneIcon;
