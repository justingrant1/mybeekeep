import { SupabaseClient } from '@supabase/supabase-js';

// Enum for event types
export enum EventType {
  INSPECTION = 'inspection',
  TREATMENT = 'treatment',
  HARVEST = 'harvest',
  FEEDING = 'feeding',
  EQUIPMENT = 'equipment',
  QUEEN_CHECK = 'queen_check',
  SWARM_PREVENTION = 'swarm_prevention',
  WEATHER_ALERT = 'weather_alert',
  OTHER = 'other',
}

// Enum for notification types
export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

// Recurrence pattern for events
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO date string
  count?: number;
}

// Reminder for events
export interface Reminder {
  type: NotificationType;
  minutes_before: number;
  sent: boolean;
}

// Calendar event interface
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  all_day: boolean;
  type: EventType;
  location?: string;
  apiary_id?: string;
  hive_ids?: string[];
  reminders?: Reminder[];
  recurrence?: RecurrencePattern;
  color?: string;
  priority: 'high' | 'medium' | 'low';
  weather_dependent?: boolean;
  completed?: boolean;
  completed_at?: string; // ISO date string
  notes?: string;
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  tags?: string[];
}

// Filtering options for calendar events
export interface CalendarEventFilters {
  types?: EventType[];
  apiaryId?: string;
  hiveIds?: string[];
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Response type for API calls
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Climate zones for beekeeping
export const CLIMATE_ZONES = [
  { id: 'northeast', name: 'Northeast' },
  { id: 'southeast', name: 'Southeast' },
  { id: 'midwest', name: 'Midwest' },
  { id: 'northwest', name: 'Northwest' },
  { id: 'southwest', name: 'Southwest' },
  { id: 'southern', name: 'Southern' },
];

// Seasonal activities for beekeeping
export const SEASONAL_ACTIVITIES = {
  northeast: {
    spring: [
      { title: 'Hive inspection', type: EventType.INSPECTION, priority: 'high' },
      { title: 'Varroa mite check', type: EventType.TREATMENT, priority: 'high' },
      { title: 'Add honey super', type: EventType.EQUIPMENT, priority: 'medium' },
      { title: 'Swarm prevention check', type: EventType.SWARM_PREVENTION, priority: 'high' },
    ],
    summer: [
      { title: 'Honey harvest', type: EventType.HARVEST, priority: 'medium' },
      { title: 'Check for queen cells', type: EventType.QUEEN_CHECK, priority: 'medium' },
      { title: 'Monitor for pests', type: EventType.INSPECTION, priority: 'medium' },
    ],
    fall: [
      { title: 'Varroa treatment', type: EventType.TREATMENT, priority: 'high' },
      { title: 'Final honey harvest', type: EventType.HARVEST, priority: 'medium' },
      { title: 'Winter feeding', type: EventType.FEEDING, priority: 'high' },
      { title: 'Winterization', type: EventType.EQUIPMENT, priority: 'high' },
    ],
    winter: [
      { title: 'Check food stores', type: EventType.INSPECTION, priority: 'high' },
      { title: 'Emergency feeding if needed', type: EventType.FEEDING, priority: 'high' },
      { title: 'Equipment maintenance', type: EventType.EQUIPMENT, priority: 'low' },
    ],
  },
  // Other climate zones would have similar structures
};

// Get calendar events from Supabase
export const getCalendarEvents = async (
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
  filters?: CalendarEventFilters
): Promise<ApiResponse<CalendarEvent[]>> => {
  try {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    if (filters) {
      if (filters.types && filters.types.length > 0) {
        query = query.in('type', filters.types);
      }
      if (filters.apiaryId) {
        query = query.eq('apiary_id', filters.apiaryId);
      }
      if (filters.hiveIds && filters.hiveIds.length > 0) {
        query = query.or(`hive_ids.cs.{${filters.hiveIds.join(',')}}`);
      }
      if (filters.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data as CalendarEvent[],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Create a calendar event in Supabase
export const createCalendarEvent = async (
  supabase: SupabaseClient,
  event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<CalendarEvent>> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as CalendarEvent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Update a calendar event in Supabase
export const updateCalendarEvent = async (
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>>
): Promise<ApiResponse<CalendarEvent>> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as CalendarEvent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Delete a calendar event from Supabase
export const deleteCalendarEvent = async (
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Mark an event as completed in Supabase
export const completeCalendarEvent = async (
  supabase: SupabaseClient,
  id: string,
  notes?: string
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Generate recommended events based on climate zone and season
export const generateRecommendedEvents = (
  userId: string,
  climateZone: string,
  apiaryId: string,
  hiveIds: string[],
  year: number
): CalendarEvent[] => {
  // Get activities for climate zone (fallback to northeast if not found)
  const zoneActivities = SEASONAL_ACTIVITIES[climateZone as keyof typeof SEASONAL_ACTIVITIES] || 
                         SEASONAL_ACTIVITIES.northeast;
  
  const events: CalendarEvent[] = [];
  
  // Spring activities (March to May)
  const springStart = new Date(year, 2, 1); // March 1
  
  zoneActivities.spring.forEach((activity, index) => {
    const startDate = new Date(springStart);
    startDate.setDate(startDate.getDate() + index * 14); // Space out activities
    
    events.push({
      id: `spring-${index}-${year}`,
      user_id: userId,
      title: activity.title,
      description: `Seasonal beekeeping task: ${activity.title}`,
      start_date: startDate.toISOString(),
      all_day: true,
      type: activity.type,
      priority: activity.priority as 'high' | 'medium' | 'low',
      apiary_id: apiaryId,
      hive_ids: hiveIds,
      tags: ['recommended', 'seasonal', 'spring'],
    });
  });
  
  // Summer activities (June to August)
  const summerStart = new Date(year, 5, 1); // June 1
  
  zoneActivities.summer.forEach((activity, index) => {
    const startDate = new Date(summerStart);
    startDate.setDate(startDate.getDate() + index * 14); // Space out activities
    
    events.push({
      id: `summer-${index}-${year}`,
      user_id: userId,
      title: activity.title,
      description: `Seasonal beekeeping task: ${activity.title}`,
      start_date: startDate.toISOString(),
      all_day: true,
      type: activity.type,
      priority: activity.priority as 'high' | 'medium' | 'low',
      apiary_id: apiaryId,
      hive_ids: hiveIds,
      tags: ['recommended', 'seasonal', 'summer'],
    });
  });
  
  // Fall activities (September to November)
  const fallStart = new Date(year, 8, 1); // September 1
  
  zoneActivities.fall.forEach((activity, index) => {
    const startDate = new Date(fallStart);
    startDate.setDate(startDate.getDate() + index * 14); // Space out activities
    
    events.push({
      id: `fall-${index}-${year}`,
      user_id: userId,
      title: activity.title,
      description: `Seasonal beekeeping task: ${activity.title}`,
      start_date: startDate.toISOString(),
      all_day: true,
      type: activity.type,
      priority: activity.priority as 'high' | 'medium' | 'low',
      apiary_id: apiaryId,
      hive_ids: hiveIds,
      tags: ['recommended', 'seasonal', 'fall'],
    });
  });
  
  // Winter activities (December to February)
  const winterStart = new Date(year, 11, 1); // December 1
  
  zoneActivities.winter.forEach((activity, index) => {
    const startDate = new Date(winterStart);
    startDate.setDate(startDate.getDate() + index * 21); // Space out activities more in winter
    
    events.push({
      id: `winter-${index}-${year}`,
      user_id: userId,
      title: activity.title,
      description: `Seasonal beekeeping task: ${activity.title}`,
      start_date: startDate.toISOString(),
      all_day: true,
      type: activity.type,
      priority: activity.priority as 'high' | 'medium' | 'low',
      apiary_id: apiaryId,
      hive_ids: hiveIds,
      tags: ['recommended', 'seasonal', 'winter'],
    });
  });
  
  return events;
};

// Calculate recurring events based on a recurring event
export const calculateRecurringEvents = (
  event: CalendarEvent,
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] => {
  if (!event.recurrence) {
    return [event];
  }
  
  const result: CalendarEvent[] = [];
  const eventStart = new Date(event.start_date);
  const eventEnd = event.end_date ? new Date(event.end_date) : null;
  const duration = eventEnd ? eventEnd.getTime() - eventStart.getTime() : 0;
  
  let current = new Date(eventStart);
  let untilDate = event.recurrence.until ? new Date(event.recurrence.until) : null;
  let count = event.recurrence.count || Infinity;
  
  // Add the original event if it falls within the view range
  if (eventStart >= viewStart && eventStart <= viewEnd) {
    result.push(event);
    count--;
  }
  
  // Loop to calculate recurring instances
  while (
    current <= viewEnd && 
    count > 0 && 
    (!untilDate || current <= untilDate)
  ) {
    // Calculate next occurrence based on frequency
    switch (event.recurrence.frequency) {
      case 'daily':
        current.setDate(current.getDate() + event.recurrence.interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + event.recurrence.interval * 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + event.recurrence.interval);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + event.recurrence.interval);
        break;
    }
    
    // If the next occurrence is within our view range and not past the until date
    if (
      current >= viewStart && 
      current <= viewEnd && 
      (!untilDate || current <= untilDate) && 
      count > 0
    ) {
      // Create a new instance
      const newEvent: CalendarEvent = {
        ...event,
        id: `${event.id}-${current.getTime()}`, // Generate a unique ID for this instance
        start_date: new Date(current).toISOString(),
        end_date: eventEnd ? new Date(current.getTime() + duration).toISOString() : undefined,
        // Mark this as a recurring instance
        tags: [...(event.tags || []), 'recurring-instance'],
      };
      
      result.push(newEvent);
      count--;
    }
  }
  
  return result;
};
