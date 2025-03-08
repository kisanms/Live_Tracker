# 📱 Active Tracker - Project Documentation <img src="https://github.com/user-attachments/assets/e09885f1-5d95-49cd-8c60-0ed521490483" alt="icon" width="100" align="right">

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
- **Feb 5**
  - onboard styling improved
  - changes in manager dashboard on leave removed
- **Feb 6**
  - Added two new feature in admin and manager portal
  - Both Manager And admin can see the workhour details
  - Now admin, manager and employee can delete there account
- **Feb 7**
  - deploy in playstore console now waiting for result
  - created screenshot for mobile and tablet
  - https://whimsical.com/active-tracker-SPhtiVXUo3YbCaagSkek18@6HYTAunKLgTVw3i1faTe19EmPeowvgpAvNnPhsyv4ySs3aK
- **Feb 11**
  - application published on playstore
  - https://play.google.com/store/apps/details?id=com.deepkm.Live_Tracker
  - one issue i have to add the SHA-1 key of playstore to the google cloud console but getting error
- **Feb 13**
  - video explanation
- **Feb 14**
  - ppt file explaination has been created
- **Feb 17**
  - expo prebuild android folder causes error in build
  - git commits is imp for builds
- **Feb 18**
  - Admin: inside manager employee remove green dot
  - Admin : Employee list alert message when no location available
- **Feb 19**
  - Expo camera issues beacuse i am using old architecture
  - Expo camera is install through native changes means Gradlew and expo prebuild (Error "Type" old architecture)
- **Feb 20**
  - Experiment in a new ui for camera with gps images and states.
- **Feb 21**
  - camera captured image error 107648 size error in firebase , may be server error.
  - Tried new dependencies RN(manipulator,shot)
- **Feb 22**
  - college presentation
- **Feb 23**
  - Finding solution how to compress the image with React-native manipulator
- **Feb 24**
  - Image is now compressed
  - Both manager and employee can share there images now
  - manager can now see the images employee under him/her.(in gallery form)
- **Feb 25**
  - Admin can see the location of empl and manager from ImagesUpdateLocation
  - Admin can see the images of manager and empl shared
- **Feb 26**
  - Camera feature is completed now
  - production deploy
- **Feb 27**
  - data privacy issue occurred
  - create two new policy one for delete account and second for privacy
- **Feb 28**
  - issued was data safety form
  - selected device & id than it working in production
- **March 1**
  - what extra changes needed in the application
  - chnages in manager and admin loc noti (it should show staff inside that there current move loc details)
  - at the time of sign Up company name list should show so user can select from there easily
  - manager have to generate a key for employee so nobody can access the app easily

- **March 2**
- doing changes and make the ui more performance oriented
- **March 3**
- add all countries in playstore
- **March 4**
- at the time of sign Up company name list should show so user can select from there easily
- chnages in admin loc noti (it should show staff inside that there current move loc details)
- **March 5**
- chnages in manager loc noti (it should show staff inside that there current move loc details)
- Performance issue solving
- **March 6**
- sorted feature by date , month and time in work hour details page
- expo-print and expo-share
- **March 7**
- expo community date-time
- dowloand data in pdf format working now

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
- Share Image with Location

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

- Latest Build: [Live_Tracker Build 8bb217af](https://expo.dev/accounts/deepkm/projects/Live_Tracker/builds/8bb217af-f251-4598-b39f-a55a92e7505d)
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

## 📷 Image Explaination

## Authentication

### Onboard Slider  
<img src="https://github.com/user-attachments/assets/e5162cd3-a6c1-427f-9ee8-1f1741d6bd63" width="300"/>

### Company Register Page  
<img src="https://github.com/user-attachments/assets/cbccc8fe-39e3-41da-90a9-6c84f3b4b142" width="300"/>

### SignUp Page  
<img src="https://github.com/user-attachments/assets/f9e9b910-e9ca-4d4b-b679-9c3f4175f225" width="300"/>

#### Roles  
<img src="https://github.com/user-attachments/assets/604d6f0a-4d37-486d-933a-aca1c78e7a4b" width="300"/>

#### Company Name  
<img src="https://github.com/user-attachments/assets/04f63a9e-924f-4772-8e29-70e889d3e7a9" width="300"/>

### SignIn Page  
<img src="https://github.com/user-attachments/assets/2d3e9856-9974-4264-9dcb-0921b12c499f" width="300"/>

### Forget Password Page  
<img src="https://github.com/user-attachments/assets/d1c3dc11-ca25-4ed8-813e-41f479c32ced" width="300"/>

---

## Admin Part

- **The user who registered the company became the Admin.**

### Admin Dashboard  
<img src="https://github.com/user-attachments/assets/3e71570b-b879-4760-8f0e-10574ff60938" width="300"/>

### Admin Profile Page  
<img src="https://github.com/user-attachments/assets/1496233c-7288-466c-92c5-81a46976d696" width="300"/>
<img src="https://github.com/user-attachments/assets/e7cd3883-8062-4b17-b105-81c74ba661b8" width="300"/>

### Admin Location Page  
<img src="https://github.com/user-attachments/assets/cb7d9d40-75c1-491e-90a9-ae220c95c7d8" width="300"/>

### Generate a Key for Manager Auth  
<img src="https://github.com/user-attachments/assets/26765343-975f-45bf-beb5-bb7c562d563b" width="300"/>  
<img src="https://github.com/user-attachments/assets/65e85ef3-6437-4939-9678-4836b0d8216d" width="300"/>

### Manager List Page  
<img src="https://github.com/user-attachments/assets/919846d1-a291-4e2d-b72b-7864a73be806" width="300"/>

### Manager Location  
<img src="https://github.com/user-attachments/assets/8723e8c1-2e60-40c2-9842-2a53db1a0c7d" width="300"/>

### Manager Profile  
<img src="https://github.com/user-attachments/assets/a3cee123-cbfa-4ef5-b2bf-8f57ac4c3f24" width="300"/>

### Manager Under Employee  
<img src="https://github.com/user-attachments/assets/314d6992-18f2-4e96-a736-d73525772dd6" width="300"/>

### Employee List  
<img src="https://github.com/user-attachments/assets/317d76f2-8edd-4758-804f-2e90b190bdb7" width="300"/>

### Employee Profile  
<img src="https://github.com/user-attachments/assets/77e67525-7b56-41b1-8ed5-61b784106813" width="300"/>

### Employee Location  
<img src="https://github.com/user-attachments/assets/a63463cf-ce1f-4d95-a705-a3384bc8ffbd" width="300"/>

### All Staff Location with Images  
<img src="https://github.com/user-attachments/assets/83cc3d7a-f766-410a-920f-2f22c0ac9835" width="300"/>  
<img src="https://github.com/user-attachments/assets/7597a342-ac49-414b-b117-977cd66610c2" width="300"/>  
<img src="https://github.com/user-attachments/assets/6afaad56-518c-4166-9c8f-19e9cc414122" width="300"/>  
<img src="https://github.com/user-attachments/assets/2e8483fe-e532-4d66-8f91-b5303e3cb3e8" width="300"/>  
<img src="https://github.com/user-attachments/assets/29a7b370-5375-4124-ab9c-eca1cdbc55fc" width="300"/>

### Work Hour Data  
<img src="https://github.com/user-attachments/assets/fc9e3d08-dfd2-4151-a322-0efcd4579af2" width="300"/>

### Work Hour Data Detail Table Format  
<img src="https://github.com/user-attachments/assets/337ecd98-5bff-4892-8fb2-ed143eba7a90" width="300"/>

### Current Movement Location Data  
<img src="https://github.com/user-attachments/assets/ecba1b10-f54f-40e3-8f76-9b0954c8f6f6" width="300"/>  
<img src="https://github.com/user-attachments/assets/0fd7bd19-48eb-4b69-9f43-10c61c6312be" width="300"/>  
<img src="https://github.com/user-attachments/assets/d7817726-9c9b-496a-a205-7e654cb3c939" width="300"/>  
<img src="https://github.com/user-attachments/assets/ba658a7d-46b2-4f98-862c-d9aa0d77ad31" width="300"/>

---

# Manager Section  

## Manager Dashboard  
<img src="https://github.com/user-attachments/assets/018f2221-42f9-4de4-b2aa-dc7261520aae" width="300">  

## Manager Profile  
<img src="https://github.com/user-attachments/assets/d4c5e53b-45e9-46b7-ab4d-55bc5c58ebc6" width="300">  
<img src="https://github.com/user-attachments/assets/9c6e8aaa-f5c4-4136-9cf4-3d44063738f7" width="300">  

## Manager Clock-In  
<img src="https://github.com/user-attachments/assets/146ed907-dc83-4b25-bdcd-e32e2e0bba03" width="300">  
<img src="https://github.com/user-attachments/assets/4cd493e6-c869-4578-a0f6-bec5f0655fb7" width="300">  
<img src="https://github.com/user-attachments/assets/d716a528-d782-4d14-871c-13bb86c4d15f" width="300">  

## Manager Team List  
<img src="https://github.com/user-attachments/assets/6e223b20-790b-43a1-a1d4-c1db5d1749b6" width="300">  

## Team Member Location  
<img src="https://github.com/user-attachments/assets/bb4562be-1bcf-4cb7-b99b-b001007defc3" width="300">  

## All Employee Locations with Shared Images  
<img src="https://github.com/user-attachments/assets/2e92f90e-e37d-4f75-aab7-2a42d43fad45" width="300">  
<img src="https://github.com/user-attachments/assets/fdc252c3-2ecb-400e-a61d-8342e50a98b7" width="300">  
<img src="https://github.com/user-attachments/assets/172df911-0900-42e7-92a2-d9c7c1e29591" width="300">  

## Share Image with Location  
<img src="https://github.com/user-attachments/assets/9cafc4e2-6832-41b1-b058-c9915c92f29e" width="300">  
<img src="https://github.com/user-attachments/assets/da9be01a-117e-4fc4-88cf-acae42de4376" width="300">  
<img src="https://github.com/user-attachments/assets/50255c4f-853e-44d4-b84c-170e7e751e85" width="300">  

## Work Hours and Details  
<img src="https://github.com/user-attachments/assets/606ce353-4732-4de6-b62f-edbfb2099ab7" width="300">  
<img src="https://github.com/user-attachments/assets/9f5b22a2-c2ac-4b52-8d02-9fc3c617afab" width="300">  

## Current Movement Location Data  
<img src="https://github.com/user-attachments/assets/f66f217c-b180-4f4d-96b8-8d47672ea45a" width="300">  
<img src="https://github.com/user-attachments/assets/e76cc54d-5a90-4c34-bc69-f087feccfd2d" width="300">  
<img src="https://github.com/user-attachments/assets/b341d71c-2474-43c0-94fd-c298e1ad67c3" width="300">  
<img src="https://github.com/user-attachments/assets/8f1348db-0f0b-44b4-8763-2ba180267b64" width="300">  

## Employee Section

### Employee Dashboard  
<img src="https://github.com/user-attachments/assets/83ac2263-d2d2-47fb-b4cf-7434a235d09b" width="300">  

### Employee Profile  
<img src="https://github.com/user-attachments/assets/b6596e06-e549-49f1-a3f2-f6eb7f7cda12" width="300">  

### Employee Clock-In and Out  
<img src="https://github.com/user-attachments/assets/28ddb1a7-10a6-4373-9905-701ec00b6165" width="300">  
<img src="https://github.com/user-attachments/assets/e065e0cf-1dec-4b04-9950-7b7b6594f981" width="300">  
<img src="https://github.com/user-attachments/assets/a1a316b3-7a49-4d80-9959-1756ec83362c" width="300">  
<img src="https://github.com/user-attachments/assets/ab8e1322-55e1-4eab-be75-8087920e0699" width="300">  

### Share the Image with Location  
<img src="https://github.com/user-attachments/assets/eb485cdf-9cfe-422d-96f2-b33b3921acad" width="300">  

### Change or Set a Manager  
<img src="https://github.com/user-attachments/assets/39139b6d-25e9-4b2e-8532-3e2967168c6e" width="300">  




