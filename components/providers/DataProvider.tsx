"use client";

import React, { createContext, useContext, useRef, useCallback } from "react";

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

interface DataContextType {
    getCachedData: <T>(key: string) => T | null;
    setCachedData: <T>(key: string, data: T, ttl?: number) => void;
    clearCache: (key?: string, prefix?: boolean) => void;
    masterDataCache: React.MutableRefObject<Record<string, any>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function DataProvider({ children }: { children: React.ReactNode }) {
    const cache = useRef<Record<string, CacheItem<any>>>({});
    const masterDataCache = useRef<Record<string, any>>({});

    const getCachedData = useCallback(<T,>(key: string): T | null => {
        const item = cache.current[key];
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > (DEFAULT_TTL);
        if (isExpired) {
            delete cache.current[key];
            return null;
        }

        return item.data as T;
    }, []);

    const setCachedData = useCallback(<T,>(key: string, data: T) => {
        cache.current[key] = {
            data,
            timestamp: Date.now(),
        };
    }, []);

    const clearCache = useCallback((key?: string, prefix?: boolean) => {
        if (key) {
            if (prefix) {
                Object.keys(cache.current).forEach((k) => {
                    if (k.startsWith(key)) {
                        delete cache.current[k];
                    }
                });
            } else {
                delete cache.current[key];
            }
        } else {
            cache.current = {};
        }
    }, []);

    return (
        <DataContext.Provider value={{ getCachedData, setCachedData, clearCache, masterDataCache }}>
            {children}
        </DataContext.Provider>
    );
}

export function useDataCache() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useDataCache must be used within a DataProvider");
    }
    return context;
}
