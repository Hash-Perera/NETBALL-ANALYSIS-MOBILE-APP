import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button
} from 'react-native';
import * as AV from "expo-av";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASEURL, getToken } from '../../../constants';

export default function AttackAnalyzeScreen({ navigation, route }) {
  const videoRef = useRef(null);

  const handleId = route.params.AttackAnalysisId;
  console.log("attack Id=====", handleId);
  const [attackAnalysisId, setAttackHandlingId] = useState(handleId);
  const [analyzedVideoUrl, setAnalyzedVideoUrl] = useState(null);
  const [matchingPercentage, setMatchingPercentage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState({ isPlaying: false, isLoading: true });
  const [showVideoLoader, setShowVideoLoader] = useState(false);
  console.log("analyzed video link============", analyzedVideoUrl);

  useEffect(() => {
    const loadId = async () => {
      const id = await AsyncStorage.getItem('AttackAnalysisId');
      setAttackHandlingId(id);
    };
    loadId();
  }, []);

  // Add video playback control
  const handlePlaybackStatusUpdate = (status) => {
    setVideoStatus({
      isLoading: !status.isLoaded,
      isPlaying: status.isPlaying
    });
  };

  // Add this effect for video initialization
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalyzedVideoUrl(null);
    setMatchingPercentage(null);

    try {
      if (!attackAnalysisId) {
        Alert.alert('Error', 'No video ID found. Please upload videos first.');
        return;
      }

      const token = await getToken();
      const response = await fetch(`${BASEURL}attackanalysis/analyze/${attackAnalysisId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Analysis response:", data);

      if (response.ok) {
        setAnalyzedVideoUrl(data.attack_analysis_analyzed_video_s3_link);
        // Extract Matching Percentage Data
        // Extract and round up Matching Percentage Data
        const matchingData = data.attack_analysis_matching_percentage || {};
        setMatchingPercentage({
          overall: matchingData.overall ? (Math.ceil(matchingData.overall * 100) / 100).toFixed(2) : "N/A",
          shoulder: matchingData.shoulder ? (Math.ceil(matchingData.shoulder * 100) / 100).toFixed(2) : "N/A",
          leftElbow: matchingData.left_elbow ? (Math.ceil(matchingData.left_elbow * 100) / 100).toFixed(2) : "N/A",
          rightElbow: matchingData.right_elbow ? (Math.ceil(matchingData.right_elbow * 100) / 100).toFixed(2) : "N/A",
        });
        setShowVideoLoader(true);
        Alert.alert('Video Analysis Complete', 'Analysis is complete.');
      } else {
        Alert.alert('Error', data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
      setShowVideoLoader(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Attack Analyze</Text>
      </View>
      <View style={styles.content}>
        <Button
          title="Analyze Video"
          onPress={handleAnalyze}
          color="#39c668"
          disabled={isLoading}
        />
 {matchingPercentage && (
    <>
        <Text style={styles.percentage}>Overall Matching Percentage: {matchingPercentage?.overall}%</Text>
        <Text style={styles.percentage}>Shoulder: {matchingPercentage?.shoulder}%</Text>
        <Text style={styles.percentage}>Left Elbow: {matchingPercentage?.leftElbow}%</Text>
        <Text style={styles.percentage}>Right Elbow: {matchingPercentage?.rightElbow}%</Text>
        </>
 )}
        {showVideoLoader && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loaderText}>Loading video...</Text>
          </View>
        )}
        {!isLoading && analyzedVideoUrl && (
          <AV.Video
            source={{ uri: analyzedVideoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            isLooping
            shouldPlay
            onLoadStart={() => console.log("📡 Loading video...")}
            onLoad={() => {
              console.log("✅ Video loaded successfully!");
              if (videoRef.current) {
                videoRef.current.presentFullscreenPlayer(); // Always open in fullscreen
              }
            }}
            onBuffer={(isBuffering) => console.log("⏳ Buffering:", isBuffering)}

          />
        )}
        {isLoading && (
          <View style={styles.analyzeLoaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.analyzeLoaderText}>Analyzing video...</Text>
          </View>
        )}
      </View>
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
    marginTop: 20,
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    marginTop: 20
  },
  content: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  video: {
    marginTop: 20,
    width: '100%',
    aspectRatio: 16 / 9,
    height: undefined,
    backgroundColor: '#000', // Add background for better visual
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
  percentage: {
    marginTop: 10,
    fontSize: 14,
    color: '#000',
  },
  analyzeLoaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  analyzeLoaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000',
  },
});
