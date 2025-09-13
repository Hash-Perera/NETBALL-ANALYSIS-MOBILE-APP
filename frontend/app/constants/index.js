import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASEURL = "http://192.168.8.132:6000/api/";
const setToken = async (token) => {
  try {
    await AsyncStorage.setItem("token", token);
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("token");
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

const getUserId = async () => {
  try {
    const id = await AsyncStorage.getItem("userId");
    return id;
  } catch (error) {
    console.error("Error fetching user Id:", error);
  }
};

const getUserFullName = async () => {
  try {
    const fullName = await AsyncStorage.getItem("userFullName");
    return fullName;
  } catch (error) {
    console.error("Error fetching user Id:", error);
  }
};

const getUserEmail = async () => {
  try {
    const email = await AsyncStorage.getItem("userEmail");
    return email;
  } catch (error) {
    console.error("Error fetching user Id:", error);
  }
};

const getUserRole = async () => {
  try {
    const role = await AsyncStorage.getItem("userRole");
    return role;
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
};

export {
  setToken,
  getToken,
  removeToken,
  getUserRole,
  getUserId,
  getUserFullName,
  getUserEmail,
};
