export type DriverStatus = "available" | "busy" | "offline";

export type DriverType = {
  user_id: string;
  latitude: number;
  longitude: number;
  status: DriverStatus;
};

export type DriverOnlineStatus = "offline" | "available" | "busy";

export type DriverStatusType = {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  status: DriverOnlineStatus;
  last_ping_at: string | null;
  created_at?: string;
  updated_at?: string;
};
