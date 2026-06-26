export type UserRatingType = {
    id: string;                        
    order_id: string;                   
    from_user_id: string;               
    to_user_id: string;                 
    rating: number;                     
    comment: string | null;             
    created_at?: string;
    updated_at?: string;
};