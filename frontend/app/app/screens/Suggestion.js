import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity
} from 'react-native';
import * as AV from 'expo-av';
import { BASEURL, getToken } from '../../constants';

export default function Suggestion({ navigation }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ballhandling");

  const sampleVideos = {
    ballhandling: [
      { id: '1', ball_handling_matching_percentage: "55", suggestedVideo: "https://s3.com/high_skill_ball_video.mp4" },
      { id: '2', ball_handling_matching_percentage: "60", suggestedVideo: "https://s3.com/high_skill_ball_video.mp4" },
      { id: '3', ball_handling_matching_percentage: "65", suggestedVideo: "https://s3.com/high_skill_ball_video.mp4" },
      { id: '4', ball_handling_matching_percentage: "75", suggestedVideo: "https://s3.com/high_skill_ball_video.mp4" },
    ],
    attacking: [
      { id: '2', ball_handling_matching_percentage: "73", suggestedVideo: "https://s3.com/intermediate_attack_video.mp4" },
      { id: '3', ball_handling_matching_percentage: "73", suggestedVideo: "https://s3.com/intermediate_attack_video.mp4" },
      { id: '4', ball_handling_matching_percentage: "73", suggestedVideo: "https://s3.com/intermediate_attack_video.mp4" },
    ],
    defense: [
      { id: '3', ball_handling_matching_percentage: "55", suggestedVideo: "https://s3.com/beginner_attack_video.mp4" },
    ],
  };

  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
    setSuggestions(sampleVideos[category]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.suggestionItem}>
      <Text>Matching Percentage: {item.ball_handling_matching_percentage}</Text>

      {/* Video Component */}
      <AV.Video
        source={{ uri: item.suggestedVideo }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        isLooping
      />

      {/* Watch Video Button */}
      <TouchableOpacity
        style={styles.videoButton}
        onPress={() => {}}
      >
        <Text style={styles.buttonText}>Watch Video</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Suggestions for practicing</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, selectedCategory === "ballhandling" && styles.selectedButton]}
              onPress={() => handleCategorySelection("ballhandling")}
            >
              <Text style={[styles.buttonText, selectedCategory === "ballhandling" && styles.selectedButtonText]}>
                Ball Handling
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, selectedCategory === "attacking" && styles.selectedButton]}
              onPress={() => handleCategorySelection("attacking")}
            >
              <Text style={[styles.buttonText, selectedCategory === "attacking" && styles.selectedButtonText]}>
                Attacking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, selectedCategory === "defense" && styles.selectedButton]}
              onPress={() => handleCategorySelection("defense")}
            >
              <Text style={[styles.buttonText, selectedCategory === "defense" && styles.selectedButtonText]}>
                Defense
              </Text>
            </TouchableOpacity>
          </View>
        </>
      }
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingVertical: 20,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#ef5350',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  selectedButtonText: {
    color: '#fff',
  },
  suggestionItem: {
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  videoButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  video: {
    width: '100%',
    height: 200,
  },
});
