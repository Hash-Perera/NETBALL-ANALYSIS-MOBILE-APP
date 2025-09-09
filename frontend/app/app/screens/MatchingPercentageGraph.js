import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASEURL, getUserId, getToken } from '../../constants';

export default function MatchingPercentageGraph({ navigation }) {
    const [ballHandlingData, setBallHandlingData] = useState([]);
    const [attackData, setAttackData] = useState([]);
    const [defenseData, setDefenseData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllMatchingData();
    }, []);

    const fetchAllMatchingData = async () => {
        setLoading(true);
        try {
            await fetchBallHandlingMatchingData();
            await fetchAttackMatchingData();
            await fetchDefenseMatchingData();
        } catch (error) {
            console.error("Error fetching matching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Ball Handling Data
    const fetchBallHandlingMatchingData = async () => {
        try {
            const userId = await getUserId();
            const token = await getToken();

            const response = await fetch(`${BASEURL}ballhandling/matching/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (response.ok) {
                const filteredData = data
                    .filter(item => item.ball_handling_matching_percentage !== undefined)
                    .map(item => ({
                        percentage: Number(item.ball_handling_matching_percentage.toFixed(2)),
                        date: new Date(item.createdAt).toLocaleDateString(),
                    }))
                    .reverse();

                setBallHandlingData(filteredData);
            }
        } catch (error) {
            console.error("Error fetching ball handling data:", error);
        }
    };

    // Fetch Attack Analysis Data
    const fetchAttackMatchingData = async () => {
        try {
            const userId = await getUserId();
            const token = await getToken();

            const response = await fetch(`${BASEURL}attackanalysis/matching/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (response.ok) {
                const filteredData = data
                    .filter(item => item.attack_analysis_matching_percentage?.overall !== undefined)
                    .map(item => ({
                        percentage: Number(item.attack_analysis_matching_percentage.overall.toFixed(2)),
                        date: new Date(item.createdAt).toLocaleDateString(),
                    }))
                    .reverse();

                setAttackData(filteredData);
            }
        } catch (error) {
            console.error("Error fetching attack data:", error);
        }
    };

    // Fetch Defense Analysis Data
    const fetchDefenseMatchingData = async () => {
        try {
            const userId = await getUserId();
            const token = await getToken();

            const response = await fetch(`${BASEURL}defenceanalysis/matching/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (response.ok) {
                const filteredData = data
                    .filter(item => item.defence_analysis_matching_percentage?.overall !== undefined)
                    .map(item => ({
                        percentage: Number(item.defence_analysis_matching_percentage.overall.toFixed(2)),
                        date: new Date(item.createdAt).toLocaleDateString(),
                    }))
                    .reverse();

                setDefenseData(filteredData);
            }
        } catch (error) {
            console.error("Error fetching defense data:", error);
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
                <Text style={styles.headerText}>Matching Percentage Graph</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#ef5350" />
                ) : (
                    <>
                        {/* Ball Handling Graph */}
                        {ballHandlingData.length > 0 && (
                            <View>
                                <Text style={styles.graphHeaderText}>Ball Handling Analysis</Text>
                                <LineChart
                                    data={{
                                        labels: ballHandlingData.map(item => item.date),
                                        datasets: [{ data: ballHandlingData.map(item => item.percentage) }],
                                    }}
                                    width={Dimensions.get("window").width - 20}
                                    height={250}
                                    yAxisSuffix="%"
                                    fromZero={true}
                                    withInnerLines={true}
                                    yAxisInterval={10}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}

                                />
                            </View>
                        )}

                        {/* Attack Analysis Graph */}
                        {attackData.length > 0 && (
                            <View>
                                <Text style={styles.graphHeaderText}>Attack Analysis</Text>
                                <LineChart
                                    data={{
                                        labels: attackData.map(item => item.date),
                                        datasets: [{ data: attackData.map(item => item.percentage) }],
                                    }}
                                    width={Dimensions.get("window").width - 20}
                                    height={250}
                                    yAxisSuffix="%"
                                    fromZero={true}
                                    withInnerLines={true}
                                    yAxisInterval={10}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                />
                            </View>
                        )}

                        {/* Defense Analysis Graph */}
                        {defenseData.length > 0 && (
                            <View>
                                <Text style={styles.graphHeaderText}>Defense Analysis</Text>
                                <LineChart
                                    data={{
                                        labels: defenseData.map(item => item.date),
                                        datasets: [{ data: defenseData.map(item => item.percentage) }],
                                    }}
                                    width={Dimensions.get("window").width - 20}
                                    height={250}
                                    yAxisSuffix="%"
                                    fromZero={true}
                                    withInnerLines={true}
                                    yAxisInterval={10}
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                />
                            </View>
                        )}

                        {/* Show a message if no data is available */}
                        {ballHandlingData.length === 0 &&
                            attackData.length === 0 &&
                            defenseData.length === 0 && (
                                <Text style={styles.noDataText}>No matching percentage data found.</Text>
                            )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const chartConfig = {
    backgroundGradientFrom: "#ff8a80",
    backgroundGradientTo: "#ff5252",
    decimalPlaces: 2, // Show up to 2 decimal places
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" },
    yAxisMin: 0, // Minimum Y-axis value
    yAxisMax: 100, // Maximum Y-axis value
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
    header: {
        width: '100%',
        backgroundColor: '#ef5350',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: { marginRight: 10, marginTop: 10 },
    headerText: { fontSize: 18, color: '#fff', fontWeight: '600', marginTop: 10 },
    graphHeaderText: { fontSize: 16, fontWeight: '600', marginLeft: 10, marginTop: 20 },
    chart: { marginVertical: 10, borderRadius: 10 },
    noDataText: { fontSize: 16, color: 'gray', marginTop: 20, textAlign: "center" },
});

