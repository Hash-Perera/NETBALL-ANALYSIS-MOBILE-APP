import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Alert,
    Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASEURL, getToken, getUserId } from '../../../constants';

export default function InjuryDetectionScreen({ navigation }) {
    const [image, setImage] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [treatmentLink, setTreatmentLink] = useState('');

    // Define treatment links for each injury type
    const treatmentLinks = {
        "abrasions": "https://youtu.be/biWDKkqpWro?feature=shared",
        "mild_bruises": "https://youtu.be/3CPSY5Z-lAM?si=zE3XtKrv-yCr-SUy",
        "severe_bruise": "https://youtu.be/4T5WwceiUS4?si=XXzA0AAfkG7cQ8WV",
        "Burn": "https://youtu.be/6uYQV_grovQ?si=peYGdYRjUzHFiNpF",
        "Bruise": "https://youtu.be/4T5WwceiUS4?si=XXzA0AAfkG7cQ8WV",
    };

    useEffect(() => {
        fetchInjuryRecords();
    }, []);

    const fetchInjuryRecords = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const userId = await getUserId();

            const response = await fetch(`${BASEURL}injury/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setRecords(data.records);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch injury records');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async (useCamera = false) => {
        let result;

        if (useCamera) {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
        }

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setDetectionResult(null);
        }
    };

    const uploadImage = async () => {
        if (!image) return;

        try {
            setUploading(true);
            const token = await getToken();
            const userId = await getUserId();

            const formData = new FormData();
            formData.append('injury_image', {
                uri: image,
                name: `injury_${Date.now()}.jpg`,
                type: 'image/jpeg'
            });

            const response = await fetch(`${BASEURL}injury/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                setDetectionResult(data.injuryData);
                fetchInjuryRecords(); // Refresh records list

                // Show modal with treatment link
                if (treatmentLinks[data.injuryData.injury_class]) {
                    setTreatmentLink(treatmentLinks[data.injuryData.injury_class]);
                    setModalVisible(true);
                }

                Alert.alert('Success', 'Injury analysis completed');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteRecord = async (recordId) => {
        try {
            const token = await getToken();
            const response = await fetch(`${BASEURL}injury/${recordId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setRecords(prev => prev.filter(record => record._id !== recordId));
                Alert.alert('Success', 'Record deleted successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete record');
        }
    };

    const renderRecordItem = ({ item }) => (
        <View style={styles.recordItemMain}>
            <View style={styles.recordItem}>
                <View style={styles.recordInfo}>
                    <Text style={styles.recordTitle}>{item.injury_class}</Text>
                    <Text>Probability: {(item.probability * 100).toFixed(1)}%</Text>


                    <Text style={styles.recordDate}>
                        {new Date(item.uploadedAt).toLocaleDateString()}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => deleteRecord(item._id)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef5350" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                onPress={() => Linking.openURL(treatmentLinks[item.injury_class])}
                style={styles.treatmentButton}
            >
                <Text style={styles.treatmentText}>Basic Treatment</Text>
            </TouchableOpacity>
            <Image
                source={{ uri: item.s3_link }}
                style={styles.graphImage}
            />
        </View>
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
                <Text style={styles.headerText}>Injury Detection</Text>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Basic Treatment Guide</Text>
                        <Text style={styles.modalText}>Here is a helpful video for treating this injury:</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => Linking.openURL(treatmentLink)}
                        >
                            <Text style={styles.buttonText}>Watch on YouTube</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <View style={styles.uploadSection}>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(false)}
                    disabled={uploading}
                >
                    <Ionicons name="image-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Choose Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(true)}
                    disabled={uploading}
                >
                    <Ionicons name="camera-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>

                {image && (
                    <>
                        <Image
                            source={{ uri: image }}
                            style={styles.imagePreview}
                        />
                        <TouchableOpacity
                            style={styles.analyzeButton}
                            onPress={uploadImage}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Analyze Injury</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('InjuryPreventionScreen')}
                        style={[styles.preventionButton, { flex: 1 }]}
                    >
                        <Text style={styles.preventionText}>Injury Prevention Tips</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('PatientInfoScreen')}
                        style={[styles.preventionButton, { flex: 1 }]}
                    >
                        <Text style={styles.preventionText}>Patient Record</Text>
                    </TouchableOpacity>
                </View>


                {detectionResult && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>
                            Detection Result: {detectionResult.injury_class}
                        </Text>
                        <Text style={styles.resultText}>
                            Confidence: {(detectionResult.probability * 100).toFixed(1)}%
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.recordsSection}>
                <Text style={styles.sectionTitle}>Previous Scans</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#ef5350" />
                ) : (
                    <FlatList
                        data={records}
                        renderItem={renderRecordItem}
                        keyExtractor={item => item._id}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No injury records found</Text>
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
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
        paddingTop: 30,
    },
    backButton: {
        marginRight: 15,
    },
    headerText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    uploadSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    uploadButton: {
        flexDirection: 'row',
        backgroundColor: '#ef5350',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        marginLeft: 10,
        fontWeight: '500',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginVertical: 15,
    },
    analyzeButton: {
        backgroundColor: '#2e7d32',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    resultContainer: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    resultText: {
        fontSize: 16,
        marginVertical: 5,
    },
    recordsSection: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    recordItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    recordItemMain: {
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    recordInfo: {
        flex: 1,
    },
    recordTitle: {
        fontWeight: '600',
        fontSize: 16,
    },
    recordDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    deleteButton: {
        padding: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    graphImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: '#ef5350',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        width: '80%',
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#666',
        padding: 10,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    treatmentButton: {
        // width:'90%',
        backgroundColor: '#ef5350',
        paddingVertical: 5,
        paddingHorizontal: 75,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -10, 
        marginBottom: 10
    },
    treatmentText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    preventionButton: {
        backgroundColor: '#536983',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    preventionText: {
        textAlign: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
