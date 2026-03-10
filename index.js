import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// React Navigation v6 passes string props to native RNSScreen views,
// but RN 0.81 Fabric requires booleans. Disabling native screens avoids the crash.
enableScreens(false);

import App from './App';

registerRootComponent(App);
