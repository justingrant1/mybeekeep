# BeeKeeper Pro

A comprehensive beekeeping management application designed to help beekeepers track hives, manage inspections, plan treatments, and optimize their apiaries through data-driven insights.

## 📋 Project Overview

BeeKeeper Pro is a full-featured apiary management system built with React, TypeScript, and Material UI, leveraging Supabase for data storage and authentication. The application helps beekeepers organize their beekeeping activities, track hive health, plan seasonal tasks, and analyze performance over time.

## ✨ Key Features

### 🐝 Apiary Management
- Multi-apiary support with location tracking
- Hive organization and grouping
- Equipment inventory tracking and assignment
- Visual apiary layout mapping

### 📆 Calendar & Task Management
- Climate zone-aware seasonal task recommendations
- Customizable event scheduling system
- Color-coded event categorization
- Priority-based task organization
- Weather-dependent task flagging

### 📊 Inspection Tracking
- Structured inspection data collection
- Queen performance monitoring
- Brood pattern assessment
- Customizable inspection templates
- Photo attachments for inspections

### 💉 Treatment Management
- Treatment scheduling and tracking
- Integration with weather forecasts for optimal timing
- Reminders for treatment follow-ups
- Dosage calculation assistance
- Treatment history by hive

### 🍯 Harvest Tracking
- Honey yield recording
- Harvest timeline visualization
- Comparative harvest analysis
- Honey type categorization
- Notes and quality assessments

### 🌤️ Weather Integration
- Local weather data for each apiary
- Weather forecasts for planning
- Historical weather correlation with hive performance
- Temperature, precipitation, and wind speed tracking

### 📱 Mobile-Friendly Design
- Responsive interface works on all devices
- Offline capability for field use
- Camera integration for documentation
- GPS support for apiary location

### 🔒 Privacy & Security
- End-to-end encryption for sensitive data
- User-controlled data sharing
- GDPR-compliant data management
- Secure authentication system

## 🧰 Technical Architecture

### Frontend
- **React 19**: Latest version with improved rendering performance
- **TypeScript**: Type safety throughout the codebase
- **Material UI 6**: Component library for consistent UI design
- **Context API**: For global state management
- **React Router**: For navigation between application sections

### Backend
- **Supabase**: For authentication, data storage, and realtime subscriptions
- **PostgreSQL**: Database for structured data storage
- **Row-Level Security**: For data access control
- **Serverless Functions**: For complex business logic

### Data Persistence
- **Relational Database**: For structured data with complex relationships
- **Local Storage**: For offline capabilities
- **Encrypted Storage**: For sensitive information

## 📂 Component Breakdown

### Calendar System
- `CalendarView.tsx`: Main calendar component with month, week, and day views
- `calendar.ts`: Data handling and API integration for calendar events
- Supports filtering by event type, apiary, and hive

### Authentication
- `AuthContext.tsx`: Authentication state management
- `Login.tsx` & `Register.tsx`: User authentication flows
- Role-based access control

### Notification System
- `NotificationsContext.tsx`: Global notification management
- `NotificationsMenu.tsx`: UI for viewing and managing notifications
- Real-time alerts and reminders

### Equipment Management
- `EquipmentContext.tsx`: Equipment inventory state management
- `EquipmentList.tsx`: UI for tracking and managing beekeeping equipment
- Equipment assignment and status tracking

### Hive Management
- `HiveDetail.tsx`: Detailed view of individual hive data
- `HiveList.tsx`: Overview of hives grouped by apiary
- Real-time hive data updates

### Inspection System
- `InspectionForm.tsx`: Data entry for hive inspections
- Customizable inspection templates
- Photo attachment support

### Treatment Tracking
- `TreatmentForm.tsx`: Recording treatment applications
- Treatment scheduling based on weather conditions
- Treatment effectiveness monitoring

### Harvest Recording
- `HarvestForm.tsx`: Data entry for honey harvests
- Yield calculation and tracking
- Harvest history analysis

### Weather Integration
- `ApiaryWeather.tsx`: Weather forecast display for apiaries
- Weather-based task recommendations
- Historical weather data analysis

### Analytics Dashboard
- `AnalyticsDashboard.tsx`: Data visualization for apiary performance
- Trend analysis and predictive insights
- Exportable reports

## 📊 Data Models

### Apiary Model
- Location data (coordinates, address)
- Climate zone information
- Associated hives
- Notes and metadata

### Hive Model
- Type and configuration
- Queen information (age, breed, performance)
- Position in apiary
- Associated inspections and harvests
- Current status

### Inspection Model
- Date and time
- Observer information
- Queen status
- Brood pattern assessment
- Disease and pest observations
- Photos and notes

### Treatment Model
- Type and product information
- Application date and dosage
- Target pests/diseases
- Effectiveness tracking
- Follow-up recommendations

### Calendar Event Model
- Event type categorization
- Date and time information
- Associated apiary and hives
- Priority level
- Weather dependency flags
- Recurrence patterns
- Reminders and notifications

### Equipment Model
- Type and category
- Status tracking (available, in-use, maintenance)
- Assignment to apiaries or hives
- Purchase information
- Maintenance history

## 🔒 Security & Privacy Features

- End-to-end encryption for sensitive data
- Row-level security in Supabase for data isolation
- GDPR-compliant user data management
- Data export and deletion capabilities
- Access control based on user roles
- Security vulnerability tracking and mitigation

## 🚀 Installation & Running

### Prerequisites
- Node.js v18+
- npm 9+ or yarn

### Setup Instructions
1. Clone the repository
2. Install dependencies:
   ```
   cd beekeeper-pro
   npm install
   ```
3. Create a `.env` file with your Supabase credentials
4. Start the development server:
   ```
   npm run dev
   ```
5. Open http://localhost:5173 in your browser

### Demo Mode
For a quick demonstration without setup, you can also open the `demo.html` file directly in your browser to see the calendar system.

## 📱 Progressive Web App Features

- Installable on desktop and mobile devices
- Offline functionality for field use
- Push notifications for reminders
- Background sync when connectivity is restored
- Camera and GPS integration

## 🧠 Smart Features

### Climate-Aware Recommendations
- Automatically suggests beekeeping tasks based on your climate zone
- Adjusts timing of activities based on seasonal patterns
- Provides region-specific beekeeping advice

### Predictive Analytics
- Queen performance predictions
- Swarm risk assessment
- Honey production forecasting
- Disease outbreak prediction based on conditions

### Integrated Knowledge Base
- Common disease identification
- Treatment recommendation engine
- Best practices for different seasons
- Regional beekeeping techniques

## 🌈 Color Coding System

The application uses a consistent color scheme to help quickly identify different types of activities:

- **Green (#4CAF50)**: Inspections
- **Red (#F44336)**: Treatments and interventions
- **Amber (#FFC107)**: Harvests
- **Orange (#FF9800)**: Feeding activities
- **Brown (#795548)**: Equipment management
- **Purple (#9C27B0)**: Queen-related activities
- **Pink (#E91E63)**: Swarm prevention
- **Blue (#2196F3)**: Weather-related events
- **Blue-Grey (#607D8B)**: Miscellaneous activities

## 📅 Future Development Roadmap

- Community feature for sharing knowledge and data
- Integration with IoT hive monitoring systems
- AI-powered disease identification from photos
- Mobile app versions for iOS and Android
- Advanced data export and reporting tools
- Integration with agricultural weather services
- Multi-language support

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

- Built with React, TypeScript, and Material UI
- Database powered by Supabase
- Calendar functionality assisted by date-fns
- Weather data integration via OpenWeather API
