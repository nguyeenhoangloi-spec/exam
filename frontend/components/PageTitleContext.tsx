'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PageTitleContextValue {
    title: string;
    setTitle: (title: string) => void;
}

const DEFAULT_TITLE = 'Hệ thống Quản lý Khảo thí';

const PageTitleContext = createContext<PageTitleContextValue>({
    title: DEFAULT_TITLE,
    setTitle: () => { },
});

export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState(DEFAULT_TITLE);
    return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>;
};

/**
 * Pages call this hook to set the header title without re-rendering the shell.
 */
export const usePageTitle = (title: string) => {
    const { setTitle } = useContext(PageTitleContext);
    useEffect(() => {
        setTitle(title);
    }, [title, setTitle]);
};

export const usePageTitleValue = (): string => useContext(PageTitleContext).title;
