export type TransactionStatus = 'escrowed' | 'released_to_vendor' | 'refunded_to_buyer';

export type TransactionType = {
    id: string;                        
    order_id: string;                   
    payment_reference: string;          
    amount: number;                    
    status: TransactionStatus;          
    created_at?: string;               
    updated_at?: string;               
};