import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuration globale pour contourner les contraintes de types du navigateur
(global as any).window = global;
(global as any).window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: "onabaya_key",
  wsHost: "192.168.0.104:8081", // L'IP locale de ton ordinateur
  wsPort: 8080,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
  
  // 🔒 Configuration de l'authentification des canaux privés par l'API
  authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}/broadcasting/auth`,
  requestRequester: async (context: any, channel: any) => {
    return {
      authorize: async (socketId: string, callback: Function) => {
        try {
          // On récupère le token exactement comme dans ton interceptor Axios
          const token = await AsyncStorage.getItem("token");
          
          // Requête manuelle d'autorisation sur l'API Laravel
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/broadcasting/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });
          
          const data = await response.json();
          callback(null, data);
        } catch (error) {
          callback(error, null);
        }
      },
    };
  },
});

export default echo;