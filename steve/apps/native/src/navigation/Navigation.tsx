import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileSetupScreen from "../screens/ProfileSetupScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddFriendsScreen from "../screens/AddFriendsScreen";
import SearchResultScreen from "../screens/SearchResultScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import ReportsScreen from "../screens/ReportsScreen";
import DiscoveryScreen from "../screens/DiscoveryScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import InboxScreen from "../screens/InboxScreen";
import NotesHomeScreen from "../screens/NotesHomeScreen";
import InsideNoteScreen from "../screens/InsideNoteScreen";
import CreateNotePlaceholderScreen from "../screens/CreateNotePlaceholderScreen";
import ChatShellScreen from "../screens/ChatShellScreen";
import NativeBootstrapScreen from "../screens/NativeBootstrapScreen";
import { useNativeSession } from "../session/NativeSessionProvider";
import { NATIVE_ROUTES, resolveRootRoute } from "./nativeNavigationModel";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      initialRouteName={NATIVE_ROUTES.inbox}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0D87E1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          borderTopColor: "#E5E7EB",
          backgroundColor: "#FFFFFF",
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === NATIVE_ROUTES.inbox
              ? "chatbubble-ellipses-outline"
              : route.name === NATIVE_ROUTES.profile
                ? "person-outline"
                : "document-text-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={NATIVE_ROUTES.inbox}
        component={InboxScreen}
        options={{ title: "Inbox" }}
      />
      <Tab.Screen
        name={NATIVE_ROUTES.notes}
        component={NotesHomeScreen}
        options={{ title: "Notes" }}
      />
      <Tab.Screen
        name={NATIVE_ROUTES.profile}
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { hasProfile, isAuthenticated, sessionReady } = useNativeSession();
  const initialRouteName = resolveRootRoute({
    hasSessionToken: isAuthenticated,
    hasProfile,
  });

  return (
    <NavigationContainer>
      {!sessionReady ? (
        <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="NativeBootstrapScreen" component={NativeBootstrapScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          id={undefined}
          initialRouteName={initialRouteName}
          screenOptions={{ headerShown: false }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name={NATIVE_ROUTES.login} component={LoginScreen} />
              <Stack.Screen name={NATIVE_ROUTES.register} component={RegisterScreen} />
            </>
          ) : !hasProfile ? (
            <Stack.Screen
              name={NATIVE_ROUTES.profileSetup}
              component={ProfileSetupScreen}
            />
          ) : (
            <>
              <Stack.Screen name={NATIVE_ROUTES.mainTabs} component={MainTabs} />
              <Stack.Screen name={NATIVE_ROUTES.profile} component={ProfileScreen} />
              <Stack.Screen name={NATIVE_ROUTES.addFriends} component={AddFriendsScreen} />
              <Stack.Screen
                name={NATIVE_ROUTES.searchResult}
                component={SearchResultScreen}
              />
              <Stack.Screen
                name={NATIVE_ROUTES.preferences}
                component={PreferencesScreen}
              />
              <Stack.Screen name={NATIVE_ROUTES.reports} component={ReportsScreen} />
              <Stack.Screen
                name={NATIVE_ROUTES.discovery}
                component={DiscoveryScreen}
              />
              <Stack.Screen
                name={NATIVE_ROUTES.profileEdit}
                component={ProfileEditScreen}
              />
              <Stack.Screen name={NATIVE_ROUTES.chat} component={ChatShellScreen} />
              <Stack.Screen
                name={NATIVE_ROUTES.insideNote}
                component={InsideNoteScreen}
              />
              <Stack.Screen
                name={NATIVE_ROUTES.createNote}
                component={CreateNotePlaceholderScreen}
              />
            </>
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default Navigation;
