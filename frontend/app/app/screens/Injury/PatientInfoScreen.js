import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUserFullName } from '../../../constants';

export default function PatientInfoScreen({ navigation }) {
    const patentName = getUserFullName();
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Patient Info</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Patient ID / MRN</Text>
                    <Text style={styles.value}>09GA0000815097D602</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Patient Name</Text>
                    <Text style={styles.value}>{patentName}</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>DOB</Text>
                    <Text style={styles.value}>Jan 25, 2001</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Age</Text>
                    <Text style={styles.value}>21</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>ECN</Text>
                    <Text style={styles.value}>12340459083019238401</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Doctor Name</Text>
                    <Text style={styles.value}>Dr. Sagara Wikramasuuriya</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.label}>Date of First Entry</Text>
                    <Text style={styles.value}>Feb 5, 2025</Text>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.continueButton}>
                <Text style={styles.continueText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#ef5350',
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBlock: {
        marginBottom: 20,
    },
    label: {
        color: '#00BCD4', // Light blue
        fontSize: 13,
        marginBottom: 5,
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    continueButton: {
        backgroundColor: '#ef5350',
        paddingVertical: 15,
        margin: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
