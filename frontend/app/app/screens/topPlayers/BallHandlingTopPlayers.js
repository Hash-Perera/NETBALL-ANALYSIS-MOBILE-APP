import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASEURL, getUserRole, getUserId, getToken } from '../../../constants';

export default function BallHandlingTopPlayers({ navigation }) {
  const [count, setCount] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!count || isNaN(count) || count <= 0) {
      alert('Please enter a valid number of players');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        console.error('No token found');
        return;
      }
      const res = await fetch(`${BASEURL}ballhandling/top-players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error response:', text);
        alert('Failed to fetch players');
        return;
      }

      const data = await res.json();
      console.log("top 3 response", data);
      setPlayers(data.topUsers); 
    } catch (error) {
      console.error('Error fetching players:', error);
      alert('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.playerButton}
      onPress={()=>{} }
      // onPress={() => navigation.navigate('HistoryPage', { playerId: item.ballHandlingData.userId._id })}
    >
      <View style={styles.playerContainer}>
        <Image
          source={require('../../../assets/img/profile.jpg')}
          style={styles.profileImage}
        />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {index + 1}. {item.userFullName}
          </Text>
          <Text style={styles.playerEmail}>{item.userEmail}</Text>
          <Text style={styles.playerPercentage}>
            Percentage: {item.ballHandlingData.ball_handling_matching_percentage.toFixed(2) || 'N/A'}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Ball Handling Top Players</Text>
      </View>
      <Text style={styles.title}>Enter Number of Top Players to View:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter count"
        placeholderTextColor="#8e8e93"
        onChangeText={(value) => setCount(value)}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={players.slice(0, 10)} // Show maximum of 10 players
          style={styles.flatListStyle}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#ef5350',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
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
  title: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    marginRight: 10,
    paddingHorizontal: 9,
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
    color: '#fff',
    fontSize: 14,
  },
  playerButton: {
    width: '100%',
    padding: 10,
    backgroundColor: '#dde3ed',
    marginVertical: 5,
    borderRadius: 5,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,  // Increased size for better visibility
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,  // Make it circular
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,  // Increased size for better readability
    fontWeight: '600',
  },
  playerEmail: {
    fontSize: 12,
    color: 'gray',
  },
  playerPercentage: {
    fontSize: 14,
    marginTop: 5,
  },
  flatListStyle: {
    marginTop: 30,
    width: '80%'
  },
  videoLinks: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    marginTop: 10,

  },
  videoLinkText: {
    color: '#007bff',
    fontSize: 12,
    margin:5,
    textAlign:'center'
  },
  playerInfo: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  }
});
