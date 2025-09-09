import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native';

export default function InjuryPreventionScreen({ navigation }) {
    // List of injury prevention videos
    const preventionVideos = [
        { id: '1', title: 'How to Avoid Common Injuries', link: 'https://youtu.be/nYcp0skx25A?si=CE5oGgvQzjooqzuw' },
        { id: '2', title: 'Best Stretches to Prevent Injury', link: 'https://youtu.be/NeY0aLu1Lwg?si=FwyZx-4doSVf4W30' },
        { id: '3', title: 'Workout Tips to Stay Injury-Free', link: 'https://youtu.be/Gn_DTxnXM-w?si=52xTgMeGrZKFyGi2' },
        { id: '4', title: 'Prevent Sports Injuries', link: 'https://youtu.be/6uYQV_grovQ?si=peYGdYRjUzHFiNpF' },
        { id: '5', title: 'Proper Running Form to Prevent Injury', link: 'https://youtu.be/QulY0l4JA_4?si=RGCCbuM1C6S_ppt6' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Injury Prevention Tips</Text>
            </View>

            <FlatList
                data={preventionVideos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.videoItem}
                        onPress={() => Linking.openURL(item.link)}
                    >
                        <Text style={styles.videoTitle}>{item.title}</Text>
                        <Ionicons name="play-circle-outline" size={24} color="#ef5350" />
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
            />
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
        paddingTop: 50,
    },
    backButton: {
        marginRight: 15,
    },
    headerText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
    },
    videoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

