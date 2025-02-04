# 📱 Live Tracker - Project Documentation <img src="https://github.com/user-attachments/assets/e09885f1-5d95-49cd-8c60-0ed521490483" alt="icon" width="100" align="right">

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Timeline](#development-timeline)
4. [Features Implementation](#features-implementation)
5. [Technical Challenges](#technical-challenges)
6. [Build Information](#build-information)
7. [Future Enhancements](#future-enhancements)

## 🎯 Project Overview
Live Tracker is a location-tracking application built with Expo, featuring role-based access control and real-time location monitoring. The application serves three user types: Admin, Manager, and Employee, each with specific functionalities and access levels.

## 🛠 Technology Stack
- **Framework**: Expo, React Native
- **Maps Integration**: Google Maps API
- **State Management**: Async Storage
- **Background Services**: React Native Background Services
- **Authentication**: Role-based Access Control (RBAC)
- **Payment Integration**: RevenueCat (planned)
- **Build Tools**: Expo CLI

## 📅 Development Timeline

### December 2024

#### Week 1: Foundation (Dec 17-19)
- **Day 1**: Created expo-cli project
  - Implemented Login UI
  - Implemented Register UI
  
- **Day 2**: Backend Integration
  - Studied JSON structure
  - Implemented API methods
  
- **Day 3**: Access Control
  - Implemented RBAC UI components
  - Designed role-specific interfaces

#### Week 2: Maps Integration (Dec 22-25)
- **Day 1**: Google Maps Implementation
  - Integrated React Native Maps
  - Set up Google Maps API configuration
  
- **Day 2**: Production Issues
  - Debugged map display problems
  - Identified integration conflicts
  
- **Day 3**: Architecture Updates
  - Studied React Native 0.76 architecture
  - Analyzed bridge removal impact
  
- **Day 4**: Development Environment
  - Attempted macOS virtualization
  - Explored cross-platform solutions

#### Week 3: Build Resolution (Dec 28-31)
- **Dec 28**: Dependency Research
  - Evaluated alternative API solutions
  - Tested compatibility issues
  
- **Dec 29**: Build Troubleshooting
  - Resolved API integration issues
  - Fixed Android folder conflicts
  
- **Dec 30**: Successful Build
  - Removed problematic Android folder
  - Updated app.json configuration
  - Implemented Google Maps API key
  
- **Dec 31**: Feature Addition
  - Created Company Register page
  - Researched app store requirements

### January 2025

#### Week 1: Payment & Features (Jan 1-4)
- **Jan 1**:
  - Implemented Onboarding Slider
  - Researched payment gateway integration
  
- **Jan 2**:
  - Studied RevenueCat implementation
  - Documented subscription requirements
  
- **Jan 3**:
  - Created employee location tracking
  - Developed manager view functionality
  
- **Jan 4**:
  - Fixed admin panel issues
  - Successfully deployed working build

#### Week 2: Core Development (Jan 6-9)
- **Jan 6**:
  - Enhanced admin dashboard
  - Implemented employee metrics
  
- **Jan 7**:
  - Implemented session storage
  - Configured background services
  
- **Jan 8**:
  - Developed location service page
  - Implemented background functionality
  
- **Jan 9**:
  - Added map refresh feature
  - Implemented real-time updates

#### Week 3: Advanced Features (Jan 10-13)
- **Jan 10**:
  - Integrated company database
  - Added admin notifications
  
- **Jan 11**:
  - Enhanced manager dashboard
  - Added employee location tracking
  
- **Jan 12**:
  - Implemented company-specific filtering
  - Created manager and employee lists
  
- **Jan 13**:
  - Developing combined location view
  - Enhancing admin dashboard
- **Jan 14**:
  - have to Learn about Firebase notification
  - react-native push notifications
- **Jan 15**:
  - https://youtu.be/sioEY4tWmLI?embeds_referring_euri=https%3A%2F%2Fconsole.firebase.google.com%2F&source_ve_path=Mjg2NjQsMTY0NTAz (Firebase Cloud Messaging) 
 
- **Jan 16**:
  - OnAuthChanged from firebase is working , means when user is login his/her session stored and if remove the app from recent it will not navigate to signIn page ever.
  - Admin dashboard -> Manager -> employee -> managerUnderEmp
  - both expo and google SHA key should be same or else the map will not show

- **Jan 17**:
 -Admin all staff loc shows the number of manager and employees 
 -static notification working from FCM
 - delay of 2mins cloud messaging.
   
- **Jan 19**:
  -onboard slider transition
  -signIn transition 
- **Jan 20**:
  - manager can see the intervals location data of emp
  - Current location area name and date time with proper format  
- **Jan 21**
  - update the change emplocnoti now with proper distance interval and battery efficient 
- **Jan 22**
  - employee can update it's profile now
- **Jan 23**
  - Admin can see the interval loc of both empl and manager
  - Created Admin and manager profile page
- **Jan 24**
  - add clock in and out feature
  - added profile images inside manager's employee list
- **Jan 25**
  - add clock in extra one
- **Jan 26**
  - if employee already clocked in , and if reload the data will there only because it's clocked in already
  - Show Active now count in manager
  - Cosmetic changes in admin and manager
- **Jan 27**
  - For both emp and manager when clock in there location info will be share
  - Changes in maps.js file
- **Jan 28**
  - Work hour file is created
  - Now we can the location data when clockin and clock out.
- **Jan 29**
  - Manager clockin data store in workhour and Persistent clockin db
  - Admin's active now is working for manager
  - Workhour data in admin showing for both emp and manager
  - Reset Password working now
- **Jan 30**
  - Finally the app is completed
- **Jan 31**
  - Because of free tier of firebase server issues occur
- **Feb 1**
  - Testing phase
- **Feb 3**
  - Changes in admin managerList where location data is fetching from managerslocation, but that was wrong
  - Issue has been solved
  
 

## 🎉 Features Implementation

### Admin Dashboard
- Company data management
- Manager and employee oversight
- Location tracking for all users
- Notification system
- Company-specific filtering

### Manager Features
- Employee location tracking
- Team management dashboard
- Employee count metrics
- Real-time location updates

### Employee Features
- Location sharing
- Background location updates
- Profile management

## 🔧 Technical Challenges
1. **Map Integration Issues**
   - Resolution: Removed Android folder conflicts
   - Updated API key implementation

2. **Background Services**
   - Implementation: 5-minute interval updates
   - Status: Working reliably

3. **Build Process**
   - Challenge: Android folder conflicts
   - Solution: Configuration in app.json

## 📦 Build Information
- Latest Build: [Live_Tracker Build 796e6d8a](https://expo.dev/accounts/deepkm/projects/Live_Tracker/builds/796e6d8a-0f8d-491a-b746-b439c55b56fe)
- Build Status: Successful
- Platform: Android
- Key Features: Location tracking, Role-based access

## 🚀 Future Enhancements
1. **Payment Integration**
   - RevenueCat implementation
   - In-app subscription setup

2. **Background Services**
   - Optimize battery usage
   - Enhance reliability

3. **User Interface**
   - Enhanced map visualization
   - Improved user analytics

## 📝 Notes
- In-app subscriptions pending store deployment
- Background services functioning with 5-minute intervals
- Company-specific data segregation implemented
- Location tracking working as expected

## 🔄 Version Control
- Repository: Not specified
- Latest Version: 1.0.0
- Build Number: Referenced in build link

## 📚 Documentation Standards
- Changelog updates required for all features
- Build documentation mandatory
- API documentation maintained separately

## 🔐 Security Considerations
- Role-based access control implemented
- Location data encryption pending
- User data protection measures in place
