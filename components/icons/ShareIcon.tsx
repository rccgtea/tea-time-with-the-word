import React from 'react';

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.082a2.25 2.25 0 012.186 2.186c-.032.198-.057.393-.082.588m0 0a2.25 2.25 0 002.186 2.186c.198-.032.393-.057.588-.082m-2.186 2.186a2.25 2.25 0 100-2.186m0 2.186c-.195-.025-.39-.05-.588-.082a2.25 2.25 0 01-2.186-2.186c.032-.198.057-.393.082-.588m0 0a2.25 2.25 0 00-2.186-2.186c-.198.032-.393.057-.588.082m2.186-2.186a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.082a2.25 2.25 0 012.186 2.186c-.032.198-.057.393-.082.588"
    />
  </svg>
);

export default ShareIcon;
