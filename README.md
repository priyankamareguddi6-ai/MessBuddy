# Mess Buddy AI - Smart Hostel Feedback Platform

A comprehensive, AI-powered platform that transforms hostel mess feedback into actionable insights using real-time data, predictive analytics, and intelligent automation.

## 🎯 Features

### 👤 Smart Authentication
- Student login/signup system
- Anonymous feedback mode
- Role-based access (Student / Admin)
- JWT-style authentication simulation

### 🍽 Live Menu + Interaction
- Daily menu display (Breakfast, Lunch, Snacks, Dinner)
- Real-time rating system (1-5 stars)
- Quick feedback buttons (Too salty, Bad quality, Good taste, etc.)
- Voice feedback support

### 🤖 AI-Powered Feedback Engine
- Sentiment analysis on student reviews
- Auto-generated insights:
  - "Top complaints today"
  - "Most loved dish"
- Text-based sentiment analysis

### 📊 Real-Time Analytics Dashboard
- Live updating charts
- Key metrics:
  - Average meal rating
  - Satisfaction score (%)
  - Complaint trends over time
- Interactive charts using Chart.js

### 🔮 Predictive Intelligence
- Predicts low-rated meals for upcoming days
- AI suggestions for improvements
- Confidence scores for predictions

### 🚨 Smart Complaint System
- Raise complaints with category tags (Hygiene, Taste, Quantity, Delay)
- Admin dashboard for complaint management
- Priority sorting with AI-based urgency detection
- Status tracking (Resolved/Pending)

### 📢 Notification System
- Real-time notifications for:
  - Menu updates
  - Complaint resolutions
  - User feedback acknowledgment

### 🎨 Modern UI/UX
- Clean, modern, mobile-first design
- Card-based layout for meals
- Interactive charts for analytics
- Emoji indicators for quick understanding
- **Dark Mode Support**

### 🌐 Real-Time Features
- Live ratings update instantly
- Dashboard updates without refresh
- Local storage for data persistence

### 💡 Bonus Features
- QR code generation for quick menu access
- Gamification system with points and levels
- Voice feedback input with speech recognition
- Responsive design for all devices

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Storage**: LocalStorage for data persistence
- **Voice Recognition**: Web Speech API

## 🚀 Getting Started

1. **Clone or download the project files**
2. **Open `index.html` in your web browser**
3. **Start using the platform immediately!**

### Login Credentials
- **Student Login**: Use any email (e.g., `student@hostel.com`)
- **Admin Login**: Use email with "admin" (e.g., `admin@hostel.com`)
- **Anonymous Mode**: Check the "Anonymous mode" checkbox

## 📱 How to Use

### For Students:
1. **Login** with your credentials or use anonymous mode
2. **View Menu** to see today's meals
3. **Rate meals** using the 5-star system
4. **Provide quick feedback** with emoji buttons
5. **Use voice feedback** for detailed opinions
6. **Raise complaints** if needed
7. **Track analytics** to see trends

### For Admins:
1. **Login** with admin credentials
2. **Monitor dashboard** for real-time insights
3. **Manage complaints** with priority sorting
4. **View analytics** for decision-making
5. **Track AI predictions** for improvements

## 🎯 Key Features Explained

### Rating System
- Each menu item can be rated 1-5 stars
- Ratings are saved instantly and reflected in analytics
- Average ratings are calculated in real-time

### Quick Feedback
- Emoji-based quick feedback buttons
- Categories: Tasty, Too Salty, Too Spicy, Cold
- Instant sentiment analysis

### Voice Feedback
- Click the 🎤 button to provide voice feedback
- Automatic speech-to-text conversion
- Sentiment analysis of voice input

### Complaint System
- Categorized complaints (Hygiene, Taste, Quantity, Delay)
- Priority levels (Low, Medium, High)
- Admin can resolve or escalate complaints

### Analytics Dashboard
- Rating trends over time
- Satisfaction score distribution
- Complaint category breakdown
- Meal type performance comparison

### AI Predictions
- Predicts potential issues before they occur
- Suggests improvements based on historical data
- Confidence scores for reliability

## 🌟 Special Features

### Dark Mode
- Toggle between light and dark themes
- Automatic system preference detection
- Persistent theme selection

### Gamification
- Earn points for ratings and feedback
- Level progression system
- Titles: Newbie → Food Critic → Mess Expert → Mess Master → Mess Legend

### QR Code Support
- Generate QR codes for quick menu access
- Perfect for displaying in mess areas

### Responsive Design
- Works perfectly on mobile, tablet, and desktop
- Touch-friendly interface
- Optimized for all screen sizes

## 📊 Data Storage

The application uses localStorage for data persistence:
- User authentication state
- Meal ratings
- Feedback data
- Complaint records
- Notification history
- User preferences

## 🔧 Customization

### Adding New Menu Items
Edit the `renderMenuItems()` function in `script.js` to add new meals.

### Modifying Categories
Update the complaint categories in the HTML select element and JavaScript logic.

### Customizing Themes
Modify the CSS variables in `styles.css` to change colors and themes.

## 🚀 Future Enhancements

- Backend API integration
- Real database connectivity
- Advanced AI/ML models
- Push notifications
- Multi-language support
- Advanced reporting features

## 📱 Browser Compatibility

- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 🎯 Hackathon Ready

This project includes all the features requested for a hackathon:
- ✅ Smart Authentication
- ✅ Live Menu System
- ✅ AI-Powered Feedback
- ✅ Real-Time Analytics
- ✅ Predictive Intelligence
- ✅ Smart Complaint System
- ✅ Notification System
- ✅ Modern UI/UX with Dark Mode
- ✅ Bonus Features (QR, Gamification, Voice)

## 📞 Support

For any questions or issues, please refer to the code comments or reach out to the development team.

---

**Built with ❤️ for better hostel mess experiences!**
