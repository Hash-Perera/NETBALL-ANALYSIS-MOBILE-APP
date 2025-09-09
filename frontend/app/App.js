import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Login from './app/screens/Login';
import SignUp from './app/screens/SignUp';
import HomeScreen from './app/screens/Home';
import ProfileScreen from './app/screens/Profile';
import PlayerHistoryPage from './app/screens/PlayerHistoryPage';
import SuggestionScreen from './app/screens/Suggestion';
import TopPlayerMainScreen from './app/screens/TopPlayerMainScreen';

import BallHandlingTopPlayers from './app/screens/topPlayers/BallHandlingTopPlayers';
import DefenceAnalyzingTopPlayers from './app/screens/topPlayers/DefenceAnalyzingTopPlayers';
import AttackAnalyzingTopPlayers from './app/screens/topPlayers/AttackAnalyzingTopPlayers';

import BallHandlingAnalyzeScreen from './app/screens/Analyze/BallHandlingAnalyzeScreen';
import AttackAnalyzeScreen from './app/screens/Analyze/AttackAnalyzeScreen';
import DefenseAnalyzeScreen from './app/screens/Analyze/DefenseAnalyzeScreen';

import BallHandlingUploadScreen from './app/screens/upload/BallHandlingUploadScreen';
import AttackHandlingUploadScreen from './app/screens/upload/AttackHandlingUploadScreen';
import DefenseHandlingUploadScreen from './app/screens/upload/DefenseHandlingUploadScreen';

import InjuryDetectionScreen from './app/screens/Injury/InjuryDetectionScreen';
import MatchingPercentageGraph from './app/screens/MatchingPercentageGraph';
import InjuryPreventionScreen from './app/screens/Injury/InjuryPreventionScreen';
import PatientInfoScreen from './app/screens/Injury/PatientInfoScreen';

import { getUserRole } from './constants';

import { StyleSheet, LogBox, Text, View } from 'react-native';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PlayerHistoryPage" component={PlayerHistoryPage} options={{ headerShown: false }}/>
      <Stack.Screen name="TopPlayerMainScreen" component={TopPlayerMainScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BallHandlingTopPlayers" component={BallHandlingTopPlayers} options={{ headerShown: false }} />
      <Stack.Screen name="DefenceAnalyzingTopPlayers" component={DefenceAnalyzingTopPlayers} options={{ headerShown: false }} />
      <Stack.Screen name="AttackAnalyzingTopPlayers" component={AttackAnalyzingTopPlayers} options={{ headerShown: false }} />
      <Stack.Screen name="BallHandlingUploadScreen" component={BallHandlingUploadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AttackHandlingUploadScreen" component={AttackHandlingUploadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DefenseHandlingUploadScreen" component={DefenseHandlingUploadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BallHandlingAnalyzeScreen" component={BallHandlingAnalyzeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AttackAnalyzeScreen" component={AttackAnalyzeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DefenseAnalyzeScreen" component={DefenseAnalyzeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InjuryDetectionScreen" component={InjuryDetectionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InjuryPreventionScreen" component={InjuryPreventionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PatientInfoScreen" component={PatientInfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MatchingPercentageGraph" component={MatchingPercentageGraph} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
  );
}

function SuggestionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Suggestion" component={SuggestionScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    fetchUserRole();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Suggestion') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ef5350',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      {userRole === 'Player' && (
        <Tab.Screen name="Suggestion" component={SuggestionStack} options={{ headerShown: false }} />
      )}
      <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
        <Stack.Screen name='SignUp' component={SignUp} options={{ headerShown: false }} />
        <Stack.Screen name='Main' component={MainTabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textstyle: {
    color: '#FFF',
    fontSize: 30,
  }
});
