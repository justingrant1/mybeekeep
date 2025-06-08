import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Event as EventIcon,
  Today as TodayIcon,
  CalendarViewMonth as CalendarViewMonthIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  FilterList as FilterListIcon,
  BugReport as TreatmentIcon,
  LocalFlorist as InspectionIcon,
  Grass as FeedingIcon,
  Build as EquipmentIcon,
  Favorite as QueenIcon,
  Warning as SwarmIcon,
  WbSunny as WeatherIcon,
  More as OtherIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format, addMonths, addDays, subMonths, subDays, isSameDay, isSameMonth, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  CalendarEvent,
  EventType,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../../lib/calendar';

// Map event types to icons
const eventTypeIcons: Record<EventType, React.ReactElement> = {
  [EventType.INSPECTION]: <InspectionIcon />,
  [EventType.TREATMENT]: <TreatmentIcon />,
  [EventType.HARVEST]: <EventIcon />,
  [EventType.FEEDING]: <FeedingIcon />,
  [EventType.EQUIPMENT]: <EquipmentIcon />,
  [EventType.QUEEN_CHECK]: <QueenIcon />,
  [EventType.SWARM_PREVENTION]: <SwarmIcon />,
  [EventType.WEATHER_ALERT]: <WeatherIcon />,
  [EventType.OTHER]: <OtherIcon />,
};

// Map event types to colors
const eventTypeColors: Record<EventType, string> = {
  [EventType.INSPECTION]: '#4CAF50', // Green
  [EventType.TREATMENT]: '#F44336', // Red
  [EventType.HARVEST]: '#FFC107', // Amber
  [EventType.FEEDING]: '#FF9800', // Orange
  [EventType.EQUIPMENT]: '#795548', // Brown
  [EventType.QUEEN_CHECK]: '#9C27B0', // Purple
  [EventType.SWARM_PREVENTION]: '#E91E63', // Pink
  [EventType.WEATHER_ALERT]: '#2196F3', // Blue
  [EventType.OTHER]: '#607D8B', // Blue Grey
};

// StyledDay component for calendar days
const StyledDay = styled(Paper)(({ theme }) => ({
  height: '100px',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down('sm')]: {
    height: '80px',
    padding: theme.spacing(0.5),
  },
}));

// StyledEvent component for calendar events
const StyledEvent = styled(Box)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  backgroundColor: bgcolor,
  color: theme.palette.getContrastText(bgcolor),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  marginBottom: theme.spacing(0.5),
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  cursor: 'pointer',
  '&:hover': {
    filter: 'brightness(0.9)',
  },
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.25, 0.5),
    fontSize: '0.6rem',
  },
}));

// Filter options for calendar events
interface FilterOptions {
  types: EventType[];
  apiaryId?: string;
  hiveIds: string[];
  showCompleted: boolean;
}

// Calendar view modes
type ViewMode = 'month' | 'week' | 'day' | 'agenda';

// Props for the CalendarView component
interface CalendarViewProps {
  initialDate?: Date;
  initialView?: ViewMode;
}

// Main CalendarView component
const CalendarView: React.FC<CalendarViewProps> = ({
  initialDate = new Date(),
  initialView = 'month',
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [apiaries, setApiaries] = useState<{ id: string; name: string }[]>([]);
  const [hives, setHives] = useState<{ id: string; name: string; apiary_id: string }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    start_date: new Date().toISOString(),
    all_day: true,
    type: EventType.INSPECTION,
    priority: 'medium',
    reminders: [],
  });
  const [filters, setFilters] = useState<FilterOptions>({
    types: Object.values(EventType),
    hiveIds: [],
    showCompleted: false,
  });

  // Fetch apiaries and hives
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: apiaryData, error: apiaryError } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('user_id', user.id);
      if (apiaryError) console.error('Error fetching apiaries', apiaryError);
      else setApiaries(apiaryData || []);

      if (apiaryData) {
        const { data: hiveData, error: hiveError } = await supabase
          .from('hives')
          .select('id, name, apiary_id')
          .in('apiary_id', apiaryData.map(a => a.id));
        if (hiveError) console.error('Error fetching hives', hiveError);
        else setHives(hiveData || []);
      }
    };
    fetchData();
  }, [user]);
  
  // Load events for the current view
  const loadEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let startDate: Date;
      let endDate: Date;
      
      // Calculate date range based on view mode
      switch (viewMode) {
        case 'month':
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
          break;
        case 'week':
          startDate = startOfWeek(currentDate);
          endDate = endOfWeek(currentDate);
          break;
        case 'day':
          startDate = currentDate;
          endDate = addDays(currentDate, 1);
          break;
        case 'agenda':
          startDate = currentDate;
          endDate = addMonths(currentDate, 3);
          break;
        default:
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
      }
      
      const result = await getCalendarEvents(
        supabase,
        user.id,
        startDate.toISOString(),
        endDate.toISOString(),
        {
          types: filters.types,
          apiaryId: filters.apiaryId,
          hiveIds: filters.hiveIds.length > 0 ? filters.hiveIds : undefined,
          completed: filters.showCompleted ? undefined : false,
        }
      );
      
      if (result.success && result.data) {
        setEvents(result.data);
      } else {
        setError(result.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, viewMode, filters]);
  
  // Load events when dependencies change
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);
  
  // Handle navigation
  const handlePrevious = () => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subDays(currentDate, 7));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'agenda':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };
  
  const handleNext = () => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'agenda':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSaveEvent = async () => {
    if (!user || !newEvent.title) return;

    const eventToSave = {
      ...newEvent,
      user_id: user.id,
    };

    let result;
    if (selectedEvent) {
      // Update existing event
      result = await updateCalendarEvent(supabase, selectedEvent.id, eventToSave);
    } else {
      // Create new event
      result = await createCalendarEvent(supabase, eventToSave as Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>);
    }

    if (result.success) {
      setEventDialogOpen(false);
      loadEvents(); // Refresh events
    } else {
      setError(result.error || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    const result = await deleteCalendarEvent(supabase, selectedEvent.id);
    if (result.success) {
      setEventDialogOpen(false);
      loadEvents(); // Refresh events
    } else {
      setError(result.error || 'Failed to delete event');
    }
  };
  
  // Handle opening the event dialog
  const handleOpenEventDialog = (event?: CalendarEvent, date?: Date) => {
    if (event) {
      // Edit existing event
      setSelectedEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        all_day: event.all_day,
        type: event.type,
        location: event.location,
        apiary_id: event.apiary_id,
        hive_ids: event.hive_ids,
        priority: event.priority,
        reminders: event.reminders,
        weather_dependent: event.weather_dependent,
        tags: event.tags,
      });
    } else {
      // Create new event
      const startDate = date || new Date();
      setSelectedEvent(null);
      setNewEvent({
        title: '',
        description: '',
        start_date: startDate.toISOString(),
        all_day: true,
        type: EventType.INSPECTION,
        priority: 'medium',
        reminders: [],
      });
    }
    
    setEventDialogOpen(true);
  };
  
  // Render a single event
  const renderEvent = (event: CalendarEvent) => {
    const color = event.color || eventTypeColors[event.type];
    return (
      <StyledEvent
        key={event.id}
        bgcolor={color}
        onClick={() => handleOpenEventDialog(event)}
        sx={{
          textDecoration: event.completed ? 'line-through' : 'none',
          opacity: event.completed ? 0.7 : 1,
        }}
      >
        {eventTypeIcons[event.type]}
        <Typography variant="caption" noWrap>
          {event.title}
        </Typography>
      </StyledEvent>
    );
  };
  
  // Render a calendar day cell
  const renderDay = (day: Date, isCurrentMonth: boolean = true) => {
    const isToday = isSameDay(day, new Date());
    const dayEvents = events.filter(event => {
      const eventStartDate = parseISO(event.start_date);
      const eventEndDate = event.end_date ? parseISO(event.end_date) : eventStartDate;
      
      return isWithinInterval(day, {
        start: eventStartDate,
        end: eventEndDate,
      });
    });
    
    // Sort events by priority
    dayEvents.sort((a, b) => {
      // First sort by priority (high > medium > low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as 'high' | 'medium' | 'low'] - 
                          priorityOrder[b.priority as 'high' | 'medium' | 'low'];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by all-day (all-day first)
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      
      // Then sort by time
      return parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime();
    });
    
    return (
      <StyledDay
        elevation={isToday ? 3 : 0}
        onClick={() => handleOpenEventDialog(undefined, day)}
        sx={{
          ...(isToday && {
            border: `1px solid ${theme.palette.primary.main}`,
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          }),
          ...(!isCurrentMonth && {
            opacity: 0.5,
          }),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: isToday ? 'bold' : 'normal',
            mb: 0.5,
          }}
        >
          {format(day, 'd')}
        </Typography>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {dayEvents.slice(0, 3).map(renderEvent)}
          {dayEvents.length > 3 && (
            <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
              +{dayEvents.length - 3} more
            </Typography>
          )}
        </Box>
      </StyledDay>
    );
  };
  
  // Render the month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <Grid container spacing={1}>
        {/* Day names */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Grid item xs={12/7} key={day}>
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="subtitle2">{day}</Typography>
            </Box>
          </Grid>
        ))}
        
        {/* Day cells */}
        {days.map((day, index) => (
          <Grid item xs={12/7} key={index}>
            {renderDay(day, isSameMonth(day, currentDate))}
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Calendar toolbar with navigation and view controls
  const renderToolbar = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handlePrevious} size="small">
          <ArrowBackIcon />
        </IconButton>
        <IconButton onClick={handleNext} size="small">
          <ArrowForwardIcon />
        </IconButton>
        <Button onClick={handleToday} startIcon={<TodayIcon />} sx={{ ml: 1 }}>
          Today
        </Button>
        <Typography variant="h6" sx={{ ml: 2 }}>
          {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Month View">
          <IconButton
            onClick={() => setViewMode('month')}
            color={viewMode === 'month' ? 'primary' : 'default'}
          >
            <CalendarViewMonthIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Week View">
          <IconButton
            onClick={() => setViewMode('week')}
            color={viewMode === 'week' ? 'primary' : 'default'}
          >
            <ViewWeekIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Day View">
          <IconButton
            onClick={() => setViewMode('day')}
            color={viewMode === 'day' ? 'primary' : 'default'}
          >
            <ViewDayIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Filter Events">
          <IconButton onClick={() => {/* Open filter dialog */}}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenEventDialog()}
          sx={{ ml: 2 }}
        >
          Add Event
        </Button>
      </Box>
    </Box>
  );
  
  // Event Dialog
  const renderEventDialog = () => (
    <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {selectedEvent ? 'Edit Event' : 'New Event'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Title"
          fullWidth
          value={newEvent.title || ''}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={newEvent.description || ''}
          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
        />
        
        <FormControl fullWidth margin="dense">
          <InputLabel>Event Type</InputLabel>
          <Select
            value={newEvent.type || EventType.INSPECTION}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
            label="Event Type"
          >
            {Object.entries(EventType).map(([key, value]) => (
              <MenuItem key={value} value={value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {eventTypeIcons[value]}
                  <Box sx={{ ml: 1 }}>{key}</Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControlLabel
          control={
            <Switch
              checked={newEvent.all_day || false}
              onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
            />
          }
          label="All Day Event"
          sx={{ mt: 1 }}
        />
        
        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            value={newEvent.priority || 'medium'}
            onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as 'high' | 'medium' | 'low' })}
            label="Priority"
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        {selectedEvent && (
          <Button onClick={handleDeleteEvent} color="error">
            Delete
          </Button>
        )}
        <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleSaveEvent} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {renderToolbar()}
      
      <Divider sx={{ mb: 2 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading events...</Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {/* Implement other views as needed */}
        </>
      )}
      
      {renderEventDialog()}
    </Box>
  );
};

export default CalendarView;
