export interface FilterHistoryItem {
  id: string;
  name: string;
  filter: any;
  tableName: string;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export function useFilterHistory(tableName: string) {
  const storageKey = `filterHistory_${tableName}`;

  // Generate auto name for filter
  const generateFilterName = (filter: any): string => {
    if (!filter?.conditions?.length) {
      return 'Empty Filter';
    }
    
    const conditionCount = filter.conditions.length;
    const firstCondition = filter.conditions[0];
    
    if (conditionCount === 1 && firstCondition.field) {
      const field = firstCondition.field;
      const operator = firstCondition.operator || 'filter';
      const value = firstCondition.value;
      
      // Format operator display (all operators have underscore prefix)
      const operatorDisplayMap: Record<string, string> = {
        '_eq': '=',
        '_ne': '≠',
        '_gt': '>',
        '_gte': '≥',
        '_lt': '<',
        '_lte': '≤',
        '_like': 'contains',
        '_ilike': 'contains',
        '_in': 'in',
        '_nin': 'not in',
        '_null': 'is empty',
        '_nnull': 'is not empty'
      };
      
      const displayOperator = operatorDisplayMap[operator] || operator;
      
      // Format value display
      if (!value && (operator === 'null' || operator === 'nnull')) {
        return `${field} ${displayOperator}`;
      }
      
      if (Array.isArray(value)) {
        const displayValue = value.length > 2 
          ? `[${value.slice(0, 2).join(', ')}... +${value.length - 2}]`
          : `[${value.join(', ')}]`;
        return `${field} ${displayOperator} ${displayValue}`;
      }
      
      // Truncate long values
      let displayValue = String(value || '');
      if (displayValue.length > 20) {
        displayValue = displayValue.slice(0, 20) + '...';
      }
      
      return `${field} ${displayOperator} "${displayValue}"`;
    }
    
    // Multiple conditions - show summary
    const fieldCount = new Set(filter.conditions.map((c: any) => c.field).filter(Boolean)).size;
    const operatorType = filter.operator || 'and';
    
    if (fieldCount === 1) {
      const field = filter.conditions.find((c: any) => c.field)?.field;
      return `${field} (${conditionCount} ${operatorType} conditions)`;
    }
    
    return `${fieldCount} fields (${conditionCount} ${operatorType} conditions)`;
  };

  // Get all filter history for this table
  const getFilterHistory = (): FilterHistoryItem[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      // Fix old filter names that don't have proper display names
      const fixedHistory = history.map((item: FilterHistoryItem) => {
        // If name looks like "field_operator" pattern or contains "_eq", "_ne", etc., regenerate it
        const hasOldPattern = item.name && (
          /^[a-zA-Z_]+_(_?eq|_?ne|_?gt|_?gte|_?lt|_?lte|_?like|_?ilike|_?in|_?nin|_?null|_?nnull)(\s|$)/.test(item.name) ||
          item.name.includes(' _eq ') ||
          item.name.includes(' _ne ') ||
          item.name.includes(' _gt ') ||
          item.name.includes(' _lt ') ||
          item.name.includes(' _like ') ||
          item.name.includes(' _in ')
        );
        
        if (hasOldPattern) {
          return {
            ...item,
            name: generateFilterName(item.filter)
          };
        }
        return item;
      });
      
      // Save back the fixed history
      if (JSON.stringify(fixedHistory) !== JSON.stringify(history)) {
        localStorage.setItem(storageKey, JSON.stringify(fixedHistory));
      }
      
      return fixedHistory;
    } catch (error) {
      console.warn('Failed to load filter history:', error);
      return [];
    }
  };

  // Add filter to history
  const addToHistory = (filter: any, customName?: string): void => {
    try {
      const history = getFilterHistory();
      const now = new Date().toISOString();
      
      // Generate auto name if not provided
      const name = customName || generateFilterName(filter);
      
      // Check for duplicates (same filter structure + tableName, ignoring all id fields)
      const normalizeFilter = (filter: any, tableName: string): string => {
        const removeIds = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(removeIds);
          }
          if (obj && typeof obj === 'object') {
            const { id, ...rest } = obj;
            const result: any = {};
            for (const key in rest) {
              result[key] = removeIds(rest[key]);
            }
            return result;
          }
          return obj;
        };
        
        // Include tableName in the normalized key to ensure filters are table-specific
        return `${tableName}:${JSON.stringify(removeIds(filter))}`;
      };
      
      const existingIndex = history.findIndex(item => 
        normalizeFilter(item.filter, item.tableName) === normalizeFilter(filter, tableName)
      );
      
      if (existingIndex >= 0) {
        // Update existing filter
        const existingItem = history[existingIndex];
        if (existingItem) {
          existingItem.lastUsed = now;
          existingItem.useCount += 1;
          if (customName) {
            existingItem.name = customName;
          }
        }
      } else {
        // Add new filter
        const newItem: FilterHistoryItem = {
          id: generateId(),
          name,
          filter: JSON.parse(JSON.stringify(filter)), // Deep clone
          tableName,
          createdAt: now,
          lastUsed: now,
          useCount: 1
        };
        history.unshift(newItem);
      }
      
      // Keep only last 50 filters
      if (history.length > 50) {
        history.splice(50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save filter to history:', error);
    }
  };

  // Remove filter from history
  const removeFromHistory = (filterId: string): void => {
    try {
      const history = getFilterHistory();
      const filtered = history.filter(item => item.id !== filterId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to remove filter from history:', error);
    }
  };

  // Update filter name
  const updateFilterName = (filterId: string, newName: string): void => {
    try {
      const history = getFilterHistory();
      const item = history.find(item => item.id === filterId);
      if (item) {
        item.name = newName;
        localStorage.setItem(storageKey, JSON.stringify(history));
      }
    } catch (error) {
      console.warn('Failed to update filter name:', error);
    }
  };

  // Increment use count when filter is applied
  const incrementUseCount = (filterId: string): void => {
    try {
      const history = getFilterHistory();
      const item = history.find(item => item.id === filterId);
      if (item) {
        item.lastUsed = new Date().toISOString();
        item.useCount += 1;
        localStorage.setItem(storageKey, JSON.stringify(history));
      }
    } catch (error) {
      console.warn('Failed to increment use count:', error);
    }
  };

  // Clear all history
  const clearHistory = (): void => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear filter history:', error);
    }
  };

  // Get popular filters (most used)
  const getPopularFilters = (limit: number = 5): FilterHistoryItem[] => {
    try {
      const history = getFilterHistory();
      return history
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, limit);
    } catch (error) {
      console.warn('Failed to get popular filters:', error);
      return [];
    }
  };

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  return {
    getFilterHistory,
    addToHistory,
    removeFromHistory,
    updateFilterName,
    incrementUseCount,
    clearHistory,
    getPopularFilters
  };
}