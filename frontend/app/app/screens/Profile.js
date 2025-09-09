import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList
} from "react-native";
import * as AV from "expo-av";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BASEURL, getToken, getUserEmail, getUserFullName, getUserId } from '../../constants';

export default function Profile({ navigation }) {
  const videoRef = useRef(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [selectedSection, setSelectedSection] = useState('edit');
  const [historyType, setHistoryType] = useState('ballhandling');
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [analyzedVideoUrl, setAnalyzedVideoUrl] = useState(null);
  const [correctVideoUrl, setCorrectVideoUrl] = useState(null);
  const [wrongVideoUrl, setWrongVideoUrl] = useState(null);

  // Add state for other history types
  const [attackHistory, setAttackHistory] = useState([]);
  const [defenseHistory, setDefenseHistory] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = await getUserEmail();
        const name = await getUserFullName();
        setUserEmail(email);
        setUserName(name);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (selectedSection === 'history') {
      fetchUserHistory(historyType);
    }
  }, [selectedSection, historyType]);

  const fetchUserHistory = async (type) => {
    try {
      setLoadingHistory(true);
      const token = await getToken();
      const userId = await getUserId();
      
      let endpoint;
      switch(type) {
        case 'ballhandling':
          endpoint = `${BASEURL}ballhandling/videos/${userId}`;
          break;
        case 'attack':
          endpoint = `${BASEURL}attackanalysis/videos/${userId}`;
          break;
        case 'defense':
          endpoint = `${BASEURL}defenceanalysis/videos/${userId}`;
          break;
        default:
          endpoint = `${BASEURL}ballhandling/videos/${userId}`;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      // Update corresponding state based on history type
      switch(type) {
        case 'ballhandling':
          setHistoryData(data);
          break;
        case 'attack':
          setAttackHistory(data);
          break;
        case 'defense':
          setDefenseHistory(data);
          break;
      }

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id, type) => {
    try {
      const token = await getToken();
      let endpoint;
      
      switch(type) {
        case 'ballhandling':
          endpoint = `${BASEURL}ballhandling/delete/${id}`;
          break;
        case 'attack':
          endpoint = `${BASEURL}attackanalysis/delete/${id}`;
          break;
        case 'defense':
          endpoint = `${BASEURL}defenceanalysis/delete/${id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        // Update the correct state based on history type
        switch(type) {
          case 'ballhandling':
            setHistoryData(prev => prev.filter(item => item._id !== id));
            break;
          case 'attack':
            setAttackHistory(prev => prev.filter(item => item._id !== id));
            break;
          case 'defense':
            setDefenseHistory(prev => prev.filter(item => item._id !== id));
            break;
        }
      }
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const renderHistoryItem = ({ item }) => {
    // Determine the correct, wrong, and analyzed video links based on historyType
    let correctVideoUrl, wrongVideoUrl, analyzedVideoUrl;
  
    if (historyType === "ballhandling") {
      correctVideoUrl = item.ball_handling_correct_s3_link;
      wrongVideoUrl = item.ball_handling_wrong_s3_link;
      analyzedVideoUrl = item.ball_handling_analyzed_video_s3_link;
    } else if (historyType === "attack") {
      correctVideoUrl = item.attack_analysis_correct_s3_link;
      wrongVideoUrl = item.attack_analysis_wrong_s3_link;
      analyzedVideoUrl = item.attack_analysis_analyzed_video_s3_link;
    } else if (historyType === "defense") {
      correctVideoUrl = item.defence_analysis_correct_s3_link;
      wrongVideoUrl = item.defence_analysis_wrong_s3_link;
      analyzedVideoUrl = item.defence_analysis_analyzed_video_s3_link;
    }
  
    return (
      <View style={styles.historyItemContainer}>
        <View style={styles.historyItem}>
          <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.historyText}>
            {Number(
              item.ball_handling_matching_percentage ||
              item.attack_analysis_matching_percentage ||
              item.defense_analysis_matching_percentage
            ).toFixed(2)}% Match
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteHistory(item._id, historyType)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef5350" />
          </TouchableOpacity>
        </View>
  
        {/* Correct Video Section */}
        {correctVideoUrl && (
          <View>
            <Text style={styles.videoLabel}>Correct Video</Text>
            <AV.Video
              source={{ uri: correctVideoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              isLooping
              shouldPlay
              onFullscreenUpdate={true}
            />
          </View>
        )}
  
        {/* Wrong Video Section */}
        {wrongVideoUrl && (
          <View>
            <Text style={styles.videoLabel}>Wrong Video</Text>
            <AV.Video
              source={{ uri: wrongVideoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              isLooping
              shouldPlay
              onFullscreenUpdate={true}
            />
          </View>
        )}
  
        {/* Analyzed Video Section */}
        {analyzedVideoUrl && (
          <View>
            <Text style={styles.videoLabel}>Analyzed Video</Text>
            <AV.Video
              source={{ uri: analyzedVideoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              isLooping
              shouldPlay
              onFullscreenUpdate={true}
            />
          </View>
        )}
      </View>
    );
  };
  
  const handleSaveChanges = async () => {
    try {
      const token = await getToken();
      const userId = await getUserId();

      const payload = {
        fullName: newName,
        email: newEmail,
      };

      const response = await fetch(`${BASEURL}users/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setDisplayName(newName);
        setDisplayEmail(newEmail);
        setUserEmail(newEmail);
        setUserName(newName);
        setEditMode(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Implement logout logic here
      // For now, just navigate back
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  return (
    <View 
      style={styles.container} 
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Settings</Text>
      </View>

      <View style={styles.sectionSelector}>
        <TouchableOpacity
          style={[styles.sectionButton, selectedSection === 'edit' && styles.activeSection]}
          onPress={() => setSelectedSection('edit')}
        >
          <Text style={[styles.sectionButtonText, selectedSection === 'edit' && styles.activeText]}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionButton, selectedSection === 'history' && styles.activeSection]}
          onPress={() => setSelectedSection('history')}
        >
          <Text style={[styles.sectionButtonText, selectedSection === 'history' && styles.activeText]}>
            User History
          </Text>
        </TouchableOpacity>
      </View>

      {selectedSection === 'edit' ? (
        <>
     
        <View style={styles.profileSection}>
     
         <Image source={require("../../assets/img/profile.jpg")} style={styles.profileImage} />
         </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
            <View style={{display:'flex',alignContent:'center',justifyContent:'center',marginLeft:30,marginRight:30}}>
            <TextInput
              style={styles.inputField}
              placeholder="Name"
              value={newName}
              onChangeText={(text) => setNewName(text)}
              defaultValue={userName}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Email"
              value={newEmail}
              onChangeText={(text) => setNewEmail(text)}
              defaultValue={userEmail}
              keyboardType="email-address"
            />
        <TouchableOpacity style={styles.editProfileButton} onPress={() => editMode ? handleSaveChanges() : setEditMode(true)}>
          <Text style={styles.editProfileButtonText}>{editMode ? 'Save Changes' : 'Edit Profile'}</Text>
        </TouchableOpacity>
        </View>
       <View style={styles.signinContainer}>
              <Text style={styles.signinText}>Do you want to Leave?</Text>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.signinLink}>Log Out</Text>
              </TouchableOpacity>
            </View>
            </>
      ) : (
        <View style={styles.historyContainer}>
          <View style={styles.historyTypeSelector}>
            {['ballhandling', 'attack', 'defense'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.historyTypeButton,
                  historyType === type && styles.activeHistoryType
                ]}
                onPress={() => setHistoryType(type)}
              >
                <Text style={[
                  styles.historyTypeText,
                  historyType === type && styles.activeHistoryTypeText
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingHistory ? (
            <ActivityIndicator size="large" color="#ef5350" />
          ) : (
            <FlatList
              data={
                historyType === 'ballhandling' ? historyData :
                historyType === 'attack' ? attackHistory :
                defenseHistory
              }
              keyExtractor={(item) => item._id}
              renderItem={renderHistoryItem}
              ListEmptyComponent={
                <Text style={styles.noHistoryText}>No history found</Text>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

// Add these new styles to your existing StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  mainContainer:{
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent:'center'
  },
  header: {
    position:'absolute',
    width: '100%',
    backgroundColor: '#ef5350',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    
  },
  backButton: {
    marginTop: 30,
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    marginTop: 30
  },
  sectionSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 70,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sectionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  activeSection: {
    backgroundColor: '#ef5350',
  },
  sectionButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
  },
  historyContainer: {
    flex: 1,
    padding: 15,
  },
  historyTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  historyTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeHistoryType: {
    backgroundColor: '#393939',
  },
  historyTypeText: {
    color: '#666',
    fontSize: 12,
    fontWeight:'600'
  },
  activeHistoryTypeText: {
    color: '#fff',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop:50,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    justifyContent:'center',
    textAlign:'center'
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
    textAlign:'center'
  },
  inputField: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
    borderRadius: 5,
    paddingStart: 16,
    
  },
  editProfileButton: {
    backgroundColor: '#ef5350',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop:20,
    marginBottom:20,
    borderRadius: 5,
    width:'100%'
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign:'center'
  },
  logoutSection: {
    alignItems: 'center',
    marginBottom: 20,
    position:'absolute',
    bottom:0,
    left:0,
    right:0,
    justifyContent:'center'
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
   width:'80%'
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign:'center'
  },
  signinContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent:'center'
  },
  signinText: {
    color: '#000',
  },
  signinLink: {
    color: '#ef5350',
    marginLeft: 5,
  },
  historyItemContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  video: {
    marginTop: 20,
    width: '100%',
    aspectRatio: 16 / 9,
    height: undefined,
    backgroundColor: '#000', // Add background for better visual
  },
  videoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
});