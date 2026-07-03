import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Définir Pusher sur global AVANT tout
if (typeof global !== 'undefined') {
  (global as any).window = global;
  (global as any).Pusher = Pusher;
}

class EchoManager {
  private static instance: EchoManager;
  private echo: Echo | null = null;
  private initPromise: Promise<Echo> | null = null;

  private constructor() {}

  static getInstance(): EchoManager {
    if (!EchoManager.instance) {
      EchoManager.instance = new EchoManager();
    }
    return EchoManager.instance;
  }

  async initialize(): Promise<Echo> {
    if (this.echo) {
      return this.echo;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<Echo> {
    const token = await AsyncStorage.getItem("token");

    // ✅ Créer l'instance Pusher manuellement pour avoir accès aux événements
    const pusherClient = new Pusher("jfxief11ebsovzh75wmi", {
      wsHost: "192.168.0.104",
      wsPort: 8080,
      forceTLS: false,
      enabledTransports: ["ws"],
      cluster: "", // ✅ Reverb n'utilise pas de cluster, mais Pusher en attend un
    });

    // ✅ Logs de connexion Pusher
    pusherClient.connection.bind('connecting', () => {
      console.log('🟡 Pusher: Connexion en cours...');
    });

    pusherClient.connection.bind('connected', () => {
      console.log('🟢 Pusher: Connecté ! Socket ID:', pusherClient.connection.socket_id);
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('🔴 Pusher: Déconnecté');
    });

    pusherClient.connection.bind('error', (err: any) => {
      console.error('🔴 Pusher: Erreur de connexion:', err);
    });

    this.echo = new Echo({
      broadcaster: "pusher",
      client: pusherClient, // ✅ Passer l'instance Pusher manuellement
      key: "jfxief11ebsovzh75wmi",
      wsHost: "192.168.0.104",
      wsPort: 8080,
      forceTLS: false,
      enabledTransports: ["ws"],
      authEndpoint: `${process.env.EXPO_PUBLIC_API_URL}/broadcasting/auth`,
      
      authorizer: (channel: any) => ({
        authorize: async (socketId: string, callback: (error: any, data: any) => void) => {
          try {
            const currentToken = await AsyncStorage.getItem("token");

            if (!currentToken) {
              callback(new Error("Token non trouvé"), null);
              return;
            }

            const response = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/broadcasting/auth`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              callback(new Error(data.message || "Échec d'authentification"), null);
              return;
            }

            callback(null, data);
          } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)), null);
          }
        },
      }),
    });

    return this.echo;
  }

  // ✅ Auto-initialize si pas encore fait
  async channel(name: string): Promise<any> {
    try {
      const echo = await this.initialize();
      const channel = echo.channel(name);
      console.log(`📡 Canal "${name}" souscrit`);
      return channel;
    } catch (error) {
      console.error(`❌ Erreur souscription canal "${name}":`, error);
      throw error;
    }
  }

  // ✅ Auto-initialize si pas encore fait
  async private(name: string): Promise<any> {
    try {
      const echo = await this.initialize();
      const channel = echo.private(name);
      console.log(`🔒 Canal privé "${name}" souscrit`);
      return channel;
    } catch (error) {
      console.error(`❌ Erreur souscription canal privé "${name}":`, error);
      throw error;
    }
  }

  leaveChannel(name: string): void {
    if (this.echo) {
      this.echo.leaveChannel(name);
      console.log(`👋 Canal "${name}" quitté`);
    }
  }

  leave(name?: string): void {
    if (this.echo) {
      this.echo.leave(name);
    }
  }

  getEcho(): Echo | null {
    return this.echo;
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
      this.initPromise = null;
      console.log('🔌 Echo déconnecté');
    }
  }
}

const echoManager = EchoManager.getInstance();
export default echoManager;