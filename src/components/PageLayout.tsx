import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'full' | 'screen-2xl' | 'screen-xl';
}

function PageLayout({ children, maxWidth = 'screen-2xl' }: PageLayoutProps) {
  const maxWidthClass = maxWidth === 'full' 
    ? 'max-w-full' 
    : maxWidth === 'screen-xl'
    ? 'max-w-screen-xl'
    : 'max-w-screen-2xl';

  return (
    <div className={`w-full ${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-10 py-6`}>
      {children}
    </div>
  );
}

export default PageLayout;
