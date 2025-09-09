import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image, Button } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASEURL, getToken } from '../../constants';
import * as AV from "expo-av";

export default function PlayerHistoryPage({ navigation, route }) {
    const playerId = route.params.playerId;
    console.log("Selected Player ID: ", playerId);
    const videoRef = useRef(null);
    const [selectedCategory, setSelectedCategory] = useState("ballhandling");
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchVideos = async (category) => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            if (!token) {
                console.error('No token found');
                return;
            }
            const categoryMap = {
                ballhandling: 'ballhandling/videos/',
                attacking: 'attackanalysis/videos/',
                defense: 'defenceanalysis/videos/'
            };

            const res = await fetch(`${BASEURL}${categoryMap[category]}${playerId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setVideos([]);
                    setError("No records found");
                    return;
                }
                throw new Error(`HTTP error! Try again.`);
            }

            const data = await res.json();
            setVideos(data);
            console.log("response data=======",data)
        } catch (e) {
            console.error("Could not fetch videos:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos(selectedCategory);
    }, [selectedCategory]);

    return (
        <View style={styles.container}>
             <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerText}>Player History</Text>
                        </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, selectedCategory === "ballhandling" && styles.selectedButton]}
                    onPress={() => setSelectedCategory("ballhandling")}
                >
                    <Text style={[styles.buttonText, selectedCategory === "ballhandling" && styles.selectedButtonText]}>
                        Ball Handling
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, selectedCategory === "attacking" && styles.selectedButton]}
                    onPress={() => setSelectedCategory("attacking")}
                >
                    <Text style={[styles.buttonText, selectedCategory === "attacking" && styles.selectedButtonText]}>
                        Attacking
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, selectedCategory === "defense" && styles.selectedButton]}
                    onPress={() => setSelectedCategory("defense")}
                >
                    <Text style={[styles.buttonText, selectedCategory === "defense" && styles.selectedButtonText]}>
                        Defense
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#ef5350" />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.videoContainer}>
                            <Text style={styles.videoTitle}>Correct Video</Text>
                            <AV.Video
                                source={{ uri: item.ball_handling_correct_s3_link || item.attack_analysis_correct_s3_link || item.defence_analysis_correct_s3_link }}
                                style={styles.video}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                                shouldPlay
                                onFullscreenUpdate={true}
                            />
                            <Text style={styles.videoTitle}>Wrong Video</Text>
                            <AV.Video
                                source={{ uri: item.ball_handling_wrong_s3_link || item.attack_analysis_wrong_s3_link || item.defence_analysis_wrong_s3_link }}
                                style={styles.video}
                                useNativeControls
                                resizeMode="contain"
                                isLooping
                                shouldPlay
                                onFullscreenUpdate={true}
                            />
                            {item.ball_handling_analyzed_video_s3_link || item.attack_analysis_analyzed_video_s3_link || item.defence_analysis_analyzed_video_s3_link ? (
                                <>
                                    <Text style={styles.videoTitle}>Analyzed Video</Text>
                                    <AV.Video
                                        source={{ uri: item.ball_handling_analyzed_video_s3_link || item.attack_analysis_analyzed_video_s3_link || item.defence_analysis_analyzed_video_s3_link }}
                                        style={styles.video}
                                        useNativeControls
                                        resizeMode="contain"
                                        isLooping
                                        shouldPlay
                                        onFullscreenUpdate={true}
                                    />
                                </>
                            ) : null}
                            {/* <Text style={styles.videoTitle}>Performance Graph</Text>
                            <Image
                                source={{ uri: item.ball_handling_graph_s3_link || item.attack_graph || item.defense_graph }}
                                style={styles.graphImage}
                            /> */}
                            {item.ball_handling_matching_percentage || item.attack_analysis_matching_percentage || item.defence_analysis_matching_percentage ? (
                                <Text style={styles.matchingPercentage}>
                                    Matching Percentage: {Number(
                                        item.ball_handling_matching_percentage ||
                                        item.attack_analysis_matching_percentage?.overall ||
                                        item.defence_analysis_matching_percentage?.overall
                                    ).toFixed(2)}%
                                </Text>
                            ) : null}
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        width: '100%',
        backgroundColor: '#ef5350',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 10,
        marginTop:20
    },
    headerText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginTop:20
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginHorizontal: 10
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    selectedButton: {
        backgroundColor: '#ef5350',
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    selectedButtonText: {
        color: '#fff',
    },
    videoContainer: {
        margin: 15,
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
    },
    videoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
    },
    video: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    graphImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        marginTop: 10,
        borderRadius: 8,
    },
    matchingPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00796b',
        textAlign: 'center',
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});
