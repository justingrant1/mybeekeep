import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Box,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AssignmentTurnedIn as CheckAllIcon,
  Assessment as InspectionIcon,
  Agriculture as HarvestIcon,
  Healing as TreatmentIcon,
  Warning as AlertIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { Notification } from '../../contexts/NotificationsContext';

const NotificationsMenu: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    handleClose();

    // Navigate based on notification type and entity
    if (notification.entity_type && notification.entity_id) {
      switch (notification.entity_type) {
        case 'inspection':
          navigate(`/inspections/${notification.entity_id}`);
          break;
        case 'harvest':
          navigate(`/harvests/${notification.entity_id}`);
          break;
        case 'treatment':
          navigate(`/treatments/${notification.entity_id}`);
          break;
        default:
          // No navigation for other types
          break;
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Icon mapper for notification types
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <InspectionIcon color="primary" />;
      case 'harvest':
        return <HarvestIcon color="success" />;
      case 'treatment':
        return <TreatmentIcon color="secondary" />;
      case 'alert':
        return <AlertIcon color="warning" />;
      case 'system':
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Format notification date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-label="notifications"
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton onClick={handleMarkAllAsRead} size="small">
                <CheckAllIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  onClick={() => handleNotificationClick(notification)}
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      cursor: 'pointer',
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5, mt: 1 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" component="span">
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label="New"
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;
