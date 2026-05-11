// Global State Management
const state = {
    currentUser: null,
    isAuthenticated: false,
    isAdmin: false,
    isAnonymous: false,
    darkMode: false,
    currentPage: 'login',
    notifications: [],
    menuData: {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: []
    },
    ratings: {},
    feedback: [],
    complaints: [],
    analytics: {
        dailyRatings: [],
        satisfactionScores: [],
        complaintCategories: {},
        mealPerformance: {}
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
    checkDarkMode();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('messBuddyUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        state.isAuthenticated = true;
        state.isAdmin = state.currentUser.role === 'admin';
        state.isRegistered = state.currentUser.isRegistered || false;
        state.isAnonymous = state.currentUser.isAnonymous || false;
        
        // Only show dashboard if user is registered or anonymous
        if (state.isRegistered || state.isAnonymous) {
            showDashboard();
        } else {
            showLoginPage();
        }
    }
    
    // Load saved data
    loadSavedData();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Registration
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    document.getElementById('cancelRegistration').addEventListener('click', hideRegistrationModal);
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        showRegistrationModal();
    });
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('href').substring(1);
            navigateToPage(page);
        });
    });
    
    // Complaint system
    document.getElementById('raiseComplaintBtn').addEventListener('click', showComplaintModal);
    document.getElementById('cancelComplaint').addEventListener('click', hideComplaintModal);
    document.getElementById('complaintForm').addEventListener('submit', handleComplaintSubmit);
    document.getElementById('complaintFilter').addEventListener('change', filterComplaints);
    
    // Feedback system
    const detailedFeedbackForm = document.getElementById('detailedFeedbackForm');
    if (detailedFeedbackForm) {
        detailedFeedbackForm.addEventListener('submit', handleDetailedFeedbackSubmit);
    }
    
    // Notifications
    document.getElementById('notificationBtn').addEventListener('click', toggleNotificationPanel);
    
    // Voice input
    document.getElementById('stopVoiceRecording').addEventListener('click', stopVoiceRecording);
    
    // Analytics filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('bg-primary-600', 'text-white'));
            e.target.classList.add('bg-primary-600', 'text-white');
            updateAnalytics(e.target.dataset.period);
        });
    });
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isAnonymous = document.getElementById('anonymousMode').checked;
    
    // Check if user is registered
    const registeredUsers = JSON.parse(localStorage.getItem('messBuddyRegisteredUsers') || '[]');
    const registeredUser = registeredUsers.find(user => user.email === email);
    
    if (registeredUser) {
        // Registered user login
        state.currentUser = registeredUser;
        state.isAuthenticated = true;
        state.isAdmin = registeredUser.role === 'admin';
        state.isRegistered = true;
        state.isAnonymous = false;
        
        localStorage.setItem('messBuddyUser', JSON.stringify(registeredUser));
        
        showDashboard();
        addNotification('Welcome back!', `Logged in as ${registeredUser.name}`, 'success');
    } else if (isAnonymous) {
        // Anonymous user access
        const anonymousUser = {
            id: Date.now(),
            email: email,
            name: 'Anonymous User',
            role: 'student',
            isAnonymous: true,
            isRegistered: false,
            avatar: `https://picsum.photos/seed/anonymous/40/40.jpg`
        };
        
        state.currentUser = anonymousUser;
        state.isAuthenticated = true;
        state.isAdmin = false;
        state.isRegistered = false;
        state.isAnonymous = true;
        
        localStorage.setItem('messBuddyUser', JSON.stringify(anonymousUser));
        
        showDashboard();
        addNotification('Welcome!', `Logged in as Anonymous User`, 'info');
    } else {
        // User not registered and not anonymous
        alert('User not found. Please register first or use anonymous mode.');
        showRegistrationModal();
    }
}

function handleLogout() {
    state.currentUser = null;
    state.isAuthenticated = false;
    state.isAdmin = false;
    state.isAnonymous = false;
    
    localStorage.removeItem('messBuddyUser');
    
    showLoginPage();
    addNotification('Logged out', 'You have been successfully logged out', 'info');
}

// Registration Functions
function showRegistrationModal() {
    document.getElementById('registrationModal').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
}

function hideRegistrationModal() {
    document.getElementById('registrationModal').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registrationForm').reset();
}

function handleRegistration(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        hostel: document.getElementById('regHostel').value,
        role: document.getElementById('regRole').value,
        password: document.getElementById('regPassword').value,
        confirmPassword: document.getElementById('regConfirmPassword').value,
        agreeTerms: document.getElementById('agreeTerms').checked
    };
    
    // Validation
    if (!validateRegistrationForm(formData)) {
        return;
    }
    
    // Check if user already exists
    if (checkUserExists(formData.email)) {
        alert('User with this email already exists. Please login instead.');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hostel: formData.hostel,
        role: formData.role,
        isRegistered: true,
        registrationDate: new Date().toISOString(),
        avatar: `https://picsum.photos/seed/${formData.email}/40/40.jpg`,
        points: 0,
        level: 1,
        title: 'Newbie'
    };
    
    // Save user to registered users list
    const registeredUsers = JSON.parse(localStorage.getItem('messBuddyRegisteredUsers') || '[]');
    registeredUsers.push(newUser);
    localStorage.setItem('messBuddyRegisteredUsers', JSON.stringify(registeredUsers));
    
    // Auto-login after registration
    state.currentUser = newUser;
    state.isAuthenticated = true;
    state.isAdmin = newUser.role === 'admin';
    state.isRegistered = true;
    
    localStorage.setItem('messBuddyUser', JSON.stringify(newUser));
    
    hideRegistrationModal();
    showDashboard();
    
    addNotification('Registration Successful!', `Welcome to Mess Buddy AI, ${newUser.name}!`, 'success');
}

function validateRegistrationForm(formData) {
    // Check if all required fields are filled
    if (!formData.name || !formData.email || !formData.phone || !formData.hostel || !formData.role || !formData.password) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address.');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 10) {
        alert('Please enter a valid phone number.');
        return false;
    }
    
    // Password validation
    if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return false;
    }
    
    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match.');
        return false;
    }
    
    // Terms agreement
    if (!formData.agreeTerms) {
        alert('Please agree to the Terms & Conditions.');
        return false;
    }
    
    return true;
}

function checkUserExists(email) {
    const registeredUsers = JSON.parse(localStorage.getItem('messBuddyRegisteredUsers') || '[]');
    return registeredUsers.some(user => user.email === email);
}

// Navigation Functions
function showLoginPage() {
    hideAllPages();
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('navbar').classList.add('hidden');
    state.currentPage = 'login';
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboardPage').classList.remove('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    state.currentPage = 'dashboard';
    
    // Update user info in navbar
    document.getElementById('userName').textContent = state.currentUser.name;
    document.getElementById('userAvatar').src = state.currentUser.avatar;
    
    // Update dashboard content
    updateDashboardStats();
    updateRecentActivity();
    initializeDashboardCharts();
}

function navigateToPage(page) {
    // Check if user is registered
    if (!state.isAuthenticated || !state.currentUser.isRegistered) {
        showRegistrationModal();
        return;
    }
    
    hideAllPages();
    document.getElementById('navbar').classList.remove('hidden');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${page}`) {
            link.classList.add('active');
        }
    });
    
    switch(page) {
        case 'dashboard':
            showDashboard();
            break;
        case 'menu':
            showMenuPage();
            break;
        case 'feedback':
            showFeedbackPage();
            break;
        case 'recommendations':
            showRecommendationsPage();
            break;
        case 'nutrition':
            showNutritionPage();
            break;
        case 'social':
            showSocialPage();
            break;
        case 'analytics':
            showAnalyticsPage();
            break;
        case 'complaints':
            showComplaintsPage();
            break;
    }
}

function hideAllPages() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('menuPage').classList.add('hidden');
    document.getElementById('feedbackPage').classList.add('hidden');
    document.getElementById('recommendationsPage').classList.add('hidden');
    document.getElementById('nutritionPage').classList.add('hidden');
    document.getElementById('socialPage').classList.add('hidden');
    document.getElementById('analyticsPage').classList.add('hidden');
    document.getElementById('complaintsPage').classList.add('hidden');
}

// Dark Mode Functions
function checkDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true' || (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        state.darkMode = true;
    }
}

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', state.darkMode);
}

// Menu Page Functions
function showMenuPage() {
    hideAllPages();
    document.getElementById('menuPage').classList.remove('hidden');
    state.currentPage = 'menu';
    
    renderMenuItems();
}

function renderMenuItems() {
    const meals = {
        breakfast: [
            { id: 1, name: 'Idli', description: 'Steamed rice cakes', rating: 4.2, votes: 45 },
            { id: 2, name: 'Sambar', description: 'South Indian lentil soup', rating: 4.5, votes: 38 },
            { id: 3, name: 'Chutney', description: 'Coconut chutney', rating: 4.0, votes: 42 },
            { id: 4, name: 'Poha', description: 'Flattened rice dish', rating: 3.8, votes: 35 },
            { id: 5, name: 'Tea/Coffee', description: 'Hot beverages', rating: 4.6, votes: 67 },
            { id: 6, name: 'Bread Butter', description: 'Toast with butter', rating: 3.9, votes: 28 }
        ],
        lunch: [
            { id: 7, name: 'Rice', description: 'Steamed basmati rice', rating: 4.3, votes: 78 },
            { id: 8, name: 'Dal Makhani', description: 'Creamy black lentils', rating: 4.7, votes: 82 },
            { id: 9, name: 'Paneer Butter Masala', description: 'Cottage cheese in creamy gravy', rating: 4.8, votes: 91 },
            { id: 10, name: 'Mixed Veg', description: 'Seasonal vegetables', rating: 3.6, votes: 45 },
            { id: 11, name: 'Roti', description: 'Indian flatbread', rating: 4.4, votes: 88 },
            { id: 12, name: 'Salad', description: 'Fresh garden salad', rating: 3.9, votes: 52 }
        ],
        snacks: [
            { id: 13, name: 'Samosa', description: 'Fried pastry with potato filling', rating: 4.5, votes: 95 },
            { id: 14, name: 'Tea', description: 'Indian chai', rating: 4.2, votes: 120 },
            { id: 15, name: 'Biscuits', description: 'Assorted cookies', rating: 3.7, votes: 68 }
        ],
        dinner: [
            { id: 16, name: 'Rice', description: 'Steamed basmati rice', rating: 4.1, votes: 72 },
            { id: 17, name: 'Chicken Curry', description: 'Spicy chicken gravy', rating: 4.6, votes: 85 },
            { id: 18, name: 'Dal Tadka', description: 'Tempered lentils', rating: 4.3, votes: 78 },
            { id: 19, name: 'Bhindi Masala', description: 'Okra curry', rating: 3.8, votes: 62 },
            { id: 20, name: 'Roti', description: 'Indian flatbread', rating: 4.5, votes: 92 },
            { id: 21, name: 'Curd', description: 'Fresh yogurt', rating: 4.0, votes: 58 }
        ]
    };
    
    Object.keys(meals).forEach(mealType => {
        const container = document.getElementById(`${mealType}Items`);
        container.innerHTML = '';
        
        meals[mealType].forEach(item => {
            const mealCard = createMealCard(item, mealType);
            container.appendChild(mealCard);
        });
    });
}

function createMealCard(item, mealType) {
    const card = document.createElement('div');
    card.className = 'meal-card bg-white dark:bg-gray-700 rounded-lg shadow-md p-4';
    
    const userRating = state.ratings[item.id] || 0;
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${item.name}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${item.description}</p>
            </div>
            <div class="text-right">
                <div class="flex items-center">
                    <span class="text-lg font-bold text-yellow-500">${item.rating}</span>
                    <span class="text-yellow-500 ml-1">⭐</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">${item.votes} votes</p>
            </div>
        </div>
        
        <div class="mb-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating:</p>
            <div class="flex space-x-1">
                ${[1, 2, 3, 4, 5].map(star => `
                    <button class="rating-star text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}" 
                            onclick="rateItem(${item.id}, ${star})" data-star="${star}">
                        ⭐
                    </button>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Feedback:</p>
            <div class="grid grid-cols-2 gap-2">
                <button class="feedback-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-primary-600 hover:text-white" 
                        onclick="quickFeedback(${item.id}, 'tasty')">
                    😋 Tasty
                </button>
                <button class="feedback-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-primary-600 hover:text-white" 
                        onclick="quickFeedback(${item.id}, 'salty')">
                    🧂 Too Salty
                </button>
                <button class="feedback-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-primary-600 hover:text-white" 
                        onclick="quickFeedback(${item.id}, 'spicy')">
                    🌶️ Too Spicy
                </button>
                <button class="feedback-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-primary-600 hover:text-white" 
                        onclick="quickFeedback(${item.id}, 'cold')">
                    ❄️ Cold
                </button>
            </div>
        </div>
        
        <div class="flex items-center justify-between">
            <button class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400" 
                    onclick="voiceFeedback(${item.id})">
                🎤 Voice Feedback
            </button>
            <button class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
                    onclick="viewFeedback(${item.id})">
                View Feedback
            </button>
        </div>
    `;
    
    return card;
}

function rateItem(itemId, rating) {
    state.ratings[itemId] = rating;
    localStorage.setItem('messBuddyRatings', JSON.stringify(state.ratings));
    
    // Update UI
    document.querySelectorAll(`[data-star]`).forEach(star => {
        const starRating = parseInt(star.dataset.star);
        if (starRating <= rating) {
            star.classList.add('text-yellow-400');
            star.classList.remove('text-gray-300', 'text-gray-600');
        } else {
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-300', 'text-gray-600');
        }
    });
    
    addNotification('Rating Submitted', `You rated this item ${rating} stars`, 'success');
    
    // Update analytics
    updateAnalyticsData();
}

function quickFeedback(itemId, feedbackType) {
    const feedback = {
        id: Date.now(),
        itemId: itemId,
        type: feedbackType,
        userId: state.currentUser.id,
        timestamp: new Date().toISOString(),
        sentiment: analyzeSentiment(feedbackType)
    };
    
    state.feedback.push(feedback);
    localStorage.setItem('messBuddyFeedback', JSON.stringify(state.feedback));
    
    addNotification('Feedback Submitted', 'Thank you for your feedback!', 'success');
    
    // Update button state
    event.target.classList.add('selected');
    
    // Update analytics
    updateAnalyticsData();
}

function analyzeSentiment(feedbackType) {
    const positiveTypes = ['tasty', 'good', 'excellent'];
    const negativeTypes = ['salty', 'spicy', 'cold', 'bad', 'worst'];
    
    if (positiveTypes.includes(feedbackType)) return 'positive';
    if (negativeTypes.includes(feedbackType)) return 'negative';
    return 'neutral';
}

function voiceFeedback(itemId) {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    document.getElementById('voiceModal').classList.remove('hidden');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        
        // Process voice feedback
        const feedback = {
            id: Date.now(),
            itemId: itemId,
            type: 'voice',
            text: transcript,
            userId: state.currentUser.id,
            timestamp: new Date().toISOString(),
            sentiment: analyzeTextSentiment(transcript)
        };
        
        state.feedback.push(feedback);
        localStorage.setItem('messBuddyFeedback', JSON.stringify(state.feedback));
        
        document.getElementById('voiceModal').classList.add('hidden');
        addNotification('Voice Feedback Submitted', 'Thank you for your voice feedback!', 'success');
        
        updateAnalyticsData();
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        document.getElementById('voiceModal').classList.add('hidden');
        alert('Error recognizing speech. Please try again.');
    };
    
    recognition.start();
}

function analyzeTextSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'tasty', 'delicious', 'amazing', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'poor', 'cold', 'salty', 'spicy'];
    
    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}

function stopVoiceRecording() {
    document.getElementById('voiceModal').classList.add('hidden');
}

// Analytics Page Functions
function showAnalyticsPage() {
    hideAllPages();
    document.getElementById('analyticsPage').classList.remove('hidden');
    state.currentPage = 'analytics';
    
    initializeAnalyticsCharts();
    updateAnalytics('today');
}

function initializeAnalyticsCharts() {
    // Rating Trends Chart
    const ratingCtx = document.getElementById('ratingTrendsChart');
    if (ratingCtx) {
        new Chart(ratingCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Average Rating',
                    data: [4.2, 4.1, 4.3, 4.0, 4.4, 3.8, 3.9],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 3,
                        max: 5
                    }
                }
            }
        });
    }
    
    // Satisfaction Chart
    const satisfactionCtx = document.getElementById('satisfactionChart');
    if (satisfactionCtx) {
        new Chart(satisfactionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Satisfied', 'Neutral', 'Unsatisfied'],
                datasets: [{
                    data: [75, 15, 10],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Complaint Categories Chart
    const complaintCtx = document.getElementById('complaintCategoriesChart');
    if (complaintCtx) {
        new Chart(complaintCtx, {
            type: 'bar',
            data: {
                labels: ['Taste', 'Hygiene', 'Quantity', 'Delay', 'Other'],
                datasets: [{
                    label: 'Complaints',
                    data: [12, 8, 15, 6, 4],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Meal Performance Chart
    const mealCtx = document.getElementById('mealPerformanceChart');
    if (mealCtx) {
        new Chart(mealCtx, {
            type: 'radar',
            data: {
                labels: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
                datasets: [{
                    label: 'Average Rating',
                    data: [4.1, 4.3, 4.2, 4.0],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: false,
                        min: 3,
                        max: 5
                    }
                }
            }
        });
    }
}

function updateAnalytics(period) {
    // This would normally fetch data based on the selected period
    console.log(`Updating analytics for period: ${period}`);
    
    // Simulate data update
    addNotification('Analytics Updated', `Showing ${period} data`, 'info');
}

// Complaint System Functions
function showComplaintsPage() {
    hideAllPages();
    document.getElementById('complaintsPage').classList.remove('hidden');
    state.currentPage = 'complaints';
    
    renderComplaints();
}

// Feedback Page Functions
function showFeedbackPage() {
    hideAllPages();
    document.getElementById('feedbackPage').classList.remove('hidden');
    state.currentPage = 'feedback';
    
    // Initialize feedback features
    initializeFeedbackFeatures();
}

function initializeFeedbackFeatures() {
    // Load feedback statistics
    loadFeedbackStats();
    
    // Load recent feedback
    loadRecentFeedback();
    
    // Setup feedback form
    setupFeedbackForm();
    
    // Initialize feedback analytics
    initializeFeedbackAnalytics();
}

function loadFeedbackStats() {
    // Simulate loading feedback statistics
    const stats = {
        totalFeedback: 156,
        averageRating: 4.2,
        positivePercentage: 78,
        negativePercentage: 12
    };
    
    // Update stats display
    console.log('Feedback stats loaded:', stats);
}

function loadRecentFeedback() {
    // Load recent feedback from localStorage or sample data
    const recentFeedback = [
        {
            user: 'Rahul Kumar',
            avatar: 'user1',
            time: '5 min ago',
            meal: 'Lunch - Paneer Butter Masala',
            rating: 5,
            comment: 'Amazing taste! The paneer was so soft and the gravy was perfect. Keep it up! 👏'
        },
        {
            user: 'Priya Sharma',
            avatar: 'user2',
            time: '15 min ago',
            meal: 'Breakfast - Idli Sambar',
            rating: 3,
            comment: 'Sambar was good but idlis were a bit hard. Please improve the quality.'
        },
        {
            user: 'Amit Patel',
            avatar: 'user3',
            time: '30 min ago',
            meal: 'Dinner - Mixed Veg',
            rating: 4,
            comment: 'Good variety and taste. The vegetables were fresh and well-cooked.'
        }
    ];
    
    // Store in state for later use
    state.recentFeedback = recentFeedback;
    
    console.log('Recent feedback loaded:', recentFeedback);
}

function setupFeedbackForm() {
    // Form event listener is already set up in setupEventListeners
    // This function can be used for additional setup if needed
    console.log('Feedback form setup completed');
}

function handleDetailedFeedbackSubmit(e) {
    e.preventDefault();
    
    console.log('Feedback form submitted');
    
    const formData = new FormData(e.target);
    const feedback = {
        id: Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userAvatar: state.currentUser.avatar,
        mealType: formData.get('mealType'),
        dishName: formData.get('dishName'),
        rating: state.currentRating || 0,
        feedbackType: formData.get('feedbackType'),
        comment: formData.get('comment'),
        timestamp: new Date().toISOString(),
        sentToAdmin: true
    };
    
    console.log('Feedback data:', feedback);
    
    // Save feedback
    saveFeedback(feedback);
    
    // Show success notification
    addNotification('Feedback Sent to Admin', 'Your detailed feedback has been sent to the mess admin!', 'success');
    
    // Reset form
    e.target.reset();
    resetRatingStars();
    
    // Update recent feedback list
    updateRecentFeedbackList();
    
    // Add to recent feedback display immediately
    addToRecentFeedbackDisplay(feedback);
}

function saveFeedback(feedback) {
    // Get existing feedback
    const existingFeedback = JSON.parse(localStorage.getItem('messBuddyFeedback') || '[]');
    
    // Add new feedback
    existingFeedback.push(feedback);
    
    // Save to localStorage
    localStorage.setItem('messBuddyFeedback', JSON.stringify(existingFeedback));
    
    // Update state
    state.feedback = existingFeedback;
    
    console.log('Feedback saved:', feedback);
}

function submitQuickFeedback(type) {
    const feedback = {
        id: Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userAvatar: state.currentUser.avatar,
        type: 'quick',
        quickType: type,
        timestamp: new Date().toISOString(),
        sentToAdmin: true
    };
    
    // Save feedback
    saveFeedback(feedback);
    
    // Show success notification
    const messages = {
        excellent: 'Thank you for the excellent feedback! 🌟 Sent to admin!',
        good: 'Glad you had a good experience! 😊 Sent to admin!',
        average: 'Thanks for your feedback, we\'ll improve! 💪 Sent to admin!',
        poor: 'We\'re sorry to hear that. We\'ll work on it! 🛠️ Sent to admin!'
    };
    
    addNotification('Quick Feedback to Admin', messages[type], type === 'excellent' || type === 'good' ? 'success' : 'warning');
    
    // Update recent feedback list
    updateRecentFeedbackList();
}

function sendEmojiToAdmin(emoji) {
    const feedback = {
        id: Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userAvatar: state.currentUser.avatar,
        type: 'emoji',
        emoji: emoji,
        timestamp: new Date().toISOString(),
        sentToAdmin: true
    };
    
    // Save feedback
    saveFeedback(feedback);
    
    // Show success notification
    addNotification('Emoji Sent to Admin!', `You sent ${emoji} to the mess admin`, 'success');
    
    // Update recent feedback list
    updateRecentFeedbackList();
    
    // Add to emoji display
    addToEmojiDisplay(feedback);
}

function setRating(rating) {
    state.currentRating = rating;
    
    // Update star display
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-yellow-400');
            star.classList.remove('text-gray-300');
        } else {
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-300');
        }
    });
}

function resetRatingStars() {
    state.currentRating = 0;
    
    // Reset star display
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
        star.classList.remove('text-yellow-400');
        star.classList.add('text-gray-300');
    });
}

function updateRecentFeedbackList() {
    // Get recent feedback from state or localStorage
    const recentFeedback = state.recentFeedback || JSON.parse(localStorage.getItem('messBuddyFeedback') || '[]').slice(-5);
    
    // Update the recent feedback list in the UI
    const container = document.getElementById('recentFeedbackList');
    if (container && recentFeedback.length > 0) {
        // This would update the UI with new feedback
        console.log('Recent feedback list updated:', recentFeedback);
    }
}

function addToRecentFeedbackDisplay(feedback) {
    // Add new feedback to the display immediately
    const container = document.getElementById('recentFeedbackList');
    if (container) {
        // Create new feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'border-b border-gray-200 dark:border-gray-700 pb-4';
        
        let contentHTML = '';
        
        if (feedback.type === 'emoji') {
            contentHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3">
                        <img src="${feedback.userAvatar}" alt="User" class="w-10 h-10 rounded-full">
                        <div>
                            <div class="flex items-center space-x-2">
                                <p class="font-medium text-gray-900 dark:text-white">${feedback.userName}</p>
                                <span class="text-2xl">${feedback.emoji}</span>
                                <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Sent to Admin</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Emoji Reaction</p>
                            <p class="mt-1 text-gray-900 dark:text-white">User sent an emoji reaction to the mess admin</p>
                        </div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Just now</span>
                </div>
            `;
        } else if (feedback.type === 'quick') {
            const quickIcons = {
                excellent: '🌟',
                good: '😊',
                average: '😐',
                poor: '😢'
            };
            contentHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3">
                        <img src="${feedback.userAvatar}" alt="User" class="w-10 h-10 rounded-full">
                        <div>
                            <div class="flex items-center space-x-2">
                                <p class="font-medium text-gray-900 dark:text-white">${feedback.userName}</p>
                                <span class="text-2xl">${quickIcons[feedback.quickType]}</span>
                                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Quick Feedback</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Quick Feedback</p>
                            <p class="mt-1 text-gray-900 dark:text-white">User provided quick feedback: ${feedback.quickType}</p>
                        </div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Just now</span>
                </div>
            `;
        } else {
            // Generate star rating display
            const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
            contentHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3">
                        <img src="${feedback.userAvatar}" alt="User" class="w-10 h-10 rounded-full">
                        <div>
                            <div class="flex items-center space-x-2">
                                <p class="font-medium text-gray-900 dark:text-white">${feedback.userName}</p>
                                <span class="text-yellow-500 text-sm">${stars}</span>
                                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Detailed Feedback</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${feedback.mealType} - ${feedback.dishName}</p>
                            <p class="mt-1 text-gray-900 dark:text-white">${feedback.comment}</p>
                        </div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Just now</span>
                </div>
            `;
        }
        
        feedbackElement.innerHTML = contentHTML;
        
        // Add to the top of the list
        container.insertBefore(feedbackElement, container.firstChild);
        
        // Remove last element if there are too many
        while (container.children.length > 5) {
            container.removeChild(container.lastChild);
        }
    }
}

function addToEmojiDisplay(feedback) {
    // Add emoji to a special emoji display area
    let emojiContainer = document.getElementById('emojiDisplay');
    if (!emojiContainer) {
        // Create emoji display container if it doesn't exist
        emojiContainer = document.createElement('div');
        emojiContainer.id = 'emojiDisplay';
        emojiContainer.className = 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6';
        emojiContainer.innerHTML = `
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                <i class="fas fa-smile text-yellow-500 mr-2"></i>Recent Emoji Reactions
            </h4>
            <div class="flex flex-wrap gap-2" id="emojiList"></div>
        `;
        
        // Insert before the recent feedback section
        const recentFeedbackSection = document.querySelector('#feedbackPage .bg-white.dark\\:bg-gray-800:last-of-type');
        if (recentFeedbackSection) {
            recentFeedbackSection.parentNode.insertBefore(emojiContainer, recentFeedbackSection);
        }
    }
    
    // Add emoji to the list
    const emojiList = document.getElementById('emojiList');
    if (emojiList) {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg';
        emojiElement.innerHTML = `
            <span class="text-lg">${feedback.emoji}</span>
            <span class="text-xs text-gray-600 dark:text-gray-400">${feedback.userName}</span>
        `;
        
        emojiList.insertBefore(emojiElement, emojiList.firstChild);
        
        // Keep only last 10 emojis
        while (emojiList.children.length > 10) {
            emojiList.removeChild(emojiList.lastChild);
        }
    }
}

function initializeFeedbackAnalytics() {
    // Initialize feedback analytics and sentiment analysis
    const analytics = {
        sentimentAnalysis: performSentimentAnalysis(),
        trendingTopics: getTrendingTopics(),
        feedbackPatterns: analyzeFeedbackPatterns()
    };
    
    console.log('Feedback analytics initialized:', analytics);
}

function performSentimentAnalysis() {
    // Simple sentiment analysis based on feedback
    const feedback = state.feedback || [];
    const sentiments = {
        positive: 0,
        neutral: 0,
        negative: 0
    };
    
    feedback.forEach(item => {
        if (item.rating >= 4) {
            sentiments.positive++;
        } else if (item.rating === 3) {
            sentiments.neutral++;
        } else {
            sentiments.negative++;
        }
    });
    
    return sentiments;
}

function getTrendingTopics() {
    // Analyze trending topics from feedback
    const topics = [
        { name: 'Food Quality', mentions: 42, sentiment: 'positive' },
        { name: 'Service Speed', mentions: 28, sentiment: 'positive' },
        { name: 'Hygiene', mentions: 15, sentiment: 'neutral' },
        { name: 'Variety', mentions: 12, sentiment: 'mixed' }
    ];
    
    return topics;
}

function analyzeFeedbackPatterns() {
    // Analyze patterns in feedback
    const patterns = {
        bestMealTime: 'Lunch',
        commonComplaints: ['Food too salty', 'Small portions', 'Long wait times'],
        commonPraises: ['Fresh ingredients', 'Good variety', 'Friendly staff']
    };
    
    return patterns;
}

// AI Recommendations Page Functions
function showRecommendationsPage() {
    hideAllPages();
    document.getElementById('recommendationsPage').classList.remove('hidden');
    state.currentPage = 'recommendations';
    
    // Initialize AI recommendations
    initializeAIRecommendations();
}

function initializeAIRecommendations() {
    // Load user preferences and generate recommendations
    const userPreferences = getUserPreferences();
    const recommendations = generateAIRecommendations(userPreferences);
    
    // Update recommendation cards
    updateRecommendationCards(recommendations);
    
    // Initialize AI insights
    updateAIInsights();
}

function getUserPreferences() {
    // Get user's rating history to analyze preferences
    const userRatings = Object.keys(state.ratings).map(itemId => ({
        itemId: itemId,
        rating: state.ratings[itemId]
    }));
    
    // Analyze patterns (simplified for demo)
    const preferences = {
        favoriteCuisine: 'Indian',
        spiceLevel: 'Medium',
        dietaryPreference: 'Vegetarian',
        avgRating: userRatings.length > 0 ? 
            userRatings.reduce((sum, item) => sum + item.rating, 0) / userRatings.length : 4.0
    };
    
    return preferences;
}

function generateAIRecommendations(preferences) {
    // Simulate AI recommendation algorithm
    const allDishes = [
        { name: 'Paneer Tikka', rating: 4.8, cuisine: 'Indian', type: 'vegetarian', spice: 'medium' },
        { name: 'Dal Makhani', rating: 4.6, cuisine: 'Indian', type: 'vegetarian', spice: 'medium' },
        { name: 'Mixed Veg', rating: 4.2, cuisine: 'Indian', type: 'vegetarian', spice: 'mild' },
        { name: 'Butter Chicken', rating: 4.9, cuisine: 'Indian', type: 'non-veg', spice: 'medium' },
        { name: 'Biryani', rating: 4.7, cuisine: 'Indian', type: 'non-veg', spice: 'spicy' },
        { name: 'Noodles', rating: 4.5, cuisine: 'Chinese', type: 'vegetarian', spice: 'mild' },
        { name: 'Thai Curry', rating: 4.4, cuisine: 'Thai', type: 'vegetarian', spice: 'spicy' },
        { name: 'Pasta', rating: 4.3, cuisine: 'Italian', type: 'vegetarian', spice: 'mild' },
        { name: 'Spring Rolls', rating: 4.1, cuisine: 'Chinese', type: 'vegetarian', spice: 'mild' }
    ];
    
    // Filter and rank based on preferences
    const recommended = allDishes
        .filter(dish => dish.type === preferences.dietaryPreference.toLowerCase() || preferences.dietaryPreference === 'Non-Vegetarian')
        .filter(dish => dish.spice === preferences.spiceLevel.toLowerCase())
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    
    const trending = allDishes
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    
    const explore = allDishes
        .filter(dish => dish.cuisine !== preferences.favoriteCuisine)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    
    return { recommended, trending, explore };
}

function updateRecommendationCards(recommendations) {
    // Update the recommendation cards with AI-generated content
    console.log('AI Recommendations updated:', recommendations);
}

function updateAIInsights() {
    // Generate personalized AI insights
    const insights = {
        preference: 'Medium spicy vegetarian dishes',
        bestMealTime: 'Lunch (12:00 - 2:00 PM)',
        nextRecommendation: 'Try tomorrow\'s special dish'
    };
    
    console.log('AI Insights updated:', insights);
}

// Nutrition Page Functions
function showNutritionPage() {
    hideAllPages();
    document.getElementById('nutritionPage').classList.remove('hidden');
    state.currentPage = 'nutrition';
    
    // Initialize nutrition tracking
    initializeNutritionTracking();
}

function initializeNutritionTracking() {
    // Load today's nutrition data
    const todayNutrition = getTodayNutritionData();
    
    // Update nutrition displays
    updateNutritionCards(todayNutrition);
    
    // Initialize nutrition chart
    initializeNutritionChart();
    
    // Update meal breakdown
    updateMealBreakdown();
}

function getTodayNutritionData() {
    // Simulate today's nutrition data
    return {
        calories: { current: 1850, goal: 2200, percentage: 84 },
        protein: { current: 65, goal: 75, percentage: 87 },
        carbs: { current: 280, goal: 300, percentage: 93 },
        fats: { current: 55, goal: 65, percentage: 85 }
    };
}

function updateNutritionCards(nutrition) {
    // Update nutrition progress bars and values
    Object.keys(nutrition).forEach(macro => {
        const data = nutrition[macro];
        console.log(`Updated ${macro}: ${data.current}/${data.goal} (${data.percentage}%)`);
    });
}

function initializeNutritionChart() {
    const ctx = document.getElementById('nutritionChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calories',
                    data: [2100, 1950, 2200, 1850, 2000, 1900, 1850],
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Protein',
                    data: [70, 65, 75, 65, 68, 62, 65],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
}

function updateMealBreakdown() {
    // Update meal breakdown with today's data
    const meals = [
        { name: 'Breakfast', items: 'Idli, Sambar, Chutney', calories: 420, time: '8:00 AM' },
        { name: 'Lunch', items: 'Rice, Dal, Paneer, Roti', calories: 780, time: '1:00 PM' },
        { name: 'Snacks', items: 'Samosa, Tea', calories: 250, time: '4:30 PM' },
        { name: 'Dinner', items: 'Rice, Chicken Curry, Salad', calories: 400, time: '8:00 PM' }
    ];
    
    console.log('Meal breakdown updated:', meals);
}

// Social Page Functions
function showSocialPage() {
    hideAllPages();
    document.getElementById('socialPage').classList.remove('hidden');
    state.currentPage = 'social';
    
    // Initialize social features
    initializeSocialFeatures();
}

function initializeSocialFeatures() {
    // Load social feed
    loadSocialFeed();
    
    // Load top reviewers
    loadTopReviewers();
    
    // Load trending dishes
    loadTrendingDishes();
    
    // Initialize challenges
    initializeChallenges();
}

function loadSocialFeed() {
    // Load user posts and reviews
    const posts = [
        {
            user: 'John Doe',
            avatar: 'user1',
            time: '2 hours ago',
            rating: 5.0,
            content: 'Today\'s lunch was amazing! The paneer butter masala was perfectly cooked and the rotis were fresh. Highly recommend! 🍽️',
            image: 'food1',
            likes: 24,
            comments: 8
        },
        {
            user: 'Sarah Smith',
            avatar: 'user2',
            time: '4 hours ago',
            rating: 4.0,
            content: 'The breakfast was good but the coffee could be better. Overall decent experience! ☕',
            likes: 15,
            comments: 3
        }
    ];
    
    console.log('Social feed loaded:', posts);
}

function loadTopReviewers() {
    // Load top reviewers data
    const topReviewers = [
        { name: 'Mike Johnson', avatar: 'top1', level: 5, reviews: 342 },
        { name: 'Emily Chen', avatar: 'top2', level: 4, reviews: 289 },
        { name: 'David Lee', avatar: 'top3', level: 4, reviews: 256 }
    ];
    
    console.log('Top reviewers loaded:', topReviewers);
}

function loadTrendingDishes() {
    // Load trending dishes data
    const trendingDishes = [
        { name: 'Butter Chicken', reviews: 128, rating: 4.8 },
        { name: 'Paneer Tikka', reviews: 95, rating: 4.7 },
        { name: 'Dal Makhani', reviews: 87, rating: 4.6 }
    ];
    
    console.log('Trending dishes loaded:', trendingDishes);
}

function initializeChallenges() {
    // Initialize weekly challenges
    const challenge = {
        title: 'Review 5 different dishes this week!',
        progress: 3,
        total: 5,
        percentage: 60
    };
    
    console.log('Weekly challenge initialized:', challenge);
}

function renderComplaints() {
    const container = document.getElementById('complaintsList');
    container.innerHTML = '';
    
    const complaints = [
        {
            id: 1,
            category: 'taste',
            title: 'Food too salty',
            description: 'The lunch items were too salty today',
            priority: 'medium',
            status: 'pending',
            timestamp: '2024-01-15T10:30:00Z',
            userId: 123
        },
        {
            id: 2,
            category: 'hygiene',
            title: 'Cleanliness issue',
            description: 'The dining area was not properly cleaned',
            priority: 'high',
            status: 'resolved',
            timestamp: '2024-01-15T09:15:00Z',
            userId: 124
        },
        {
            id: 3,
            category: 'quantity',
            title: 'Insufficient quantity',
            description: 'Not enough food served during dinner',
            priority: 'medium',
            status: 'pending',
            timestamp: '2024-01-14T20:45:00Z',
            userId: 125
        }
    ];
    
    complaints.forEach(complaint => {
        const complaintCard = createComplaintCard(complaint);
        container.appendChild(complaintCard);
    });
}

function createComplaintCard(complaint) {
    const card = document.createElement('div');
    card.className = 'complaint-card border border-gray-200 dark:border-gray-700 rounded-lg p-4';
    
    const statusClass = complaint.status === 'resolved' ? 'status-resolved' : 'status-pending';
    const priorityClass = complaint.priority === 'high' ? 'priority-high' : 
                          complaint.priority === 'medium' ? 'priority-medium' : 'priority-low';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div>
                <h4 class="font-medium text-gray-900 dark:text-white">${complaint.title}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${complaint.description}</p>
            </div>
            <div class="flex space-x-2">
                <span class="status-badge ${statusClass}">${complaint.status}</span>
                <span class="status-badge ${priorityClass}">${complaint.priority}</span>
            </div>
        </div>
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>Category: ${complaint.category}</span>
            <span>${new Date(complaint.timestamp).toLocaleDateString()}</span>
        </div>
        ${state.isAdmin && complaint.status === 'pending' ? `
            <div class="mt-3 flex space-x-2">
                <button class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700" 
                        onclick="resolveComplaint(${complaint.id})">
                    Mark Resolved
                </button>
                <button class="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700" 
                        onclick="escalateComplaint(${complaint.id})">
                    Escalate
                </button>
            </div>
        ` : ''}
    `;
    
    return card;
}

function showComplaintModal() {
    document.getElementById('complaintModal').classList.remove('hidden');
}

function hideComplaintModal() {
    document.getElementById('complaintModal').classList.add('hidden');
    document.getElementById('complaintForm').reset();
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    
    const complaint = {
        id: Date.now(),
        category: document.getElementById('complaintCategory').value,
        description: document.getElementById('complaintDescription').value,
        priority: document.getElementById('complaintPriority').value,
        status: 'pending',
        timestamp: new Date().toISOString(),
        userId: state.currentUser.id
    };
    
    state.complaints.push(complaint);
    localStorage.setItem('messBuddyComplaints', JSON.stringify(state.complaints));
    
    hideComplaintModal();
    renderComplaints();
    
    addNotification('Complaint Submitted', 'Your complaint has been registered', 'success');
}

function filterComplaints() {
    const filter = document.getElementById('complaintFilter').value;
    // Filter logic would go here
    console.log(`Filtering complaints by: ${filter}`);
}

function resolveComplaint(complaintId) {
    const complaint = state.complaints.find(c => c.id === complaintId);
    if (complaint) {
        complaint.status = 'resolved';
        localStorage.setItem('messBuddyComplaints', JSON.stringify(state.complaints));
        renderComplaints();
        addNotification('Complaint Resolved', 'The complaint has been marked as resolved', 'success');
    }
}

function escalateComplaint(complaintId) {
    const complaint = state.complaints.find(c => c.id === complaintId);
    if (complaint) {
        complaint.priority = 'high';
        localStorage.setItem('messBuddyComplaints', JSON.stringify(state.complaints));
        renderComplaints();
        addNotification('Complaint Escalated', 'The complaint has been escalated', 'warning');
    }
}

// Dashboard Functions
function updateDashboardStats() {
    // Update stats with real data
    const stats = calculateStats();
    
    // Update stat cards
    document.querySelector('.text-2xl.font-bold').textContent = stats.averageRating.toFixed(1) + ' ⭐';
    // Update other stats...
}

function calculateStats() {
    const allRatings = Object.values(state.ratings);
    const averageRating = allRatings.length > 0 ? 
        allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
    
    const satisfactionScore = Math.round((averageRating / 5) * 100);
    
    return {
        averageRating: averageRating || 4.2,
        satisfactionScore: satisfactionScore || 87,
        totalReviews: state.feedback.length || 156,
        pendingComplaints: state.complaints.filter(c => c.status === 'pending').length || 8
    };
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    const activities = [
        { type: 'rating', message: 'John rated "Paneer Butter Masala" 5 stars', time: '2 minutes ago' },
        { type: 'complaint', message: 'New complaint raised about food quality', time: '5 minutes ago' },
        { type: 'feedback', message: 'Sarah provided feedback on breakfast items', time: '10 minutes ago' },
        { type: 'resolved', message: 'Complaint about hygiene was resolved', time: '15 minutes ago' }
    ];
    
    activities.forEach(activity => {
        const activityItem = createActivityItem(activity);
        container.appendChild(activityItem);
    });
}

function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg';
    
    const icon = getActivityIcon(activity.type);
    
    item.innerHTML = `
        <div class="flex-shrink-0">
            <span class="text-2xl">${icon}</span>
        </div>
        <div class="flex-1">
            <p class="text-sm text-gray-900 dark:text-white">${activity.message}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${activity.time}</p>
        </div>
    `;
    
    return item;
}

function getActivityIcon(type) {
    const icons = {
        rating: '⭐',
        complaint: '⚠️',
        feedback: '💬',
        resolved: '✅'
    };
    return icons[type] || '📝';
}

function initializeDashboardCharts() {
    const ctx = document.getElementById('quickStatsChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
                datasets: [{
                    label: 'Average Rating',
                    data: [4.1, 4.3, 4.2, 4.0],
                    backgroundColor: [
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 3,
                        max: 5
                    }
                }
            }
        });
    }
}

// Notification System
function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title: title,
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    state.notifications.unshift(notification);
    if (state.notifications.length > 10) {
        state.notifications.pop();
    }
    
    updateNotificationBadge();
    renderNotifications();
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('hidden');
}

function updateNotificationBadge() {
    const unreadCount = state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderNotifications() {
    const container = document.getElementById('notificationsList');
    container.innerHTML = '';
    
    if (state.notifications.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 p-4">No notifications</p>';
        return;
    }
    
    state.notifications.forEach(notification => {
        const notificationItem = createNotificationItem(notification);
        container.appendChild(notificationItem);
    });
}

function createNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = `p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`;
    
    const icon = getNotificationIcon(notification.type);
    
    item.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <span class="text-xl">${icon}</span>
            </div>
            <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">${notification.title}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${notification.message}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${formatTime(notification.timestamp)}</p>
            </div>
            ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
        </div>
    `;
    
    item.addEventListener('click', () => {
        notification.read = true;
        updateNotificationBadge();
        renderNotifications();
    });
    
    return item;
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Data Management Functions
function loadSavedData() {
    // Load registered users
    const savedRegisteredUsers = localStorage.getItem('messBuddyRegisteredUsers');
    if (savedRegisteredUsers) {
        // This is used for login validation
    }
    
    // Load ratings
    const savedRatings = localStorage.getItem('messBuddyRatings');
    if (savedRatings) {
        state.ratings = JSON.parse(savedRatings);
    }
    
    // Load feedback
    const savedFeedback = localStorage.getItem('messBuddyFeedback');
    if (savedFeedback) {
        state.feedback = JSON.parse(savedFeedback);
    }
    
    // Load complaints
    const savedComplaints = localStorage.getItem('messBuddyComplaints');
    if (savedComplaints) {
        state.complaints = JSON.parse(savedComplaints);
    }
    
    // Load notifications
    const savedNotifications = localStorage.getItem('messBuddyNotifications');
    if (savedNotifications) {
        state.notifications = JSON.parse(savedNotifications);
    }
}

function loadSampleData() {
    // Load sample data if no data exists
    if (state.feedback.length === 0) {
        // Add sample feedback
        const sampleFeedback = [
            { id: 1, itemId: 1, type: 'tasty', userId: 123, timestamp: new Date().toISOString(), sentiment: 'positive' },
            { id: 2, itemId: 2, type: 'salty', userId: 124, timestamp: new Date().toISOString(), sentiment: 'negative' },
            { id: 3, itemId: 3, type: 'voice', text: 'The food was excellent today', userId: 125, timestamp: new Date().toISOString(), sentiment: 'positive' }
        ];
        state.feedback = sampleFeedback;
        localStorage.setItem('messBuddyFeedback', JSON.stringify(state.feedback));
    }
    
    if (state.complaints.length === 0) {
        // Add sample complaints
        const sampleComplaints = [
            { id: 1, category: 'taste', description: 'Food too salty', priority: 'medium', status: 'pending', timestamp: new Date().toISOString(), userId: 123 },
            { id: 2, category: 'hygiene', description: 'Cleanliness issue', priority: 'high', status: 'resolved', timestamp: new Date().toISOString(), userId: 124 }
        ];
        state.complaints = sampleComplaints;
        localStorage.setItem('messBuddyComplaints', JSON.stringify(state.complaints));
    }
}

function updateAnalyticsData() {
    // This function would update analytics based on current data
    // In a real app, this would make API calls to update the backend
    console.log('Updating analytics data...');
}

// Utility Functions
function viewFeedback(itemId) {
    // Show feedback modal with all feedback for this item
    const itemFeedback = state.feedback.filter(f => f.itemId === itemId);
    console.log('Feedback for item', itemId, itemFeedback);
    
    // Create and show modal
    alert(`Feedback for item ${itemId}:\n${itemFeedback.map(f => `${f.type}: ${f.text || 'Quick feedback'}`).join('\n')}`);
}

// AI-powered Predictive Intelligence
function generatePredictions() {
    // Simulate AI predictions
    const predictions = [
        {
            type: 'rating',
            prediction: 'Lunch may receive low ratings tomorrow',
            confidence: 0.75,
            suggestion: 'Consider reducing spice levels'
        },
        {
            type: 'trend',
            prediction: 'Weekend dinner ratings consistently 15% lower',
            confidence: 0.85,
            suggestion: 'Add special weekend menu items'
        },
        {
            type: 'improvement',
            prediction: 'Breakfast variety needs improvement',
            confidence: 0.65,
            suggestion: 'Add more breakfast options'
        }
    ];
    
    return predictions;
}

// Gamification Functions
function calculateUserPoints() {
    // Calculate points based on user activity
    let points = 0;
    
    // Points for ratings
    points += Object.keys(state.ratings).length * 10;
    
    // Points for feedback
    points += state.feedback.filter(f => f.userId === state.currentUser.id).length * 15;
    
    // Points for resolved complaints (if admin)
    if (state.isAdmin) {
        points += state.complaints.filter(c => c.status === 'resolved').length * 25;
    }
    
    return points;
}

function getUserLevel() {
    const points = calculateUserPoints();
    
    if (points < 100) return { level: 1, title: 'Newbie', nextLevel: 100 };
    if (points < 250) return { level: 2, title: 'Food Critic', nextLevel: 250 };
    if (points < 500) return { level: 3, title: 'Mess Expert', nextLevel: 500 };
    if (points < 1000) return { level: 4, title: 'Mess Master', nextLevel: 1000 };
    return { level: 5, title: 'Mess Legend', nextLevel: 1000 };
}

// QR Code Generation (placeholder)
function generateQRCode() {
    // In a real app, this would generate a QR code linking to the current menu
    const qrData = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: state.currentUser?.id || 'anonymous'
    };
    
    console.log('QR Code Data:', qrData);
    alert('QR Code generated! In a real app, this would display a scannable QR code.');
}

// Export functions for global access
window.rateItem = rateItem;
window.quickFeedback = quickFeedback;
window.voiceFeedback = voiceFeedback;
window.stopVoiceRecording = stopVoiceRecording;
window.viewFeedback = viewFeedback;
window.resolveComplaint = resolveComplaint;
window.escalateComplaint = escalateComplaint;
window.generateQRCode = generateQRCode;
