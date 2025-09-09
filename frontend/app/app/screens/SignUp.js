import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import { BASEURL } from '../../constants';

const { width, height } = Dimensions.get('window');

export default function SignUp({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    conpass: '',
    profileType: '',
    selectedCoach: null,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [showCoachDropdown, setShowCoachDropdown] = useState(false);

  const fetchCoaches = async () => {
    try {
      const res = await fetch(BASEURL + 'users/coaches');
      const data = await res.json();
      setCoaches(data);
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  React.useEffect(() => {
    fetchCoaches();
  }, []);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    if (key === 'profileType') {
      setShowCoachDropdown(value === 'Player');
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.conpass || !formData.profileType) {
      return setErrorMessage("Please fill out all the fields.");
    }
  
    // Password Validation Rules
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
    if (!passwordRegex.test(formData.password)) {
      return setErrorMessage("Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.");
    }
  
    if (formData.password !== formData.conpass) {
      return setErrorMessage("Passwords do not match.");
    }
  
    try {
      setLoading(true);
      setErrorMessage(null);
  
      const res = await fetch(BASEURL + 'users/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          profileType: formData.profileType,
          selectedCoach: formData.selectedCoach,
        }),
      });
  
      const data = await res.json();
  
      if (data.message === "Email already in use") {
        setLoading(false);
        return setErrorMessage(data.message);
      }
  
      setLoading(false);
      if (res.ok) {
        navigation.navigate('Login');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Sign Up</Text>
      <Image
        source={require("../../assets/img/signUp.jpg")}
        style={styles.reactLogo}
        resizeMode="cover"
      />
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#8e8e93"
        onChangeText={(value) => handleChange('fullName', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#8e8e93"
        onChangeText={(value) => handleChange('email', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8e8e93"
        onChangeText={(value) => handleChange('password', value)}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#8e8e93"
        onChangeText={(value) => handleChange('conpass', value)}
        secureTextEntry
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.profileType}
          onValueChange={(value) => handleChange('profileType', value)}
        >
          <Picker.Item label="Select Profile Type" value="" color='gray' style={{ fontSize: 14, fontWeight: 'normal', textAlign: 'left' }} />
          <Picker.Item label="Player" value="Player" color='black' style={{ fontSize: 14, fontWeight: 'normal', textAlign: 'left' }} />
          <Picker.Item label="Coach" value="Coach" color='black' style={{ fontSize: 14, fontWeight: 'normal', textAlign: 'left' }} />
        </Picker>
      </View>

      {showCoachDropdown && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.selectedCoach}
            onValueChange={(value) => handleChange('selectedCoach', value)}
          >
            <Picker.Item label="Select Coach" value={null} color='black' style={{ fontSize: 14, fontWeight: 'normal', textAlign: 'left' }} />
            {coaches.map((coach) => (
              <Picker.Item key={coach._id} label={coach.fullName} value={coach._id} color='black' style={{ fontSize: 14, fontWeight: 'normal', textAlign: 'left' }} />
            ))}
          </Picker>
        </View>
      )}

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      {loading ? (
        <ActivityIndicator size='large' color='#ef5350' />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      <View style={styles.signinContainer}>
        <Text style={styles.signinText}>Have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signinLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    color: '#000',
    marginBottom: 40,
  },
  reactLogo: {
    height: 200,
    width: '65%',
    bottom: 10,
    left: 0,
    position: "relative",
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    paddingStart: 16
  },
  pickerContainer: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    color: 'gray',
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingLeft: 0
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
    color: '#000000',
    fontSize: 18,
  },
  signinContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signinText: {
    color: '#000',
  },
  signinLink: {
    color: '#ef5350',
    marginLeft: 5,
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
});
