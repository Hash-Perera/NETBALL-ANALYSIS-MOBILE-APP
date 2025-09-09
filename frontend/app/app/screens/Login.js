import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { BASEURL, setToken } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleChange = (key, value) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            return setErrorMessage("Please fill out all the fields.");
        }

        try {
            setLoading(true);
            setErrorMessage(null);
            const res = await fetch(BASEURL + 'users/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            setLoading(false);

            if (data.message === "Invalid email or password") {
                return setErrorMessage(data.message);
            }

            if (res.ok) {
                await setToken(data.token);
                await AsyncStorage.setItem('userId', data.user.id);
                await AsyncStorage.setItem('userFullName', data.user.fullName);
                await AsyncStorage.setItem('userEmail', data.user.email);
                await AsyncStorage.setItem('userRole', data.user.profileType);
                console.log("jwt token-----", data.token);
                setFormData({ email: '', password: '' });
                navigation.navigate('Main');
            } else {
                setErrorMessage("An unexpected error occurred. Please try again.");
            }
        } catch (error) {
            setLoading(false);
            setErrorMessage("Network error. Please check your connection and try again.");
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : null}
        >
            <Text style={styles.title}>Sign In</Text>
            <Image
                source={require("../../assets/img/signIn.jpg")}
                style={styles.reactLogo}
                resizeMode="cover"
            />

            <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#8e8e93"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8e8e93"
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry
            />

            {loading ? (
                <ActivityIndicator size="large" color="#ef5350" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
            )}

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            {!isKeyboardVisible && ( // Hide when keyboard is open
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.signupLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        color: '#000',
        marginBottom: 40,
    },
    reactLogo: {
        height: 238,
        width: '60%',
        bottom: 10,
        left: 0,
        position: "relative",
    },
    input: {
        width: '80%',
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 16,
        paddingHorizontal: 8,
        borderRadius: 5,
        paddingStart: 16
    },
    button: {
        width: '80%',
        height: 50,
        backgroundColor: '#ef5350',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
    },
    signupContainer: {
        flexDirection: 'row',
        marginTop: 20,
        position: 'absolute',
        bottom: 30,
    },
    signupText: {
        color: '#000',
        top: 10,
    },
    signupLink: {
        color: '#ef5350',
        marginLeft: 5,
        top: 10,
    },
    error: {
        color: 'red',
        marginBottom: 20,
    },
});
