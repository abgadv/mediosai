
export const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '-';
    // If it's already in DD/MM/YYYY, return it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    
    // Handle YYYY-MM-DD (standard input date format)
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    return dateStr;
};

export const formatLongDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
};
