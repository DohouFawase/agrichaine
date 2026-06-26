export type ProductStatus = 'available' | 'sold_out' | 'expired';

export type productType = {
    producer_id: string;
    name:string,
    quantity:number,
    unit:string,
    price_per_unit:number,
    location:string,
    status:ProductStatus
    stock_proof_photo_path: string | null;

}