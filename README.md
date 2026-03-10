# SmartShop Scanner

A professional barcode scanner and retail management app for modern businesses.

## 🚀 Features

- **📱 Barcode Scanning** - Fast and accurate product scanning
- **🛒 Cart Management** - Easy product addition and quantity control
- **🖨️ Receipt Printing** - Bluetooth thermal printer support
- **📊 Sales Analytics** - Comprehensive sales reports and insights
- **⚙️ Admin Panel** - Product management and system settings
- **🌙 Dark Mode** - Comfortable viewing in any lighting
- **🌍 Multi-language** - English and Hindi support
- **📱 Offline Support** - Works without internet connection
- **🔒 Security** - Secure authentication and data protection
- **⚡ Performance** - Optimized for fast loading and smooth operation

## 🛠️ Technical Features

- **React Native** - Cross-platform mobile development
- **Expo** - Fast development and easy deployment
- **Bluetooth Integration** - Thermal printer connectivity
- **Local Storage** - Offline data persistence
- **Google Sheets API** - Cloud data synchronization
- **Performance Optimized** - Fast loading and smooth operation
- **Error Handling** - Robust error recovery and user feedback
- **Accessibility** - Full accessibility support
- **Testing** - Comprehensive test coverage

## 🔒 Security Features

- **Secure Authentication** - JWT-based token system
- **Input Validation** - Comprehensive data validation
- **Error Boundaries** - Graceful error handling
- **Permission Management** - Proper camera and Bluetooth permissions
- **Data Encryption** - Secure local storage
- **Rate Limiting** - API abuse prevention

## 📱 Screenshots

- **Scanner Screen** - Clean barcode scanning interface
- **Cart Screen** - Professional shopping cart management
- **Print Screen** - Receipt printing with Bluetooth support
- **Analytics Screen** - Sales reports and insights
- **Admin Screen** - Product and system management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartshop-scanner.git
   cd smartshop-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd SmartShopScanner
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the SmartShopScanner directory:

```env
# API Configuration
EXPO_PUBLIC_GOOGLE_SHEETS_API_URL=your_google_sheets_api_url
EXPO_PUBLIC_GOOGLE_APPS_SCRIPT_URL=your_google_apps_script_url

# App Configuration
EXPO_PUBLIC_SHOP_NAME=Your Shop Name
EXPO_PUBLIC_CURRENCY=₹

# Security Configuration (CHANGE THESE!)
EXPO_PUBLIC_ADMIN_PASSWORD=your-secure-admin-password
EXPO_PUBLIC_JWT_SECRET=your-secure-jwt-secret-key

# API Rate Limiting
EXPO_PUBLIC_API_RATE_LIMIT=100
EXPO_PUBLIC_API_RATE_LIMIT_WINDOW=60000

# Firebase Configuration (Optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Development Settings
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_LOG_LEVEL=info
```

### Google Sheets Setup

1. Create a Google Sheet with columns: `code`, `name`, `price`, `category`, `stock`
2. Set up NocodeAPI for Google Sheets integration
3. Update the API URL in environment variables

### Security Guidelines

1. **Change Default Passwords** - Always change default admin password
2. **Use Strong JWT Secret** - Use at least 32 characters for JWT secret
3. **Secure API Keys** - Never commit API keys to version control
4. **Regular Updates** - Keep dependencies updated
5. **Error Reporting** - Monitor and report errors

## 📦 Building for Production

### Android APK

```bash
npx expo build:android
```

### iOS IPA

```bash
npx expo build:ios
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## 🎯 Usage

### For Shop Owners

1. **Setup Products** - Add products via Admin panel
2. **Scan Products** - Use scanner to add items to cart
3. **Manage Cart** - Adjust quantities and view totals
4. **Print Receipts** - Connect Bluetooth printer and print
5. **View Analytics** - Monitor sales and performance

### For Developers

- **Modular Architecture** - Easy to extend and modify
- **Clean Code** - Well-documented and organized
- **Performance Optimized** - Fast loading and smooth operation
- **Error Handling** - Robust error recovery and user feedback
- **Testing** - Comprehensive test coverage
- **Security** - Secure authentication and data protection

## 🔒 Security

- **Local Data Storage** - Sensitive data stored locally
- **API Rate Limiting** - Prevents API abuse
- **Error Recovery** - Graceful handling of network issues
- **Permission Management** - Proper camera and Bluetooth permissions
- **Input Validation** - Comprehensive data validation
- **Secure Authentication** - JWT-based token system

## 📈 Performance

- **Fast Loading** - Optimized initialization
- **Smooth Scanning** - Real-time barcode detection
- **Efficient Sync** - Smart caching and background updates
- **Memory Optimized** - Minimal resource usage
- **Debounced Operations** - Prevents excessive API calls
- **Error Boundaries** - Graceful error recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@smartshop.com
- Documentation: [docs.smartshop.com](https://docs.smartshop.com)
- Issues: [GitHub Issues](https://github.com/yourusername/smartshop-scanner/issues)

## 🎉 Acknowledgments

- React Native community
- Expo team for excellent tooling
- Contributors and beta testers

---

**SmartShop Scanner** - Professional retail management made simple! 🚀 