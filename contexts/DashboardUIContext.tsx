
import { createContext } from 'react';

export const DashboardUIContext = createContext<{ 
    setHeaderHidden: (hidden: boolean) => void;
    setActiveTab?: (tab: string) => void;
}>({ 
    setHeaderHidden: () => {} 
});
