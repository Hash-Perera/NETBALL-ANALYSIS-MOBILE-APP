import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions, ScrollView } from 'react-native';

export default function TopPlayerMainScreen({ navigation }) {
    const { width, height } = useWindowDimensions(); // Get screen size dynamically

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image
                source={require("../../assets/img/coach-main.jpg")}
                style={[styles.reactLogo, { height: height * 0.35 }]} // Adjust image height dynamically
                resizeMode="cover"
            />
            <View style={styles.mainButtonContainer}>
                <Text style={styles.title}>Select an Area to View</Text>
                <Text style={styles.subTitle}>Top Players :</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BallHandlingTopPlayers")}>
                        <Text style={styles.buttonText}>Ball Handling</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AttackAnalyzingTopPlayers")}>
                        <Text style={styles.buttonText}>Attack Handling</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("DefenceAnalyzingTopPlayers")}>
                        <Text style={styles.buttonText}>Defense Handling</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 30,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 5,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonText: {
        textAlign: 'center',
        fontWeight: '600',
        color: '#fff',
    },
    reactLogo: {
        width: '100%',
    },
    mainButtonContainer: {
        width: '90%',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#ef5350",
        paddingVertical: 20,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 10,
        shadowColor: "#d8e3e6",
        shadowOpacity: 0.5,
        elevation: 5,
        shadowRadius: 5,
        shadowOffset: { width: 1, height: 8 },
    },
});
