import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  BASEURL,
  getUserRole,
  getUserId,
  getToken,
  getUserFullName,
} from "../../constants";
import ChatBotButton from "../chatbot/chatbot-button";

export default function Home({ navigation }) {
  const { width, height } = useWindowDimensions(); // Dynamically get screen size

  const videoRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const [players, setPlayers] = useState([]);
  const [coachId, setCoachId] = useState(null);
  const [userName, setUserName] = useState(null);

  console.log("User Role:", userRole);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);

        const id = await getUserId();
        setCoachId(id);
        console.log("Fetched Coach ID:", id);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await getUserFullName();
        setUserName(name);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!coachId) return;
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(BASEURL + "users/players", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("Fetched Players List:", data);

        if (Array.isArray(data)) {
          setPlayers(data);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    if (userRole === "Coach" && coachId) {
      fetchPlayers();
    }
  }, [userRole, coachId]);

  if (!userRole) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <>
      {userRole === "Player" ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image
            source={require("../../assets/img/coach-main.jpg")}
            style={[styles.reactLogo, { height: height * 0.35 }]}
            resizeMode="cover"
          />
          <View style={styles.mainButtonContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>👋 Hi! {userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.selectionButtonGraph}
              onPress={() => navigation.navigate("MatchingPercentageGraph")}
            >
              <Text style={styles.buttonText}>Matching Percentage Graph</Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => navigation.navigate("BallHandlingUploadScreen")}
              >
                <Text style={styles.buttonText}>Ball Handling</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() =>
                  navigation.navigate("AttackHandlingUploadScreen")
                }
              >
                <Text style={styles.buttonText}>Attacking</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() =>
                  navigation.navigate("DefenseHandlingUploadScreen")
                }
              >
                <Text style={styles.buttonText}>Defense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => navigation.navigate("InjuryDetectionScreen")}
              >
                <Text style={styles.buttonText}>Injury Identify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={players.slice(0, 20)}
          keyExtractor={(item) => item._id.toString()}
          ListHeaderComponent={
            <>
              <Image
                source={require("../../assets/img/coach-main.jpg")}
                style={[styles.reactLogo, { height: height * 0.35 }]}
                resizeMode="cover"
              />
              <View style={styles.mainButtonContainer}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>👋 Hi! {userName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.topFindButton}
                  onPress={() => navigation.navigate("TopPlayerMainScreen")}
                >
                  <Text style={styles.topFindButtonText}>Find Top Players</Text>
                </TouchableOpacity>
                <Text style={styles.coachText}>
                  Players under your coaching:
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.coachMain}>
              <TouchableOpacity
                style={styles.playerButton}
                onPress={() =>
                  navigation.navigate("PlayerHistoryPage", {
                    playerId: item._id,
                  })
                }
              >
                <View style={styles.playerContainer}>
                  <Image
                    source={require("../../assets/img/profile.jpg")}
                    style={styles.profileImage}
                  />
                  <Text style={styles.playerName}>{item.fullName}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No players found under your coaching.
            </Text>
          }
        />
      )}

      <ChatBotButton />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 30,
  },
  titleContainer: {
    width: "90%", // Ensures proper alignment within the container
    alignSelf: "flex-start", // Aligns the text to the left
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
    textAlign: "left", // Ensures text is always left-aligned
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  reactLogo: {
    width: "100%",
  },
  mainButtonContainer: {
    width: "90%",
    alignItems: "center",
    margin: 20,
  },
  selectionButton: {
    backgroundColor: "#ef5350",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%", // Ensures proper spacing
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  selectionButtonGraph: {
    backgroundColor: "#3c3b53",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "90%",
    flexWrap: "wrap", // Ensures proper wrapping on smaller screens
  },
  coachMain: {
    marginHorizontal: 20,
  },
  topFindButton: {
    backgroundColor: "#ef5350",
    paddingVertical: 15,
    borderRadius: 5,
    width: "100%",
    marginBottom: 20,
  },
  topFindButtonText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#FFFF",
  },
  coachText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  playerButton: {
    padding: 10,
    backgroundColor: "#dde3ed",
    marginVertical: 5,
    borderRadius: 5,
    width: "100%",
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  playerList: {
    width: "100%",
  },
});
