export type UserRole = 'producer' | 'transporter' | 'buyer';
export type UserStatus = 'pending' | 'active' | 'suspended';

export  type UserType = {
    name:string,
    last_name:string,
    phone:number,
    email:string,
    role:UserRole,
    status:UserStatus,
    identity_document_path: string | null;  
    id_verified_at: string | null;         
    average_rating: number;
}